"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { WORKFLOW_STATUSES, jobsApi, type BackendStatus } from "@/lib/api";
import type { Job } from "@/types/job";

const REGISTER_STAGE_COLS: {
  key: string;
  label: string;
  subLabel?: string;
  stepIndex: number;
}[] = [
  { key: "in_production", label: "Job Production", subLabel: "Done", stepIndex: 2 },
  { key: "certified_ls461", label: "L/S Cert.", subLabel: "Certified", stepIndex: 5 },
  { key: "at_csau_payment", label: "CSAU", subLabel: "Payment", stepIndex: 6 },
  { key: "examination_smd", label: "Examination", subLabel: "Checking", stepIndex: 8 },
  { key: "certified_smd", label: "Examination", subLabel: "Cert.", stepIndex: 9 },
  { key: "at_region", label: "Region", subLabel: "Region No.", stepIndex: 11 },
  { key: "delivered_to_client", label: "Region", subLabel: "Reg. Book", stepIndex: 13 },
];

type CellState = "done" | "active" | "queried" | "pending";

function getStepIndex(status: string): number {
  const idx = WORKFLOW_STATUSES.indexOf(status as BackendStatus);
  return idx === -1 ? 0 : idx;
}

function getCellState(jobStatus: string, colStepIndex: number): CellState {
  const jobIdx = getStepIndex(jobStatus);
  if (jobStatus === "queried_ls461" && colStepIndex === 5) return "queried";
  if (jobStatus === "queried_smd" && (colStepIndex === 8 || colStepIndex === 9)) return "queried";
  if (jobIdx > colStepIndex) return "done";
  if (jobIdx === colStepIndex) return "active";
  return "pending";
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

function getActualRegionalNumber(job: Job): string {
  return job.regionalNumber || job.jobId || "—";
}

function StageCell({
  state,
  onClick,
  comment,
}: {
  state: CellState;
  onClick: () => void;
  comment?: string;
}) {
  const [hovered, setHovered] = useState(false);

  if (state === "done") {
    return (
      <td
        className="relative text-center px-1 py-2 border border-[#d1fae5] bg-[#f0fdf4] cursor-pointer hover:bg-[#dcfce7] transition-colors"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
      >
        <CheckCircle size={15} className="text-green-600 mx-auto" />
        {comment && hovered && (
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 bg-gray-800 text-white text-[11px] rounded-lg px-2 py-1.5 shadow-lg pointer-events-none whitespace-normal">
            {comment}
          </div>
        )}
      </td>
    );
  }

  if (state === "active") {
    return (
      <td
        className="text-center px-1 py-2 border border-[#fed7aa] bg-[#fff7ed] cursor-pointer hover:bg-[#ffedd5] transition-colors"
        onClick={onClick}
        title="Currently at this stage — click to update"
      >
        <Clock size={14} className="text-orange-500 mx-auto animate-pulse" />
      </td>
    );
  }

  if (state === "queried") {
    return (
      <td
        className="text-center px-1 py-2 border border-[#fde68a] bg-[#fffbeb] cursor-pointer hover:bg-[#fef3c7] transition-colors"
        onClick={onClick}
        title="Queried at this stage"
      >
        <AlertTriangle size={14} className="text-amber-500 mx-auto" />
      </td>
    );
  }

  return <td className="text-center px-1 py-2 border border-[#e5e7eb] bg-white" />;
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

export default function JobsRegisterPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState<{
    job: Job;
    col: (typeof REGISTER_STAGE_COLS)[0];
    state: CellState;
  } | null>(null);

  const loadJobs = useCallback(() => {
    setLoading(true);
    jobsApi
      .list()
      .then((data) => setJobs(data.jobs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesSearch =
        !q ||
        job.jobId.toLowerCase().includes(q) ||
        job.jobType.toLowerCase().includes(q) ||
        (job.clientName ?? "").toLowerCase().includes(q) ||
        (job.queryReason ?? "").toLowerCase().includes(q) ||
        (job.statusDisplay ?? job.status).toLowerCase().includes(q);

      const matchesStatus = !statusFilter || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, statusFilter]);

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
      "Actual Regional Number",
      "Job Production",
      "L/S Certificate",
      "CSAU",
      "Examination (Checking)",
      "Examination (Certification)",
      "Region No.",
      "Reg. Book",
      "Status / Notes",
    ];

    const rows = filteredJobs.map((job, index) => {
      const row: Record<string, string | number> = {
        "#": index + 1,
        "Client Name": getRegisterName(job),
        RNR: job.jobId ?? "",
        "Actual Regional Number": getActualRegionalNumber(job),
      };

      const getStageValue = (stepIndex: number) => {
        const state = getCellState(job.backendStatus ?? job.status, stepIndex);
        return state === "done" ? "✓" : state === "active" ? "→" : state === "queried" ? "⚠" : "";
      };

      row["Job Production"] = getStageValue(2);
      row["L/S Certificate"] = getStageValue(5);
      row["CSAU"] = getStageValue(6);
      row["Examination (Checking)"] = getStageValue(8);
      row["Examination (Certification)"] = getStageValue(9);
      row["Region No."] = getStageValue(11);
      row["Reg. Book"] = getStageValue(13);
      row["Status / Notes"] = [job.statusDisplay ?? job.status, getRegisterReference(job), job.queryReason]
        .filter(Boolean)
        .join(" | ");

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
    ws["!cols"] = headers.map((header) =>
      header === "Client Name" || header === "Status / Notes"
        ? { wch: 30 }
        : header === "RNR" || header === "Actual Regional Number"
          ? { wch: 18 }
          : { wch: 14 }
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jobs Register");
    XLSX.writeFile(wb, `Jobs-Register-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleCellClick = (job: Job, col: (typeof REGISTER_STAGE_COLS)[0]) => {
    const state = getCellState(job.backendStatus ?? job.status, col.stepIndex);
    if (state === "pending") return;
    setModal({ job, col, state });
  };

  return (
    <div>
      <div className="flex flex-col gap-4 mb-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h3 className="text-[22px] font-bold text-[#1f2937]">Job Management Register</h3>
          <p className="text-[13px] text-[#9ca3af]">
            Presented like the physical register: client names first, reference numbers next, then stage-by-stage checks.
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
          <Link
            href="/admin/jobs/new"
            className="flex items-center gap-2 h-[38px] px-4 bg-[#F07000] text-white rounded-lg text-[13px] font-semibold hover:bg-[#D06000] transition-colors"
          >
            <Plus size={14} /> New Job
          </Link>
        </div>
      </div>

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
            <span className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-600" /> Completed</span>
            <span className="flex items-center gap-1.5"><Clock size={13} className="text-orange-500" /> Active</span>
            <span className="flex items-center gap-1.5"><AlertTriangle size={13} className="text-amber-500" /> Queried</span>
            <span className="flex items-center gap-1.5"><MessageSquare size={13} className="text-blue-400" /> Click active cells to update</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] border-collapse table-fixed min-w-[1080px] xl:min-w-0">
            <thead>
              <tr className="bg-[#1f2937] text-white">
                <th rowSpan={2} className="border border-[#374151] px-3 py-2 text-center font-bold w-8">#</th>
                <th rowSpan={2} className="border border-[#374151] px-3 py-2 text-left font-bold w-[200px]">Client Name</th>
                <th rowSpan={2} className="border border-[#374151] px-3 py-2 text-left font-bold w-[135px]">RNR</th>
                <th rowSpan={2} className="border border-[#374151] px-3 py-2 text-left font-bold w-[150px]">Act. Regional No.</th>
                <th colSpan={1} className="border border-[#374151] px-3 py-1.5 text-center font-bold bg-[#374151]">Job Production</th>
                <th colSpan={1} className="border border-[#374151] px-3 py-1.5 text-center font-bold bg-[#1e3a5f]">L/S Cert.</th>
                <th colSpan={1} className="border border-[#374151] px-3 py-1.5 text-center font-bold bg-[#374151]">CSAU</th>
                <th colSpan={2} className="border border-[#374151] px-3 py-1.5 text-center font-bold bg-[#1e3a5f]">Examination</th>
                <th colSpan={2} className="border border-[#374151] px-3 py-1.5 text-center font-bold bg-[#374151]">Region</th>
              </tr>
              <tr className="bg-[#374151] text-[#d1d5db] text-[11px]">
                <th className="border border-[#4b5563] px-1 py-1.5 text-center font-semibold w-[58px]">Done</th>
                <th className="border border-[#4b5563] px-1 py-1.5 text-center font-semibold bg-[#1e3a5f] w-[58px]">Certified</th>
                <th className="border border-[#4b5563] px-1 py-1.5 text-center font-semibold w-[58px]">Payment</th>
                <th className="border border-[#4b5563] px-1 py-1.5 text-center font-semibold bg-[#1e3a5f] w-[58px]">Checking</th>
                <th className="border border-[#4b5563] px-1 py-1.5 text-center font-semibold bg-[#1e3a5f] w-[58px]">Cert.</th>
                <th className="border border-[#4b5563] px-1 py-1.5 text-center font-semibold w-[58px]">Region No.</th>
                <th className="border border-[#4b5563] px-1 py-1.5 text-center font-semibold w-[58px]">Reg. Book</th>
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
                          <span>Step {job.currentStep}/{job.steps.length}</span>
                          <span>•</span>
                          <span>{job.parcelSize ?? "—"} ac</span>
                          <span>•</span>
                          <span>{new Date(job.createdAt).toLocaleDateString()}</span>
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
                      <td className="border border-[#e5e7eb] px-2 py-2 font-mono text-[#4b5563] align-top">{getActualRegionalNumber(job)}</td>
                      {REGISTER_STAGE_COLS.map((col) => {
                        const state = getCellState(job.backendStatus ?? job.status, col.stepIndex);
                        return (
                          <StageCell
                            key={col.key}
                            state={state}
                            comment={job.queryReason}
                            onClick={() => handleCellClick(job, col)}
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

      {modal && (
        <StageModal
          job={modal.job}
          colLabel={modal.col.subLabel ? `${modal.col.label} – ${modal.col.subLabel}` : modal.col.label}
          stepIndex={modal.col.stepIndex}
          currentState={modal.state}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            loadJobs();
          }}
        />
      )}
    </div>
  );
}
