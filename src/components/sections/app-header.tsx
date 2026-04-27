"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  BellIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import { useAuthStore, getUserDisplayName } from "@/lib/auth-store";
import ThemeToggleButton from "@/components/theme/theme-toggle-button";

export default function AppHeader({
  showMenuButton = false,
  onMenuClick,
}: {
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Derive breadcrumbs from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => {
    const rawHref = "/" + segments.slice(0, i + 1).join("/");
    const href =
      rawHref === "/admin"
        ? "/dashboard"
        : rawHref === "/client"
          ? "/client/tracking"
          : rawHref;

    return {
      label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
      href,
    };
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const profileInitials = (() => {
    if (!user) return "G";

    const first = user.firstName?.trim().charAt(0) ?? "";
    const last = user.lastName?.trim().charAt(0) ?? "";
    const email = user.email?.trim().charAt(0) ?? "";

    return (first + last || first || email || "U").toUpperCase();
  })();

  return (
    <header className="sticky top-0 z-40 w-full px-2 md:px-3 pt-2">
      <div className="app-topbar-shell rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between w-full px-4 py-2">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          {showMenuButton && (
            <button
              type="button"
              onClick={onMenuClick}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-card text-foreground/80 hover:bg-muted transition-colors"
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>

        {/* Center: Search */}
        <form onSubmit={handleSearch} className="flex-grow hidden md:block max-w-[500px] mx-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card/90 border border-border/80 rounded-full py-2 pl-10 pr-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Search jobs by ID, client, or RN..."
            />
          </div>
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors relative"
            >
              <BellIcon className="h-[18px] w-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-card" />
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-popover border border-border rounded-xl shadow-xl py-2 z-50">
                <div className="px-4 py-2 border-b border-border">
                  <h4 className="text-[13px] font-bold text-foreground">Notifications</h4>
                </div>
                <div className="px-4 py-6 text-center text-[13px] text-muted-foreground">
                  <BellIcon className="mx-auto mb-2 h-7 w-7 opacity-30" />
                  No new notifications
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <ThemeToggleButton />

          {/* Profile Dropdown */}
          <div ref={profileRef} className="relative ml-2">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 cursor-pointer group rounded-full border border-transparent px-1.5 py-1 hover:border-border/70 hover:bg-muted/60 transition-all"
            >
              <div className="w-8 h-8 bg-[#F07000] rounded-full flex items-center justify-center text-white text-[13px] font-bold shadow-[0_8px_18px_rgba(240,112,0,0.32)]">
                {profileInitials}
              </div>
              <div className="hidden lg:flex flex-col leading-none">
                <span className="text-[13px] font-bold text-foreground">{getUserDisplayName(user)}</span>
                <span className="text-[11px] text-muted-foreground">{user?.role?.replace(/_/g, " ") ?? "Guest"}</span>
              </div>
              <ChevronDownIcon className="h-[14px] w-[14px] text-muted-foreground" />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-xl shadow-lg py-2 z-50">
                <Link href="/admin/profile" className="flex items-center gap-2 px-4 py-2 text-[13px] text-foreground hover:bg-muted transition-colors" onClick={() => setShowProfile(false)}>
                  <UserIcon className="h-[14px] w-[14px]" /> My Profile
                </Link>
                <Link href="/admin/settings" className="flex items-center gap-2 px-4 py-2 text-[13px] text-foreground hover:bg-muted transition-colors" onClick={() => setShowProfile(false)}>
                  <Cog6ToothIcon className="h-[14px] w-[14px]" /> Settings
                </Link>
                <div className="border-t border-border my-1" />
                <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-[13px] text-red-600 hover:bg-red-500/10 w-full transition-colors">
                  <ArrowRightOnRectangleIcon className="h-[14px] w-[14px]" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Breadcrumb */}
        <div className="px-4 py-1.5 flex items-center text-[12px] text-muted-foreground border-t border-border/40 bg-white/45 dark:bg-white/[0.01]">
          <Link href="/dashboard" className="text-primary hover:underline">Home</Link>
          {breadcrumbs.map((bc) => (
            <React.Fragment key={bc.href}>
              <span className="mx-2">/</span>
              <Link href={bc.href} className="hover:text-primary font-semibold">{bc.label}</Link>
            </React.Fragment>
          ))}
        </div>
      </div>
    </header>
  );
}
