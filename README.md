# Confix — AZCON AssetSense

AI-assisted infrastructure inspection and maintenance prioritization platform for AZCON Holding.

## Description

Confix (AssetSense) enables field engineers to upload infrastructure inspection reports, automatically detect possible issues using a mock AI analyzer, calculate risk scores, prioritize maintenance tasks, and visualize all problem reports on an interactive map.

> **Note:** AI analysis is simulated. No real computer-vision model or paid API is used. The mock analyzer can be replaced with a real API in a future iteration.

## Tech Stack

| Layer     | Technology                                       |
| --------- | ------------------------------------------------ |
| Frontend  | React 18, Vite, TypeScript, Tailwind CSS         |
| Routing   | React Router v6                                  |
| Charts    | Recharts                                         |
| Map       | React Leaflet + OpenStreetMap tiles               |
| Icons     | Lucide React                                     |
| Backend   | Node.js, Express, TypeScript (tsx)               |
| Data      | In-memory array (resets on server restart)        |

## Getting Started

```bash
# 1. Install root dependencies (concurrently)
npm install

# 2. Install client dependencies
npm install --prefix client

# 3. Install server dependencies
npm install --prefix server

# 4. Start both client (port 5173) and server (port 5000)
npm run dev
```

## Scripts

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start client + server concurrently |
| `npm run client`  | Start Vite dev server only         |
| `npm run server`  | Start Express dev server only      |

## API Endpoints

| Method | Path                        | Description                  |
| ------ | --------------------------- | ---------------------------- |
| GET    | `/api/reports`              | List all reports             |
| GET    | `/api/reports/:id`          | Get single report            |
| POST   | `/api/inspect`              | Run mock AI analysis         |
| POST   | `/api/reports`              | Create a new report          |
| PATCH  | `/api/reports/:id/status`   | Update report status         |
| GET    | `/api/health`               | Health check                 |

## Future Roadmap

- Real AZCON data integration
- Computer vision model training
- Drone inspection support
- Mobile app for field engineers
- ERP / maintenance system integration
- Predictive maintenance analytics