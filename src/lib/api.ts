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
import type { JobRegisterRecord, UpdateJobRegisterPayload } from "@/types/register";

const BACKEND_URL = "/backend-api"; // Proxied → Railway backend
const LOCAL_URL = "/api"; // Local Next.js API routes

/* ═══════════════════════════════════════════════════════════
   Generic request helpers
   ═══════════════════════════════════════════════════════════ */

/* ── Member metadata helper (extra fields not in backend Clients schema) ── */
const MEMBER_META_KEY = "_member_meta_by_client_id";
const REGISTER_FIELDS_KEY = "_register_fields_by_job_id";

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
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", data.access);
    }
    return data.access;
  } catch {
    return null;
  }
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
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body === "object"
        ? body.detail ??
          body.error ??
          Object.values(body).flat().join(", ") ??
          `Request failed: ${res.status}`
        : `Request failed: ${res.status}`;
    throw new Error(message);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0")
    return {} as T;
  return res.json();
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
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
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
  | "7_region"
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
  "signed_out_csau",
  "delivered_to_client",
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
  { status: "signed_out_csau", title: "Signed Out (CSAU)", note: "CSAU signs out the cleared and approved job.", department: "CSAU" },
  { status: "delivered_to_client", title: "Delivered to Client", note: "Approved documents delivered to the client.", department: "Client" },
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
  licensed_surveyor: "LICENSED_SURVEYOR",
  csau: "CSAU_OFFICER",
  smd_examination: "SMD_EXAMINER",
  smd_region: "SMD_REGIONAL",
  chief_examiner: "ADMIN",
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
  // Fallback: if no profile or unknown role, treat as ADMIN for staff-like accounts
  if (!bu.profile) return "ADMIN";
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
    bj.status === "delivered_to_client"
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

