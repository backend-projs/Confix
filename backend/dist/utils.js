"use strict";
// ── Risk Matrix ──
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRiskMatrixScore = calculateRiskMatrixScore;
exports.getRiskLevel = getRiskLevel;
exports.getRiskColor = getRiskColor;
exports.deriveSafetyFields = deriveSafetyFields;
exports.deriveRecommendedAction = deriveRecommendedAction;
exports.mockAssistant = mockAssistant;
exports.createAuditEvent = createAuditEvent;
exports.appendAuditEvent = appendAuditEvent;
function calculateRiskMatrixScore(impact, likelihood) {
    return impact * likelihood;
}
function getRiskLevel(score) {
    if (score >= 17)
        return 'Critical';
    if (score >= 10)
        return 'High';
    if (score >= 5)
        return 'Medium';
    return 'Low';
}
function getRiskColor(riskLevel) {
    switch (riskLevel) {
        case 'Critical': return '#ef4444';
        case 'High': return '#f97316';
        case 'Medium': return '#eab308';
        case 'Low': return '#22c55e';
        default: return '#6b7280';
    }
}
function deriveSafetyFields(assetType, issueType, riskLevel) {
    const ppe = ['High visibility vest', 'Safety boots'];
    const instructions = [];
    switch (assetType) {
        case 'Road':
            ppe.push('Traffic cones');
            instructions.push('Set up traffic diversion signs before work begins');
            break;
        case 'Bridge':
            ppe.push('Helmet', 'Gloves');
            if (riskLevel === 'High' || riskLevel === 'Critical') {
                ppe.push('Fall protection harness');
            }
            instructions.push('Inspect guardrails before accessing work area');
            break;
        case 'Tunnel':
            ppe.push('Helmet', 'Waterproof boots');
            instructions.push('Check gas levels before entry', 'Ensure ventilation is active');
            if (issueType === 'Water Leakage') {
                ppe.push('Respirator');
                instructions.push('Monitor water flow direction and volume');
            }
            break;
        case 'Telecom Tower':
            ppe.push('Helmet', 'Safety harness', 'Insulated gloves');
            instructions.push('Check wind conditions before climbing', 'Ensure grounding is intact');
            break;
        case 'Fiber Cabinet':
            ppe.push('Insulated gloves', 'Voltage detector');
            instructions.push('Test for live current before opening cabinet');
            if (issueType === 'Cable Exposure') {
                instructions.push('Isolate exposed cables before handling');
            }
            break;
        case 'Lighting Pole':
            ppe.push('Helmet', 'Insulated gloves');
            instructions.push('Verify power is disconnected', 'Perform ladder safety check');
            break;
        case 'Railway Segment':
            ppe.push('Helmet', 'High visibility vest');
            instructions.push('Confirm track closure with dispatcher', 'Watch for approaching trains');
            break;
        case 'Construction Site':
            ppe.push('Helmet', 'Gloves');
            instructions.push('Set up work zone barriers', 'Verify crane clearance if applicable');
            break;
    }
    if (issueType === 'Cable Exposure') {
        if (!ppe.includes('Insulated gloves'))
            ppe.push('Insulated gloves');
        if (!ppe.includes('Voltage detector'))
            ppe.push('Voltage detector');
    }
    // Worker safety level matches risk level
    const workerSafetyLevel = riskLevel;
    // Minimum crew
    let minimumCrew = 1;
    if (riskLevel === 'Critical') {
        minimumCrew = 3;
    }
    else if (riskLevel === 'High') {
        minimumCrew = 2;
    }
    if ((riskLevel === 'High' || riskLevel === 'Critical') &&
        ['Tunnel', 'Telecom Tower', 'Bridge'].includes(assetType)) {
        minimumCrew = Math.max(minimumCrew, 2);
    }
    // Supervisor approval
    const supervisorApprovalRequired = riskLevel === 'High' ||
        riskLevel === 'Critical' ||
        assetType === 'Tunnel' ||
        assetType === 'Telecom Tower' ||
        issueType === 'Cable Exposure' ||
        issueType === 'Water Leakage';
    // Hazard radius
    let hazardRadiusMeters = 25;
    if (riskLevel === 'Critical')
        hazardRadiusMeters = 150;
    else if (riskLevel === 'High')
        hazardRadiusMeters = 100;
    else if (riskLevel === 'Medium')
        hazardRadiusMeters = 50;
    return {
        requiredPPE: [...new Set(ppe)],
        safetyInstructions: instructions,
        workerSafetyLevel,
        minimumCrew,
        supervisorApprovalRequired,
        hazardRadiusMeters,
    };
}
// ── Recommended Action ──
function deriveRecommendedAction(riskLevel, issueType, assetType) {
    if (riskLevel === 'Critical') {
        return `Immediate dispatch required. Isolate ${assetType.toLowerCase()} area and assign senior crew for ${issueType.toLowerCase()} repair.`;
    }
    if (riskLevel === 'High') {
        return `Priority repair needed within 24 hours. Schedule ${issueType.toLowerCase()} remediation for ${assetType.toLowerCase()}.`;
    }
    if (riskLevel === 'Medium') {
        return `Schedule maintenance within 7 days. Monitor ${issueType.toLowerCase()} progression on ${assetType.toLowerCase()}.`;
    }
    return `Log for routine maintenance cycle. Monitor ${assetType.toLowerCase()} condition during next scheduled inspection.`;
}
function mockAssistant(assetType, description, imageName) {
    const text = `${description} ${imageName || ''}`.toLowerCase();
    let suggestedIssueCategory = 'General Inspection Required';
    let suggestedSummary = `Field inspection recommended for ${assetType}.`;
    if (text.includes('crack') && (assetType === 'Road' || text.includes('asphalt'))) {
        suggestedIssueCategory = 'Asphalt Crack';
        suggestedSummary = `Asphalt crack detected on ${assetType.toLowerCase()}. Measure crack width and depth before repair.`;
    }
    else if (text.includes('crack')) {
        suggestedIssueCategory = 'Concrete Crack';
        suggestedSummary = `Concrete crack observed on ${assetType.toLowerCase()}. Structural assessment recommended.`;
    }
    else if (text.includes('pothole')) {
        suggestedIssueCategory = 'Pothole';
        suggestedSummary = `Pothole identified. Measure dimensions and assess traffic impact.`;
    }
    else if (text.includes('rust') || text.includes('corrosion')) {
        suggestedIssueCategory = 'Corrosion';
        suggestedSummary = `Corrosion detected on ${assetType.toLowerCase()}. Check structural integrity and coating.`;
    }
    else if (text.includes('water') || text.includes('leak')) {
        suggestedIssueCategory = 'Water Leakage';
        suggestedSummary = `Water leakage reported. Identify source and assess drainage.`;
    }
    else if (text.includes('cable')) {
        suggestedIssueCategory = 'Cable Exposure';
        suggestedSummary = `Exposed cables detected. Isolate area and test for live current.`;
    }
    else if (text.includes('light') || text.includes('lamp')) {
        suggestedIssueCategory = 'Lighting Failure';
        suggestedSummary = `Lighting malfunction reported. Check electrical connections and bulb status.`;
    }
    else if (text.includes('deform') || text.includes('surface')) {
        suggestedIssueCategory = 'Surface Deformation';
        suggestedSummary = `Surface deformation observed. Survey area for subsurface issues.`;
    }
    else if (text.includes('hazard') || text.includes('danger')) {
        suggestedIssueCategory = 'Worksite Hazard';
        suggestedSummary = `Worksite hazard identified. Secure perimeter immediately.`;
    }
    else if (text.includes('structural') || text.includes('damage')) {
        suggestedIssueCategory = 'Structural Damage';
        suggestedSummary = `Structural damage reported on ${assetType.toLowerCase()}. Engineering assessment required.`;
    }
    const suggestedPPE = ['High visibility vest', 'Safety boots'];
    const suggestedSafetyInstructions = [];
    let suggestedNextStep = 'Submit report and assign to maintenance team for review.';
    switch (assetType) {
        case 'Telecom Tower':
            suggestedPPE.push('Helmet', 'Safety harness', 'Insulated gloves');
            suggestedSafetyInstructions.push('Check wind conditions before climbing', 'Verify tower grounding');
            suggestedNextStep = 'Assign certified tower technician for inspection.';
            break;
        case 'Tunnel':
            suggestedPPE.push('Helmet', 'Waterproof boots', 'Respirator');
            suggestedSafetyInstructions.push('Check gas levels before entry', 'Ensure backup lighting available');
            suggestedNextStep = 'Schedule confined-space certified crew for assessment.';
            break;
        case 'Road':
            suggestedPPE.push('Traffic cones', 'Helmet');
            suggestedSafetyInstructions.push('Set up traffic diversion', 'Use reflective signage');
            suggestedNextStep = 'Assign road maintenance crew for repair scheduling.';
            break;
        case 'Bridge':
            suggestedPPE.push('Helmet', 'Gloves', 'Fall protection harness');
            suggestedSafetyInstructions.push('Inspect access scaffolding', 'Check load-bearing capacity');
            suggestedNextStep = 'Request structural engineer review before repair.';
            break;
        case 'Fiber Cabinet':
            suggestedPPE.push('Insulated gloves', 'Voltage detector');
            suggestedSafetyInstructions.push('Test for live current', 'Isolate circuit before work');
            suggestedNextStep = 'Dispatch telecom technician with isolation tools.';
            break;
        case 'Lighting Pole':
            suggestedPPE.push('Helmet', 'Insulated gloves');
            suggestedSafetyInstructions.push('Confirm power disconnected', 'Ladder safety check');
            suggestedNextStep = 'Schedule electrical crew for replacement/repair.';
            break;
        case 'Railway Segment':
            suggestedPPE.push('Helmet');
            suggestedSafetyInstructions.push('Confirm track closure with dispatcher');
            suggestedNextStep = 'Coordinate with rail operations for maintenance window.';
            break;
        case 'Construction Site':
            suggestedPPE.push('Helmet', 'Gloves');
            suggestedSafetyInstructions.push('Set up work zone barriers', 'Brief crew on hazards');
            suggestedNextStep = 'Review site safety plan and assign foreman.';
            break;
    }
    return {
        suggestedIssueCategory,
        suggestedSummary,
        suggestedPPE: [...new Set(suggestedPPE)],
        suggestedSafetyInstructions,
        suggestedNextStep,
    };
}
function createAuditEvent(action, user = 'System') {
    return {
        timestamp: new Date().toISOString(),
        action,
        user,
    };
}
function appendAuditEvent(existingTrail, action, user = 'System') {
    return [...existingTrail, createAuditEvent(action, user)];
}
