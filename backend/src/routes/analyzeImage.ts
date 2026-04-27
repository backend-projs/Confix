import { Router, Request, Response } from 'express';
import multer from 'multer';
import exifr from 'exifr';

export const analyzeImageRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const SYSTEM_PROMPT = `### SYSTEM DIRECTIVE
You are the Lead Infrastructure Forensic AI. Your operational mandate is to perform highly accurate, multimodal analysis of field inspection imagery. You must operate with the precision of a senior structural engineer and a geospatial intelligence analyst.

### INPUT CONTEXT
You will be provided with an image taken by a field engineer. This image may be taken in challenging environments (e.g., deep underground metros, rural roads) where GPS data might be missing.

### ANALYTICAL PROTOCOL (Think Step-by-Step)
Perform the following analysis silently before outputting your response:
1. Asset Classification: What is the primary infrastructure element in frame?
2. Defect Diagnostics: Is there anomalous wear, structural failure, or degradation? Classify severity objectively.
3. Geospatial & OCR Extraction [CRITICAL]: Scan the entire background. Read every visible letter, number, or barcode. Look for environmental markers.

### CONSTRAINT
Output your final analysis strictly as a raw JSON object. Do not wrap the JSON in markdown code blocks. Do not include any conversational filler.

### OUTPUT SCHEMA
{
  "metadata": {
    "confidence_score": <float between 0.0 and 1.0>,
    "environment": "<Indoor | Outdoor | Underground/Metro>"
  },
  "asset": {
    "category": "<string>",
    "identified_id": "<string or null>"
  },
  "diagnostics": {
    "is_defective": <boolean>,
    "defect_type": "<string or null>",
    "severity": "<Low | Medium | High | Critical>",
    "technical_description": "<1-2 sentences>"
  },
  "spatial_context": {
    "extracted_text": ["<array of OCR strings>"],
    "visual_location_markers": "<Description of surroundings>"
  }
}`;

/* ── Helpers ── */

interface ExifMeta {
  latitude: number | null;
  longitude: number | null;
  date_taken: string | null;
  location_source: 'exif' | 'none';
}

async function extractExifMetadata(buffer: Buffer): Promise<ExifMeta> {
  try {
    const parsed = await exifr.parse(buffer, {
      gps: true,
      pick: ['latitude', 'longitude', 'DateTimeOriginal'],
    });
    if (parsed) {
      return {
        latitude: parsed.latitude ?? null,
        longitude: parsed.longitude ?? null,
        date_taken: parsed.DateTimeOriginal
          ? new Date(parsed.DateTimeOriginal).toISOString()
          : null,
        location_source: parsed.latitude && parsed.longitude ? 'exif' : 'none',
      };
    }
  } catch (err: any) {
    console.warn('EXIF parse failed (graceful):', err.message);
  }
  return { latitude: null, longitude: null, date_taken: null, location_source: 'none' };
}

function bufferToBase64(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

async function callGroqVision(imageDataUrl: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not configured');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageDataUrl } },
            { type: 'text', text: 'Analyze this infrastructure inspection image.' },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq Vision API error ${res.status}: ${err}`);
  }
  const data: any = await res.json();
  return data.choices[0].message.content;
}

const OPENROUTER_MODELS = [
  'google/gemini-2.5-flash',
  'google/gemini-2.0-flash-001',
  'google/gemini-2.0-flash-exp:free',
];

async function callOpenRouterVision(imageDataUrl: string): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY not configured');

  for (const model of OPENROUTER_MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: imageDataUrl } },
                { type: 'text', text: 'Analyze this infrastructure inspection image.' },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 1024,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.warn(`OpenRouter model ${model} failed (${res.status}): ${err.slice(0, 200)}`);
        continue;
      }
      const data: any = await res.json();
      return data.choices[0].message.content;
    } catch (e: any) {
      console.warn(`OpenRouter model ${model} threw:`, e.message);
    }
  }
  throw new Error('All OpenRouter vision models failed');
}

function parseAnalysisResponse(raw: string): Record<string, any> {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
  return JSON.parse(jsonStr);
}

/* ── Route ── */

analyzeImageRouter.post('/', upload.single('image'), async (req: Request, res: Response) => {
  const file = (req as any).file;

  if (!file || !file.buffer || file.buffer.length === 0) {
    return res.status(400).json({ error: 'image file is required (field name: "image")' });
  }

  // Step 1: Extract EXIF metadata (GPS + date)
  const exifMeta = await extractExifMetadata(file.buffer);

  // Step 2: Convert image to base64 for AI
  const mime = file.mimetype || 'image/jpeg';
  const imageDataUrl = bufferToBase64(file.buffer, mime);

  // Step 3: Call vision AI — Groq primary, OpenRouter fallback
  let rawContent: string | null = null;
  let provider = '';

  try {
    rawContent = await callGroqVision(imageDataUrl);
    provider = 'groq';
  } catch (groqErr: any) {
    console.warn('Groq Vision failed, trying OpenRouter:', groqErr.message);
  }

  if (!rawContent) {
    try {
      rawContent = await callOpenRouterVision(imageDataUrl);
      provider = 'openrouter';
    } catch (orErr: any) {
      console.error('All vision providers failed:', orErr.message);
      return res.status(502).json({ error: 'All vision AI providers failed', details: orErr.message });
    }
  }

  // Step 4: Parse AI response and combine with EXIF metadata
  try {
    const analysis = parseAnalysisResponse(rawContent!);
    return res.json({
      ...analysis,
      exif: exifMeta,
      _provider: provider,
    });
  } catch (parseErr: any) {
    console.error('Failed to parse vision AI response:', parseErr.message);
    return res.status(422).json({
      error: 'Failed to parse AI response as JSON',
      raw_response: rawContent,
    });
  }
});
