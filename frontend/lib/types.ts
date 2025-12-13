// ============ Client Types (za buduće korišćenje) ============
export type ClientStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "EXPIRED";
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
export type JobType =
  | "full-time"
  | "part-time"
  | "contract"
  | "internship"
  | "freelance";
export type ExperienceLevel =
  | "intern"
  | "junior"
  | "mid"
  | "senior"
  | "lead"
  | "staff";
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

// ============ Application Types ============
export type ApplicationStatus =
  | "pending"
  | "invited"
  | "completed"
  | "reviewed"
  | "accepted"
  | "rejected";

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  cover_letter?: string;
  additional_info?: string;
  status: ApplicationStatus;
  notes?: string;
  applied_at: string; // ISO
  updated_at: string; // ISO
  reviewed_at?: string; // ISO
  user_email?: string;
  user_name?: string;
  job_title?: string;
  company_name?: string;
}

export interface ApplicationCreate {
  user_id: string;
  job_id: string;
  cover_letter?: string;
  additional_info?: string;
}

export interface ApplicationUpdate {
  status?: ApplicationStatus;
  notes?: string;
}

// ============ Assignment Types ============
export type AssignmentDifficulty = "easy" | "mid" | "hard";
export type AssignmentStatus =
  | "pending"
  | "sent"
  | "in_progress"
  | "submitted"
  | "reviewed";

export interface Assignment {
  id: string;
  application_id: string;
  task_title: string;
  task_description: string;
  task_requirements: string[];
  evaluation_criteria: string[];
  difficulty: AssignmentDifficulty;
  time_limit_hours: number;
  additional_resources?: string;
  status: AssignmentStatus;
  created_at: string; // ISO
  sent_at?: string; // ISO
  deadline?: string; // ISO
  started_at?: string; // ISO
  submitted_at?: string; // ISO
  reviewed_at?: string; // ISO
  submission_url?: string;
  candidate_notes?: string;
  reviewer_feedback?: string;
  score?: number;
  email_sent_count: number;
  last_email_sent_at?: string; // ISO
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

export interface ApplicationFiltersState {
  search: string;
  status: ApplicationStatus | "ALL";
  job_id?: string;
}
