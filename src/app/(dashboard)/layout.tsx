"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/sections/app-sidebar";
import AppHeader from "@/components/sections/app-header";
import AppFooter from "@/components/sections/app-footer";
import { useAuthStore } from "@/lib/auth-store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const loadUser = useAuthStore((s) => s.loadUser);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

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
      <AppSidebar />
      <div className="flex-1 ml-[280px] flex flex-col min-h-screen app-main-panel">
        <AppHeader />
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 app-content-wrap">
          {children}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
