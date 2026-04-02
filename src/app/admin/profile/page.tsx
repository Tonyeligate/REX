"use client";

import React from "react";
import { User, Mail, Shield, Phone } from "lucide-react";
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
    <div className="max-w-xl mx-auto py-8 admin-future-bg">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-20 h-20 rounded-full bg-[#F07000] flex items-center justify-center text-white text-[30px] font-bold shadow-lg">
          {initials || <User size={36} />}
        </div>
        <div className="text-center">
          <h2 className="text-[22px] font-bold text-foreground">{getUserDisplayName(user)}</h2>
          <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-[#F07000]/10 text-[#F07000] text-[12px] font-semibold capitalize">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Info card */}
      <div className="admin-surface-elevated rounded-xl border border-border divide-y divide-border">
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 px-6 py-4">
            <div className="w-8 h-8 rounded-lg bg-[#F07000]/10 flex items-center justify-center shrink-0">
              <Icon size={15} className="text-[#F07000]" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
              <p className="text-[14px] font-semibold text-foreground capitalize">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
