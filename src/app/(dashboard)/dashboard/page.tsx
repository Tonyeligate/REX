"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  DollarSign,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { reportsApi, smsApi } from "@/lib/api";
import { useAuthStore, getUserDisplayName } from "@/lib/auth-store";

interface JobStats {
  total: number;
  inProgress: number;
  completed: number;
  queried: number;
  byStep: Record<number, number>;
}

interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  newThisMonth: number;
  duesCollected: number;
  byRegion: Record<string, number>;
}

export default function DashboardHome() {
  const user = useAuthStore((s) => s.user);
  const [jobStats, setJobStats] = useState<JobStats | null>(null);
  const [memberStats, setMemberStats] = useState<MemberStats | null>(null);
  const [smsCount, setSmsCount] = useState<number | null>(null);

  useEffect(() => {
    reportsApi.jobStats().then(setJobStats).catch(console.error);
    reportsApi.membershipStats().then(setMemberStats).catch(console.error);
    smsApi.history().then(({ total }) => setSmsCount(total)).catch(console.error);
  }, []);

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h3 className="text-[22px] font-bold text-[#1f2937] mb-1">
          Welcome back, <span className="text-[#F07000]">{getUserDisplayName(user)}</span>
        </h3>
        <p className="text-[13px] text-[#9ca3af]">
          Here&apos;s an overview of your Recs Geomatics Consult operations.
        </p>
      </div>

      {/* Job Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Briefcase size={20} />}
          iconBg="bg-orange-100 text-orange-600"
          label="Total Active Jobs"
          value={jobStats?.inProgress ?? "-"}
          sub={`${jobStats?.total ?? 0} total jobs`}
          href="/admin/jobs"
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          iconBg="bg-green-100 text-green-600"
          label="Jobs Completed"
          value={jobStats?.completed ?? "-"}
          sub="Fully delivered"
          href="/admin/jobs?status=COMPLETED"
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          iconBg="bg-amber-100 text-amber-600"
          label="Jobs Queried"
          value={jobStats?.queried ?? "-"}
          sub="Need attention"
          href="/admin/jobs?status=QUERIED"
        />
        <StatCard
          icon={<Clock size={20} />}
          iconBg="bg-purple-100 text-purple-600"
          label="Pending Steps"
          value={Object.values(jobStats?.byStep ?? {}).reduce((a, b) => a + b, 0) || "-"}
          sub="Across all jobs"
          href="/admin/jobs"
        />
      </div>

      {/* Membership Stats Cards */}
      <h4 className="text-[16px] font-bold text-[#1f2937] mb-3">Membership Overview</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Users size={20} />}
          iconBg="bg-indigo-100 text-indigo-600"
          label="Total Members"
          value={memberStats?.totalMembers ?? "-"}
          sub={`${memberStats?.activeMembers ?? 0} active`}
          href="/membership/members"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          iconBg="bg-teal-100 text-teal-600"
          label="New This Month"
          value={memberStats?.newThisMonth ?? "-"}
          sub="Registrations"
          href="/membership/members"
        />
        <StatCard
          icon={<DollarSign size={20} />}
          iconBg="bg-emerald-100 text-emerald-600"
          label="Dues Collected"
          value={memberStats?.duesCollected ? `GH₵${memberStats.duesCollected.toFixed(2)}` : "-"}
          sub="All time"
          href="/membership/dues"
        />
        <StatCard
          icon={<MessageSquare size={20} />}
          iconBg="bg-pink-100 text-pink-600"
          label="SMS Broadcasts"
          value={smsCount ?? "-"}
          sub="Messages sent"
          href="/membership/sms"
        />
      </div>

      {/* Quick Actions */}
      <h4 className="text-[16px] font-bold text-[#1f2937] mb-3">Quick Actions</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickAction
          title="Create New Job"
          desc="Start a new job certification workflow"
          href="/admin/jobs/new"
          color="bg-[#F07000]"
        />
        <QuickAction
          title="Search Job Status"
          desc="Look up a job by ID or Regional Number"
          href="/client/dashboard"
          color="bg-emerald-600"
        />
        <QuickAction
          title="Send SMS Broadcast"
          desc="Notify all party members via SMS"
          href="/membership/sms"
          color="bg-purple-600"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
  sub,
  href,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  sub: string;
  href: string;
}) {
  return (
    <Link href={href} className="block bg-white rounded-xl border border-[#e5e7eb] p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>{icon}</div>
        <ArrowUpRight size={16} className="text-[#9ca3af] group-hover:text-[#F07000] transition-colors" />
      </div>
      <div className="text-[24px] font-bold text-[#1f2937]">{value}</div>
      <div className="text-[13px] font-semibold text-[#4b5563]">{label}</div>
      <div className="text-[11px] text-[#9ca3af] mt-0.5">{sub}</div>
    </Link>
  );
}

function QuickAction({
  title,
  desc,
  href,
  color,
}: {
  title: string;
  desc: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className={`${color} text-white rounded-xl p-5 hover:opacity-90 transition-opacity block`}
    >
      <h5 className="text-[16px] font-bold mb-1">{title}</h5>
      <p className="text-[13px] text-white/80">{desc}</p>
    </Link>
  );
}
