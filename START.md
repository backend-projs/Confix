You are senior full-stack developer with expertise in React, Node.js, and modern web technologies.

Project name: Confix

Goal:
Create an AI-assisted infrastructure inspection and maintenance prioritization platform for AZCON Holding. The platform helps field engineers upload infrastructure inspection reports/images, automatically detects possible issues using a mock AI analyzer, calculates risk score, prioritizes maintenance tasks, and shows all problem reports on an interactive map.

Important context:
We do NOT have real AZCON data. Therefore, use realistic synthetic/demo data and a mock AI analysis layer. The purpose of the MVP is to demonstrate the full workflow:
1. infrastructure asset monitoring,
2. issue reporting,
3. AI-assisted detection,
4. risk scoring,
5. maintenance prioritization,
6. map-based visualization.

Tech stack:
- Use React with Vite
- Use TypeScript
- Use Node.js with Express for backend API
- Use Tailwind CSS
- Use shadcn/ui components if possible, or create clean custom components if shadcn setup is too time-consuming
- Use React Router for routing
- Use Leaflet or React Leaflet for the map
- Use Recharts for charts
- Use local JSON/static demo data or in-memory storage on backend, no external database required
- The project must run locally with:
  - npm install
  - npm run dev
- Create a simple full-stack structure with separate client and server folders if appropriate
- Do not require paid APIs
- Do not require authentication
- Make the UI responsive and professional

Suggested project structure:
- /client for React Vite frontend
- /server for Node.js Express backend
- root package.json can use concurrently to run both frontend and backend
- Frontend should run on port 5173
- Backend should run on port 5000
- Configure CORS correctly
- API base URL can be http://localhost:5000/api

Required scripts:
At root level:
- npm run dev should start both client and server
- npm run client should start Vite client
- npm run server should start Express server

Main frontend routes:
1. / or /dashboard
2. /inspect
3. /reports
4. /maintenance
5. /map

Use a sidebar layout and render these routes with React Router.

Application concept:
AZCON AssetSense is a dashboard platform for roads, bridges, tunnels, telecom towers, lighting poles, fiber cabinets, railway segments, and other infrastructure assets. Field engineers can upload or create inspection reports. The system performs mock AI detection and calculates a risk score. High-risk issues are shown in maintenance queue and on the map.

Design style:
- Corporate, modern, clean
- Use AZCON-style professional colors: deep blue, cyan accents, white/light gray background
- Use clear cards, tables, badges, charts
- Use risk colors:
  - Critical: red
  - High: orange
  - Medium: yellow
  - Low: green
- Include icons where useful
- The app should look like a real enterprise SaaS product, not a simple student project

Backend requirements:
Create a Node.js + Express backend with these API endpoints:

1. GET /api/reports
Returns all reports.

2. GET /api/reports/:id
Returns a single report.

3. POST /api/inspect
Accepts inspection data:
- assetName
- assetType
- locationName
- latitude
- longitude
- description
- imageName or uploaded file metadata

Runs mock AI analyzer and risk scoring.
Returns AI analysis result but does not necessarily save it unless easier.

4. POST /api/reports
Creates a new report from AI analysis result and form data.
Adds it to in-memory reports array.
Returns created report.

5. PATCH /api/reports/:id/status
Updates report status.
Returns updated report.

6. Optional:
GET /api/stats
Returns dashboard stats. If not implemented, calculate stats on frontend.

No external database is required.
Use in-memory data array on backend.
Optionally persist to a local JSON file if easy, but not required.
If server restarts, demo data can reset.

Data model:
Create synthetic demo report/asset data with at least 12 reports.

Each report should have:
- id
- assetName
- assetType: Road, Bridge, Tunnel, Telecom Tower, Lighting Pole, Fiber Cabinet, Railway Segment
- locationName
- latitude
- longitude
- issueType: Asphalt Crack, Pothole, Concrete Crack, Corrosion, Water Leakage, Cable Exposure, Lighting Failure, Surface Deformation
- severity: Low, Medium, High, Critical
- confidence: number between 0.70 and 0.98
- riskScore: number between 0 and 100
- status: New, Assigned, In Progress, Resolved
- recommendedAction
- createdAt
- assignedTeam
- description
- explanation: array of strings explaining why AI/risk engine classified it this way

Use Baku/Azerbaijan coordinates for demo map data.

