import type {
  JobRegisterRecord,
  RegisterStageEntry,
  RegisterStageKey,
  RegisterStageOutcome,
  RegisterStageValue,
} from "@/types/register";

export const REGISTER_STAGE_LABELS: Record<RegisterStageKey, string> = {
  jobProductionLsCertification: "Job Production / L/S Certification",
  examinationReceived: "Examination CSAU",
  examinationChecking: "Examination Checking",
  examinationCertified: "Examination Certification",
  regionChecked: "Region Checked",
  regionApproved: "Region Approved",
  regionBatched: "Region Batched",
};

export const REGISTER_STAGE_KEYS = Object.keys(REGISTER_STAGE_LABELS) as RegisterStageKey[];

export function normalizeRegisterStage(value?: RegisterStageValue): RegisterStageEntry | undefined {
  if (value === true) {
    return { outcome: "accept" };
  }

  if (value === undefined || value === null || typeof value === "boolean") {
    return undefined;
  }

  return value;
}

export function getRegisterStageOutcomeLabel(outcome?: RegisterStageOutcome): string {
  if (outcome === "accept") return "Approved";
  if (outcome === "query") return "Queried";
  if (outcome === "reject") return "Rejected";
  return "Pending";
}

export function getRegisterProgressSummary(record?: JobRegisterRecord | null) {
  const approvedCount = REGISTER_STAGE_KEYS.filter((key) => normalizeRegisterStage(record?.stages[key])?.outcome === "accept").length;
  const touchedCount = REGISTER_STAGE_KEYS.filter((key) => Boolean(normalizeRegisterStage(record?.stages[key]))).length;
  const totalStages = REGISTER_STAGE_KEYS.length;
  const progressPercent = totalStages > 0 ? Math.round((approvedCount / totalStages) * 100) : 0;

  let currentStepNumber = 1;
  let currentStatusLabel = `Awaiting ${REGISTER_STAGE_LABELS[REGISTER_STAGE_KEYS[0]]}`;
  let workflowLabel = "In Progress";

  for (let index = 0; index < REGISTER_STAGE_KEYS.length; index += 1) {
    const key = REGISTER_STAGE_KEYS[index];
    const stage = normalizeRegisterStage(record?.stages[key]);

    if (!stage) {
      currentStepNumber = index + 1;
      currentStatusLabel = `Awaiting ${REGISTER_STAGE_LABELS[key]}`;
      workflowLabel = approvedCount === totalStages ? "Completed" : "In Progress";
      break;
    }

    currentStepNumber = index + 1;

    if (stage.outcome === "query") {
      currentStatusLabel = `${REGISTER_STAGE_LABELS[key]} Queried`;
      workflowLabel = "Queried";
      break;
    }

    if (stage.outcome === "reject") {
      currentStatusLabel = `${REGISTER_STAGE_LABELS[key]} Rejected`;
      workflowLabel = "Rejected";
      break;
    }

    currentStatusLabel = `${REGISTER_STAGE_LABELS[key]} Approved`;
    workflowLabel = index === REGISTER_STAGE_KEYS.length - 1 ? "Completed" : "In Progress";
  }

  const stages = REGISTER_STAGE_KEYS.map((key, index) => {
    const entry = normalizeRegisterStage(record?.stages[key]);
    return {
      key,
      label: REGISTER_STAGE_LABELS[key],
      index: index + 1,
      entry,
      outcomeLabel: getRegisterStageOutcomeLabel(entry?.outcome),
    };
  });

  return {
    approvedCount,
    touchedCount,
    totalStages,
    progressPercent,
    currentStepNumber,
    currentStepLabel: `${currentStepNumber}/${totalStages}`,
    currentStatusLabel,
    workflowLabel,
    stages,
  };
}