"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.companiesRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const supabaseClient_1 = require("../supabaseClient");
const auth_1 = require("../middleware/auth");
exports.companiesRouter = (0, express_1.Router)();
// POST /api/companies/register — public: register a new company
exports.companiesRouter.post('/register', async (req, res) => {
    try {
        const { company_name, contact_email, contact_phone, admin_name, admin_email } = req.body;
        if (!company_name || !contact_email || !admin_name) {
            return res.status(400).json({ error: 'company_name, contact_email, and admin_name are required' });
        }
        const { data, error } = await supabaseClient_1.supabase.from('company_registrations').insert({
            company_name,
            contact_email: contact_email.toLowerCase().trim(),
            contact_phone: contact_phone || null,
            admin_name,
            admin_email: admin_email ? admin_email.toLowerCase().trim() : null,
            status: 'pending',
        }).select().single();
        if (error)
            return res.status(500).json({ error: error.message });
        return res.status(201).json({ message: 'Registration submitted and is pending review.', registration: data });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// GET /api/companies/registrations — superadmin view pending registrations
exports.companiesRouter.get('/registrations', auth_1.authMiddleware, (0, auth_1.requireRole)('superadmin'), async (req, res) => {
    try {
        const { status } = req.query;
        let query = supabaseClient_1.supabase.from('company_registrations').select('*').order('created_at', { ascending: false });
        if (status)
            query = query.eq('status', status);
        const { data, error } = await query;
        if (error)
            return res.status(500).json({ error: error.message });
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// PATCH /api/companies/registrations/:id/approve — superadmin approves and creates company + admin
exports.companiesRouter.patch('/registrations/:id/approve', auth_1.authMiddleware, (0, auth_1.requireRole)('superadmin'), async (req, res) => {
    try {
        const { admin_password } = req.body;
        if (!admin_password || admin_password.length < 6) {
            return res.status(400).json({ error: 'admin_password is required (min 6 chars)' });
        }
        // Fetch registration
        const { data: reg, error: regErr } = await supabaseClient_1.supabase
            .from('company_registrations')
            .select('*')
            .eq('id', req.params.id)
            .single();
        if (regErr || !reg)
            return res.status(404).json({ error: 'Registration not found' });
        if (reg.status !== 'pending')
            return res.status(400).json({ error: 'Registration already processed' });
        // Generate company slug
        const slug = reg.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.floor(Math.random() * 10000);
        // Create company
        const { data: company, error: companyErr } = await supabaseClient_1.supabase
            .from('companies')
            .insert({ name: reg.company_name, slug, status: 'active' })
            .select()
            .single();
        if (companyErr || !company)
            return res.status(500).json({ error: companyErr?.message || 'Failed to create company' });
        // Create admin user
        const hash = await bcryptjs_1.default.hash(admin_password, 10);
        const adminEmail = reg.admin_email || reg.contact_email;
        const { data: admin, error: adminErr } = await supabaseClient_1.supabase.from('users').insert({
            company_id: company.id,
            role: 'admin',
            email: adminEmail.toLowerCase().trim(),
            password_hash: hash,
            full_name: reg.admin_name,
            status: 'active',
        }).select().single();
        if (adminErr || !admin) {
            // Rollback company creation if admin creation fails
            await supabaseClient_1.supabase.from('companies').delete().eq('id', company.id);
            return res.status(500).json({ error: adminErr?.message || 'Failed to create admin account' });
        }
        // Update registration status
        await supabaseClient_1.supabase.from('company_registrations').update({
            status: 'approved',
            reviewed_by: req.user.id,
        }).eq('id', req.params.id);
        return res.json({
            message: 'Company approved and admin account created.',
            company,
            admin: { id: admin.id, email: admin.email, full_name: admin.full_name },
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// PATCH /api/companies/registrations/:id/reject — superadmin rejects
exports.companiesRouter.patch('/registrations/:id/reject', auth_1.authMiddleware, (0, auth_1.requireRole)('superadmin'), async (req, res) => {
    try {
        const { rejection_reason } = req.body;
        const { data: reg, error: regErr } = await supabaseClient_1.supabase
            .from('company_registrations')
            .select('*')
            .eq('id', req.params.id)
            .single();
        if (regErr || !reg)
            return res.status(404).json({ error: 'Registration not found' });
        if (reg.status !== 'pending')
            return res.status(400).json({ error: 'Registration already processed' });
        const { error } = await supabaseClient_1.supabase.from('company_registrations').update({
            status: 'rejected',
            reviewed_by: req.user.id,
            rejection_reason: rejection_reason || 'Rejected by superadmin',
        }).eq('id', req.params.id);
        if (error)
            return res.status(500).json({ error: error.message });
        return res.json({ message: 'Registration rejected' });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// GET /api/companies — list companies (superadmin sees all, admin sees own)
exports.companiesRouter.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        let query = supabaseClient_1.supabase.from('companies').select('*').order('created_at', { ascending: false });
        if (req.user.role === 'admin') {
            query = query.eq('id', req.user.company_id);
        }
        const { data, error } = await query;
        if (error)
            return res.status(500).json({ error: error.message });
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// GET /api/companies/:id/assets — list assets for a company
exports.companiesRouter.get('/:id/assets', auth_1.authMiddleware, async (req, res) => {
    try {
        if (req.user.role === 'admin' && req.user.company_id !== req.params.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const { data, error } = await supabaseClient_1.supabase
            .from('assets')
            .select('*, assigned_worker:users(id, full_name, worker_id)')
            .eq('company_id', req.params.id)
            .order('created_at', { ascending: false });
        if (error)
            return res.status(500).json({ error: error.message });
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// POST /api/companies/:id/assets — create asset for company
exports.companiesRouter.post('/:id/assets', auth_1.authMiddleware, async (req, res) => {
    try {
        if (req.user.role === 'admin' && req.user.company_id !== req.params.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const { name, type, location_name, latitude, longitude, assigned_worker_id } = req.body;
        if (!name || !type) {
            return res.status(400).json({ error: 'name and type are required' });
        }
        const { data, error } = await supabaseClient_1.supabase.from('assets').insert({
            company_id: req.params.id,
            name,
            type,
            location_name: location_name || null,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            assigned_worker_id: assigned_worker_id || null,
        }).select().single();
        if (error)
            return res.status(500).json({ error: error.message });
        return res.status(201).json(data);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
