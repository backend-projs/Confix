> Leila:
You are a 30-year senior full-stack engineer, system architect, database designer, and product-minded technical lead.

Build a complete, working, polished hackathon MVP for a platform called “Confix”.

This project must use:

Frontend:
- Next.js with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui if possible, otherwise clean custom components
- Recharts for charts
- React Leaflet / Leaflet for maps
- lucide-react for icons

Backend:
- Node.js
- Express.js
- TypeScript preferred, JavaScript acceptable if faster
- REST API
- CORS enabled
- dotenv for environment variables

Database:
- Supabase PostgreSQL
- Use @supabase/supabase-js
- Store real reports in Supabase PostgreSQL
- I have already created the database schema and seed data via mcp server. project name in supabase is ACELA
- Provide SQL schema/migration file
- Seed database with realistic demo data
- No authentication required for MVP, but simulate roles and company views in frontend

Project structure:
- /frontend for Next.js app
- /backend for Node.js Express API
- root package.json can run both frontend and backend with concurrently

Ports:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API base URL: http://localhost:5000/api

Root scripts:
- npm run dev => starts both frontend and backend
- npm run frontend => starts Next.js frontend
- npm run backend => starts Express backend

The project must run with:
npm install
npm run dev

==================================================
PROJECT NAME
==================================================

Confix

Tagline:
Smart Field Reporting & Safety Operations for Critical Infrastructure

One-liner:
Confix turns field issues into structured, trackable, map-based and safety-controlled maintenance workflows.

==================================================
CORE PRODUCT IDEA
==================================================

Confix is a field reporting and maintenance coordination platform for transport, telecom, and critical infrastructure assets.

The platform allows field engineers and supervisors to:
- create structured infrastructure issue reports,
- attach location and optional image metadata,
- manually assess risk using a standard Impact × Likelihood matrix,
- visualize all problem reports on an interactive map,
- prioritize maintenance work,
- enforce worker safety checklists,
- track report status,
- maintain audit history,
- separate data by company/division using a simple multi-tenant data model.

Confix does NOT replace engineers.
Confix supports engineers by standardizing reporting, improving visibility, enforcing safety checks, and creating structured data for future AI models.

==================================================
CRITICAL PRODUCT PRINCIPLE
==================================================

AI must NOT make final risk decisions.

Use this philosophy throughout the product:

“AI is an assistant, not a decision-maker.”

AI/mock assistant can provide:
- suggested issue category,
- suggested report summary,
- suggested PPE,
- suggested safety instructions,
- recommended next review step.

But final risk classification must be human-led using a Risk Matrix.

Display this clearly in the UI:
“Final risk classification is engineer-reviewed.”

Do NOT call anything “AI Risk Score”.
Use:
“Engineer-reviewed Risk Matrix”
or
“Impact × Likelihood Risk Matrix”

==================================================
WHY THIS MATTERS
==================================================

This product should feel credible to a senior infrastructure operations manager.

Do not overpromise AI.

The main operational value is:
- replacing WhatsApp/Excel/paper-based field issue tracking,
- standardizing reports,
- showing issues on a map,
- prioritizing maintenance,
- improving worker safety,
- creating audit trails,
- separating data between divisions,
- preparing structured data for future AI/predictive maintenance.

==================================================
TECHNICAL ARCHITECTURE
==================================================

Frontend:
Next.js App Router app in /frontend.

Backend:
Express REST API in /backend.

Database:
Supabase PostgreSQL.

> Leila:
Frontend communicates only with backend:
Next.js frontend should call:
http://localhost:5000/api/...

Do not call Supabase directly from frontend for this MVP.
Backend owns database access.

Use environment variables.

Backend .env:
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PORT=5000
FRONTEND_URL=http://localhost:3000

Frontend .env.local:
NEXT_PUBLIC_API_URL=http://localhost:5000/api

Security note:
Do not expose SUPABASE_SERVICE_ROLE_KEY to frontend.

==================================================
WHAT NOT TO DO
==================================================

Do NOT:
- use React Vite,
- use Next.js API routes as backend,
- use OpenAI, Gemini, or paid AI APIs,
- require authentication,
- make AI calculate final risk,
- create a toy-looking UI,
- leave broken buttons,
- use lorem ipsum,
- create only static mockups,
- store the main data only in localStorage,
- expose Supabase service role key in frontend.

