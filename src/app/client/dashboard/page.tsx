"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Printer,
  RotateCcw,
  Radar,
  Sparkles,
  Workflow,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock3,
  ClipboardList,
  BadgeInfo,
  BadgeCheck,
  MapPinned,
  Ruler,
  CalendarDays,
  UserRound,
} from "lucide-react";
import type { Job, JobStepDecision, WorkflowStep } from "@/types/job";
import { jobsApi, STATUS_STEP_MAP } from "@/lib/api";

const REGISTER_META_START = "[[REGISTER_META_V1]]";
const REGISTER_META_END = "[[/REGISTER_META_V1]]";

type RegisterMetaOutcome = "accept" | "query" | "reject";

type RegisterMetaEntry = {
  outcome?: RegisterMetaOutcome;
  comment?: string;
};

type RegisterMetaPayload = {
  stages?: Record<string, RegisterMetaEntry>;
};

const REGISTER_STAGE_KEY_BY_STEP_NUMBER: Partial<Record<number, string>> = {
  6: "jobProductionLsCertification",
  7: "examinationReceived",
  9: "examinationChecking",
  10: "examinationCertified",
  12: "regionChecked",
  13: "regionApproved",
  14: "regionBatched",
};

/* ── Quick-Search Chips (loaded from API) ── */
// Chips are loaded dynamically from the jobs list on mount

/* ── Animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 240, damping: 24 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const CLIENT_TRACKING_NINE_STAGE_FLOW = [
  {
    displayStep: 1,
    mappedWorkflowStep: 1,
    title: "Job Request Received",
    backendCodes: ["request_received", "1_rnr"],
  },
  {
    displayStep: 2,
    mappedWorkflowStep: 2,
    title: "RN Assigned / Sent to Client",
    backendCodes: ["rn_assigned", "2_regional_number"],
  },
  {
    displayStep: 3,
    mappedWorkflowStep: 3,
    title: "Job Plan / Production",
    backendCodes: ["in_production", "3_job_production"],
  },
  {
    displayStep: 4,
    mappedWorkflowStep: 6,
    title: "L/S Certification",
    backendCodes: ["4_ls_cert", "submitted_to_ls461", "examination_ls461", "queried_ls461"],
  },
  {
    displayStep: 5,
    mappedWorkflowStep: 7,
    title: "CSAU",
    backendCodes: ["5_csau_payment", "at_csau_payment", "forwarded_to_smd"],
  },
  {
    displayStep: 6,
    mappedWorkflowStep: 9,
    title: "Examination",
    backendCodes: ["6_examination", "6_1_checking", "6_2_certified", "examination_smd", "queried_smd", "certified_smd"],
  },
  {
    displayStep: 7,
    mappedWorkflowStep: 12,
    title: "Region",
    backendCodes: ["7_region", "7_1_checked", "7_2_approved", "7_3_barcoded", "batched_for_region", "at_region"],
  },
  {
    displayStep: 8,
    mappedWorkflowStep: 13,
    title: "Signed Out (CSAU)",
    backendCodes: ["8_signed_out_csau", "signed_out_csau"],
  },
  {
    displayStep: 9,
    mappedWorkflowStep: 14,
    title: "Delivered to Client",
    backendCodes: ["9_delivered_to_client", "delivered_to_client"],
  },
] as const;

type ClientAlignedStageStatus = "Approved" | "Queried" | "Rejected" | "Upcoming";

type ClientAlignedStage = {
  displayStep: number;
  stepNumber: number;
  title: string;
  statusLabel: ClientAlignedStageStatus;
  comment: string;
};

type SyncStatus = "idle" | "syncing" | "ok" | "error";

type SyncState = {
  status: SyncStatus;
  updatedAt: number | null;
  message: string;
};

function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return fallback;
}

function formatSyncTime(timestamp: number | null): string {
  if (!timestamp) return "--";
  return new Date(timestamp).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function parseDecisionOutcome(value?: string): "approve" | "query" | "reject" | undefined {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return undefined;
  if (["approve", "approved", "accept", "accepted", "complete", "completed"].includes(normalized)) {
    return "approve";
  }
  if (["query", "queried"].includes(normalized)) return "query";
  if (["reject", "rejected"].includes(normalized)) return "reject";
  return undefined;
}

function getDecisionTimestamp(decision?: JobStepDecision): number {
  if (!decision) return Number.NEGATIVE_INFINITY;
  const time = Date.parse(decision.updatedAt || decision.createdAt || "");
  return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY;
}

function getLatestDecisionByCodes(
  decisions: JobStepDecision[] | undefined,
  backendCodes: string[]
): JobStepDecision | undefined {
  if (!decisions || decisions.length === 0 || backendCodes.length === 0) return undefined;
  const codeSet = new Set(backendCodes.map((code) => code.trim().toLowerCase()));

  let latest: JobStepDecision | undefined;
  for (const decision of decisions) {
    const stepCode = (decision.step ?? "").trim().toLowerCase();
    if (!codeSet.has(stepCode)) continue;
    if (!latest || getDecisionTimestamp(decision) >= getDecisionTimestamp(latest)) {
      latest = decision;
    }
  }
  return latest;
}

function parseRegisterMetaFromDescription(
  description?: string
): RegisterMetaPayload | null {
  if (!description) return null;

  const startIndex = description.indexOf(REGISTER_META_START);
  if (startIndex < 0) return null;

  const contentStart = startIndex + REGISTER_META_START.length;
  const endIndex = description.indexOf(REGISTER_META_END, contentStart);
  if (endIndex < 0) return null;

  const raw = description.slice(contentStart, endIndex).trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as RegisterMetaPayload;
  } catch {
    return null;
  }
}

function getRegisterMetaEntryForStep(
  meta: RegisterMetaPayload | null,
  stepNumber: number
): RegisterMetaEntry | undefined {
  const key = REGISTER_STAGE_KEY_BY_STEP_NUMBER[stepNumber];
  if (!key) return undefined;
  return meta?.stages?.[key];
}

function mapRegisterMetaOutcomeToClientStatus(
  outcome?: RegisterMetaOutcome
): ClientAlignedStageStatus | undefined {
  if (outcome === "accept") return "Approved";
  if (outcome === "query") return "Queried";
  if (outcome === "reject") return "Rejected";
  return undefined;
}

function getStatusFromWorkflowStep(step?: WorkflowStep): ClientAlignedStageStatus {
  if (!step) return "Upcoming";
  const fallbackOutcome = parseDecisionOutcome(step.decisionDisplay || step.decision);
  if (fallbackOutcome === "reject") return "Rejected";
  if (step.status === "COMPLETED") return "Approved";
  if (step.status === "QUERIED") return "Queried";
  return "Upcoming";
}

function getStatusFromBackendProgress(job: Job, stepNumber: number): ClientAlignedStageStatus {
  const backendStatus = (job.backendStatus ?? "").trim().toLowerCase();
  const currentStepNumber =
    STATUS_STEP_MAP[backendStatus] ??
    (Number.isFinite(job.currentStep) ? job.currentStep : 0);
  const isQueriedCurrentStatus =
    backendStatus === "queried_ls461" || backendStatus === "queried_smd";

  if (isQueriedCurrentStatus && stepNumber === currentStepNumber) {
    return "Queried";
  }

  if (stepNumber <= currentStepNumber) {
    return "Approved";
  }

  return "Upcoming";
}

function getBadgeTone(statusLabel: ClientAlignedStageStatus): string {
  if (statusLabel === "Approved") return "bg-[#dcfce7] text-[#15803d]";
  if (statusLabel === "Rejected") return "bg-[#fee2e2] text-[#b91c1c]";
  if (statusLabel === "Queried") return "bg-[#FEF3C7] text-[#B45309]";
  return "bg-[#ffedd5] text-[#c2410c]";
}

function getStatusIcon(statusLabel: ClientAlignedStageStatus) {
  if (statusLabel === "Approved") return <CheckCircle2 size={14} className="text-[#16a34a]" />;
  if (statusLabel === "Rejected") return <XCircle size={14} className="text-[#dc2626]" />;
  if (statusLabel === "Queried") return <AlertTriangle size={14} className="text-[#d97706]" />;
  return <Clock3 size={14} className="text-[#ea580c]" />;
}

function buildClientAlignedStages(job: Job): ClientAlignedStage[] {
  const registerMeta = parseRegisterMetaFromDescription(job.description);

  return CLIENT_TRACKING_NINE_STAGE_FLOW.map((stageDef) => {
    const latestDecision = getLatestDecisionByCodes(job.stepDecisions, stageDef.backendCodes);
    const decisionOutcome = parseDecisionOutcome(
      latestDecision?.decisionDisplay || latestDecision?.decision
    );
    const registerMetaEntry = getRegisterMetaEntryForStep(
      registerMeta,
      stageDef.mappedWorkflowStep
    );
    const registerMetaStatus = mapRegisterMetaOutcomeToClientStatus(
      registerMetaEntry?.outcome
    );
    const fallbackStep = job.steps.find(
      (step) => step.stepNumber === stageDef.mappedWorkflowStep
    );

    let statusLabel: ClientAlignedStageStatus;
    if (registerMetaStatus) {
      statusLabel = registerMetaStatus;
    } else if (decisionOutcome === "approve") {
      statusLabel = "Approved";
    } else if (decisionOutcome === "query") {
      statusLabel = "Queried";
    } else if (decisionOutcome === "reject") {
      statusLabel = "Rejected";
    } else {
      statusLabel =
        job.backendStatus
          ? getStatusFromBackendProgress(job, stageDef.mappedWorkflowStep)
          : getStatusFromWorkflowStep(fallbackStep);
    }

    return {
      displayStep: stageDef.displayStep,
      stepNumber: stageDef.mappedWorkflowStep,
      title: stageDef.title,
      statusLabel,
      comment:
        registerMetaEntry?.comment?.trim() ||
        latestDecision?.comment?.trim() ||
        fallbackStep?.comment?.trim() ||
        "No comment has been added for this stage yet.",
    };
  });
}

/* ══════════════════════════════════════════════
   MAIN PAGE — Single-page Regional Number Tracker
   ══════════════════════════════════════════════ */
