import { Router, Response } from 'express';
import { supabase } from '../supabaseClient';
import { AuthRequest, optionalAuth } from '../middleware/auth';

export const statsRouter = Router();

statsRouter.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    let query = supabase.from('reports').select('*');

    // Tenant scoping: admins/workers see only their company; superadmin sees all
    if (req.user) {
      if (req.user.role === 'admin' || req.user.role === 'worker') {
        if (!req.user.company_id) {
          return res.json({
            totalReports: 0, criticalReports: 0, highRiskReports: 0,
            pendingMaintenance: 0, activeHazardZones: 0,
            safetyChecklistsPending: 0, supervisorReviewsPending: 0,
            averageRiskMatrixScore: 0,
            riskDistribution: [], assetTypeBreakdown: [],
            statusDistribution: [], reportsByCompany: [],
          });
        }
        query = query.eq('company_id', req.user.company_id);
      }
      // Workers further restricted to their own reports
      if (req.user.role === 'worker') {
        query = query.eq('worker_id', req.user.id);
      }
    } else {
      // Unauthenticated: return empty stats (frontend AuthGuard prevents this anyway)
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: reports, error } = await query;

    if (error) return res.status(500).json({ error: error.message });
    if (!reports) return res.json({});

    const totalReports = reports.length;
    const criticalReports = reports.filter(r => r.risk_level === 'Critical').length;
    const highRiskReports = reports.filter(r => r.risk_level === 'High').length;
    const pendingMaintenance = reports.filter(r => ['New', 'Reviewed', 'Assigned'].includes(r.status)).length;
    const activeHazardZones = reports.filter(r => r.risk_level === 'Critical' || r.risk_level === 'High').length;
    const safetyChecklistsPending = reports.filter(r => !r.safety_checklist_completed && r.status !== 'Resolved' && r.status !== 'Verified').length;
    const supervisorReviewsPending = reports.filter(r => !r.supervisor_reviewed && (r.supervisor_approval_required)).length;
    const averageRiskMatrixScore = totalReports > 0
      ? Math.round((reports.reduce((sum, r) => sum + r.risk_matrix_score, 0) / totalReports) * 10) / 10
      : 0;

    // Distributions
    const riskDistribution = ['Low', 'Medium', 'High', 'Critical'].map(level => ({
      name: level,
      count: reports.filter(r => r.risk_level === level).length,
    }));

    const assetTypes = [...new Set(reports.map(r => r.asset_type))];
    const assetTypeBreakdown = assetTypes.map(type => ({
      name: type,
      count: reports.filter(r => r.asset_type === type).length,
    }));

    const statuses = ['New', 'Reviewed', 'Assigned', 'In Progress', 'Resolved', 'Verified'];
    const statusDistribution = statuses.map(status => ({
      name: status,
      count: reports.filter(r => r.status === status).length,
    }));

    const companies = [...new Set(reports.map(r => r.company_name))];
    const reportsByCompany = companies.map(company => ({
      name: company,
      count: reports.filter(r => r.company_name === company).length,
    }));

    return res.json({
      totalReports,
      criticalReports,
      highRiskReports,
      pendingMaintenance,
      activeHazardZones,
      safetyChecklistsPending,
      supervisorReviewsPending,
      averageRiskMatrixScore,
      riskDistribution,
      assetTypeBreakdown,
      statusDistribution,
      reportsByCompany,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