==================================================
MAIN ROUTES - FRONTEND
==================================================

Create these Next.js frontend routes:

1. /dashboard
2. /report
3. /reports
4. /maintenance
5. /map
6. /governance

Redirect / to /dashboard.

Use a professional sidebar layout.

Sidebar menu:
- Dashboard
- New Report
- Reports
- Maintenance
- Map
- Governance

Top bar:
- Current Company View selector
- Current Role selector

==================================================
COMPANY / MULTI-TENANT SIMULATION
==================================================

Confix must simulate a multi-tenant model.

Companies/divisions:
- Holding Overview
- Transport Division
- Telecom Division
- Road Maintenance
- Construction Projects

Roles:
- Field Engineer
- Supervisor
- Company Admin
- Holding Executive

Every report must have:
- tenant_id
- company_name

Example tenant IDs:
- transport
- telecom
- road-maintenance
- construction

Filtering:
- If Holding Overview is selected, show cross-company overview.
- If a specific company is selected, show only that company’s reports.
- Holding Executive can see aggregated view.
- For restricted/critical reports, exact coordinates/details may be masked in UI explanations.

No real auth is needed.
Use selectors to simulate role and company view.

Store current company and role in frontend state and optionally localStorage.

==================================================
SUPABASE POSTGRESQL DATABASE
==================================================

Create SQL schema file:

/supabase/schema.sql

Create seed file:

/supabase/seed.sql

Or create backend seed script:

/backend/scripts/seed.ts or seed.js

Use a PostgreSQL table called:

reports

Required columns:

id UUID primary key default gen_random_uuid()
tenant_id text not null
company_name text not null
asset_name text not null
asset_type text not null
location_name text not null
latitude numeric not null
longitude numeric not null
issue_type text not null
description text not null
image_name text
status text not null
impact integer not null
likelihood integer not null
risk_matrix_score integer not null
risk_level text not null
created_at timestamptz default now()
created_by text not null
assigned_team text
supervisor_reviewed boolean default false
recommended_action text
ai_suggestion jsonb
required_ppe jsonb
safety_instructions jsonb
worker_safety_level text
minimum_crew integer
supervisor_approval_required boolean default false
hazard_radius_meters integer
safety_checklist_completed boolean default false
visibility_level text not null
exact_coordinates_restricted boolean default false
audit_trail jsonb default '[]'::jsonb

Optional updated_at column:
updated_at timestamptz default now()

Allowed asset types:
- Road
- Bridge
- Tunnel
- Telecom Tower
- Fiber Cabinet
- Lighting Pole
- Railway Segment
- Construction Site

Allowed issue types:
- Asphalt Crack
- Pothole
- Concrete Crack
- Corrosion
- Water Leakage
- Cable Exposure
- Lighting Failure
- Surface Deformation
- Structural Damage
- Worksite Hazard

Allowed statuses:
- New
- Reviewed
- Assigned
- In Progress
- Resolved
- Verified

> Leila:
Allowed visibility levels:
- Internal
- Restricted
- Critical

Seed at least 18 realistic synthetic reports around Baku/Azerbaijan.

Map center:
lat: 40.4093
lng: 49.8671

Example reports:
1. Bridge A21, Ziya Bunyadov Ave, Concrete Crack, Transport Division
2. Road Segment R08, Heydar Aliyev Ave, Asphalt Crack, Road Maintenance
3. Telecom Tower T14, Narimanov District, Corrosion, Telecom Division
4. Tunnel T02, Baku Ring Road, Water Leakage, Transport Division
5. Fiber Cabinet F31, Yasamal District, Cable Exposure, Telecom Division
6. Lighting Pole L19, 28 May Area, Lighting Failure, Road Maintenance
7. Railway Segment RS05, Bilajari Area, Surface Deformation, Transport Division
8. Construction Site C07, White City Area, Worksite Hazard, Construction Projects

Add more realistic entries.

==================================================
RISK MATRIX - VERY IMPORTANT
==================================================

Do NOT use AI-generated risk score.

