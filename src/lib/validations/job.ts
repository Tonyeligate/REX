import { z } from "zod";

export const createJobSchema = z.object({
  jobId: z.string().min(1, "Regional Number (RN) is required"),
  jobType: z.string().optional(),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  priority: z.enum(["STANDARD", "HIGH", "URGENT"]).optional(),
  assignedTo: z.string().optional(),
  estimatedTime: z.string().optional(),
  submittedDate: z.string().optional(),
  regionalNumber: z.string().optional(),
  parcelSize: z.string().optional(),
  description: z.string().optional(),
});

export const updateJobSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  query_reason: z.string().optional(),
  parcel_acreage: z.string().optional(),
  payment_amount: z.string().optional(),
  assigned_to: z.number().nullable().optional(),
  batch: z.number().nullable().optional(),
});

export const addTimelineSchema = z.object({
  label: z.string().min(1, "Label is required"),
  subtext: z.string().min(1, "Subtext is required"),
});

export type CreateJobFormData = z.infer<typeof createJobSchema>;
export type UpdateJobFormData = z.infer<typeof updateJobSchema>;
export type AddTimelineFormData = z.infer<typeof addTimelineSchema>;
