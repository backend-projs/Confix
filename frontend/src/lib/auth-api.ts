const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface User {
  id: string;
  role: 'superadmin' | 'admin' | 'worker';
  full_name: string;
  email: string | null;
  worker_id: string | null;
  company_id: string | null;
  position: string | null;
  team: string | null;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export async function login(identifier: string, password: string): Promise<AuthPayload> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(err.error || 'Login failed');
  }
  return res.json();
}

export async function fetchMe(token: string): Promise<{ user: User; company: any; assignedAssets: any[] }> {
  const res = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Session expired');
  return res.json();
}

export async function changePassword(token: string, currentPassword: string, newPassword: string) {
  const res = await fetch(`${API}/auth/change-password`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed');
  }
  return res.json();
}

// Admin APIs
export async function fetchWorkers(token: string) {
  const res = await fetch(`${API}/users/workers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch workers');
  return res.json();
}

export async function createWorker(token: string, payload: any) {
  const res = await fetch(`${API}/users/workers`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed to create worker');
  }
  return res.json();
}

export async function updateWorker(token: string, id: string, payload: any) {
  const res = await fetch(`${API}/users/workers/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed to update worker');
  }
  return res.json();
}

export async function deleteWorker(token: string, id: string) {
  const res = await fetch(`${API}/users/workers/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed to delete worker');
  }
  return res.json();
}

export async function resetWorkerPassword(token: string, id: string, password: string) {
  const res = await fetch(`${API}/users/workers/${id}/password`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed to reset password');
  }
  return res.json();
}

// Superadmin APIs
export async function fetchAdmins(token: string) {
  const res = await fetch(`${API}/users/admins`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch admins');
  return res.json();
}

export async function createAdmin(token: string, payload: any) {
  const res = await fetch(`${API}/users/admins`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed to create admin');
  }
  return res.json();
}

export async function deleteAdmin(token: string, id: string) {
  const res = await fetch(`${API}/users/admins/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed to delete admin');
  }
  return res.json();
}

export async function resetAdminPassword(token: string, id: string, password: string) {
  const res = await fetch(`${API}/users/admins/${id}/password`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed to reset password');
  }
  return res.json();
}

// Threads APIs (Discord-style chat threads on reports)
export async function fetchThreads(token: string) {
  const res = await fetch(`${API}/threads`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch threads');
  return res.json();
}

export async function fetchThreadMessages(token: string, reportId: string) {
  const res = await fetch(`${API}/threads/${reportId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export async function postThreadMessage(token: string, reportId: string, body: string, attachment_url?: string) {
  const res = await fetch(`${API}/threads/${reportId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ body, attachment_url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed to send message');
  }
  return res.json();
}

export async function resolveThread(token: string, reportId: string, resolution_notes?: string) {
  const res = await fetch(`${API}/threads/${reportId}/resolve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ resolution_notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed to resolve');
  }
  return res.json();
}

export async function reopenThread(token: string, reportId: string) {
  const res = await fetch(`${API}/threads/${reportId}/reopen`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to reopen');
  return res.json();
}

export async function fetchThreadAiSuggestion(token: string, reportId: string) {
  const res = await fetch(`${API}/threads/${reportId}/ai-suggestion`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch AI suggestion');
  return res.json();
}

// Notifications APIs
export async function fetchMyNotifications(token: string) {
  const res = await fetch(`${API}/notifications/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function markNotificationRead(token: string, id: string) {
  const res = await fetch(`${API}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to mark notification read');
  return res.json();
}

export async function notifyNearestWorker(token: string, reportId: string, message?: string) {
  const res = await fetch(`${API}/notifications/notify-nearest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ report_id: reportId, message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed to notify nearest worker');
  }
  return res.json();
}

// Company APIs
export async function registerCompany(payload: any) {
  const res = await fetch(`${API}/companies/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Registration failed');
  }
  return res.json();
}

export async function fetchRegistrations(token: string, status?: string) {
  const url = new URL(`${API}/companies/registrations`);
  if (status) url.searchParams.set('status', status);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch registrations');
  return res.json();
}

export async function approveRegistration(token: string, id: string, adminPassword: string) {
  const res = await fetch(`${API}/companies/registrations/${id}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin_password: adminPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Approval failed');
  }
  return res.json();
}

export async function rejectRegistration(token: string, id: string, reason?: string) {
  const res = await fetch(`${API}/companies/registrations/${id}/reject`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ rejection_reason: reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Rejection failed');
  }
  return res.json();
}

export async function fetchCompanies(token: string) {
  const res = await fetch(`${API}/companies`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch companies');
  return res.json();
}

export async function fetchCompanyAssets(token: string, companyId: string) {
  const res = await fetch(`${API}/companies/${companyId}/assets`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch assets');
  return res.json();
}

export async function createCompanyAsset(token: string, companyId: string, payload: any) {
  const res = await fetch(`${API}/companies/${companyId}/assets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed to create asset');
  }
  return res.json();
}
