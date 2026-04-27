import { Router } from 'express';
import { supabase } from '../supabaseClient';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';

export const notificationsRouter = Router();

// Haversine distance in meters
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// GET /api/notifications/me — list notifications for current user
notificationsRouter.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*, reports(asset_name, location_name, latitude, longitude, risk_level, issue_type)')
      .eq('recipient_id', req.user!.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id/read — mark notification as read
notificationsRouter.patch('/:id/read', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('recipient_id', req.user!.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/notify-nearest — admin sends incident to nearest worker
notificationsRouter.post('/notify-nearest', authMiddleware, requireRole('admin', 'superadmin'), async (req: AuthRequest, res) => {
  try {
    const { report_id, message } = req.body;
    if (!report_id) return res.status(400).json({ error: 'report_id is required' });

    // Fetch report
    const { data: report, error: rErr } = await supabase
      .from('reports')
      .select('id, asset_name, latitude, longitude, location_name, tenant_id, risk_level, issue_type')
      .eq('id', report_id)
      .single();
    if (rErr || !report) return res.status(404).json({ error: 'Report not found' });
    if (report.latitude == null || report.longitude == null) {
      return res.status(400).json({ error: 'Report has no coordinates' });
    }

    // Fetch active workers in same company with workplace coords
    let q = supabase
      .from('users')
      .select('id, full_name, workplace_latitude, workplace_longitude, company_id, worker_type')
      .eq('role', 'worker')
      .eq('status', 'active')
      .in('worker_type', ['field', 'audit'])
      .not('workplace_latitude', 'is', null)
      .not('workplace_longitude', 'is', null);

    if (req.user!.role === 'admin') {
      q = q.eq('company_id', req.user!.company_id);
    } else if (report.tenant_id) {
      q = q.eq('company_id', report.tenant_id);
    }

    const { data: workers, error: wErr } = await q;
    if (wErr) return res.status(500).json({ error: wErr.message });
    if (!workers || workers.length === 0) {
      return res.status(400).json({ error: 'No active workers with workplace location found. Please ensure workers have their workplace coordinates set on the map in the Admin panel.' });
    }

    // Find nearest
    let nearest = workers[0];
    let nearestDist = haversineMeters(
      report.latitude,
      report.longitude,
      nearest.workplace_latitude!,
      nearest.workplace_longitude!,
    );
    for (let i = 1; i < workers.length; i++) {
      const w = workers[i];
      const d = haversineMeters(report.latitude, report.longitude, w.workplace_latitude!, w.workplace_longitude!);
      if (d < nearestDist) {
        nearest = w;
        nearestDist = d;
      }
    }

    const title = `Incident assigned: ${report.asset_name}`;
    const body =
      message ||
      `New ${report.risk_level || ''} ${report.issue_type || 'incident'} at ${report.location_name || 'site'}. You are the closest worker (${(nearestDist / 1000).toFixed(2)} km).`;

    const { data: notification, error: nErr } = await supabase
      .from('notifications')
      .insert({
        recipient_id: nearest.id,
        sender_id: req.user!.id,
        report_id: report.id,
        type: 'incident',
        title,
        message: body,
        distance_meters: nearestDist,
      })
      .select()
      .single();
    if (nErr) return res.status(500).json({ error: nErr.message });

    // Assign worker to report and post a system message to thread
    await supabase.from('reports').update({ assigned_worker_id: nearest.id }).eq('id', report.id);
    await supabase.from('report_messages').insert({
      report_id: report.id,
      sender_id: req.user!.id,
      sender_role: req.user!.role,
      body: `Dispatched to ${nearest.full_name} (${(nearestDist / 1000).toFixed(2)} km away).`,
      is_system: true,
    });

    return res.status(201).json({
      notification,
      worker: { id: nearest.id, full_name: nearest.full_name, distance_meters: nearestDist },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
