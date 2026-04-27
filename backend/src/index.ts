import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { reportsRouter } from './routes/reports';
import { assistantRouter } from './routes/assistant';
import { statsRouter } from './routes/stats';
import { voiceReportRouter } from './routes/voiceReport';
import { analyzeImageRouter } from './routes/analyzeImage';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { companiesRouter } from './routes/companies';
import { notificationsRouter } from './routes/notifications';
import { threadsRouter } from './routes/threads';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'https://hakathon-alpha.vercel.app',
      'https://confix-ten.vercel.app',
    ];
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow any Vercel preview URL
    if (origin.endsWith('.vercel.app') || allowed.includes(origin)) {
      return callback(null, true);
    }
    callback(null, false);
  },
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

// Ping (for cronjob keep-alive on free-tier hosts)
const pingHandler = (_req: any, res: any) => {
  res.json({
    status: 'pong',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round(process.uptime()),
  });
};
app.get('/ping', pingHandler);
app.get('/api/ping', pingHandler);
app.head('/ping', (_req, res) => res.status(200).end());
app.head('/api/ping', (_req, res) => res.status(200).end());

// Swagger API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/reports', reportsRouter);
app.use('/api/assistant', assistantRouter);
app.use('/api/stats', statsRouter);
app.use('/api/voice-report', voiceReportRouter);
app.use('/api/analyze-image', analyzeImageRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/threads', threadsRouter);

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
