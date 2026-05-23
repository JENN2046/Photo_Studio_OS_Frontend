export type Role =
  | "admin"
  | "operator"
  | "photographer"
  | "retoucher"
  | "qc_reviewer"
  | "client"
  | "delivery_approver";

export const roleLabels: Record<Role, string> = {
  admin: "管理员",
  operator: "运营",
  photographer: "摄影师",
  retoucher: "精修师",
  qc_reviewer: "质检员",
  client: "客户",
  delivery_approver: "交付审批"
};

export type SessionState =
  | "no-auth"
  | "loading"
  | "signed-in"
  | "expired"
  | "error"
  | "forbidden"
  | "insufficient-role";

export interface AuthState {
  session: SessionState;
  role: Role | null;
  message: string;
}

export type AppRoute =
  | "command-center"
  | "risk"
  | "projects"
  | "approvals"
  | "activity"
  | "inspections"
  | "asset-inbox"
  | "qc-retouch"
  | "review-gallery"
  | "delivery-readiness";

// `summary-only` is a frontend presentation rehearsal posture for partial
// visibility. It never stands in for server-side permission checks.
export type PageAccess = "full" | "read" | "summary-only" | "none";

const FULL: PageAccess = "full";
const READ: PageAccess = "read";
const SUMMARY: PageAccess = "summary-only";
const NONE: PageAccess = "none";

export const pageAccessLabels: Record<PageAccess, string> = {
  full: "完全",
  read: "只读",
  "summary-only": "摘要",
  none: "无权"
};

export const pageRoleMatrix: Record<AppRoute, Record<Role, PageAccess>> = {
  "command-center": {
    admin: FULL,
    operator: FULL,
    photographer: SUMMARY,
    retoucher: SUMMARY,
    qc_reviewer: SUMMARY,
    client: NONE,
    delivery_approver: SUMMARY
  },
  risk: {
    admin: FULL,
    operator: FULL,
    photographer: READ,
    retoucher: READ,
    qc_reviewer: READ,
    client: NONE,
    delivery_approver: READ
  },
  projects: {
    admin: FULL,
    operator: FULL,
    photographer: READ,
    retoucher: READ,
    qc_reviewer: READ,
    client: NONE,
    delivery_approver: READ
  },
  approvals: {
    admin: FULL,
    operator: FULL,
    photographer: NONE,
    retoucher: NONE,
    qc_reviewer: NONE,
    client: NONE,
    delivery_approver: READ
  },
  activity: {
    admin: FULL,
    operator: FULL,
    photographer: READ,
    retoucher: READ,
    qc_reviewer: READ,
    client: NONE,
    delivery_approver: READ
  },
  inspections: {
    admin: FULL,
    operator: FULL,
    photographer: NONE,
    retoucher: NONE,
    qc_reviewer: READ,
    client: NONE,
    delivery_approver: NONE
  },
  "asset-inbox": {
    admin: FULL,
    operator: FULL,
    photographer: FULL,
    retoucher: READ,
    qc_reviewer: READ,
    client: NONE,
    delivery_approver: NONE
  },
  "qc-retouch": {
    admin: FULL,
    operator: FULL,
    photographer: READ,
    retoucher: FULL,
    qc_reviewer: FULL,
    client: NONE,
    delivery_approver: NONE
  },
  "review-gallery": {
    admin: FULL,
    operator: FULL,
    photographer: NONE,
    retoucher: READ,
    qc_reviewer: READ,
    client: FULL,
    delivery_approver: READ
  },
  "delivery-readiness": {
    admin: FULL,
    operator: FULL,
    photographer: NONE,
    retoucher: NONE,
    qc_reviewer: NONE,
    client: NONE,
    delivery_approver: FULL
  }
};

export function getPageAccess(route: AppRoute, role: Role | null): PageAccess {
  if (!role) return NONE;
  return pageRoleMatrix[route]?.[role] ?? NONE;
}

export function getPageAccessLabel(access: PageAccess): string {
  return pageAccessLabels[access];
}

export function getRequiredRoleLabel(route: AppRoute): string {
  const roles = pageRoleMatrix[route];
  if (!roles) return "管理员";

  const allowed = (Object.entries(roles) as [Role, PageAccess][])
    .filter(([, access]) => access !== NONE)
    .map(([role]) => roleLabels[role]);

  return allowed.length > 0 ? allowed.join("、") : "管理员";
}
