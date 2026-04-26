import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getRiskColor(level: string) {
  switch (level) {
    case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getRiskDotColor(level: string) {
  switch (level) {
    case 'Critical': return '#ef4444';
    case 'High': return '#f97316';
    case 'Medium': return '#eab308';
    case 'Low': return '#22c55e';
    default: return '#6b7280';
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'New': return 'bg-blue-100 text-blue-800';
    case 'Reviewed': return 'bg-purple-100 text-purple-800';
    case 'Assigned': return 'bg-indigo-100 text-indigo-800';
    case 'In Progress': return 'bg-cyan-100 text-cyan-800';
    case 'Resolved': return 'bg-green-100 text-green-800';
    case 'Verified': return 'bg-emerald-100 text-emerald-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getVisibilityColor(level: string) {
  switch (level) {
    case 'Critical': return 'bg-red-100 text-red-700';
    case 'Restricted': return 'bg-amber-100 text-amber-700';
    case 'Internal': return 'bg-slate-100 text-slate-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export const COMPANIES = [
  { id: 'all', name: 'Holding Overview' },
  { id: 'transport', name: 'Transport Division' },
  { id: 'telecom', name: 'Telecom Division' },
  { id: 'road-maintenance', name: 'Road Maintenance' },
  { id: 'construction', name: 'Construction Projects' },
];

export const ROLES = [
  'Field Engineer',
  'Supervisor',
  'Company Admin',
  'Holding Executive',
];

export const ASSET_TYPES = [
  'Road', 'Bridge', 'Tunnel', 'Telecom Tower',
  'Fiber Cabinet', 'Lighting Pole', 'Railway Segment', 'Construction Site',
];

export const ISSUE_TYPES = [
  'Asphalt Crack', 'Pothole', 'Concrete Crack', 'Corrosion',
  'Water Leakage', 'Cable Exposure', 'Lighting Failure',
  'Surface Deformation', 'Structural Damage', 'Worksite Hazard', 'Other',
];

export const STATUSES = ['New', 'Reviewed', 'Assigned', 'In Progress', 'Resolved', 'Verified'];

export const IMPACT_OPTIONS = [
  { value: 1, label: 'Minor' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'Serious' },
  { value: 4, label: 'Major' },
  { value: 5, label: 'Critical' },
];

export const LIKELIHOOD_OPTIONS = [
  { value: 1, label: 'Rare' },
  { value: 2, label: 'Unlikely' },
  { value: 3, label: 'Possible' },
  { value: 4, label: 'Likely' },
  { value: 5, label: 'Almost Certain' },
];

export function getRiskLevel(score: number): string {
  if (score >= 17) return 'Critical';
  if (score >= 10) return 'High';
  if (score >= 5) return 'Medium';
  return 'Low';
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
