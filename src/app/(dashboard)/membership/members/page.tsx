"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Download, Upload, Eye, UserPlus, Loader2 } from "lucide-react";
import { membersApi } from "@/lib/api";
import { showErrorAlert, showSuccessAlert } from "@/lib/sweet-alert";
import type { Member } from "@/types/member";
import { GHANA_REGIONS } from "@/types/member";

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [importing, setImporting] = useState(false);

  // Form state for add
  const [form, setForm] = useState({
    firstName: "", surname: "", dateOfBirth: "", region: "", constituency: "", pollingStation: "", phone: "", ghanaCard: "", voterIdNumber: "",
  });
  const [adding, setAdding] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (regionFilter) params.region = regionFilter;
    if (search) params.q = search;
    try {
      const data = await membersApi.list(params);
      setMembers(data.members);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [regionFilter, search]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  useEffect(() => {
    if (!showAdd) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowAdd(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showAdd]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await membersApi.create({ ...form, registrationMethod: "MANUAL" });
      setShowAdd(false);
      setForm({ firstName: "", surname: "", dateOfBirth: "", region: "", constituency: "", pollingStation: "", phone: "", ghanaCard: "", voterIdNumber: "" });
      loadMembers();
      void showSuccessAlert("Member added successfully.");
    } catch (err) {
      void showErrorAlert(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await membersApi.export();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `members-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      void showErrorAlert("Export failed");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      await membersApi.import(file);
      loadMembers();
      void showSuccessAlert("Members imported successfully.");
    } catch {
      void showErrorAlert("Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[22px] font-bold text-[#1f2937]">Members Database</h3>
          <p className="text-[13px] text-[#9ca3af]">Manage party membership records</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 h-[36px] px-4 border border-[#e5e7eb] rounded-lg text-[12px] font-semibold text-[#4b5563] cursor-pointer hover:bg-gray-50">
            <Upload size={14} /> {importing ? "Importing..." : "Import CSV"}
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={handleExport} className="flex items-center gap-1.5 h-[36px] px-4 border border-[#e5e7eb] rounded-lg text-[12px] font-semibold text-[#4b5563] hover:bg-gray-50">
            <Download size={14} /> Export
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 h-[36px] px-4 bg-[#F07000] text-white rounded-lg text-[12px] font-semibold hover:bg-[#D06000]">
            <UserPlus size={14} /> Add Member
          </button>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowAdd(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-member-title"
            className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 m-4"
            onClick={(event) => event.stopPropagation()}
          >
            <h4 id="add-member-title" className="text-[16px] font-bold text-[#1f2937] mb-4">Add New Member</h4>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
              <input value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} placeholder="First Name *" required className="h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]" />
              <input value={form.surname} onChange={(e) => setForm({...form, surname: e.target.value})} placeholder="Surname *" required className="h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]" />
              <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({...form, dateOfBirth: e.target.value})} required className="h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]" />
              <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="Phone *" required className="h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]" />
              <select value={form.region} onChange={(e) => setForm({...form, region: e.target.value})} required className="h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]">
                <option value="">Select Region *</option>
                {GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <input value={form.constituency} onChange={(e) => setForm({...form, constituency: e.target.value})} placeholder="Constituency *" required className="h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]" />
              <input value={form.pollingStation} onChange={(e) => setForm({...form, pollingStation: e.target.value})} placeholder="Polling Station *" required className="h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]" />
              <input value={form.ghanaCard} onChange={(e) => setForm({...form, ghanaCard: e.target.value})} placeholder="Ghana Card No." className="h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]" />
              <input value={form.voterIdNumber} onChange={(e) => setForm({...form, voterIdNumber: e.target.value})} placeholder="Voter ID" className="col-span-2 h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]" />
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="h-[36px] px-4 border border-[#e5e7eb] rounded-lg text-[12px] font-semibold">Cancel</button>
                <button type="submit" disabled={adding} className="flex items-center gap-1.5 h-[36px] px-4 bg-[#F07000] text-white rounded-lg text-[12px] font-semibold hover:bg-[#D06000] disabled:opacity-50">
                  {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-grow max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full h-[40px] pl-10 pr-4 border border-[#e5e7eb] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20"
          />
        </div>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="h-[40px] px-4 border border-[#e5e7eb] rounded-lg text-[13px] focus:outline-none"
        >
          <option value="">All Regions</option>
          {GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-[#e5e7eb]">
                <th className="text-left px-4 py-3 font-semibold text-[#4b5563]">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-[#4b5563]">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-[#4b5563]">Region</th>
                <th className="text-left px-4 py-3 font-semibold text-[#4b5563]">Constituency</th>
                <th className="text-left px-4 py-3 font-semibold text-[#4b5563]">Method</th>
                <th className="text-left px-4 py-3 font-semibold text-[#4b5563]">Dues Paid</th>
                <th className="text-left px-4 py-3 font-semibold text-[#4b5563]">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-[#4b5563]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-[#9ca3af]">Loading...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-[#9ca3af]">No members found.</td></tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="border-b border-[#e5e7eb] hover:bg-[#f8f9fa]">
                    <td className="px-4 py-3 font-semibold text-[#1f2937]">{m.firstName} {m.surname}</td>
                    <td className="px-4 py-3 text-[#4b5563]">{m.phone}</td>
                    <td className="px-4 py-3 text-[#4b5563]">{m.region}</td>
                    <td className="px-4 py-3 text-[#4b5563]">{m.constituency}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-gray-100 text-[11px] font-bold">{m.registrationMethod}</span></td>
                    <td className="px-4 py-3 font-semibold text-[#1f2937]">GH₵ {m.totalDuesPaid.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${m.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {m.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/membership/members/${m.id}`} className="p-1.5 rounded hover:bg-orange-50 text-[#F07000] inline-block"><Eye size={15} /></Link>
                    </td>
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
