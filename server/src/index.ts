import express from "express";
import cors from "cors";
import reportsRouter from "./routes/reports.js";
import inspectRouter from "./routes/inspect.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use("/api/reports", reportsRouter);
app.use("/api/inspect", inspectRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`[server] running on http://localhost:${PORT}`);
});
