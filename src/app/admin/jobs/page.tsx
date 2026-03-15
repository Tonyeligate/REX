"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Loader2,
  MessageSquare,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  Send,
  Upload,
  X,
} from "lucide-react";
import { WORKFLOW_STATUSES, jobsApi, registerFieldsApi, type BackendStatus } from "@/lib/api";
import {
  BACKEND_REGISTER_STEP_CODE_MAP,
  REGISTER_STAGE_COLS,
  REGISTER_STAGE_KEYS,
  REGISTER_STAGE_LABELS,
} from "@/lib/register-stage-mapping";
import { getRegisterProgressSummary } from "@/lib/register-progress";
import { getJobProgressSummary } from "@/lib/job-progress";
import type { Job, JobStepDecision } from "@/types/job";
import type {
  JobRegisterRecord,
  RegisterStageEntry,
  RegisterStageKey,
  RegisterStageOutcome,
  RegisterStageValue,
} from "@/types/register";

type RegisterStageSource = "backend" | "local" | "none";

type ResolvedRegisterStage = {
  entry?: RegisterStageEntry;
  source: RegisterStageSource;
};

type CellState = "done" | "active" | "queried" | "pending";

function normalizeRegisterStage(value?: RegisterStageValue): RegisterStageEntry | undefined {
  if (value === true) {
    return { outcome: "accept" };
  }

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return undefined;
  }

  return value;
}

function getRegisterStageDisplay(value?: RegisterStageValue): string {
  const stage = normalizeRegisterStage(value);
  if (!stage) return "";
  return stage.outcome === "accept"
    ? "Approved"
    : stage.outcome === "query"
      ? "Queried"
      : "Rejected";
}

function normalizeImportColumnName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const IMPORT_JOB_ID_COLUMNS = ["RNR", "RN", "Job ID", "JobId", "Job Id"];
const IMPORT_REGIONAL_NUMBER_COLUMNS = ["Regional Number", "Actual Regional Number", "ARN", "Regional No", "Regional No."];

const IMPORT_STAGE_COLUMNS: Record<RegisterStageKey, string[]> = {
  jobProductionLsCertification: ["Job Production / L/S Certification", "Job Production LS Certification", "4_ls_cert"],
  examinationReceived: ["CSAU", "CSAU Received", "5_csau_payment"],
  examinationChecking: ["Examination Checking", "6_1_checking"],
  examinationCertified: ["Examination Cert.", "Examination Certification", "6_2_certified"],
  regionChecked: ["Region Checked", "7_1_checked"],
  regionApproved: ["Region Approved", "7_2_approved"],
  regionBatched: ["Region Barcode", "Region Batched", "7_3_barcoded"],
};

function toRegisterOutcomeFromDecision(decision?: string): RegisterStageOutcome | undefined {
  const normalized = (decision ?? "").trim().toLowerCase();
  if (!normalized) return undefined;
  if (["approve", "approved", "accept", "accepted", "complete", "completed"].includes(normalized)) {
    return "accept";
  }
  if (["query", "queried"].includes(normalized)) {
    return "query";
  }
  if (["reject", "rejected"].includes(normalized)) {
    return "reject";
  }
  return undefined;
}

function getLatestBackendDecisionByStep(job: Job): Map<string, JobStepDecision> {
  const latestByStep = new Map<string, JobStepDecision>();

  for (const decision of job.stepDecisions ?? []) {
    const stepCode = decision.step?.trim();
    if (!stepCode) continue;

    const existing = latestByStep.get(stepCode);
    if (!existing) {
      latestByStep.set(stepCode, decision);
      continue;
    }

    const existingTime = Date.parse(existing.updatedAt || existing.createdAt || "");
    const incomingTime = Date.parse(decision.updatedAt || decision.createdAt || "");
    if (!Number.isFinite(existingTime) || incomingTime >= existingTime) {
      latestByStep.set(stepCode, decision);
    }
  }

  return latestByStep;
}

function toRegisterEntryFromBackendDecision(decision?: JobStepDecision): RegisterStageEntry | undefined {
  if (!decision) return undefined;

  const outcome = toRegisterOutcomeFromDecision(decision.decisionDisplay || decision.decision);
  if (!outcome) return undefined;

  return {
    outcome,
    comment: decision.comment,
    updatedAt: decision.updatedAt || decision.createdAt,
  };
}

