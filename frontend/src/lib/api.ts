const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetchReports(params?: Record<string, string>) {
  const url = new URL(`${API}/reports`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}

export async function fetchReport(id: string) {
  const res = await fetch(`${API}/reports/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.json();
}

export async function createReport(data: any) {
  const res = await fetch(`${API}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create report');
  }
  return res.json();
}

export async function updateReportStatus(id: string, status: string) {
  const res = await fetch(`${API}/reports/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

export async function completeSafetyChecklist(id: string, completed: boolean) {
  const res = await fetch(`${API}/reports/${id}/safety-checklist`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  });
  if (!res.ok) throw new Error('Failed to update safety checklist');
  return res.json();
}

export async function triggerEmergencyAlert(id: string) {
  const res = await fetch(`${API}/reports/${id}/emergency-alert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to trigger emergency alert');
  return res.json();
}

export async function getAISuggestions(data: { assetType: string; description: string; imageName?: string }) {
  const res = await fetch(`${API}/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to get AI suggestions');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API}/stats`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function analyzeImage(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${API}/analyze-image`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Image analysis failed' }));
    throw new Error(err.error || 'Image analysis failed');
  }
  return res.json();
}

export async function voiceReportParse(transcript: string) {
  const res = await fetch(`${API}/voice-report/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to parse voice report');
  }
  return res.json();
}
