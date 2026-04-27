"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRouter = void 0;
const express_1 = require("express");
const supabaseClient_1 = require("../supabaseClient");
exports.statsRouter = (0, express_1.Router)();
exports.statsRouter.get('/', async (_req, res) => {
    try {
        const { data: reports, error } = await supabaseClient_1.supabase
            .from('reports')
            .select('*');
        if (error)
            return res.status(500).json({ error: error.message });
        if (!reports)
            return res.json({});
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
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
