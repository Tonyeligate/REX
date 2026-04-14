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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isWideRegisterPage = useMemo(
    () => pathname === "/admin/jobs" || pathname === "/admin/jobs/tracking",
    [pathname]
  );

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    setSidebarOpen(!isWideRegisterPage);
  }, [isWideRegisterPage]);

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
    <div className="flex min-h-screen bg-background text-foreground">
      {!isWideRegisterPage && <AppSidebar />}

      {isWideRegisterPage && sidebarOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu backdrop"
            className="fixed inset-0 z-[18] bg-black/30 backdrop-blur-[1px]"
            onClick={() => setSidebarOpen(false)}
          />
          <AppSidebar className="z-[19] shadow-2xl" onClose={() => setSidebarOpen(false)} />
        </>
      )}

      <div className={`flex-1 flex flex-col min-h-screen ${isWideRegisterPage ? "ml-0" : "ml-[280px]"}`}>
        <AppHeader
          showMenuButton={isWideRegisterPage}
          onMenuClick={() => setSidebarOpen((open) => !open)}
        />
        <main className={`flex-1 py-6 ${isWideRegisterPage ? "px-2 md:px-3 lg:px-4 xl:px-5" : "px-4 md:px-6 lg:px-8"}`}>
          {children}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
