"use client";

import React from "react";
import { motion } from "framer-motion";
import type { WorkflowStep } from "@/types/job";

const DEPT_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  Client: { bg: "bg-[#fef3c7]", text: "text-[#92400e]", border: "border-[#fde68a]", icon: "👤" },
  CSAU: { bg: "bg-[#ede9fe]", text: "text-[#5b21b6]", border: "border-[#ddd6fe]", icon: "🏛️" },
  "Licensed Surveyor (L/S 461)": { bg: "bg-[#dbeafe]", text: "text-[#1e40af]", border: "border-[#bfdbfe]", icon: "📐" },
  "SMD Examination": { bg: "bg-[#fce7f3]", text: "text-[#9d174d]", border: "border-[#fbcfe8]", icon: "🔬" },
  "Chief Examiner": { bg: "bg-[#d1fae5]", text: "text-[#065f46]", border: "border-[#a7f3d0]", icon: "✅" },
  "SMD Region": { bg: "bg-[#ffedd5]", text: "text-[#9a3412]", border: "border-[#fed7aa]", icon: "🗺️" },
};

function getDeptStyle(dept?: string) {
  return DEPT_COLORS[dept ?? ""] ?? { bg: "bg-[#f1f5f9]", text: "text-[#475569]", border: "border-[#e2e8f0]", icon: "📋" };
}

function stepState(step: { status: string }) {
  if (step.status === "COMPLETED") return "done" as const;
  if (step.status === "ACTIVE") return "current" as const;
  if (step.status === "QUERIED") return "queried" as const;
  return "todo" as const;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 240, damping: 24 } },
};

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

function TimelineStep({ step, index, total, isLast }: { step: WorkflowStep; index: number; total: number; isLast: boolean }) {
  const state = stepState(step);
  const dept = getDeptStyle(step.department);

  return (
    <motion.div variants={fadeUp} className="flex gap-4 sm:gap-6">
      <div className="flex flex-col items-center">
        <div
          className={[
            "relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-[15px] sm:text-[17px] font-[900] shrink-0 transition-all",
            state === "done" ? "bg-[#16a34a] text-white shadow-[0_0_0_4px_rgba(22,163,74,0.15)]" : "",
            state === "current" ? "bg-[#F07000] text-white shadow-[0_0_0_4px_rgba(240,112,0,0.18)]" : "",
            state === "queried" ? "bg-[#f59e0b] text-white shadow-[0_0_0_4px_rgba(245,158,11,0.18)]" : "",
            state === "todo" ? "bg-[#f1f5f9] text-[#94a3b8] border-2 border-[#e2e8f0]" : "",
          ].join(" ")}
        >
          {state === "done" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          ) : state === "queried" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>
          ) : (
            index + 1
          )}
          {state === "current" && <PulseDot />}
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[24px] ${state === "done" ? "bg-[#16a34a]" : state === "queried" ? "bg-[#f59e0b]" : "bg-[#e2e8f0]"}`} />
        )}
      </div>

      <div className={`flex-1 pb-6 ${isLast ? "pb-0" : ""}`}>
        <div
          className={[
            "rounded-[16px] border p-4 sm:p-5 transition-all",
            state === "done" ? "border-[#bbf7d0] bg-white" : "",
            state === "current" ? "border-[#F07000]/30 bg-white shadow-[0_4px_24px_rgba(240,112,0,0.08)]" : "",
            state === "queried" ? "border-[#fde68a] bg-[#fffbeb]" : "",
            state === "todo" ? "border-[#e2e8f0] bg-[#fafafa]" : "",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-[700] text-[#94a3b8] uppercase tracking-wider">Step {index + 1}/{total}</span>
              {state === "done" && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-[700] bg-[#dcfce7] text-[#15803d]">Completed</span>}
              {state === "current" && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-[700] bg-[#FFF0E0] text-[#C05500]">In Progress</span>}
              {state === "queried" && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-[700] bg-[#FEF3C7] text-[#B45309]">Queried</span>}
              {state === "todo" && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-[700] bg-[#f1f5f9] text-[#94a3b8]">Pending</span>}
            </div>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-[700] border shrink-0 ${dept.bg} ${dept.text} ${dept.border}`}>
              <span>{dept.icon}</span>
              <span className="hidden sm:inline">{step.department ?? "—"}</span>
            </span>
          </div>

          <h3 className={`m-0 text-[15px] sm:text-[17px] font-[800] leading-tight mb-1.5 ${state === "current" ? "text-[#0f172a]" : state === "done" ? "text-[#1e293b]" : state === "queried" ? "text-[#92400e]" : "text-[#94a3b8]"}`}>
            {step.title}
          </h3>

          <p className={`m-0 text-[13px] leading-relaxed ${state === "todo" ? "text-[#cbd5e1]" : state === "queried" ? "text-[#a16207]" : "text-[#64748b]"}`}>
            {step.note}
          </p>

          {(state === "done" || state === "queried") && (step.completedAt || step.comment) && (
            <div className="mt-2.5 space-y-1 text-[12px] text-[#64748b]">
              {step.completedAt && (
                <div className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  <span>{new Date(step.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              )}
              {step.comment && <div className="rounded-lg bg-black/5 px-2 py-1">{step.comment}</div>}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function WorkflowTimeline({ steps, title = "Workflow Timeline" }: { steps: WorkflowStep[]; title?: string }) {
  return (
    <div>
      <h3 className="m-0 text-[17px] font-[800] text-[#0f172a] mb-4 flex items-center gap-2">
        <span className="w-6 h-6 bg-[#F07000] rounded-md flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
        </span>
        {title}
      </h3>
      <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}>
        {steps.map((step, index) => (
          <TimelineStep key={step.stepNumber} step={step} index={index} total={steps.length} isLast={index === steps.length - 1} />
        ))}
      </motion.div>
    </div>
  );
}