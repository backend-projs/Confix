# Confix — Smart Field Reporting & Safety Operations Platform

An enterprise SaaS platform for field reporting, risk assessment, maintenance coordination, and safety operations in critical infrastructure. Built for hackathon demonstration with real Supabase persistence.

## Architecture

| Layer      | Technology                                             |
| ---------- | ------------------------------------------------------ |
| Frontend   | Next.js 14 (App Router), TypeScript, Tailwind CSS      |
| Charts     | Recharts                                               |
| Map        | React Leaflet + OpenStreetMap (client-only)             |
| Icons      | Lucide React                                           |
| Backend    | Express.js, TypeScript, CORS                           |
| Database   | Supabase PostgreSQL (persistent)                       |
| AI         | Mock assistant (advisory only, no paid APIs)           |

## Key Features

- **Dashboard** — Summary cards, risk distribution charts, asset breakdowns, top priority and recent reports
- **New Report** — Structured form with AI assistant suggestions and human-led Risk Matrix (Impact × Likelihood)
- **Reports** — Filterable table with search, detail modal showing full audit trail and safety protocol
- **Maintenance** — Active task queue with status updates, safety check-in modal, emergency alert trigger
- **Map** — Geospatial view with color-coded risk markers, hazard radius circles, side panel
- **Governance** — Data governance, multi-tenant separation, RBAC simulation, ethical AI commitment
- **Multi-tenant** — 4 company divisions (Transport, Telecom, Road Maintenance, Construction)
- **Role simulation** — Field Engineer, Supervisor, Company Admin, Holding Executive

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/ehmedlicelal/Confix.git
cd Confix

# 2. Install all dependencies
npm run install:all

# 3. Set up environment files
# Copy the example files and fill in your keys:
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 4. Edit backend/.env — add your Supabase service role key
# (The Supabase URL is already set in the example file)

# 5. Start both servers (frontend :3000, backend :5000)
npm run dev
```

> **Note**: You need Node.js 18+ installed. The `install:all` script installs root, frontend, and backend dependencies in one command.

## Scripts

| Command            | Description                            |
| ------------------ | -------------------------------------- |
| `npm run dev`      | Start frontend + backend concurrently  |
| `npm run frontend` | Start Next.js dev server only          |
| `npm run backend`  | Start Express dev server only          |

## API Endpoints

| Method | Path                                 | Description                     |
| ------ | ------------------------------------ | ------------------------------- |
| GET    | `/api/health`                        | Health check                    |
| GET    | `/api/reports`                       | List reports (with filters)     |
| GET    | `/api/reports/:id`                   | Get single report               |
| POST   | `/api/reports`                       | Create a new report             |
| PATCH  | `/api/reports/:id/status`            | Update report status            |
| PATCH  | `/api/reports/:id/safety-checklist`  | Complete safety checklist       |
| POST   | `/api/reports/:id/emergency-alert`   | Trigger emergency alert         |
| POST   | `/api/assistant`                     | Get AI assistant suggestions    |
| GET    | `/api/stats`                         | Dashboard statistics            |

## Environment Variables

Create `backend/.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=5000
```

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Design Principles

- **Human-led governance** — AI provides suggestions only; risk classification is always engineer-reviewed
- **Worker safety first** — PPE, crew requirements, supervisor approval gates enforced by risk level
- **Audit trail** — Every action timestamped and attributed in immutable JSONB log
- **Data sovereignty** — Multi-tenant separation, visibility-based access, coordinate masking for critical data

super-admin login: su@confix.io
password: superadmin123

admin login: john@confix.io
password: admin1

worker login: 54321
password: 123456