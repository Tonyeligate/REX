"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { membersApi } from "@/lib/api";
import type { Member } from "@/types/member";
import { GHANA_REGIONS } from "@/types/member";

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Member>>({});

  const loadMember = useCallback(async () => {
    try {
      const data = await membersApi.get(params.id);
      setMember(data.member);
      setForm(data.member);
    } catch {
      router.push("/membership/members");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => { loadMember(); }, [loadMember]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await membersApi.update(params.id, form);
      setMember(updated.member);
      setEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !member) {
    return <div className="flex items-center justify-center h-64 text-[#9ca3af]"><Loader2 size={24} className="animate-spin mr-2" /> Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/membership/members" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft size={18} /></Link>
          <div>
            <h3 className="text-[22px] font-bold text-[#1f2937]">{member.firstName} {member.surname}</h3>
            <p className="text-[13px] text-[#9ca3af]">{member.region} &middot; {member.phone}</p>
          </div>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="h-[36px] px-4 bg-[#F07000] text-white rounded-lg text-[12px] font-semibold hover:bg-[#D06000]">Edit</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => { setEditing(false); setForm(member); }} className="h-[36px] px-4 border border-[#e5e7eb] rounded-lg text-[12px] font-semibold">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 h-[36px] px-4 bg-green-600 text-white rounded-lg text-[12px] font-semibold hover:bg-green-700 disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
          <h4 className="text-[14px] font-bold text-[#1f2937] mb-4">Personal Information</h4>
          <div className="space-y-3">
            {editing ? (
              <>
                <Field label="First Name" value={form.firstName ?? ""} onChange={(v) => setForm({...form, firstName: v})} />
                <Field label="Surname" value={form.surname ?? ""} onChange={(v) => setForm({...form, surname: v})} />
                <Field label="Date of Birth" value={form.dateOfBirth ?? ""} onChange={(v) => setForm({...form, dateOfBirth: v})} type="date" />
                <Field label="Phone" value={form.phone ?? ""} onChange={(v) => setForm({...form, phone: v})} />
                <Field label="Ghana Card" value={form.ghanaCard ?? ""} onChange={(v) => setForm({...form, ghanaCard: v})} />
                <Field label="Voter ID" value={form.voterIdNumber ?? ""} onChange={(v) => setForm({...form, voterIdNumber: v})} />
              </>
            ) : (
              <>
                <InfoRow label="First Name" value={member.firstName} />
                <InfoRow label="Surname" value={member.surname} />
                <InfoRow label="Date of Birth" value={member.dateOfBirth} />
                <InfoRow label="Phone" value={member.phone} />
                <InfoRow label="Ghana Card" value={member.ghanaCard || "N/A"} />
                <InfoRow label="Voter ID" value={member.voterIdNumber || "N/A"} />
              </>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
          <h4 className="text-[14px] font-bold text-[#1f2937] mb-4">Location & Status</h4>
          <div className="space-y-3">
            {editing ? (
              <>
                <div>
                  <label className="text-[11px] text-[#9ca3af] block mb-1">Region</label>
                  <select value={form.region ?? ""} onChange={(e) => setForm({...form, region: e.target.value})} className="w-full h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]">
                    {GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <Field label="Constituency" value={form.constituency ?? ""} onChange={(v) => setForm({...form, constituency: v})} />
                <Field label="Polling Station" value={form.pollingStation ?? ""} onChange={(v) => setForm({...form, pollingStation: v})} />
              </>
            ) : (
              <>
                <InfoRow label="Region" value={member.region} />
                <InfoRow label="Constituency" value={member.constituency} />
                <InfoRow label="Polling Station" value={member.pollingStation} />
              </>
            )}
            <InfoRow label="Registration Method" value={member.registrationMethod} />
            <InfoRow label="Status" value={member.isActive ? "Active" : "Inactive"} />
            <InfoRow label="Total Dues Paid" value={`GH₵ ${member.totalDuesPaid.toFixed(2)}`} />
            <InfoRow label="Registered" value={member.createdAt} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-[#9ca3af]">{label}</span>
      <span className="font-semibold text-[#1f2937]">{value}</span>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-[11px] text-[#9ca3af] block mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]" />
    </div>
  );
}
