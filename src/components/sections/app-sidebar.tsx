"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  EllipsisHorizontalIcon,
  HomeIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  UserCircleIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PowerIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAuthStore } from "@/lib/auth-store";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
  badge?: string;
}

const adminNav: { category: string; desc: string; items: NavItem[] }[] = [
  {
    category: "Main",
    desc: "Overview & job management",
    items: [
      { icon: <HomeIcon className="h-[18px] w-[18px]" />, label: "Dashboard", href: "/dashboard" },
      {
        icon: <BriefcaseIcon className="h-[18px] w-[18px]" />,
        label: "Job Management",
        children: [
          { label: "All Jobs", href: "/admin/jobs" },
          { label: "Create New Job", href: "/admin/jobs/new" },
        ],
      },
      { icon: <ClipboardDocumentListIcon className="h-[18px] w-[18px]" />, label: "Job Tracking", href: "/admin/jobs" },
      { icon: <UsersIcon className="h-[18px] w-[18px]" />, label: "Users & Clients", href: "/admin/users" },
    ],
  },
  {
    category: "Membership",
    desc: "Party membership",
    items: [
      { icon: <UserCircleIcon className="h-[18px] w-[18px]" />, label: "Members Database", href: "/membership/members" },
    ],
  },
  {
    category: "System",
    desc: "Reports & configuration",
    items: [
      { icon: <ChartBarIcon className="h-[18px] w-[18px]" />, label: "Reports", href: "/reports" },
      { icon: <Cog6ToothIcon className="h-[18px] w-[18px]" />, label: "Settings", href: "/admin/settings" },
    ],
  },
];

export default function AppSidebar({
  className = "",
  onClose,
}: {
  className?: string;
  onClose?: () => void;
} = {}) {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className={`flex h-screen w-[280px] shrink-0 flex-col border-r border-sidebar-border/70 p-2 py-4 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] dark:bg-[linear-gradient(180deg,#0d1729_0%,#0a1322_100%)] shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_42px_rgba(2,8,22,0.48)] ${className}`}>
      <div className="px-3">
        {/* Branding */}
        <div className="flex items-center justify-between mb-6 mt-1 rounded-xl border border-sidebar-border/60 bg-white/80 dark:bg-white/[0.03] px-2 py-2">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/recs-logo-wide.jpeg"
              alt="Recs Geomatics Consult"
              width={230}
              height={70}
              style={{ width: "auto", height: "70px" }}
              className="object-contain"
              priority
            />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-[25.5px] h-[25.5px] inline-flex items-center justify-center bg-[#F070001a] text-[#F07000] rounded-full hover:bg-[#F07000] hover:text-white transition-colors"
            aria-label={onClose ? "Close sidebar" : "More options"}
          >
            {onClose ? <XMarkIcon className="h-4 w-4" /> : <EllipsisHorizontalIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-grow overflow-y-auto px-1 custom-scrollbar">
        {adminNav.map((section) => (
          <div key={section.category} className="mb-4">
            <div className="px-3 py-2 leading-tight">
              <span className="text-[11px] font-extrabold text-sidebar-foreground/90 uppercase tracking-[0.12em]">
                {section.category}
              </span>
              <div className="text-[11px] text-muted-foreground">{section.desc}</div>
            </div>
            <nav className="space-y-0.5 mt-1">
              {section.items.map((item) => (
                <SidebarItem key={item.label} item={item} pathname={pathname} />
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-sidebar-border/70 pt-2 px-3">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[14px] font-semibold text-sidebar-foreground hover:bg-red-500/10 hover:text-red-500 transition-all"
        >
          <PowerIcon className="h-[18px] w-[18px]" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = item.href === pathname || item.children?.some((c) => c.href === pathname);
  const [open, setOpen] = useState(isActive && !!item.children);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={`group flex items-center w-full px-3 py-2.5 rounded-lg text-[14px] font-semibold transition-all duration-200 ${
            isActive
              ? "bg-[#F07000]/12 text-[#F07000] shadow-[inset_0_0_0_1px_rgba(240,112,0,0.18)]"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          }`}
        >
          <span className={isActive ? "text-[#F07000]" : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"}>
            {item.icon}
          </span>
          <span className="ml-3 truncate">{item.label}</span>
          {open ? (
            <ChevronDownIcon className="ml-auto h-[14px] w-[14px] text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="ml-auto h-[14px] w-[14px] text-muted-foreground" />
          )}
        </button>
        {open && (
          <div className="ml-7 mt-0.5 space-y-0.5 border-l-2 border-sidebar-border pl-3">
            {item.children.map((child) => {
              const childActive = pathname === child.href;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`block px-3 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                    childActive
                      ? "bg-[#F07000] text-white"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      className={`group flex items-center px-3 py-2.5 rounded-lg text-[14px] font-semibold transition-all duration-200 ${
        isActive
          ? "bg-[#F07000] text-white"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      }`}
    >
      <span className={isActive ? "text-white" : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"}>
        {item.icon}
      </span>
      <span className="ml-3 truncate">{item.label}</span>
      {item.badge && (
        <span className="ml-auto text-[10px] bg-[#F07000] text-white px-1.5 py-0.5 rounded font-bold">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
