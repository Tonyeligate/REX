"use client";

import React, { useState, useEffect, useCallback } from "react";
import { UserPlus, Mail, Loader2, Search, MoreHorizontal } from "lucide-react";
import { ShieldCheckIcon, UsersIcon } from "@heroicons/react/24/outline";
import { usersApi } from "@/lib/api";
import type { UserRow } from "@/lib/api";

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  CSAU_OFFICER: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  SMD_EXAMINER: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
  SMD_REGIONAL: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
  LICENSED_SURVEYOR: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  CLIENT: "bg-gray-100 text-gray-600 dark:bg-slate-600/30 dark:text-slate-300",
  MEMBERSHIP_ADMIN: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
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
    <div className="admin-future-bg space-y-6">
      {/* Hero Section */}
      <div className="relative rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white px-6 py-6 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(240,112,0,0.12),transparent_35%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.15),transparent_35%)]" />
        <div className="relative mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F07000]/25 bg-[#fff7ed] px-3 py-1 text-[11px] font-[800] text-[#b45309] dark:bg-[#3b230d]/60 dark:text-[#ffd9b5] dark:border-[#ff8a1f]/30">
              <UsersIcon className="h-[13px] w-[13px]" />
              Team Management
            </div>
            <h1 className="mt-3 text-[28px] sm:text-[32px] font-bold text-foreground">Users & Access Control</h1>
            <p className="mt-1 text-[14px] text-muted-foreground max-w-lg">Manage system users, assign roles, and control access permissions across the platform</p>
          </div>
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff2e6] text-[#F07000] dark:bg-[#3d2510]/70 dark:text-[#ffb27a]">
            <ShieldCheckIcon className="h-6 w-6" />
          </div>
        </div>

        {/* Header Controls */}
        <div className="relative mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name, email, or role..."
              className="w-full h-[40px] pl-10 pr-4 border border-slate-300 bg-slate-50 rounded-full text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-[#F07000]/20 dark:border-slate-600 dark:bg-slate-800/80"
            />
          </div>
          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowInvite(true)}
              disabled={usersUnavailable}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-primary text-primary-foreground text-[12px] font-semibold transition-colors hover:brightness-95 disabled:opacity-60"
            >
              <UserPlus size={14} /> Invite User
            </button>
          </div>
        </div>
      </div>

      {usersUnavailable && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          Users module is temporarily unavailable because the backend endpoint is not enabled yet.
        </div>
      )}

      {!usersUnavailable && loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {loadError}
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && !usersUnavailable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-popover border border-border rounded-xl shadow-xl w-full max-w-sm p-6 m-4">
            <h4 className="text-[16px] font-bold text-foreground mb-4">Invite User</h4>
            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="block text-[12px] font-semibold text-foreground/85 mb-1">Email</label>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required placeholder="user@example.com" className="w-full h-[38px] px-3 border border-border bg-card rounded-lg text-[13px] text-foreground" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-foreground/85 mb-1">Role</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full h-[38px] px-3 border border-border bg-card rounded-lg text-[13px] text-foreground">
                  {Object.keys(roleColors).map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              {inviteError && <p className="text-[12px] text-red-600 font-semibold">{inviteError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowInvite(false); setInviteError(""); }} className="h-[36px] px-4 border border-border bg-card rounded-lg text-[12px] font-semibold text-foreground/85 hover:bg-muted">Cancel</button>
                <button type="submit" disabled={inviting} className="flex items-center gap-1.5 h-[36px] px-4 bg-[#F07000] text-white rounded-lg text-[12px] font-semibold disabled:opacity-50">
                  {inviting ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />} Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/85">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/70">
              <th className="px-4 py-3 text-left font-semibold text-foreground/80">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground/80">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground/80">Role</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground/80">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground/80">Last Login</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground/80">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground"><Loader2 size={20} className="inline animate-spin mr-2" />Loading users...</td></tr>
            ) : usersUnavailable ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-amber-700">Users endpoint is currently unavailable.</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-b border-slate-200 transition-colors hover:bg-slate-50/70 dark:border-slate-700 dark:hover:bg-slate-800/70">
                <td className="px-4 py-3 font-semibold text-foreground">{u.name}</td>
                <td className="px-4 py-3 text-foreground/80">{u.email}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${roleColors[u.role] ?? "bg-gray-100 text-gray-600"}`}>{u.role.replace(/_/g, " ")}</span></td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${u.isActive ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300" : "bg-gray-100 text-gray-500 dark:bg-slate-600/30 dark:text-slate-300"}`}>{u.isActive ? "active" : "inactive"}</span>
                </td>
                <td className="px-4 py-3 text-foreground/80">{formatLastLogin(u.lastLogin)}</td>
                <td className="px-4 py-3 text-right">
                  <button className="p-1.5 rounded hover:bg-muted text-muted-foreground"><MoreHorizontal size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
