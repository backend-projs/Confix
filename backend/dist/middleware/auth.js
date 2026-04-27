"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.optionalAuth = optionalAuth;
exports.requireRole = requireRole;
exports.requireCompanyAccess = requireCompanyAccess;
const supabaseClient_1 = require("../supabaseClient");
async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.replace('Bearer ', '').trim();
    // Token format: userId:role:companyId (simple signed token for demo)
    // In production use JWT
    const parts = token.split(':');
    if (parts.length < 2) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    const userId = parts[0];
    const { data: user, error } = await supabaseClient_1.supabase
        .from('users')
        .select('id, role, company_id, full_name, email, worker_id, status, team, position')
        .eq('id', userId)
        .single();
    if (error || !user || user.status !== 'active') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = {
        id: user.id,
        role: user.role,
        company_id: user.company_id,
        full_name: user.full_name,
        email: user.email,
        worker_id: user.worker_id,
        team: user.team,
        position: user.position,
    };
    next();
}
async function optionalAuth(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next();
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const parts = token.split(':');
    if (parts.length < 2)
        return next();
    const userId = parts[0];
    const { data: user } = await supabaseClient_1.supabase
        .from('users')
        .select('id, role, company_id, full_name, email, worker_id, status, team, position')
        .eq('id', userId)
        .single();
    if (user && user.status === 'active') {
        req.user = {
            id: user.id,
            role: user.role,
            company_id: user.company_id,
            full_name: user.full_name,
            email: user.email,
            worker_id: user.worker_id,
            team: user.team,
            position: user.position,
        };
    }
    next();
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}
function requireCompanyAccess(req, res, next) {
    if (!req.user)
        return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role === 'superadmin')
        return next();
    if (!req.user.company_id) {
        return res.status(403).json({ error: 'No company assigned' });
    }
    next();
}
