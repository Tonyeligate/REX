"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarSquareIcon,
  CheckBadgeIcon,
  ClockIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/solid";
import { reportsApi } from "@/lib/api";
import { useAuthStore, getUserDisplayName } from "@/lib/auth-store";

interface JobStats {
  total: number;
  inProgress: number;
  completed: number;
  queried: number;
  byStep: Record<number, number>;
  byStatus: Record<string, number>;
}

export default function DashboardHome() {
  const user = useAuthStore((s) => s.user);
  const [jobStats, setJobStats] = useState<JobStats | null>(null);

  useEffect(() => {
    reportsApi.jobStats().then(setJobStats).catch(console.error);
  }, []);

  const totalJobs = jobStats?.total ?? 0;
  const inProgress = jobStats?.inProgress ?? 0;
  const completed = jobStats?.completed ?? 0;
  const queried = jobStats?.queried ?? 0;
  const pendingSteps = Object.values(jobStats?.byStatus ?? {}).reduce(
    (total, value) => total + value,
    0
  );

  const completionRate =
    totalJobs > 0 ? Math.round((completed / totalJobs) * 100) : 0;
  const queryRate = totalJobs > 0 ? Math.round((queried / totalJobs) * 100) : 0;
  const activeRate =
    totalJobs > 0 ? Math.round((inProgress / totalJobs) * 100) : 0;

  const funnelOrder = [
    { key: "1_rnr", label: "1. RNR" },
    { key: "2_regional_number", label: "2. Regional Number" },
    { key: "3_job_production", label: "3. Job Production" },
    { key: "4_ls_cert", label: "4. LS Certification" },
    { key: "5_csau_payment", label: "5. CSAU Payment" },
    { key: "6_examination", label: "6. Examination" },
    { key: "7_region", label: "7. Region" },
    { key: "8_signed_out_csau", label: "8. Signed Out" },
    { key: "9_delivered_to_client", label: "9. Delivered" },
  ] as const;

  const stageEntries = funnelOrder.map((stage) => ({
    ...stage,
    count: jobStats?.byStatus?.[stage.key] ?? 0,
  }));
  const maxStageCount = stageEntries.reduce(
    (max, item) => (item.count > max ? item.count : max),
    1
  );

  const kpis = [
    {
      title: "Active Jobs",
      value: inProgress,
      helper: `${activeRate}% of all workflows`,
      trend: "up" as const,
      icon: BriefcaseIcon,
      color:
        "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
      href: "/admin/jobs",
    },
    {
      title: "Completed",
      value: completed,
      helper: `${completionRate}% completion rate`,
      trend: "up" as const,
      icon: CheckCircleIcon,
      color:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
      href: "/admin/jobs?status=COMPLETED",
    },
    {
      title: "Queried",
      value: queried,
      helper: `${queryRate}% needing intervention`,
      trend: queried > 0 ? ("down" as const) : ("up" as const),
      icon: ExclamationTriangleIcon,
      color:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
      href: "/admin/jobs?status=QUERIED",
    },
    {
      title: "Pending Steps",
      value: pendingSteps,
      helper: "Across open operational stages",
      trend: "up" as const,
      icon: ClockIcon,
      color: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
      href: "/admin/jobs",
    },
  ] as const;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border/70 bg-card px-5 py-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:shadow-[0_18px_36px_rgba(2,8,22,0.5)] sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-primary">
              <Squares2X2Icon className="h-4 w-4" />
              Executive Overview
            </div>
            <h2 className="mt-3 text-[30px] font-[900] leading-tight text-foreground sm:text-[36px]">
              Welcome back, <span className="text-primary">{getUserDisplayName(user)}</span>
            </h2>
            <p className="mt-2 text-[14px] text-muted-foreground sm:text-[15px]">
              Real-time operational intelligence across active jobs, completion throughput, and exception queues.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckBadgeIcon className="h-4 w-4" />
            Analytics feed is live
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const TrendIcon =
            kpi.trend === "down" ? ArrowTrendingDownIcon : ArrowTrendingUpIcon;
          return (
            <Link
              key={kpi.title}
              href={kpi.href}
              className="group rounded-2xl border border-border/70 bg-card p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(15,23,42,0.1)] dark:shadow-[0_16px_28px_rgba(2,8,22,0.4)]"
            >
              <div className="flex items-start justify-between">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${kpi.color}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <div className="mt-4 text-[30px] font-[900] leading-none text-foreground">
                {kpi.value}
              </div>
              <div className="mt-1 text-[13px] font-bold text-foreground/90">{kpi.title}</div>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                <TrendIcon className="h-3.5 w-3.5" />
                {kpi.helper}
              </div>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_12px_26px_rgba(15,23,42,0.06)] dark:shadow-[0_16px_30px_rgba(2,8,22,0.4)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[17px] font-[900] text-foreground">Operational Funnel</h3>
              <p className="text-[12px] text-muted-foreground">
                Distribution of records across workflow stages.
              </p>
            </div>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FunnelIcon className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {stageEntries.map((entry) => {
              const width = Math.max(
                6,
                Math.round((entry.count / Math.max(maxStageCount, 1)) * 100)
              );
              return (
                <div key={entry.key}>
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-foreground/85">{entry.label}</span>
                    <span className="font-bold text-foreground">{entry.count}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_12px_26px_rgba(15,23,42,0.06)] dark:shadow-[0_16px_30px_rgba(2,8,22,0.4)]">
          <h3 className="text-[17px] font-[900] text-foreground">Performance Quality</h3>
          <p className="text-[12px] text-muted-foreground">
            Workflow health indicators for current operations.
          </p>

          <div className="mt-4 space-y-3">
            <RateRow
              label="Completion rate"
              value={`${completionRate}%`}
              barClass="bg-gradient-to-r from-emerald-500 to-teal-400"
              width={completionRate}
            />
            <RateRow
              label="Active throughput"
              value={`${activeRate}%`}
              barClass="bg-gradient-to-r from-primary to-amber-400"
              width={activeRate}
            />
            <RateRow
              label="Exception rate"
              value={`${queryRate}%`}
              barClass="bg-gradient-to-r from-amber-500 to-yellow-400"
              width={queryRate}
            />
          </div>

          <div className="mt-4 rounded-xl border border-border/70 bg-muted/50 p-3 text-[12px] text-muted-foreground">
            <div className="flex items-start gap-2">
              <InformationCircleIcon className="mt-0.5 h-4 w-4 text-primary" />
              <span>
                Completion quality improves when queried jobs are cleared within same-day cycles.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.06)] dark:shadow-[0_12px_22px_rgba(2,8,22,0.35)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-[15px] font-[900] text-foreground">Command Center</h4>
            <p className="text-[12px] text-muted-foreground">Operational shortcuts.</p>
          </div>
          <span className="hidden items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-[12px] font-bold text-muted-foreground sm:inline-flex">
            <SparklesIcon className="h-4 w-4 text-primary" />
            Recommended actions
          </span>
        </div>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          <ActionCard
            title="Create New Job"
            desc="Start and assign a new workflow record."
            href="/admin/jobs/new"
            icon={BriefcaseIcon}
            tone="primary"
          />
          <ActionCard
            title="Search Job Status"
            desc="Find any job by RN, regional number, or client."
            href="/client/tracking"
            icon={MagnifyingGlassIcon}
            tone="success"
          />
          <ActionCard
            title="Open Job Register"
            desc="Review stage decisions and register rows."
            href="/admin/jobs"
            icon={ClipboardDocumentListIcon}
            tone="neutral"
          />
        </div>
      </section>
    </div>
  );
}

function ActionCard({
  title,
  desc,
  href,
  icon: Icon,
  tone,
}: {
  title: string;
  desc: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tone: "primary" | "success" | "neutral";
}) {
  const toneStyles = {
    primary: {
      shell:
        "border-primary/20 bg-gradient-to-br from-primary/[0.10] via-white to-orange-50 dark:from-primary/20 dark:via-slate-900 dark:to-slate-900",
      icon:
        "bg-primary text-white shadow-[0_8px_20px_rgba(240,112,0,0.35)]",
      ring: "group-hover:border-primary/40",
    },
    success: {
      shell:
        "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:border-emerald-500/25 dark:from-emerald-500/15 dark:via-slate-900 dark:to-slate-900",
      icon:
        "bg-emerald-600 text-white shadow-[0_8px_20px_rgba(5,150,105,0.35)]",
      ring: "group-hover:border-emerald-300 dark:group-hover:border-emerald-400/35",
    },
    neutral: {
      shell:
        "border-slate-200 bg-gradient-to-br from-slate-100/80 via-white to-slate-50 dark:border-slate-500/25 dark:from-slate-700/25 dark:via-slate-900 dark:to-slate-900",
      icon:
        "bg-slate-700 text-white shadow-[0_8px_20px_rgba(51,65,85,0.35)]",
      ring: "group-hover:border-slate-300 dark:group-hover:border-slate-400/35",
    },
  } as const;
  const currentTone = toneStyles[tone];

  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-xl border p-3.5 text-foreground shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_22px_rgba(15,23,42,0.12)] ${currentTone.shell} ${currentTone.ring}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.32),transparent_40%)]" />
      <div className="relative flex items-start justify-between gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${currentTone.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
        <ArrowTopRightOnSquareIcon className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
      <h5 className="relative mt-3 text-[14px] font-[900]">{title}</h5>
      <p className="relative mt-1 text-[12px] leading-relaxed text-muted-foreground">{desc}</p>
    </Link>
  );
}

function RateRow({
  label,
  value,
  width,
  barClass,
}: {
  label: string;
  value: string;
  width: number;
  barClass: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="font-semibold text-foreground/85">{label}</span>
        <span className="font-bold text-foreground">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${Math.max(3, width)}%` }}
        />
      </div>
    </div>
  );
}
