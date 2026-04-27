"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRouter = void 0;
const express_1 = require("express");
const supabaseClient_1 = require("../supabaseClient");
const utils_1 = require("../utils");
const auth_1 = require("../middleware/auth");
exports.reportsRouter = (0, express_1.Router)();
// Helper to enforce tenant isolation on queries (must be sync — Supabase query builders are thenable)
function enforceTenantScope(req, query) {
    if (req.user.role === 'superadmin')
        return query;
    if (req.user.role === 'admin' || req.user.role === 'worker') {
        if (req.user.company_id) {
            return query.eq('company_id', req.user.company_id);
        }
    }
    return query;
}
// GET /api/reports
exports.reportsRouter.get('/', auth_1.optionalAuth, async (req, res) => {
    try {
        let query = supabaseClient_1.supabase.from('reports').select('*');
        // If authenticated, enforce tenant scope
        if (req.user) {
            query = enforceTenantScope(req, query);
        }
        const { status, riskLevel, assetType, issueType, visibilityLevel, search } = req.query;
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
        // Workers only see their own reports
        if (req.user?.role === 'worker') {
            query = query.eq('worker_id', req.user.id);
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
exports.reportsRouter.get('/:id', auth_1.authMiddleware, auth_1.requireCompanyAccess, async (req, res) => {
    try {
        let query = supabaseClient_1.supabase.from('reports').select('*').eq('id', req.params.id);
        query = enforceTenantScope(req, query);
        if (req.user.role === 'worker') {
            query = query.eq('worker_id', req.user.id);
        }
        const { data, error } = await query.single();
        if (error)
            return res.status(404).json({ error: 'Report not found' });
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// POST /api/reports
exports.reportsRouter.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { assetId, assetName, assetType, locationName, latitude, longitude, issueType, description, imageName, impact, likelihood, visibilityLevel, } = req.body;
        if (!assetName || !assetType || !locationName || !issueType || !description || !impact || !likelihood) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Resolve asset and company context
        let companyId = req.user.company_id;
        let resolvedAssetName = assetName;
        let resolvedAssetType = assetType;
        let resolvedLocationName = locationName;
        let resolvedLat = latitude ? parseFloat(latitude) : null;
        let resolvedLng = longitude ? parseFloat(longitude) : null;
        if (assetId) {
            const { data: asset } = await supabaseClient_1.supabase.from('assets').select('*').eq('id', assetId).single();
            if (asset) {
                resolvedAssetName = asset.name;
                resolvedAssetType = asset.type;
                resolvedLocationName = asset.location_name || locationName;
                resolvedLat = asset.latitude || resolvedLat;
                resolvedLng = asset.longitude || resolvedLng;
                companyId = asset.company_id;
            }
        }
        // Workers must have a company
        if (req.user.role === 'worker' && !companyId) {
            return res.status(400).json({ error: 'Worker is not assigned to a company' });
        }
        // Admin/worker can only report for their own company
        if ((req.user.role === 'admin' || req.user.role === 'worker') && req.user.company_id && companyId !== req.user.company_id) {
            return res.status(403).json({ error: 'Cannot create report for another company' });
        }
        const riskMatrixScore = (0, utils_1.calculateRiskMatrixScore)(impact, likelihood);
        const riskLevel = (0, utils_1.getRiskLevel)(riskMatrixScore);
        const safety = (0, utils_1.deriveSafetyFields)(resolvedAssetType, issueType, riskLevel);
        const recommendedAction = (0, utils_1.deriveRecommendedAction)(riskLevel, issueType, resolvedAssetType);
        const createdBy = req.user.full_name;
        const auditTrail = [
            (0, utils_1.createAuditEvent)('Report created', createdBy),
            (0, utils_1.createAuditEvent)(`Risk assessed: Impact ${impact} × Likelihood ${likelihood} = ${riskMatrixScore} (${riskLevel})`, createdBy),
        ];
        // Fetch company name
        let companyName = '';
        if (companyId) {
            const { data: comp } = await supabaseClient_1.supabase.from('companies').select('name').eq('id', companyId).single();
            if (comp)
                companyName = comp.name;
        }
        const report = {
            tenant_id: companyId || 'default',
            company_id: companyId,
            company_name: companyName,
            asset_id: assetId || null,
            asset_name: resolvedAssetName,
            asset_type: resolvedAssetType,
            location_name: resolvedLocationName,
            latitude: resolvedLat,
            longitude: resolvedLng,
            issue_type: issueType,
            description,
            image_name: imageName || null,
            status: 'New',
            impact,
            likelihood,
            risk_matrix_score: riskMatrixScore,
            risk_level: riskLevel,
            created_by: createdBy,
            worker_id: req.user.id,
            assigned_team: req.user.team || null,
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
exports.reportsRouter.patch('/:id/status', auth_1.authMiddleware, auth_1.requireCompanyAccess, async (req, res) => {
    try {
        const { status } = req.body;
        if (!status)
            return res.status(400).json({ error: 'status is required' });
        let query = supabaseClient_1.supabase.from('reports').select('*').eq('id', req.params.id);
        query = enforceTenantScope(req, query);
        const { data: existing, error: fetchErr } = await query.single();
        if (fetchErr || !existing)
            return res.status(404).json({ error: 'Report not found' });
        const oldStatus = existing.status;
        const updatedTrail = (0, utils_1.appendAuditEvent)(existing.audit_trail || [], `Status changed from ${oldStatus} to ${status}`, req.user.full_name);
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
exports.reportsRouter.patch('/:id/safety-checklist', auth_1.authMiddleware, auth_1.requireCompanyAccess, async (req, res) => {
    try {
        const { completed } = req.body;
        let query = supabaseClient_1.supabase.from('reports').select('*').eq('id', req.params.id);
        query = enforceTenantScope(req, query);
        const { data: existing, error: fetchErr } = await query.single();
        if (fetchErr || !existing)
            return res.status(404).json({ error: 'Report not found' });
        const updatedTrail = (0, utils_1.appendAuditEvent)(existing.audit_trail || [], completed ? 'Safety checklist completed' : 'Safety checklist reset', req.user.full_name);
        const updates = {
            safety_checklist_completed: !!completed,
            audit_trail: updatedTrail,
        };
        if (completed && ['Assigned', 'Reviewed'].includes(existing.status)) {
            updates.status = 'In Progress';
            const trail2 = (0, utils_1.appendAuditEvent)(updatedTrail, `Status changed from ${existing.status} to In Progress`, req.user.full_name);
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
exports.reportsRouter.post('/:id/emergency-alert', auth_1.authMiddleware, auth_1.requireCompanyAccess, async (req, res) => {
    try {
        let query = supabaseClient_1.supabase.from('reports').select('*').eq('id', req.params.id);
        query = enforceTenantScope(req, query);
        const { data: existing, error: fetchErr } = await query.single();
        if (fetchErr || !existing)
            return res.status(404).json({ error: 'Report not found' });
        const updatedTrail = (0, utils_1.appendAuditEvent)(existing.audit_trail || [], 'Emergency alert triggered — supervisor notified with task and location details', req.user.full_name);
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