Use human-led standard risk matrix.

In the new report form, the user must select:

Impact:
1 - Minor
2 - Moderate
3 - Serious
4 - Major
5 - Critical

Likelihood:
1 - Rare
2 - Unlikely
3 - Possible
4 - Likely
5 - Almost Certain

Calculate:
riskMatrixScore = impact * likelihood

Risk Level:
1-4 = Low
5-9 = Medium
10-16 = High
17-25 = Critical

Use this risk level everywhere:
- dashboard stats,
- reports table,
- maintenance priority,
- map marker color,
- hazard zones.

Label it clearly:
“Engineer-reviewed Risk Matrix”

Show formula in UI:
Impact × Likelihood = Risk Score

Add note:
“Final risk classification is engineer-reviewed.”

==================================================
AI ASSISTANT - LIMITED ROLE
==================================================

Implement a mock AI assistant in backend.

The mock AI assistant can analyze:
- issue description,
- selected asset type,
- image filename if provided.

It should return:
- suggestedIssueCategory
- suggestedSummary
- suggestedPPE
- suggestedSafetyInstructions
- suggestedNextStep

Mock logic:
- If text or filename includes “crack”, suggest Concrete Crack or Asphalt Crack
- If includes “pothole”, suggest Pothole
- If includes “rust” or “corrosion”, suggest Corrosion
- If includes “water” or “leak”, suggest Water Leakage
- If includes “cable”, suggest Cable Exposure
- If assetType is Telecom Tower, include safety harness and wind check
- If assetType is Tunnel, include gas level check and waterproof boots
- If assetType is Road, include traffic cones and high visibility vest

Important:
The AI assistant must NOT output final risk level.
The AI assistant must NOT calculate risk score.

Display an AI Assistant panel with:
- Suggested Category
- Suggested Summary
- Suggested PPE
- Suggested Safety Instructions
- Suggested Next Step

Add disclaimer:
“AI suggestions support the engineer. Final risk assessment is manual and supervisor-reviewed.”

==================================================
WORKER SAFETY MODULE
==================================================

Worker safety is a key differentiator.

For every report/task, derive:
- required_ppe
- safety_instructions
- worker_safety_level
- minimum_crew
- supervisor_approval_required
- hazard_radius_meters
- safety_checklist_completed

This safety information can be rule-based.

Rules:

All tasks:
- High visibility vest
- Safety boots

Road:
- Traffic cones
- High visibility vest
- Safety boots

Bridge:
- Helmet
- Gloves
- Fall protection for High/Critical risk

Tunnel:
- Helmet
- Waterproof boots
- Gas level check
- Respirator if Water Leakage

Telecom Tower:
- Helmet
- Safety harness
- Insulated gloves
- Wind condition check

Fiber Cabinet or Cable Exposure:
- Insulated gloves
- Voltage detector
- Safety boots

Lighting Pole:
- Helmet
- Insulated gloves
- Ladder safety check

Construction Site:
- Helmet
- Safety boots
- Gloves
- Work zone barrier

Worker safety level:
- Critical risk => Critical safety level
- High risk => High safety level
- Medium => Medium
- Low => Low

Minimum crew:
- Critical => 2 or 3
- High => 2
- Medium/Low => 1

> Leila:
- Tunnel, Telecom Tower, Bridge should usually require at least 2 for High/Critical

Supervisor approval required for:
- High
- Critical
- Tunnel tasks
- Telecom Tower tasks
- Cable Exposure
- Water Leakage

Hazard radius:
- Critical: 150 meters
- High: 100 meters
- Medium: 50 meters
- Low: 25 meters

==================================================
BACKEND EXPRESS API
==================================================

Create Express REST API.

Base URL:
http://localhost:5000/api

Required endpoints:

1. GET /api/health
Returns:
{ "status": "ok" }

2. GET /api/reports
Returns all reports from Supabase.
Support optional query filters:
- tenantId
- companyName
- status
- riskLevel
- assetType
- issueType
- visibilityLevel
- search

3. GET /api/reports/:id
Returns one report.

4. POST /api/assistant
Accepts:
- assetType
- description
- imageName

Returns AI assistant suggestions only.
No risk score.

