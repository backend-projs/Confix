import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { reportsRouter } from './routes/reports';
import { assistantRouter } from './routes/assistant';
import { statsRouter } from './routes/stats';
import { voiceReportRouter } from './routes/voiceReport';
import { analyzeImageRouter } from './routes/analyzeImage';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/reports', reportsRouter);
app.use('/api/assistant', assistantRouter);
app.use('/api/stats', statsRouter);
app.use('/api/voice-report', voiceReportRouter);
app.use('/api/analyze-image', analyzeImageRouter);

// Global error handling middleware
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Confix backend running on port ${PORT}`);
});
