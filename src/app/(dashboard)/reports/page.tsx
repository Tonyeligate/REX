"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, PieChart, Loader2, TrendingUp, Users, Briefcase, DollarSign } from "lucide-react";
import { reportsApi } from "@/lib/api";

interface JobStats {
  total: number;
  inProgress: number;
  completed: number;
  queried: number;
  byStep: Record<string, number>;
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

  useEffect(() => {
    Promise.all([reportsApi.jobStats(), reportsApi.membershipStats()])
      .then(([js, ms]) => { setJobStats(js); setMemberStats(ms); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !jobStats || !memberStats) {
    return <div className="flex items-center justify-center h-64 text-[#9ca3af]"><Loader2 size={24} className="animate-spin mr-2" /> Loading reports...</div>;
  }

  return (
    <div className="admin-future-bg space-y-6">
      {/* Hero Section */}
      <div className="admin-surface-glass rounded-[28px] border border-border p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F07000]/25 bg-[#fff7ed] px-3 py-1 text-[11px] font-[800] text-[#b45309] dark:bg-[#3b230d]/60 dark:text-[#ffd9b5] dark:border-[#ff8a1f]/30">
              <BarChart3 size={13} />
              Analytics Dashboard
            </div>
            <h1 className="mt-3 text-[28px] sm:text-[32px] font-bold text-foreground\">Reports & Analytics</h1>
            <p className="mt-1 text-[14px] text-muted-foreground max-w-lg\">Comprehensive overview of job certification and membership data across the platform</p>
          </div>
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#F07000]/20 to-[#f59e0b]/10">
            <TrendingUp size={24} className="text-[#F07000]" />
          </div>
        </div>
      </div>

      {/* Job Statistics */}
      <div>
        <h4 className="text-[16px] font-bold text-foreground mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-[#F07000]" /> Job Certification Statistics</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Jobs", value: jobStats.total, icon: Briefcase, color: "from-[#F07000]/20 to-[#f59e0b]/10", textColor: "text-[#F07000]" },
            { label: "In Progress", value: jobStats.inProgress, icon: TrendingUp, color: "from-amber-500/20 to-amber-400/10", textColor: "text-amber-600" },
            { label: "Completed", value: jobStats.completed, icon: Briefcase, color: "from-green-500/20 to-green-400/10", textColor: "text-green-600" },
            { label: "Queried", value: jobStats.queried, icon: Users, color: "from-red-500/20 to-red-400/10", textColor: "text-red-600" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="admin-surface-elevated rounded-[18px] border border-border p-5 sm:p-6">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[12px] font-[700] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br ${s.color}`}>
                    <Icon size={18} className={s.textColor} />
                  </div>
                </div>
                <p className="text-[28px] font-[900] text-foreground mb-2">{s.value}</p>
                <div className="text-[12px] font-semibold text-muted-foreground">
                  {jobStats.total > 0 ? Math.round((s.value / jobStats.total) * 100) : 0}% of total
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Jobs by Step Chart */}
      <div className="admin-surface-elevated rounded-[18px] border border-border p-5 sm:p-6 mt-6">
        <h5 className="text-[14px] font-bold text-foreground mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-[#F07000]" />Jobs by Workflow Step</h5>
        <div className="space-y-3">
          {Object.entries(jobStats.byStep).map(([step, count]) => {
            const pct = jobStats.total > 0 ? (count / jobStats.total) * 100 : 0;
            return (
              <div key={step} className="flex items-center gap-3">
                <span className="text-[12px] text-foreground/70 w-40 flex-shrink-0 truncate font-medium" title={step}>Step {step}</span>
                <div className="flex-grow relative h-6 bg-muted rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#F07000] to-[#f59e0b] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-foreground/80">{count}</span>
                </div>
                <span className="text-[12px] text-muted-foreground w-12 text-right">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Membership Statistics */}
      <div className="mt-8">
        <h4 className="text-[16px] font-bold text-foreground mb-4 flex items-center gap-2"><PieChart size={18} className="text-green-600" /> Membership Statistics</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Members", value: memberStats.totalMembers.toString(), icon: Users, color: "from-blue-500/20 to-blue-400/10", textColor: "text-blue-600" },
            { label: "Active Members", value: memberStats.activeMembers.toString(), icon: TrendingUp, color: "from-green-500/20 to-green-400/10", textColor: "text-green-600" },
            { label: "New This Month", value: memberStats.newThisMonth.toString(), icon: Users, color: "from-purple-500/20 to-purple-400/10", textColor: "text-purple-600" },
            { label: "Dues Collected", value: `GH₵ ${memberStats.duesCollected.toFixed(2)}`, icon: DollarSign, color: "from-emerald-500/20 to-emerald-400/10", textColor: "text-emerald-600" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="admin-surface-elevated rounded-[18px] border border-border p-5 sm:p-6">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[12px] font-[700] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br ${s.color}`}>
                    <Icon size={18} className={s.textColor} />
                  </div>
                </div>
                <p className="text-[26px] font-[900] text-foreground">{s.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Members by Region */}
      <div className="admin-surface-elevated rounded-[18px] border border-border p-5 sm:p-6 mt-6">
        <h5 className="text-[14px] font-bold text-foreground mb-4 flex items-center gap-2"><PieChart size={16} className="text-green-600" />Members by Region</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(memberStats.byRegion).map(([region, count]) => {
            const pct = memberStats.totalMembers > 0 ? (count / memberStats.totalMembers) * 100 : 0;
            return (
              <div key={region} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <span className="text-[12px] text-foreground/70 w-32 flex-shrink-0 truncate font-medium">{region}</span>
                <div className="flex-grow relative h-6 bg-muted rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-foreground/80">{count}</span>
                </div>
                <span className="text-[12px] text-muted-foreground w-12 text-right">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