5. POST /api/reports
Creates a new report.

Input:
- tenantId
- companyName
- assetName
- assetType
- locationName
- latitude
- longitude
- issueType
- description
- imageName
- impact
- likelihood
- createdBy
- assignedTeam
- visibilityLevel

Backend calculates:
- risk_matrix_score = impact * likelihood
- risk_level
- recommended_action
- safety fields
- audit_trail initial events

Insert report into Supabase.
Return created report.

6. PATCH /api/reports/:id/status
Input:
- status

Updates report status in Supabase.
Adds audit trail event:
“Status changed from X to Y”

Return updated report.

7. PATCH /api/reports/:id/safety-checklist
Input:
- completed: boolean

Marks safety checklist completed.
If completed is true and status is Assigned or Reviewed, update status to In Progress.
Adds audit trail event:
“Safety checklist completed”
Return updated report.

8. POST /api/reports/:id/emergency-alert
No real SMS/API.
Adds audit trail event:
“Emergency alert triggered”
Return:
{ message: "Emergency alert sent to supervisor with task and location details." }

9. GET /api/stats
Returns dashboard stats calculated from Supabase reports:
- totalReports
- criticalReports
- highRiskReports
- pendingMaintenance
- activeHazardZones
- safetyChecklistsPending
- supervisorReviewsPending
- averageRiskMatrixScore
- riskDistribution
- assetTypeBreakdown
- statusDistribution
- reportsByCompany

If this endpoint is too time-consuming, calculate stats in frontend from GET /api/reports.

==================================================
BACKEND UTILITY FUNCTIONS
==================================================

Create clean backend utility functions:

calculateRiskMatrixScore(impact, likelihood)

getRiskLevel(score):
1-4 Low
5-9 Medium
10-16 High
17-25 Critical

deriveRecommendedAction(riskLevel, issueType, assetType)

deriveSafetyFields(reportInput, riskLevel):
- requiredPPE
- safetyInstructions
- workerSafetyLevel
- minimumCrew
- supervisorApprovalRequired
- hazardRadiusMeters

mockAssistant({ assetType, description, imageName })

appendAuditEvent(existingAuditTrail, event)

==================================================
FRONTEND PAGES
==================================================

==================================================
1. DASHBOARD PAGE
==================================================

Dashboard should look enterprise-grade.

Hero:
“Monitor field issues, safety risks and maintenance workflows across critical infrastructure.”

Summary cards:
- Total Reports
- Critical Reports
- High Risk Reports
- Pending Maintenance
- Active Hazard Zones
- Safety Checklists Pending
- Supervisor Reviews Pending
- Average Risk Matrix Score

Charts using Recharts:
- Risk Level Distribution
- Asset Type Breakdown
- Status Distribution
- Reports by Company/Division

Show:
- Top 5 highest priority reports
- Recent reports
- Digital Trust mini panel:
  - Multi-tenant separation: Enabled
  - Role-based access simulation: Active
  - Audit trail: Active
  - Sensitive data masking: Enabled

Use company/role selector filtering.

==================================================
2. NEW REPORT PAGE

> Leila:
==================================================

Create structured field report form.

Sections:

A) Asset Information
- Company/Division
- Asset Name
- Asset Type
- Location Name
- Latitude
- Longitude

B) Issue Details
- Issue Type dropdown
- Description textarea
- Optional image upload input or image filename
- Visibility Level

C) AI Assistant
Button:
“Get AI Assistant Suggestions”

When clicked:
- call POST /api/assistant
- show loading:
  “AI assistant is structuring the report…”
- display:
  - Suggested Category
  - Suggested Summary
  - Suggested PPE
  - Suggested Safety Instructions
  - Suggested Next Step

Disclaimer:
“AI does not determine final risk. Final classification is engineer-reviewed.”

D) Human Risk Assessment
Impact dropdown:
1 Minor, 2 Moderate, 3 Serious, 4 Major, 5 Critical

Likelihood dropdown:
1 Rare, 2 Unlikely, 3 Possible, 4 Likely, 5 Almost Certain

Show live calculation:
Impact × Likelihood = Score
Risk Level: Low/Medium/High/Critical