Example reports:
1. Bridge A21, Ziya Bunyadov Ave, issue Concrete Crack, High, risk 87
2. Road Segment R08, Heydar Aliyev Ave, issue Asphalt Crack, Medium, risk 63
3. Telecom Tower T14, Narimanov District, issue Corrosion, High, risk 81
4. Tunnel T02, Baku Ring Road, issue Water Leakage, Critical, risk 94
5. Fiber Cabinet F31, Yasamal District, issue Cable Exposure, High, risk 78
6. Lighting Pole L19, 28 May Area, issue Lighting Failure, Medium, risk 55
Add more realistic entries.

Core frontend features:

1. Dashboard page:
Fetch reports from backend.
Show summary cards:
- Total Reports
- Critical Issues
- High Risk Issues
- Average Risk Score
- Pending Maintenance
- Resolved This Week

Show charts using Recharts:
- Risk distribution chart
- Asset type breakdown chart
- Status distribution chart

Show:
- Top 5 highest risk reports
- Recent inspection reports
- Small embedded map preview or link/card to map page

2. Inspect page:
Create an inspection form with:
- Asset Name
- Asset Type dropdown
- Location Name
- Latitude
- Longitude
- Upload Image input
- Description textarea
- Analyze button

When user clicks Analyze:
Send form data or simplified JSON to POST /api/inspect.
Backend runs mock AI analyzer.

Mock AI logic:
- If uploaded filename includes "crack", return Concrete Crack or Asphalt Crack
- If filename includes "pothole", return Pothole
- If filename includes "rust" or "corrosion", return Corrosion
- If filename includes "water" or "leak", return Water Leakage
- If filename includes "cable", return Cable Exposure
- If assetType is Lighting Pole, possible issue can be Lighting Failure
- Otherwise return Surface Deformation or General Surface Damage

Also factor assetType into risk:
- Bridge and Tunnel should usually have higher asset importance
- Telecom Tower and Fiber Cabinet also important
- Lighting Pole lower
- Road medium/high

Calculate risk score using this formula:
riskScore =
severityScore * 0.40 +
assetImportance * 0.25 +
trafficExposure * 0.15 +
ageFactor * 0.10 +
weatherExposure * 0.10

Use these mappings:
severityScore:
Low = 30
Medium = 60
High = 80
Critical = 95

assetImportance:
Bridge = 95
Tunnel = 90
Telecom Tower = 85
Fiber Cabinet = 80
Railway Segment = 88
Road = 75
Lighting Pole = 50

Use default:
trafficExposure = 75
ageFactor = 60
weatherExposure = 65

Risk level:
0-39 Low
40-69 Medium
70-84 High
85-100 Critical

After analysis, show a polished AI Result card:
- Detected Issue
- Severity
- Confidence
- Risk Score
- Risk Level badge
- Recommended Action
- Explanation bullet points
- Button: Add to Reports

When Add to Reports is clicked:
Send POST /api/reports with the form data and AI result.
Then show success notification and redirect or update UI.

3. Reports page:
Fetch all reports from backend.
Show reports in searchable/filterable table.

Filters:
- Asset Type
- Severity
- Status
- Risk Level

Search by:
- asset name
- location
- issue type

Columns:
- Asset
- Type
- Location
- Issue
- Severity
- Risk Score
- Status
- Created At
- Action button to view details

Add report detail modal:
Show all report details including:
- description
- confidence
- explanation
- recommended action
- coordinates

4. Maintenance page:
Fetch all reports from backend.
Show maintenance queue sorted by riskScore descending.
Group or highlight Critical and High first.

Each row:
- Priority number
- Asset name
- Issue
- Risk score
- Status
- Assigned team
- Recommended action
- Status dropdown

Allow changing status:
New → Assigned → In Progress → Resolved

When status is changed:
Call PATCH /api/reports/:id/status.
Update frontend state.

5. Map page:
This is very important.
Create a full map view using Leaflet/React Leaflet.
Fetch all reports from backend.
Show all reports as markers on the map based on their latitude and longitude.

Marker color must represent risk level:
- Critical: red
- High: orange
- Medium: yellow
- Low: green

If custom colored markers are hard, use CircleMarker with colors.

Each marker popup must show:
- Asset Name
- Asset Type
- Location
- Issue Type
- Severity
- Risk Score
- Status
- Recommended Action
- Button/link text: View Report

Also add a right-side or bottom panel listing “Problem Reports on Map”.

This panel should show:
- Total visible problem reports
- Critical count
- High count
- List of reports sorted by riskScore

Clicking a report in the panel should focus/highlight the marker if easy; if not, show report details in a modal/panel.

Map should be centered around Baku:
latitude around 40.4093
longitude around 49.8671
zoom around 11 or 12

Use OpenStreetMap tiles:
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

Important:
The map must clearly show where problem reports are located.
This is a key requirement.

