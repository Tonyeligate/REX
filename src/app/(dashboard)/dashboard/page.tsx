"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Clock,
  ClipboardList,
  Gauge,
  Search,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { reportsApi } from "@/lib/api";
import { useAuthStore, getUserDisplayName } from "@/lib/auth-store";

interface JobStats {
  total: number;
  inProgress: number;
  completed: number;
  queried: number;
  byStep: Record<number, number>;
}

export default function DashboardHome() {
  const user = useAuthStore((s) => s.user);
  const [jobStats, setJobStats] = useState<JobStats | null>(null);

  useEffect(() => {
    reportsApi.jobStats().then(setJobStats).catch(console.error);
  }, []);
  const pendingSteps = jobStats
    ? Object.values(jobStats.byStep).reduce((total, value) => total + value, 0)
    : null;
  const metrics = [
    {
      label: "Active Jobs",
  value: jobStats?.inProgress ?? "-",
  sub: jobStats ? `${jobStats.total} total jobs` : "Loading statistics",
  href: "/admin/jobs",
      icon: Briefcase,
      tone: "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300",
    },
    {
      label: "Completed",
      value: jobStats?.completed ?? "-",
  sub: "Fully delivered workflows",
  href: "/admin/jobs?status=COMPLETED",
  icon: CheckCircle2,
      tone: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    {
  label: "Queried",
  value: jobStats?.queried ?? "-",
  sub: "Needs attention",
  href: "/admin/jobs?status=QUERIED",
  icon: AlertTriangle,
  tone: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    },
    {
      label: "Pending Steps",
  value: pendingSteps ?? "-",
  sub: "Across all active jobs",
  href: "/admin/jobs",
      icon: Clock,
      tone: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
    },
  ] as const;

  return (
    <div className="admin-future-bg space-y-6">
      <section className="admin-surface-glass rounded-[28px] p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-[12px] font-[800] text-primary shadow-sm dark:bg-slate-950/35">
              <Sparkles size={14} />
              Live Operations Console
            </div>
            <h3 className="mt-3 text-[30px] font-[900] tracking-tight text-foreground sm:text-[36px]">
              Welcome back, <span className="text-primary">{getUserDisplayName(user)}</span>
            </h3>
            <p className="mt-2 max-w-xl text-[14px] text-muted-foreground sm:text-[15px]">
              Here&apos;s an overview of your Recs Geomatics Consult operations with the latest live job statistics.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[560px]">
            {metrics.map((metric) => {
              const Icon = metric.icon;

              return (
                <MetricCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  sub={metric.sub}
                  href={metric.href}
                  icon={Icon}
                  tone={metric.tone}
                />
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-[16px] font-[900] text-foreground sm:text-[18px]">Quick Actions</h4>
            <p className="text-[13px] text-muted-foreground">High-frequency entry points for the admin workflow.</p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-[12px] font-[800] text-muted-foreground shadow-sm dark:bg-slate-950/35 sm:inline-flex">
            <Gauge size={14} className="text-primary" />
            Dashboard ready
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <ActionCard
            title="Create New Job"
            desc="Start a new job certification workflow with premium speed."
            href="/admin/jobs/new"
            icon={Briefcase}
            accent="from-[#F07000] to-[#f59e0b]"
          />
          <ActionCard
            title="Search Job Status"
            desc="Look up a job by ID or regional number in seconds."
            href="/client/dashboard"
            icon={Search}
            accent="from-emerald-600 to-teal-500"
          />
          <ActionCard
            title="Open Job Register"
            desc="Review workflow rows, stages, and operational notes."
            href="/admin/jobs"
            icon={ClipboardList}
            accent="from-slate-800 to-slate-600"
          />
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub: string;
  href: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className="admin-surface-elevated client-surface-interactive group rounded-[22px] p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone}`}>
          <Icon size={18} />
        </div>
        <ArrowUpRight size={16} className="text-muted-foreground transition-colors group-hover:text-primary" />
      </div>

      <div className="mt-4 text-[24px] font-[900] leading-tight text-foreground">{value}</div>
      <div className="text-[12px] font-[800] text-foreground/80">{label}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>
    </Link>
  );
}

function ActionCard({
  title,
  desc,
  href,
  icon: Icon,
  accent,
}: {
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-[24px] p-5 text-white shadow-[0_18px_42px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-1 ${accent}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.26),transparent_35%)]" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white shadow-lg backdrop-blur-sm">
          <Icon size={18} />
        </div>
        <ArrowUpRight
          size={16}
          className="text-white/80 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </div>
      <h5 className="relative mt-5 text-[16px] font-[900]">{title}</h5>
      <p className="relative mt-1 text-[13px] leading-relaxed text-white/82">{desc}</p>
    </Link>
  );
}