Label:
“Engineer-reviewed Risk Matrix”

E) Submit
Button:
“Create Field Report”

After submission:
- call POST /api/reports
- show success message
- redirect to /reports or /maintenance

==================================================
3. REPORTS PAGE
==================================================

Show searchable/filterable report table.

Fetch from backend.

Filters:
- Company
- Asset Type
- Issue Type
- Status
- Risk Level
- Visibility Level

Search:
- asset name
- location
- description
- issue type

Columns:
- ID
- Company
- Asset
- Type
- Location
- Issue
- Impact
- Likelihood
- Risk Score
- Risk Level
- Status
- Supervisor Reviewed
- Created At
- Actions

Risk badges:
- Low green
- Medium yellow
- High orange
- Critical red

Report details modal:
Show:
- all report info
- risk matrix explanation
- AI assistant suggestions
- worker safety protocol
- required PPE
- safety instructions
- minimum crew
- supervisor approval requirement
- audit trail
- coordinates
- visibility level
- data governance note if restricted

==================================================
4. MAINTENANCE PAGE
==================================================

Show maintenance queue sorted by:
1. Critical risk first
2. High risk
3. risk_matrix_score descending
4. newest first

Columns:
- Priority
- Company
- Asset
- Issue
- Risk Level
- Risk Score
- Worker Safety Level
- Required PPE
- Minimum Crew
- Supervisor Approval
- Status
- Assigned Team
- Actions

Actions:
- Change status dropdown
- Start Task button
- Emergency Alert button
- View Details

Start Task:
Open Safety Check-in modal.

Safety Check-in modal:
Show required PPE checklist.
User must check every PPE item.

Confirmations:
- I am wearing required PPE
- Work area is secured
- Supervisor has been notified if required
- Emergency contact is available
- I understand the hazard

Task can only start if all required checkboxes are checked.

When confirmed:
- call PATCH /api/reports/:id/safety-checklist
- update status to In Progress if appropriate
- show success message:
“Safety check-in completed. Task started.”

Emergency Alert:
- call POST /api/reports/:id/emergency-alert
- show message:
“Emergency alert sent to supervisor with task and location details.”

==================================================
5. MAP PAGE - MANDATORY
==================================================

This page is extremely important.

Use React Leaflet safely in Next.js.

React Leaflet depends on browser APIs.
Avoid SSR errors:
- Put map logic inside a client component.
- Add "use client" at top of map components.
- Dynamically import map component with ssr: false.
- Import leaflet/dist/leaflet.css correctly.
- Use CircleMarker instead of default Marker icons.

Map center:
[40.4093, 49.8671]
Zoom: 11 or 12

Use OpenStreetMap tiles:
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

Show all visible reports as CircleMarkers.

Marker color by risk_level:
- Low: green
- Medium: yellow
- High: orange
- Critical: red

For High and Critical reports:
Draw hazard radius circles around markers:
- High: orange circle

> Leila:
- Critical: red circle

Popup content:
- Asset Name
- Company
- Asset Type
- Location
- Issue Type
- Impact
- Likelihood
- Risk Matrix Score
- Risk Level
- Status
- Worker Safety Level
- Required PPE
- Minimum Crew
- Supervisor Approval Required
- Recommended Action
- View Report button/text

Add right-side panel:
Title:
“Problem Reports on Map”

Panel stats:
- Total visible reports
- Critical count
- High count
- Active hazard zones

List reports sorted by risk_matrix_score descending.

Clicking a report:
- open detail panel/modal or highlight selected report if easy.

Important:
The map must clearly show problem reports and hazard zones.
This is a key demo feature.

==================================================
6. GOVERNANCE PAGE
==================================================

Create page explaining data governance and multi-tenant approach.

Show cards:
- Multi-tenant Data Separation
- Role-based Access Simulation
- Aggregated Holding Overview
- Sensitive Location Masking
- Worker Data Protection
- Audit Trail
- Least Privilege Principle

Explanation:
“Confix does not expose all company data to everyone. Each company/division’s data is logically separated. Holding-level users can view aggregated indicators, while sensitive operational details can be masked based on policy.”

Show simple table:
Role vs Access Level

Field Engineer:
- own/team reports
- create field reports
- complete safety checklist

