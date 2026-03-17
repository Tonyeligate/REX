"use client";

import React, { useState, useEffect, useCallback } from "react";
import { UserPlus, Mail, Loader2, Search, MoreHorizontal } from "lucide-react";
import { usersApi } from "@/lib/api";
import type { UserRow } from "@/lib/api";

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700",
  ADMIN: "bg-purple-100 text-purple-700",
  CSAU_OFFICER: "bg-orange-100 text-orange-700",
  SMD_EXAMINER: "bg-cyan-100 text-cyan-700",
  SMD_REGIONAL: "bg-teal-100 text-teal-700",
  LICENSED_SURVEYOR: "bg-amber-100 text-amber-700",
  CLIENT: "bg-gray-100 text-gray-600",
  MEMBERSHIP_ADMIN: "bg-green-100 text-green-700",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("CLIENT");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [usersUnavailable, setUsersUnavailable] = useState(false);

  const isFeatureUnavailableError = (message: string) => {
    const normalized = message.toLowerCase();
    return normalized.includes("mock route removed") || normalized.includes("not implemented on the railway backend yet");
  };

  const formatLastLogin = (value?: string) => {
    const normalized = (value ?? "").trim();
    if (!normalized || normalized === "—") return "—";

    const timestamp = Date.parse(normalized);
    if (!Number.isFinite(timestamp)) return "—";
    return new Date(timestamp).toLocaleString();
  };

  const fetchUsers = useCallback(async (searchQuery?: string) => {
    try {
      setLoading(true);
      setLoadError("");
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      const { users: data } = await usersApi.list(params);
      setUsers(data);
      setUsersUnavailable(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load users";
      setLoadError(message);
      setUsers([]);
      setUsersUnavailable(isFeatureUnavailableError(message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchUsers(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchUsers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteError("");
    try {
      await usersApi.invite({ email: inviteEmail, role: inviteRole });
      setShowInvite(false);
      setInviteEmail("");
      fetchUsers(search);
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : "Failed to invite user");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[22px] font-bold text-[#1f2937]">Users & Clients</h3>
          <p className="text-[13px] text-[#9ca3af]">Manage system users and their roles</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          disabled={usersUnavailable}
          className="flex items-center gap-1.5 h-[36px] px-4 bg-[#F07000] text-white rounded-lg text-[12px] font-semibold hover:bg-[#D06000] disabled:opacity-60 disabled:hover:bg-[#F07000]"
        >
          <UserPlus size={14} /> Invite User
        </button>
      </div>

      {usersUnavailable && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          Users module is temporarily unavailable because the backend endpoint is not enabled yet.
        </div>
      )}

      {!usersUnavailable && loadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {loadError}
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && !usersUnavailable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 m-4">
            <h4 className="text-[16px] font-bold text-[#1f2937] mb-4">Invite User</h4>
            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1">Email</label>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required placeholder="user@example.com" className="w-full h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1">Role</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]">
                  {Object.keys(roleColors).map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              {inviteError && <p className="text-[12px] text-red-600 font-semibold">{inviteError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowInvite(false); setInviteError(""); }} className="h-[36px] px-4 border border-[#e5e7eb] rounded-lg text-[12px] font-semibold">Cancel</button>
                <button type="submit" disabled={inviting} className="flex items-center gap-1.5 h-[36px] px-4 bg-[#F07000] text-white rounded-lg text-[12px] font-semibold disabled:opacity-50">
                  {inviting ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />} Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-xs mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full h-[40px] pl-10 pr-4 border border-[#e5e7eb] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#f8f9fa] border-b border-[#e5e7eb]">
              <th className="text-left px-4 py-3 font-semibold text-[#4b5563]">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-[#4b5563]">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-[#4b5563]">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-[#4b5563]">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-[#4b5563]">Last Login</th>
              <th className="text-right px-4 py-3 font-semibold text-[#4b5563]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#9ca3af]"><Loader2 size={20} className="inline animate-spin mr-2" />Loading users...</td></tr>
            ) : usersUnavailable ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-amber-700">Users endpoint is currently unavailable.</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#9ca3af]">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-b border-[#e5e7eb] hover:bg-[#f8f9fa]">
                <td className="px-4 py-3 font-semibold text-[#1f2937]">{u.name}</td>
                <td className="px-4 py-3 text-[#4b5563]">{u.email}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[11px] font-bold ${roleColors[u.role] ?? "bg-gray-100 text-gray-600"}`}>{u.role.replace(/_/g, " ")}</span></td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${u.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{u.isActive ? "active" : "inactive"}</span>
                </td>
                <td className="px-4 py-3 text-[#4b5563]">{formatLastLogin(u.lastLogin)}</td>
                <td className="px-4 py-3 text-right">
                  <button className="p-1.5 rounded hover:bg-gray-100 text-[#9ca3af]"><MoreHorizontal size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
