import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../supabaseClient';
import { AuthRequest, authMiddleware } from '../middleware/auth';

export const authRouter = Router();

// POST /api/auth/login
// Body: { identifier: string, password: string }
// identifier can be email (admin/superadmin) or 5-digit worker_id (worker)
authRouter.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    // Determine if identifier is a 5-digit worker ID or an email
    const isWorkerId = /^\d{5}$/.test(identifier);

    let query = supabase.from('users').select('*');
    if (isWorkerId) {
      query = query.eq('worker_id', identifier);
    } else {
      query = query.eq('email', identifier.toLowerCase().trim());
    }

    const { data: user, error } = await query.single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Simple token: userId:role:companyId (in production use JWT)
    const token = `${user.id}:${user.role}:${user.company_id || ''}`;

    return res.json({
      token,
      user: {
        id: user.id,
        role: user.role,
        full_name: user.full_name,
        email: user.email,
        worker_id: user.worker_id,
        company_id: user.company_id,
        position: user.position,
        team: user.team,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
authRouter.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: user, error } = await supabase
    .from('users')
    .select('id, role, full_name, email, worker_id, company_id, position, team, status')
    .eq('id', req.user.id)
    .single();

  if (error || !user) {
    return res.status(401).json({ error: 'User not found' });
  }

  // If user has a company, fetch company info
  let company = null;
  if (user.company_id) {
    const { data: c } = await supabase.from('companies').select('*').eq('id', user.company_id).single();
    company = c;
  }

  // If worker, fetch assigned assets
  let assignedAssets = [];
  if (user.role === 'worker' && user.company_id) {
    const { data: assets } = await supabase
      .from('assets')
      .select('*')
      .eq('assigned_worker_id', user.id)
      .eq('status', 'active');
    assignedAssets = assets || [];
  }

  return res.json({ user, company, assignedAssets });
});

// POST /api/auth/change-password
authRouter.post('/change-password', authMiddleware, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Current and new password required (min 6 chars)' });
  }

  const { data: user } = await supabase.from('users').select('password_hash').eq('id', req.user.id).single();
  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  const hash = await bcrypt.hash(newPassword, 10);
  const { error } = await supabase.from('users').update({ password_hash: hash }).eq('id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ message: 'Password updated' });
});
