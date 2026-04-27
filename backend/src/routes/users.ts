import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../supabaseClient';
import { AuthRequest, authMiddleware, requireRole, requireCompanyAccess } from '../middleware/auth';

export const usersRouter = Router();

// GET /api/users/workers — list workers for admin's company
usersRouter.get('/workers', authMiddleware, requireCompanyAccess, requireRole('admin', 'superadmin'), async (req: AuthRequest, res) => {
  try {
    let query = supabase.from('users').select('*').eq('role', 'worker');
    if (req.user!.role === 'admin') {
      query = query.eq('company_id', req.user!.company_id);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/users/workers — admin creates a worker
usersRouter.post('/workers', authMiddleware, requireCompanyAccess, requireRole('admin', 'superadmin'), async (req: AuthRequest, res) => {
  try {
    const { full_name, position, team, password, worker_id, phone, email } = req.body;
    if (!full_name || !position || !password || !worker_id) {
      return res.status(400).json({ error: 'full_name, position, password, and worker_id are required' });
    }
    if (!/^\d{5}$/.test(worker_id)) {
      return res.status(400).json({ error: 'worker_id must be exactly 5 digits' });
    }

    const companyId = req.user!.role === 'admin' ? req.user!.company_id : (req.body.company_id || req.user!.company_id);
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const hash = await bcrypt.hash(password, 10);

    const { data: existing } = await supabase.from('users').select('id').eq('worker_id', worker_id).maybeSingle();
    if (existing) {
      return res.status(409).json({ error: 'Worker ID already exists' });
    }

    const { data, error } = await supabase.from('users').insert({
      company_id: companyId,
      role: 'worker',
      email: email || null,
      worker_id,
      password_hash: hash,
      full_name,
      position,
      team: team || null,
      phone: phone || null,
      status: 'active',
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/workers/:id — update worker (position, team, status)
usersRouter.patch('/workers/:id', authMiddleware, requireCompanyAccess, requireRole('admin', 'superadmin'), async (req: AuthRequest, res) => {
  try {
    const { full_name, position, team, status, assigned_asset_id } = req.body;

    // Ensure admin can only update workers in their company
    const { data: target } = await supabase.from('users').select('company_id, role').eq('id', req.params.id).single();
    if (!target || target.role !== 'worker') {
      return res.status(404).json({ error: 'Worker not found' });
    }
    if (req.user!.role === 'admin' && target.company_id !== req.user!.company_id) {
      return res.status(403).json({ error: 'Cannot modify workers from other companies' });
    }

    const updates: any = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (position !== undefined) updates.position = position;
    if (team !== undefined) updates.team = team;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabase.from('users').update(updates).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });

    // If asset reassignment requested
    if (assigned_asset_id) {
      // Unassign from previous asset if any
      await supabase.from('assets').update({ assigned_worker_id: null }).eq('assigned_worker_id', req.params.id);
      // Assign to new asset
      await supabase.from('assets').update({ assigned_worker_id: req.params.id }).eq('id', assigned_asset_id);
    } else if (assigned_asset_id === null) {
      await supabase.from('assets').update({ assigned_worker_id: null }).eq('assigned_worker_id', req.params.id);
    }

    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/users/admins — superadmin lists admins
usersRouter.get('/admins', authMiddleware, requireRole('superadmin'), async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*, companies(*)')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/users/admins — superadmin creates an admin for a company
usersRouter.post('/admins', authMiddleware, requireRole('superadmin'), async (req: AuthRequest, res) => {
  try {
    const { full_name, email, password, company_id, phone } = req.body;
    if (!full_name || !email || !password || !company_id) {
      return res.status(400).json({ error: 'full_name, email, password, and company_id are required' });
    }

    const hash = await bcrypt.hash(password, 10);

    const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase().trim()).maybeSingle();
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const { data, error } = await supabase.from('users').insert({
      company_id,
      role: 'admin',
      email: email.toLowerCase().trim(),
      password_hash: hash,
      full_name,
      phone: phone || null,
      status: 'active',
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
