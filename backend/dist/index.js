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
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
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
app.listen(PORT, () => {
    console.log(`Confix backend running on http://localhost:${PORT}`);
});
