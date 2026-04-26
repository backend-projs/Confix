import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { reportsRouter } from './routes/reports';
import { assistantRouter } from './routes/assistant';
import { statsRouter } from './routes/stats';
import { voiceReportRouter } from './routes/voiceReport';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/reports', reportsRouter);
app.use('/api/assistant', assistantRouter);
app.use('/api/stats', statsRouter);
app.use('/api/voice-report', voiceReportRouter);

app.listen(PORT, () => {
  console.log(`Confix backend running on http://localhost:${PORT}`);
});
