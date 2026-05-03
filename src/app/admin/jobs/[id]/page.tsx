"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Clock,
  Hash,
  Loader2,
  MapPin,
  Save,
  UserRound,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { jobsApi, type BackendStatus, type BackendTrackingStage } from "@/lib/api";
import { showErrorAlert, showSuccessAlert } from "@/lib/sweet-alert";
import type { Job, JobStatus } from "@/types/job";
import type { JobStepDecision } from "@/types/job";

type StepDecisionAction = "approved" | "rejected" | "pending";
type DecisionState = StepDecisionAction | "none";

type DetailItemProps = {
  icon: LucideIcon;
  label: string;
  value?: string;
};

const STEP_DECISION_OPTIONS: Array<{
  value: StepDecisionAction;
  label: string;
  helper: string;
  Icon: typeof CheckCircle;
}> = [
  {
    value: "approved",
    label: "Approve",
    helper: "Stage accepted and ready to progress.",
    Icon: CheckCircle,
  },
  {
    value: "rejected",
    label: "Rejected",
    helper: "Stage failed review and needs correction.",
    Icon: XCircle,
  },
  {
    value: "pending",
    label: "Pending",
    helper: "Stage is held for follow-up or missing information.",
    Icon: Clock,
  },
];

function stripLeadingStageNumber(label: string): string {
  return label.replace(/^\s*\d+\s*[\.\-:)]?\s*/u, "").trim();
}

function getStageDisplayName(stage?: BackendTrackingStage, fallback?: string): string {
  if (stage) return stripLeadingStageNumber(stage.label) || stage.label || "Stage";
  const cleaned = String(fallback ?? "")
    .trim()
    .replace(/^\d+[_\-\s]*/u, "")
    .replace(/[_-]+/g, " ")
    .trim();
  if (!cleaned) return "Stage";
  return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
}

function decisionTileClasses(decisionText: string): string {
  const normalized = decisionText.trim().toLowerCase();
  if (normalized.includes("accept") || normalized.includes("approve") || normalized.includes("certif")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100";
  }
  if (normalized.includes("query") || normalized.includes("pending")) {
    return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100";
  }
  return "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100";
}

function decisionButtonClasses(value: StepDecisionAction, selected: boolean): string {
  const base = "rounded-lg border px-3 py-2 text-left transition-colors";
  if (value === "approved") {
    return selected
      ? `${base} border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/15`
      : `${base} border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200`;
  }
  if (value === "rejected") {
    return selected
      ? `${base} border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/15`
      : `${base} border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200`;
  }
  return selected
    ? `${base} border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/15`
    : `${base} border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200`;
}

function getDecisionLabel(decision?: JobStepDecision): string {
  const display = String(decision?.decisionDisplay ?? "").trim();
  if (display) return display;
  const raw = String(decision?.decision ?? "").trim();
  if (!raw) return "No decision";
  return raw.replace(/_/g, " ");
}

function getDecisionState(decision?: JobStepDecision): DecisionState {
  const normalized = `${decision?.decision ?? ""} ${decision?.decisionDisplay ?? ""}`.trim().toLowerCase();
  if (!normalized) return "none";
  if (normalized.includes("reject")) return "rejected";
  if (normalized.includes("pending") || normalized.includes("query")) return "pending";
  if (normalized.includes("approve") || normalized.includes("accept") || normalized.includes("certif")) return "approved";
  return "none";
}

function backendStatusBannerClasses(status: JobStatus): string {
  if (status === "COMPLETED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100";
  }
  if (status === "QUERIED") {
    return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100";
  }
  if (status === "CANCELLED") {
    return "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100";
  }
  return "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/35 dark:text-sky-100";
}

