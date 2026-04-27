"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const reports_1 = require("./routes/reports");
const assistant_1 = require("./routes/assistant");
const stats_1 = require("./routes/stats");
const voiceReport_1 = require("./routes/voiceReport");
const analyzeImage_1 = require("./routes/analyzeImage");
const auth_1 = require("./routes/auth");
const users_1 = require("./routes/users");
const companies_1 = require("./routes/companies");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        const allowed = [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://localhost:3000',
            'https://hakathon-alpha.vercel.app',
            'https://confix-ten.vercel.app',
        ];
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin)
            return callback(null, true);
        // Allow any Vercel preview URL
        if (origin.endsWith('.vercel.app') || allowed.includes(origin)) {
            return callback(null, true);
        }
        callback(null, false);
    },
    credentials: true,
}));
app.use(express_1.default.json());
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
app.use('/api/reports', reports_1.reportsRouter);
app.use('/api/assistant', assistant_1.assistantRouter);
app.use('/api/stats', stats_1.statsRouter);
app.use('/api/voice-report', voiceReport_1.voiceReportRouter);
app.use('/api/analyze-image', analyzeImage_1.analyzeImageRouter);
app.use('/api/auth', auth_1.authRouter);
app.use('/api/users', users_1.usersRouter);
app.use('/api/companies', companies_1.companiesRouter);
// Global error handling middleware
app.use((err, _req, res, _next) => {
    console.error(`[ERROR] ${err.message}`);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
});
app.listen(PORT, () => {
    console.log(`Confix backend running on port ${PORT}`);
});
