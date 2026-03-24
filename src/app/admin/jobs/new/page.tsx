"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, User, Briefcase } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { jobsApi } from "@/lib/api";

interface NewJobFormData {
  clientName: string;
  contactPhone: string;
  contactEmail: string;
  rn: string;
  title: string;
  description: string;
  parcel_acreage: string;
}

function sanitizeRn(value: string): string {
  return value
    .trim()
    .replace(/[\\/]+/g, "-")
    .replace(/\s*[-]\s*/g, "-")
    .replace(/-{2,}/g, "-");
}

export default function NewJobPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewJobFormData>({
    defaultValues: {
      clientName: "",
      contactPhone: "",
      contactEmail: "",
      rn: "",
      title: "",
      description: "",
      parcel_acreage: "",
    },
  });

  const onSubmit = async (data: NewJobFormData) => {
    setSubmitting(true);
    setError("");
    try {
      const normalizedRn = sanitizeRn(data.rn);
      if (!normalizedRn) {
        throw new Error("Regional Number is required");
      }

      // Compose job title: "ClientName – JobTitle" or just "ClientName" if no title
      const composedTitle = data.title.trim()
        ? `${data.clientName.trim()} – ${data.title.trim()}`
        : data.clientName.trim();

      const response = await jobsApi.create({
        rn: normalizedRn,
        title: composedTitle,
        description: [
          `Client: ${data.clientName.trim()}`,
          data.description,
          data.contactPhone ? `Phone: ${data.contactPhone}` : "",
          data.contactEmail ? `Email: ${data.contactEmail}` : "",
        ].filter(Boolean).join("\n"),
        parcel_acreage: data.parcel_acreage || undefined,
        clientName: data.clientName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
      });
      router.push(`/admin/jobs/${encodeURIComponent(response.job.jobId)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/jobs" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h3 className="text-[22px] font-bold text-[#1f2937]">Create New Job</h3>
          <p className="text-[13px] text-[#9ca3af]">Submit a new land survey certification job</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[13px]">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ─── Client Information ─── */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="p-2 bg-[#fff7ed] rounded-lg"><User size={15} className="text-[#F07000]" /></span>
            <div>
              <p className="text-[14px] font-bold text-[#1f2937]">Client Information</p>
              <p className="text-[12px] text-[#9ca3af]">Details about the client commissioning this job</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Client Name */}
            <div className="md:col-span-2">
              <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Client Name *</label>
              <input
                {...register("clientName", { required: "Client name is required" })}
                placeholder="e.g. Kwame Mensah"
                className="w-full h-[40px] px-4 border border-[#e5e7eb] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20"
              />
              {errors.clientName && <p className="text-red-500 text-[11px] mt-1">{errors.clientName.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Contact Phone</label>
              <input
                {...register("contactPhone")}
                placeholder="e.g. 0244 123 456"
                className="w-full h-[40px] px-4 border border-[#e5e7eb] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Contact Email</label>
              <input
                {...register("contactEmail")}
                type="email"
                placeholder="e.g. client@email.com"
                className="w-full h-[40px] px-4 border border-[#e5e7eb] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20"
              />
            </div>
          </div>
        </div>

        {/* ─── Job Details ─── */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="p-2 bg-[#fff7ed] rounded-lg"><Briefcase size={15} className="text-[#F07000]" /></span>
            <div>
              <p className="text-[14px] font-bold text-[#1f2937]">Job Details</p>
              <p className="text-[12px] text-[#9ca3af]">Technical information about the survey job</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Regional Number (RN) */}
            <div>
              <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Regional Number (RN) *</label>
              <input
                {...register("rn", { required: "Regional Number is required" })}
                placeholder="e.g. RN-GAR-2025-001"
                className="w-full h-[40px] px-4 border border-[#e5e7eb] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20"
              />
              {errors.rn && <p className="text-red-500 text-[11px] mt-1">{errors.rn.message}</p>}
              {!errors.rn && (
                <p className="text-[11px] text-[#9ca3af] mt-1">
                  You can type separators like /, -, ., or _. Unsafe separators are auto-normalized on save.
                </p>
              )}
            </div>

            {/* Job Title / Reference */}
            <div>
              <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Job Reference / Title</label>
              <input
                {...register("title")}
                placeholder="e.g. Plot 45 East Legon"
                className="w-full h-[40px] px-4 border border-[#e5e7eb] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20"
              />
              <p className="text-[11px] text-[#9ca3af] mt-1">Combined as: Client Name – Job Reference</p>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Description / Notes</label>
              <textarea
                {...register("description")}
                placeholder="Describe the job details, location, or any instructions..."
                rows={3}
                className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20 resize-none"
              />
            </div>

            {/* Parcel Acreage */}
            <div>
              <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Parcel Acreage</label>
              <input
                {...register("parcel_acreage")}
                placeholder="e.g. 2.5"
                className="w-full h-[40px] px-4 border border-[#e5e7eb] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#F07000]/20"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/jobs" className="h-[40px] px-5 flex items-center rounded-lg border border-[#e5e7eb] text-[13px] font-semibold text-[#4b5563] hover:bg-gray-50">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 h-[40px] px-5 bg-[#F07000] text-white rounded-lg font-semibold text-[13px] hover:bg-[#D06000] disabled:opacity-50 transition-colors"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Create Job
          </button>
        </div>
      </form>
    </div>
  );
}
