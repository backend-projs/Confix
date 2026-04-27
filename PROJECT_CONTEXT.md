# Confix — Project Context & Continuation Guide

> This document exists so that a new AI chat session can pick up where the previous one left off.
> **Read this file first** before making any changes.

---

## 1. What is Confix?

Confix is an **infrastructure operations platform** for managing field reports, risk assessments, maintenance tasks, and worker safety across multi-tenant divisions (Transport, Telecom, Road Maintenance, Construction). It features AI-assisted report structuring, geospatial visualization, and role-based access control.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router, client components), React 18, TypeScript, Tailwind CSS |
| **Backend** | Express.js, TypeScript, ts-node-dev |
| **Database** | Supabase (PostgreSQL with RLS) |
| **Charts** | Recharts |
| **Icons** | lucide-react |
| **Maps** | react-leaflet + Leaflet (OpenStreetMap tiles) |
| **State** | React Context (`AppContext`) with localStorage persistence |

---

## 3. Project Structure

```
Confix/
├── package.json              # Root: concurrently runs backend + frontend
├── backend/
│   ├── .env                  # SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PORT, FRONTEND_URL
│   ├── src/
│   │   ├── index.ts          # Express app, CORS, routes
│   │   ├── supabaseClient.ts # Supabase client init
│   │   ├── utils.ts          # Risk matrix, safety derivation, mock AI assistant, audit trail
│   │   └── routes/
│   │       ├── reports.ts    # CRUD for reports
│   │       ├── assistant.ts  # POST /api/assistant — mock AI suggestions
│   │       ├── stats.ts      # GET /api/stats — dashboard statistics
│   │       ├── voiceReport.ts  # POST /api/voice-report/* — audio transcription + AI parsing
│   │       └── analyzeImage.ts # POST /api/analyze-image — vision AI + EXIF extraction
├── frontend/
│   ├── .env.local            # NEXT_PUBLIC_API_URL
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx        # Root layout: AppProvider + TopBar, dark bg #0e0e1a
│   │   │   ├── page.tsx          # Redirect to /dashboard
│   │   │   ├── globals.css       # Minimal global styles
│   │   │   ├── dashboard/page.tsx      # Operations Dashboard with charts & stats
│   │   │   ├── report/page.tsx         # New Field Report form (map picker, image EXIF, AI)
│   │   │   ├── reports/page.tsx        # Reports list with search/filter + role-based access
│   │   │   ├── maintenance/page.tsx    # Maintenance tasks with status updates
│   │   │   ├── map/page.tsx            # Interactive map with report markers + zoom
│   │   │   ├── voice-report/page.tsx   # Voice-to-report: record/type → AI parse → submit
│   │   │   ├── analyze-image/page.tsx  # Image AI: upload/camera → vision AI → EXIF → report
│   │   │   └── governance/page.tsx     # Data governance principles
│   │   ├── components/
│   │   │   ├── TopBar.tsx         # Horizontal nav bar (replaced sidebar)
│   │   │   ├── MapView.tsx        # Leaflet map with markers, hazard zones, flyTo zoom
│   │   │   ├── LocationPicker.tsx # Click-to-place map for New Report form
│   │   │   └── Sidebar.tsx        # DEPRECATED — no longer used in layout
│   │   ├── context/
│   │   │   └── AppContext.tsx     # Global state: selectedCompany, selectedRole
│   │   └── lib/
│   │       ├── api.ts            # Frontend API client (fetch wrappers)
│   │       └── utils.ts          # Constants, colors, formatters, risk helpers
```

---

## 4. Running the Project

```bash
cd Confix
npm run dev    # Runs both backend (port 5000) and frontend (port 3000) via concurrently
```

---

## 5. Design System

### Theme
- **Background**: `#0e0e1a` (body), `#16162a` (cards/panels)
- **Borders**: `border-white/5` or `border-white/[0.04]`
- **Text**: white for headings, `slate-300`–`slate-500` for body, `slate-600` for muted
- **Accent**: Purple gradient family (`#7c3aed` → `#a78bfa` → `#c4b5fd`)
- **Page headers**: `bg-gradient-to-br from-[#1a1145] via-[#302b63] to-[#0f172a]` with decorative blur orbs