6. State management:
Use React state/hooks.
Fetch reports from backend.
Optionally use a simple ReportsContext to avoid repeated fetching.
After adding a new report, update frontend state or refetch reports.
After status update, update frontend state or refetch reports.

7. Components:
Create reusable frontend components:
- AppLayout
- Sidebar
- StatCard
- RiskBadge
- StatusBadge
- ReportTable
- ReportDetailModal
- MapView
- InspectionForm
- AiResultCard
- MaintenanceQueue
- DashboardCharts

8. UX requirements:
- Loading/analyzing state when clicking Analyze:
  “AI is analyzing inspection image…”
- Use toast notifications if possible:
  - “Analysis completed”
  - “Report added to maintenance queue”
  - “Status updated”
- Empty states where needed
- Make it polished and demo-ready
- No broken buttons
- No placeholder lorem ipsum

9. Content/copy:
Use English UI text, but make it understandable.

Example tagline:
“AI-assisted infrastructure inspection and maintenance prioritization for transport and telecom assets.”

Dashboard hero:
“Monitor critical infrastructure, detect risks earlier, and prioritize maintenance with data-driven insights.”

10. README:
Generate a complete README.md with:
- Project name
- Description
- Problem
- Solution
- Features
- Tech stack
- How to run locally
- API endpoints
- Demo data explanation
- Note that AI is simulated due to lack of real AZCON dataset
- Future roadmap:
  - real AZCON data integration
  - computer vision model training
  - drone inspection
  - mobile app for field engineers
  - ERP/maintenance system integration
  - predictive maintenance

11. No real AI requirement:
Do not connect to OpenAI, Gemini or any paid API.
Use mock AI analyzer only.
However, write the code in a way that the mock analyzer can later be replaced with a real computer vision API.

12. Quality:
- The code should be clean, typed, maintainable
- Avoid overengineering
- Prioritize working MVP
- Ensure there are no TypeScript errors
- Ensure npm run dev works from root
- Ensure frontend can communicate with backend
- Ensure Leaflet map works in Vite without errors

Final output expected from you:
- Create the full project code
- Include all required files for both client and server
- Make sure the site is functional
- Make the UI visually impressive for a hackathon demo
- Prioritize a working demo over complexity
- The map with problem reports is mandatory and must be clearly visible

Əgər AI coding tool böyük prompt-u yarımçıq icra etsə, bu qısa versiyanı istifadə edin:
textCopyBuild a full-stack MVP called AZCON AssetSense using React Vite + TypeScript frontend and Node.js Express backend.

Frontend:
- React Vite
- TypeScript
- Tailwind CSS
- React Router
- React Leaflet map
- Recharts charts

Backend:
- Node.js Express
- In-memory synthetic demo data
- CORS enabled
- Runs on port 5000

Root npm run dev should start both client and server.

Pages:
1. Dashboard
2. Inspect
3. Reports
4. Maintenance
5. Map

Features:
- Dashboard with stats and charts
- Inspection form with asset info, coordinates, image upload and description
- POST /api/inspect mock AI analyzer based on filename and asset type
- Risk score calculation
- Add report to backend with POST /api/reports
- Reports table with filters and detail modal
- Maintenance queue sorted by riskScore with status update using PATCH /api/reports/:id/status
- Interactive map centered on Baku showing all reports as colored CircleMarkers:
  red Critical, orange High, yellow Medium, green Low
- Map popup must show asset name, issue, severity, risk score, status and recommended action
- Add side panel on map listing “Problem Reports on Map” sorted by risk score

Use at least 12 demo reports around Baku.
No real AI API, no database, no auth.
Make UI modern, corporate, responsive and demo-ready.
Generate README.md.

Leaflet xəritə problem çıxarsa, bunu verin:
textCopyFix the React Leaflet map in Vite.

Requirements:
- Import leaflet CSS in the correct place.
- Use CircleMarker instead of default marker icons to avoid icon path issues.
- Center map on Baku: [40.4093, 49.8671], zoom 11 or 12.
- Show all reports as colored CircleMarkers based on risk level.
- Add popups with report details.
- Add side panel with problem reports sorted by riskScore.
- Ensure the map page does not crash and is responsive.

Ən sonda UI yaxşılaşdırmaq üçün:
textCopyImprove the UI to look like a premium enterprise SaaS dashboard.

Keep the same React Vite + Node.js Express architecture.
Do not break existing functionality.

Improve:
- sidebar design
- dashboard cards
- charts
- reports table
- maintenance queue
- map page layout
- risk/status badges
- spacing and typography
- responsive behavior

Fix any TypeScript or runtime errors.