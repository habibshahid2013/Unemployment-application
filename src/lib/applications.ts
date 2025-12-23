// Job Application Storage & State Management
// Handles persisting and retrieving job applications

export interface JobApplication {
  id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  jobType?: string;
  description: string;
  url?: string;
  logoUrl?: string;
  
  // Application tracking
  status: 'applied' | 'following_up' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn';
  appliedAt: string; // ISO date
  lastUpdated: string;
  
  // Follow-up tracking
  followUpSent?: boolean;
  followUpSentAt?: string;
  contactName?: string;
  contactEmail?: string;
  contactLinkedIn?: string;
  
  // User notes
  notes?: string;
}

const STORAGE_KEY = 'job_applications';

// Get all applications from storage
export function getApplications(): JobApplication[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (e) {
    console.error('Error loading applications:', e);
    return [];
  }
}

// Save a new job application
export function saveApplication(job: {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  jobType?: string;
  description: string;
  url?: string;
  logoUrl?: string;
}): JobApplication {
  const apps = getApplications();
  
  // Check if already exists
  const existing = apps.find(a => a.jobId === job.id);
  if (existing) {
    return existing;
  }
  
  const newApp: JobApplication = {
    id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    jobId: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    salary: job.salary,
    jobType: job.jobType,
    description: job.description,
    url: job.url,
    logoUrl: job.logoUrl,
    status: 'applied',
    appliedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
  
  apps.unshift(newApp); // Add to beginning
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  
  return newApp;
}

// Update an application
export function updateApplication(
  id: string, 
  updates: Partial<Pick<JobApplication, 'status' | 'notes' | 'contactName' | 'contactEmail' | 'contactLinkedIn' | 'followUpSent' | 'followUpSentAt'>>
): JobApplication | null {
  const apps = getApplications();
  const index = apps.findIndex(a => a.id === id);
  
  if (index === -1) return null;
  
  apps[index] = {
    ...apps[index],
    ...updates,
    lastUpdated: new Date().toISOString(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  return apps[index];
}

// Delete an application
export function deleteApplication(id: string): boolean {
  const apps = getApplications();
  const filtered = apps.filter(a => a.id !== id);
  
  if (filtered.length === apps.length) return false;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// Get a single application by ID
export function getApplication(id: string): JobApplication | null {
  const apps = getApplications();
  return apps.find(a => a.id === id) || null;
}

// Check if a job has been applied to
export function hasApplied(jobId: string): boolean {
  const apps = getApplications();
  return apps.some(a => a.jobId === jobId);
}

// Get applications count by status
export function getApplicationStats() {
  const apps = getApplications();
  return {
    total: apps.length,
    applied: apps.filter(a => a.status === 'applied').length,
    followingUp: apps.filter(a => a.status === 'following_up').length,
    interviewing: apps.filter(a => a.status === 'interviewing').length,
    offers: apps.filter(a => a.status === 'offer').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
  };
}

// Get days since application
export function getDaysSinceApplied(appliedAt: string): number {
  const applied = new Date(appliedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - applied.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Status display helpers
export const STATUS_LABELS: Record<JobApplication['status'], string> = {
  applied: 'Applied',
  following_up: 'Following Up',
  interviewing: 'Interviewing',
  offer: 'Offer Received',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const STATUS_COLORS: Record<JobApplication['status'], string> = {
  applied: '#2196F3',
  following_up: '#FF9800',
  interviewing: '#9C27B0',
  offer: '#4CAF50',
  rejected: '#F44336',
  withdrawn: '#9E9E9E',
};