function matchesBackendJobQuery(
  job: BackendJobListItem | BackendJobDetail,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;

  const fields: Array<string | undefined | null> = [
    job.rn,
    job.regional_number,
    job.title,
    job.status_display,
    job.client?.name,
    job.client?.email,
    job.client?.phone,
  ];

  if ("description" in job) {
    fields.push(job.description);
  }

  return fields
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .some((value) => value.toLowerCase().includes(q));
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

/** Compute the next linear status after the current one. */
export function getNextStatus(
  current: BackendStatus
): BackendStatus | null {
  const currentSchemaFlow: BackendStatus[] = [
    "1_rnr",
    "2_regional_number",
    "3_job_production",
    "4_ls_cert",
    "5_csau_payment",
    "6_examination",
    "7_region",
  ];
  const currentIdx = currentSchemaFlow.indexOf(current);
  if (currentIdx >= 0) {
    return currentIdx >= currentSchemaFlow.length - 1
      ? null
      : currentSchemaFlow[currentIdx + 1];
  }

  if (current === "queried_ls461") return "certified_ls461";
  if (current === "queried_smd") return "certified_smd";
  const idx = WORKFLOW_STATUSES.indexOf(current);
  if (idx < 0 || idx >= WORKFLOW_STATUSES.length - 1) return null;
  return WORKFLOW_STATUSES[idx + 1];
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
  register: async (_payload: import("@/types/user").RegisterPayload) => {
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

/* ═══════════════════════════════════════════════════════════
   Jobs API  (→ Railway backend)
   ═══════════════════════════════════════════════════════════ */

export const jobsApi = {
  list: async (_params?: Record<string, string>) => {
    const items = await backendRequest<BackendJobListItem[]>("/jobs/");
    const jobs = items.map(mapBackendJob);
    return { jobs, total: jobs.length };
  },

  get: async (rnOrId: string) => {
    try {
      const detail = await backendRequest<BackendJobDetail>(
        `/jobs/${encodeURIComponent(rnOrId)}/`
      );
      const job = mapBackendJob(detail);

      try {
        const history = await backendRequest<BackendHistoryEntry[]>(
          `/jobs/${encodeURIComponent(rnOrId)}/history/`
        );
        if (history.length > 0) {
          job.timeline = mapHistoryToTimeline(history);
        }
      } catch {
        // history endpoint may not be available; keep adapter timeline
      }

      return { job };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (!/(forbidden|permission|only clients)/i.test(message)) {
        throw err;
      }

      // Some admin accounts can list jobs but cannot open the per-job detail endpoint.
      // Fallback to the list payload so the detail page still renders instead of failing.
      const items = await backendRequest<BackendJobListItem[]>("/jobs/");
      const fallback = items.find(
        (item) => item.rn === rnOrId || String(item.id) === rnOrId
      );
      if (!fallback) throw err;

      const job = mapBackendJob({
        ...fallback,
        description: "",
        query_reason: "",
        submitted_by: null,
        assigned_to: null,
        batch: null,
        batch_name: null,
        documents: [],
      });

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
    [key: string]: unknown;
  }) => {
    const client_id = await ensureBackendClientId({
      clientId: payload.clientId,
      clientName: payload.clientName,
      title: payload.title ?? payload.jobType,
      description: payload.description,
      contactEmail: payload.contactEmail,
      contactPhone: payload.contactPhone,
    });

    const body = {
      rn: payload.rn ?? payload.jobId ?? payload.regionalNumber ?? "",
      title: payload.title ?? payload.jobType ?? payload.clientName ?? "",
      description: payload.description ?? "",
      parcel_acreage: payload.parcel_acreage ?? payload.parcelSize ?? null,
      client_id,
    };

    const created = await backendRequest<BackendJobDetail>("/jobs/", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return { job: mapBackendJob(created) };
  },

  update: async (rnOrId: string, payload: Record<string, unknown>) => {
    const updated = await backendRequest<BackendJobDetail>(
      `/jobs/${encodeURIComponent(rnOrId)}/`,
      { method: "PATCH", body: JSON.stringify(payload) }
    );
    return { job: mapBackendJob(updated) };
  },

  delete: async (_rnOrId: string) => {
    throw new Error("Delete is not supported by the backend API");
  },

  advanceStep: async (
    rnOrId: string,
    payload: { comment?: string; completedBy?: string }
  ) => {
    const { job: current } = await jobsApi.get(rnOrId);
    const nextStatus = getNextStatus(current.backendStatus as BackendStatus);
    if (!nextStatus) throw new Error("Job is already at the final step");

    await backendRequest(
      `/jobs/${encodeURIComponent(rnOrId)}/transition/`,
      {
        method: "POST",
        body: JSON.stringify({ status: nextStatus, notes: payload.comment ?? "" }),
      }
    );

    return jobsApi.get(rnOrId);
  },

  /** Transition a job to any explicit status (used for Accept / Query / Reject from tracking table). */
  transitionTo: async (
    rnOrId: string,
    payload: { status: BackendStatus; notes?: string }
  ) => {
    await backendRequest(
      `/jobs/${encodeURIComponent(rnOrId)}/transition/`,
      {
        method: "POST",
        body: JSON.stringify({ status: payload.status, notes: payload.notes ?? "" }),
      }
    );
    return jobsApi.get(rnOrId);
  },

  addTimeline: async (
    rnOrId: string,
    payload: { label: string; subtext: string }
  ) => {
    await backendRequest(`/jobs/${encodeURIComponent(rnOrId)}/`, {
      method: "PATCH",
      body: JSON.stringify({
        description: `[${payload.label}] ${payload.subtext}`,
      }),
    });
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
    const res = await fetch(`${LOCAL_URL}/public/jobs/${encodeURIComponent(rawQuery)}`);

    if (res.status === 404) return { jobs: [] as Job[] };

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const errorMessage =
        typeof body === "object" && body && "error" in body && typeof body.error === "string"
          ? body.error
          : `Public job lookup failed: ${res.status}`;

      if (errorMessage.toLowerCase().includes("service credentials are not configured")) {
        throw new Error("Public job tracking is temporarily unavailable. Please try again shortly.");
      }

      throw new Error(errorMessage);
    }

    const body = (await res.json()) as {
      job?: BackendJobDetail | BackendJobListItem | null;
      jobs?: BackendJobListItem[];
    };

    if (Array.isArray(body.jobs)) {
      return { jobs: body.jobs.map(mapBackendJob) };
    }
    if (!body.job) return { jobs: [] as Job[] };
    return { jobs: [mapBackendJob(body.job)] };
  },
};

export const registerFieldsApi = {
  list: async (jobIds?: string[]) => {
    const allRecords = readRegisterFieldsMap();
    if (!jobIds || jobIds.length === 0) return { records: allRecords };

    const records: Record<string, JobRegisterRecord> = {};
    for (const jobId of jobIds) {
      if (allRecords[jobId]) records[jobId] = allRecords[jobId];
    }
    return { records };
  },

  get: async (jobId: string) => {
    const records = readRegisterFieldsMap();
    return { record: records[jobId] ?? null };
  },

  update: async (jobId: string, payload: UpdateJobRegisterPayload) => {
    const records = readRegisterFieldsMap();
    const existing = records[jobId] ?? {
      jobId,
      actualRegionalNumber: "",
      stages: {},
      updatedAt: new Date().toISOString(),
    };

    const mergedStages = { ...existing.stages };
    for (const [key, value] of Object.entries(payload.stages ?? {})) {
      if (value === null) {
        delete mergedStages[key as keyof typeof mergedStages];
      } else {
        mergedStages[key as keyof typeof mergedStages] = value;
      }
    }

    const record: JobRegisterRecord = {
      ...existing,
      actualRegionalNumber:
        payload.actualRegionalNumber?.trim() ?? existing.actualRegionalNumber,
      stages: mergedStages,
      updatedAt: new Date().toISOString(),
    };

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
  LICENSED_SURVEYOR: "licensed_surveyor",
  CSAU_OFFICER: "csau",
  SMD_EXAMINER: "smd_examination",
  SMD_REGIONAL: "smd_region",
  ADMIN: "chief_examiner",
  CLIENT: "licensed_surveyor",
};

export const usersApi = {
  list: async (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return localRequest<{ users: UserRow[]; total: number }>(`/users${qs}`);
  },

  invite: async (payload: {
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  }) => {
    const backendRole =
      FRONTEND_TO_BACKEND_ROLE[payload.role] ?? "licensed_surveyor";
    const created = await backendRequest<BackendUser>(
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
        id: String(created.id),
        name: `${created.first_name} ${created.last_name}`.trim(),
        email: created.email,
        role: payload.role,
        isActive: true,
        lastLogin: "—",
        createdAt: created.profile?.created_at ?? new Date().toISOString(),
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

      for (const j of items) {
        if (j.status === "delivered_to_client") {
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
      }

      return { total, inProgress, completed, queried, byStep };
    } catch {
      return {
        total: 0,
        inProgress: 0,
        completed: 0,
        queried: 0,
        byStep: {},
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
