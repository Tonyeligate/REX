export type RegisterStageKey =
  | "jobProductionLsCertification"
  | "examinationReceived"
  | "examinationChecking"
  | "examinationCertified"
  | "regionChecked"
  | "regionApproved"
  | "regionBatched";

export type RegisterStageOutcome = "accept" | "query" | "reject";

export interface RegisterStageEntry {
  outcome: RegisterStageOutcome;
  comment?: string;
  updatedAt?: string;
}

export type RegisterStageValue = boolean | RegisterStageEntry;

export interface JobRegisterRecord {
  jobId: string;
  actualRegionalNumber?: string;
  stages: Partial<Record<RegisterStageKey, RegisterStageValue>>;
  // Explicitly cleared stages should stay empty even when workflow status suggests completion.
  clearedStageKeys?: RegisterStageKey[];
  updatedAt: string;
  source?: "backend" | "local";
}

export interface UpdateJobRegisterPayload {
  actualRegionalNumber?: string;
  stages?: Partial<Record<RegisterStageKey, RegisterStageEntry | null>>;
}