### Navigation
- Horizontal top bar (`TopBar.tsx`) with gradient background
- Icons: `Gauge`, `PenLine`, `ClipboardList`, `HardHat`, `Globe2`, `Mic`, `ScanEye`, `BookLock`
- Company & role selectors in the top-right
- Active link: `bg-white/15 text-white`

### Charts (Dashboard)
- **Palette**: Monochrome purple gradients only (`RISK_SHADES` array)
- **Style**: No CartesianGrid, minimal axis labels (fontSize 9, fill `#475569`), no axis lines/tick lines
- **Tooltip**: Dark glass style `{ background: '#1a1a2e', border: 'none', borderRadius: 10, color: '#c4b5fd' }`
- **Layout**: 12-column grid with asymmetric splits

---

## 6. Role-Based Access Control

Roles (from `AppContext`, stored in localStorage):
- **Field Engineer** — Cannot see the Reports page (blocked with ShieldBan message)
- **Supervisor** — Full access
- **Company Admin** — Full access
- **Holding Executive** — Full access

The Reports nav link is hidden for Field Engineers in `TopBar.tsx` (should be — verify this).
The Reports page (`reports/page.tsx`) checks `selectedRole === 'Field Engineer'` and shows an access-restricted view.

---

## 7. Key Features by Page

### Dashboard (`dashboard/page.tsx`)
- 8 stat cards (monochrome purple, flat dark style)
- 4 charts: Risk donut, bar by company, area status overview, horizontal asset types
- 2 lists: Highest priority reports, latest reports
- All data from `fetchStats()` + `fetchReports()`

### New Report (`report/page.tsx`)
- **Location picker**: Interactive Leaflet map (`LocationPicker` component) — click to set coordinates
- **Image upload**: File input with preview + EXIF GPS metadata extraction (auto-fills lat/lng/location)
- **Risk assessment**: Pill-button selectors (no numeric values shown) — labels only (Minor, Moderate, Serious, Major, Critical / Rare, Unlikely, Possible, Likely, Almost Certain)
- **AI Assistant**: Sends description + asset type to `POST /api/assistant`, returns mock suggestions
- **Issue types**: Includes "Other" option
- Form submits to `POST /api/reports`

### Reports (`reports/page.tsx`)
- Searchable, filterable table of all reports
- Detail modal on click
- Role-gated: Field Engineers see access restriction message

### Maintenance (`maintenance/page.tsx`)
- List of maintenance tasks from reports
- Status updates, safety checklist completion, emergency alerts

### Map (`map/page.tsx`)
- Leaflet map with CircleMarker (risk-colored) + hazard zone Circles
- Side panel with report details or report list
- **Zoom-to-report**: Clicking a report (from list or map) triggers `map.flyTo()` to zoom level 16

### Governance (`governance/page.tsx`)
- Static content about data governance principles
- 8 cards with icons, descriptions, and item lists

---

## 8. API Endpoints (Backend)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/reports` | List reports (optional `?tenantId=`) |
| GET | `/api/reports/:id` | Get single report |
| POST | `/api/reports` | Create report |
| PATCH | `/api/reports/:id/status` | Update report status |
| PATCH | `/api/reports/:id/safety-checklist` | Complete safety checklist |
| POST | `/api/reports/:id/emergency-alert` | Trigger emergency alert |
| POST | `/api/assistant` | Get AI suggestions (mock — uses keyword matching, no real AI) |
| GET | `/api/stats` | Dashboard statistics |
| POST | `/api/voice-report/transcribe-and-parse` | Upload audio → Groq Whisper transcription → LLM field extraction |
| POST | `/api/voice-report/parse-text` | Manual text input → LLM field extraction |
| POST | `/api/analyze-image` | Upload image → EXIF extraction (exifr) → Vision AI analysis (Groq/OpenRouter) |

---

## 9. AI Features

### Mock AI Assistant (Report Form)
- Located in `backend/src/utils.ts` → `mockAssistant()` function
- Uses simple keyword matching on the description text
- Returns hardcoded suggestions based on asset type
- Called from `POST /api/assistant`

### Voice Report (`voice-report/page.tsx`)
- Record audio or type text → backend transcribes (Groq Whisper) → LLM extracts report fields
- Uses Groq as primary, OpenRouter as fallback
- Frontend displays parsed fields for review → user submits as report

