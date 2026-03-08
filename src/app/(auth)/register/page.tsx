"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/lib/auth-store";

interface RegisterForm {
  accountType: "Individual" | "Institution";
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: string;
  idType: string;
  idNumber: string;
  email: string;
  country: string;
  address: string;
  phoneCode: string;
  phone: string;
  contactPerson?: string;
  contactPhone?: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    defaultValues: { accountType: "Individual", phoneCode: "+233", country: "Ghana" },
  });

  const onSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const user = await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        gender: data.gender,
        idType: data.idType,
        idNumber: data.idNumber,
        phone: data.phone,
        phoneCode: data.phoneCode,
        country: data.country,
        address: data.address,
        accountType: data.accountType,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
      });
      router.push(user.role === "CLIENT" ? "/client/dashboard" : "/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full h-[44px] px-4 bg-white border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20 focus:border-[#F07000] transition-all";
  const labelCls = "block text-[13px] font-semibold text-[#4b5563] mb-1.5";

  return (
    <div className="w-full max-w-[920px]">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[24px] font-bold text-[#1f2937]">Create an Account</h2>
            <p className="text-[13px] text-[#9ca3af] mt-1">
              Fields with (<span className="text-red-500">*</span>) are required.
            </p>
          </div>
          <Link href="/login" className="text-[13px] text-[#F07000] hover:underline font-semibold">
            ← Return to Login
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Account Type */}
          <div>
            <label className={labelCls}>Account Type <span className="text-red-500">*</span></label>
            <div className="flex gap-4">
              {(["Individual", "Institution"] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={t} {...register("accountType")} className="w-4 h-4 text-[#F07000]" />
                  <span className="text-[14px] text-[#4b5563]">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
              <input className={inputCls} placeholder="First name" {...register("firstName", { required: "Required" })} />
              {errors.firstName && <p className="text-red-500 text-[12px] mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Last Name <span className="text-red-500">*</span></label>
              <input className={inputCls} placeholder="Last name" {...register("lastName", { required: "Required" })} />
              {errors.lastName && <p className="text-red-500 text-[12px] mt-1">{errors.lastName.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Middle Name</label>
              <input className={inputCls} placeholder="Other name" {...register("middleName")} />
            </div>
          </div>

          {/* Gender + ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Gender <span className="text-red-500">*</span></label>
              <select className={inputCls} {...register("gender", { required: "Required" })}>
                <option value="">-- Select Gender --</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>ID Type <span className="text-red-500">*</span></label>
              <select className={inputCls} {...register("idType", { required: "Required" })}>
                <option value="">-- Select ID Type --</option>
                <option>Ghana Card</option>
                <option>Passport</option>
                <option>Voter ID</option>
                <option>Driver&apos;s License</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>ID Number <span className="text-red-500">*</span></label>
              <input className={inputCls} placeholder="ID number" {...register("idNumber", { required: "Required" })} />
            </div>
            <div>
              <label className={labelCls}>Email <span className="text-red-500">*</span></label>
              <input type="email" className={inputCls} placeholder="you@example.com" {...register("email", { required: "Required" })} />
              <p className="text-[11px] text-[#9ca3af] mt-1">We&apos;ll never share your email.</p>
            </div>
          </div>

          {/* Country + Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Country <span className="text-red-500">*</span></label>
              <select className={inputCls} {...register("country")}>
                <option>Ghana</option>
                <option>Nigeria</option>
                <option>Togo</option>
                <option>Benin</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Address <span className="text-red-500">*</span></label>
              <input className={inputCls} placeholder="Your address" {...register("address", { required: "Required" })} />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className={labelCls}>Phone Number <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <select className={`${inputCls} w-[160px]`} {...register("phoneCode")}>
                <option value="+233">Ghana (+233)</option>
                <option value="+234">Nigeria (+234)</option>
                <option value="+228">Togo (+228)</option>
              </select>
              <input className={inputCls} type="tel" placeholder="020xxxxxxx" {...register("phone", { required: "Required" })} />
            </div>
          </div>

          {/* Contact Person */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Contact Person</label>
              <input className={inputCls} placeholder="Emergency contact" {...register("contactPerson")} />
            </div>
            <div>
              <label className={labelCls}>Contact Person&apos;s Phone</label>
              <input className={inputCls} type="tel" placeholder="020xxxxxxx" {...register("contactPhone")} />
            </div>
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Password <span className="text-red-500">*</span></label>
              <input type="password" className={inputCls} placeholder="Min 6 characters" {...register("password", { required: "Required", minLength: { value: 6, message: "Min 6 chars" } })} />
              {errors.password && <p className="text-red-500 text-[12px] mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Confirm Password <span className="text-red-500">*</span></label>
              <input type="password" className={inputCls} placeholder="Repeat password" {...register("confirmPassword", { required: "Required" })} />
            </div>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-1 w-4 h-4 rounded border-[#e5e7eb] text-[#F07000]" {...register("terms", { required: "You must agree" })} />
            <span className="text-[13px] text-[#4b5563]">
              I have read and agree to the <a href="#" className="text-[#F07000] hover:underline">Terms &amp; Conditions</a>.
            </span>
          </label>
          {errors.terms && <p className="text-red-500 text-[12px]">{errors.terms.message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto h-[44px] px-8 bg-[#F07000] text-white rounded-lg font-semibold text-[14px] hover:bg-[#D06000] transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
