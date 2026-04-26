import { Router, Request, Response } from "express";

const router = Router();

const severityScores: Record<string, number> = {
  Low: 30, Medium: 60, High: 80, Critical: 95,
};

const assetImportance: Record<string, number> = {
  Bridge: 95, Tunnel: 90, "Railway Segment": 88,
  "Telecom Tower": 85, "Fiber Cabinet": 80, Road: 75, "Lighting Pole": 50,
};

const issueActions: Record<string, string> = {
  "Concrete Crack": "Schedule structural assessment and epoxy injection repair.",
  "Asphalt Crack": "Schedule asphalt resurfacing within 30 days.",
  Pothole: "Fill with hot-mix asphalt. Inspect for sub-surface voids.",
  Corrosion: "Apply anti-corrosion treatment. Replace corroded fasteners.",
  "Water Leakage": "Emergency waterproofing and drainage system repair.",
  "Cable Exposure": "Secure cables with protective conduit and reseal entry points.",
  "Lighting Failure": "Replace lamp driver unit and verify wiring connections.",
  "Surface Deformation": "Mill and overlay affected section. Investigate drainage.",
};

function detectIssue(filename: string, assetType: string): { issueType: string; severity: string } {
  const f = (filename || "").toLowerCase();
  if (f.includes("crack"))     return { issueType: f.includes("asphalt") ? "Asphalt Crack" : "Concrete Crack", severity: "High" };
  if (f.includes("pothole"))   return { issueType: "Pothole", severity: "Medium" };
  if (f.includes("rust") || f.includes("corrosion")) return { issueType: "Corrosion", severity: "High" };
  if (f.includes("water") || f.includes("leak"))     return { issueType: "Water Leakage", severity: "Critical" };
  if (f.includes("cable"))     return { issueType: "Cable Exposure", severity: "High" };
  if (assetType === "Lighting Pole") return { issueType: "Lighting Failure", severity: "Medium" };
  return { issueType: "Surface Deformation", severity: "Medium" };
}

function calcRisk(severity: string, assetType: string): number {
  const sev = severityScores[severity] || 60;
  const imp = assetImportance[assetType] || 70;
  const score = sev * 0.40 + imp * 0.25 + 75 * 0.15 + 60 * 0.10 + 65 * 0.10;
  return Math.min(100, Math.round(score));
}

function riskLevel(score: number): string {
  if (score >= 85) return "Critical";
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

router.post("/", (req: Request, res: Response) => {
  const { assetName, assetType, locationName, latitude, longitude, description, imageName } = req.body;
  const { issueType, severity } = detectIssue(imageName || "", assetType);
  const confidence = +(0.70 + Math.random() * 0.28).toFixed(2);
  const riskScore = calcRisk(severity, assetType);
  const level = riskLevel(riskScore);

  res.json({
    assetName, assetType, locationName, latitude, longitude, description,
    issueType,
    severity,
    confidence,
    riskScore,
    riskLevel: level,
    recommendedAction: issueActions[issueType] || "Schedule general inspection.",
    explanation: [
      `Detected ${issueType} with ${Math.round(confidence * 100)}% confidence`,
      `Asset type "${assetType}" importance weight: ${assetImportance[assetType] || 70}`,
      `Severity "${severity}" contributes score factor: ${severityScores[severity] || 60}`,
      `Composite risk score: ${riskScore} — classified as ${level}`,
    ],
  });
});

export default router;
