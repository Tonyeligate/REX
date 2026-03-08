/**
 * In-memory demo database.
 *
 * Replace with Prisma / PostgreSQL when a real DB is added.
 * Every API route imports from here so swap is a one-file change.
 */

import type { User } from "@/types/user";
import type { Job } from "@/types/job";
import type { Member, SmsMessage, DuesPayment } from "@/types/member";
import { createDefaultSteps } from "@/lib/workflow-engine";

// ─── Users ───────────────────────────────────────
export const users: User[] = [
  {
    id: "u1",
    email: "admin@recsgeomatics.com",
    firstName: "Kwame",
    lastName: "Asante",
    gender: "Male",
    idType: "Ghana Card",
    idNumber: "GHA-000000001-0",
    phone: "0201234567",
    phoneCode: "+233",
    country: "Ghana",
    address: "Accra, Greater Accra",
    role: "SUPER_ADMIN",
    accountType: "Individual",
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "u2",
    email: "client@example.com",
    firstName: "Ama",
    lastName: "Mensah",
    gender: "Female",
    idType: "Ghana Card",
    idNumber: "GHA-000000002-0",
    phone: "0557654321",
    phoneCode: "+233",
    country: "Ghana",
    address: "Kumasi, Ashanti",
    role: "CLIENT",
    accountType: "Individual",
    isActive: true,
    createdAt: "2026-01-05T00:00:00Z",
    updatedAt: "2026-01-05T00:00:00Z",
  },
];

// ─── Passwords (plain for demo only) ────────────
export const passwords: Record<string, string> = {
  "admin@recsgeomatics.com": "admin123",
  "client@example.com": "client123",
};

// ─── Email aliases (old → canonical) ────────────
export const emailAliases: Record<string, string> = {
  "admin@landcommission.gov.gh": "admin@recsgeomatics.com",
};

export const sessions: Record<string, string> = {};

// ─── Jobs ────────────────────────────────────────
function buildDemoJob(
  id: string,
  jobId: string,
  clientName: string,
  currentStep: number,
  priority: "STANDARD" | "HIGH" | "URGENT" = "STANDARD",
  status: "IN_PROGRESS" | "COMPLETED" | "QUERIED" = "IN_PROGRESS"
): Job {
  const steps = createDefaultSteps().map((s, i) => {
    const num = i + 1;
    return {
      ...s,
      status:
        num < currentStep
          ? ("COMPLETED" as const)
          : num === currentStep
          ? ("ACTIVE" as const)
          : ("PENDING" as const),
      completedAt: num < currentStep ? "2026-02-10T10:00:00Z" : undefined,
    };
  });
  return {
    id,
    jobId,
    jobType: "Land Survey",
    clientId: "u2",
    clientName,
    priority,
    assignedTo: "Client Service",
    estimatedTime: "3 days",
    submittedDate: "2026-02-10",
    currentStep,
    status,
    regionalNumber: `RN-${jobId.slice(-3)}`,
    parcelSize: "2.5 acres",
    steps,
    timeline: steps
      .filter((s) => s.status === "COMPLETED" || s.status === "ACTIVE")
      .map((s, i) => ({
        id: `t-${id}-${i}`,
        label: s.title,
        subtext: s.note,
        status: s.status === "COMPLETED" ? ("done" as const) : ("current" as const),
        createdAt: s.completedAt ?? new Date().toISOString(),
      })),
    createdAt: "2026-02-10T08:00:00Z",
    updatedAt: new Date().toISOString(),
  };
}

export const jobs: Job[] = [
  buildDemoJob("j1", "LS-2024-461", "ABC Development Corp.", 3, "STANDARD"),
  buildDemoJob("j2", "LS-2024-462", "Ama Mensah", 5, "HIGH"),
  buildDemoJob("j3", "LS-2024-463", "Golden Properties Ltd.", 6, "URGENT"),
  buildDemoJob("j4", "LS-2024-464", "ABC Development Corp.", 10, "STANDARD"),
  buildDemoJob("j5", "LS-2024-465", "Savanna Holdings", 2, "HIGH"),
  buildDemoJob("j6", "LS-2024-466", "Kwame Boateng", 14, "STANDARD", "COMPLETED"),
];

