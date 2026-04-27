import { Router } from 'express';
import { supabase } from '../supabaseClient';
import { AuthRequest, authMiddleware } from '../middleware/auth';

export const threadsRouter = Router();

// Helper: check user can access a report's thread
async function canAccessReport(req: AuthRequest, reportId: string) {
  if (!req.user) return { ok: false, status: 401, error: 'Unauthorized' };
  const { data: report } = await supabase
    .from('reports')
    .select('id, tenant_id, assigned_worker_id, reported_by')
    .eq('id', reportId)
    .single();
  if (!report) return { ok: false, status: 404, error: 'Report not found' };
  const u = req.user;
  if (u.role === 'superadmin') return { ok: true, report };
  if (u.role === 'admin' && report.tenant_id === u.company_id) return { ok: true, report };
  if (
    u.role === 'worker' &&
    (report.assigned_worker_id === u.id || report.reported_by === u.id)
  ) {
    return { ok: true, report };
  }
  return { ok: false, status: 403, error: 'Forbidden' };
}

// GET /api/threads — list threads visible to current user
threadsRouter.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const u = req.user!;
    let query = supabase
      .from('reports')
      .select(`
        id, asset_name, asset_type, issue_type, description, location_name,
        risk_level, status, tenant_id, latitude, longitude, created_at,
        assigned_worker_id, resolved_at, resolution_notes, reported_by, image_name,
        assigned_worker:assigned_worker_id ( id, full_name, worker_type, position ),
        reporter:reported_by ( id, full_name, worker_type, position )
      `)
      .order('created_at', { ascending: false });

    if (u.role === 'admin') {
      query = query.eq('tenant_id', u.company_id);
    } else if (u.role === 'worker') {
      query = query.or(`assigned_worker_id.eq.${u.id},reported_by.eq.${u.id}`);
    }

    const { data: reports, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    if (!reports) return res.json([]);

    // Fetch latest message + count per report
    const ids = reports.map((r: any) => r.id);
    let messages: any[] = [];
    if (ids.length > 0) {
      const { data: msgs } = await supabase
        .from('report_messages')
        .select('id, report_id, body, sender_role, created_at, is_system')
        .in('report_id', ids)
        .order('created_at', { ascending: false });
      messages = msgs || [];
    }
    const byReport: Record<string, { latest: any; count: number }> = {};
    for (const m of messages) {
      const slot = byReport[m.report_id] || { latest: null, count: 0 };
      if (!slot.latest) slot.latest = m;
      slot.count += 1;
      byReport[m.report_id] = slot;
    }

    const enriched = reports.map((r: any) => ({
      ...r,
      latest_message: byReport[r.id]?.latest || null,
      message_count: byReport[r.id]?.count || 0,
    }));
    return res.json(enriched);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/threads/:reportId/messages
threadsRouter.get('/:reportId/messages', authMiddleware, async (req: AuthRequest, res) => {
  const access = await canAccessReport(req, req.params.reportId);
  if (!access.ok) return res.status(access.status!).json({ error: access.error });
  const { data, error } = await supabase
    .from('report_messages')
    .select('*, sender:sender_id ( id, full_name, role )')
    .eq('report_id', req.params.reportId)
    .order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// POST /api/threads/:reportId/messages
threadsRouter.post('/:reportId/messages', authMiddleware, async (req: AuthRequest, res) => {
  const access = await canAccessReport(req, req.params.reportId);
  if (!access.ok) return res.status(access.status!).json({ error: access.error });
  const { body, attachment_url } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Message body is required' });
  const { data, error } = await supabase
    .from('report_messages')
    .insert({
      report_id: req.params.reportId,
      sender_id: req.user!.id,
      sender_role: req.user!.role,
      body: body.trim(),
      attachment_url: attachment_url || null,
    })
    .select('*, sender:sender_id ( id, full_name, role )')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
});

// PATCH /api/threads/:reportId/resolve
threadsRouter.patch('/:reportId/resolve', authMiddleware, async (req: AuthRequest, res) => {
  const access = await canAccessReport(req, req.params.reportId);
  if (!access.ok) return res.status(access.status!).json({ error: access.error });
  const { resolution_notes } = req.body;
  const { data, error } = await supabase
    .from('reports')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: req.user!.id,
      resolution_notes: resolution_notes || null,
    })
    .eq('id', req.params.reportId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('report_messages').insert({
    report_id: req.params.reportId,
    sender_id: req.user!.id,
    sender_role: req.user!.role,
    body: resolution_notes ? `Marked as resolved: ${resolution_notes}` : 'Marked as resolved.',
    is_system: true,
  });

  return res.json(data);
});

// PATCH /api/threads/:reportId/reopen
threadsRouter.patch('/:reportId/reopen', authMiddleware, async (req: AuthRequest, res) => {
  const access = await canAccessReport(req, req.params.reportId);
  if (!access.ok) return res.status(access.status!).json({ error: access.error });
  const { data, error } = await supabase
    .from('reports')
    .update({ status: 'in_progress', resolved_at: null, resolved_by: null })
    .eq('id', req.params.reportId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  await supabase.from('report_messages').insert({
    report_id: req.params.reportId,
    sender_id: req.user!.id,
    sender_role: req.user!.role,
    body: 'Thread reopened.',
    is_system: true,
  });
  return res.json(data);
});

// GET /api/threads/:reportId/ai-suggestion — AI suggestion from history
threadsRouter.get('/:reportId/ai-suggestion', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const access = await canAccessReport(req, req.params.reportId);
    if (!access.ok) return res.status(access.status!).json({ error: access.error });
    const report = access.report as any;

    // Find resolved reports with same asset_type + issue_type that have resolution_notes
    const { data: history } = await supabase
      .from('reports')
      .select('id, resolution_notes, resolved_at, asset_type, issue_type')
      .eq('asset_type', report.asset_type)
      .eq('issue_type', report.issue_type)
      .eq('status', 'resolved')
      .not('resolution_notes', 'is', null)
      .neq('id', report.id)
      .order('resolved_at', { ascending: false })
      .limit(50);

    if (!history || history.length === 0) {
      return res.json({
        has_suggestion: false,
        message: 'No similar resolved cases found yet. Be the first to log a solution.',
      });
    }

    // Tally most-frequent solution text (simple normalization)
    const counts: Record<string, { count: number; latest: string; sample: string }> = {};
    for (const h of history) {
      const key = (h.resolution_notes || '').trim().toLowerCase();
      if (!key) continue;
      if (!counts[key]) counts[key] = { count: 0, latest: h.resolved_at, sample: h.resolution_notes };
      counts[key].count += 1;
      if (h.resolved_at > counts[key].latest) counts[key].latest = h.resolved_at;
    }
    const ranked = Object.values(counts).sort((a, b) => b.count - a.count);
    if (ranked.length === 0) {
      return res.json({ has_suggestion: false, message: 'No reusable solution notes available.' });
    }
    const best = ranked[0];

    return res.json({
      has_suggestion: true,
      suggestion: best.sample,
      success_count: best.count,
      total_history: history.length,
      asset_type: report.asset_type,
      issue_type: report.issue_type,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
