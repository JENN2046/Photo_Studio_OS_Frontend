import { resolveBackendRuntime } from "../../api/backendRuntime";
import type { Collections, SpecField, Reference } from "./types";

export const FIELD_KEYS = ["intent", "identity", "structure", "material", "color", "composition", "lighting", "styling", "scene", "camera", "textPolicy", "acceptanceCriteria"] as const;
export const PROVENANCES = ["human_explicit", "client_imported", "reference_derived", "agent_derived", "preset_default", "system_default"] as const;
export const REFERENCE_ROLES = ["product_truth", "identity", "body", "angle", "styling", "composition", "material", "lighting", "color", "brand", "storyboard"] as const;
export const SCORE_KEYS = ["subject_fidelity", "composition", "lighting", "material_realism", "commercial_fitness"] as const;
export const FAILURE_CODES = ["SUBJECT_DRIFT", "MATERIAL_PLASTICITY", "COMPOSITION_IMBALANCE", "DETAIL_OR_ANATOMY_ARTIFACT", "COMMERCIAL_UNFITNESS"] as const;
export const COLLECTION_NAMES = ["recipes", "evaluations", "scratchpads", "explorationAttempts", "candidates", "grants", "operations", "localMediaRecipes", "mediaResults"] as const;
export function isUuid(value: string): boolean { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }
export function apiBaseFromReadBase(value: string | undefined, pageOrigin: string): string {
  const runtime = resolveBackendRuntime(value);
  if (runtime.source === "mock") throw new Error("显式模拟模式不提供真实工作台读写。");
  const base = new URL(runtime.baseUrl, pageOrigin);
  if (!/^https?:$/.test(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error("后端地址格式无效。");
  if (!/^\/api\/v2\/read\/?$/.test(base.pathname)) throw new Error("后端读取地址须以 /api/v2/read 结尾。");
  return `${base.origin}/api/v1`;
}
export function canWrite(accessToken: string | null, source: string, role: string | null): boolean {
  return Boolean(accessToken?.trim()) && source === "backend" && role === "admin";
}
export function mergeCollections(previous: Collections, next: Collections, append = false): Collections {
  const merged = { ...previous };
  for (const [key, page] of Object.entries(next)) {
    if (!COLLECTION_NAMES.includes(key as typeof COLLECTION_NAMES[number]) || !page || !Array.isArray(page.items) || page.items.length > 100 || !Number.isInteger(page.total) || page.total < 0 || !Number.isInteger(page.limit) || page.limit < 1 || page.limit > 100 || page.items.some(item => !item || !isUuid(item.id))) throw new Error("工作台集合响应无效。");
    const name = key as keyof Collections;
    const prior = append ? previous[name]?.items ?? [] : [];
    const items = [...new Map([...prior, ...page.items].map(item => [item.id, item])).values()];
    Object.assign(merged, { [name]: { ...page, items } });
  }
  return merged;
}
export function evaluationScores(values: Record<string, string>): Record<string, number> {
  return Object.fromEntries(SCORE_KEYS.map(key => {
    const value = Number(values[key]);
    if (!values[key]?.trim() || !Number.isInteger(value) || value < 0 || value > 5) throw new Error("五项评分须分别填写 0–5 的整数。");
    return [key, value];
  }));
}
export function validateImage(file: {size: number; type: string} | null): void {
  if (!file || file.size < 1 || file.size > 8388608 || !["image/png", "image/jpeg"].includes(file.type)) throw new Error("请选择不超过 8 MiB 的 PNG/JPEG 图片。");
}
export function formatCredits(value: unknown): string {
  const text = typeof value === "number" && Number.isSafeInteger(value) ? String(value) : value;
  return typeof text === "string" && /^-?\d+$/.test(text) ? BigInt(text).toString() : "未提供";
}
export function createIntentKey(): string { return `ui:${crypto.randomUUID()}`; }
export function referenceBody(references: Reference[]): Reference[] {
  return references.map(({ assetId, role, provenance, mutability }) => ({ assetId, role, provenance, mutability }));
}
export function validateFields(fields: Record<string, SpecField>): void {
  if (!Object.keys(fields).length) throw new Error("请至少填写一个创作字段。");
  for (const [key, field] of Object.entries(fields)) {
    if (!FIELD_KEYS.includes(key as typeof FIELD_KEYS[number]) || !PROVENANCES.includes(field.provenance as typeof PROVENANCES[number])) throw new Error("创作字段或来源无效。");
    if (!["locked", "editable"].includes(field.mutability)) throw new Error("创作字段锁定状态无效。");
  }
  if (new TextEncoder().encode(JSON.stringify(fields)).length > 65536) throw new Error("创作内容超过大小限制。");
}

export function canControlWorker(writeAllowed: boolean, uncertain: boolean, mode: string): boolean {
  return writeAllowed && (["PAUSED", "DRAINING"].includes(mode) || (!uncertain && mode === "RUNNING"));
}
export async function completeCommand(action: () => Promise<void>, refresh: () => Promise<void>): Promise<{committed: boolean; error?: unknown}> {
  try { await action(); } catch (error) { return {committed: false, error}; }
  try { await refresh(); return {committed: true}; } catch (error) { return {committed: true, error}; }
}

export function createScopedWriteGate() {
  let scope: object | null = null, generation = 0, revision = 0;
  let recovery: "refresh_required" | "committed_refresh" | "unknown" | null = "refresh_required";
  let pending: { scope: object; label: string } | null = null;
  return {
    activate(next: object) { if (scope !== next) { scope = next; generation += 1; revision += 1; pending = null; recovery = "refresh_required"; } },
    capture() { return scope!; },
    isCurrent(value: object) { return scope === value; },
    snapshot() { return { generation, pending: pending?.label ?? "", recovery }; },
    begin(value: object, label: string) { if (scope !== value || pending || recovery) return null; pending = { scope: value, label }; return pending; },
    committed(ticket: { scope: object; label: string }) { if (scope === ticket.scope && pending === ticket) { recovery = "committed_refresh"; revision += 1; } },
    unknown(value: object) { if (scope === value) { recovery = "unknown"; revision += 1; } },
    requireRefresh(value: object) { if (scope === value) { if (!recovery) recovery = "refresh_required"; revision += 1; } },
    finish(ticket: { scope: object; label: string }) { if (scope !== ticket.scope || pending !== ticket) return false; pending = null; return true; },
    beginRead(value: object) { if (scope !== value) return null; if (!recovery) recovery = "refresh_required"; revision += 1; return { scope: value, revision }; },
    isReadCurrent(ticket: { scope: object; revision: number }) { return scope === ticket.scope && revision === ticket.revision; },
    acceptRead(ticket: { scope: object; revision: number }, confirmedUnknown = false) { if (scope !== ticket.scope || revision !== ticket.revision) return false; if (recovery === "unknown" && !confirmedUnknown) return false; recovery = null; return true; }
  };
}
