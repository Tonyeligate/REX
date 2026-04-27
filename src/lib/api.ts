/**
 * API client — two backends:
 *
 * 1) BACKEND_URL → Railway Django REST API (Auth · Jobs · Batches · Clients)
 *    Proxied through Next.js rewrites to avoid CORS.
 *
 * 2) LOCAL_URL → Next.js local API routes (SMS · Dues · Settings · register fields)
 *    These remain local until equivalent backend endpoints are available.
 */

/* ─── Base URLs ───────────────────────────────────────────── */
import type {
  JobRegisterRecord,
  RegisterStageKey,
  UpdateJobRegisterPayload,
} from "@/types/register";

const BACKEND_URL = "/backend-api"; // Proxied → Railway backend
const LOCAL_URL = "/api"; // Local Next.js API routes

/* ═══════════════════════════════════════════════════════════
   Generic request helpers
   ═══════════════════════════════════════════════════════════ */

/* ── Member metadata helper (extra fields not in backend Clients schema) ── */
const MEMBER_META_KEY = "_member_meta_by_client_id";
const REGISTER_FIELDS_KEY = "_register_fields_by_job_id";
const REGISTER_META_START = "[[REGISTER_META_V1]]";
const REGISTER_META_END = "[[/REGISTER_META_V1]]";

interface BackendClient {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

interface MemberMeta {
  dateOfBirth?: string;
  region?: string;
  constituency?: string;
  pollingStation?: string;
  ghanaCard?: string;
  voterIdNumber?: string;
  registrationMethod?: "USSD" | "MANUAL" | "IMPORT";
  isActive?: boolean;
  totalDuesPaid?: number;
  createdAt?: string;
  updatedAt?: string;
}

function normalizePhone(phone?: string): string {
  const value = (phone ?? "").trim();
  return value || "0000000000";
}

function toLocalFallbackEmail(name: string, phone: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "") || "client";
  const digits = phone.replace(/\D/g, "") || `${Date.now()}`;
  return `${slug}.${digits.slice(-6)}@recsgeo.local`;
}

function splitDisplayName(fullName: string): { firstName: string; surname: string } {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const firstName = parts[0] ?? "Member";
  const surname = parts.slice(1).join(" ") || "—";
  return { firstName, surname };
}

function readMemberMetaMap(): Record<string, MemberMeta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MEMBER_META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMemberMetaMap(data: Record<string, MemberMeta>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MEMBER_META_KEY, JSON.stringify(data));
}

function upsertMemberMeta(clientId: string, patch: MemberMeta) {
  const current = readMemberMetaMap();
  const next = {
    ...current,
    [clientId]: {
      ...current[clientId],
      ...patch,
      updatedAt: new Date().toISOString(),
    },
  };
  writeMemberMetaMap(next);
}

function readRegisterFieldsMap(): Record<string, JobRegisterRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(REGISTER_FIELDS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRegisterFieldsMap(data: Record<string, JobRegisterRecord>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REGISTER_FIELDS_KEY, JSON.stringify(data));
}

function extractRegisterMetaJson(description?: string): string | null {
  if (!description) return null;

  const startIndex = description.indexOf(REGISTER_META_START);
  if (startIndex < 0) return null;

  const contentStart = startIndex + REGISTER_META_START.length;
  const endIndex = description.indexOf(REGISTER_META_END, contentStart);
  if (endIndex < 0) return null;

  const json = description.slice(contentStart, endIndex).trim();
  return json || null;
}

function stripRegisterMetaFromDescription(description?: string): string {
  if (!description) return "";

  const startIndex = description.indexOf(REGISTER_META_START);
  if (startIndex < 0) return description.trimEnd();

  const endIndex = description.indexOf(
    REGISTER_META_END,
    startIndex + REGISTER_META_START.length
  );
  if (endIndex < 0) return description.trimEnd();

  const before = description.slice(0, startIndex).trimEnd();
  const after = description
    .slice(endIndex + REGISTER_META_END.length)
    .trimStart();

  if (before && after) return `${before}\n${after}`.trimEnd();
  return (before || after).trimEnd();
}

function parseRegisterRecordFromDescription(
  description: string | undefined,
  fallbackJobId: string
): JobRegisterRecord | null {
  const raw = extractRegisterMetaJson(description);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<JobRegisterRecord>;
    const stages =
      parsed.stages && typeof parsed.stages === "object"
        ? (parsed.stages as JobRegisterRecord["stages"])
        : {};

    const jobId =
      typeof parsed.jobId === "string" && parsed.jobId.trim()
        ? parsed.jobId.trim()
        : fallbackJobId;

    const actualRegionalNumber =
      typeof parsed.actualRegionalNumber === "string"
        ? parsed.actualRegionalNumber
        : undefined;
    const clearedStageKeys = Array.isArray(parsed.clearedStageKeys)
      ? parsed.clearedStageKeys.filter(
          (key): key is RegisterStageKey =>
            typeof key === "string" && key.trim().length > 0
        )
      : undefined;

    const updatedAt =
      typeof parsed.updatedAt === "string" && parsed.updatedAt.trim()
        ? parsed.updatedAt
        : new Date().toISOString();

    return {
      jobId,
      actualRegionalNumber,
      stages,
      clearedStageKeys,
      updatedAt,
      source: "backend",
    };
  } catch {
    return null;
  }
}

function buildDescriptionWithRegisterRecord(
  description: string | undefined,
  record: JobRegisterRecord
): string {
  const base = stripRegisterMetaFromDescription(description);
  const payload = {
    jobId: record.jobId,
    actualRegionalNumber: record.actualRegionalNumber,
    stages: record.stages,
    clearedStageKeys:
      Array.isArray(record.clearedStageKeys) && record.clearedStageKeys.length > 0
        ? record.clearedStageKeys
        : undefined,
    updatedAt: record.updatedAt,
  };

  const metaBlock = `${REGISTER_META_START}\n${JSON.stringify(payload)}\n${REGISTER_META_END}`;

  return base ? `${base}\n\n${metaBlock}` : metaBlock;
}

function extractMemberMetaFromPayload(
  payload: Partial<import("@/types/member").Member>
): MemberMeta {
  const meta: MemberMeta = {};
  if (payload.dateOfBirth !== undefined) meta.dateOfBirth = payload.dateOfBirth;
  if (payload.region !== undefined) meta.region = payload.region;
  if (payload.constituency !== undefined) meta.constituency = payload.constituency;
  if (payload.pollingStation !== undefined) meta.pollingStation = payload.pollingStation;
  if (payload.ghanaCard !== undefined) meta.ghanaCard = payload.ghanaCard;
  if (payload.voterIdNumber !== undefined) meta.voterIdNumber = payload.voterIdNumber;
  if (payload.registrationMethod !== undefined)
    meta.registrationMethod = payload.registrationMethod;
  if (payload.isActive !== undefined) meta.isActive = payload.isActive;
  if (payload.totalDuesPaid !== undefined) meta.totalDuesPaid = payload.totalDuesPaid;
  if (payload.createdAt !== undefined) meta.createdAt = payload.createdAt;
  if (payload.updatedAt !== undefined) meta.updatedAt = payload.updatedAt;
  return meta;
}

function mapBackendClientToMember(
  client: BackendClient
): import("@/types/member").Member {
  const id = String(client.id);
  const meta = readMemberMetaMap()[id] ?? {};
  const { firstName, surname } = splitDisplayName(client.name);

  return {
    id,
    firstName,
    surname,
    dateOfBirth: meta.dateOfBirth ?? "",
    region: meta.region ?? "Greater Accra",
    constituency: meta.constituency ?? "",
    pollingStation: meta.pollingStation ?? "",
    ghanaCard: meta.ghanaCard,
    voterIdNumber: meta.voterIdNumber,
    phone: client.phone,
    registrationMethod: meta.registrationMethod ?? "MANUAL",
    isActive: meta.isActive ?? true,
    totalDuesPaid: meta.totalDuesPaid ?? 0,
    createdAt: meta.createdAt ?? client.created_at,
    updatedAt: meta.updatedAt ?? client.updated_at,
  };
}

function extractDescriptionField(
  description: string | undefined,
  fieldName: string
): string | undefined {
  if (!description) return undefined;
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = description.match(new RegExp(`(?:^|\\n)${escaped}:\\s*(.+?)(?:\\n|$)`, "i"));
  return match?.[1]?.trim() || undefined;
}

