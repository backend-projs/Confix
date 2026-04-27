"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceReportRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const buffer_1 = require("buffer");
exports.voiceReportRouter = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const LANG_NAMES = {
    'en-US': 'English',
    'ru-RU': 'Russian',
    'az-AZ': 'Azerbaijani',
};
// ISO 639-1 codes for Whisper
const WHISPER_LANG_CODES = {
    'en-US': 'en',
    'ru-RU': 'ru',
    'az-AZ': 'az',
};
async function callWhisper(audioBuffer, lang, mimeType) {
    const key = process.env.GROQ_API_KEY;
    if (!key)
        throw new Error('GROQ_API_KEY not configured');
    const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';
    const blob = new buffer_1.Blob([audioBuffer], { type: mimeType });
    const formData = new FormData();
    formData.append('file', blob, `audio.${ext}`);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'json');
    const whisperLang = WHISPER_LANG_CODES[lang] || 'en';
    formData.append('language', whisperLang);
    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${key}`,
        },
        body: formData,
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Groq Whisper API error ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.text || '';
}
function buildSystemPrompt(lang) {
    const langName = LANG_NAMES[lang] || 'English';
    return `You are a helpful assistant that processes voice-to-text transcriptions for infrastructure problem reports.
The user is speaking in ${langName}. The input you receive is a raw speech-to-text transcription which may contain misheard words, incorrect phrases, or garbled text caused by speech recognition errors.

Your task has TWO steps:
1. CORRECT THE TRANSCRIPT: Carefully read the raw transcription and use contextual understanding to fix any misheard or incorrectly transcribed words. Reconstruct what the user most likely actually said. The domain is infrastructure, construction, maintenance, safety, and field engineering.
2. EXTRACT REPORT FIELDS from the corrected text:
   - problem_type: (short category, e.g. 'Bug', 'UI Issue', 'Performance', 'Infrastructure', 'Safety Hazard', 'Feature Request', 'Other')
   - problem: (concise one-sentence summary of the issue)
   - description: (full detailed explanation based on corrected transcript)
   - corrected_transcript: (the cleaned-up, corrected version of what the user said)

All values must be written in ${langName}.
Return ONLY a valid JSON object with these four keys. Do not add extra text.`;
}
async function callGroq(transcript, prompt) {
    const key = process.env.GROQ_API_KEY;
    if (!key)
        throw new Error('GROQ_API_KEY not configured');
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: transcript },
            ],
            temperature: 0.2,
            max_tokens: 512,
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Groq API error ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.choices[0].message.content;
}
async function callOpenRouter(transcript, prompt) {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key)
        throw new Error('OPENROUTER_API_KEY not configured');
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        },
        body: JSON.stringify({
            model: 'meta-llama/llama-3.3-70b-instruct',
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: transcript },
            ],
            temperature: 0.2,
            max_tokens: 512,
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenRouter API error ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.choices[0].message.content;
}
function parseAIResponse(raw) {
    // Try to extract JSON from the response, handling markdown code blocks
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
    const parsed = JSON.parse(jsonStr);
    return {
        problem_type: parsed.problem_type || 'Other',
        problem: parsed.problem || '',
        description: parsed.description || '',
        corrected_transcript: parsed.corrected_transcript || '',
    };
}
// New endpoint: audio upload → Whisper transcription → Llama parse
exports.voiceReportRouter.post('/transcribe-and-parse', upload.single('audio'), async (req, res) => {
    const lang = req.body.lang || 'en-US';
    const file = req.file;
    if (!file || !file.buffer || file.buffer.length === 0) {
        return res.status(400).json({ error: 'audio file is required' });
    }
    // Step 1: Transcribe with Whisper
    let whisperTranscript;
    try {
        whisperTranscript = await callWhisper(file.buffer, lang, file.mimetype || 'audio/webm');
        console.log(`Whisper transcript (${lang}):`, whisperTranscript);
    }
    catch (whisperErr) {
        console.error('Whisper transcription failed:', whisperErr.message);
        return res.status(502).json({ error: 'Whisper transcription failed: ' + whisperErr.message });
    }
    if (!whisperTranscript.trim()) {
        return res.status(422).json({ error: 'No speech detected in audio' });
    }
    // Step 2: Parse with Llama (correct + extract fields)
    const systemPrompt = buildSystemPrompt(lang);
    let rawContent = null;
    let provider = '';
    try {
        rawContent = await callGroq(whisperTranscript.trim(), systemPrompt);
        provider = 'groq';
    }
    catch (groqErr) {
        console.warn('Groq LLM failed, falling back to OpenRouter:', groqErr.message);
    }
    if (!rawContent) {
        try {
            rawContent = await callOpenRouter(whisperTranscript.trim(), systemPrompt);
            provider = 'openrouter';
        }
        catch (orErr) {
            console.error('OpenRouter also failed:', orErr.message);
            return res.status(502).json({
                error: 'AI parse failed after transcription',
                raw_transcript: whisperTranscript,
            });
        }
    }
    try {
        const parsed = parseAIResponse(rawContent);
        return res.json({ ...parsed, raw_transcript: whisperTranscript, provider });
    }
    catch (parseErr) {
        console.error('Failed to parse AI response:', parseErr.message);
        return res.status(422).json({
            error: 'Failed to parse AI response',
            raw_response: rawContent,
            raw_transcript: whisperTranscript,
        });
    }
});
// Legacy text-based parse endpoint (kept for manual text input)
exports.voiceReportRouter.post('/parse', async (req, res) => {
    const { transcript, lang } = req.body;
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
        return res.status(400).json({ error: 'transcript is required' });
    }
    let rawContent = null;
    let provider = '';
    const systemPrompt = buildSystemPrompt(lang || 'en-US');
    // Try Groq first
    try {
        rawContent = await callGroq(transcript.trim(), systemPrompt);
        provider = 'groq';
    }
    catch (groqErr) {
        console.warn('Groq failed, falling back to OpenRouter:', groqErr.message);
    }
    // Fallback to OpenRouter
    if (!rawContent) {
        try {
            rawContent = await callOpenRouter(transcript.trim(), systemPrompt);
            provider = 'openrouter';
        }
        catch (orErr) {
            console.error('OpenRouter also failed:', orErr.message);
            return res.status(502).json({
                error: 'Both AI providers failed',
                raw_transcript: transcript,
            });
        }
    }
    // Parse the AI response
    try {
        const parsed = parseAIResponse(rawContent);
        return res.json({ ...parsed, provider });
    }
    catch (parseErr) {
        console.error('Failed to parse AI response:', parseErr.message);
        return res.status(422).json({
            error: 'Failed to parse AI response',
            raw_response: rawContent,
            raw_transcript: transcript,
        });
    }
});