function resolveRegisterStages(
  job: Job,
  record?: JobRegisterRecord
): Record<RegisterStageKey, ResolvedRegisterStage> {
  const latestByStep = getLatestBackendDecisionByStep(job);

  return REGISTER_STAGE_KEYS.reduce((acc, key) => {
    const backendStepCode = BACKEND_REGISTER_STEP_CODE_MAP[key];
    const backendDecision = latestByStep.get(backendStepCode);
    if (backendDecision) {
      acc[key] = {
        entry: toRegisterEntryFromBackendDecision(backendDecision),
        source: "backend",
      };
      return acc;
    }

    const localEntry = normalizeRegisterStage(record?.stages[key]);
    if (localEntry) {
      acc[key] = { entry: localEntry, source: "local" };
      return acc;
    }

    acc[key] = { entry: undefined, source: "none" };
    return acc;
  }, {} as Record<RegisterStageKey, ResolvedRegisterStage>);
}

function buildResolvedRegisterRecord(
  job: Job,
  record?: JobRegisterRecord
): JobRegisterRecord {
  const resolvedStages = resolveRegisterStages(job, record);
  const stages: Partial<Record<RegisterStageKey, RegisterStageValue>> = {};

  for (const key of REGISTER_STAGE_KEYS) {
    const resolvedEntry = resolvedStages[key].entry;
    if (resolvedEntry) {
      stages[key] = resolvedEntry;
    }
  }

  return {
    jobId: job.jobId,
    actualRegionalNumber: record?.actualRegionalNumber,
    stages,
    updatedAt: record?.updatedAt ?? job.updatedAt,
  };
}

function getStepIndex(status: string): number {
  const idx = WORKFLOW_STATUSES.indexOf(status as BackendStatus);
  return idx === -1 ? 0 : idx;
}

function getQueryStatusForStage(stepIndex: number): BackendStatus {
  return stepIndex <= 5 ? "queried_ls461" : "queried_smd";
}

function getRegisterName(job: Job): string {
  const clientName = (job.clientName ?? "").trim();
  if (clientName && clientName !== "—") {
    return clientName;
  }

  const parts = (job.jobType ?? "")
    .split(/[–-]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[0] || job.jobType || "—";
}

function getRegisterReference(job: Job): string {
  const parts = (job.jobType ?? "")
    .split(/[–-]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts.slice(1).join(" – ") : "";
}

function getActualRegionalNumber(job: Job, record?: JobRegisterRecord): string {
  return job.regionalNumber?.trim() || record?.actualRegionalNumber?.trim() || "";
}

function RegisterStageCell({
  stage,
  source,
  onClick,
}: {
  stage?: RegisterStageEntry;
  source: RegisterStageSource;
  onClick: () => void;
}) {
  const [showComment, setShowComment] = useState(false);
  const comment = stage?.comment?.trim();
  const commentPreview = comment || "No comment for this step yet.";

  const sourceBadge =
    source === "backend"
      ? { label: "B", title: "Backend decision", tone: "bg-[#dbeafe] text-[#1d4ed8] border-[#bfdbfe]" }
      : source === "local"
        ? { label: "L", title: "Local browser register data", tone: "bg-[#f3f4f6] text-[#4b5563] border-[#d1d5db]" }
        : null;

  const renderCommentButton = (buttonClassName: string) => (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setShowComment((current) => !current);
        }}
        className={`absolute top-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] shadow-sm ${buttonClassName}`}
        title={comment ? "Preview comment" : "No comment yet"}
      >
        <MessageSquare size={10} />
      </button>
      {showComment && (
        <div className="absolute z-20 bottom-full right-1 mb-1 w-44 rounded-lg bg-[#111827] px-2 py-1.5 text-left text-[10px] leading-4 text-white shadow-lg">
          {commentPreview}
        </div>
      )}
      {sourceBadge && (
        <span
          className={`absolute top-1 left-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1 text-[9px] font-[800] ${sourceBadge.tone}`}
          title={sourceBadge.title}
        >
          {sourceBadge.label}
        </span>
      )}
    </>
  );

  if (stage?.outcome === "accept" || stage?.outcome === "query" || stage?.outcome === "reject") {
    const styles =
      stage.outcome === "accept"
        ? {
            td: "border-[#d1fae5] bg-[#f0fdf4] hover:bg-[#dcfce7]",
            icon: <CheckCircle size={15} className="text-green-600 mx-auto" />,
            button: "border-green-200 bg-white text-green-700 hover:bg-green-100",
            prefix: "Approved",
          }
        : stage.outcome === "query"
          ? {
              td: "border-[#fde68a] bg-[#fffbeb] hover:bg-[#fef3c7]",
              icon: <AlertTriangle size={15} className="text-amber-500 mx-auto" />,
              button: "border-amber-200 bg-white text-amber-700 hover:bg-amber-100",
              prefix: "Queried",
            }
          : {
              td: "border-[#fecaca] bg-[#fef2f2] hover:bg-[#fee2e2]",
              icon: <X size={15} className="text-red-600 mx-auto" />,
              button: "border-red-200 bg-white text-red-700 hover:bg-red-100",
              prefix: "Rejected",
            };

    return (
      <td
        className={`relative text-center px-1 py-2 border cursor-pointer transition-colors ${styles.td}`}
        onClick={onClick}
        title={comment ? `${styles.prefix}: ${comment}` : `${styles.prefix}. Click to edit register entry.`}
      >
        {styles.icon}
        {renderCommentButton(styles.button)}
      </td>
    );
  }

  return (
    <td
      className="relative text-center px-1 py-2 border border-[#e5e7eb] bg-white cursor-pointer hover:bg-orange-50 transition-colors"
      onClick={onClick}
      title={source === "backend" ? "Backend decision is currently pending for this stage." : "No backend decision yet. Click to enter local fallback record."}
    >
      {renderCommentButton("border-[#d1d5db] bg-white text-[#9ca3af] hover:bg-gray-100")}
    </td>
  );
}

