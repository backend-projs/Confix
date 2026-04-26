import { Router, Request, Response } from "express";
import { reports, Report } from "../data/demoData.js";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json(reports);
});

router.get("/:id", (req: Request, res: Response) => {
  const report = reports.find((r) => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found" });
  res.json(report);
});

router.post("/", (req: Request, res: Response) => {
  const body = req.body;
  const nextNum = reports.length + 1;
  const newReport: Report = {
    id: `RPT-${String(nextNum).padStart(3, "0")}`,
    assetName: body.assetName,
    assetType: body.assetType,
    locationName: body.locationName,
    latitude: body.latitude,
    longitude: body.longitude,
    issueType: body.issueType,
    severity: body.severity,
    confidence: body.confidence,
    riskScore: body.riskScore,
    status: "New",
    recommendedAction: body.recommendedAction,
    createdAt: new Date().toISOString(),
    assignedTeam: body.assignedTeam || "Unassigned",
    description: body.description,
    explanation: body.explanation || [],
  };
  reports.unshift(newReport);
  res.status(201).json(newReport);
});

router.patch("/:id/status", (req: Request, res: Response) => {
  const report = reports.find((r) => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found" });
  const { status } = req.body;
  if (status) report.status = status;
  res.json(report);
});

export default router;
