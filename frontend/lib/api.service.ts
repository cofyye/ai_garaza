/**
 * API Service - komunikacija sa FastAPI backendom
 */
import { Job, JobCreate, JobUpdate, JobStatus, User } from "./types";

const API_BASE_URL = "/api";

/**
 * Generic fetch wrapper sa error handling-om
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}

// ============ Jobs API ============

export interface GetJobsParams {
  skip?: number;
  limit?: number;
  status?: JobStatus;
  location_type?: string;
  experience_level?: string;
}

/**
 * Dohvati sve poslove sa opcionalnim filterima
 */
export async function getJobs(params?: GetJobsParams): Promise<Job[]> {
  const searchParams = new URLSearchParams();

  if (params?.skip !== undefined) searchParams.set("skip", String(params.skip));
  if (params?.limit !== undefined)
    searchParams.set("limit", String(params.limit));
  if (params?.status) searchParams.set("status", params.status);
  if (params?.location_type)
    searchParams.set("location_type", params.location_type);
  if (params?.experience_level)
    searchParams.set("experience_level", params.experience_level);

  const query = searchParams.toString();
  const endpoint = query ? `/jobs/?${query}` : "/jobs/";

  const jobs = await fetchApi<any[]>(endpoint);

  // Map _id to id for frontend compatibility
  return jobs.map((job) => ({
    ...job,
    id: job._id || job.id,
  }));
}

/**
 * Dohvati jedan posao po ID-u
 */
export async function getJobById(jobId: string): Promise<Job> {
  const job = await fetchApi<any>(`/jobs/${jobId}`);
  return {
    ...job,
    id: job._id || job.id,
  };
}

/**
 * Pretraži poslove po ključnoj reči
 */
export async function searchJobs(
  query: string,
  limit: number = 20
): Promise<Job[]> {
  const searchParams = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  const jobs = await fetchApi<any[]>(`/jobs/search?${searchParams}`);

  return jobs.map((job) => ({
    ...job,
    id: job._id || job.id,
  }));
}

/**
 * Kreiraj novi posao
 */
export async function createJob(job: JobCreate): Promise<Job> {
  const created = await fetchApi<any>("/jobs/", {
    method: "POST",
    body: JSON.stringify(job),
  });

  return {
    ...created,
    id: created._id || created.id,
  };
}

/**
 * Ažuriraj posao
 */
export async function updateJob(jobId: string, job: JobUpdate): Promise<Job> {
  const updated = await fetchApi<any>(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify(job),
  });

  return {
    ...updated,
    id: updated._id || updated.id,
  };
}

/**
 * Obriši posao
 */
export async function deleteJob(jobId: string): Promise<void> {
  await fetchApi(`/jobs/${jobId}`, {
    method: "DELETE",
  });
}

// ============ Applications API ============

import {
  Application,
  ApplicationCreate,
  ApplicationUpdate,
  ApplicationStatus,
} from "./types";

export interface GetApplicationsParams {
  skip?: number;
  limit?: number;
  job_id?: string;
  user_id?: string;
  status?: ApplicationStatus;
}

/**
 * Dohvati sve aplikacije sa opcionalnim filterima
 */
export async function getApplications(
  params?: GetApplicationsParams
): Promise<Application[]> {
  const searchParams = new URLSearchParams();

  if (params?.skip !== undefined) searchParams.set("skip", String(params.skip));
  if (params?.limit !== undefined)
    searchParams.set("limit", String(params.limit));
  if (params?.job_id) searchParams.set("job_id", params.job_id);
  if (params?.user_id) searchParams.set("user_id", params.user_id);
  if (params?.status) searchParams.set("status", params.status);

  const query = searchParams.toString();
  const endpoint = query ? `/applications/?${query}` : "/applications/";

  const applications = await fetchApi<any[]>(endpoint);

  return applications.map((app) => ({
    ...app,
    id: app._id || app.id,
  }));
}

/**
 * Dohvati jednu aplikaciju po ID-u
 */
export async function getApplicationById(
  applicationId: string
): Promise<Application> {
  const app = await fetchApi<any>(`/applications/${applicationId}`);
  return {
    ...app,
    id: app._id || app.id,
  };
}

/**
 * Kreiraj novu aplikaciju
 */
export async function createApplication(
  application: ApplicationCreate
): Promise<Application> {
  const created = await fetchApi<any>("/applications/", {
    method: "POST",
    body: JSON.stringify(application),
  });

  return {
    ...created,
    id: created._id || created.id,
  };
}

/**
 * Ažuriraj aplikaciju
 */
export async function updateApplication(
  applicationId: string,
  application: ApplicationUpdate
): Promise<Application> {
  const updated = await fetchApi<any>(`/applications/${applicationId}`, {
    method: "PUT",
    body: JSON.stringify(application),
  });

  return {
    ...updated,
    id: updated._id || updated.id,
  };
}

/**
 * Obriši aplikaciju
 */
export async function deleteApplication(applicationId: string): Promise<void> {
  await fetchApi(`/applications/${applicationId}`, {
    method: "DELETE",
  });
}

/**
 * Generiši i pošalji assignment za aplikaciju
 */
export async function generateAssignment(
  applicationId: string,
  deadlineHours: number = 72
): Promise<Application> {
  const updated = await fetchApi<any>(
    `/applications/${applicationId}/generate-assignment?deadline_hours=${deadlineHours}`,
    {
      method: "POST",
    }
  );

  return {
    ...updated,
    id: updated._id || updated.id,
  };
}

// ============ Assignments API ============

import { Assignment } from "./types";

/**
 * Dohvati assignment za aplikaciju
 */
export async function getAssignmentByApplication(
  applicationId: string
): Promise<Assignment | null> {
  try {
    const assignment = await fetchApi<any>(
      `/assignments/application/${applicationId}`
    );
    return {
      ...assignment,
      id: assignment._id || assignment.id,
    };
  } catch (error) {
    // Return null if not found (404)
    return null;
  }
}

/**
 * Dohvati assignment po ID-u
 */
export async function getAssignmentById(
  assignmentId: string
): Promise<Assignment> {
  const assignment = await fetchApi<any>(`/assignments/${assignmentId}`);
  return {
    ...assignment,
    id: assignment._id || assignment.id,
  };
}

// ============ Users API ============

export interface GetUsersParams {
  skip?: number;
  limit?: number;
}

/**
 * Dohvati sve korisnike (kandidate)
 */
export async function getUsers(params?: GetUsersParams): Promise<User[]> {
  const searchParams = new URLSearchParams();

  if (params?.skip !== undefined) searchParams.set("skip", String(params.skip));
  if (params?.limit !== undefined)
    searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  const endpoint = query ? `/users/?${query}` : "/users/";

  const users = await fetchApi<any[]>(endpoint);

  return users.map((user) => ({
    ...user,
    id: user._id || user.id,
  }));
}

// ============ Future APIs (placeholder) ============

// Clients API će biti dodat kasnije kada backend podrži
// export async function getClients() { ... }
// export async function getClientById(id: string) { ... }
