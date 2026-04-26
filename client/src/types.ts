export interface Report {
  id: string;
  assetName: string;
  assetType: string;
  locationName: string;
  latitude: number;
  longitude: number;
  issueType: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  confidence: number;
  riskScore: number;
  status: "New" | "Assigned" | "In Progress" | "Resolved";
  recommendedAction: string;
  createdAt: string;
  assignedTeam: string;
  description: string;
  explanation: string[];
}

export interface AiResult {
  assetName: string;
  assetType: string;
  locationName: string;
  latitude: number;
  longitude: number;
  description: string;
  issueType: string;
  severity: string;
  confidence: number;
  riskScore: number;
  riskLevel: string;
  recommendedAction: string;
  explanation: string[];
}
