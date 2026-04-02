"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  BellRing,
  Gauge,
  Globe,
  LayoutDashboard,
  Loader2,
  Mail,
  Monitor,
  MoonStar,
  Palette,
  Radio,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  SunMedium,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { settingsApi } from "@/lib/api";
import type { AppSettings } from "@/lib/api";
import {
  applyThemePreference,
  getStoredThemePreference,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

type SettingsSource = "backend" | "local";

const SETTINGS_STORAGE_KEY = "admin-settings";

const DEFAULT_SETTINGS: AppSettings = {
  siteName: "Recs Geomatics Consult",
  siteDescription: "Job Certification & Approval System",
  adminEmail: "admin@recsgeomatics.com",
  smsProvider: "hubtel",
  smsApiKey: "",
  ussdShortCode: "*920*44#",
  duesPerSms: "1.50",
  partySharePerSms: "1.00",
  platformFeePerSms: "0.50",
  enableEmailNotifications: true,
  enableSmsNotifications: true,
  enableUssdRegistration: true,
  maintenanceMode: false,
};

const THEME_OPTIONS: { value: ThemePreference; title: string; description: string; icon: LucideIcon }[] = [
  { value: "light", title: "Light", description: "Bright, airy, and crisp for daytime work.", icon: SunMedium },
  { value: "dark", title: "Dark", description: "Low-glare, high-contrast, and cinematic.", icon: MoonStar },
  { value: "system", title: "System", description: "Follow the device preference automatically.", icon: Monitor },
];

const FEATURE_TOGGLES: {
  key: keyof Pick<
    AppSettings,
    | "enableEmailNotifications"
    | "enableSmsNotifications"
    | "enableUssdRegistration"
    | "maintenanceMode"
  >;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    key: "enableEmailNotifications",
    title: "Enable Email Notifications",
    description: "Send email alerts for job status changes.",
    icon: Mail,
  },
  {
    key: "enableSmsNotifications",
    title: "Enable SMS Notifications",
    description: "Notify clients via SMS when workflow stages change.",
    icon: BellRing,
  },
  {
    key: "enableUssdRegistration",
    title: "Enable USSD Registration",
    description: "Allow member registration through the USSD entry flow.",
    icon: Radio,
  },
  {
    key: "maintenanceMode",
    title: "Maintenance Mode",
    description: "Temporarily lock the portal while you apply updates.",
    icon: ShieldCheck,
  },
];

function canUseDOM(): boolean {
  return typeof window !== "undefined";
}

function readStoredSettings(): AppSettings | null {
  if (!canUseDOM()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as AppSettings;
  } catch {
    return null;
  }
}

