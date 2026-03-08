export interface Member {
  id: string;
  firstName: string;
  surname: string;
  dateOfBirth: string;
  region: string;
  constituency: string;
  pollingStation: string;
  ghanaCard?: string;
  voterIdNumber?: string;
  phone: string;
  registrationMethod: "USSD" | "MANUAL" | "IMPORT";
  isActive: boolean;
  totalDuesPaid: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberPayload {
  firstName: string;
  surname: string;
  dateOfBirth: string;
  region: string;
  constituency: string;
  pollingStation: string;
  ghanaCard?: string;
  voterIdNumber?: string;
  phone: string;
  registrationMethod?: "USSD" | "MANUAL" | "IMPORT";
}

export interface SmsMessage {
  id: string;
  content: string;
  sentBy: string;
  sentAt: string;
  recipientCount: number;
  deliveredCount: number;
  totalCost: number;
  partyRevenue: number;
  platformFee: number;
  scheduling: "immediate" | "scheduled" | "recurring";
  scheduledFor?: string;
  status: "draft" | "sending" | "sent" | "failed";
}

export interface SendSmsPayload {
  content: string;
  recipientFilter?: {
    region?: string;
    constituency?: string;
    pollingStation?: string;
  };
  scheduling: "immediate" | "scheduled" | "recurring";
  scheduledFor?: string;
}

export interface DuesPayment {
  id: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  amount: number;
  partyShare: number;
  platformShare: number;
  triggeredBy?: string;
  paidAt: string;
}

export interface DuesSummary {
  totalCollected: number;
  totalPartyShare: number;
  totalPlatformFee: number;
  activePayingMembers: number;
  totalMembers: number;
  thisMonth: number;
  thisYear: number;
}

export const GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Eastern",
  "Central",
  "Northern",
  "Volta",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
  "Western North",
  "Oti",
  "North East",
  "Savannah",
] as const;
