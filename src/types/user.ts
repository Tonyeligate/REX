export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "CSAU_OFFICER"
  | "SMD_EXAMINER"
  | "SMD_REGIONAL"
  | "LICENSED_SURVEYOR"
  | "CLIENT"
  | "MEMBERSHIP_ADMIN";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: string;
  idType: string;
  idNumber: string;
  phone: string;
  phoneCode: string;
  country: string;
  address: string;
  role: Role;
  contactPerson?: string;
  contactPhone?: string;
  accountType: "Individual" | "Institution";
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender?: string;
  idType?: string;
  idNumber?: string;
  phone?: string;
  phoneCode?: string;
  country?: string;
  address?: string;
  accountType?: "Individual" | "Institution";
  contactPerson?: string;
  contactPhone?: string;
  role?: Role;
}