export default function ClientDashboardPage() {
  const [query, setQuery] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [animKey, setAnimKey] = useState(0);
  const [syncState, setSyncState] = useState<SyncState>({
    status: "idle",
    updatedAt: null,
    message: "Not synced yet",
  });

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setJob(null);
    setSearchError("");
    setSyncState({ status: "syncing", updatedAt: Date.now(), message: "Checking latest status..." });
    try {
      const { jobs } = await jobsApi.search(trimmed);
      await new Promise((r) => setTimeout(r, 250));
      if (jobs.length > 0) {
        setJob(jobs[0]);
        setSearchError("");
        setSyncState({
          status: "ok",
          updatedAt: Date.now(),
          message: "Live updates connected",
        });
      } else {
        setJob(null);
        setSearchError("");
        setSyncState({
          status: "error",
          updatedAt: Date.now(),
          message: "No job found for that tracking number",
        });
      }
      setSearched(true);
      setAnimKey((k) => k + 1);
    } catch (err: unknown) {
      setJob(null);
      const message = toErrorMessage(err, "Unable to search jobs right now.");
      setSearchError(message);
      setSyncState({ status: "error", updatedAt: Date.now(), message });
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => doSearch(query);
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } };

  useEffect(() => {
    if (!searched || !job) return;

    const trimmed = query.trim();
    if (!trimmed) return;

    const intervalId = window.setInterval(async () => {
      setSyncState((prev) => ({
        status: "syncing",
        updatedAt: prev.updatedAt,
        message: "Checking for new updates...",
      }));

      try {
        const { jobs } = await jobsApi.search(trimmed);
        if (jobs.length > 0) {
          setJob(jobs[0]);
          setSyncState({
            status: "ok",
            updatedAt: Date.now(),
            message: "Live sync healthy",
          });
        } else {
          setSyncState({
            status: "error",
            updatedAt: Date.now(),
            message: "Tracker did not return a job during sync",
          });
        }
      } catch (err: unknown) {
        setSyncState({
          status: "error",
          updatedAt: Date.now(),
          message: toErrorMessage(err, "Auto-sync failed. Please retry search."),
        });
      }
    }, 20000);

    return () => window.clearInterval(intervalId);
  }, [job, query, searched]);

  const clientAlignedStages = useMemo(() => {
    if (!job) return [] as ClientAlignedStage[];
    return buildClientAlignedStages(job);
  }, [job]);

  // Computed
  const workflowSummary = useMemo(() => {
    if (!job) {
      return {
        approvedCount: 0,
        totalStages: 0,
        progressPercent: 0,
        currentStatusLabel: "Not started",
        workflowLabel: "In Progress",
      };
    }

    const totalStages = clientAlignedStages.length;
    const approvedCount = clientAlignedStages.filter((stage) => stage.statusLabel === "Approved").length;
    const progressPercent =
      totalStages > 0 ? Math.round((approvedCount / totalStages) * 100) : 0;

    const hasBlockedStage = clientAlignedStages.some(
      (stage) => stage.statusLabel === "Queried" || stage.statusLabel === "Rejected"
    );

    const workflowLabel = approvedCount === totalStages && totalStages > 0
      ? "Completed"
      : hasBlockedStage
        ? "Queried"
        : "In Progress";

    const activeStage =
      clientAlignedStages.find(
        (stage) =>
          stage.statusLabel === "Upcoming" ||
          stage.statusLabel === "Queried" ||
          stage.statusLabel === "Rejected"
      ) || clientAlignedStages[clientAlignedStages.length - 1];

    return {
      approvedCount,
      totalStages,
      progressPercent,
      currentStatusLabel: activeStage?.title || job.statusDisplay || job.status,
      workflowLabel,
    };
  }, [job, clientAlignedStages]);

  const registerWorkflowAccent =
    workflowSummary.workflowLabel === "Completed"
      ? "text-[#16a34a]"
      : workflowSummary.workflowLabel === "Queried"
        ? "text-[#B45309]"
        : "text-[#F07000]";

  return (
    <div className="w-[min(1180px,calc(100vw-28px))] mx-auto py-6 sm:py-8 px-1 sm:px-2 lg:px-4">
      {/* ── Hero / Search Section ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="text-center mb-8 rounded-[28px] px-4 py-8 sm:px-8 sm:py-10 client-surface-glass client-orb-glow"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-white/70 dark:bg-slate-800/70 border border-white/80 dark:border-slate-600/60 px-3 py-1.5 text-[11px] sm:text-[12px] font-[700] text-[#334155] dark:text-slate-200 mb-3">
          <Sparkles size={14} className="text-[#F07000]" />
          HD Workflow Intelligence
        </div>

        <h1 className="m-0 text-[29px] leading-[1.15] sm:text-[40px] font-[900] text-[#0f172a] dark:text-slate-100 mb-2">
          Track Your <span className="client-gradient-text">Job Status</span>
        </h1>
        <p className="m-0 text-[#475569] dark:text-slate-300 text-[14px] sm:text-[16px] max-w-[640px] mx-auto mb-6">
          Enter your tracking number or regional number to view the latest workflow progress.
        </p>

        {/* Search bar */}
        <div className="max-w-[560px] mx-auto">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2.5 bg-white/95 dark:bg-slate-900/80 border-2 border-[#F0E6DA] dark:border-slate-600/60 rounded-[16px] px-4 py-3.5 focus-within:border-[#F07000] focus-within:shadow-[0_0_0_4px_rgba(240,112,0,0.08)] transition-all">
              <Search size={20} className="text-[#94a3b8]" />
              <input
                id="jobInput"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. SGGA C3824/2026"
                className="border-none outline-none w-full text-[15px] bg-transparent text-[#0f172a] dark:text-slate-100 placeholder:text-[#b0b8c4] dark:placeholder:text-slate-500"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="shrink-0 border-none cursor-pointer font-[800] rounded-[16px] px-6 py-3.5 bg-gradient-to-r from-[#F07000] to-[#f59e0b] text-white text-[14px] sm:text-[15px] disabled:opacity-50 hover:brightness-[1.03] transition-all active:scale-[0.98] shadow-[0_10px_24px_rgba(240,112,0,0.35)]"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching
                </span>
              ) : "Search"}
            </button>
          </div>


        </div>

        {searched && (
          <div className="mt-3 flex items-center justify-center">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-[600] ${
                syncState.status === "ok"
                  ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]"
                  : syncState.status === "syncing"
                    ? "border-[#fed7aa] bg-[#fff7ed] text-[#9a3412]"
                    : syncState.status === "error"
                      ? "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]"
                      : "border-[#e2e8f0] bg-[#f8fafc] text-[#475569]"
              }`}
            >
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  syncState.status === "ok"
                    ? "bg-[#16a34a]"
                    : syncState.status === "syncing"
                      ? "bg-[#f97316] animate-pulse"
                      : syncState.status === "error"
                        ? "bg-[#dc2626]"
                        : "bg-[#94a3b8]"
                }`}
              />
              <span>Sync: {syncState.message}</span>
              <span className="text-[11px] opacity-80">Last update {formatSyncTime(syncState.updatedAt)}</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Results Area ── */}
      <AnimatePresence mode="wait">
        {/* Empty state */}
        {!searched && !job && !loading && (
          <motion.div
            key="empty"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -16, transition: { duration: 0.2 } }}
            className="client-surface-elevated rounded-[22px] p-8 sm:p-10 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-[#FFF5EB] rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(240,112,0,0.18)]">
              <Search size={28} className="text-[#F07000]" />
            </div>
            <h2 className="m-0 mb-2 text-[18px] font-[800] text-[#0f172a] dark:text-slate-100">Search for Your Job</h2>
            <p className="m-0 text-[#64748b] dark:text-slate-300 text-[14px] max-w-[380px] mx-auto">
              Enter your regional number above and click <b>Search</b> to view the full certification workflow progress on one page.
            </p>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="client-surface-elevated rounded-[22px] p-8 sm:p-10 text-center"
          >
            <div className="w-10 h-10 mx-auto mb-4 border-4 border-[#F07000] border-t-transparent rounded-full animate-spin" />
            <p className="m-0 text-[#64748b] dark:text-slate-300 text-[14px]">Searching...</p>
          </motion.div>
        )}

        {/* Not found */}
        {searched && !job && !loading && (
          <motion.div
            key="notfound"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -16, transition: { duration: 0.2 } }}
            className="client-surface-elevated rounded-[22px] p-8 sm:p-10 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-[#FEF2F2] rounded-full flex items-center justify-center">
              <Radar size={28} className="text-[#b91c1c]" />
            </div>
            <h2 className="m-0 mb-2 text-[18px] font-[800] text-[#0f172a] dark:text-slate-100">Job Not Found</h2>
            <p className="m-0 text-[#64748b] dark:text-slate-300 text-[14px]">
              {searchError || "No job matches that number. Please check and try again."}
            </p>
          </motion.div>
        )}

        {/* ── RESULTS: all on one page ── */}
        {job && !loading && (
          <motion.div
            key={`result-${animKey}`}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            variants={stagger}
            className="grid gap-6"
          >
            {/* ═══ Summary Cards ═══ */}
            <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Job ID", value: job.jobId, accent: "text-[#0f172a]" },
                { label: "Current Status", value: workflowSummary.currentStatusLabel, accent: registerWorkflowAccent },
                { label: "Progress", value: `${workflowSummary.progressPercent}%`, accent: "text-[#F07000]" },
                { label: "Workflow", value: workflowSummary.workflowLabel, accent: registerWorkflowAccent },
              ].map((stat) => (
                <div key={stat.label} className="client-surface-elevated client-surface-interactive rounded-[18px] p-4 sm:p-5">
                  <p className="m-0 text-[11px] font-[600] text-[#94a3b8] uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className={`m-0 text-[17px] sm:text-[20px] font-[900] leading-tight ${stat.accent}`}>{stat.value}</p>
                </div>
              ))}
            </motion.div>

            {/* ═══ Progress Bar ═══ */}
            <motion.div variants={fadeUp} className="client-surface-elevated rounded-[18px] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 text-[12px] font-[700] text-[#475569] shrink-0"><Workflow size={15} className="text-[#F07000]" />Overall Progress</span>
                <div className="flex-1 h-3 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#F07000] to-[#FF9A3C] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${workflowSummary.progressPercent}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                  />
                </div>
                <motion.span
                  key={workflowSummary.progressPercent}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="text-[14px] font-[800] text-[#F07000] shrink-0"
                >
                  {workflowSummary.progressPercent}%
                </motion.span>
              </div>
              <p className="m-0 mt-2 text-[12px] text-[#94a3b8] dark:text-slate-400">
                {workflowSummary.approvedCount} of {workflowSummary.totalStages} stages approved
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="client-surface-elevated rounded-[20px] p-5 sm:p-6 overflow-hidden">
              <h3 className="m-0 text-[15px] font-[800] text-[#0f172a] dark:text-slate-100 pb-3 mb-4 border-b border-[#f5f0ea] dark:border-slate-700/70">
                9-Step Workflow Stages
              </h3>
              <div className="overflow-x-auto rounded-[14px] border border-[#efe2d2] dark:border-slate-700/70 bg-white/85 dark:bg-slate-900/70">
                <table className="min-w-full border-separate border-spacing-0 text-[13px]">
                  <thead>
                    <tr>
                      <th className="text-left font-[700] text-[#475569] dark:text-slate-300 bg-gradient-to-r from-[#fff9f1] to-[#fff4e8] dark:from-slate-800 dark:to-slate-850 px-4 py-3 border-y border-[#F0E6DA] dark:border-slate-700/70 border-l rounded-tl-[10px]">
                        <span className="inline-flex items-center gap-2">
                          <ClipboardList size={14} className="text-[#F07000]" />
                          Job Step/Stage Type
                        </span>
                      </th>
                      <th className="text-left font-[700] text-[#475569] dark:text-slate-300 bg-gradient-to-r from-[#fff9f1] to-[#fff4e8] dark:from-slate-800 dark:to-slate-850 px-4 py-3 border-y border-[#F0E6DA] dark:border-slate-700/70">
                        <span className="inline-flex items-center gap-2">
                          <BadgeCheck size={14} className="text-[#16a34a]" />
                          Status
                        </span>
                      </th>
                      <th className="text-left font-[700] text-[#475569] dark:text-slate-300 bg-gradient-to-r from-[#fff9f1] to-[#fff4e8] dark:from-slate-800 dark:to-slate-850 px-4 py-3 border-y border-[#F0E6DA] dark:border-slate-700/70 border-r rounded-tr-[10px]">
                        <span className="inline-flex items-center gap-2">
                          <BadgeInfo size={14} className="text-[#2563eb]" />
                          Comment
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientAlignedStages.map((stage, index) => {
                      const badgeTone = getBadgeTone(stage.statusLabel);
                      const statusIcon = getStatusIcon(stage.statusLabel);

                      return (
                        <tr key={`${stage.stepNumber}-${index}`} className="align-top odd:bg-[#fffdfa] dark:odd:bg-slate-900/35 hover:bg-[#fff8f1] dark:hover:bg-orange-500/10 transition-colors">
                          <td className="px-4 py-3 border-b border-l border-[#F4EBDD] dark:border-slate-700/60">
                            <p className="m-0 text-[11px] font-[700] text-[#94a3b8] uppercase tracking-wider">
                              Workflow Step {stage.displayStep}/9
                            </p>
                            <p className="m-0 mt-0.5 text-[10px] font-[600] text-[#94a3b8] uppercase tracking-wide">
                              Maps to Admin Step {stage.stepNumber}/14
                            </p>
                            <div className="mt-1 inline-flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-[#f0e6da] dark:border-slate-700 flex items-center justify-center shadow-[0_3px_8px_rgba(15,23,42,0.08)]">
                                {statusIcon}
                              </span>
                              <p className="m-0 text-[14px] font-[700] text-[#0f172a] dark:text-slate-100">
                                {stage.title}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 border-b border-[#F4EBDD] dark:border-slate-700/60">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-[700] ${badgeTone}`}>
                              {statusIcon}
                              {stage.statusLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-b border-r border-[#F4EBDD] dark:border-slate-700/60 text-[#475569] dark:text-slate-300 leading-relaxed">
                            {stage.comment}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* ═══ Job Information ═══ */}
            <motion.div variants={fadeUp} className="client-surface-elevated rounded-[20px] p-5 sm:p-6">
              <h3 className="m-0 text-[15px] font-[800] text-[#0f172a] dark:text-slate-100 pb-3 mb-4 border-b border-[#f5f0ea] dark:border-slate-700/70">
                Job Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                {[
                  { label: "Job ID", value: job.jobId, icon: <BadgeInfo size={14} className="text-[#2563eb]" /> },
                  { label: "Title", value: job.jobType, icon: <ClipboardList size={14} className="text-[#0f766e]" /> },
                  { label: "Status", value: workflowSummary.currentStatusLabel, icon: <BadgeCheck size={14} className="text-[#16a34a]" /> },
                  { label: "Client", value: job.clientName || "—", icon: <UserRound size={14} className="text-[#0f766e]" /> },
                  { label: "Requested By", value: job.requestedByName || "—", icon: <UserRound size={14} className="text-[#7c3aed]" /> },
                  { label: "Regional No.", value: job.regionalNumber ?? "—", icon: <MapPinned size={14} className="text-[#9333ea]" /> },
                  { label: "Parcel Size", value: job.parcelSize ?? "—", icon: <Ruler size={14} className="text-[#ea580c]" /> },
                  { label: "Created", value: new Date(job.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), icon: <CalendarDays size={14} className="text-[#0369a1]" /> },
                ].map((row) => (
                  <div key={row.label} className="rounded-[14px] border border-[#efe2d2] dark:border-slate-700/70 bg-gradient-to-br from-white to-[#fffaf3] dark:from-slate-900/85 dark:to-slate-800/60 p-3.5 sm:p-4 client-surface-interactive">
                    <div className="flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-1.5 text-[#64748b] dark:text-slate-300">
                        {row.icon}
                        {row.label}
                      </span>
                      <b className="text-[#0f172a] dark:text-slate-100 text-right">{row.value}</b>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ═══ Actions ═══ */}
            <motion.div variants={fadeUp} className="client-surface-glass rounded-[18px] px-4 py-4 sm:px-5 flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 border-none cursor-pointer font-[800] rounded-[14px] px-6 py-3.5 bg-[#0f172a] text-white text-[13px] transition-all hover:bg-[#1e293b] active:scale-[0.98] shadow-[0_12px_28px_rgba(15,23,42,0.28)]"
              >
                <Printer size={16} />
                Print Report
              </button>
              <button
                type="button"
                onClick={() => { setJob(null); setSearched(false); setQuery(""); }}
                className="inline-flex items-center gap-2 border-2 border-[#F0E6DA] bg-white cursor-pointer font-[800] rounded-[14px] px-6 py-3.5 text-[#0f172a] text-[13px] transition-all hover:bg-[#FFF5EB] active:scale-[0.98] shadow-[0_8px_20px_rgba(240,112,0,0.16)]"
              >
                <RotateCcw size={16} />
                New Search
              </button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="client-surface-glass rounded-[16px] py-3.5 px-4 sm:px-6 flex items-center justify-center gap-2 text-[12px] sm:text-[13px] text-[#475569] dark:text-slate-200"
            >
              <ShieldCheck size={15} className="text-[#15803d]" />
              Secure workflow data refreshes every 20 seconds while this tracker is active.
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
