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
  apply_url?: string;
  status: JobStatus;
  applications_count: number;
  created_at: string; // ISO
  updated_at: string; // ISO
}

export interface JobCreate {
  title: string;
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
  apply_url?: string;
  status?: JobStatus;
}

export interface JobUpdate {
  title?: string;
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
  additional_info?: string;
  status: ApplicationStatus;
  notes?: string;
  applied_at: string; // ISO
  updated_at: string; // ISO
  reviewed_at?: string; // ISO
  user_email?: string;
  user_name?: string;
  job_title?: string;
}

export interface ApplicationCreate {
  user_id: string;
  job_id: string;
  additional_info?: string;
}

export interface ApplicationUpdate {
  status?: ApplicationStatus;
  notes?: string;
}

// ============ User Types ============
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  resume_url?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
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
  session_id?: string;
  session_url?: string;
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

// ============ Interview Analysis Types (Agent 3 Output) ============
export type HiringVerdict = 
  | "STRONG_HIRE" 
  | "HIRE" 
  | "MAYBE" 
  | "NO_HIRE" 
  | "STRONG_NO_HIRE";

export type ProductivityLevel = "high" | "medium" | "low";
export type TaskDifficulty = "easy" | "medium" | "hard";
export type MomentType = "positive" | "negative";
export type CodeSnippetType = "best" | "worst";

export interface TechnicalScores {
  codeQuality: number;            // 0-100
  problemSolving: number;         // 0-100
  algorithmicThinking: number;    // 0-100
  debugging: number;              // 0-100
  testing: number;                // 0-100
  edgeCaseHandling: number;       // 0-100
  overall: number;                // 0-100
}

export interface SoftSkills {
  clarity: number;                // 0-100
  questionAsking: number;         // 0-100
  thoughtProcess: number;         // 0-100
  collaboration: number;          // 0-100
  responseToFeedback: number;     // 0-100
  overall: number;                // 0-100
}

export interface BehavioralIndicators {
  stressHandling: number;         // 0-100
  confidence: number;             // 0-100
  learningAgility: number;        // 0-100
  problemDecomposition: number;   // 0-100
  criticalThinking: number;       // 0-100
}

export interface TimePhase {
  name: string;
  duration: number;               // minutes
  percentage: number;             // 0-100
}

export interface TimeAnalysis {
  phases: TimePhase[];
  productivity: ProductivityLevel;
}

export interface NotableMoment {
  type: MomentType;
  timestamp: string;              // Format: "HH:MM:SS"
  description: string;
}

export interface Insights {
  strengths: string[];            // 3-5 items
  improvements: string[];         // 3-5 items
  redFlags: string[];             // 0-5 items (can be empty)
  notableMoments: NotableMoment[];
}

export interface CodeSnippet {
  type: CodeSnippetType;
  code: string;
  explanation: string;
}

export interface CodeAnalysis {
  bestPractices: string[];
  issues: string[];
  codeSnippets: CodeSnippet[];
}

export interface Recommendation {
  verdict: HiringVerdict;
  confidence: number;             // 0-100
  summary: string;                // 2-3 sentence summary
  reasoning: string[];            // 3-5 bullet points
  fitForRole: number;             // 0-100
}

export interface TaskInfo {
  title: string;
  difficulty: TaskDifficulty;
  category: string;
  completed: boolean;
}

/**
 * Complete interview analysis generated by Agent 3 (Analysis Agent)
 * This represents the comprehensive evaluation of a technical interview
 */
export interface InterviewAnalysis {
  candidateId: string;
  candidateName: string;
  position: string;
  interviewDate: string;          // ISO 8601 timestamp
  duration: number;               // Total duration in minutes
  
  technicalScores: TechnicalScores;
  softSkills: SoftSkills;
  behavioral: BehavioralIndicators;
  timeAnalysis: TimeAnalysis;
  insights: Insights;
  codeAnalysis: CodeAnalysis;
  recommendation: Recommendation;
  task: TaskInfo;
}
