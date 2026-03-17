"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  PlayCircle,
  Send,
  Loader2,
  Edit,
  ChevronRight,
} from "lucide-react";
import { jobsApi, type BackendStatus } from "@/lib/api";
import { getJobProgressSummary } from "@/lib/job-progress";
import type { Job, TimelineEntry } from "@/types/job";
import { useAuthStore } from "@/lib/auth-store";
import { WorkflowTimeline } from "@/components/sections/workflow-timeline";

const statusColors: Record<string, string> = {
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  QUERIED: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [advanceComment, setAdvanceComment] = useState("");
  const [advanceOutcome, setAdvanceOutcome] = useState<"accept" | "query" | "reject">("accept");
  const [timelineLabel, setTimelineLabel] = useState("");
  const [timelineSubtext, setTimelineSubtext] = useState("");
  const [addingTimeline, setAddingTimeline] = useState(false);

  const loadJob = useCallback(async () => {
    try {
      const data = await jobsApi.get(params.id);
      setJob(data.job);
    } catch {
      router.push("/admin/jobs");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const handleAdvanceStep = async () => {
    if (!job) return;
    if (advanceOutcome !== "accept" && !advanceComment.trim()) {
      alert("Please add a comment for Query or Reject actions.");
      return;
    }
    setAdvancing(true);
    try {
      if (advanceOutcome === "accept") {
        const updated = await jobsApi.advanceStep(job.jobId, {
          comment: advanceComment,
          completedBy: user?.firstName + " " + user?.lastName,
        });
        setJob(updated.job);
      } else {
        const qStatus: BackendStatus = (job.backendStatus ?? "").includes("ls461")
          ? "queried_ls461"
          : "queried_smd";
        const prefix = advanceOutcome === "reject" ? "REJECTED: " : "QUERIED: ";
        const updated = await jobsApi.transitionTo(job.jobId, {
          status: qStatus,
          notes: prefix + advanceComment,
          queryReason: advanceComment,
        });
        setJob(updated.job);
      }
      setAdvanceComment("");
      setAdvanceOutcome("accept");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to advance step");
    } finally {
      setAdvancing(false);
    }
  };

  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !timelineLabel || !timelineSubtext) return;
    setAddingTimeline(true);
    try {
      const response = await jobsApi.addTimeline(job.jobId, { label: timelineLabel, subtext: timelineSubtext });
      const entry = response.entry || response;
      setJob((prev) => prev ? { ...prev, timeline: [entry, ...prev.timeline] } : prev);
      setTimelineLabel("");
      setTimelineSubtext("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add timeline entry");
    } finally {
      setAddingTimeline(false);
    }
  };

  if (loading || !job) {
    return <div className="flex items-center justify-center h-64 text-[#9ca3af]"><Loader2 size={24} className="animate-spin mr-2" /> Loading job...</div>;
  }

  const progress = getJobProgressSummary(job);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/jobs" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-[22px] font-bold text-[#1f2937]">{job.jobId}</h3>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${statusColors[job.status]}`}>{job.statusDisplay ?? job.status.replace(/_/g, " ")}</span>
            </div>
            <p className="text-[13px] text-[#9ca3af]">{job.jobType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Actions can be added here */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Details + Workflow */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick info cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Current Step", value: progress.currentStepLabel, icon: ChevronRight },
              { label: "Progress", value: `${progress.progressPercent}%`, icon: Clock },
              { label: "Regional No.", value: job.regionalNumber || "N/A", icon: Edit },
              { label: "Parcel Size", value: job.parcelSize || "N/A", icon: Edit },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-[#e5e7eb] rounded-xl p-4">
                <p className="text-[11px] text-[#9ca3af] mb-1">{item.label}</p>
                <p className="text-[16px] font-bold text-[#1f2937]">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-[#F0E6DA] rounded-[16px] shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[12px] font-[600] text-[#64748b] shrink-0">Overall Progress</span>
              <div className="flex-1 h-3 bg-[#f1f5f9] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#F07000] to-[#FF9A3C] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progressPercent}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                />
              </div>
              <span className="text-[14px] font-[800] text-[#F07000] shrink-0">{progress.progressPercent}%</span>
            </div>

            <p className="m-0 mt-2 mb-5 text-[12px] text-[#94a3b8]">
              {progress.completedSteps} of {progress.totalSteps} steps completed
            </p>

            <WorkflowTimeline steps={job.steps} />

            {/* Advance step */}
            {job.status === "IN_PROGRESS" && job.currentStep <= job.steps.length && (
              <div className="mt-5 pt-5 border-t border-[#e5e7eb]">
                <h4 className="text-[13px] font-bold text-[#1f2937] mb-3">Step Action</h4>
                {/* Outcome selector */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {(["accept", "query", "reject"] as const).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setAdvanceOutcome(o)}
                      className={`py-2 rounded-lg text-[12px] font-bold border-2 transition-all ${
                        advanceOutcome === o
                          ? o === "accept" ? "border-green-500 bg-green-50 text-green-700"
                            : o === "query" ? "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-red-500 bg-red-50 text-red-700"
                          : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#d1d5db]"
                      }`}
                    >
                      {o === "accept" ? "✓ Accept" : o === "query" ? "⚠ Query" : "✕ Reject"}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <input
                    value={advanceComment}
                    onChange={(e) => setAdvanceComment(e.target.value)}
                    placeholder={advanceOutcome === "accept" ? "Comment (optional)..." : "Comment (required)..."}
                    className="flex-grow h-[40px] px-4 border border-[#e5e7eb] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20"
                  />
                  <button
                    onClick={handleAdvanceStep}
                    disabled={advancing}
                    className={`flex items-center gap-2 h-[40px] px-5 text-white rounded-lg font-semibold text-[13px] disabled:opacity-50 transition-colors ${
                      advanceOutcome === "accept" ? "bg-green-600 hover:bg-green-700"
                      : advanceOutcome === "query" ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {advancing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {advanceOutcome === "accept" ? "Accept" : advanceOutcome === "query" ? "Query" : "Reject"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Job Information */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
            <h4 className="text-[14px] font-bold text-[#1f2937] mb-4">Job Information</h4>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[13px]">
              {[
                ["RN (Job ID)", job.jobId],
                ["Title", job.jobType],
                ["Status", job.statusDisplay ?? job.status],
                ["Assigned To", job.assignedTo || "Unassigned"],
                ["Regional Number", job.regionalNumber || "N/A"],
                ["Parcel Size", job.parcelSize || "N/A"],
                ["Payment Amount", job.paymentAmount || "N/A"],
                ["Batch", job.batchName || "N/A"],
                ["Created", new Date(job.createdAt).toLocaleDateString()],
                ["Updated", new Date(job.updatedAt).toLocaleDateString()],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[#9ca3af] text-[11px]">{label}</p>
                  <p className="font-semibold text-[#1f2937]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column — Timeline */}
        <div className="space-y-6">
          {/* Add timeline entry */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
            <h4 className="text-[14px] font-bold text-[#1f2937] mb-3">Add Timeline Entry</h4>
            <form onSubmit={handleAddTimeline} className="space-y-3">
              <input
                value={timelineLabel}
                onChange={(e) => setTimelineLabel(e.target.value)}
                placeholder="Label (e.g. Plan submitted)"
                required
                className="w-full h-[40px] px-4 border border-[#e5e7eb] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20"
              />
              <textarea
                value={timelineSubtext}
                onChange={(e) => setTimelineSubtext(e.target.value)}
                placeholder="Description..."
                required
                rows={2}
                className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20 resize-none"
              />
              <button
                type="submit"
                disabled={addingTimeline}
                className="w-full flex items-center justify-center gap-2 h-[38px] bg-[#F07000] text-white rounded-lg font-semibold text-[13px] hover:bg-[#D06000] disabled:opacity-50 transition-colors"
              >
                {addingTimeline ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Add Entry
              </button>
            </form>
          </div>

          {/* Timeline */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
            <h4 className="text-[14px] font-bold text-[#1f2937] mb-4">Timeline</h4>
            {job.timeline.length === 0 ? (
              <p className="text-[13px] text-[#9ca3af]">No timeline entries yet.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-[#e5e7eb]" />
                <div className="space-y-4">
                  {job.timeline.map((entry: TimelineEntry) => (
                    <div key={entry.id} className="flex gap-3 relative">
                      <div className="flex-shrink-0 mt-0.5">
                        {entry.status === "done" ? (
                          <CheckCircle2 size={18} className="text-green-500 bg-white" />
                        ) : entry.status === "current" ? (
                          <PlayCircle size={18} className="text-orange-500 bg-white" />
                        ) : (
                          <Circle size={18} className="text-gray-300 bg-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#1f2937]">{entry.label}</p>
                        <p className="text-[11px] text-[#6b7280]">{entry.subtext}</p>
                        <p className="text-[10px] text-[#9ca3af] mt-0.5">{entry.createdAt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
