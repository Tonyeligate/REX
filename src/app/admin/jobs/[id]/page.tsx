"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { jobsApi, type BackendTrackingStage } from "@/lib/api";
import type { Job, JobStatus } from "@/types/job";
import type { JobStepDecision } from "@/types/job";

function stripLeadingStageNumber(label: string): string {
  return label.replace(/^\s*\d+\s*[\.\-:)]?\s*/u, "").trim();
}

function decisionTileClasses(decisionText: string): string {
  const normalized = decisionText.trim().toLowerCase();
  if (normalized.includes("accept") || normalized.includes("approve") || normalized.includes("certif")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100";
  }
  if (normalized.includes("query")) {
    return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100";
  }
  return "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100";
}

function getDecisionLabel(decision?: JobStepDecision): string {
  const display = String(decision?.decisionDisplay ?? "").trim();
  if (display) return display;
  const raw = String(decision?.decision ?? "").trim();
  if (!raw) return "No decision";
  return raw.replace(/_/g, " ");
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

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = useMemo(() => String(params?.id ?? "").trim(), [params]);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [backendTrackingStages, setBackendTrackingStages] = useState<BackendTrackingStage[]>([]);
  const [selectedStageCode, setSelectedStageCode] = useState("");

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
      setError(err instanceof Error ? err.message : "Failed to load job.");
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
      const label = stripLeadingStageNumber(stage.label) || stage.code;
      return {
        line: `Step ${pos} of ${total} — ${label}`,
        code: stage.code,
      };
    }
    if (job.statusDisplay?.trim()) {
      return { line: job.statusDisplay.trim(), code };
    }
    return { line: code || "—", code };
  }, [job, workflowCurrentIndex, backendTrackingStages]);

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
          label: stripLeadingStageNumber(stage.label) || stage.code,
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

  const readOnlyRequestedBy = useMemo(() => {
    if (!job) return "—";
    return job.requestedByName?.trim() || "—";
  }, [job]);

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
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/jobs")}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-[12px] font-semibold hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={14} />
          Back to jobs
        </button>
        <h1 className="text-[18px] font-bold text-foreground">Job {job.jobId}</h1>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>}

      <div className={`rounded-xl border px-4 py-3 ${backendStatusBannerClasses(job.status)}`}>
        <p className="text-[11px] font-semibold uppercase tracking-wide opacity-90">Job status (backend)</p>
        <p className="mt-1 text-[15px] font-bold">{job.statusDisplay?.trim() || "—"}</p>
        <p className="mt-1 text-[12px] leading-snug opacity-90">{currentStageSummary.line}</p>
        <p className="mt-2 text-[10px] font-mono opacity-70">
          Code: {String(job.backendStatus ?? "").trim() || "—"}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
        <h2 className="mb-3 text-[14px] font-semibold">Job Summary</h2>
        <div className="grid grid-cols-1 gap-2 text-[12px] text-slate-700 dark:text-slate-200 md:grid-cols-3">
          <p><span className="text-slate-400">Client:</span> {job.clientName || "—"}</p>
          <p><span className="text-slate-400">Regional Number:</span> {job.regionalNumber || "—"}</p>
          <p><span className="text-slate-400">Requested By:</span> {readOnlyRequestedBy}</p>
          <p><span className="text-slate-400">Created:</span> {new Date(job.createdAt).toLocaleDateString()}</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
        <h2 className="mb-3 text-[14px] font-semibold">Progress</h2>
        <p className="mb-3 text-[12px] text-muted-foreground">
          Stage list and decisions below now come directly from backend tracking stages and backend step decisions.
        </p>
        <div className="overflow-x-auto pb-1">
          <div className="inline-flex min-w-full items-center gap-2">
            {backendTrackingStages.map((stage, index) => {
              const state =
                workflowCurrentIndex < 0
                  ? "upcoming"
                  : index <= workflowCurrentIndex
                    ? "completed"
                    : "upcoming";
              return (
                <span
                  key={stage.code}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${
                    state === "completed"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  <span className="font-semibold">{stage.order}.</span>
                  <span>{stage.label}</span>
                </span>
              );
            })}
          </div>
        </div>

        <h3 className="mb-2 mt-4 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
          Backend step decision lookup
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-[12px]">
            <span className="mb-1 block text-slate-500">Stage</span>
            <select
              value={selectedStageCode}
              onChange={(e) => setSelectedStageCode(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] dark:border-slate-600 dark:bg-slate-800"
            >
              <option value="">Select backend stage…</option>
              {backendTrackingStages.map((stage) => (
                <option key={stage.code} value={stage.code}>
                  {stage.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedStageCode ? (
          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-[12px] dark:border-slate-700 dark:bg-slate-800/50">
            {selectedStageDecision ? (
              <>
                <p><span className="text-slate-500">Decision:</span> {getDecisionLabel(selectedStageDecision)}</p>
                <p className="mt-1"><span className="text-slate-500">Comment:</span> {selectedStageDecision.comment?.trim() || "—"}</p>
                <p className="mt-1"><span className="text-slate-500">Updated:</span> {selectedStageDecision.updatedAt || selectedStageDecision.createdAt || "—"}</p>
              </>
            ) : (
              <p className="text-muted-foreground">No backend step decision has been recorded for this stage yet.</p>
            )}
          </div>
        ) : null}

        {backendDecisionTiles.length > 0 ? (
          <div className="mt-4">
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Backend step decisions
            </h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {backendDecisionTiles.map((tile) => (
                <div
                  key={tile.code}
                  className={`rounded-lg border p-3 text-[12px] ${decisionTileClasses(tile.decisionLabel)}`}
                >
                  <p className="font-semibold leading-tight">{tile.label}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wide opacity-90">
                    {tile.decisionLabel}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed opacity-95">
                    {tile.comment || "—"}
                  </p>
                  {tile.decidedAt ? (
                    <p className="mt-2 text-[10px] opacity-70">Updated: {tile.decidedAt}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
