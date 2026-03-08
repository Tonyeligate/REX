"use client";

import React, { useEffect, useState } from "react";
import { Send, Filter, Loader2, MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { smsApi, membersApi } from "@/lib/api";
import type { SmsMessage } from "@/types/member";
import { GHANA_REGIONS } from "@/types/member";
import { useAuthStore } from "@/lib/auth-store";

export default function SmsBroadcastPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Compose state
  const [content, setContent] = useState("");
  const [scheduling, setScheduling] = useState<"immediate" | "scheduled">("immediate");
  const [scheduledFor, setScheduledFor] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterConstituency, setFilterConstituency] = useState("");
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  // Load message history
  useEffect(() => {
    smsApi.history().then((data) => { setMessages(data.messages); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  // Preview recipient count
  const previewCount = async () => {
    setLoadingCount(true);
    try {
      const params: Record<string, string> = {};
      if (filterRegion) params.region = filterRegion;
      if (filterConstituency) params.q = filterConstituency;
      const data = await membersApi.list(params);
      setMemberCount(data.members.length);
    } catch {
      setMemberCount(null);
    } finally {
      setLoadingCount(false);
    }
  };

  useEffect(() => { previewCount(); }, [filterRegion, filterConstituency]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    const cost = (memberCount ?? 0) * 1.5;
    if (!confirm(`Send SMS to ${memberCount ?? "all"} members? Total cost: GH₵ ${cost.toFixed(2)} (GH₵ 1.00/member to party + GH₵ 0.50/member platform fee)`)) return;

    setSending(true);
    try {
      await smsApi.send({
        content,
        scheduling,
        scheduledFor: scheduling === "scheduled" ? scheduledFor : undefined,
        recipientFilter: {
          region: filterRegion || undefined,
          constituency: filterConstituency || undefined,
        },
      });
      setContent("");
      // Refresh history
      const data = await smsApi.history();
      setMessages(data.messages);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-[22px] font-bold text-[#1f2937]">SMS Broadcast</h3>
        <p className="text-[13px] text-[#9ca3af]">Send bulk SMS to party members with automatic GH₵ 1.50 airtime deduction</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
            <h4 className="text-[14px] font-bold text-[#1f2937] mb-4 flex items-center gap-2"><MessageSquare size={16} /> Compose Message</h4>
            <form onSubmit={handleSend}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your message here... (160 chars max per SMS)"
                rows={4}
                maxLength={480}
                required
                className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#F07000]/20 mb-1"
              />
              <p className="text-[11px] text-[#9ca3af] text-right mb-4">{content.length} / 480 characters</p>

              {/* Filters */}
              <div className="border-t border-[#e5e7eb] pt-4 mb-4">
                <h5 className="text-[13px] font-semibold text-[#1f2937] mb-3 flex items-center gap-2"><Filter size={14} /> Recipient Filters</h5>
                <div className="grid grid-cols-2 gap-3">
                  <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className="h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]">
                    <option value="">All Regions</option>
                    {GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input
                    value={filterConstituency}
                    onChange={(e) => setFilterConstituency(e.target.value)}
                    placeholder="Filter by constituency..."
                    className="h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]"
                  />
                </div>
                <p className="text-[12px] text-[#F07000] font-semibold mt-2">
                  {loadingCount ? "Counting..." : `${memberCount ?? 0} recipients`}
                </p>
              </div>

              {/* Scheduling */}
              <div className="border-t border-[#e5e7eb] pt-4 mb-4">
                <h5 className="text-[13px] font-semibold text-[#1f2937] mb-3 flex items-center gap-2"><Clock size={14} /> Scheduling</h5>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-[13px]">
                    <input type="radio" name="scheduling" checked={scheduling === "immediate"} onChange={() => setScheduling("immediate")} />
                    Send Now
                  </label>
                  <label className="flex items-center gap-2 text-[13px]">
                    <input type="radio" name="scheduling" checked={scheduling === "scheduled"} onChange={() => setScheduling("scheduled")} />
                    Schedule
                  </label>
                </div>
                {scheduling === "scheduled" && (
                  <input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className="mt-2 h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]" />
                )}
              </div>

              {/* Cost breakdown */}
              <div className="bg-orange-50 rounded-lg p-4 mb-4">
                <p className="text-[13px] font-bold text-[#1f2937] mb-1">Cost Breakdown</p>
                <div className="grid grid-cols-3 gap-2 text-[12px]">
                  <div>
                    <p className="text-[#9ca3af]">Per Member</p>
                    <p className="font-bold text-[#1f2937]">GH₵ 1.50</p>
                  </div>
                  <div>
                    <p className="text-[#9ca3af]">Party Revenue</p>
                    <p className="font-bold text-green-700">GH₵ {((memberCount ?? 0) * 1.0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[#9ca3af]">Platform Fee</p>
                    <p className="font-bold text-[#F07000]">GH₵ {((memberCount ?? 0) * 0.5).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={sending || !content.trim()}
                className="w-full flex items-center justify-center gap-2 h-[44px] bg-[#F07000] text-white rounded-lg font-bold text-[14px] hover:bg-[#D06000] disabled:opacity-50 transition-colors"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send SMS Broadcast
              </button>
            </form>
          </div>
        </div>

        {/* History */}
        <div>
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
            <h4 className="text-[14px] font-bold text-[#1f2937] mb-4">Message History</h4>
            {loading ? (
              <p className="text-[13px] text-[#9ca3af]">Loading...</p>
            ) : messages.length === 0 ? (
              <p className="text-[13px] text-[#9ca3af]">No messages sent yet.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="p-3 bg-[#f8f9fa] rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${msg.status === "sent" ? "bg-green-100 text-green-700" : msg.status === "sending" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"}`}>
                        {msg.status}
                      </span>
                      <span className="text-[10px] text-[#9ca3af]">{msg.sentAt}</span>
                    </div>
                    <p className="text-[12px] text-[#1f2937] line-clamp-2">{msg.content}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-[#9ca3af]">
                      <span>{msg.recipientCount} recipients</span>
                      <span>GH₵ {msg.totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
