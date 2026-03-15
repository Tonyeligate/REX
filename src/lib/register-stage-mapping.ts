import type { RegisterStageKey } from "@/types/register";

export const REGISTER_STAGE_COLS: Array<{
  key: RegisterStageKey;
  label: string;
  subLabel: string;
}> = [
  { key: "jobProductionLsCertification", label: "Job Production /", subLabel: "L/S Certification" },
  { key: "examinationReceived", label: "CSAU", subLabel: "Received" },
  { key: "examinationChecking", label: "Examination", subLabel: "Checking" },
  { key: "examinationCertified", label: "Examination", subLabel: "Cert." },
  { key: "regionChecked", label: "Region", subLabel: "Checked" },
  { key: "regionApproved", label: "Region", subLabel: "Approved" },
  { key: "regionBatched", label: "Region", subLabel: "Barcode" },
];

export const REGISTER_STAGE_LABELS: Record<RegisterStageKey, string> = {
  jobProductionLsCertification: "Job Production / L/S Certification",
  examinationReceived: "CSAU Received",
  examinationChecking: "Examination Checking",
  examinationCertified: "Examination Certification",
  regionChecked: "Region Checked",
  regionApproved: "Region Approved",
  regionBatched: "Region Barcode",
};

export const BACKEND_REGISTER_STEP_CODE_MAP: Record<RegisterStageKey, string> = {
  jobProductionLsCertification: "4_ls_cert",
  examinationReceived: "5_csau_payment",
  examinationChecking: "6_1_checking",
  examinationCertified: "6_2_certified",
  regionChecked: "7_1_checked",
  regionApproved: "7_2_approved",
  regionBatched: "7_3_barcoded",
};

export const REGISTER_STAGE_KEYS = REGISTER_STAGE_COLS.map((col) => col.key) as RegisterStageKey[];

export const CLIENT_STAGE_MATCH_META: Record<
  number,
  {
    adminSurface: "Admin Workflow" | "Admin Register";
    adminLabel: string;
    backendCodes: string[];
  }
> = {
  1: { adminSurface: "Admin Workflow", adminLabel: "Job Request Received", backendCodes: ["request_received", "1_rnr"] },
  2: { adminSurface: "Admin Workflow", adminLabel: "RN Assigned / Sent to Client", backendCodes: ["rn_assigned", "2_regional_number"] },
  3: { adminSurface: "Admin Workflow", adminLabel: "Job Plan / Production", backendCodes: ["in_production", "3_job_production"] },
  4: { adminSurface: "Admin Workflow", adminLabel: "Submitted to L/S 461", backendCodes: ["submitted_to_ls461"] },
  5: { adminSurface: "Admin Workflow", adminLabel: "Examination (L/S 461)", backendCodes: ["examination_ls461", "queried_ls461"] },
  6: { adminSurface: "Admin Register", adminLabel: "Job Production / L/S Certification", backendCodes: ["4_ls_cert"] },
  7: { adminSurface: "Admin Register", adminLabel: "CSAU Received", backendCodes: ["5_csau_payment"] },
  8: { adminSurface: "Admin Workflow", adminLabel: "Forwarded to SMD", backendCodes: ["forwarded_to_smd"] },
  9: { adminSurface: "Admin Register", adminLabel: "Examination Checking", backendCodes: ["6_1_checking", "6_examination"] },
  10: { adminSurface: "Admin Register", adminLabel: "Examination Certification", backendCodes: ["6_2_certified"] },
  11: { adminSurface: "Admin Workflow", adminLabel: "Batched for Region", backendCodes: ["batched_for_region"] },
  12: { adminSurface: "Admin Register", adminLabel: "Region Checked", backendCodes: ["7_1_checked", "7_region"] },
  13: { adminSurface: "Admin Register", adminLabel: "Region Approved", backendCodes: ["7_2_approved"] },
  14: { adminSurface: "Admin Register", adminLabel: "Region Barcode", backendCodes: ["7_3_barcoded"] },
};