interface ModalProps {
  job: Job;
  colLabel: string;
  stepIndex: number;
  currentState: CellState;
  onClose: () => void;
  onDone: () => void;
}

function StageModal({ job, colLabel, stepIndex, currentState, onClose, onDone }: ModalProps) {
  const [outcome, setOutcome] = useState<"advance" | "query" | "reject">("advance");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      if (outcome === "advance") {
        await jobsApi.advanceStep(job.jobId, { comment });
      } else {
        await jobsApi.transitionTo(job.jobId, {
          status: getQueryStatusForStage(stepIndex),
          notes: `${outcome === "query" ? "QUERIED" : "REJECTED"}: ${comment}`,
        });
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] bg-[#f8f9fa]">
          <div>
            <h3 className="text-[15px] font-bold text-[#1f2937]">{colLabel}</h3>
            <p className="text-[12px] text-[#9ca3af]">
              Job: <span className="font-semibold text-[#F07000]">{job.jobId}</span> · {job.jobType}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-[#9ca3af]">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {currentState === "done" ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700 text-[13px]">
              <CheckCircle size={15} />
              This stage has already been completed.
            </div>
          ) : (
            <>
              <div>
                <p className="text-[12px] font-semibold text-[#374151] mb-2 uppercase tracking-wide">Mark this stage as:</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["advance", "query", "reject"] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setOutcome(option)}
                      className={`py-2 rounded-lg text-[12px] font-bold border-2 transition-all ${
                        outcome === option
                          ? option === "advance"
                            ? "border-green-500 bg-green-50 text-green-700"
                            : option === "query"
                              ? "border-amber-500 bg-amber-50 text-amber-700"
                              : "border-red-500 bg-red-50 text-red-700"
                          : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#d1d5db]"
                      }`}
                    >
                      {option === "advance" ? "✓ Accept" : option === "query" ? "⚠ Query" : "✕ Reject"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">
                  Comment {outcome !== "advance" ? "(required)" : "(optional)"}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder={
                    outcome === "advance"
                      ? "Add a note about this stage completion..."
                      : outcome === "query"
                        ? "Describe what needs to be corrected..."
                        : "Provide the reason for rejection..."
                  }
                  className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20 resize-none"
                />
              </div>

              {error && <p className="text-red-600 text-[12px]">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="flex-1 h-[38px] border border-[#e5e7eb] rounded-lg text-[13px] font-semibold text-[#4b5563] hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || (outcome !== "advance" && !comment.trim())}
                  className={`flex-1 h-[38px] rounded-lg text-[13px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-colors ${
                    outcome === "advance"
                      ? "bg-green-600 hover:bg-green-700"
                      : outcome === "query"
                        ? "bg-amber-500 hover:bg-amber-600"
                        : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {outcome === "advance" ? "Mark Accepted" : outcome === "query" ? "Mark Queried" : "Mark Rejected"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RegisterRowModal({
  job,
  record,
  onClose,
  onDone,
}: {
  job: Job;
  record?: JobRegisterRecord;
  onClose: () => void;
  onDone: (record: JobRegisterRecord) => void;
}) {
  const [stages, setStages] = useState<Record<RegisterStageKey, { outcome: RegisterStageOutcome | ""; comment: string }>>(() =>
    REGISTER_STAGE_KEYS.reduce((acc, key) => {
      const stage = normalizeRegisterStage(record?.stages[key]);
      acc[key] = {
        outcome: stage?.outcome ?? "",
        comment: stage?.comment ?? "",
      };
      return acc;
    }, {} as Record<RegisterStageKey, { outcome: RegisterStageOutcome | ""; comment: string }>)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setStageOutcome = (key: RegisterStageKey, outcome: RegisterStageOutcome) => {
    setStages((current) => ({
      ...current,
      [key]: {
        ...current[key],
        outcome,
      },
    }));
  };

  const setStageComment = (key: RegisterStageKey, comment: string) => {
    setStages((current) => ({
      ...current,
      [key]: {
        ...current[key],
        comment,
      },
    }));
  };

  const clearStage = (key: RegisterStageKey) => {
    setStages((current) => ({
      ...current,
      [key]: { outcome: "", comment: "" },
    }));
  };

  const validateStages = () => {
    for (const key of REGISTER_STAGE_KEYS) {
      const stage = stages[key];
      const comment = stage.comment.trim();

      if (comment && !stage.outcome) {
        return `Choose an action for ${REGISTER_STAGE_LABELS[key]} before saving the comment.`;
      }

      if ((stage.outcome === "query" || stage.outcome === "reject") && !comment) {
        return `Add a comment for ${REGISTER_STAGE_LABELS[key]} when it is queried or rejected.`;
      }
    }

    return "";
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const validationError = validateStages();
      if (validationError) {
        setError(validationError);
        setSaving(false);
        return;
      }

      const stagePayload = REGISTER_STAGE_KEYS.reduce<Partial<Record<RegisterStageKey, RegisterStageEntry | null>>>((acc, key) => {
        const stage = stages[key];
        const comment = stage.comment.trim();

        if (!stage.outcome) {
          acc[key] = null;
          return acc;
        }

        acc[key] = {
          outcome: stage.outcome,
          comment,
          updatedAt: new Date().toISOString(),
        };
        return acc;
      }, {});

      const response = await registerFieldsApi.update(job.jobId, {
        stages: stagePayload,
      });
      onDone(response.record);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save register row");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] bg-[#f8f9fa]">
          <div>
            <h3 className="text-[15px] font-bold text-[#1f2937]">Register Entry</h3>
            <p className="text-[12px] text-[#9ca3af]">
              {getRegisterName(job)} · <span className="font-semibold text-[#F07000]">{job.jobId}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-[#9ca3af]">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-[#9ca3af] mb-1">Regional Number</p>
            <p className="text-[14px] font-bold text-[#1f2937]">{getActualRegionalNumber(job, record) || "Not assigned"}</p>
            <p className="text-[11px] text-[#6b7280] mt-1">This number is already captured at job creation and is shown here for reference only.</p>
          </div>

          <div>
            <p className="text-[12px] font-semibold text-[#374151] mb-3 uppercase tracking-wide">Book Stages</p>
            <div className="grid gap-4 md:grid-cols-2">
              {REGISTER_STAGE_KEYS.map((key) => {
                const stage = stages[key];
                return (
                  <div
                    key={key}
                    className={`rounded-xl border px-4 py-4 transition-colors ${
                      stage.outcome === "accept"
                        ? "border-green-200 bg-green-50"
                        : stage.outcome === "query"
                          ? "border-amber-200 bg-amber-50"
                          : stage.outcome === "reject"
                            ? "border-red-200 bg-red-50"
                            : "border-[#e5e7eb] bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className="text-[13px] font-semibold text-[#1f2937]">{REGISTER_STAGE_LABELS[key]}</span>
                      {(stage.outcome || stage.comment.trim()) && (
                        <button
                          type="button"
                          onClick={() => clearStage(key)}
                          className="text-[11px] font-semibold text-[#9ca3af] hover:text-[#4b5563]"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {(["accept", "query", "reject"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setStageOutcome(key, option)}
                          className={`py-2 rounded-lg text-[12px] font-bold border-2 transition-all ${
                            stage.outcome === option
                              ? option === "accept"
                                ? "border-green-500 bg-green-50 text-green-700"
                                : option === "query"
                                  ? "border-amber-500 bg-amber-50 text-amber-700"
                                  : "border-red-500 bg-red-50 text-red-700"
                              : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#d1d5db]"
                          }`}
                        >
                          {option === "accept" ? "✓ Approve" : option === "query" ? "⚠ Query" : "✕ Reject"}
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={stage.comment}
                      onChange={(e) => setStageComment(key, e.target.value)}
                      rows={3}
                      placeholder={
                        stage.outcome === "accept"
                          ? "Comment for approval (optional)..."
                          : stage.outcome === "query"
                            ? "Comment for query (required)..."
                            : stage.outcome === "reject"
                              ? "Comment for rejection (required)..."
                              : "Add a comment for this stage..."
                      }
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20 resize-none"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-[#f59e0b] bg-[#fffbeb] px-4 py-3 text-[12px] text-[#92400e]">
            These register edits are saved only in this browser and are used as fallback values. When backend step decisions exist for a column, backend values are shown first.
          </div>

          {error && <p className="text-red-600 text-[12px]">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 h-[40px] border border-[#e5e7eb] rounded-lg text-[13px] font-semibold text-[#4b5563] hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-[40px] rounded-lg text-[13px] font-semibold text-white bg-[#F07000] hover:bg-[#D06000] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Save Register Row
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobsRegisterPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [registerRecords, setRegisterRecords] = useState<Record<string, JobRegisterRecord>>({});
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [workflowModal, setWorkflowModal] = useState<{
    job: Job;
    colLabel: string;
    stepIndex: number;
    state: CellState;
  } | null>(null);
  const [registerModalJob, setRegisterModalJob] = useState<Job | null>(null);

  const loadJobs = useCallback(() => {
    setLoading(true);
    Promise.all([jobsApi.list(), registerFieldsApi.list()])
      .then(async ([jobsData, registerData]) => {
        const hydratedJobs = await Promise.all(
          jobsData.jobs.map(async (job) => {
            if (job.stepDecisions && job.stepDecisions.length > 0) {
              return job;
            }

            try {
              const detail = await jobsApi.get(job.jobId);
              return detail.job;
            } catch {
              return job;
            }
          })
        );

        setJobs(hydratedJobs);
        setRegisterRecords(registerData.records);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const record = registerRecords[job.jobId];
      const regionalNumber = getActualRegionalNumber(job, record).toLowerCase();
      const matchesSearch =
        !q ||
        job.jobId.toLowerCase().includes(q) ||
        job.jobType.toLowerCase().includes(q) ||
        regionalNumber.includes(q) ||
        (job.clientName ?? "").toLowerCase().includes(q) ||
        (job.queryReason ?? "").toLowerCase().includes(q) ||
        (job.statusDisplay ?? job.status).toLowerCase().includes(q);

      const matchesStatus = !statusFilter || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, registerRecords, search, statusFilter]);

  const counts = useMemo(
    () => ({
      all: jobs.length,
      inProgress: jobs.filter((job) => job.status === "IN_PROGRESS").length,
      queried: jobs.filter((job) => job.status === "QUERIED").length,
      completed: jobs.filter((job) => job.status === "COMPLETED").length,
    }),
    [jobs]
  );

  const handleExport = async () => {
    const XLSX = await import("xlsx");

    const headers = [
      "#",
      "Client Name",
      "RNR",
      "Regional Number",
      "Job Production / L/S Certification",
      "CSAU",
      "Examination Checking",
      "Examination Cert.",
      "Region Checked",
      "Region Approved",
      "Region Barcode",
      "Workflow Status / Notes",
    ];

    const rows = filteredJobs.map((job, index) => {
      const record = registerRecords[job.jobId];
      const resolvedStages = resolveRegisterStages(job, record);
      const workflowProgress = getJobProgressSummary(job);
      const row: Record<string, string | number> = {
        "#": index + 1,
        "Client Name": getRegisterName(job),
        RNR: job.jobId ?? "",
        "Regional Number": getActualRegionalNumber(job, record),
      };

      row["Job Production / L/S Certification"] = getRegisterStageDisplay(resolvedStages.jobProductionLsCertification.entry);
      row["CSAU"] = getRegisterStageDisplay(resolvedStages.examinationReceived.entry);
      row["Examination Checking"] = getRegisterStageDisplay(resolvedStages.examinationChecking.entry);
      row["Examination Cert."] = getRegisterStageDisplay(resolvedStages.examinationCertified.entry);
      row["Region Checked"] = getRegisterStageDisplay(resolvedStages.regionChecked.entry);
      row["Region Approved"] = getRegisterStageDisplay(resolvedStages.regionApproved.entry);
      row["Region Barcode"] = getRegisterStageDisplay(resolvedStages.regionBatched.entry);
      row["Workflow Status / Notes"] = [
        workflowProgress.currentStatusLabel,
        `${workflowProgress.currentStepLabel} (${workflowProgress.progressPercent}%)`,
        workflowProgress.workflowLabel,
        getRegisterReference(job),
        job.queryReason,
      ]
        .filter(Boolean)
        .join(" | ");

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
    ws["!cols"] = headers.map((header) =>
      header === "Client Name" || header === "Workflow Status / Notes"
        ? { wch: 30 }
        : header === "RNR" || header === "Regional Number"
          ? { wch: 18 }
          : { wch: 14 }
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jobs Register");
    XLSX.writeFile(wb, `Jobs-Register-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFeedback("");
    setImporting(true);

    try {
      const XLSX = await import("xlsx");
      const fileBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("Excel file has no worksheet.");
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      if (rows.length === 0) {
        setImportFeedback("No rows found in the selected Excel file.");
        return;
      }

      const jobsById = new Map(jobs.map((job) => [job.jobId.trim().toLowerCase(), job]));
      let updated = 0;
      let skipped = 0;
      let notFound = 0;

      for (const row of rows) {
        const columnLookup = new Map<string, string>();
        for (const [columnName, value] of Object.entries(row)) {
          const normalizedColumn = normalizeImportColumnName(columnName);
          if (!normalizedColumn) continue;
          columnLookup.set(normalizedColumn, String(value ?? "").trim());
        }

        const readColumnValue = (candidates: string[]) => {
          for (const candidate of candidates) {
            const value = columnLookup.get(normalizeImportColumnName(candidate));
            if (value) return value;
          }
          return "";
        };

        const jobId = readColumnValue(IMPORT_JOB_ID_COLUMNS);
        if (!jobId) {
          skipped += 1;
          continue;
        }

        const job = jobsById.get(jobId.toLowerCase());
        if (!job) {
          notFound += 1;
          continue;
        }

        const stagePayload: Partial<Record<RegisterStageKey, RegisterStageEntry | null>> = {};
        let hasStageData = false;

        for (const key of REGISTER_STAGE_KEYS) {
          const rawValue = readColumnValue(IMPORT_STAGE_COLUMNS[key]);
          if (!rawValue) continue;

          const outcome = toRegisterOutcomeFromDecision(rawValue);
          if (!outcome) continue;

          stagePayload[key] = {
            outcome,
            updatedAt: new Date().toISOString(),
          };
          hasStageData = true;
        }

        const regionalNumber = readColumnValue(IMPORT_REGIONAL_NUMBER_COLUMNS);

        if (!hasStageData && !regionalNumber) {
          skipped += 1;
          continue;
        }

        await registerFieldsApi.update(job.jobId, {
          actualRegionalNumber: regionalNumber || undefined,
          stages: hasStageData ? stagePayload : undefined,
        });

        updated += 1;
      }

      loadJobs();
      setImportFeedback(`Import complete: ${updated} updated, ${skipped} skipped, ${notFound} rows did not match a job.`);
    } catch (error) {
      setImportFeedback(error instanceof Error ? error.message : "Failed to import Excel file.");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const openWorkflowModal = (job: Job) => {
    const stepIndex = getStepIndex(job.backendStatus ?? "request_received");
    const currentStep = job.steps[Math.max(0, job.currentStep - 1)];
    setWorkflowModal({
      job,
      colLabel: currentStep?.title ?? job.statusDisplay ?? "Workflow Update",
      stepIndex,
      state: job.status === "QUERIED" ? "queried" : job.status === "COMPLETED" ? "done" : "active",
    });
  };

  return (
    <div>
      <div className="flex flex-col gap-4 mb-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h3 className="text-[22px] font-bold text-[#1f2937]">Job Management Register</h3>
          <p className="text-[13px] text-[#9ca3af]">
            Presented like the physical register. Click any register cell or Edit Register to fill the book-only stages.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadJobs}
            className="flex items-center gap-2 h-[38px] px-4 border border-[#e5e7eb] rounded-lg text-[13px] font-semibold text-[#4b5563] hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 h-[38px] px-4 bg-green-600 text-white rounded-lg text-[13px] font-semibold hover:bg-green-700 transition-colors"
          >
            <Download size={14} /> Export Excel
          </button>
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 h-[38px] px-4 bg-[#1d4ed8] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1e40af] disabled:opacity-60 transition-colors"
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {importing ? "Importing..." : "Import Excel"}
          </button>
          <Link
            href="/admin/jobs/new"
            className="flex items-center gap-2 h-[38px] px-4 bg-[#F07000] text-white rounded-lg text-[13px] font-semibold hover:bg-[#D06000] transition-colors"
          >
            <Plus size={14} /> New Job
          </Link>
        </div>
      </div>

      <input
        ref={importInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleImportExcel}
        className="hidden"
      />

      {importFeedback && (
        <div className="mb-4 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 text-[12px] text-[#1e3a8a]">
          {importFeedback}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 mb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row">
            <div className="relative flex-1 min-w-[260px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by RN, client, title, status, or comment..."
                className="w-full h-[40px] pl-10 pr-4 border border-[#e5e7eb] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-[40px] min-w-[180px] px-4 border border-[#e5e7eb] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20"
            >
              <option value="">All Status</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="QUERIED">Queried</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <div className="text-[12px] text-[#6b7280] flex flex-wrap gap-4">
            <span className="font-semibold text-[#1f2937]">All: {counts.all}</span>
            <span className="font-semibold text-orange-600">Active: {counts.inProgress}</span>
            <span className="font-semibold text-amber-600">Queried: {counts.queried}</span>
            <span className="font-semibold text-green-600">Done: {counts.completed}</span>
            <span className="flex items-center gap-1.5"><span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-[#bfdbfe] bg-[#dbeafe] px-1 text-[10px] font-[800] text-[#1d4ed8]">B</span> Backend decision value</span>
            <span className="flex items-center gap-1.5"><span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-[#d1d5db] bg-[#f3f4f6] px-1 text-[10px] font-[800] text-[#4b5563]">L</span> Local browser fallback</span>
            <span className="flex items-center gap-1.5"><AlertTriangle size={13} className="text-amber-500" /> Local value is used only when no backend step decision exists</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] border-collapse table-fixed min-w-[1180px] xl:min-w-0">
            <thead>
              <tr className="bg-[#1f2937] text-white">
                <th rowSpan={2} className="border border-[#374151] px-3 py-2 text-center font-bold w-8">#</th>
                <th rowSpan={2} className="border border-[#374151] px-3 py-2 text-left font-bold w-[200px]">Client Name</th>
                <th rowSpan={2} className="border border-[#374151] px-3 py-2 text-left font-bold w-[135px]">RNR</th>
                <th rowSpan={2} className="border border-[#374151] px-3 py-2 text-left font-bold w-[150px]">Regional Number</th>
                <th rowSpan={2} className="border border-[#374151] px-3 py-2 text-center font-bold bg-[#374151] w-[96px]">
                  Job Production /<br />L/S Certification
                  <span className="block mt-1 text-[10px] font-[600] text-[#cbd5e1]">4_ls_cert</span>
                </th>
                <th rowSpan={2} className="border border-[#374151] px-3 py-2 text-center font-bold bg-[#1e3a5f] w-[60px]">
                  CSAU
                  <span className="block mt-1 text-[10px] font-[600] text-[#cbd5e1]">5_csau_payment</span>
                </th>
                <th colSpan={2} className="border border-[#374151] px-3 py-1.5 text-center font-bold bg-[#1e3a5f]">Examination</th>
                <th colSpan={3} className="border border-[#374151] px-3 py-1.5 text-center font-bold bg-[#374151]">Region</th>
              </tr>
              <tr className="bg-[#374151] text-[#d1d5db] text-[11px]">
                <th className="border border-[#4b5563] px-1 py-1.5 text-center font-semibold bg-[#1e3a5f] w-[60px]">Checking<span className="block mt-0.5 text-[10px] font-[500] text-[#9fb4d4]">6_1_checking</span></th>
                <th className="border border-[#4b5563] px-1 py-1.5 text-center font-semibold bg-[#1e3a5f] w-[60px]">Cert.<span className="block mt-0.5 text-[10px] font-[500] text-[#9fb4d4]">6_2_certified</span></th>
                <th className="border border-[#4b5563] px-1 py-1.5 text-center font-semibold w-[60px]">Checked<span className="block mt-0.5 text-[10px] font-[500] text-[#cbd5e1]">7_1_checked</span></th>
                <th className="border border-[#4b5563] px-1 py-1.5 text-center font-semibold w-[60px]">Approved<span className="block mt-0.5 text-[10px] font-[500] text-[#cbd5e1]">7_2_approved</span></th>
                <th className="border border-[#4b5563] px-1 py-1.5 text-center font-semibold w-[60px]">Barcode<span className="block mt-0.5 text-[10px] font-[500] text-[#cbd5e1]">7_3_barcoded</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-[#9ca3af]">
                    <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                    Loading jobs...
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-[#9ca3af]">
                    No jobs match the current filters. <Link href="/admin/jobs/new" className="text-[#F07000] hover:underline font-semibold">Create a new job →</Link>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job, index) => {
                  const isEven = index % 2 === 0;
                  const registerName = getRegisterName(job);
                  const registerReference = getRegisterReference(job);
                  const record = registerRecords[job.jobId];
                  const resolvedStages = resolveRegisterStages(job, record);
                  const workflowProgress = getJobProgressSummary(job);
                  const registerProgress = getRegisterProgressSummary(buildResolvedRegisterRecord(job, record));

                  return (
                    <tr key={job.id} className={`hover:bg-orange-50/40 transition-colors ${isEven ? "bg-white" : "bg-[#fafafa]"}`}>
                      <td className="border border-[#e5e7eb] px-2 py-2 text-center text-[#9ca3af] font-medium">{index + 1}</td>
                      <td className="border border-[#e5e7eb] px-3 py-2 align-top">
                        <Link href={`/admin/jobs/${encodeURIComponent(job.jobId)}`} className="font-semibold text-[#1f2937] hover:text-[#F07000] transition-colors">
                          {registerName}
                        </Link>
                        {registerReference && (
                          <div className="text-[11px] text-[#6b7280] mt-0.5 line-clamp-1">{registerReference}</div>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[#9ca3af]">
                          <span>Workflow {workflowProgress.currentStepLabel}</span>
                          <span>•</span>
                          <span>{workflowProgress.currentStatusLabel}</span>
                          <span>•</span>
                          <span>{workflowProgress.progressPercent}% progress</span>
                          <span>•</span>
                          <span>{workflowProgress.workflowLabel}</span>
                          <span>•</span>
                          <span>Register {registerProgress.currentStepLabel}</span>
                          <span>•</span>
                          <span>{job.parcelSize ?? "—"} ac</span>
                          <span>•</span>
                          <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                          <button
                            type="button"
                            onClick={() => setRegisterModalJob(job)}
                            className="inline-flex items-center gap-1 text-[#0f766e] hover:underline"
                          >
                            <PencilLine size={11} /> Edit Register
                          </button>
                          <button
                            type="button"
                            onClick={() => openWorkflowModal(job)}
                            className="inline-flex items-center gap-1 text-[#b45309] hover:underline"
                          >
                            <Clock size={11} /> Workflow
                          </button>
                          <Link
                            href={`/admin/jobs/${encodeURIComponent(job.jobId)}`}
                            className="inline-flex items-center gap-1 text-[#F07000] hover:underline"
                          >
                            <Eye size={11} /> Open
                          </Link>
                        </div>
                        {job.queryReason && (
                          <div className="text-[11px] text-amber-700 mt-1 line-clamp-2">{job.queryReason}</div>
                        )}
                      </td>
                      <td className="border border-[#e5e7eb] px-2 py-2 font-mono text-[#F07000] font-semibold align-top">{job.jobId}</td>
                      <td
                        className="border border-[#e5e7eb] px-2 py-2 font-mono text-[#4b5563] align-top cursor-pointer hover:bg-orange-50"
                        onClick={() => setRegisterModalJob(job)}
                        title="Click to open the register entry"
                      >
                        {getActualRegionalNumber(job, record) || <span className="text-[#9ca3af] font-sans text-[11px]">Not assigned</span>}
                      </td>
                      {REGISTER_STAGE_COLS.map((col) => {
                        const key = col.key as RegisterStageKey;
                        const resolvedStage = resolvedStages[key];
                        return (
                          <RegisterStageCell
                            key={col.key}
                            stage={resolvedStage.entry}
                            source={resolvedStage.source}
                            onClick={() => setRegisterModalJob(job)}
                          />
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && (
        <p className="mt-3 text-[12px] text-[#9ca3af] text-right">
          Showing {filteredJobs.length} of {jobs.length} job{jobs.length !== 1 ? "s" : ""}
        </p>
      )}

      {registerModalJob && (
        <RegisterRowModal
          job={registerModalJob}
          record={registerRecords[registerModalJob.jobId]}
          onClose={() => setRegisterModalJob(null)}
          onDone={(record) => {
            setRegisterRecords((current) => ({ ...current, [record.jobId]: record }));
            setRegisterModalJob(null);
          }}
        />
      )}

      {workflowModal && (
        <StageModal
          job={workflowModal.job}
          colLabel={workflowModal.colLabel}
          stepIndex={workflowModal.stepIndex}
          currentState={workflowModal.state}
          onClose={() => setWorkflowModal(null)}
          onDone={() => {
            setWorkflowModal(null);
            loadJobs();
          }}
        />
      )}
    </div>
  );
}
