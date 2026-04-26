const BASE = "http://localhost:5000/api";

export async function fetchReports() {
  const res = await fetch(`${BASE}/reports`);
  return res.json();
}

export async function fetchReport(id: string) {
  const res = await fetch(`${BASE}/reports/${id}`);
  return res.json();
}

export async function postInspect(data: Record<string, unknown>) {
  const res = await fetch(`${BASE}/inspect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function createReport(data: Record<string, unknown>) {
  const res = await fetch(`${BASE}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateReportStatus(id: string, status: string) {
  const res = await fetch(`${BASE}/reports/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return res.json();
}
