import type { Job } from "@/types/job";

export interface JobProgressSummary {
  totalSteps: number;
  completedSteps: number;
  progressPercent: number;
  workflowLabel: "Completed" | "Queried" | "In Progress";
  currentStatusLabel: string;
  currentStepLabel: string;
}

export function getJobProgressSummary(job: Job): JobProgressSummary {
  const totalSteps = job.steps.length;
  const completedSteps = job.steps.filter((step) => step.status === "COMPLETED").length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const workflowLabel =
    job.status === "COMPLETED"
      ? "Completed"
      : job.status === "QUERIED"
        ? "Queried"
        : "In Progress";

  return {
    totalSteps,
    completedSteps,
    progressPercent,
    workflowLabel,
    currentStatusLabel: job.statusDisplay ?? job.status.replace(/_/g, " "),
    currentStepLabel: `${job.currentStep}/${totalSteps}`,
  };
}