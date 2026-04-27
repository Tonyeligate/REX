"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import type { LoginFormData } from "@/lib/validations/auth";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const loadUser = useAuthStore((s) => s.loadUser);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => { loadUser(); }, [loadUser]);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(user.role === "ADMIN" ? "/dashboard" : "/client/tracking");
    }
  }, [isAuthenticated, user, router]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError("");
    try {
      const user = await login(data.email, data.password);
      router.push(user.role === "ADMIN" ? "/dashboard" : "/client/tracking");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="grid min-h-screen w-full grid-cols-1 overflow-hidden bg-white lg:grid-cols-2">
        <section className="relative hidden lg:flex">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1f2937]/85 via-[#1f2937]/70 to-[#F07000]/55" />
          <div className="relative flex h-full w-full flex-col justify-between p-10 text-white">
            <div>
              <p className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                Recs Geomatics Consult
              </p>
              <h1 className="mt-5 text-4xl font-[900] leading-tight text-white">
                Land Survey
                <br />
                <span className="text-[#F07000]">&amp; Certification Portal</span>
              </h1>
              <p className="mt-4 max-w-md text-[14px] text-white/85">
                Manage cadastral workflows, parcel documentation, and certification records from one secure operations console.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-white/80">
                System Notice
              </p>
              <p className="mt-2 text-[14px] text-white/90">
                Authorized staff only. All actions are audited and role-restricted.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white px-6 py-10 sm:px-10">
          <div className="w-full max-w-[430px]">
            <div className="mb-7">
              <h2 className="text-[30px] font-[900] tracking-tight text-[#1f2937]">
                Welcome Back
              </h2>
              <p className="mt-1 text-[14px] text-[#6b7280]">
                Sign in to continue to the certification operations dashboard.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
                  Email / Username
                </label>
                <input
                  type="text"
                  className="h-[46px] w-full rounded-xl border border-[#e5e7eb] bg-white px-4 text-[14px] transition-all focus:border-[#F07000] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20"
                  placeholder="you@example.com or username"
                  {...register("email", { required: "Email or username is required" })}
                />
                {errors.email && (
                  <p className="mt-1 text-[12px] text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="h-[46px] w-full rounded-xl border border-[#e5e7eb] bg-white px-4 pr-10 text-[14px] transition-all focus:border-[#F07000] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20"
                    placeholder="Enter your password"
                    {...register("password", { required: "Password is required" })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#F07000]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-[12px] text-red-500">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-[46px] w-full rounded-xl bg-[#F07000] text-[14px] font-semibold text-white transition-colors hover:bg-[#D06000] disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="mt-5 text-center text-[12px] text-[#9ca3af]">
              Admin access only. Contact a system administrator for account setup.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