### Image Analysis (`analyze-image/page.tsx`)
- **Upload/Camera**: Drag-drop, file picker, or device camera capture
- **EXIF Extraction**: Backend uses `exifr` to parse GPS coordinates + DateTimeOriginal from image metadata
- **Vision AI**: Image sent as base64 to Groq (`llama-4-scout-17b-16e-instruct`) primary, OpenRouter fallback (tries `gemini-2.5-flash`, `gemini-2.0-flash-001`, `gemini-2.0-flash-exp:free`)
- **System Prompt**: Infrastructure Forensic AI — classifies assets, diagnoses defects, extracts OCR text
- **Output**: Structured JSON with metadata, asset, diagnostics, spatial_context, exif
- **Report Creation Flow**:
  1. View AI analysis results + EXIF data card
  2. Click "Create Report" → **Location Step** (mandatory):
     - Auto-fills from EXIF GPS if available (backend + client-side extraction)
     - Otherwise: "Use My GPS" (browser geolocation) or "Select on Map" (interactive map)
     - User confirms location before proceeding
  3. Report form pre-filled from AI (asset type, issue type, description, severity→impact)
  4. User fills remaining fields (company, location name, likelihood, createdBy)
  5. Submit → `POST /api/reports` → redirect to Reports

### Environment Variables for AI
- `GROQ_API_KEY` — Groq API (Whisper + LLaMA vision)
- `OPENROUTER_API_KEY` — OpenRouter API (Gemini vision fallback)
- Both defined in `backend/.env`

---

## 10. Database (Supabase)

- Project ID: `cpnhvqslermplvrnrkqf`
- Uses the `reports` table with RLS
- Key columns: `tenant_id`, `company_name`, `asset_name`, `asset_type`, `issue_type`, `location_name`, `latitude`, `longitude`, `impact`, `likelihood`, `risk_matrix_score`, `risk_level`, `status`, `required_ppe`, `safety_instructions`, `hazard_radius_meters`, etc.

---

## 11. Known Issues / Leftover Items

1. `Sidebar.tsx` still exists in `components/` but is unused — can be safely deleted
2. TypeScript lint warning on `LocationPicker` dynamic import (`IntrinsicAttributes`) — works at runtime, caused by `next/dynamic` type stripping
3. The mock AI assistant (`/api/assistant`) uses keyword matching — real LLM integration exists only in voice report and image analysis
4. Risk color utility functions in `utils.ts` still use light-themed colors (e.g., `bg-red-100 text-red-800`) which may not look perfect on dark backgrounds — consider dark variants
5. Camera capture (canvas-based) does not embed EXIF metadata — EXIF GPS only works with uploaded photos from devices

---

## 12. Recent Changes (Latest Session)

### Dashboard
- Changed icon from `Zap` to `LayoutGrid`
- Monochrome purple gradient palette for all charts (no multi-color)
- 12-column grid layout with asymmetric splits
- Removed CartesianGrid from all charts
- Flat dark stat cards with subtle purple icon badges

### New Report
- Replaced lat/lng text inputs with interactive `LocationPicker` map component
- Added image upload with EXIF GPS metadata extraction
- Risk assessment uses pill-button selectors (no numeric values)
- Added "Other" to issue types

### Map
- Added `focusReport` prop to `MapView` — `FlyToReport` component uses `map.flyTo()` to zoom to selected report

### Voice Report (NEW)
- Full voice-to-report pipeline: record audio → Groq Whisper → LLM field extraction
- Manual text input option as alternative
- Parsed fields displayed for review before submission

### Image Analysis (NEW)
- Upload or camera capture → EXIF GPS extraction (backend `exifr`) → Vision AI analysis
- Analysis result cards: Metadata, EXIF Data, Asset, Diagnostics, Spatial Context
- Report creation flow with mandatory location step (EXIF → GPS → Map)
- Pre-fills report form from AI output (asset type, defect→issue type, severity→impact)
- Groq primary + OpenRouter multi-model fallback
- i18n support: EN, RU, AZ

### All Pages
- Dark theme: `#0e0e1a` body, `#16162a` cards, purple gradient headers
- TopBar replaced sidebar as horizontal navigation (added Voice Report + Image AI links)
- Field Engineers blocked from Reports page
- Full i18n translations for all new features
