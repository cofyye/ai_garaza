export type ClientStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED";
export type ClientVerdict = "STRONG_HIRE" | "HIRE" | "NO_HIRE";

export interface Client {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  position: string; // Changed from appliedPositions: string[]
  status: ClientStatus;
  interviewScore?: number;
  verdict?: ClientVerdict;
  lastUpdated: string; // ISO
  linkExpiresAt?: string; // ISO
  notes?: string;
}

export type JobType = "FULL_TIME" | "PART_TIME" | "CONTRACT";
export type JobSeniority = "JUNIOR" | "MID" | "SENIOR";
export type JobStatus = "OPEN" | "CLOSED";

export interface JobPost {
  id: string;
  title: string;
  location: string;
  employmentType: JobType;
  seniority: JobSeniority;
  status: JobStatus;
  createdAt: string; // ISO
  candidatesCount: number;
  description: {
    intro: string;
    responsibilities: string[];
    requirements: string[];
  };
}

// Filter State Types
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