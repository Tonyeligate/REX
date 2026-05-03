"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppSidebar from "@/components/sections/app-sidebar";
import AppHeader from "@/components/sections/app-header";
import AppFooter from "@/components/sections/app-footer";
import { useAuthStore } from "@/lib/auth-store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const loadUser = useAuthStore((s) => s.loadUser);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isWideRegisterPage = useMemo(
    () => pathname === "/admin/jobs" || pathname === "/admin/jobs/tracking",
    [pathname]
  );
  const isJobDetailPage = useMemo(
    () =>
      pathname.startsWith("/admin/jobs/") &&
      pathname !== "/admin/jobs/new" &&
      pathname !== "/admin/jobs/tracking",
    [pathname]
  );
  const sidebarMode = isWideRegisterPage || isJobDetailPage ? "drawer" : "persistent";
  const hideFooterOnPage = useMemo(() => pathname === "/admin/jobs", [pathname]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!isLoading && isAuthenticated && user?.role !== "ADMIN") {
      router.replace("/client/tracking");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#F07000] border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen app-shell-bg text-foreground">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className={`fixed inset-0 z-[55] bg-black/30 backdrop-blur-[1px] ${
            sidebarMode === "drawer" ? "" : "md:hidden"
          }`}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`fixed left-0 top-0 z-[60] h-screen w-[280px] transition-transform duration-200 ease-out ${
          sidebarOpen
            ? "translate-x-0"
            : sidebarMode === "drawer"
              ? "-translate-x-full"
              : "-translate-x-full md:translate-x-0"
        }`}
      >
        <AppSidebar onClose={() => setSidebarOpen(false)} />
      </div>
      <div
        className={`ml-0 flex min-h-screen flex-1 flex-col app-main-panel transition-[margin] duration-200 ease-out ${
          sidebarMode === "drawer" ? "" : "md:ml-[280px]"
        }`}
      >
        <AppHeader
          showMenuButton
          onMenuClick={() => setSidebarOpen((open) => !open)}
        />
        <main className={`flex-1 py-6 app-content-wrap ${isWideRegisterPage ? "px-2 md:px-3 lg:px-4 xl:px-5" : "px-4 md:px-6 lg:px-8"}`}>
          {children}
        </main>
        {!hideFooterOnPage && <AppFooter />}
      </div>
    </div>
  );
}
