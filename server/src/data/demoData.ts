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

export const reports: Report[] = [
  {
    id: "RPT-001",
    assetName: "Bridge A21",
    assetType: "Bridge",
    locationName: "Ziya Bunyadov Ave",
    latitude: 40.4195,
    longitude: 49.8525,
    issueType: "Concrete Crack",
    severity: "High",
    confidence: 0.91,
    riskScore: 87,
    status: "Assigned",
    recommendedAction: "Dispatch structural engineering team for immediate crack assessment and temporary reinforcement.",
    createdAt: "2026-04-20T09:15:00Z",
    assignedTeam: "Structural Team Alpha",
    description: "Visible longitudinal crack detected on the main support beam of Bridge A21, approximately 2.3m in length.",
    explanation: [
      "Concrete crack detected with high confidence (91%)",
      "Bridge asset type carries highest structural importance weight (95)",
      "Crack length exceeds 2m threshold for elevated risk",
      "Located on primary load-bearing element"
    ]
  },
  {
    id: "RPT-002",
    assetName: "Road Segment R08",
    assetType: "Road",
    locationName: "Heydar Aliyev Ave",
    latitude: 40.4028,
    longitude: 49.8671,
    issueType: "Asphalt Crack",
    severity: "Medium",
    confidence: 0.85,
    riskScore: 63,
    status: "New",
    recommendedAction: "Schedule asphalt resurfacing within 30 days. Monitor for further deterioration.",
    createdAt: "2026-04-21T14:30:00Z",
    assignedTeam: "Road Maintenance Unit",
    description: "Network of alligator cracks across a 15m section of Heydar Aliyev Ave, indicating base failure.",
    explanation: [
      "Asphalt cracking pattern consistent with base layer deterioration",
      "Medium severity — not yet a safety hazard but progressing",
      "High-traffic corridor increases exposure risk",
      "Road asset importance factor: 75"
    ]
  },
  {
    id: "RPT-003",
    assetName: "Telecom Tower T14",
    assetType: "Telecom Tower",
    locationName: "Narimanov District",
    latitude: 40.4120,
    longitude: 49.8780,
    issueType: "Corrosion",
    severity: "High",
    confidence: 0.88,
    riskScore: 81,
    status: "In Progress",
    recommendedAction: "Apply anti-corrosion treatment and replace corroded bolts. Schedule full structural inspection.",
    createdAt: "2026-04-18T08:00:00Z",
    assignedTeam: "Telecom Infrastructure Unit",
    description: "Advanced surface corrosion detected on tower base joints and lower guy-wire anchors of Tower T14.",
    explanation: [
      "Corrosion detected on critical structural joints",
      "Telecom tower importance weight: 85",
      "Coastal climate accelerates corrosion rate",
      "Guy-wire anchor integrity affects tower stability"
    ]
  },
  {
    id: "RPT-004",
    assetName: "Tunnel T02",
    assetType: "Tunnel",
    locationName: "Baku Ring Road",
    latitude: 40.3950,
    longitude: 49.8200,
    issueType: "Water Leakage",
    severity: "Critical",
    confidence: 0.95,
    riskScore: 94,
    status: "New",
    recommendedAction: "Emergency waterproofing and drainage repair. Restrict traffic to single lane until resolved.",
    createdAt: "2026-04-22T06:45:00Z",
    assignedTeam: "Emergency Response Unit",
    description: "Significant water ingress through tunnel ceiling joints, creating pooling on road surface and potential electrical hazard.",
    explanation: [
      "Water leakage severity rated critical — electrical systems at risk",
      "Tunnel asset importance weight: 90",
      "Water pooling creates immediate traffic safety hazard",
      "Ceiling joint failure suggests membrane degradation"
    ]
  },
  {
    id: "RPT-005",
    assetName: "Fiber Cabinet F31",
    assetType: "Fiber Cabinet",
    locationName: "Yasamal District",
    latitude: 40.3985,
    longitude: 49.8450,
    issueType: "Cable Exposure",
    severity: "High",
    confidence: 0.82,
    riskScore: 78,
    status: "Assigned",
    recommendedAction: "Secure exposed cables with protective conduit. Replace damaged cabinet door seal.",
    createdAt: "2026-04-19T11:20:00Z",
    assignedTeam: "Fiber Network Team",
    description: "Cabinet door seal failure resulting in exposed fiber optic cables vulnerable to weather and vandalism.",
    explanation: [
      "Cable exposure detected — risk of service disruption",
      "Fiber cabinet importance weight: 80",
      "Exposed cables vulnerable to environmental damage",
      "Cabinet seal failure indicates age-related wear"
    ]
  },
  {
    id: "RPT-006",
    assetName: "Lighting Pole L19",
    assetType: "Lighting Pole",
    locationName: "28 May Area",
    latitude: 40.4093,
    longitude: 49.8671,
    issueType: "Lighting Failure",
    severity: "Medium",
    confidence: 0.79,
    riskScore: 55,
    status: "Resolved",
    recommendedAction: "Replace LED driver unit and check wiring connections. Verify power supply stability.",
    createdAt: "2026-04-15T16:00:00Z",
    assignedTeam: "Electrical Maintenance",
    description: "Intermittent lighting failure on pole L19 — light flickers and dims, likely driver unit malfunction.",
    explanation: [
      "Lighting failure pattern indicates driver malfunction",
      "Lighting pole importance weight: 50 (lower priority)",
      "Pedestrian area — safety concern at night",
      "Medium severity due to intermittent nature"
    ]
  },
  {
    id: "RPT-007",
    assetName: "Railway Segment RW03",
    assetType: "Railway Segment",
    locationName: "Baku–Sumgait Line",
    latitude: 40.4350,
    longitude: 49.8900,
    issueType: "Surface Deformation",
    severity: "High",
    confidence: 0.90,
    riskScore: 84,
    status: "Assigned",
    recommendedAction: "Impose speed restriction. Schedule rail grinding and ballast tamping within 7 days.",
    createdAt: "2026-04-17T07:30:00Z",
    assignedTeam: "Rail Engineering Unit",
    description: "Rail surface deformation (corrugation) detected on a 200m segment, causing excessive vibration.",
    explanation: [
      "Surface deformation exceeds tolerance threshold",
      "Railway segment importance weight: 88",
      "High-speed corridor — deformation amplifies at speed",
      "Vibration data correlates with corrugation pattern"
    ]
  },
  {
    id: "RPT-008",
    assetName: "Bridge B15",
    assetType: "Bridge",
    locationName: "Tbilisi Ave Overpass",
    latitude: 40.4250,
    longitude: 49.8380,
    issueType: "Concrete Crack",
    severity: "Critical",
    confidence: 0.94,
    riskScore: 96,
    status: "In Progress",
    recommendedAction: "Immediate load restriction. Deploy emergency structural supports. Schedule full bridge inspection.",
    createdAt: "2026-04-16T10:00:00Z",
    assignedTeam: "Structural Team Alpha",
    description: "Multiple transverse cracks on bridge deck with visible rebar exposure, indicating advanced deterioration.",
    explanation: [
      "Multiple cracks with rebar exposure — structural integrity compromised",
      "Bridge importance weight: 95 (highest)",
      "Crack pattern indicates shear stress failure",
      "Rebar exposure accelerates corrosion cycle"
    ]
  },
  {
    id: "RPT-009",
    assetName: "Road Segment R12",
    assetType: "Road",
    locationName: "Nizami Street",
    latitude: 40.3920,
    longitude: 49.8650,
    issueType: "Pothole",
    severity: "Medium",
    confidence: 0.87,
    riskScore: 61,
    status: "New",
    recommendedAction: "Fill pothole with hot-mix asphalt. Inspect surrounding area for additional sub-surface voids.",
    createdAt: "2026-04-23T13:15:00Z",
    assignedTeam: "Road Maintenance Unit",
    description: "Deep pothole (approx 30cm diameter, 8cm depth) in the outer lane of Nizami Street near intersection.",
    explanation: [
      "Pothole dimensions exceed repair threshold",
      "Located in vehicle wheel path — high impact zone",
      "Road importance weight: 75",
      "Intersection proximity increases accident risk"
    ]
  },
  {
    id: "RPT-010",
    assetName: "Telecom Tower T22",
    assetType: "Telecom Tower",
    locationName: "Sabunchu District",
    latitude: 40.4480,
    longitude: 49.9450,
    issueType: "Corrosion",
    severity: "Medium",
    confidence: 0.76,
    riskScore: 68,
    status: "New",
    recommendedAction: "Schedule anti-corrosion coating application. Monitor structural bolt torque values.",
    createdAt: "2026-04-24T09:45:00Z",
    assignedTeam: "Telecom Infrastructure Unit",
    description: "Early-stage surface corrosion on mid-section tower brackets, not yet affecting structural integrity.",
    explanation: [
      "Early-stage corrosion — preventive action recommended",
      "Telecom tower importance weight: 85",
      "Caspian Sea proximity increases corrosion risk",
      "Medium severity — no immediate structural concern"
    ]
  },
  {
    id: "RPT-011",
    assetName: "Lighting Pole L42",
    assetType: "Lighting Pole",
    locationName: "Flame Towers Area",
    latitude: 40.3593,
    longitude: 49.8372,
    issueType: "Lighting Failure",
    severity: "Low",
    confidence: 0.73,
    riskScore: 38,
    status: "Resolved",
    recommendedAction: "Replace lamp unit during next scheduled maintenance cycle.",
    createdAt: "2026-04-10T20:30:00Z",
    assignedTeam: "Electrical Maintenance",
    description: "Single lamp failure on decorative lighting pole near Flame Towers. Adjacent poles functioning normally.",
    explanation: [
      "Single lamp failure — minimal safety impact",
      "Lighting pole importance weight: 50",
      "Low severity — cosmetic/aesthetic concern primarily",
      "Decorative fixture — standard replacement part"
    ]
  },
  {
    id: "RPT-012",
    assetName: "Fiber Cabinet F08",
    assetType: "Fiber Cabinet",
    locationName: "Khatai District",
    latitude: 40.3870,
    longitude: 49.8820,
    issueType: "Cable Exposure",
    severity: "Medium",
    confidence: 0.81,
    riskScore: 65,
    status: "Assigned",
    recommendedAction: "Install cable protection sleeves and reseal cabinet entry points.",
    createdAt: "2026-04-22T15:00:00Z",
    assignedTeam: "Fiber Network Team",
    description: "Partially exposed fiber cables at cabinet entry point due to missing grommet seal.",
    explanation: [
      "Cable exposure at entry point — water ingress risk",
      "Fiber cabinet importance weight: 80",
      "Missing grommet indicates installation defect",
      "Medium severity — service disruption possible in rain"
    ]
  },
  {
    id: "RPT-013",
    assetName: "Tunnel T05",
    assetType: "Tunnel",
    locationName: "Bibi-Heybat Highway",
    latitude: 40.3230,
    longitude: 49.8180,
    issueType: "Concrete Crack",
    severity: "High",
    confidence: 0.89,
    riskScore: 85,
    status: "New",
    recommendedAction: "Conduct detailed crack mapping. Install crack monitors. Plan epoxy injection repair.",
    createdAt: "2026-04-25T08:30:00Z",
    assignedTeam: "Structural Team Beta",
    description: "Longitudinal crack along tunnel wall joint extending approximately 5 meters, with minor water seepage.",
    explanation: [
      "Crack with water seepage indicates membrane failure",
      "Tunnel importance weight: 90",
      "Crack length (5m) exceeds critical threshold",
      "Combined crack + water issue elevates risk"
    ]
  },
  {
    id: "RPT-014",
    assetName: "Road Segment R25",
    assetType: "Road",
    locationName: "Airport Highway",
    latitude: 40.4700,
    longitude: 50.0500,
    issueType: "Surface Deformation",
    severity: "High",
    confidence: 0.86,
    riskScore: 76,
    status: "In Progress",
    recommendedAction: "Mill and overlay affected section. Investigate sub-grade drainage issues.",
    createdAt: "2026-04-19T12:00:00Z",
    assignedTeam: "Road Maintenance Unit",
    description: "Road surface rutting and deformation on airport approach highway, affecting both lanes over 50m stretch.",
    explanation: [
      "Surface deformation on high-speed road — safety critical",
      "Road importance weight: 75",
      "Airport corridor — high traffic volume and speed",
      "Rutting depth suggests sub-grade moisture issue"
    ]
  }
];