async function ensureBackendClientId(payload: {
  clientId?: unknown;
  clientName?: string;
  title?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
}): Promise<number> {
  if (typeof payload.clientId === "number" && Number.isFinite(payload.clientId)) {
    return payload.clientId;
  }

  if (typeof payload.clientId === "string" && payload.clientId.trim() !== "") {
    const parsed = Number(payload.clientId);
    if (Number.isFinite(parsed)) return parsed;
  }

  const name = (
    payload.clientName?.trim() ||
    extractClientNameFromDescription(payload.description) ||
    extractClientNameFromTitle(payload.title) ||
    "Client"
  ).trim();
  const phone = normalizePhone(
    payload.contactPhone?.trim() || extractDescriptionField(payload.description, "Phone")
  );
  const emailFromPayload = payload.contactEmail?.trim() || extractDescriptionField(payload.description, "Email");
  const email =
    emailFromPayload && emailFromPayload.includes("@")
      ? emailFromPayload
      : toLocalFallbackEmail(name, phone);

  const clients = await backendRequest<BackendClient[]>("/clients/");
  const byEmail = clients.find((c) => c.email.toLowerCase() === email.toLowerCase());
  if (byEmail) return byEmail.id;

  const byName = clients.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (byName) return byName.id;

  const created = await backendRequest<BackendClient>("/clients/", {
    method: "POST",
    body: JSON.stringify({ name, email, phone }),
  });
  return created.id;
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh =
    typeof window !== "undefined"
      ? localStorage.getItem("refresh_token")
      : null;
  if (!refresh) return null;
  try {
    const res = await fetch(`${BACKEND_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
      return null;
    }
    const data = await res.json();
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", data.access);
    }
    return data.access;
  } catch {
    return null;
  }
}

async function parseResponsePayload(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => "");
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

function extractPayloadMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const body = payload as Record<string, unknown>;
    const direct =
      (typeof body.error === "string" && body.error.trim()) ||
      (typeof body.detail === "string" && body.detail.trim()) ||
      (typeof body.message === "string" && body.message.trim()) ||
      "";

    if (direct) return direct;

    const flattened = Object.values(body)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
      .join(", ");

    if (flattened) return flattened;
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  return `Request failed: ${status}`;
}

/** Call the Railway backend (Auth / Jobs / Batches). */
async function backendRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  const isPublicAuthPath =
    path === "/auth/token/" ||
    path === "/auth/token/refresh/";

  let token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;
  if (!token && !isPublicAuthPath) {
    token = await refreshAccessToken();
  }

  const headers = new Headers(options?.headers);
  if (!(options?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const hasAuthorizationHeader = headers.has("Authorization");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  if (!token && !hasAuthorizationHeader && !isPublicAuthPath) {
    throw new Error("Not authenticated. Please log in.");
  }

  let res = await fetch(url, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      res = await fetch(url, { ...options, headers });
    } else if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }

  if (res.status === 401 && !isPublicAuthPath) {
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const body = await parseResponsePayload(res);
    const message = extractPayloadMessage(body, res.status);

    if (res.status === 403) {
      throw new Error(
        typeof message === "string" && !/^request failed/i.test(message)
          ? `${message} (403 Forbidden)`
          : "Your account does not have permission for this workflow action (403 Forbidden)."
      );
    }

    throw new Error(message);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0")
    return {} as T;

  const payload = await parseResponsePayload(res);
  return payload as T;
}

/** Call a local Next.js API route (Members / SMS / Dues / Reports / Settings). */
async function localRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${LOCAL_URL}${path}`;
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const body = await parseResponsePayload(res);
    const message = extractPayloadMessage(body, res.status);
    throw new Error(
      typeof message === "string" && message.trim()
        ? message
        : `Request failed: ${res.status}`
    );
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return {} as T;
  }

  const payload = await parseResponsePayload(res);
  return payload as T;
}

/* ═══════════════════════════════════════════════════════════
   Backend type definitions
   ═══════════════════════════════════════════════════════════ */

export interface BackendUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  profile: {
    role: string;
    role_display: string;
    phone: string;
    created_at: string;
    updated_at: string;
  } | null;
}

export type BackendStatus =
  | "1_rnr"
  | "2_regional_number"
  | "3_job_production"
  | "4_ls_cert"
  | "5_csau_payment"
  | "6_examination"
  | "8_signed_out_csau"
  | "9_delivered_to_client"
  | "6_1_checking"
  | "6_2_certified"
  | "7_region"
  | "7_1_checked"
  | "7_2_approved"
  | "7_3_barcoded"
  | "request_received"
  | "rn_assigned"
  | "in_production"
  | "submitted_to_ls461"
  | "examination_ls461"
  | "certified_ls461"
  | "queried_ls461"
  | "at_csau_payment"
  | "forwarded_to_smd"
  | "examination_smd"
  | "certified_smd"
  | "queried_smd"
  | "batched_for_region"
  | "at_region"
  | "signed_out_csau"
  | "delivered_to_client";

export interface BackendJobListItem {
  id: number;
  rn: string;
  regional_number?: string | null;
  title: string;
  status: BackendStatus;
  status_display: string;
  client?: BackendClient;
  parcel_acreage: string | null;
  payment_amount: string | null;
  step_decisions?: BackendStepDecision[];
  created_at: string;
  updated_at: string;
}

export interface BackendJobDetail extends BackendJobListItem {
  description: string;
  query_reason: string;
  submitted_by: number | null;
  assigned_to: number | null;
  submitted_by_employee_username?: string | null;
  assigned_to_employee_username?: string | null;
  batch: number | null;
  batch_name: string | null;
  documents: Array<{
    id: number;
    file: string;
    name: string;
    uploaded_at: string;
  }>;
  step_decisions?: BackendStepDecision[];
}

