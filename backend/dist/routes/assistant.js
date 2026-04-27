"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assistantRouter = void 0;
const express_1 = require("express");
const utils_1 = require("../utils");
exports.assistantRouter = (0, express_1.Router)();
exports.assistantRouter.post('/', (req, res) => {
    const { assetType, description, imageName } = req.body;
    if (!assetType || !description) {
        return res.status(400).json({ error: 'assetType and description are required' });
    }
    const suggestions = (0, utils_1.mockAssistant)(assetType, description, imageName);
    return res.json({
        ...suggestions,
        disclaimer: 'AI suggestions support the engineer. Final risk assessment is manual and supervisor-reviewed.',
    });
});
