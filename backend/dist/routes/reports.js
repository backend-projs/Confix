"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRouter = void 0;
const express_1 = require("express");
const supabaseClient_1 = require("../supabaseClient");
const utils_1 = require("../utils");
exports.reportsRouter = (0, express_1.Router)();
// GET /api/reports
exports.reportsRouter.get('/', async (req, res) => {
    try {
        let query = supabaseClient_1.supabase.from('reports').select('*');
        const { tenantId, companyName, status, riskLevel, assetType, issueType, visibilityLevel, search } = req.query;
        if (tenantId)
            query = query.eq('tenant_id', tenantId);
        if (companyName)
            query = query.eq('company_name', companyName);
        if (status)
            query = query.eq('status', status);
        if (riskLevel)
            query = query.eq('risk_level', riskLevel);
        if (assetType)
            query = query.eq('asset_type', assetType);
        if (issueType)
            query = query.eq('issue_type', issueType);
        if (visibilityLevel)
            query = query.eq('visibility_level', visibilityLevel);
        if (search) {
            const s = search;
            query = query.or(`asset_name.ilike.%${s}%,location_name.ilike.%${s}%,description.ilike.%${s}%,issue_type.ilike.%${s}%`);
        }
        query = query.order('created_at', { ascending: false });
        const { data, error } = await query;
        if (error)
            return res.status(500).json({ error: error.message });
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// GET /api/reports/:id
exports.reportsRouter.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabaseClient_1.supabase
            .from('reports')
            .select('*')
            .eq('id', req.params.id)
            .single();
        if (error)
            return res.status(404).json({ error: 'Report not found' });
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// POST /api/reports
exports.reportsRouter.post('/', async (req, res) => {
    try {
        const { tenantId, companyName, assetName, assetType, locationName, latitude, longitude, issueType, description, imageName, impact, likelihood, createdBy, assignedTeam, visibilityLevel, } = req.body;
        if (!tenantId || !companyName || !assetName || !assetType || !locationName || !issueType || !description || !impact || !likelihood || !createdBy) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const riskMatrixScore = (0, utils_1.calculateRiskMatrixScore)(impact, likelihood);
        const riskLevel = (0, utils_1.getRiskLevel)(riskMatrixScore);
        const safety = (0, utils_1.deriveSafetyFields)(assetType, issueType, riskLevel);
        const recommendedAction = (0, utils_1.deriveRecommendedAction)(riskLevel, issueType, assetType);
        const auditTrail = [
            (0, utils_1.createAuditEvent)('Report created', createdBy),
            (0, utils_1.createAuditEvent)(`Risk assessed: Impact ${impact} × Likelihood ${likelihood} = ${riskMatrixScore} (${riskLevel})`, createdBy),
        ];
        const report = {
            tenant_id: tenantId,
            company_name: companyName,
            asset_name: assetName,
            asset_type: assetType,
            location_name: locationName,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            issue_type: issueType,
            description,
            image_name: imageName || null,
            status: 'New',
            impact,
            likelihood,
            risk_matrix_score: riskMatrixScore,
            risk_level: riskLevel,
            created_by: createdBy,
            assigned_team: assignedTeam || null,
            supervisor_reviewed: false,
            recommended_action: recommendedAction,
            ai_suggestion: null,
            required_ppe: safety.requiredPPE,
            safety_instructions: safety.safetyInstructions,
            worker_safety_level: safety.workerSafetyLevel,
            minimum_crew: safety.minimumCrew,
            supervisor_approval_required: safety.supervisorApprovalRequired,
            hazard_radius_meters: safety.hazardRadiusMeters,
            safety_checklist_completed: false,
            visibility_level: visibilityLevel || 'Internal',
            exact_coordinates_restricted: visibilityLevel === 'Critical',
            audit_trail: auditTrail,
        };
        const { data, error } = await supabaseClient_1.supabase.from('reports').insert(report).select().single();
        if (error)
            return res.status(500).json({ error: error.message });
        return res.status(201).json(data);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// PATCH /api/reports/:id/status
exports.reportsRouter.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status)
            return res.status(400).json({ error: 'status is required' });
        const { data: existing, error: fetchErr } = await supabaseClient_1.supabase
            .from('reports')
            .select('*')
            .eq('id', req.params.id)
            .single();
        if (fetchErr || !existing)
            return res.status(404).json({ error: 'Report not found' });
        const oldStatus = existing.status;
        const updatedTrail = (0, utils_1.appendAuditEvent)(existing.audit_trail || [], `Status changed from ${oldStatus} to ${status}`, 'System');
        const updates = {
            status,
            audit_trail: updatedTrail,
        };
        if (status === 'Reviewed') {
            updates.supervisor_reviewed = true;
        }
        const { data, error } = await supabaseClient_1.supabase
            .from('reports')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// PATCH /api/reports/:id/safety-checklist
exports.reportsRouter.patch('/:id/safety-checklist', async (req, res) => {
    try {
        const { completed } = req.body;
        const { data: existing, error: fetchErr } = await supabaseClient_1.supabase
            .from('reports')
            .select('*')
            .eq('id', req.params.id)
            .single();
        if (fetchErr || !existing)
            return res.status(404).json({ error: 'Report not found' });
        const updatedTrail = (0, utils_1.appendAuditEvent)(existing.audit_trail || [], completed ? 'Safety checklist completed' : 'Safety checklist reset', 'System');
        const updates = {
            safety_checklist_completed: !!completed,
            audit_trail: updatedTrail,
        };
        if (completed && ['Assigned', 'Reviewed'].includes(existing.status)) {
            updates.status = 'In Progress';
            const trail2 = (0, utils_1.appendAuditEvent)(updatedTrail, `Status changed from ${existing.status} to In Progress`, 'System');
            updates.audit_trail = trail2;
        }
        const { data, error } = await supabaseClient_1.supabase
            .from('reports')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// POST /api/reports/:id/emergency-alert
exports.reportsRouter.post('/:id/emergency-alert', async (req, res) => {
    try {
        const { data: existing, error: fetchErr } = await supabaseClient_1.supabase
            .from('reports')
            .select('*')
            .eq('id', req.params.id)
            .single();
        if (fetchErr || !existing)
            return res.status(404).json({ error: 'Report not found' });
        const updatedTrail = (0, utils_1.appendAuditEvent)(existing.audit_trail || [], 'Emergency alert triggered — supervisor notified with task and location details', 'System');
        await supabaseClient_1.supabase
            .from('reports')
            .update({ audit_trail: updatedTrail })
            .eq('id', req.params.id);
        return res.json({
            message: 'Emergency alert sent to supervisor with task and location details.',
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
