import { z } from "zod";

export const createMemberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  region: z.string().min(1, "Region is required"),
  constituency: z.string().min(1, "Constituency is required"),
  pollingStation: z.string().min(1, "Polling station is required"),
  ghanaCard: z.string().optional(),
  voterIdNumber: z.string().optional(),
  phone: z.string().min(9, "Phone number is required"),
});

export const sendSmsSchema = z.object({
  content: z.string().min(1, "Message content is required").max(480, "Message too long (max 3 SMS segments)"),
  scheduling: z.enum(["immediate", "scheduled", "recurring"]),
  scheduledFor: z.string().optional(),
  recipientFilter: z.object({
    region: z.string().optional(),
    constituency: z.string().optional(),
    pollingStation: z.string().optional(),
  }).optional(),
});

export type CreateMemberFormData = z.infer<typeof createMemberSchema>;
export type SendSmsFormData = z.infer<typeof sendSmsSchema>;
