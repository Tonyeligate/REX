"use client";

import React, { useEffect, useState } from "react";
import {
  Loader2,
  TrendingUp,
  Users,
  Briefcase,
  DollarSign,
  Activity,
  CircleAlert,
} from "lucide-react";
import {
  ChartBarSquareIcon,
  PresentationChartLineIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { reportsApi } from "@/lib/api";

interface JobStats {
  total: number;
  inProgress: number;
  completed: number;
  queried: number;
  byStep: Record<string, number>;
  byStatus?: Record<string, number>;
}

interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  newThisMonth: number;
  duesCollected: number;
  byRegion: Record<string, number>;
}

export default function ReportsPage() {
  const [jobStats, setJobStats] = useState<JobStats | null>(null);
  const [memberStats, setMemberStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([reportsApi.jobStats(), reportsApi.membershipStats()])
      .then(([js, ms]) => {
        setJobStats(js);
        setMemberStats(ms);
        setError("");
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Failed to load live analytics.";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  const currency = new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  });

  const number = new Intl.NumberFormat("en-US");

  const STATUS_LABELS: Record<string, string> = {
    "1_rnr": "1. RNR",
    "2_regional_number": "2. Regional Number",
    "3_job_production": "3. Job Production",
    "4_ls_cert": "4. LS Certification",
    "5_csau_payment": "5. CSAU Payment",
    "6_examination": "6. Examination",
    "7_region": "7. Region",
    "8_signed_out_csau": "8. Signed Out (CSAU)",
    "9_delivered_to_client": "9. Delivered to Client",
  };

  const STATUS_ORDER = [
    "1_rnr",
    "2_regional_number",
    "3_job_production",
    "4_ls_cert",
    "5_csau_payment",
    "6_examination",
    "7_region",
    "8_signed_out_csau",
    "9_delivered_to_client",
  ];

  const getPercentage = (value: number, total: number) =>
    total > 0 ? (value / total) * 100 : 0;

  const sortEntries = (record: Record<string, number>) =>
    Object.entries(record).sort((a, b) => b[1] - a[1]);

  if (loading || !jobStats || !memberStats) {
    if (!loading && error) {
      return (
        <div className="admin-future-bg">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        </div>
      );
    }
    return (
      <div className="flex h-64 items-center justify-center text-[#9ca3af]">
        <Loader2 size={24} className="mr-2 animate-spin" /> Loading reports...
      </div>
    );
  }

  const jobCompletionRate = getPercentage(jobStats.completed, jobStats.total);
  const memberActivationRate = getPercentage(
    memberStats.activeMembers,
    memberStats.totalMembers
  );
  const jobQueryRate = getPercentage(jobStats.queried, jobStats.total);

  const canonicalStatusCounts = STATUS_ORDER.map((statusKey) => ({
    status: statusKey,
    label: STATUS_LABELS[statusKey],
    count: Number(jobStats.byStatus?.[statusKey] ?? 0),
  }));
  const regionRows = sortEntries(memberStats.byRegion);
  const workflowTrendData = canonicalStatusCounts.map((entry) => ({
    step: entry.label,
    status: entry.status,
    count: entry.count,
  }));
  const regionChartData = regionRows.map(([region, count]) => ({
    region,
    count,
  }));
  const completionPieData = [
    { name: "Completed", value: jobStats.completed },
    { name: "Remaining", value: Math.max(0, jobStats.total - jobStats.completed) },
  ];

  const donutCompletion = Math.round(jobCompletionRate);

  return (
    <div className="admin-future-bg space-y-6">
      <div className="relative rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white px-6 py-6 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(240,112,0,0.12),transparent_35%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.2),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.18),transparent_35%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F07000]/25 bg-[#fff7ed] px-3 py-1 text-[11px] font-[800] text-[#b45309] dark:bg-[#3b230d]/60 dark:text-[#ffd9b5] dark:border-[#ff8a1f]/30">
              <PresentationChartLineIcon className="h-[13px] w-[13px]" />
              Executive Reporting
            </div>
            <h1 className="mt-3 text-[28px] font-[900] tracking-tight text-foreground sm:text-[32px]">
              Reports & Analytics
            </h1>
            <p className="mt-1 max-w-2xl text-[14px] text-muted-foreground">
              Professional performance dashboard combining workflow throughput,
              member distribution, and revenue indicators for leadership decisions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf2ff] text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
              <ChartBarSquareIcon className="h-6 w-6" />
            </div>
            <div className="text-right">
              <p className="text-[11px] font-[700] uppercase tracking-wide text-muted-foreground">
                Last Snapshot
              </p>
              <p className="text-[13px] font-semibold text-foreground">
                Live system totals
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Jobs",
            value: number.format(jobStats.total),
            sub: "Active workflow inventory",
            icon: Briefcase,
            shell: "bg-[#fff2e6] text-[#F07000] dark:bg-[#3d2510]/70 dark:text-[#ffb27a]",
          },
          {
            label: "Completion Rate",
            value: `${jobCompletionRate.toFixed(1)}%`,
            sub: `${number.format(jobStats.completed)} completed`,
            icon: TrendingUp,
            shell: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
          },
          {
            label: "Query Exposure",
            value: `${jobQueryRate.toFixed(1)}%`,
            sub: `${number.format(jobStats.queried)} queried jobs`,
            icon: CircleAlert,
            shell: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
          },
          {
            label: "Dues Collected",
            value: currency.format(memberStats.duesCollected),
            sub: "Membership finance total",
            icon: DollarSign,
            shell: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/85"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-[700] uppercase tracking-wide text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-2 text-[28px] font-[900] leading-none text-foreground">
                    {card.value}
                  </p>
                  <p className="mt-2 text-[12px] text-muted-foreground">{card.sub}</p>
                </div>
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.shell}`}
                >
                  <Icon size={18} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-2 dark:border-slate-700 dark:bg-slate-900/85">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-[800] text-foreground">
              Workflow Trend (Line)
            </h3>
            <span className="text-[12px] text-muted-foreground">
              Jobs by stage volume
            </span>
          </div>
          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={workflowTrendData} margin={{ top: 10, right: 12, left: 0, bottom: 12 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.25)" />
                <XAxis
                  dataKey="step"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={52}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.35)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/85">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-[800] text-foreground">
              Completion Split
            </h3>
            <Activity size={16} className="text-blue-600" />
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="h-[220px] w-full max-w-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    <Cell fill="#2563eb" />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [number.format(value), name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="-mt-[126px] mb-[78px] text-center">
                <p className="text-[30px] font-[900] leading-none text-foreground">
                  {donutCompletion}%
                </p>
                <p className="text-[11px] font-semibold text-muted-foreground">Completed</p>
              </div>
            </div>
            <div className="mt-4 w-full space-y-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-semibold text-foreground">
                  {number.format(jobStats.completed)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Not completed</span>
                <span className="font-semibold text-foreground">
                  {number.format(jobStats.total - jobStats.completed)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Remainder</span>
                <span className="font-semibold text-foreground">
                  {Math.max(0, 100 - donutCompletion)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-2 dark:border-slate-700 dark:bg-slate-900/85">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-[15px] font-[800] text-foreground">
              <TrophyIcon className="h-4 w-4 text-emerald-600" />
              Membership by Region (Bar)
            </h3>
            <span className="text-[12px] text-muted-foreground">
              Ranked regional contribution
            </span>
          </div>
          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionChartData} margin={{ top: 10, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [number.format(value), "Members"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.35)",
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/85">
          <h3 className="mb-4 text-[15px] font-[800] text-foreground">
            Membership Health
          </h3>
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-[11px] font-[700] uppercase tracking-wide text-muted-foreground">
                Total Members
              </p>
              <p className="mt-1 text-[24px] font-[900] leading-none text-foreground">
                {number.format(memberStats.totalMembers)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-[11px] font-[700] uppercase tracking-wide text-muted-foreground">
                Active Rate
              </p>
              <p className="mt-1 text-[24px] font-[900] leading-none text-foreground">
                {memberActivationRate.toFixed(1)}%
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {number.format(memberStats.activeMembers)} active accounts
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-[11px] font-[700] uppercase tracking-wide text-muted-foreground">
                New This Month
              </p>
              <p className="mt-1 text-[24px] font-[900] leading-none text-foreground">
                {number.format(memberStats.newThisMonth)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/85">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-[800] text-foreground">
            Operational Funnel Snapshot
          </h3>
          <span className="text-[12px] text-muted-foreground">
            Jobs in progress and completion checkpoints
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Queued", value: jobStats.inProgress, tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
            { label: "Completed", value: jobStats.completed, tone: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300" },
            { label: "Queried", value: jobStats.queried, tone: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300" },
            { label: "Total Jobs", value: jobStats.total, tone: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
            { label: "Members", value: memberStats.totalMembers, tone: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-[700] uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.tone}`}>
                  {getPercentage(item.value, jobStats.total || 1).toFixed(0)}%
                </span>
              </div>
              <p className="mt-2 text-[24px] font-[900] leading-none text-foreground">
                {number.format(item.value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
