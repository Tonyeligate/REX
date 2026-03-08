import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  accountType: z.enum(["Individual", "Institution"]),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  gender: z.string().min(1, "Please select a gender"),
  idType: z.string().min(1, "Please select an ID type"),
  idNumber: z.string().min(1, "ID number is required"),
  email: z.string().email("Please enter a valid email"),
  country: z.string().min(1, "Country is required"),
  address: z.string().min(1, "Address is required"),
  phoneCode: z.string().min(1, "Phone code is required"),
  phone: z.string().min(9, "Phone number must be at least 9 digits"),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm your password"),
  terms: z.boolean().refine((v) => v === true, { message: "You must accept the terms" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
