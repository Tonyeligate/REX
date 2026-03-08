import { DEFAULT_WORKFLOW_STEPS } from "@/types/job";
import type { Job, WorkflowStep, StepStatus, JobStatus } from "@/types/job";

/**
 * Build a fresh set of workflow steps for a new job.
 */
export function createDefaultSteps(): WorkflowStep[] {
  return DEFAULT_WORKFLOW_STEPS.map((s, i) => ({
    ...s,
    status: i === 0 ? ("ACTIVE" as StepStatus) : ("PENDING" as StepStatus),
  }));
}

/**
 * Compute step statuses from a currentStep index (1-based).
 */
export function computeStepStatuses(steps: WorkflowStep[], currentStep: number): WorkflowStep[] {
  return steps.map((s, i) => {
    const num = i + 1;
    let status: StepStatus;
    if (num < currentStep) status = "COMPLETED";
    else if (num === currentStep) status = "ACTIVE";
    else status = "PENDING";
    return { ...s, status };
  });
}

/**
 * Advance the job to the next step.
 * Returns updated job fields or null if already at last step.
 */
export function advanceToNextStep(
  job: Job,
  comment?: string,
  completedBy?: string
): Partial<Job> | null {
  const { currentStep, steps } = job;
  if (currentStep >= steps.length) return null;

  const now = new Date().toISOString();
  const updatedSteps = steps.map((s, i) => {
    const num = i + 1;
    if (num === currentStep) {
      return {
        ...s,
        status: "COMPLETED" as StepStatus,
        completedAt: now,
        completedBy: completedBy ?? s.completedBy,
        comment: comment ?? s.comment,
      };
    }
    if (num === currentStep + 1) {
      return { ...s, status: "ACTIVE" as StepStatus };
    }
    return s;
  });

  const newStep = currentStep + 1;
  const jobStatus: JobStatus = newStep > steps.length ? "COMPLETED" : "IN_PROGRESS";

  return {
    currentStep: newStep,
    status: jobStatus,
    steps: updatedSteps,
  };
}

/**
 * Query a job at a given step (sends it back or marks it queried).
 */
export function queryStep(
  job: Job,
  stepNumber: number,
  comment: string,
  queriedBy: string
): Partial<Job> {
  const updatedSteps = job.steps.map((s, i) => {
    if (i + 1 === stepNumber) {
      return { ...s, status: "QUERIED" as StepStatus, comment, completedBy: queriedBy };
    }
    return s;
  });

  return {
    status: "QUERIED",
    steps: updatedSteps,
  };
}

/**
 * Calculate progress percentage.
 */
export function calculateProgress(steps: WorkflowStep[]): number {
  const completed = steps.filter((s) => s.status === "COMPLETED").length;
  return Math.round((completed / steps.length) * 100);
}
