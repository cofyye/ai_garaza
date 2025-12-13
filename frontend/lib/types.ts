// ============ Client Types (za buduće korišćenje) ============
export type ClientStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED";
export type ClientVerdict = "STRONG_HIRE" | "HIRE" | "NO_HIRE";

export interface Client {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  position: string;
  status: ClientStatus;
  interviewScore?: number;
  verdict?: ClientVerdict;
  lastUpdated: string; // ISO
  linkExpiresAt?: string; // ISO
  notes?: string;
}

// ============ Job Types (usklađeno sa backend API-jem) ============
export type JobType = "full-time" | "part-time" | "contract" | "internship" | "freelance";
export type ExperienceLevel = "intern" | "junior" | "mid" | "senior" | "lead" | "staff";
export type LocationType = "remote" | "onsite" | "hybrid";
export type JobStatus = "active" | "closed" | "draft";

export interface SalaryRange {
  min?: number;
  max?: number;
  currency: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  location_type: LocationType;
  job_type: JobType;
  experience_level: ExperienceLevel;
  description: string;
  responsibilities: string[];
  requirements: string[];
  nice_to_have: string[];
  tech_stack: string[];
  benefits: string[];
  salary_range?: SalaryRange;
  company_website?: string;
  apply_url?: string;
  status: JobStatus;
  applications_count: number;
  created_at: string; // ISO
  updated_at: string; // ISO
}

export interface JobCreate {
  title: string;
  company: string;
  location: string;
  location_type?: LocationType;
  job_type?: JobType;
  experience_level?: ExperienceLevel;
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  nice_to_have?: string[];
  tech_stack?: string[];
  benefits?: string[];
  salary_range?: SalaryRange;
  company_website?: string;
  apply_url?: string;
  status?: JobStatus;
}

export interface JobUpdate {
  title?: string;
  company?: string;
  location?: string;
  location_type?: LocationType;
  job_type?: JobType;
  experience_level?: ExperienceLevel;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  nice_to_have?: string[];
  tech_stack?: string[];
  benefits?: string[];
  salary_range?: SalaryRange;
  company_website?: string;
  apply_url?: string;
  status?: JobStatus;
}

// Legacy JobPost type za kompatibilnost sa mock podacima (ostaviti za klijente)
export interface JobPost {
  id: string;
  title: string;
  location: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT";
  seniority: "JUNIOR" | "MID" | "SENIOR";
  status: "OPEN" | "CLOSED";
  createdAt: string;
  candidatesCount: number;
  description: {
    intro: string;
    responsibilities: string[];
    requirements: string[];
  };
}

// ============ Filter State Types ============
export interface ClientFiltersState {
  search: string;
  position: string | "ALL";
  status: ClientStatus | "ALL";
  sort: "NEWEST" | "OLDEST" | "SCORE_HIGH" | "SCORE_LOW";
}

export interface JobFiltersState {
  search: string;
  status: JobStatus | "ALL";
}