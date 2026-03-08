"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Job, WorkflowStep } from "@/types/job";
import { jobsApi } from "@/lib/api";

/* ── Quick-Search Chips (loaded from API) ── */
// Chips are loaded dynamically from the jobs list on mount

/* ── Department color map ── */
const DEPT_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  "Client":                      { bg: "bg-[#fef3c7]", text: "text-[#92400e]", border: "border-[#fde68a]", icon: "👤" },
  "CSAU":                        { bg: "bg-[#ede9fe]", text: "text-[#5b21b6]", border: "border-[#ddd6fe]", icon: "🏛️" },
  "Licensed Surveyor (L/S 461)": { bg: "bg-[#dbeafe]", text: "text-[#1e40af]", border: "border-[#bfdbfe]", icon: "📐" },
  "SMD Examination":             { bg: "bg-[#fce7f3]", text: "text-[#9d174d]", border: "border-[#fbcfe8]", icon: "🔬" },
  "Chief Examiner":              { bg: "bg-[#d1fae5]", text: "text-[#065f46]", border: "border-[#a7f3d0]", icon: "✅" },
  "SMD Region":                  { bg: "bg-[#ffedd5]", text: "text-[#9a3412]", border: "border-[#fed7aa]", icon: "🗺️" },
};

function getDeptStyle(dept?: string) {
  return DEPT_COLORS[dept ?? ""] ?? { bg: "bg-[#f1f5f9]", text: "text-[#475569]", border: "border-[#e2e8f0]", icon: "📋" };
}

function stepState(s: { status: string }) {
  if (s.status === "COMPLETED") return "done" as const;
  if (s.status === "ACTIVE") return "current" as const;
  return "todo" as const;
}

/* ── Animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 240, damping: 24 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

/* ── Pulse ring for the active dot ── */
function PulseDot({ color = "#F07000" }: { color?: string }) {
  return (
    <motion.span
      className="absolute inset-[-5px] rounded-full"
      style={{ borderWidth: 2, borderColor: color, borderStyle: "solid" }}
      animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* ── Timeline Step Row ── */
function TimelineStep({ step, index, total, isLast }: { step: WorkflowStep; index: number; total: number; isLast: boolean }) {
  const state = stepState(step);
  const dept = getDeptStyle(step.department);

  return (
    <motion.div variants={fadeUp} className="flex gap-4 sm:gap-6">
      {/* ── Left: vertical connector ── */}
      <div className="flex flex-col items-center">
        {/* Step circle */}
        <div className={`
          relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-[15px] sm:text-[17px] font-[900] shrink-0 transition-all
          ${state === "done" ? "bg-[#16a34a] text-white shadow-[0_0_0_4px_rgba(22,163,74,0.15)]" : ""}
          ${state === "current" ? "bg-[#F07000] text-white shadow-[0_0_0_4px_rgba(240,112,0,0.18)]" : ""}
          ${state === "todo" ? "bg-[#f1f5f9] text-[#94a3b8] border-2 border-[#e2e8f0]" : ""}
        `}>
          {state === "done" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          ) : (
            index + 1
          )}
          {state === "current" && <PulseDot />}
        </div>
        {/* Vertical line */}
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[24px] ${
            state === "done" ? "bg-[#16a34a]" : "bg-[#e2e8f0]"
          }`} />
        )}
      </div>

      {/* ── Right: step content ── */}
      <div className={`flex-1 pb-6 ${isLast ? "pb-0" : ""}`}>
        <div className={`
          rounded-[16px] border p-4 sm:p-5 transition-all
          ${state === "done" ? "border-[#bbf7d0] bg-white" : ""}
          ${state === "current" ? "border-[#F07000]/30 bg-white shadow-[0_4px_24px_rgba(240,112,0,0.08)]" : ""}
          ${state === "todo" ? "border-[#e2e8f0] bg-[#fafafa]" : ""}
        `}>
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-[700] text-[#94a3b8] uppercase tracking-wider">
                Step {index + 1}/{total}
              </span>
              {state === "done" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-[700] bg-[#dcfce7] text-[#15803d]">
                  Completed
                </span>
              )}
              {state === "current" && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-[700] bg-[#FFF0E0] text-[#C05500]"
                >
                  In Progress
                </motion.span>
              )}
              {state === "todo" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-[700] bg-[#f1f5f9] text-[#94a3b8]">
                  Pending
                </span>
              )}
            </div>
            {/* Department badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-[700] border shrink-0 ${dept.bg} ${dept.text} ${dept.border}`}>
              <span>{dept.icon}</span>
              <span className="hidden sm:inline">{step.department ?? "—"}</span>
            </span>
          </div>

          {/* Title */}
          <h3 className={`
            m-0 text-[15px] sm:text-[17px] font-[800] leading-tight mb-1.5
            ${state === "current" ? "text-[#0f172a]" : state === "done" ? "text-[#1e293b]" : "text-[#94a3b8]"}
          `}>
            {step.title}
          </h3>

          {/* Note */}
          <p className={`
            m-0 text-[13px] leading-relaxed
            ${state === "todo" ? "text-[#cbd5e1]" : "text-[#64748b]"}
          `}>
            {step.note}
          </p>

          {/* Completion date */}
          {state === "done" && step.completedAt && (
            <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-[#64748b]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <span>{new Date(step.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE — Single-page Regional Number Tracker
   ══════════════════════════════════════════════ */
export default function ClientDashboardPage() {
  const [query, setQuery] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setJob(null);
    try {
      const { jobs } = await jobsApi.search(trimmed);
      await new Promise((r) => setTimeout(r, 250));
      setJob(jobs.length > 0 ? jobs[0] : null);
      setSearched(true);
      setAnimKey((k) => k + 1);
    } catch {
      setJob(null);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => doSearch(query);
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } };

  // Computed
  const total = job?.steps.length ?? 0;
  const doneCount = job?.steps.filter((s) => s.status === "COMPLETED").length ?? 0;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

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
          Enter your Regional Number or Job ID below to view the complete certification workflow progress.
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
                placeholder="e.g. LS-2024-464 or Regional Number"
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
              Enter your Regional Number or Job ID above and click <b>Search</b> to view the full certification workflow progress on one page.
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
              No job matches that number. Please check and try again.
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
                { label: "Current Status", value: job.statusDisplay ?? job.status.replace(/_/g, " "), accent: job.status === "QUERIED" ? "text-[#dc2626]" : "text-[#0f172a]" },
                { label: "Progress", value: `${pct}%`, accent: "text-[#F07000]" },
                { label: "Workflow", value: job.status === "COMPLETED" ? "Completed" : job.status === "QUERIED" ? "Queried" : "In Progress", accent: job.status === "COMPLETED" ? "text-[#16a34a]" : "text-[#F07000]" },
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
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                  />
                </div>
                <motion.span
                  key={pct}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="text-[14px] font-[800] text-[#F07000] shrink-0"
                >
                  {pct}%
                </motion.span>
              </div>
              <p className="m-0 mt-2 text-[12px] text-[#94a3b8]">
                {doneCount} of {total} steps completed
              </p>
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
                  { label: "Status", value: job.statusDisplay ?? job.status.replace(/_/g, " ") },
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

            {/* ═══ Full Workflow Timeline (ALL steps on one page) ═══ */}
            <motion.div variants={fadeUp}>
              <h3 className="m-0 text-[17px] font-[800] text-[#0f172a] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#F07000] rounded-md flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                </span>
                Workflow Timeline
              </h3>
              <motion.div variants={stagger} initial="hidden" animate="visible">
                {job.steps.map((step, i) => (
                  <TimelineStep
                    key={i}
                    step={step}
                    index={i}
                    total={total}
                    isLast={i === total - 1}
                  />
                ))}
              </motion.div>
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
