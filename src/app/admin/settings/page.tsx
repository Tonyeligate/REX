"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, Bell, Shield, Globe } from "lucide-react";
import { settingsApi } from "@/lib/api";
import type { AppSettings } from "@/lib/api";

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState<AppSettings>({
    siteName: "",
    siteDescription: "",
    adminEmail: "",
    smsProvider: "hubtel",
    smsApiKey: "",
    ussdShortCode: "",
    duesPerSms: "1.50",
    partySharePerSms: "1.00",
    platformFeePerSms: "0.50",
    enableEmailNotifications: true,
    enableSmsNotifications: true,
    enableUssdRegistration: true,
    maintenanceMode: false,
  });

  useEffect(() => {
    settingsApi
      .get()
      .then(({ settings: s }) => setSettings(s))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const { settings: updated } = await settingsApi.update(settings);
      setSettings(updated);
      setSuccess("Settings saved successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#F07000]" />
        <span className="ml-2 text-[13px] text-[#9ca3af]">Loading settings...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[22px] font-bold text-[#1f2937]">Settings</h3>
          <p className="text-[13px] text-[#9ca3af]">Configure system settings and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 h-[40px] px-5 bg-[#F07000] text-white rounded-lg font-semibold text-[13px] hover:bg-[#D06000] disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Settings
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-[13px] text-green-700">{success}</div>}

      <div className="space-y-6">
        {/* General */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
          <h4 className="text-[14px] font-bold text-[#1f2937] mb-4 flex items-center gap-2"><Globe size={16} /> General</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">Site Name</label>
              <input value={settings.siteName} onChange={(e) => setSettings({...settings, siteName: e.target.value})} className="w-full h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">Admin Email</label>
              <input value={settings.adminEmail} onChange={(e) => setSettings({...settings, adminEmail: e.target.value})} className="w-full h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">Description</label>
              <input value={settings.siteDescription} onChange={(e) => setSettings({...settings, siteDescription: e.target.value})} className="w-full h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]" />
            </div>
          </div>
        </div>

        {/* SMS / USSD Configuration */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
          <h4 className="text-[14px] font-bold text-[#1f2937] mb-4 flex items-center gap-2"><Bell size={16} /> SMS &amp; USSD Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">SMS Provider</label>
              <select value={settings.smsProvider} onChange={(e) => setSettings({...settings, smsProvider: e.target.value})} className="w-full h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]">
                <option value="hubtel">Hubtel</option>
                <option value="arkesel">Arkesel</option>
                <option value="mnotify">mNotify</option>
                <option value="twilio">Twilio</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">SMS API Key</label>
              <input type="password" value={settings.smsApiKey} onChange={(e) => setSettings({...settings, smsApiKey: e.target.value})} placeholder="Enter API key" className="w-full h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">USSD Short Code</label>
              <input value={settings.ussdShortCode} onChange={(e) => setSettings({...settings, ussdShortCode: e.target.value})} className="w-full h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]" />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
            <h5 className="text-[13px] font-semibold text-[#1f2937] mb-3">Revenue Split (per SMS)</h5>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1">Total Deduction (GH₵)</label>
                <input value={settings.duesPerSms} onChange={(e) => setSettings({...settings, duesPerSms: e.target.value})} className="w-full h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1">Party Share (GH₵)</label>
                <input value={settings.partySharePerSms} onChange={(e) => setSettings({...settings, partySharePerSms: e.target.value})} className="w-full h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1">Platform Fee (GH₵)</label>
                <input value={settings.platformFeePerSms} onChange={(e) => setSettings({...settings, platformFeePerSms: e.target.value})} className="w-full h-[38px] px-3 border border-[#e5e7eb] rounded-lg text-[13px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Security & Features */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
          <h4 className="text-[14px] font-bold text-[#1f2937] mb-4 flex items-center gap-2"><Shield size={16} /> Features &amp; Toggles</h4>
          <div className="space-y-3">
            {[
              { key: "enableEmailNotifications" as const, label: "Enable Email Notifications", desc: "Send email alerts for job status changes" },
              { key: "enableSmsNotifications" as const, label: "Enable SMS Notifications", desc: "Send SMS updates to clients on job status" },
              { key: "enableUssdRegistration" as const, label: "Enable USSD Registration", desc: "Allow new members to register via USSD" },
              { key: "maintenanceMode" as const, label: "Maintenance Mode", desc: "Put the portal in maintenance mode" },
            ].map((toggle) => (
              <label key={toggle.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="text-[13px] font-semibold text-[#1f2937]">{toggle.label}</p>
                  <p className="text-[11px] text-[#9ca3af]">{toggle.desc}</p>
                </div>
                <div
                  className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${settings[toggle.key] ? "bg-[#F07000]" : "bg-gray-300"}`}
                  onClick={() => setSettings({...settings, [toggle.key]: !settings[toggle.key]})}
                >
                  <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${settings[toggle.key] ? "translate-x-5" : "translate-x-1"}`} />
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
