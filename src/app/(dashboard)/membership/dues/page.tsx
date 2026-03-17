"use client";

import React, { useCallback, useEffect, useState } from "react";
import { DollarSign, Users, TrendingUp, Calendar, Loader2 } from "lucide-react";
import { duesApi } from "@/lib/api";
import type { DuesSummary, DuesPayment } from "@/types/member";

export default function DuesPage() {
  const [summary, setSummary] = useState<DuesSummary | null>(null);
  const [payments, setPayments] = useState<DuesPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [duesUnavailable, setDuesUnavailable] = useState(false);

  const isFeatureUnavailableError = (message: string) => {
    const normalized = message.toLowerCase();
    return normalized.includes("mock route removed") || normalized.includes("not implemented on the railway backend yet");
  };

  const loadDues = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [sumData, payData] = await Promise.all([duesApi.summary(), duesApi.list()]);
      setSummary(sumData);
      setPayments(payData.payments);
      setDuesUnavailable(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load dues data";
      setError(message);
      setSummary(null);
      setPayments([]);
      setDuesUnavailable(isFeatureUnavailableError(message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDues();
  }, [loadDues]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[#9ca3af]"><Loader2 size={24} className="animate-spin mr-2" /> Loading...</div>;
  }

  if (duesUnavailable) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-[14px] font-semibold text-amber-900 mb-2">Dues module is temporarily unavailable</p>
        <p className="text-[13px] text-amber-800 mb-4">
          The dues backend endpoint is not enabled yet. Please try again later.
        </p>
        {error && <p className="text-[12px] text-amber-900 mb-3">{error}</p>}
        <button
          type="button"
          onClick={loadDues}
          className="h-[38px] px-4 rounded-lg bg-amber-600 text-white text-[12px] font-semibold hover:bg-amber-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="text-[14px] font-semibold text-red-900 mb-2">Unable to load dues data</p>
        {error && <p className="text-[13px] text-red-800 mb-4">{error}</p>}
        <button
          type="button"
          onClick={loadDues}
          className="h-[38px] px-4 rounded-lg bg-red-600 text-white text-[12px] font-semibold hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    { label: "Total Collected", value: `GH₵ ${summary.totalCollected.toFixed(2)}`, icon: DollarSign, color: "bg-green-50 text-green-600" },
    { label: "Party Revenue", value: `GH₵ ${summary.totalPartyShare.toFixed(2)}`, icon: TrendingUp, color: "bg-orange-50 text-orange-600" },
    { label: "Platform Fee", value: `GH₵ ${summary.totalPlatformFee.toFixed(2)}`, icon: DollarSign, color: "bg-purple-50 text-purple-600" },
    { label: "Paying Members", value: `${summary.activePayingMembers} / ${summary.totalMembers}`, icon: Users, color: "bg-amber-50 text-amber-600" },
    { label: "This Month", value: `GH₵ ${summary.thisMonth.toFixed(2)}`, icon: Calendar, color: "bg-cyan-50 text-cyan-600" },
    { label: "This Year", value: `GH₵ ${summary.thisYear.toFixed(2)}`, icon: Calendar, color: "bg-indigo-50 text-indigo-600" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-[22px] font-bold text-[#1f2937]">Dues & Payments</h3>
        <p className="text-[13px] text-[#9ca3af]">Overview of membership dues from SMS broadcast deductions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white border border-[#e5e7eb] rounded-xl p-4">
            <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center mb-2`}>
              <card.icon size={16} />
            </div>
            <p className="text-[11px] text-[#9ca3af]">{card.label}</p>
            <p className="text-[16px] font-bold text-[#1f2937]">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue split info */}
      <div className="bg-orange-50 rounded-xl p-5 mb-6">
        <h4 className="text-[14px] font-bold text-[#1f2937] mb-2">Revenue Split Model</h4>
        <div className="flex gap-8 text-[13px]">
          <div>
            <p className="text-[#9ca3af]">Per SMS Broadcast</p>
            <p className="font-bold text-[#1f2937]">GH₵ 1.50 deducted from member airtime</p>
          </div>
          <div>
            <p className="text-[#9ca3af]">Party Share</p>
            <p className="font-bold text-green-700">GH₵ 1.00 (66.7%)</p>
          </div>
          <div>
            <p className="text-[#9ca3af]">Platform Fee</p>
            <p className="font-bold text-[#F07000]">GH₵ 0.50 (33.3%)</p>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e5e7eb]">
          <h4 className="text-[14px] font-bold text-[#1f2937]">Payment History</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-[#e5e7eb]">
                <th className="text-left px-4 py-3 font-semibold text-[#4b5563]">Member</th>
                <th className="text-left px-4 py-3 font-semibold text-[#4b5563]">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-[#4b5563]">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-[#4b5563]">Party Share</th>
                <th className="text-left px-4 py-3 font-semibold text-[#4b5563]">Platform Fee</th>
                <th className="text-left px-4 py-3 font-semibold text-[#4b5563]">Triggered By</th>
                <th className="text-left px-4 py-3 font-semibold text-[#4b5563]">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#9ca3af]">No payments recorded yet.</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-b border-[#e5e7eb] hover:bg-[#f8f9fa]">
                    <td className="px-4 py-3 font-semibold text-[#1f2937]">{p.memberName}</td>
                    <td className="px-4 py-3 text-[#4b5563]">{p.memberPhone}</td>
                    <td className="px-4 py-3 font-bold text-[#1f2937]">GH₵ {p.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-green-700">GH₵ {p.partyShare.toFixed(2)}</td>
                    <td className="px-4 py-3 text-[#F07000]">GH₵ {p.platformShare.toFixed(2)}</td>
                    <td className="px-4 py-3 text-[#4b5563]">{p.triggeredBy || "—"}</td>
                    <td className="px-4 py-3 text-[#4b5563]">{p.paidAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