function writeStoredSettings(nextSettings: AppSettings): void {
  if (!canUseDOM()) {
    return;
  }

  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[0_10px_22px_rgba(240,112,0,0.18)] dark:bg-primary/15">
        <Icon size={18} />
      </div>
      <div>
        <h4 className="text-[15px] font-[900] text-foreground">{title}</h4>
        <p className="mt-1 text-[12px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settingsSource, setSettingsSource] = useState<SettingsSource>("local");
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");

    const cachedSettings = readStoredSettings();
    if (cachedSettings) {
      setSettings(cachedSettings);
      setSettingsSource("local");
    }

    try {
      const { settings: remoteSettings } = await settingsApi.get();
      setSettings(remoteSettings);
      setSettingsSource("backend");
      writeStoredSettings(remoteSettings);
    } catch (err: unknown) {
      if (!cachedSettings) {
        setSettings(DEFAULT_SETTINGS);
      }

      setSettingsSource("local");
      const message = err instanceof Error && err.message.trim()
        ? err.message
        : "Backend settings endpoint is currently unavailable. Working from local state.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const syncTheme = () => {
      const preference = getStoredThemePreference();
      setThemePreference(preference);
      setResolvedTheme(resolveTheme(preference));
    };

    syncTheme();

    const handleStorage = () => syncTheme();
    const handleThemeChange = () => syncTheme();
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (getStoredThemePreference() === "system") {
        setResolvedTheme(resolveTheme("system"));
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("themechange", handleThemeChange as EventListener);

    if (media) {
      if (media.addEventListener) {
        media.addEventListener("change", handleSystemChange);
      } else {
        media.addListener(handleSystemChange);
      }
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("themechange", handleThemeChange as EventListener);

      if (media) {
        if (media.removeEventListener) {
          media.removeEventListener("change", handleSystemChange);
        } else {
          media.removeListener(handleSystemChange);
        }
      }
    };
  }, []);

  const handleThemeSelection = (nextPreference: ThemePreference) => {
    applyThemePreference(nextPreference);
    setThemePreference(nextPreference);
    setResolvedTheme(resolveTheme(nextPreference));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      writeStoredSettings(settings);
      const { settings: updated } = await settingsApi.update(settings);
      setSettings(updated);
      setSettingsSource("backend");
      writeStoredSettings(updated);
      setSuccess("Settings saved successfully.");
      window.setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      writeStoredSettings(settings);
      setSettingsSource("local");
      const message = err instanceof Error && err.message.trim()
        ? err.message
        : "Backend unavailable. Changes saved locally.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const enabledNotifications = Number(settings.enableEmailNotifications) + Number(settings.enableSmsNotifications);
  const themeLabel =
    themePreference === "system"
      ? `System / ${capitalize(resolvedTheme)}`
      : capitalize(themePreference);

  const summaryCards = [
    {
      label: "Theme",
      value: themeLabel,
      help: "Light and dark appearance settings",
      icon: themePreference === "dark" ? MoonStar : themePreference === "light" ? SunMedium : Monitor,
      badgeClass: "bg-orange-100 text-[#F07000] dark:bg-orange-500/15 dark:text-orange-300",
    },
    {
      label: "Storage",
      value: settingsSource === "backend" ? "Backend" : "Local cache",
      help: "Where the current settings are stored",
      icon: Gauge,
      badgeClass: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    },
    {
      label: "Notifications",
      value: `${enabledNotifications}/2 enabled`,
      help: "Email and SMS delivery channels",
      icon: BellRing,
      badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    {
      label: "Maintenance",
      value: settings.maintenanceMode ? "Enabled" : "Disabled",
      help: "Operational lock for the portal",
      icon: ShieldCheck,
      badgeClass: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    },
  ] as const;

  if (loading) {
    return (
      <div className="admin-future-bg flex min-h-[60vh] items-center justify-center">
        <div className="admin-surface-glass flex items-center gap-3 rounded-[20px] px-5 py-4 text-[13px] text-muted-foreground">
          <Loader2 size={18} className="animate-spin text-[#F07000]" />
          Loading settings workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-future-bg relative z-0 space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-[12px] font-[800] text-primary shadow-sm dark:bg-slate-950/35">
            <Sparkles size={14} />
            System Control Center
          </div>
          <h3 className="mt-3 text-[30px] font-[900] tracking-tight text-foreground sm:text-[36px]">
            Settings
          </h3>
          <p className="mt-2 max-w-2xl text-[14px] text-muted-foreground sm:text-[15px]">
            Configure appearance, notifications, and workflow billing from a premium admin console.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-[16px] bg-gradient-to-r from-[#F07000] to-[#f59e0b] px-5 py-3 text-[13px] font-[800] text-white shadow-[0_14px_30px_rgba(240,112,0,0.3)] transition-all hover:brightness-[1.02] disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Settings
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="admin-surface-elevated client-surface-interactive rounded-[22px] p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-[800] uppercase tracking-[0.16em] text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-2 text-[18px] font-[900] text-foreground sm:text-[22px]">
                    {card.value}
                  </p>
                  <p className="mt-1 text-[12px] text-muted-foreground">{card.help}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.badgeClass}`}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-[18px] border border-amber-300/80 bg-amber-50/90 px-4 py-3 text-[13px] text-amber-900 shadow-sm dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-[18px] border border-emerald-300/80 bg-emerald-50/90 px-4 py-3 text-[13px] text-emerald-900 shadow-sm dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200">
          {success}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <section className="admin-surface-elevated rounded-[26px] p-5 sm:p-6">
            <SectionHeader
              icon={Palette}
              title="Appearance"
              description="Control light, dark, and system mode without leaving the admin workspace."
            />

            <div className="grid gap-3 md:grid-cols-3">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = themePreference === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleThemeSelection(option.value)}
                    className={`rounded-[20px] border p-4 text-left transition-all duration-200 ${
                      active
                        ? "border-primary bg-primary/5 shadow-[0_14px_30px_rgba(240,112,0,0.14)] dark:bg-primary/10"
                        : "border-border bg-card/90 hover:border-primary/30 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)] dark:bg-slate-950/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <Icon size={16} />
                      </div>
                      <BadgeCheck
                        size={18}
                        className={active ? "text-primary" : "text-muted-foreground/30"}
                      />
                    </div>
                    <h5 className="mt-3 text-[14px] font-[900] text-foreground">{option.title}</h5>
                    <p className="mt-1 text-[12px] text-muted-foreground">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="admin-surface-elevated rounded-[26px] p-5 sm:p-6">
            <SectionHeader
              icon={Globe}
              title="General"
              description="Update brand identity and admin contact details."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="inline-flex items-center gap-1.5 text-[12px] font-[800] text-foreground">
                  <LayoutDashboard size={12} className="text-[#F07000]" />
                  Site Name
                </label>
                <input
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="mt-1 w-full rounded-[14px] border border-border bg-background/90 px-3.5 py-2.5 text-[13px] text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-slate-950/40"
                />
              </div>

              <div>
                <label className="inline-flex items-center gap-1.5 text-[12px] font-[800] text-foreground">
                  <Mail size={12} className="text-[#2563eb]" />
                  Admin Email
                </label>
                <input
                  value={settings.adminEmail}
                  onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                  className="mt-1 w-full rounded-[14px] border border-border bg-background/90 px-3.5 py-2.5 text-[13px] text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-slate-950/40"
                />
              </div>

              <div className="md:col-span-2">
                <label className="inline-flex items-center gap-1.5 text-[12px] font-[800] text-foreground">
                  <Sparkles size={12} className="text-[#F07000]" />
                  Description
                </label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  rows={4}
                  className="mt-1 w-full rounded-[14px] border border-border bg-background/90 px-3.5 py-2.5 text-[13px] text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-slate-950/40"
                />
              </div>
            </div>
          </section>

          <section className="admin-surface-elevated rounded-[26px] p-5 sm:p-6">
            <SectionHeader
              icon={Radio}
              title="SMS & Billing"
              description="Configure delivery, security, and revenue split settings."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="inline-flex items-center gap-1.5 text-[12px] font-[800] text-foreground">
                  <Radio size={12} className="text-[#0f766e]" />
                  SMS Provider
                </label>
                <select
                  value={settings.smsProvider}
                  onChange={(e) => setSettings({ ...settings, smsProvider: e.target.value })}
                  className="mt-1 w-full rounded-[14px] border border-border bg-background/90 px-3.5 py-2.5 text-[13px] text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-slate-950/40"
                >
                  <option value="hubtel">Hubtel</option>
                  <option value="arkesel">Arkesel</option>
                  <option value="mnotify">mNotify</option>
                  <option value="twilio">Twilio</option>
                </select>
              </div>

              <div>
                <label className="inline-flex items-center gap-1.5 text-[12px] font-[800] text-foreground">
                  <ShieldCheck size={12} className="text-[#b91c1c]" />
                  SMS API Key
                </label>
                <input
                  type="password"
                  value={settings.smsApiKey}
                  onChange={(e) => setSettings({ ...settings, smsApiKey: e.target.value })}
                  placeholder="Enter API key"
                  className="mt-1 w-full rounded-[14px] border border-border bg-background/90 px-3.5 py-2.5 text-[13px] text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-slate-950/40"
                />
              </div>

              <div>
                <label className="inline-flex items-center gap-1.5 text-[12px] font-[800] text-foreground">
                  <SlidersHorizontal size={12} className="text-[#7c3aed]" />
                  USSD Short Code
                </label>
                <input
                  value={settings.ussdShortCode}
                  onChange={(e) => setSettings({ ...settings, ussdShortCode: e.target.value })}
                  className="mt-1 w-full rounded-[14px] border border-border bg-background/90 px-3.5 py-2.5 text-[13px] text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-slate-950/40"
                />
              </div>

              <div className="md:col-span-2 rounded-[22px] border border-border bg-gradient-to-br from-white to-[#fff8f1] p-4 dark:from-slate-950/40 dark:to-slate-900/70">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h5 className="inline-flex items-center gap-2 text-[13px] font-[900] text-foreground">
                    <Wallet size={14} className="text-[#F07000]" />
                    Revenue Split Per SMS
                  </h5>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-[800] text-muted-foreground shadow-sm dark:bg-slate-950/60">
                    Total deduction: GH₵ {settings.duesPerSms}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-[12px] font-[800] text-foreground">Total Deduction (GH₵)</label>
                    <input
                      value={settings.duesPerSms}
                      onChange={(e) => setSettings({ ...settings, duesPerSms: e.target.value })}
                      className="mt-1 w-full rounded-[14px] border border-border bg-background/90 px-3.5 py-2.5 text-[13px] text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-slate-950/40"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-[800] text-foreground">Party Share (GH₵)</label>
                    <input
                      value={settings.partySharePerSms}
                      onChange={(e) => setSettings({ ...settings, partySharePerSms: e.target.value })}
                      className="mt-1 w-full rounded-[14px] border border-border bg-background/90 px-3.5 py-2.5 text-[13px] text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-slate-950/40"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-[800] text-foreground">Platform Fee (GH₵)</label>
                    <input
                      value={settings.platformFeePerSms}
                      onChange={(e) => setSettings({ ...settings, platformFeePerSms: e.target.value })}
                      className="mt-1 w-full rounded-[14px] border border-border bg-background/90 px-3.5 py-2.5 text-[13px] text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-slate-950/40"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="admin-surface-glass rounded-[26px] p-5 sm:p-6">
            <SectionHeader
              icon={Gauge}
              title="Live Status"
              description="A snapshot of how the current configuration resolves in the UI."
            />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {[
                {
                  label: "Current Mode",
                  value: themeLabel,
                  icon: themePreference === "dark" ? MoonStar : themePreference === "light" ? SunMedium : Monitor,
                  tone: "bg-orange-100 text-[#F07000] dark:bg-orange-500/15 dark:text-orange-300",
                },
                {
                  label: "Persistence",
                  value: settingsSource === "backend" ? "Backend synced" : "Local cache",
                  icon: Gauge,
                  tone: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
                },
                {
                  label: "SMS Provider",
                  value: settings.smsProvider,
                  icon: Radio,
                  tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
                },
                {
                  label: "Notifications",
                  value: `${enabledNotifications} active`,
                  icon: BellRing,
                  tone: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="rounded-[20px] border border-border bg-card/90 p-4 shadow-[0_10px_22px_rgba(15,23,42,0.06)] dark:bg-slate-950/35">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-[800] uppercase tracking-[0.14em] text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="mt-2 text-[15px] font-[900] text-foreground">{item.value}</p>
                      </div>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.tone}`}>
                        <Icon size={16} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-[22px] border border-border bg-gradient-to-br from-white/90 to-[#fff8ef] p-4 dark:from-slate-950/55 dark:to-slate-900/70">
              <div className="flex items-center gap-2 text-[13px] font-[800] text-foreground">
                <LayoutDashboard size={14} className="text-[#F07000]" />
                UI Health
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                Dark mode, section depth, and iconography now sync with the admin theme system.
              </p>
            </div>
          </section>

          <section className="admin-surface-elevated rounded-[26px] p-5 sm:p-6">
            <SectionHeader
              icon={ShieldCheck}
              title="Features & Protections"
              description="Enable or disable platform behaviors from one secure panel."
            />

            <div className="space-y-3">
              {FEATURE_TOGGLES.map((toggle) => {
                const Icon = toggle.icon;
                const checked = settings[toggle.key];

                return (
                  <button
                    key={toggle.key}
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, [toggle.key]: !prev[toggle.key] }))}
                    className="flex w-full items-center justify-between rounded-[18px] border border-border bg-card/90 p-4 text-left transition-all hover:border-primary/30 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)] dark:bg-slate-950/35"
                  >
                    <div className="flex items-start gap-3 pr-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${checked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-[13px] font-[900] text-foreground">{toggle.title}</p>
                        <p className="mt-1 text-[12px] text-muted-foreground">{toggle.description}</p>
                      </div>
                    </div>

                    <div className={`relative h-7 w-14 rounded-full transition-colors ${checked ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"}`}>
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-7" : "translate-x-1"}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
