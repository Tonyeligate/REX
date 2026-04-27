"use client";

import React from "react";
import { User, Mail, Shield, Phone, CalendarClock, BadgeCheck, CircleUserRound } from "lucide-react";
import { useAuthStore, getUserDisplayName } from "@/lib/auth-store";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  const initials = user
    ? (user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")
    : "?";

  const roleLabel = user?.role?.replace(/_/g, " ") ?? "—";

  const fields = [
    { icon: User,   label: "Full Name",  value: getUserDisplayName(user) },
    { icon: Mail,   label: "Email",      value: user?.email ?? "—" },
    { icon: Shield, label: "Role",       value: roleLabel },
    { icon: Phone,  label: "Username",   value: (user as { username?: string } | null)?.username ?? "—" },
  ];

  return (
    <div className="admin-future-bg min-h-[calc(100vh-96px)] space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white px-6 py-6 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(240,112,0,0.12),transparent_35%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#F07000] text-[30px] font-bold text-white shadow-[0_14px_28px_rgba(240,112,0,0.35)]">
              {initials || <User size={36} />}
            </div>
            <div>
              <p className="inline-flex items-center rounded-full border border-[#F07000]/25 bg-[#fff7ed] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#b45309]">
                <BadgeCheck size={12} className="mr-1.5" />
                Account Profile
              </p>
              <h1 className="mt-2 text-[30px] font-[900] tracking-tight text-foreground">
                {getUserDisplayName(user)}
              </h1>
              <p className="text-[13px] text-muted-foreground">
                Manage your personal account information and access identity.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[11px] font-[700] uppercase tracking-wide text-muted-foreground">Role</p>
              <p className="mt-1 text-[14px] font-semibold text-foreground">{roleLabel}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[11px] font-[700] uppercase tracking-wide text-muted-foreground">Account</p>
              <p className="mt-1 text-[14px] font-semibold text-foreground">Active</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 col-span-2 sm:col-span-1">
              <p className="text-[11px] font-[700] uppercase tracking-wide text-muted-foreground">Access Scope</p>
              <p className="mt-1 text-[14px] font-semibold text-foreground">Secure Portal</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-[800] text-foreground">Personal Information</h2>
            <span className="text-[12px] text-muted-foreground">Profile details</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            {fields.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-4 border-b border-slate-200 px-5 py-4 last:border-b-0"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff2e6] shrink-0">
                  <Icon size={16} className="text-[#F07000]" />
                </div>
                <div>
                  <p className="text-[11px] font-[700] uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="text-[14px] font-semibold text-foreground capitalize">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-[15px] font-[800] text-foreground mb-4">Account Summary</h3>
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-[700] uppercase tracking-wide text-muted-foreground">Primary Email</p>
              <p className="mt-1 text-[13px] font-semibold text-foreground break-all">{user?.email ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-[700] uppercase tracking-wide text-muted-foreground">Profile Identity</p>
              <p className="mt-1 inline-flex items-center gap-2 text-[13px] font-semibold text-foreground">
                <CircleUserRound size={14} className="text-[#F07000]" />
                Verified account
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-[700] uppercase tracking-wide text-muted-foreground">Last Session</p>
              <p className="mt-1 inline-flex items-center gap-2 text-[13px] font-semibold text-foreground">
                <CalendarClock size={14} className="text-[#F07000]" />
                Current active session
              </p>
            </div>
            <p className="text-[12px] text-muted-foreground">
              This profile is managed centrally by administrators. Contact system admin for credential or role updates.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
