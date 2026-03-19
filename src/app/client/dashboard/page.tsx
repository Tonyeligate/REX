"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Job, JobStepDecision, WorkflowStep } from "@/types/job";
import { jobsApi, STATUS_STEP_MAP } from "@/lib/api";
import { CLIENT_STAGE_MATCH_META } from "@/lib/register-stage-mapping";

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

const CLIENT_ADMIN_ALIGNED_STAGE_ORDER = [1, 2, 3, 6, 7, 9, 10, 12, 13, 14] as const;

type ClientAlignedStageStatus = "Approved" | "Queried" | "Rejected" | "In Review" | "Pending";

type ClientAlignedStage = {
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

function getStatusFromWorkflowStep(step?: WorkflowStep): ClientAlignedStageStatus {
  if (!step) return "Pending";
  const fallbackOutcome = parseDecisionOutcome(step.decisionDisplay || step.decision);
  if (fallbackOutcome === "reject") return "Rejected";
  if (step.status === "COMPLETED") return "Approved";
  if (step.status === "QUERIED") return "Queried";
  if (step.status === "ACTIVE") return "In Review";
  return "Pending";
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

  // Backend currently caps register workflow at 7_region.
  // Treat the final client-facing register stages as completed when that cap is reached.
  if (backendStatus === "7_region" && (stepNumber === 13 || stepNumber === 14)) {
    return "Approved";
  }

  if (stepNumber <= currentStepNumber) {
    return "Approved";
  }

  return "Pending";
}

function getBadgeTone(statusLabel: ClientAlignedStageStatus): string {
  if (statusLabel === "Approved") return "bg-[#dcfce7] text-[#15803d]";
  if (statusLabel === "Rejected") return "bg-[#fee2e2] text-[#b91c1c]";
  if (statusLabel === "Queried") return "bg-[#FEF3C7] text-[#B45309]";
  if (statusLabel === "In Review") return "bg-[#ffedd5] text-[#c2410c]";
  return "bg-[#f1f5f9] text-[#94a3b8]";
}

function buildClientAlignedStages(job: Job): ClientAlignedStage[] {
  return CLIENT_ADMIN_ALIGNED_STAGE_ORDER.map((stepNumber) => {
    const meta = CLIENT_STAGE_MATCH_META[stepNumber];
    const latestDecision = getLatestDecisionByCodes(job.stepDecisions, meta?.backendCodes ?? []);
    const decisionOutcome = parseDecisionOutcome(
      latestDecision?.decisionDisplay || latestDecision?.decision
    );
    const fallbackStep = job.steps.find((step) => step.stepNumber === stepNumber);

    let statusLabel: ClientAlignedStageStatus;
    if (decisionOutcome === "approve") {
      statusLabel = "Approved";
    } else if (decisionOutcome === "query") {
      statusLabel = "Queried";
    } else if (decisionOutcome === "reject") {
      statusLabel = "Rejected";
    } else {
      statusLabel =
        job.backendStatus
          ? getStatusFromBackendProgress(job, stepNumber)
          : getStatusFromWorkflowStep(fallbackStep);
    }

    return {
      stepNumber,
      title: meta?.adminLabel || `Stage ${stepNumber}`,
      statusLabel,
      comment:
        latestDecision?.comment?.trim() ||
        fallbackStep?.comment?.trim() ||
        "No backend comment for this stage yet.",
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
    setSyncState({ status: "syncing", updatedAt: Date.now(), message: "Checking latest backend status..." });
    try {
      const { jobs } = await jobsApi.search(trimmed);
      await new Promise((r) => setTimeout(r, 250));
      if (jobs.length > 0) {
        setJob(jobs[0]);
        setSearchError("");
        setSyncState({
          status: "ok",
          updatedAt: Date.now(),
          message: "Connected to backend updates",
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
        (stage) => stage.statusLabel === "In Review" || stage.statusLabel === "Queried" || stage.statusLabel === "Rejected"
      ) || clientAlignedStages.find((stage) => stage.statusLabel === "Pending") || clientAlignedStages[clientAlignedStages.length - 1];

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
    <div className="w-[min(820px,calc(100vw-32px))] mx-auto py-8 px-1">
      {/* ── Hero / Search Section ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="text-center mb-8"
      >
        <h1 className="m-0 text-[26px] sm:text-[32px] font-[900] text-[#0f172a] mb-2">
          Track Your <span className="text-[#F07000]">Job Status</span>
        </h1>
        <p className="m-0 text-[#64748b] text-[15px] max-w-[480px] mx-auto mb-6">
          Enter your RNR or actual regional number to view the latest backend workflow progress.
        </p>

        {/* Search bar */}
        <div className="max-w-[560px] mx-auto">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2.5 bg-white border-2 border-[#F0E6DA] rounded-[14px] px-4 py-3 focus-within:border-[#F07000] focus-within:shadow-[0_0_0_4px_rgba(240,112,0,0.08)] transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                id="jobInput"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. RN-GAR-2026-001 or ARN/Regional Number"
                className="border-none outline-none w-full text-[15px] bg-transparent text-[#0f172a] placeholder:text-[#b0b8c4]"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="shrink-0 border-none cursor-pointer font-[700] rounded-[14px] px-6 py-3 bg-[#F07000] text-white text-[15px] disabled:opacity-50 hover:bg-[#D06000] transition-colors active:scale-[0.97] shadow-[0_4px_12px_rgba(240,112,0,0.25)]"
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
            className="bg-white border border-[#F0E6DA] rounded-[20px] p-10 text-center shadow-sm"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-[#FFF5EB] rounded-full flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F07000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </div>
            <h2 className="m-0 mb-2 text-[18px] font-[800] text-[#0f172a]">Search for Your Job</h2>
            <p className="m-0 text-[#64748b] text-[14px] max-w-[380px] mx-auto">
              Enter your RNR or actual regional number above and click <b>Search</b> to view the full certification workflow progress on one page.
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
            className="bg-white border border-[#F0E6DA] rounded-[20px] p-10 text-center shadow-sm"
          >
            <div className="w-10 h-10 mx-auto mb-4 border-4 border-[#F07000] border-t-transparent rounded-full animate-spin" />
            <p className="m-0 text-[#64748b] text-[14px]">Searching...</p>
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
            className="bg-white border border-[#F0E6DA] rounded-[20px] p-10 text-center shadow-sm"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-[#FEF2F2] rounded-full flex items-center justify-center text-[28px]">
              🔍
            </div>
            <h2 className="m-0 mb-2 text-[18px] font-[800] text-[#0f172a]">Job Not Found</h2>
            <p className="m-0 text-[#64748b] text-[14px]">
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
            <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Job ID", value: job.jobId, accent: "text-[#0f172a]" },
                { label: "Current Status", value: workflowSummary.currentStatusLabel, accent: registerWorkflowAccent },
                { label: "Progress", value: `${workflowSummary.progressPercent}%`, accent: "text-[#F07000]" },
                { label: "Workflow", value: workflowSummary.workflowLabel, accent: registerWorkflowAccent },
              ].map((stat) => (
                <div key={stat.label} className="bg-white border border-[#F0E6DA] rounded-[16px] p-4 shadow-sm">
                  <p className="m-0 text-[11px] font-[600] text-[#94a3b8] uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className={`m-0 text-[18px] font-[800] ${stat.accent}`}>{stat.value}</p>
                </div>
              ))}
            </motion.div>

            {/* ═══ Progress Bar ═══ */}
            <motion.div variants={fadeUp} className="bg-white border border-[#F0E6DA] rounded-[16px] shadow-sm p-5">
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-[600] text-[#64748b] shrink-0">Overall Progress</span>
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
              <p className="m-0 mt-2 text-[12px] text-[#94a3b8]">
                {workflowSummary.approvedCount} of {workflowSummary.totalStages} stages approved
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="bg-white border border-[#F0E6DA] rounded-[16px] shadow-sm p-5">
              <h3 className="m-0 text-[15px] font-[800] text-[#0f172a] pb-3 mb-4 border-b border-[#f5f0ea]">
                10-Step Workflow Stages
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-[13px]">
                  <thead>
                    <tr>
                      <th className="text-left font-[700] text-[#64748b] bg-[#FFF8F1] px-4 py-3 border-y border-[#F0E6DA] border-l rounded-tl-[10px]">
                        Job Step/Stage Type
                      </th>
                      <th className="text-left font-[700] text-[#64748b] bg-[#FFF8F1] px-4 py-3 border-y border-[#F0E6DA]">
                        Status
                      </th>
                      <th className="text-left font-[700] text-[#64748b] bg-[#FFF8F1] px-4 py-3 border-y border-[#F0E6DA] border-r rounded-tr-[10px]">
                        Comment
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientAlignedStages.map((stage, index) => {
                      const badgeTone = getBadgeTone(stage.statusLabel);

                      return (
                        <tr key={`${stage.stepNumber}-${index}`} className="align-top odd:bg-[#fffdfa]">
                          <td className="px-4 py-3 border-b border-l border-[#F4EBDD]">
                            <p className="m-0 text-[11px] font-[700] text-[#94a3b8] uppercase tracking-wider">
                              Stage {index + 1}/{workflowSummary.totalStages}
                            </p>
                            <p className="m-0 mt-1 text-[14px] font-[700] text-[#0f172a]">
                              {stage.title}
                            </p>
                          </td>
                          <td className="px-4 py-3 border-b border-[#F4EBDD]">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-[700] ${badgeTone}`}>
                              {stage.statusLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-b border-r border-[#F4EBDD] text-[#475569] leading-relaxed">
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
            <motion.div variants={fadeUp} className="bg-white border border-[#F0E6DA] rounded-[16px] shadow-sm p-5">
              <h3 className="m-0 text-[15px] font-[800] text-[#0f172a] pb-3 mb-4 border-b border-[#f5f0ea]">
                Job Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-[13px]">
                {[
                  { label: "Job ID", value: job.jobId },
                  { label: "Title", value: job.jobType },
                  { label: "Status", value: workflowSummary.currentStatusLabel },
                  { label: "Regional No.", value: job.regionalNumber ?? "—" },
                  { label: "Parcel Size", value: job.parcelSize ?? "—" },
                  { label: "Created", value: new Date(job.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) },
                  { label: "Assigned to", value: job.assignedTo ?? "—" },
                  { label: "Payment", value: job.paymentAmount ?? "—" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-1">
                    <span className="text-[#64748b]">{row.label}</span>
                    <b className="text-[#0f172a]">{row.value}</b>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ═══ Actions ═══ */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3 justify-center pt-2 pb-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="border-none cursor-pointer font-[700] rounded-[12px] px-6 py-3 bg-[#0f172a] text-white text-[13px] transition-all hover:bg-[#1e293b] active:scale-[0.98]"
              >
                🖨️ Print Report
              </button>
              <button
                type="button"
                onClick={() => { setJob(null); setSearched(false); setQuery(""); }}
                className="border-2 border-[#F0E6DA] bg-white cursor-pointer font-[700] rounded-[12px] px-6 py-3 text-[#0f172a] text-[13px] transition-all hover:bg-[#FFF5EB] active:scale-[0.98]"
              >
                ← New Search
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
