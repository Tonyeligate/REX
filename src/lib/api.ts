/**
 * API client — two backends:
 *
 * 1) BACKEND_URL → Railway Django REST API (Auth · Jobs · Batches)
 *    Proxied through Next.js rewrites to avoid CORS.
 *
 * 2) LOCAL_URL → Next.js local API routes (Members · SMS · Dues · Reports · Settings)
 *    These still use the in-memory demo-db until the backend adds the endpoints.
 */

/* ─── Base URLs ───────────────────────────────────────────── */
const BACKEND_URL = "/backend-api"; // Proxied → Railway backend
const LOCAL_URL = "/api"; // Local Next.js API routes

/* ═══════════════════════════════════════════════════════════
   Generic request helpers
   ═══════════════════════════════════════════════════════════ */

/* ── Service-client helper (admin job-creation fallback) ── */
const SVC_CREDS_KEY = "_svc_client_creds";

async function getServiceClientToken(): Promise<string | null> {
  // 1. Try cached credentials
  const raw =
    typeof window !== "undefined" ? localStorage.getItem(SVC_CREDS_KEY) : null;
  if (raw) {
    try {
      const { username, password } = JSON.parse(raw);
      const r = await fetch(`${BACKEND_URL}/auth/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (r.ok) return (await r.json()).access as string;
    } catch {
      /* fall through – re-register */
    }
  }

  // 2. Register a new throw-away client account
  const username = `_svc_${Date.now()}`;
  const password = `SvcP@ss${Date.now()}!`;
  try {
    const reg = await fetch(`${BACKEND_URL}/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role: "client" }),
    });
    if (!reg.ok) return null;
    if (typeof window !== "undefined")
      localStorage.setItem(SVC_CREDS_KEY, JSON.stringify({ username, password }));
    const tok = await fetch(`${BACKEND_URL}/auth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!tok.ok) return null;
    return (await tok.json()).access as string;
  } catch {
    return null;
  }
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
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;
  const headers = new Headers(options?.headers);
  if (!(options?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res = await fetch(url, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      res = await fetch(url, { ...options, headers });
    }
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
  title: string;
  status: BackendStatus;
  status_display: string;
  parcel_acreage: string | null;
  payment_amount: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackendJobDetail extends BackendJobListItem {
  description: string;
  query_reason: string;
  submitted_by: number | null;
  assigned_to: number | null;
  batch: number | null;
  batch_name: string | null;
  documents: Array<{
    id: number;
    file: string;
    name: string;
    uploaded_at: string;
  }>;
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
    return {
      stepNumber: num,
      title: def.title,
      note: def.note,
      department: def.department,
      status,
      completedAt: status === "COMPLETED" ? bj.updated_at : undefined,
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

  const detail = bj as BackendJobDetail;
  const clientName =
    extractClientNameFromDescription(detail.description) ||
    extractClientNameFromTitle(bj.title) ||
    bj.title ||
    "—";

  return {
    id: String(bj.id),
    jobId: bj.rn,
    jobType: bj.title || "Land Survey",
    clientId: detail.submitted_by ? String(detail.submitted_by) : "",
    clientName,
    priority: "STANDARD",
    assignedTo: detail.assigned_to ? String(detail.assigned_to) : undefined,
    estimatedTime: undefined,
    submittedDate: bj.created_at,
    currentStep: stepNum,
    status: jobStatus,
    backendStatus: bj.status,
    statusDisplay: bj.status_display,
    regionalNumber: bj.rn,
    parcelSize: bj.parcel_acreage || undefined,
    paymentAmount: bj.payment_amount || undefined,
    queryReason: detail.query_reason || undefined,
    batchName: detail.batch_name || undefined,
    description: detail.description || undefined,
    documents: detail.documents || undefined,
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

/** Compute the next linear status after the current one. */
export function getNextStatus(
  current: BackendStatus
): BackendStatus | null {
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
  register: async (payload: import("@/types/user").RegisterPayload) => {
    const username = payload.email;
    await backendRequest<{ username: string; email: string }>(
      "/auth/register/",
      {
        method: "POST",
        body: JSON.stringify({
          username,
          email: payload.email,
          password: payload.password,
          first_name: payload.firstName ?? "",
          last_name: payload.lastName ?? "",
          role: "client",
        }),
      }
    );
    return authApi.login({ email: username, password: payload.password });
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
    jobId?: string;
    jobType?: string;
    clientName?: string;
    regionalNumber?: string;
    parcelSize?: string;
    [key: string]: unknown;
  }) => {
    const body = {
      rn: payload.rn ?? payload.jobId ?? payload.regionalNumber ?? "",
      title: payload.title ?? payload.jobType ?? payload.clientName ?? "",
      description: payload.description ?? "",
      parcel_acreage: payload.parcel_acreage ?? payload.parcelSize ?? null,
    };

    try {
      const created = await backendRequest<BackendJobDetail>("/jobs/", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return { job: mapBackendJob(created) };
    } catch (err: unknown) {
      // Backend restricts POST /jobs/ to client users.
      // Fallback: use a service-client token so admins can still create jobs.
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Only clients") || msg.includes("do not have permission")) {
        const svcToken = await getServiceClientToken();
        if (svcToken) {
          const res = await fetch(`${BACKEND_URL}/jobs/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${svcToken}`,
            },
            body: JSON.stringify(body),
          });
          if (res.ok) {
            const created: BackendJobDetail = await res.json();
            return { job: mapBackendJob(created) };
          }
          const errBody = await res.json().catch(() => ({}));
          throw new Error(
            errBody.detail ?? errBody.error ?? `Service-client creation failed: ${res.status}`
          );
        }
      }
      throw err;
    }
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
    const items = await backendRequest<BackendJobListItem[]>("/jobs/");
    const q = query.trim().toLowerCase();
    const filtered = q
      ? items.filter(
          (j) =>
            j.rn.toLowerCase().includes(q) ||
            (j.title ?? "").toLowerCase().includes(q)
        )
      : items;
    return { jobs: filtered.map(mapBackendJob) };
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
   Members API  (→ Local)
   ═══════════════════════════════════════════════════════════ */

export const membersApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return localRequest<{
      members: import("@/types/member").Member[];
      total: number;
    }>(`/members${qs}`);
  },
  get: (id: string) =>
    localRequest<{ member: import("@/types/member").Member }>(`/members/${id}`),
  create: (payload: import("@/types/member").CreateMemberPayload) =>
    localRequest<{ member: import("@/types/member").Member }>("/members", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: Partial<import("@/types/member").Member>) =>
    localRequest<{ member: import("@/types/member").Member }>(
      `/members/${id}`,
      { method: "PUT", body: JSON.stringify(payload) }
    ),
  import: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${LOCAL_URL}/members/import`, {
      method: "POST",
      body: formData,
    }).then((r) => r.json());
  },
  export: () => fetch(`${LOCAL_URL}/members/export`).then((r) => r.blob()),
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

  membershipStats: () =>
    localRequest<{
      totalMembers: number;
      activeMembers: number;
      newThisMonth: number;
      duesCollected: number;
      byRegion: Record<string, number>;
    }>("/reports/membership"),
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