export interface BackendStepDecision {
  id: number;
  step: string;
  step_display: string;
  decision: string;
  decision_display: string;
  comment: string;
  decided_by_employee_username?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackendHistoryEntry {
  id: number;
  from_status: string;
  to_status: string;
  notes: string;
  changed_by_username: string;
  created_at: string;
}

/* ═══════════════════════════════════════════════════════════
   Workflow status definitions (14 linear steps + 2 query states)
   ═══════════════════════════════════════════════════════════ */

/** The 14 linear (non-query) workflow statuses, in order. */
export const WORKFLOW_STATUSES: BackendStatus[] = [
  "request_received",
  "rn_assigned",
  "in_production",
  "submitted_to_ls461",
  "examination_ls461",
  "certified_ls461",
  "at_csau_payment",
  "forwarded_to_smd",
  "examination_smd",
  "certified_smd",
  "batched_for_region",
  "at_region",
  "8_signed_out_csau",
  "9_delivered_to_client",
];

/** Map each status to its 1-based step number. */
export const STATUS_STEP_MAP: Record<string, number> = {};
WORKFLOW_STATUSES.forEach((s, i) => {
  STATUS_STEP_MAP[s] = i + 1;
});
// Query statuses → the step they belong to
STATUS_STEP_MAP["queried_ls461"] = 5; // L/S 461 examination
STATUS_STEP_MAP["queried_smd"] = 9; // SMD examination
STATUS_STEP_MAP["1_rnr"] = 1;
STATUS_STEP_MAP["2_regional_number"] = 2;
STATUS_STEP_MAP["3_job_production"] = 3;
STATUS_STEP_MAP["4_ls_cert"] = 6;
STATUS_STEP_MAP["5_csau_payment"] = 7;
STATUS_STEP_MAP["6_examination"] = 9;
STATUS_STEP_MAP["7_region"] = 12;
STATUS_STEP_MAP["8_signed_out_csau"] = 13;
STATUS_STEP_MAP["9_delivered_to_client"] = 14;
// Backward compatibility with legacy status slugs.
STATUS_STEP_MAP["signed_out_csau"] = 13;
STATUS_STEP_MAP["delivered_to_client"] = 14;
// Granular backend step codes collapsed into the existing 14-stage client timeline.
STATUS_STEP_MAP["6_1_checking"] = 9;
STATUS_STEP_MAP["6_2_certified"] = 10;
STATUS_STEP_MAP["7_1_checked"] = 12;
STATUS_STEP_MAP["7_2_approved"] = 13;
STATUS_STEP_MAP["7_3_barcoded"] = 14;

function extractClientNameFromDescription(description?: string): string | undefined {
  if (!description) return undefined;

  const match = description.match(/(?:^|\n)Client:\s*(.+?)(?:\n|$)/i);
  return match?.[1]?.trim() || undefined;
}

function extractClientNameFromTitle(title?: string): string | undefined {
  if (!title) return undefined;

  const parts = title
    .split(/[–-]/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts[0] || undefined;
}

function normalizeRnInput(value?: string): string {
  return (value ?? "")
    .trim()
    .replace(/[\\/]+/g, "-")
    .replace(/\s*[-]\s*/g, "-")
    .replace(/-{2,}/g, "-");
}

/** Human-readable step definitions. */
export const WORKFLOW_STEP_DEFS: Array<{
  status: BackendStatus;
  title: string;
  note: string;
  department: string;
}> = [
  { status: "request_received", title: "Job Request Received", note: "Client submits the initial job request.", department: "Client" },
  { status: "rn_assigned", title: "RN Assigned / Sent to Client", note: "Regional Number assigned and sent to client.", department: "CSAU" },
  { status: "in_production", title: "Job Plan / Production", note: "Licensed Surveyor prepares the job plan.", department: "Licensed Surveyor (L/S 461)" },
  { status: "submitted_to_ls461", title: "Submitted to L/S 461", note: "Job submitted to Licensed Surveyor for examination.", department: "Licensed Surveyor (L/S 461)" },
  { status: "examination_ls461", title: "Examination (L/S 461)", note: "Licensed Surveyor examines the job.", department: "Licensed Surveyor (L/S 461)" },
  { status: "certified_ls461", title: "Certified by L/S 461", note: "Licensed Surveyor certifies the job.", department: "Licensed Surveyor (L/S 461)" },
  { status: "at_csau_payment", title: "At CSAU (Payment)", note: "Payment collected based on parcel size / acreage.", department: "CSAU" },
  { status: "forwarded_to_smd", title: "Forwarded to SMD", note: "Certified job forwarded to Survey & Mapping Division.", department: "CSAU" },
  { status: "examination_smd", title: "Examination (SMD)", note: "SMD performs technical examination and validation.", department: "SMD Examination" },
  { status: "certified_smd", title: "Certified (SMD)", note: "Chief Examiner reviews and certifies the job.", department: "Chief Examiner" },
  { status: "batched_for_region", title: "Batched for Region", note: "Certified jobs batched and forwarded to regional office.", department: "Chief Examiner" },
  { status: "at_region", title: "At Region", note: "Regional office receives the batched jobs.", department: "SMD Region" },
  { status: "8_signed_out_csau", title: "Signed Out (CSAU)", note: "CSAU signs out the cleared and approved job.", department: "CSAU" },
  { status: "9_delivered_to_client", title: "Delivered to Client", note: "Approved documents delivered to the client.", department: "Client" },
];

/* ═══════════════════════════════════════════════════════════
   Adapter / mapper functions
   ═══════════════════════════════════════════════════════════ */

import type { User, Role } from "@/types/user";
import type {
  Job,
  JobStatus,
  JobStepDecision,
  WorkflowStep,
  StepStatus,
  TimelineEntry,
} from "@/types/job";

const BACKEND_ROLE_MAP: Record<string, Role> = {
  client: "CLIENT",
  clients: "CLIENT",
  customer: "CLIENT",
  user: "CLIENT",
  licensed_surveyor: "LICENSED_SURVEYOR",
  csau: "CSAU_OFFICER",
  smd_examination: "SMD_EXAMINER",
  smd_region: "SMD_REGIONAL",
  employees: "ADMIN",
  chief_examiner: "ADMIN",
  admin_user: "ADMIN",
  administrator: "ADMIN",
  system_admin: "ADMIN",
  super_admin: "ADMIN",
  superuser: "ADMIN",
  staff: "ADMIN",
  admin: "ADMIN",
  superadmin: "ADMIN",
};

function resolveRole(bu: BackendUser): Role {
  // Django superusers / staff → ADMIN regardless of profile role
  if (bu.is_superuser || bu.is_staff) return "ADMIN";
  const profileRole = bu.profile?.role;
  if (profileRole && BACKEND_ROLE_MAP[profileRole]) {
    return BACKEND_ROLE_MAP[profileRole];
  }
  // Conservative-but-practical fallback: unknown profile roles should not force
  // users into client-only routing loops. Backend permissions still gate actions.
  if (!bu.profile) return "ADMIN";

  const roleText = String(profileRole ?? bu.profile.role_display ?? "").trim().toLowerCase();
  if (/admin|super|chief|examiner|staff|employee/.test(roleText)) {
    return "ADMIN";
  }

  return "CLIENT";
}

export function mapBackendUser(bu: BackendUser): User {
  return {
    id: String(bu.id),
    email: bu.email,
    firstName: bu.first_name || bu.username,
    lastName: bu.last_name || "",
    gender: "",
    idType: "",
    idNumber: "",
    phone: bu.profile?.phone ?? "",
    phoneCode: "+233",
    country: "Ghana",
    address: "",
    role: resolveRole(bu),
    accountType: "Individual",
    isActive: true,
    createdAt: bu.profile?.created_at ?? new Date().toISOString(),
    updatedAt: bu.profile?.updated_at ?? new Date().toISOString(),
  };
}

export function mapBackendJob(
  bj: BackendJobListItem | BackendJobDetail
): Job {
  const isQueried =
    bj.status === "queried_ls461" || bj.status === "queried_smd";
  const stepNum = STATUS_STEP_MAP[bj.status] ?? 1;
  const detail = bj as BackendJobDetail;

  // Keep the latest decision per step from backend decision history.
  const latestStepDecisionByNumber = new Map<number, BackendStepDecision>();
  const stepDecisions = Array.isArray(detail.step_decisions)
    ? detail.step_decisions
    : [];
  const mappedStepDecisions: JobStepDecision[] = stepDecisions.map((decision) => ({
    id: decision.id,
    step: decision.step,
    stepDisplay: decision.step_display,
    decision: decision.decision,
    decisionDisplay: decision.decision_display,
    comment: decision.comment || undefined,
    decidedBy: decision.decided_by_employee_username || undefined,
    createdAt: decision.created_at,
    updatedAt: decision.updated_at,
  }));
  for (const decision of stepDecisions) {
    const decisionStepNumber = STATUS_STEP_MAP[decision.step];
    if (!decisionStepNumber) continue;

    const existing = latestStepDecisionByNumber.get(decisionStepNumber);
    if (!existing) {
      latestStepDecisionByNumber.set(decisionStepNumber, decision);
      continue;
    }

    const existingTime = Date.parse(existing.updated_at || existing.created_at || "");
    const incomingTime = Date.parse(decision.updated_at || decision.created_at || "");
    if (!Number.isFinite(existingTime) || incomingTime >= existingTime) {
      latestStepDecisionByNumber.set(decisionStepNumber, decision);
    }
  }

  // Build the 14 workflow steps
  const steps: WorkflowStep[] = WORKFLOW_STEP_DEFS.map((def, i) => {
    const num = i + 1;
    let status: StepStatus;
    if (isQueried && num === stepNum) {
      status = "QUERIED";
    } else if (num < stepNum) {
      status = "COMPLETED";
    } else if (num === stepNum) {
      status = "ACTIVE";
    } else {
      status = "PENDING";
    }

    const stepDecision = latestStepDecisionByNumber.get(num);
    const decisionValue = (stepDecision?.decision ?? "").trim().toLowerCase();

    if (decisionValue === "approved" || decisionValue === "accept" || decisionValue === "accepted") {
      status = "COMPLETED";
    } else if (decisionValue === "query" || decisionValue === "queried") {
      status = "QUERIED";
    } else if (decisionValue === "reject" || decisionValue === "rejected") {
      status = "QUERIED";
    }

    const decisionComment = stepDecision?.comment?.trim();
    const queryReason =
      isQueried && num === stepNum ? detail.query_reason?.trim() : undefined;

    return {
      stepNumber: num,
      title: def.title,
      note: def.note,
      department: def.department,
      status,
      decision: stepDecision?.decision,
      decisionDisplay: stepDecision?.decision_display,
      comment: decisionComment || queryReason || undefined,
      completedBy: stepDecision?.decided_by_employee_username || undefined,
      completedAt:
        status === "COMPLETED"
          ? stepDecision?.updated_at || stepDecision?.created_at || bj.updated_at
          : undefined,
    };
  });

  // Build timeline from completed + active steps
  const timeline: TimelineEntry[] = steps
    .filter(
      (s) =>
        s.status === "COMPLETED" ||
        s.status === "ACTIVE" ||
        s.status === "QUERIED"
    )
    .map((s, i) => ({
      id: `t-${bj.id}-${i}`,
      label: s.title,
      subtext: s.note,
      status:
        s.status === "COMPLETED" ? ("done" as const) : ("current" as const),
      createdAt: bj.updated_at,
    }));

  const jobStatus: JobStatus =
    bj.status === "9_delivered_to_client" || bj.status === "delivered_to_client"
      ? "COMPLETED"
      : isQueried
        ? "QUERIED"
        : "IN_PROGRESS";

  const clientName =
    detail.client?.name ||
    extractClientNameFromDescription(detail.description) ||
    extractClientNameFromTitle(bj.title) ||
    bj.title ||
    "—";

  return {
    id: String(bj.id),
    jobId: bj.rn,
    jobType: bj.title || "Land Survey",
    clientId: detail.client?.id ? String(detail.client.id) : "",
    clientName,
    priority: "STANDARD",
    assignedTo:
      detail.assigned_to
        ? String(detail.assigned_to)
        : detail.assigned_to_employee_username || undefined,
    estimatedTime: undefined,
    submittedDate: bj.created_at,
    currentStep: stepNum,
    status: jobStatus,
    backendStatus: bj.status,
    statusDisplay: bj.status_display,
    regionalNumber: bj.regional_number || bj.rn,
    parcelSize: bj.parcel_acreage || undefined,
    paymentAmount: bj.payment_amount || undefined,
    queryReason: detail.query_reason || undefined,
    batchName: detail.batch_name || undefined,
    description: detail.description || undefined,
    documents: detail.documents || undefined,
    stepDecisions: mappedStepDecisions,
    steps,
    timeline,
    createdAt: bj.created_at,
    updatedAt: bj.updated_at,
  };
}

function mapHistoryToTimeline(
  history: BackendHistoryEntry[]
): TimelineEntry[] {
  return history.map((h) => {
    const stepDef = WORKFLOW_STEP_DEFS.find((d) => d.status === h.to_status);
    return {
      id: String(h.id),
      label: stepDef?.title ?? h.to_status.replace(/_/g, " "),
      subtext: h.notes || `Changed by ${h.changed_by_username}`,
      status: "done" as const,
      createdAt: h.created_at,
      createdBy: h.changed_by_username,
    };
  });
}

/**
 * Compute the next backend status in the canonical 9-stage workflow.
 * Legacy slugs are first normalized by step, then mapped into PATCH_STATUS_FLOW.
 */
export function getNextStatus(
  current: BackendStatus
): BackendStatus | null {
  return getNextPatchStatusForWorkflow(current);
}

/* ═══════════════════════════════════════════════════════════
   Auth API  (→ Railway backend)
   ═══════════════════════════════════════════════════════════ */

export const authApi = {
  /** Log in with email/username + password. Stores JWT tokens. */
  login: async (payload: { email: string; password: string }) => {
    const tokens = await backendRequest<{
      access: string;
      refresh: string;
    }>("/auth/token/", {
      method: "POST",
      body: JSON.stringify({
        username: payload.email,
        password: payload.password,
      }),
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", tokens.access);
      localStorage.setItem("refresh_token", tokens.refresh);
    }

    const backendUser = await backendRequest<BackendUser>("/auth/me/");
    const user = mapBackendUser(backendUser);

    return { user, token: tokens.access };
  },

  /** Register a new client account, then auto-login. */
  register: async (payload: import("@/types/user").RegisterPayload) => {
    void payload;
    throw new Error(
      "Self-registration is not enabled on the backend. Please contact an administrator for account setup."
    );
  },

  /** Get current authenticated user. */
  me: async () => {
    const backendUser = await backendRequest<BackendUser>("/auth/me/");
    return { user: mapBackendUser(backendUser) };
  },
};

function normalizeJobLookupKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function hasPathSeparator(value: string): boolean {
  return value.includes("/");
}

function isNumericJobId(value: string): boolean {
  return /^\d+$/.test(value.trim());
}

function isLikelyNotFoundError(message: string): boolean {
  return /(\b404\b|not\s*found|request failed:\s*404|no\s+\w+\s+matches\s+the\s+given\s+query)/i.test(
    message
  );
}

function isMethodNotAllowedError(message: string): boolean {
  return /(\b405\b|method\s*"?delete"?\s*not\s*allowed|method\s*not\s*allowed)/i.test(
    message
  );
}

function isPermissionError(message: string): boolean {
  return /(forbidden|permission|only clients)/i.test(message);
}

function toProfessionalTrackingErrorMessage(message: string): string {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return "We could not complete this request right now. Please try again.";
  if (normalized.includes("no job matches the given query") || normalized.includes("not found")) {
    return "No record was found for that tracking number. Please verify the number and try again.";
  }
  if (normalized.includes("authentication credentials were not provided")) {
    return "This service is currently unavailable. Please try again shortly.";
  }
  if (normalized.includes("lookup failed")) {
    return "We could not retrieve tracking details right now. Please try again shortly.";
  }
  return message;
}

function matchesJobIdentifier(item: BackendJobListItem, query: string): boolean {
  const normalizedQuery = normalizeJobLookupKey(query);
  if (!normalizedQuery) return false;

  const candidates = [
    String(item.id),
    item.rn,
    item.regional_number ?? "",
  ].map(normalizeJobLookupKey);

  return candidates.includes(normalizedQuery);
}

let backendSupportsJobDelete: boolean | null = null;
const JOB_LIST_LOOKUP_CACHE_TTL_MS = 15_000;
let jobListLookupCache:
  | {
      expiresAt: number;
      items: BackendJobListItem[];
    }
  | null = null;
let jobListLookupInFlight: Promise<BackendJobListItem[]> | null = null;

type BackendJobListPayload =
  | BackendJobListItem[]
  | { count?: number; results?: BackendJobListItem[] };

function invalidateJobListLookupCache() {
  jobListLookupCache = null;
  jobListLookupInFlight = null;
}

function extractBackendJobListItems(payload: BackendJobListPayload): BackendJobListItem[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  return [];
}

function mergeJobLookupItems(
  primary: BackendJobListItem[],
  secondary: BackendJobListItem[]
): BackendJobListItem[] {
  const merged = new Map<string, BackendJobListItem>();

  for (const item of [...primary, ...secondary]) {
    merged.set(String(item.id), item);
  }

  return Array.from(merged.values());
}

async function fetchJobLookupCandidates(query: string): Promise<BackendJobListItem[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const requestShapes: Array<Record<string, string>> = [
    { search: trimmedQuery, page_size: "100" },
    { q: trimmedQuery, page_size: "100" },
    { search: trimmedQuery, q: trimmedQuery, page_size: "100" },
  ];

  const collected: BackendJobListItem[] = [];

  for (const shape of requestShapes) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(shape)) {
      if (!value.trim()) continue;
      params.set(key, value);
    }

    if (!params.toString()) continue;

    try {
      const payload = await backendRequest<BackendJobListPayload>(
        `/jobs/?${params.toString()}`
      );
      collected.push(...extractBackendJobListItems(payload));
    } catch {
      // Search params are backend-version dependent; ignore failed shapes.
    }
  }

  return mergeJobLookupItems([], collected);
}

function hydrateJobListLookupCache(items: BackendJobListItem[]) {
  jobListLookupCache = {
    expiresAt: Date.now() + JOB_LIST_LOOKUP_CACHE_TTL_MS,
    items,
  };
}

async function getJobListLookupSnapshot(options?: {
  forceRefresh?: boolean;
}): Promise<BackendJobListItem[]> {
  if (options?.forceRefresh) {
    invalidateJobListLookupCache();
  }

  const now = Date.now();
  if (jobListLookupCache && jobListLookupCache.expiresAt > now) {
    return jobListLookupCache.items;
  }

  if (!jobListLookupInFlight) {
    jobListLookupInFlight = backendRequest<BackendJobListPayload>("/jobs/")
      .then((payload) => {
        const items = extractBackendJobListItems(payload);
        hydrateJobListLookupCache(items);
        return items;
      })
      .finally(() => {
        jobListLookupInFlight = null;
      });
  }

  return jobListLookupInFlight;
}

async function detectBackendJobDeleteSupport(): Promise<boolean | null> {
  if (backendSupportsJobDelete !== null) {
    return backendSupportsJobDelete;
  }

  try {
    const schema = await backendRequest<{
      paths?: Record<string, Record<string, unknown>>;
    }>("/schema/?format=json");

    const paths = schema.paths ?? {};
    backendSupportsJobDelete = Object.entries(paths).some(
      ([path, methods]) => {
        if (!/^\/api\/jobs\/\{[^}]+\}\/$/.test(path)) return false;
        return Object.keys(methods ?? {}).some(
          (method) => method.toLowerCase() === "delete"
        );
      }
    );
  } catch {
    // Some environments disable /schema/; treat as unknown and attempt real DELETE.
    return null;
  }