function statusPillClasses(status: JobStatus): string {
  if (status === "COMPLETED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200";
  }
  if (status === "QUERIED") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200";
  }
  if (status === "CANCELLED") {
    return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";
  }
  return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/35 dark:text-orange-200";
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DetailItem({ icon: Icon, label, value }: DetailItemProps) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/50">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon size={13} />
        {label}
      </div>
      <p
        className="mt-2 min-h-[20px] truncate text-[13px] font-semibold text-foreground"
        title={value || "—"}
      >
        {value || "—"}
      </p>
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = useMemo(() => String(params?.id ?? "").trim(), [params]);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [backendTrackingStages, setBackendTrackingStages] = useState<BackendTrackingStage[]>([]);
  const [selectedStageCode, setSelectedStageCode] = useState("");
  const [decisionAction, setDecisionAction] = useState<StepDecisionAction>("approved");
  const [decisionComment, setDecisionComment] = useState("");
  const [savingDecision, setSavingDecision] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [{ job: loadedJob }, stagesResponse] = await Promise.all([
        jobsApi.get(id),
        jobsApi.trackingStages().catch(() => [] as BackendTrackingStage[]),
      ]);
      setJob(loadedJob);
      setBackendTrackingStages(stagesResponse);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load job.";
      setError(errorMessage);
      void showErrorAlert(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const workflowCurrentIndex = useMemo(() => {
    if (!job) return -1;
    const code = (job.backendStatus ?? "").trim().toLowerCase();
    return backendTrackingStages.findIndex((stage) => stage.code.trim().toLowerCase() === code);
  }, [job, backendTrackingStages]);

  const currentStageSummary = useMemo(() => {
    if (!job) return { line: "—", code: "" as string };
    const code = (job.backendStatus ?? "").trim();
    if (workflowCurrentIndex >= 0 && backendTrackingStages.length > 0) {
      const stage = backendTrackingStages[workflowCurrentIndex];
      const pos = workflowCurrentIndex + 1;
      const total = backendTrackingStages.length;
      const label = getStageDisplayName(stage);
      return {
        line: `Step ${pos} of ${total} — ${label}`,
        code: stage.code,
      };
    }
    if (job.statusDisplay?.trim()) {
      return { line: job.statusDisplay.trim(), code };
    }
    return { line: getStageDisplayName(undefined, code), code };
  }, [job, workflowCurrentIndex, backendTrackingStages]);

  useEffect(() => {
    if (selectedStageCode || !currentStageSummary.code) return;
    setSelectedStageCode(currentStageSummary.code);
  }, [currentStageSummary.code, selectedStageCode]);

  const latestDecisionByStep = useMemo(() => {
    const byStep = new Map<string, JobStepDecision>();
    for (const decision of job?.stepDecisions ?? []) {
      const code = String(decision.step ?? "").trim().toLowerCase();
      if (!code) continue;
      const prev = byStep.get(code);
      if (!prev) {
        byStep.set(code, decision);
        continue;
      }
      const prevTs = String(prev.updatedAt ?? prev.createdAt ?? "");
      const nextTs = String(decision.updatedAt ?? decision.createdAt ?? "");
      if (nextTs > prevTs) {
        byStep.set(code, decision);
      }
    }
    return byStep;
  }, [job]);

  const backendDecisionTiles = useMemo(() => {
    return backendTrackingStages
      .map((stage) => {
        const decision = latestDecisionByStep.get(stage.code.trim().toLowerCase());
        if (!decision) return null;
        return {
          code: stage.code,
          label: getStageDisplayName(stage),
          decisionLabel: getDecisionLabel(decision),
          comment: String(decision.comment ?? "").trim(),
          decidedAt: decision.updatedAt ?? decision.createdAt ?? "",
        };
      })
      .filter(Boolean) as Array<{
      code: string;
      label: string;
      decisionLabel: string;
      comment: string;
      decidedAt: string;
    }>;
  }, [backendTrackingStages, latestDecisionByStep]);

  const selectedStageDecision = useMemo(() => {
    if (!selectedStageCode) return null;
    return latestDecisionByStep.get(selectedStageCode.trim().toLowerCase()) ?? null;
  }, [selectedStageCode, latestDecisionByStep]);

  const stageRuleViolation = useCallback(
    (targetStageCode: string): string | null => {
      const normalizedTarget = targetStageCode.trim().toLowerCase();
      if (!normalizedTarget) return "Select a workflow stage before saving a decision.";

      const targetIndex = backendTrackingStages.findIndex(
        (stage) => stage.code.trim().toLowerCase() === normalizedTarget
      );
      if (targetIndex < 0) return "Select a valid workflow stage before saving a decision.";

      const blockingIndex = backendTrackingStages.findIndex((stage) => {
        const decision = latestDecisionByStep.get(stage.code.trim().toLowerCase());
        const state = getDecisionState(decision);
        return state === "pending" || state === "rejected";
      });

      if (blockingIndex >= 0 && blockingIndex !== targetIndex) {
        const blockingStage = backendTrackingStages[blockingIndex];
        const blockingDecision = latestDecisionByStep.get(blockingStage.code.trim().toLowerCase());
        const state = getDecisionState(blockingDecision);
        return `${getStageDisplayName(blockingStage)} is ${state}. Resolve that stage before moving to another stage.`;
      }

      for (let index = 0; index < targetIndex; index += 1) {
        const previousStage = backendTrackingStages[index];
        const previousDecision = latestDecisionByStep.get(previousStage.code.trim().toLowerCase());
        const previousState =
          getDecisionState(previousDecision) === "none" && index < workflowCurrentIndex
            ? "approved"
            : getDecisionState(previousDecision);
        if (previousState !== "approved") {
          return `${getStageDisplayName(previousStage)} must be approved before ${getStageDisplayName(
            backendTrackingStages[targetIndex]
          )} can be updated.`;
        }
      }

      return null;
    },
    [backendTrackingStages, latestDecisionByStep, workflowCurrentIndex]
  );

  const showRuleError = useCallback((message: string) => {
    setError(message);
    void showErrorAlert(message, "Workflow blocked");
  }, []);

  const handleStageSelectionChange = useCallback(
    (nextStageCode: string) => {
      const message = stageRuleViolation(nextStageCode);
      if (message) {
        showRuleError(message);
        return;
      }
      setError("");
      setSelectedStageCode(nextStageCode);
    },
    [showRuleError, stageRuleViolation]
  );

  const handleSaveDecision = async () => {
    if (!job || !selectedStageCode) {
      showRuleError("Select a workflow stage before saving a decision.");
      return;
    }

    const comment = decisionComment.trim();
    if ((decisionAction === "rejected" || decisionAction === "pending") && !comment) {
      const message = "Add a comment for rejected or pending decisions.";
      setError(message);
      void showErrorAlert(message, "Comment required");
      return;
    }

    const message = stageRuleViolation(selectedStageCode);
    if (message) {
      showRuleError(message);
      return;
    }

    setSavingDecision(true);
    setError("");
    try {
      const { job: updatedJob } = await jobsApi.saveStepDecision(job.jobId, {
        stage: selectedStageCode as BackendStatus,
        decision: decisionAction,
        notes: comment,
      });
      setJob(updatedJob);
      setDecisionComment("");
      void showSuccessAlert("Stage decision saved successfully.");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save stage decision.";
      setError(errorMessage);
      void showErrorAlert(errorMessage);
    } finally {
      setSavingDecision(false);
    }
  };

  const readOnlyRequestedBy = useMemo(() => {
    if (!job) return "—";
    return job.requestedByName?.trim() || "—";
  }, [job]);

  const progressPercent = useMemo(() => {
    if (workflowCurrentIndex < 0 || backendTrackingStages.length === 0) return 0;
    return Math.round(((workflowCurrentIndex + 1) / backendTrackingStages.length) * 100);
  }, [workflowCurrentIndex, backendTrackingStages.length]);

  const selectedStageLabel = useMemo(() => {
    if (!selectedStageCode) return "";
    const stage = backendTrackingStages.find(
      (item) => item.code.trim().toLowerCase() === selectedStageCode.trim().toLowerCase()
    );
    return getStageDisplayName(stage, selectedStageCode);
  }, [selectedStageCode, backendTrackingStages]);

  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <Loader2 size={18} className="mx-auto mb-2 animate-spin" />
        Loading job...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Job not found.{" "}
        <Link href="/admin/jobs" className="text-[#F07000] hover:underline">
          Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-future-bg space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-900/80 md:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => router.push("/admin/jobs")}
              className="mb-3 inline-flex h-9 items-center gap-2 rounded-full border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ArrowLeft size={14} />
              Back to jobs
            </button>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="min-w-0 truncate text-[22px] font-[900] leading-tight text-foreground">
                Job {job.jobId}
              </h1>
              <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusPillClasses(job.status)}`}>
                {job.statusDisplay?.trim() || job.status}
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
              {job.description?.trim() || "No job description has been recorded."}
            </p>
          </div>

          <div className={`w-full rounded-xl border px-4 py-3 lg:max-w-[360px] ${backendStatusBannerClasses(job.status)}`}>
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">Current workflow stage</p>
            <p className="mt-1 text-[15px] font-bold">{currentStageSummary.line}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/60 dark:bg-black/20">
              <div
                className="h-full rounded-full bg-current transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-semibold opacity-75">
              <span className="truncate">Live workflow stage</span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-200">
          {error}
        </div>
      )}

      <section className="admin-surface-elevated rounded-2xl p-4 md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#F07000] dark:bg-orange-950/35 dark:text-orange-200">
            <BriefcaseBusiness size={17} />
          </span>
          <div>
            <h2 className="text-[15px] font-bold text-foreground">Job Summary</h2>
            <p className="text-[12px] text-muted-foreground">Key identifiers and ownership details.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DetailItem icon={UserRound} label="Client" value={job.clientName} />
          <DetailItem icon={MapPin} label="Regional number" value={job.regionalNumber} />
          <DetailItem icon={ClipboardList} label="Requested by" value={readOnlyRequestedBy} />
          <DetailItem icon={CalendarDays} label="Created" value={formatDate(job.createdAt)} />
          <DetailItem icon={Hash} label="Job ID" value={job.jobId} />
          <DetailItem icon={BriefcaseBusiness} label="Job type" value={job.jobType} />
          <DetailItem icon={Clock} label="Updated" value={formatDateTime(job.updatedAt)} />
          <DetailItem icon={CheckCircle} label="Recorded decisions" value={String(backendDecisionTiles.length)} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="admin-surface-elevated rounded-2xl p-4 md:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-foreground">Workflow Progress</h2>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Workflow stages are shown in order with the current stage highlighted.
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              {backendTrackingStages.length} stages
            </span>
          </div>

          <div className="space-y-2">
            {backendTrackingStages.length > 0 ? (
              backendTrackingStages.map((stage, index) => {
                const isCompleted = workflowCurrentIndex >= 0 && index < workflowCurrentIndex;
                const isCurrent = workflowCurrentIndex >= 0 && index === workflowCurrentIndex;
                const decision = latestDecisionByStep.get(stage.code.trim().toLowerCase());
                const stageName = getStageDisplayName(stage);

                return (
                  <div
                    key={stage.code}
                    className={`grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-3 text-[12px] transition-colors ${
                      isCurrent
                        ? "border-orange-300 bg-orange-50/80 dark:border-orange-900/60 dark:bg-orange-950/30"
                        : isCompleted
                          ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                          : "border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-900/45"
                    }`}
                  >
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-[900] ${
                        isCurrent
                          ? "bg-[#F07000] text-white"
                          : isCompleted
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {isCompleted ? <CheckCircle size={15} /> : stage.order}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-foreground" title={stageName}>
                        {stageName}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        Step {stage.order} in the approval workflow
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {decision ? (
                        <span className={`hidden rounded-full border px-2 py-0.5 text-[10px] font-bold sm:inline-flex ${decisionTileClasses(getDecisionLabel(decision))}`}>
                          {getDecisionLabel(decision)}
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isCurrent
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200"
                            : isCompleted
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {isCurrent ? "Current" : isCompleted ? "Passed" : "Pending"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-[13px] text-muted-foreground dark:border-slate-700 dark:bg-slate-900/40">
                Backend tracking stages are not available.
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="admin-surface-elevated rounded-2xl p-4 md:p-5">
            <div className="mb-4">
              <h2 className="text-[15px] font-bold text-foreground">Stage Decision</h2>
              <p className="mt-1 text-[12px] text-muted-foreground">Record the latest review outcome for a workflow stage.</p>
            </div>

            <label className="block text-[12px]">
              <span className="mb-1.5 block font-semibold text-slate-600 dark:text-slate-300">Stage</span>
              <select
                value={selectedStageCode}
                onChange={(e) => handleStageSelectionChange(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-[12px] text-foreground outline-none transition focus:ring-2 focus:ring-[#F07000]/20 dark:border-slate-600 dark:bg-slate-900"
              >
                <option value="">Select workflow stage...</option>
                {backendTrackingStages.map((stage) => (
                  <option key={stage.code} value={stage.code}>
                    {getStageDisplayName(stage)}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-3 grid grid-cols-1 gap-2">
              {STEP_DECISION_OPTIONS.map(({ value, label, helper, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDecisionAction(value)}
                  className={decisionButtonClasses(value, decisionAction === value)}
                >
                  <span className="flex items-center gap-2 text-[12px] font-bold">
                    <Icon size={14} />
                    {label}
                  </span>
                  <span className="mt-1 block text-[10px] leading-snug opacity-75">{helper}</span>
                </button>
              ))}
            </div>

            <label className="mt-3 block text-[12px]">
              <span className="mb-1.5 block font-semibold text-slate-600 dark:text-slate-300">
                Comment {decisionAction === "approved" ? "(optional)" : "(required)"}
              </span>
              <textarea
                value={decisionComment}
                onChange={(event) => setDecisionComment(event.target.value)}
                rows={4}
                placeholder="Add notes for this stage decision..."
                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12px] text-foreground outline-none transition focus:ring-2 focus:ring-[#F07000]/20 dark:border-slate-600 dark:bg-slate-900"
              />
            </label>

            <button
              type="button"
              onClick={handleSaveDecision}
              disabled={savingDecision || !selectedStageCode}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#F07000] px-4 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[#D06000] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingDecision ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Decision
            </button>
          </section>

          <section className="admin-surface-elevated rounded-2xl p-4 md:p-5">
            <h2 className="text-[15px] font-bold text-foreground">Selected Stage</h2>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-[12px] dark:border-slate-700 dark:bg-slate-900/45">
              {selectedStageCode ? (
                selectedStageDecision ? (
                  <div className="space-y-2">
                    <p className="font-bold text-foreground">{selectedStageLabel}</p>
                    <p>
                      <span className="text-muted-foreground">Decision:</span>{" "}
                      <span className="font-semibold">{getDecisionLabel(selectedStageDecision)}</span>
                    </p>
                    <p className="leading-relaxed">
                      <span className="text-muted-foreground">Comment:</span>{" "}
                      {selectedStageDecision.comment?.trim() || "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Updated {formatDateTime(selectedStageDecision.updatedAt || selectedStageDecision.createdAt)}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No stage decision has been recorded for {selectedStageLabel || "this stage"} yet.
                  </p>
                )
              ) : (
                <p className="text-muted-foreground">Select a stage to review its latest decision.</p>
              )}
            </div>
          </section>

          {backendDecisionTiles.length > 0 ? (
            <section className="admin-surface-elevated rounded-2xl p-4 md:p-5">
              <h2 className="text-[15px] font-bold text-foreground">Decision History</h2>
              <div className="mt-3 space-y-2">
                {backendDecisionTiles.map((tile) => (
                  <div
                    key={tile.code}
                    className={`rounded-xl border p-3 text-[12px] ${decisionTileClasses(tile.decisionLabel)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 font-semibold leading-tight">{tile.label}</p>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide opacity-90">
                        {tile.decisionLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed opacity-95">{tile.comment || "—"}</p>
                    {tile.decidedAt ? (
                      <p className="mt-2 text-[10px] opacity-70">Updated {formatDateTime(tile.decidedAt)}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
