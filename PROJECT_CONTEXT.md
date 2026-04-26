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
│   │       └── stats.ts      # GET /api/stats — dashboard statistics
├── frontend/
│   ├── .env.local            # NEXT_PUBLIC_API_URL
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx        # Root layout: AppProvider + TopBar, dark bg #0e0e1a
│   │   │   ├── page.tsx          # Redirect to /dashboard
│   │   │   ├── globals.css       # Minimal global styles
│   │   │   ├── dashboard/page.tsx # Operations Dashboard with charts & stats
│   │   │   ├── report/page.tsx    # New Field Report form (map picker, image EXIF, AI)
│   │   │   ├── reports/page.tsx   # Reports list with search/filter + role-based access
│   │   │   ├── maintenance/page.tsx # Maintenance tasks with status updates
│   │   │   ├── map/page.tsx       # Interactive map with report markers + zoom
│   │   │   └── governance/page.tsx # Data governance principles
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
- Icons: `Gauge`, `PenLine`, `ClipboardList`, `HardHat`, `Globe2`, `BookLock`
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

---

## 9. AI Assistant — Current State

**The AI assistant is a mock implementation.** It does NOT use any real AI/LLM API.

- Located in `backend/src/utils.ts` → `mockAssistant()` function
- Uses simple keyword matching on the description text (e.g., "crack" → Asphalt Crack)
- Returns hardcoded suggestions based on asset type
- To make it real, you would need to:
  1. Add an `OPENAI_API_KEY` (or other LLM key) to `backend/.env`
  2. Replace `mockAssistant()` in `backend/src/routes/assistant.ts` with an actual API call
  3. The frontend code (`report/page.tsx`) already handles the response correctly — no frontend changes needed

**Note**: The mock assistant DOES work — it returns keyword-based suggestions. If it appears broken, check:
- Backend is running on port 5000
- CORS allows `http://localhost:3000`
- The description field is not empty (button is disabled when empty)

---

## 10. Database (Supabase)

- Project ID: `cpnhvqslermplvrnrkqf`
- Uses the `reports` table with RLS
- Key columns: `tenant_id`, `company_name`, `asset_name`, `asset_type`, `issue_type`, `location_name`, `latitude`, `longitude`, `impact`, `likelihood`, `risk_matrix_score`, `risk_level`, `status`, `required_ppe`, `safety_instructions`, `hazard_radius_meters`, etc.

---

## 11. Known Issues / Leftover Items

1. `Sidebar.tsx` still exists in `components/` but is unused — can be safely deleted
2. TypeScript lint warning on `LocationPicker` dynamic import (`IntrinsicAttributes`) — works at runtime, caused by `next/dynamic` type stripping
3. The AI assistant uses mock data — needs real LLM integration for production
4. Risk color utility functions in `utils.ts` still use light-themed colors (e.g., `bg-red-100 text-red-800`) which may not look perfect on dark backgrounds — consider dark variants

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

### All Pages
- Dark theme: `#0e0e1a` body, `#16162a` cards, purple gradient headers
- TopBar replaced sidebar as horizontal navigation
- Field Engineers blocked from Reports page