  return backendSupportsJobDelete;
}

async function findJobInList(
  rnOrId: string,
  options?: { forceRefresh?: boolean }
): Promise<BackendJobListItem | null> {
  const query = rnOrId.trim();
  if (!query) return null;

  const items = await getJobListLookupSnapshot(options);
  const cachedMatch = items.find((item) => matchesJobIdentifier(item, query));
  if (cachedMatch) {
    return cachedMatch;
  }

  const targetedItems = await fetchJobLookupCandidates(query);
  if (targetedItems.length === 0) {
    return null;
  }

  const mergedItems = mergeJobLookupItems(items, targetedItems);
  hydrateJobListLookupCache(mergedItems);

  return mergedItems.find((item) => matchesJobIdentifier(item, query)) ?? null;
}

async function resolveBackendJobPathKey(rnOrId: string): Promise<string> {
  const query = rnOrId.trim();
  if (!query) return query;

  if (isNumericJobId(query)) {
    const byIdMatch = await findJobInList(query);
    return byIdMatch?.rn?.trim() || query;
  }

  // RN strings containing spaces/slashes can fail as path params on some backends.
  if (!/[\s/]/.test(query)) return query;

  const listMatch = await findJobInList(query);
  return listMatch?.rn?.trim() || query;
}

async function resolveBackendJobRnForWrite(rnOrId: string): Promise<string> {
  const query = rnOrId.trim();
  if (!query) {
    throw new Error("Regional number (rn) is required for job updates.");
  }

  const matched = await findJobInList(query).catch(() => null);
  const matchedRn = matched?.rn?.trim();
  if (matchedRn) {
    return matchedRn;
  }

  const resolvedLookupKey = await resolveBackendJobPathKey(query);
  if (isNumericJobId(resolvedLookupKey)) {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      console.warn("[jobsApi] write RN resolution failed", {
        input: query,
        resolvedLookupKey,
      });
    }
    throw new Error("Job rn could not be resolved from id. Use rn from the list payload.");
  }

  return resolvedLookupKey;
}