// ─── Members ─────────────────────────────────────
export const members: Member[] = [
  { id: "m1", firstName: "Yaw", surname: "Agyeman", dateOfBirth: "1985-03-12", region: "Greater Accra", constituency: "Ablekuma West", pollingStation: "Dansoman Poly", ghanaCard: "GHA-100000001-1", voterIdNumber: "VOT-0001", phone: "0241234567", registrationMethod: "USSD", isActive: true, totalDuesPaid: 15.00, createdAt: "2026-01-10T00:00:00Z", updatedAt: "2026-02-01T00:00:00Z" },
  { id: "m2", firstName: "Abena", surname: "Osei", dateOfBirth: "1990-07-25", region: "Ashanti", constituency: "Kumasi Central", pollingStation: "Kejetia Market", ghanaCard: "GHA-100000002-2", voterIdNumber: "VOT-0002", phone: "0559876543", registrationMethod: "USSD", isActive: true, totalDuesPaid: 12.00, createdAt: "2026-01-12T00:00:00Z", updatedAt: "2026-02-01T00:00:00Z" },
  { id: "m3", firstName: "Kofi", surname: "Darko", dateOfBirth: "1978-11-02", region: "Western", constituency: "Sekondi", pollingStation: "Market Circle", ghanaCard: "GHA-100000003-3", voterIdNumber: "VOT-0003", phone: "0271112233", registrationMethod: "MANUAL", isActive: true, totalDuesPaid: 9.00, createdAt: "2026-01-15T00:00:00Z", updatedAt: "2026-02-01T00:00:00Z" },
  { id: "m4", firstName: "Efua", surname: "Mensah", dateOfBirth: "1995-01-18", region: "Central", constituency: "Cape Coast North", pollingStation: "UCC Junction", ghanaCard: "GHA-100000004-4", phone: "0508765432", registrationMethod: "IMPORT", isActive: false, totalDuesPaid: 3.00, createdAt: "2026-01-20T00:00:00Z", updatedAt: "2026-02-01T00:00:00Z" },
];

// ─── SMS Messages ────────────────────────────────
export const smsMessages: SmsMessage[] = [
  { id: "sms1", content: "Monthly meeting: Saturday 15th Feb at Accra HQ. Attendance is mandatory.", sentBy: "u1", sentAt: "2026-02-01T09:00:00Z", recipientCount: 4, deliveredCount: 3, totalCost: 6.00, partyRevenue: 4.00, platformFee: 2.00, scheduling: "immediate", status: "sent" },
  { id: "sms2", content: "Dues reminder: Please ensure your airtime balance for automatic deductions.", sentBy: "u1", sentAt: "2026-02-10T10:00:00Z", recipientCount: 4, deliveredCount: 4, totalCost: 6.00, partyRevenue: 4.00, platformFee: 2.00, scheduling: "immediate", status: "sent" },
];

// ─── Dues ────────────────────────────────────────
export const duesPayments: DuesPayment[] = [
  { id: "d1", memberId: "m1", memberName: "Yaw Agyeman", memberPhone: "0241234567", amount: 1.50, partyShare: 1.00, platformShare: 0.50, triggeredBy: "sms1", paidAt: "2026-02-01T09:05:00Z" },
  { id: "d2", memberId: "m2", memberName: "Abena Osei", memberPhone: "0559876543", amount: 1.50, partyShare: 1.00, platformShare: 0.50, triggeredBy: "sms1", paidAt: "2026-02-01T09:05:00Z" },
  { id: "d3", memberId: "m3", memberName: "Kofi Darko", memberPhone: "0271112233", amount: 1.50, partyShare: 1.00, platformShare: 0.50, triggeredBy: "sms1", paidAt: "2026-02-01T09:06:00Z" },
  { id: "d4", memberId: "m1", memberName: "Yaw Agyeman", memberPhone: "0241234567", amount: 1.50, partyShare: 1.00, platformShare: 0.50, triggeredBy: "sms2", paidAt: "2026-02-10T10:05:00Z" },
  { id: "d5", memberId: "m2", memberName: "Abena Osei", memberPhone: "0559876543", amount: 1.50, partyShare: 1.00, platformShare: 0.50, triggeredBy: "sms2", paidAt: "2026-02-10T10:05:00Z" },
  { id: "d6", memberId: "m3", memberName: "Kofi Darko", memberPhone: "0271112233", amount: 1.50, partyShare: 1.00, platformShare: 0.50, triggeredBy: "sms2", paidAt: "2026-02-10T10:06:00Z" },
  { id: "d7", memberId: "m4", memberName: "Efua Mensah", memberPhone: "0508765432", amount: 1.50, partyShare: 1.00, platformShare: 0.50, triggeredBy: "sms2", paidAt: "2026-02-10T10:06:00Z" },
];

// ─── Settings ────────────────────────────────────
export interface AppSettings {
  siteName: string;
  siteDescription: string;
  adminEmail: string;
  smsProvider: string;
  smsApiKey: string;
  ussdShortCode: string;
  duesPerSms: string;
  partySharePerSms: string;
  platformFeePerSms: string;
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  enableUssdRegistration: boolean;
  maintenanceMode: boolean;
}

export const settings: AppSettings = {
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

// ─── Helpers ─────────────────────────────────────
let idCounter = 100;
export function nextId(prefix = "id") {
  return `${prefix}-${++idCounter}`;
}
