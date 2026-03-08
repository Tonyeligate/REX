"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, HelpCircle } from "lucide-react";
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
      router.replace(user.role === "CLIENT" ? "/client/dashboard" : "/dashboard");
    }
  }, [isAuthenticated, user, router]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError("");
    try {
      const user = await login(data.email, data.password);
      router.push(user.role === "CLIENT" ? "/client/dashboard" : "/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px]">
      <div className="bg-white rounded-2xl shadow-lg p-8 relative">
        {/* Branding */}
        <div className="text-center mb-6">
          <h2 className="text-[26px] font-bold text-[#1f2937] mb-1">
            <span className="text-[#F07000]">Recs</span> Geomatics Consult
          </h2>
          <p className="text-[13px] text-[#9ca3af]">Job Certification &amp; Approval System</p>
        </div>

        <h3 className="text-[20px] font-bold text-[#1f2937] mb-1">Login to Your Account</h3>
        <p className="text-[13px] text-[#9ca3af] mb-6">
          Enter your email and password to access your account.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#4b5563] mb-1.5">Email / Username *</label>
            <input
              type="text"
              className="w-full h-[44px] px-4 bg-white border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20 focus:border-[#F07000] transition-all"
              placeholder="you@example.com or username"
              {...register("email", { required: "Email or username is required" })}
            />
            {errors.email && <p className="text-red-500 text-[12px] mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#4b5563] mb-1.5">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full h-[44px] px-4 pr-10 bg-white border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20 focus:border-[#F07000] transition-all"
                placeholder="Enter your password"
                {...register("password", { required: "Password is required" })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#F07000]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-[12px] mt-1">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-[#e5e7eb] text-[#F07000] focus:ring-[#F07000]" />
              <span className="text-[13px] text-[#4b5563]">Remember me</span>
            </label>
            <a href="#" className="flex items-center gap-1 text-[13px] text-[#F07000] hover:underline">
              <HelpCircle size={14} />
              Forgot Password
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[44px] bg-[#F07000] text-white rounded-lg font-semibold text-[14px] hover:bg-[#D06000] transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-[13px] text-[#9ca3af] mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#F07000] font-semibold hover:underline">
            Sign Up
          </Link>
        </p>

        {/* Backend info */}
        <div className="mt-4 p-3 bg-[#FFF5EB] border border-[#F0E6DA] rounded-lg">
          <p className="text-[11px] font-bold text-[#C05500] mb-1">Connected to Live Backend</p>
          <p className="text-[11px] text-[#8B5E3C]">Log in with your registered email/username and password.</p>
        </div>
      </div>
    </div>
  );
}