function getJobPathCandidates(lookupKey: string): string[] {
  const key = lookupKey.trim();
  if (!key) return [key];

  // Return only the raw key - encodeURIComponent() in requestJobEndpoint will handle all encoding
  // Do NOT pre-encode here, it causes double-encoding when combined with encodeURIComponent()
  return [key];
}

async function getResolvedJobPathCandidates(lookupKey: string): Promise<string[]> {
  const key = lookupKey.trim();
  const baseCandidates = getJobPathCandidates(key);
  if (!key || isNumericJobId(key) || !/[\s/]/.test(key)) {
    return baseCandidates;
  }

  const listMatch = await findJobInList(key).catch(() => null);
  if (!listMatch) {
    return baseCandidates;
  }

  return Array.from(
    new Set(
      [
        listMatch.rn?.trim() ?? "",
        listMatch.regional_number?.trim() ?? "",
        ...baseCandidates,
        String(listMatch.id),
      ]
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

async function requestJobEndpoint<T>(
  lookupKey: string,
  suffix: string,
  options?: RequestInit
): Promise<T> {
  const candidates = await getResolvedJobPathCandidates(lookupKey);
  let lastError: unknown;

  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    const singleEncodedCandidate = encodeURIComponent(candidate);
    const encodedVariants = candidate.includes("/")
      ? [
          singleEncodedCandidate,
          // Fallback for environments where an intermediate layer decodes `%2F`.
          singleEncodedCandidate.replace(/%2F/g, "%252F"),
        ]
      : [singleEncodedCandidate];

    const uniqueEncodedVariants = Array.from(new Set(encodedVariants));

    for (let j = 0; j < uniqueEncodedVariants.length; j += 1) {
      const encodedCandidate = uniqueEncodedVariants[j];
      const isLastAttempt =
        i === candidates.length - 1 && j === uniqueEncodedVariants.length - 1;

      try {
        return await backendRequest<T>(`/jobs/${encodedCandidate}${suffix}`, options);
      } catch (err) {
        lastError = err;
        const message = err instanceof Error ? err.message : "";
        if (isLastAttempt || !isLikelyNotFoundError(message)) {
          throw err;
        }
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to resolve job endpoint path.");
}

function getEncodedJobPathVariants(candidate: string): string[] {
  const singleEncodedCandidate = encodeURIComponent(candidate);
  const encodedVariants = candidate.includes("/")
    ? [
        singleEncodedCandidate,
        // Fallback for environments where an intermediate layer decodes `%2F`.
        singleEncodedCandidate.replace(/%2F/g, "%252F"),
      ]
    : [singleEncodedCandidate];

  return Array.from(new Set(encodedVariants));
}

async function fetchJobDetailWithHistory(lookupKey: string) {
  const detail = await requestJobEndpoint<BackendJobDetail>(lookupKey, "/");
  const job = mapBackendJob(detail);

  try {
    const history = await requestJobEndpoint<BackendHistoryEntry[]>(
      lookupKey,
      "/history/"
    );
    if (history.length > 0) {
      job.timeline = mapHistoryToTimeline(history);
    }
  } catch {
    // history endpoint may not be available; keep adapter timeline
  }

  return { job };
}

function mapListItemToFallbackJob(item: BackendJobListItem) {
  return mapBackendJob({
    ...item,
    description: "",
    query_reason: "",
    submitted_by: null,
    assigned_to: null,
    batch: null,
    batch_name: null,
    documents: [],
  });
}

async function transitionJobStatus(
  rnOrId: string,
  payload: { status: BackendStatus; notes?: string; query_reason?: string }
): Promise<void> {
  const lookupKey = await resolveBackendJobRnForWrite(rnOrId);
  const candidates = await getResolvedJobPathCandidates(lookupKey);
  let lastError: unknown;

  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    try {
      await localRequest<Record<string, unknown>>(
        `/jobs/${encodeURIComponent(candidate)}/transition`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      return;
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : "";
      const isLast = i === candidates.length - 1;
      if (isLast || !isLikelyNotFoundError(message)) {
        throw err;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to transition job.");
}

const PATCHABLE_WORKFLOW_STATUSES = new Set<BackendStatus>([
  "1_rnr",
  "2_regional_number",
  "3_job_production",
  "4_ls_cert",
  "5_csau_payment",
  "6_examination",
  "7_region",
  "8_signed_out_csau",
  "9_delivered_to_client",
]);

const PATCH_STATUS_FLOW: BackendStatus[] = [
  "1_rnr",
  "2_regional_number",
  "3_job_production",
  "4_ls_cert",
  "5_csau_payment",
  "6_examination",
  "7_region",
  "8_signed_out_csau",
  "9_delivered_to_client",
];

async function setJobStatusViaPatch(rnOrId: string, status: BackendStatus): Promise<void> {
  const lookupKey = await resolveBackendJobRnForWrite(rnOrId);
  await requestJobEndpoint<BackendJobDetail>(
    lookupKey,
    "/",
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
}

function mapStepToPatchStatus(step: number): BackendStatus {
  if (step <= 1) return "1_rnr";
  if (step <= 2) return "2_regional_number";
  if (step <= 3) return "3_job_production";
  if (step <= 6) return "4_ls_cert";
  if (step <= 7) return "5_csau_payment";
  if (step <= 9) return "6_examination";
  if (step <= 12) return "7_region";
  if (step <= 13) return "8_signed_out_csau";
  return "9_delivered_to_client";
}

function getNextPatchStatusForWorkflow(current: BackendStatus): BackendStatus | null {
  const step = STATUS_STEP_MAP[current] ?? 1;
  const currentPatchStatus = mapStepToPatchStatus(step);
  const currentIndex = PATCH_STATUS_FLOW.indexOf(currentPatchStatus);
  if (currentIndex < 0 || currentIndex >= PATCH_STATUS_FLOW.length - 1) {
    return null;
  }
  return PATCH_STATUS_FLOW[currentIndex + 1];
}

/* ═══════════════════════════════════════════════════════════
   Jobs API  (→ Railway backend)
   ═══════════════════════════════════════════════════════════ */

export const jobsApi = {
  list: async (
    params?: Record<string, string | number | undefined>,
    requestOptions?: { signal?: AbortSignal }
  ) => {
    const queryParams = new URLSearchParams();

    for (const [key, rawValue] of Object.entries(params ?? {})) {
      if (rawValue === undefined || rawValue === null) continue;
      const value = String(rawValue).trim();
      if (!value) continue;
      queryParams.set(key, value);
    }

    const qs = queryParams.toString();
    const payload = await backendRequest<
      BackendJobListPayload
    >(`/jobs/${qs ? `?${qs}` : ""}`, {
      signal: requestOptions?.signal,
    });
    const items = extractBackendJobListItems(payload);

    if (!qs) {
      hydrateJobListLookupCache(items);
    }

    const jobs = items.map(mapBackendJob);
    const total =
      !Array.isArray(payload) && typeof payload.count === "number"
        ? payload.count
        : jobs.length;
    return { jobs, total };
  },

  import: async (file: File) => {
    // Backend handles field mapping and row interpretation; frontend is only a gateway.
    const endpoints = ["/import/", "/jobs/import/"];
    const failures: string[] = [];

    for (const endpoint of endpoints) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await backendRequest<Record<string, unknown>>(endpoint, {
          method: "POST",
          body: formData,
        });

        return { endpoint, response };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Import failed";
        failures.push(`${endpoint} -> ${message}`);
      }
    }

    throw new Error(
      failures.length > 0
        ? `Backend import failed on all endpoints. ${failures.join(" | ")}`
        : "Backend import failed."
    );
  },

  get: async (rnOrId: string) => {
    const rawLookup = rnOrId.trim();

    // RN values containing '/' are frequently unsupported on backend detail routes.
    // Prefer list fallback to avoid repeated noisy 404 requests.
    if (hasPathSeparator(rawLookup)) {
      const slashFallback = await findJobInList(rawLookup);
      if (!slashFallback) {
        throw new Error("Job not found.");
      }

      return { job: mapListItemToFallbackJob(slashFallback) };
    }

    const lookupKey = await resolveBackendJobPathKey(rnOrId);

    try {
      const result = await fetchJobDetailWithHistory(lookupKey);
      return { job: result.job };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";

      // If path-lookup fails for RN-like values, resolve via list and re-fetch by numeric id.
      if (isLikelyNotFoundError(message)) {
        try {
          const fallback = await findJobInList(rnOrId);
          if (fallback) {
            try {
              const result = await fetchJobDetailWithHistory(fallback.rn);
              return { job: result.job };
            } catch {
              // Keep UX functional even when detail route cannot resolve RNs with slashes.
              return { job: mapListItemToFallbackJob(fallback) };
            }
          }
        } catch {
          // Keep original failure behavior if list fallback cannot be resolved.
        }
      }

      if (!isPermissionError(message)) {
        throw err;
      }

      // Some admin accounts can list jobs but cannot open the per-job detail endpoint.
      // Fallback to the list payload so the detail page still renders instead of failing.
      const fallback = await findJobInList(rnOrId);
      if (!fallback) throw err;

      const job = mapListItemToFallbackJob(fallback);

      return { job };
    }
  },

  create: async (payload: {
    rn?: string;
    title?: string;
    description?: string;
    parcel_acreage?: string;
    clientId?: number | string;
    contactEmail?: string;
    contactPhone?: string;
    jobId?: string;
    jobType?: string;
    clientName?: string;
    regionalNumber?: string;
    parcelSize?: string;
    skipBootstrapWorkflow?: boolean;
    [key: string]: unknown;
  }) => {
    const normalizedRn = normalizeRnInput(
      (payload.rn ?? payload.jobId ?? payload.regionalNumber ?? "") as string
    );
    const regionalNumber =
      String(payload.regionalNumber ?? payload.rn ?? payload.jobId ?? "").trim() || null;

    const client_id = await ensureBackendClientId({
      clientId: payload.clientId,
      clientName: payload.clientName,
      title: payload.title ?? payload.jobType,
      description: payload.description,
      contactEmail: payload.contactEmail,
      contactPhone: payload.contactPhone,
    });

    const body = {
      rn: normalizedRn,
      regional_number: regionalNumber,
      title: payload.title ?? payload.jobType ?? payload.clientName ?? "",
      description: payload.description ?? "",
      parcel_acreage: payload.parcel_acreage ?? payload.parcelSize ?? null,
      client_id,
    };

    const created = await backendRequest<BackendJobDetail>("/jobs/", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (payload.skipBootstrapWorkflow) {
      return { job: mapBackendJob(created) };
    }

    // Product rule: newly created jobs should start with the first three
    // workflow milestones already captured.
    const bootstrapStatuses: BackendStatus[] = [
      "2_regional_number",
      "3_job_production",
    ];

    let currentStatus = created.status as BackendStatus;
    let didBootstrap = false;

    for (const status of bootstrapStatuses) {
      const currentStep = STATUS_STEP_MAP[currentStatus] ?? 1;
      const targetStep = STATUS_STEP_MAP[status] ?? currentStep;
      if (currentStep >= targetStep) continue;

      try {
        await transitionJobStatus(created.rn, {
          status,
          notes: "Auto-initialized on job creation (steps 1-3).",
        });
        currentStatus = status;
        didBootstrap = true;
      } catch {
        break;
      }
    }

    if (didBootstrap) {
      const result = await jobsApi.get(created.rn);
      return result;
    }

    const mapped = mapBackendJob(created);

    return { job: mapped };
  },

  update: async (rnOrId: string, payload: Record<string, unknown>) => {
    const lookupKey = await resolveBackendJobRnForWrite(rnOrId);
    const updated = await requestJobEndpoint<BackendJobDetail>(
      lookupKey,
      "/",
      { method: "PATCH", body: JSON.stringify(payload) }
    );
    return { job: mapBackendJob(updated) };
  },

  delete: async (rnOrId: string) => {
    const query = rnOrId.trim();
    if (!query) {
      throw new Error("Job identifier is required for deletion.");
    }

    const cleanupRegisterCache = (matchedJob?: BackendJobListItem | null) => {
      const records = readRegisterFieldsMap();
      const keysToDelete = new Set<string>([
        query,
        matchedJob ? String(matchedJob.id) : "",
        matchedJob?.rn?.trim() ?? "",
      ]);
      let changed = false;

      for (const key of keysToDelete) {
        if (!key) continue;
        if (!(key in records)) continue;
        delete records[key];
        changed = true;
      }

      if (changed) {
        writeRegisterFieldsMap(records);
      }
    };

    if (backendSupportsJobDelete === false) {
      throw new Error(
        "Backend API does not currently support deleting jobs. This job was not removed from the database."
      );
    }

    const tryDeleteForKey = async (candidateKey: string): Promise<"deleted" | "not_found"> => {
      const normalizedKey = candidateKey.trim();
      if (!normalizedKey) return "not_found";

      const encodedCandidates = getEncodedJobPathVariants(normalizedKey);
      let lastError: unknown = null;

      for (let i = 0; i < encodedCandidates.length; i += 1) {
        const encodedCandidate = encodedCandidates[i];
        try {
          await backendRequest<Record<string, unknown>>(`/jobs/${encodedCandidate}/`, {
            method: "DELETE",
          });
          backendSupportsJobDelete = true;
          return "deleted";
        } catch (error) {
          lastError = error;
          const message = error instanceof Error ? error.message : "";
          if (isMethodNotAllowedError(message)) {
            backendSupportsJobDelete = false;
            throw new Error(
              "Backend API rejected job deletion (405 Method Not Allowed). This job was not removed from the database."
            );
          }

          if (!isLikelyNotFoundError(message)) {
            throw error;
          }
        }
      }

      if (lastError && !isLikelyNotFoundError(lastError instanceof Error ? lastError.message : "")) {
        throw lastError;
      }

      return "not_found";
    };

    // Fast path: try deleting the provided identifier directly first.
    const fastDelete = await tryDeleteForKey(query);
    if (fastDelete === "deleted") {
      invalidateJobListLookupCache();
      cleanupRegisterCache(null);
      return {
        success: true,
        mode: "backend" as const,
        message: "Job deleted from backend successfully.",
      };
    }

    // Fallback path: resolve candidate ids/rn only if direct delete did not find a job.
    const matchedJob = await findJobInList(query).catch(() => null);
    const resolvedLookupKey = await resolveBackendJobPathKey(query).catch(() => query);
    const candidateDeleteKeys = Array.from(
      new Set(
        [
          matchedJob ? String(matchedJob.id) : "",
          matchedJob?.rn?.trim() ?? "",
          matchedJob?.regional_number?.trim() ?? "",
          resolvedLookupKey,
          query,
        ]
          .map((value) => value.trim())
          .filter(Boolean)
      )
    );

    for (const candidateKey of candidateDeleteKeys) {
      const result = await tryDeleteForKey(candidateKey);
      if (result === "deleted") {
        invalidateJobListLookupCache();
        cleanupRegisterCache(matchedJob);
        return {
          success: true,
          mode: "backend" as const,
          message: "Job deleted from backend successfully.",
        };
      }
    }

    // Final compatibility check only if delete attempts could not find the record.
    if (backendSupportsJobDelete === null) {
      const backendCanDeleteJobs = await detectBackendJobDeleteSupport();
      if (backendCanDeleteJobs === false) {
        throw new Error(
          "Backend API does not currently support deleting jobs. This job was not removed from the database."
        );
      }
    }

    throw new Error(
      "Job could not be deleted from backend. The record was not found on the backend delete endpoint."
    );
  },

  advanceStep: async (
    rnOrId: string,
    payload: { comment?: string; completedBy?: string },
    options?: { currentBackendStatus?: BackendStatus | null }
  ) => {
    const statusFromCaller = options?.currentBackendStatus ?? undefined;
    const { job: current } = statusFromCaller
      ? ({ job: { backendStatus: statusFromCaller } } as { job: { backendStatus?: string | null } })
      : await jobsApi.get(rnOrId);

    const nextStatus = getNextPatchStatusForWorkflow(
      current.backendStatus as BackendStatus
    );
    if (!nextStatus) throw new Error("Job is already at the final step");

    await setJobStatusViaPatch(rnOrId, nextStatus);

    return jobsApi.get(rnOrId);
  },

  /** Transition a job to any explicit status (used for Accept / Query / Reject from tracking table). */
  transitionTo: async (
    rnOrId: string,
    payload: { status: BackendStatus; notes?: string; queryReason?: string }
  ) => {
    if (PATCHABLE_WORKFLOW_STATUSES.has(payload.status)) {
      await setJobStatusViaPatch(rnOrId, payload.status);
    } else {
      await transitionJobStatus(rnOrId, {
        status: payload.status,
        notes: payload.notes ?? "",
        query_reason: payload.queryReason?.trim() || undefined,
      });
    }
    return jobsApi.get(rnOrId);
  },

  addTimeline: async (
    rnOrId: string,
    payload: { label: string; subtext: string }
  ) => {
    const lookupKey = await resolveBackendJobPathKey(rnOrId);
    await requestJobEndpoint(
      lookupKey,
      "/",
      {
        method: "PATCH",
        body: JSON.stringify({
          description: `[${payload.label}] ${payload.subtext}`,
        }),
      }
    );
    return {
      entry: {
        id: `note-${Date.now()}`,
        label: payload.label,
        subtext: payload.subtext,
        status: "current" as const,
        createdAt: new Date().toISOString(),
      },
    };
  },

  search: async (query: string) => {
    const rawQuery = query.trim();
    if (!rawQuery) return { jobs: [] as Job[] };

    // Anonymous-first lookup path: use the server-side public proxy route.
    // This keeps end users from needing to log in to track their jobs.
    const res = await fetch(
      `${LOCAL_URL}/public/jobs/${encodeURIComponent(rawQuery)}?fresh=${Date.now()}`,
      {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      }
    );

    if (res.status === 404) return { jobs: [] as Job[] };

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const errorMessage =
        typeof body === "object" && body && "error" in body && typeof body.error === "string"
          ? body.error
          : `Public job lookup failed: ${res.status}`;

      const normalizedError = errorMessage.toLowerCase();
      if (
        normalizedError.includes("service credentials are not configured") ||
        normalizedError.includes("no active account found with the given credentials")
      ) {
        throw new Error("Public job tracking is temporarily unavailable. Please try again shortly.");
      }

      throw new Error(toProfessionalTrackingErrorMessage(errorMessage));
    }

    const body = (await res.json()) as {
      job?: BackendJobDetail | BackendJobListItem | null;
      jobs?: BackendJobListItem[];
    };

    if (Array.isArray(body.jobs)) {
      return {
        jobs: body.jobs.map(mapBackendJob),
      };
    }
    if (!body.job) return { jobs: [] as Job[] };

    const mapped = mapBackendJob(body.job);
    return { jobs: [mapped] };
  },
};

export const registerFieldsApi = {
  list: async (jobIds?: string[]) => {
    const localRecords = readRegisterFieldsMap();
    const ids = Array.from(
      new Set((jobIds ?? []).map((value) => value.trim()).filter(Boolean))
    );

    if (ids.length === 0) {
      return {
        records: Object.fromEntries(
          Object.entries(localRecords).map(([jobId, record]) => [
            jobId,
            { ...record, source: record.source ?? "local" },
          ])
        ),
      };
    }

    const records: Record<string, JobRegisterRecord> = {};

    await Promise.all(
      ids.map(async (jobId) => {
        try {
          const { job } = await jobsApi.get(jobId);
          const backendRecord = parseRegisterRecordFromDescription(
            job.description,
            jobId
          );
          if (backendRecord) {
            records[jobId] = backendRecord;
            return;
          }

          const localRecord = localRecords[jobId];
          if (localRecord) {
            const migratedRecord: JobRegisterRecord = {
              ...localRecord,
              jobId,
              updatedAt: localRecord.updatedAt || new Date().toISOString(),
              source: "backend",
            };

            const hasPersistedValues =
              Object.keys(migratedRecord.stages ?? {}).length > 0 ||
              Boolean(migratedRecord.actualRegionalNumber?.trim());

            if (hasPersistedValues) {
              try {
                const nextDescription = buildDescriptionWithRegisterRecord(
                  job.description,
                  migratedRecord
                );
                await jobsApi.update(job.jobId, { description: nextDescription });
                records[jobId] = migratedRecord;
                localRecords[jobId] = migratedRecord;
                return;
              } catch {
                // Keep local fallback if migration write fails for this job.
              }
            }
          }
        } catch {
          // Fall back to cached browser data when backend detail lookup fails.
        }

        if (localRecords[jobId]) {
          records[jobId] = {
            ...localRecords[jobId],
            source: localRecords[jobId].source ?? "local",
          };
        }
      })
    );

    writeRegisterFieldsMap(localRecords);

    return { records };
  },

  get: async (jobId: string) => {
    try {
      const { job } = await jobsApi.get(jobId);
      const backendRecord = parseRegisterRecordFromDescription(
        job.description,
        jobId
      );
      if (backendRecord) return { record: backendRecord };
    } catch {
      // Fall back to local browser cache when backend lookup fails.
    }

    const records = readRegisterFieldsMap();
    const record = records[jobId]
      ? { ...records[jobId], source: records[jobId].source ?? "local" }
      : null;
    return { record };
  },

  update: async (jobId: string, payload: UpdateJobRegisterPayload) => {
    const records = readRegisterFieldsMap();
    const { job } = await jobsApi.get(jobId);

    const backendExisting = parseRegisterRecordFromDescription(
      job.description,
      jobId
    );

    const existing =
      backendExisting ??
      records[jobId] ?? {
        jobId,
        actualRegionalNumber: "",
        stages: {},
        clearedStageKeys: [],
        updatedAt: new Date().toISOString(),
      };

    const mergedStages = { ...existing.stages };
    const clearedStageKeySet = new Set<RegisterStageKey>(existing.clearedStageKeys ?? []);
    for (const [key, value] of Object.entries(payload.stages ?? {})) {
      const typedKey = key as RegisterStageKey;
      if (value === null) {
        delete mergedStages[typedKey as keyof typeof mergedStages];
        clearedStageKeySet.add(typedKey);
      } else {
        mergedStages[typedKey as keyof typeof mergedStages] = value;
        clearedStageKeySet.delete(typedKey);
      }
    }

    const record: JobRegisterRecord = {
      ...existing,
      actualRegionalNumber:
        payload.actualRegionalNumber?.trim() ?? existing.actualRegionalNumber,
      stages: mergedStages,
      clearedStageKeys:
        clearedStageKeySet.size > 0 ? Array.from(clearedStageKeySet) : undefined,
      updatedAt: new Date().toISOString(),
      source: "backend",
    };

    const hasPersistedValues =
      Object.keys(mergedStages).length > 0 ||
      (record.clearedStageKeys?.length ?? 0) > 0 ||
      Boolean(record.actualRegionalNumber?.trim());

    const nextDescription = hasPersistedValues
      ? buildDescriptionWithRegisterRecord(job.description, record)
      : stripRegisterMetaFromDescription(job.description);

    await jobsApi.update(job.jobId, { description: nextDescription });

    records[jobId] = record;
    writeRegisterFieldsMap(records);
    return { record };
  },
};

/* ═══════════════════════════════════════════════════════════
   Batches API  (→ Railway backend)
   ═══════════════════════════════════════════════════════════ */

export interface Batch {
  id: number;
  name: string;
  job_count: string;
  created_by: number | null;
  created_at: string;
  sent_at: string | null;
}

export const batchesApi = {
  list: () => backendRequest<Batch[]>("/batches/"),
  get: (id: number) =>
    backendRequest<Batch & { jobs: BackendJobListItem[] }>(`/batches/${id}/`),
  create: (name: string) =>
    backendRequest<Batch>("/batches/", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  addJob: (batchId: number, jobRn: string) =>
    backendRequest(`/batches/${batchId}/add-job/`, {
      method: "POST",
      body: JSON.stringify({ job_rn: jobRn }),
    }),
};

/* ═══════════════════════════════════════════════════════════
   Users / Employees API  (invite → Railway, list → local)
   ═══════════════════════════════════════════════════════════ */

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
}

const FRONTEND_TO_BACKEND_ROLE: Record<string, string> = {
  LICENSED_SURVEYOR: "employees",
  CSAU_OFFICER: "employees",
  SMD_EXAMINER: "employees",
  SMD_REGIONAL: "employees",
  ADMIN: "admin",
};

function mapBackendUserRoleToFrontend(role?: string): string {
  const normalized = String(role ?? "").trim().toLowerCase();
  if (normalized === "system_admin") return "SUPER_ADMIN";
  if (normalized === "admin") return "ADMIN";
  if (normalized === "employees") return "CSAU_OFFICER";
  if (normalized === "clients") return "CLIENT";
  return (role ?? "CLIENT").toUpperCase();
}

interface BackendEmployeeListUser {
  id: string | number;
  name?: string;
  email: string;
  role?: string;
  isActive?: boolean;
  is_active?: boolean;
  lastLogin?: string;
  last_login?: string;
  createdAt?: string;
  created_at?: string;
}

interface BackendEmployeeListPayload {
  users: BackendEmployeeListUser[];
  total?: number;
}

export const usersApi = {
  list: async (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    const payload = await backendRequest<BackendEmployeeListPayload>(
      `/auth/admin/employees/${qs}`
    );

    const users: UserRow[] = (payload.users ?? []).map((entry) => ({
      id: String(entry.id),
      name: entry.name?.trim() || entry.email || "Unknown User",
      email: entry.email,
      role: mapBackendUserRoleToFrontend(entry.role),
      isActive: Boolean(
        typeof entry.isActive === "boolean" ? entry.isActive : entry.is_active
      ),
      lastLogin: entry.lastLogin ?? entry.last_login ?? "—",
      createdAt: entry.createdAt ?? entry.created_at ?? new Date().toISOString(),
    }));

    return {
      users,
      total: typeof payload.total === "number" ? payload.total : users.length,
    };
  },

  invite: async (payload: {
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  }) => {
    const backendRole = FRONTEND_TO_BACKEND_ROLE[payload.role];
    if (!backendRole) {
      throw new Error(
        "Selected role is not supported by the backend employee invite endpoint."
      );
    }
    const created = await backendRequest<{
      message?: string;
      user: BackendUser;
      invite_expires_at?: string;
    }>(
      "/auth/admin/employees/",
      {
        method: "POST",
        body: JSON.stringify({
          email: payload.email,
          first_name: payload.firstName ?? "",
          last_name: payload.lastName ?? "",
          role: backendRole,
        }),
      }
    );
    return {
      user: {
        id: String(created.user.id),
        name: `${created.user.first_name} ${created.user.last_name}`.trim(),
        email: created.user.email,
        role: payload.role,
        isActive: true,
        lastLogin: "—",
        createdAt: created.user.profile?.created_at ?? new Date().toISOString(),
      } as UserRow,
    };
  },
};

/* ═══════════════════════════════════════════════════════════
   Members API  (→ Backend Clients + local metadata for extra fields)
   ═══════════════════════════════════════════════════════════ */

export const membersApi = {
  list: async (params?: Record<string, string>) => {
    const clients = await backendRequest<BackendClient[]>("/clients/");
    let members = clients.map(mapBackendClientToMember);

    if (params?.region) {
      members = members.filter((member) => member.region === params.region);
    }

    if (params?.q) {
      const q = params.q.toLowerCase();
      members = members.filter((member) =>
        [
          member.firstName,
          member.surname,
          member.phone,
          member.ghanaCard,
          member.voterIdNumber,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q))
      );
    }

    return { members, total: members.length };
  },

  get: async (id: string) => {
    const client = await backendRequest<BackendClient>(`/clients/${encodeURIComponent(id)}/`);
    return { member: mapBackendClientToMember(client) };
  },

  create: async (payload: import("@/types/member").CreateMemberPayload) => {
    const name = `${payload.firstName} ${payload.surname}`.trim();
    const phone = normalizePhone(payload.phone);
    const created = await backendRequest<BackendClient>("/clients/", {
      method: "POST",
      body: JSON.stringify({
        name,
        phone,
        email: toLocalFallbackEmail(name, phone),
      }),
    });

    upsertMemberMeta(String(created.id), {
      dateOfBirth: payload.dateOfBirth,
      region: payload.region,
      constituency: payload.constituency,
      pollingStation: payload.pollingStation,
      ghanaCard: payload.ghanaCard,
      voterIdNumber: payload.voterIdNumber,
      registrationMethod: payload.registrationMethod ?? "MANUAL",
      isActive: true,
      totalDuesPaid: 0,
      createdAt: created.created_at,
      updatedAt: created.updated_at,
    });

    return { member: mapBackendClientToMember(created) };
  },

  update: async (id: string, payload: Partial<import("@/types/member").Member>) => {
    const client = await backendRequest<BackendClient>(`/clients/${encodeURIComponent(id)}/`);

    const currentName = client.name;
    const current = splitDisplayName(currentName);
    const name = `${payload.firstName ?? current.firstName} ${payload.surname ?? current.surname}`.trim();
    const phone = payload.phone ?? client.phone;
    const patch: Partial<Pick<BackendClient, "name" | "phone">> = {};
    if (name !== client.name) patch.name = name;
    if (phone !== client.phone) patch.phone = phone;

    const updatedClient =
      Object.keys(patch).length > 0
        ? await backendRequest<BackendClient>(`/clients/${encodeURIComponent(id)}/`, {
            method: "PATCH",
            body: JSON.stringify(patch),
          })
        : client;

    upsertMemberMeta(String(updatedClient.id), extractMemberMetaFromPayload(payload));
    return { member: mapBackendClientToMember(updatedClient) };
  },

  import: async (file: File) => {
    const XLSX = await import("xlsx");
    const content = await file.arrayBuffer();
    const wb = XLSX.read(content, { type: "array" });
    const firstSheet = wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[firstSheet], {
      defval: "",
    });

    let imported = 0;
    for (const row of rows) {
      const firstName = String(row.firstName ?? row["First Name"] ?? "").trim();
      const surname = String(row.surname ?? row.Surname ?? row.lastName ?? "").trim();
      const phone = String(row.phone ?? row.Phone ?? "").trim();
      if (!firstName || !surname || !phone) continue;

      try {
        await membersApi.create({
          firstName,
          surname,
          dateOfBirth: String(row.dateOfBirth ?? row["Date of Birth"] ?? ""),
          region: String(row.region ?? row.Region ?? "Greater Accra"),
          constituency: String(row.constituency ?? row.Constituency ?? ""),
          pollingStation: String(row.pollingStation ?? row["Polling Station"] ?? ""),
          ghanaCard: String(row.ghanaCard ?? row["Ghana Card"] ?? "") || undefined,
          voterIdNumber: String(row.voterIdNumber ?? row["Voter ID"] ?? "") || undefined,
          phone,
          registrationMethod: "IMPORT",
        });
        imported++;
      } catch {
        // Continue importing remaining rows even if a row fails.
      }
    }

    return { imported, failed: rows.length - imported, total: rows.length };
  },

  export: async () => {
    const { members } = await membersApi.list();
    const headers = [
      "firstName",
      "surname",
      "dateOfBirth",
      "region",
      "constituency",
      "pollingStation",
      "ghanaCard",
      "voterIdNumber",
      "phone",
      "registrationMethod",
    ];
    const csvEscape = (value: string) => {
      if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
        return `"${value.replace(/\"/g, '""')}"`;
      }
      return value;
    };

    const lines = [
      headers.join(","),
      ...members.map((member) =>
        [
          member.firstName,
          member.surname,
          member.dateOfBirth,
          member.region,
          member.constituency,
          member.pollingStation,
          member.ghanaCard ?? "",
          member.voterIdNumber ?? "",
          member.phone,
          member.registrationMethod,
        ]
          .map((cell) => csvEscape(String(cell ?? "")))
          .join(",")
      ),
    ];

    return new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  },
};

/* ═══════════════════════════════════════════════════════════
   SMS API  (→ Local)
   ═══════════════════════════════════════════════════════════ */

export const smsApi = {
  send: (payload: import("@/types/member").SendSmsPayload) =>
    localRequest<{ message: import("@/types/member").SmsMessage }>(
      "/sms/send",
      { method: "POST", body: JSON.stringify(payload) }
    ),
  history: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return localRequest<{
      messages: import("@/types/member").SmsMessage[];
      total: number;
    }>(`/sms/history${qs}`);
  },
};

/* ═══════════════════════════════════════════════════════════
   Dues API  (→ Local)
   ═══════════════════════════════════════════════════════════ */

export const duesApi = {
  summary: () =>
    localRequest<import("@/types/member").DuesSummary>("/dues/summary"),
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return localRequest<{
      payments: import("@/types/member").DuesPayment[];
      total: number;
    }>(`/dues${qs}`);
  },
};

/* ═══════════════════════════════════════════════════════════
   Reports API  (→ hybrid: derive job stats from backend)
   ═══════════════════════════════════════════════════════════ */

export const reportsApi = {
  jobStats: async () => {
    try {
      const items = await backendRequest<BackendJobListItem[]>("/jobs/");
      const total = items.length;
      let inProgress = 0;
      let completed = 0;
      let queried = 0;
      const byStep: Record<number, number> = {};
      const byStatus: Record<string, number> = {
        "1_rnr": 0,
        "2_regional_number": 0,
        "3_job_production": 0,
        "4_ls_cert": 0,
        "5_csau_payment": 0,
        "6_examination": 0,
        "7_region": 0,
        "8_signed_out_csau": 0,
        "9_delivered_to_client": 0,
      };

      for (const j of items) {
        if (j.status === "9_delivered_to_client" || j.status === "delivered_to_client") {
          completed++;
        } else if (
          j.status === "queried_ls461" ||
          j.status === "queried_smd"
        ) {
          queried++;
        } else {
          inProgress++;
        }
        const step = STATUS_STEP_MAP[j.status] ?? 1;
        byStep[step] = (byStep[step] ?? 0) + 1;

        // Canonical funnel buckets (coalesce legacy slugs to current schema)
        const normalizedStatus =
          j.status === "signed_out_csau"
            ? "8_signed_out_csau"
            : j.status === "delivered_to_client"
              ? "9_delivered_to_client"
              : j.status;

        if (normalizedStatus in byStatus) {
          byStatus[normalizedStatus] = (byStatus[normalizedStatus] ?? 0) + 1;
        }
      }

      return { total, inProgress, completed, queried, byStep, byStatus };
    } catch {
      return {
        total: 0,
        inProgress: 0,
        completed: 0,
        queried: 0,
        byStep: {},
        byStatus: {},
      };
    }
  },

  membershipStats: async () => {
    const { members } = await membersApi.list();
    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.isActive).length;
    const now = new Date();
    const newThisMonth = members.filter((m) => {
      const created = new Date(m.createdAt);
      return (
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    }).length;
    const duesCollected = members.reduce(
      (sum, member) => sum + (member.totalDuesPaid ?? 0),
      0
    );
    const byRegion: Record<string, number> = {};
    for (const member of members) {
      const region = member.region || "Unknown";
      byRegion[region] = (byRegion[region] ?? 0) + 1;
    }
    return { totalMembers, activeMembers, newThisMonth, duesCollected, byRegion };
  },
};

/* ═══════════════════════════════════════════════════════════
   Settings API  (→ Local)
   ═══════════════════════════════════════════════════════════ */

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

export const settingsApi = {
  get: () => localRequest<{ settings: AppSettings }>("/settings"),
  update: (payload: Partial<AppSettings>) =>
    localRequest<{ settings: AppSettings }>("/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};
