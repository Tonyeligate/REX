"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Home,
  Briefcase,
  PlusCircle,
  ClipboardList,
  Search,
  Users,
  UserCircle,
  BarChart3,
  Settings,
  Power,
  X,
} from "lucide-react";
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
      { icon: <Home size={18} />, label: "Dashboard", href: "/dashboard" },
      {
        icon: <Briefcase size={18} />,
        label: "Job Management",
        children: [
          { label: "All Jobs", href: "/admin/jobs" },
          { label: "Create New Job", href: "/admin/jobs/new" },
        ],
      },
      { icon: <ClipboardList size={18} />, label: "Job Tracking", href: "/admin/jobs" },
      { icon: <Users size={18} />, label: "Users & Clients", href: "/admin/users" },
    ],
  },
  {
    category: "Membership",
    desc: "Party membership",
    items: [
      { icon: <UserCircle size={18} />, label: "Members Database", href: "/membership/members" },
    ],
  },
  {
    category: "System",
    desc: "Reports & configuration",
    items: [
      { icon: <BarChart3 size={18} />, label: "Reports", href: "/reports" },
      { icon: <Settings size={18} />, label: "Settings", href: "/admin/settings" },
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
    <aside className={`fixed left-0 top-0 h-screen w-[280px] bg-[#F4F7F6] border-r border-[#E5E7EB] z-[9] flex flex-col p-2 py-4 ${className}`}>
      <div className="px-3">
        {/* Branding */}
        <div className="flex items-center justify-between mb-6 mt-1">
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
            {onClose ? <X size={16} /> : <MoreHorizontal size={16} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-grow overflow-y-auto px-1 custom-scrollbar">
        {adminNav.map((section) => (
          <div key={section.category} className="mb-4">
            <div className="px-3 py-2 leading-tight">
              <span className="text-[12px] font-bold text-[#4B5563] uppercase tracking-wider">
                {section.category}
              </span>
              <div className="text-[11px] text-[#9CA3AF]">{section.desc}</div>
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
      <div className="mt-auto border-t border-[#E5E7EB] pt-2 px-3">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[14px] font-medium text-[#4B5563] hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <Power size={18} />
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
          className={`group flex items-center w-full px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
            isActive
              ? "bg-[#F07000]/10 text-[#F07000]"
              : "text-[#4B5563] hover:bg-[#FFF5EB] hover:text-[#F07000]"
          }`}
        >
          <span className={isActive ? "text-[#F07000]" : "text-[#4B5563] group-hover:text-[#F07000]"}>
            {item.icon}
          </span>
          <span className="ml-3 truncate">{item.label}</span>
          {open ? (
            <ChevronDown size={14} className="ml-auto text-[#9CA3AF]" />
          ) : (
            <ChevronRight size={14} className="ml-auto text-[#9CA3AF]" />
          )}
        </button>
        {open && (
          <div className="ml-7 mt-0.5 space-y-0.5 border-l-2 border-[#E5E7EB] pl-3">
            {item.children.map((child) => {
              const childActive = pathname === child.href;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`block px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    childActive
                      ? "bg-[#F07000] text-white"
                      : "text-[#4B5563] hover:bg-[#FFF5EB] hover:text-[#F07000]"
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
      className={`group flex items-center px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
        isActive
          ? "bg-[#F07000] text-white"
          : "text-[#4B5563] hover:bg-[#FFF5EB] hover:text-[#F07000]"
      }`}
    >
      <span className={isActive ? "text-white" : "text-[#4B5563] group-hover:text-[#F07000]"}>
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
