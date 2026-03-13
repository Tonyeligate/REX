"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Job } from "@/types/job";
import { jobsApi, registerFieldsApi } from "@/lib/api";
import { getRegisterProgressSummary } from "@/lib/register-progress";
import { WorkflowTimeline } from "@/components/sections/workflow-timeline";
import type { JobRegisterRecord } from "@/types/register";

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

/* ══════════════════════════════════════════════
   MAIN PAGE — Single-page Regional Number Tracker
   ══════════════════════════════════════════════ */
export default function ClientDashboardPage() {
  const [query, setQuery] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [registerRecord, setRegisterRecord] = useState<JobRegisterRecord | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setJob(null);
    setRegisterRecord(null);
    try {
      const { jobs } = await jobsApi.search(trimmed);
      await new Promise((r) => setTimeout(r, 250));
      if (jobs.length > 0) {
        const match = jobs[0];
        const [jobDetail, registerDetail] = await Promise.all([
          jobsApi.get(match.jobId),
          registerFieldsApi.get(match.jobId),
        ]);
        setJob(jobDetail.job);
        setRegisterRecord(registerDetail.record);
      } else {
        setJob(null);
        setRegisterRecord(null);
      }
      setSearched(true);
      setAnimKey((k) => k + 1);
    } catch {
      setJob(null);
      setRegisterRecord(null);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => doSearch(query);
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } };

  // Computed
  const registerSummary = getRegisterProgressSummary(registerRecord);
  const registerWorkflowAccent =
    registerSummary.workflowLabel === "Completed"
      ? "text-[#16a34a]"
      : registerSummary.workflowLabel === "Queried"
        ? "text-[#B45309]"
        : registerSummary.workflowLabel === "Rejected"
          ? "text-[#B91C1C]"
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
                { label: "Current Status", value: registerSummary.currentStatusLabel, accent: registerWorkflowAccent },
                { label: "Progress", value: `${registerSummary.progressPercent}%`, accent: "text-[#F07000]" },
                { label: "Workflow", value: registerSummary.workflowLabel, accent: registerWorkflowAccent },
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
                    animate={{ width: `${registerSummary.progressPercent}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                  />
                </div>
                <motion.span
                  key={registerSummary.progressPercent}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="text-[14px] font-[800] text-[#F07000] shrink-0"
                >
                  {registerSummary.progressPercent}%
                </motion.span>
              </div>
              <p className="m-0 mt-2 text-[12px] text-[#94a3b8]">
                {registerSummary.approvedCount} of {registerSummary.totalStages} stages approved
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="bg-white border border-[#F0E6DA] rounded-[16px] shadow-sm p-5">
              <h3 className="m-0 text-[15px] font-[800] text-[#0f172a] pb-3 mb-4 border-b border-[#f5f0ea]">
                Job Process Stages
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {registerSummary.stages.map((stage) => {
                  const tone =
                    stage.entry?.outcome === "accept"
                      ? "border-[#bbf7d0] bg-[#f0fdf4]"
                      : stage.entry?.outcome === "query"
                        ? "border-[#fde68a] bg-[#fffbeb]"
                        : stage.entry?.outcome === "reject"
                          ? "border-[#fecaca] bg-[#fef2f2]"
                          : "border-[#e2e8f0] bg-[#fafafa]";
                  const badgeTone =
                    stage.entry?.outcome === "accept"
                      ? "bg-[#dcfce7] text-[#15803d]"
                      : stage.entry?.outcome === "query"
                        ? "bg-[#FEF3C7] text-[#B45309]"
                        : stage.entry?.outcome === "reject"
                          ? "bg-[#FEE2E2] text-[#B91C1C]"
                          : "bg-[#f1f5f9] text-[#94a3b8]";

                  return (
                    <div key={stage.key} className={`rounded-[16px] border p-4 ${tone}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="m-0 text-[11px] font-[700] text-[#94a3b8] uppercase tracking-wider">Stage {stage.index}/{registerSummary.totalStages}</p>
                          <h4 className="m-0 mt-1 text-[14px] font-[800] text-[#0f172a]">{stage.label}</h4>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-[700] ${badgeTone}`}>
                          {stage.outcomeLabel}
                        </span>
                      </div>
                      <p className="m-0 text-[12px] text-[#64748b] leading-relaxed">
                        {stage.entry?.comment?.trim() || "No admin note for this stage yet."}
                      </p>
                    </div>
                  );
                })}
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
                  { label: "Status", value: registerSummary.currentStatusLabel },
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
              <WorkflowTimeline steps={job.steps} title="Detailed Workflow Timeline" />
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
