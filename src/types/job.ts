export type Priority = "STANDARD" | "HIGH" | "URGENT";
export type JobStatus = "IN_PROGRESS" | "COMPLETED" | "QUERIED" | "CANCELLED";
export type StepStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "QUERIED" | "SKIPPED";

export interface WorkflowStep {
  stepNumber: number;
  title: string;
  note: string;
  department?: string;
  status: StepStatus;
  decision?: string;
  decisionDisplay?: string;
  assignedTo?: string;
  comment?: string;
  completedAt?: string;
  completedBy?: string;
  attachments?: string[];
}

export interface JobStepDecision {
  id: number;
  step: string;
  stepDisplay?: string;
  decision: string;
  decisionDisplay?: string;
  comment?: string;
  decidedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimelineEntry {
  id: string;
  label: string;
  subtext: string;
  status: "done" | "current" | "todo";
  createdAt: string;
  createdBy?: string;
}

export interface Job {
  id: string;
  jobId: string;             // RN from backend (e.g. "RN-GAR-2025-001")
  jobType: string;
  clientId: string;
  clientName: string;
  priority: Priority;
  assignedTo?: string;
  estimatedTime?: string;
  submittedDate: string;
  currentStep: number;
  status: JobStatus;
  /** Raw backend status slug (e.g. "examination_ls461") */
  backendStatus?: string;
  /** Human-readable status from backend */
  statusDisplay?: string;
  regionalNumber?: string;
  parcelSize?: string;
  /** Payment amount from backend */
  paymentAmount?: string;
  /** Query reason from backend */
  queryReason?: string;
  /** Batch name from backend */
  batchName?: string;
  /** Description from backend */
  description?: string;
  /** Documents from backend */
  documents?: Array<{ id: number; file: string; name: string; uploaded_at: string }>;
  /** Raw per-step decisions from backend (book-like granular workflow). */
  stepDecisions?: JobStepDecision[];
  steps: WorkflowStep[];
  timeline: TimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobPayload {
  rn?: string;
  title?: string;
  description?: string;
  parcel_acreage?: string;
  // Legacy form fields (mapped to backend in api.ts)
  jobId?: string;
  jobType?: string;
  clientId?: string;
  clientName?: string;
  priority?: Priority;
  assignedTo?: string;
  estimatedTime?: string;
  submittedDate?: string;
  regionalNumber?: string;
  parcelSize?: string;
}

export interface UpdateJobPayload {
  title?: string;
  description?: string;
  status?: string;
  query_reason?: string;
  parcel_acreage?: string;
  payment_amount?: string;
  assigned_to?: number | null;
  batch?: number | null;
}

export interface AdvanceStepPayload {
  comment?: string;
  completedBy: string;
}

/** The 14 workflow step definitions matching the backend statuses. */
export const DEFAULT_WORKFLOW_STEPS: Omit<WorkflowStep, "status">[] = [
  { stepNumber: 1,  title: "Job Request Received",       note: "Client submits the initial job request.",                   department: "Client" },
  { stepNumber: 2,  title: "RN Assigned / Sent to Client", note: "Regional Number assigned and sent to client.",           department: "CSAU" },
  { stepNumber: 3,  title: "Job Plan / Production",       note: "Licensed Surveyor prepares the job plan.",                department: "Licensed Surveyor (L/S 461)" },
  { stepNumber: 4,  title: "Submitted to L/S 461",       note: "Job submitted to Licensed Surveyor for examination.",      department: "Licensed Surveyor (L/S 461)" },
  { stepNumber: 5,  title: "Examination (L/S 461)",      note: "Licensed Surveyor examines the job.",                      department: "Licensed Surveyor (L/S 461)" },
  { stepNumber: 6,  title: "Certified by L/S 461",       note: "Licensed Surveyor certifies the job.",                     department: "Licensed Surveyor (L/S 461)" },
  { stepNumber: 7,  title: "At CSAU (Payment)",          note: "Payment collected based on parcel size / acreage.",         department: "CSAU" },
  { stepNumber: 8,  title: "Forwarded to SMD",           note: "Certified job forwarded to Survey & Mapping Division.",     department: "CSAU" },
  { stepNumber: 9,  title: "Examination (SMD)",          note: "SMD performs technical examination and validation.",         department: "SMD Examination" },
  { stepNumber: 10, title: "Certified (SMD)",            note: "Chief Examiner reviews and certifies the job.",             department: "Chief Examiner" },
  { stepNumber: 11, title: "Batched for Region",         note: "Certified jobs batched and forwarded to regional office.",   department: "Chief Examiner" },
  { stepNumber: 12, title: "At Region",                  note: "Regional office receives the batched jobs.",                department: "SMD Region" },
  { stepNumber: 13, title: "Signed Out (CSAU)",          note: "CSAU signs out the cleared and approved job.",              department: "CSAU" },
  { stepNumber: 14, title: "Delivered to Client",        note: "Approved documents delivered to the client.",               department: "Client" },
];
