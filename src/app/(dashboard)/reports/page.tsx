"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, PieChart, Loader2 } from "lucide-react";
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
    <div>
      <div className="mb-6">
        <h3 className="text-[22px] font-bold text-[#1f2937]">Reports & Analytics</h3>
        <p className="text-[13px] text-[#9ca3af]">Comprehensive overview of job certification and membership data</p>
      </div>

      {/* Job Statistics */}
      <div className="mb-8">
        <h4 className="text-[16px] font-bold text-[#1f2937] mb-4 flex items-center gap-2"><BarChart3 size={18} /> Job Certification Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { label: "Total Jobs", value: jobStats.total, color: "bg-orange-50 text-orange-700" },
            { label: "In Progress", value: jobStats.inProgress, color: "bg-amber-50 text-amber-700" },
            { label: "Completed", value: jobStats.completed, color: "bg-green-50 text-green-700" },
            { label: "Queried", value: jobStats.queried, color: "bg-red-50 text-red-700" },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-[#e5e7eb] rounded-xl p-5">
              <p className="text-[11px] text-[#9ca3af] mb-1">{s.label}</p>
              <p className="text-[28px] font-black text-[#1f2937]">{s.value}</p>
              <div className={`mt-2 px-2 py-0.5 rounded text-[11px] font-bold inline-block ${s.color}`}>
                {jobStats.total > 0 ? Math.round((s.value / jobStats.total) * 100) : 0}%
              </div>
            </div>
          ))}
        </div>

        {/* Jobs by Step */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
          <h5 className="text-[14px] font-bold text-[#1f2937] mb-4">Jobs by Workflow Step</h5>
          <div className="space-y-2">
            {Object.entries(jobStats.byStep).map(([step, count]) => {
              const pct = jobStats.total > 0 ? (count / jobStats.total) * 100 : 0;
              return (
                <div key={step} className="flex items-center gap-3">
                  <span className="text-[12px] text-[#4b5563] w-40 flex-shrink-0 truncate" title={step}>Step {step}</span>
                  <div className="flex-grow bg-gray-100 rounded-full h-5 relative overflow-hidden">
                    <div className="bg-[#F07000] h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#1f2937]">{count}</span>
                  </div>
                  <span className="text-[11px] text-[#9ca3af] w-10 text-right">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Membership Statistics */}
      <div>
        <h4 className="text-[16px] font-bold text-[#1f2937] mb-4 flex items-center gap-2"><PieChart size={18} /> Membership Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { label: "Total Members", value: memberStats.totalMembers.toString() },
            { label: "Active Members", value: memberStats.activeMembers.toString() },
            { label: "New This Month", value: memberStats.newThisMonth.toString() },
            { label: "Dues Collected", value: `GH₵ ${memberStats.duesCollected.toFixed(2)}` },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-[#e5e7eb] rounded-xl p-5">
              <p className="text-[11px] text-[#9ca3af] mb-1">{s.label}</p>
              <p className="text-[28px] font-black text-[#1f2937]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Members by Region */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
          <h5 className="text-[14px] font-bold text-[#1f2937] mb-4">Members by Region</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(memberStats.byRegion).map(([region, count]) => {
              const pct = memberStats.totalMembers > 0 ? (count / memberStats.totalMembers) * 100 : 0;
              return (
                <div key={region} className="flex items-center gap-3">
                  <span className="text-[12px] text-[#4b5563] w-32 flex-shrink-0 truncate">{region}</span>
                  <div className="flex-grow bg-gray-100 rounded-full h-5 relative overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#1f2937]">{count}</span>
                  </div>
                  <span className="text-[11px] text-[#9ca3af] w-10 text-right">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