Supervisor:
- company/team reports
- assign and review
- approve high-risk tasks

Company Admin:
- company-wide reports
- operational dashboard

Holding Executive:
- aggregated cross-company dashboard
- restricted details masked

Also show recent audit events from reports.

==================================================
UI / UX REQUIREMENTS
==================================================

Design style:
- modern enterprise SaaS
- serious and corporate
- deep blue/navy sidebar
- cyan/blue accent
- white/light-gray content
- clean cards
- professional tables
- strong visual hierarchy

Use badges for:
- risk level
- status
- safety level
- visibility level

Use icons.

Make responsive.

Use loading states and success/error messages.

No lorem ipsum.

No broken flows.

All important buttons should work.

==================================================
FRONTEND STATE MANAGEMENT
==================================================

Use React state/hooks inside Next.js client components.

Fetching:
- Fetch reports from Express backend.
- Refetch after creating report or changing status.
- Optional: create simple context for reports.

Company and role selectors:
- store in React state and optionally localStorage.
- use them to filter visible reports.

No Redux needed.

==================================================
NEXT.JS MAP REQUIREMENT
==================================================

React Leaflet must not break Next.js SSR.

Implementation requirement:
- /components/MapClient.tsx must be a client-only component.
- /components/MapView.tsx can dynamically import MapClient with ssr: false.
- Use CircleMarker and Circle.
- Do not use default Marker icons unless properly configured.

==================================================
README
==================================================

Generate complete README.md.

Include:
- Project name: Confix
- Description
- Problem statement
- Solution
- Why risk is human-led
- AI assistant role
- Features
- Tech stack
- Architecture
- API endpoints
- Supabase setup instructions
- Environment variables
- How to run locally
- Database schema and seed instructions
- Demo data explanation
- Multi-tenant/data governance explanation
- Worker safety module
- Hackathon theme alignment:
  1. AI & Intelligent Systems
  2. Telecom & Connectivity Solutions
  3. Transport & Smart Mobility
  4. Integrated Digital Infrastructure
  5. Cybersecurity & Digital Trust
  6. Open Innovation
- Future roadmap:
  - real company data integration
  - mobile field worker app
  - real computer vision assistant
  - duplicate report detection
  - drone inspection
  - IoT sensor integration

> Leila:
- ERP/maintenance system integration
  - SSO/RBAC
  - predictive maintenance after enough structured data is collected

==================================================
HACKATHON THEME ALIGNMENT
==================================================

The product should support these themes:

1. AI & Intelligent Systems
AI is used only as assistant:
- report summary
- category suggestion
- PPE suggestion
- safety instruction suggestion

2. Telecom & Connectivity Solutions
Supports:
- telecom towers
- fiber cabinets
- cable exposure
- connectivity infrastructure issues

3. Transport & Smart Mobility
Supports:
- roads
- bridges
- tunnels
- railway segments
- potholes
- cracks
- transport infrastructure safety

4. Integrated Digital Infrastructure
Unifies:
- field reporting
- maps
- maintenance workflow
- safety checks
- audit trail
- company-level dashboards

5. Cybersecurity & Digital Trust
Includes:
- multi-tenant separation concept
- role-based access simulation
- data masking explanation
- audit trail
- visibility levels
- backend-controlled database access

6. Open Innovation
Ready for:
- drones
- IoT sensors
- ERP integration
- real AI models
- mobile app
- government/private infrastructure data integration

==================================================
FINAL QUALITY EXPECTATION
==================================================

Build the actual working project.

Do not only describe it.

Create all required files.

Ensure:
- npm install works
- npm run dev works
- frontend runs on localhost:3000
- backend runs on localhost:5000
- backend connects to Supabase
- SQL schema exists
- seed data exists
- frontend communicates with Express API
- reports can be created and saved to Supabase
- risk matrix works
- map works without SSR errors
- maintenance status can be updated
- safety checklist modal works
- emergency alert action works
- dashboard updates based on database data
- governance page exists
- README exists

Prioritize a realistic working demo over unnecessary complexity.

The final product must be impressive enough for a hackathon demo and realistic enough that an experienced infrastructure operations manager would take it seriously.
