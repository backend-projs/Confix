You are a senior full-stack engineer.

Your task is to PREPARE this project ("Confix") for production deployment.

Tech stack:
- Frontend: Next.js 14 (App Router, TypeScript, Tailwind)
- Backend: Express.js + TypeScript
- Database: Supabase
- Deployment targets:
  - Frontend → Vercel
  - Backend → Render

-----------------------------------
GOAL
-----------------------------------

Make the project fully deployable with:
- Correct build configs
- Environment variables
- Production-safe code
- No dev-only dependencies in runtime
- Clean structure

DO NOT break existing functionality.

-----------------------------------
BACKEND TASKS (CRITICAL)
-----------------------------------

1. Ensure TypeScript build works:
   - Create/update `tsconfig.json`
   - Output directory: `dist`
   - Module: commonjs
   - Target: ES2020

2. Update `package.json` scripts:
   - "build": "tsc"
   - "start": "node dist/index.js"
   - "dev": "ts-node-dev src/index.ts"

3. Ensure server uses dynamic PORT:
   - Use `process.env.PORT || 5000`

4. Fix CORS for production:
   - Use:
     origin: process.env.FRONTEND_URL
     credentials: true

5. Validate environment variables:
   Required:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - FRONTEND_URL
   - PORT

6. Add `.env.example`:
   Include all required variables with placeholders

7. Ensure no hardcoded localhost URLs exist

8. Ensure API routes are prefixed with `/api`

9. Add basic error handling middleware

-----------------------------------
FRONTEND TASKS
-----------------------------------

1. Ensure API base URL uses env:
   - `process.env.NEXT_PUBLIC_API_URL`

2. Create/update `.env.local.example`:
   - NEXT_PUBLIC_API_URL=https://your-backend-url

3. Ensure no hardcoded localhost API calls

4. Verify Next.js config:
   - App Router compatible
   - No server-only code in client components

5. Optimize build:
   - Remove console.logs (optional but preferred)
   - Ensure no unused imports

-----------------------------------
ROOT PROJECT TASKS
-----------------------------------

1. Update root `package.json`:

   Add:
   - "dev": run frontend + backend concurrently
   - DO NOT use dev scripts in production

2. Ensure `.gitignore` includes:
   - node_modules
   - .env
   - dist
   - .next

-----------------------------------
RENDER DEPLOYMENT PREP
-----------------------------------

Backend must support:
- Build command: `npm install && npm run build`
- Start command: `npm run start`

Ensure:
- No TypeScript runs in production
- Only compiled JS runs

-----------------------------------
VERCEL DEPLOYMENT PREP
-----------------------------------

Frontend must:
- Build without errors
- Use env variables correctly
- Not depend on backend localhost

-----------------------------------
OPTIONAL IMPROVEMENTS (IF SAFE)
-----------------------------------

- Add request logging middleware
- Add `/api/health` if missing
- Add basic validation for POST routes
- Ensure consistent folder naming

-----------------------------------
OUTPUT FORMAT
-----------------------------------

1. Show ALL modified or created files
2. For each file:
   - Include full content
3. Do NOT explain unless necessary
4. Keep code clean and minimal

-----------------------------------
IMPORTANT
-----------------------------------

- Do NOT change UI design
- Do NOT remove features
- Do NOT refactor unrelated logic
- Focus ONLY on deployment readiness

-----------------------------------

Start now.