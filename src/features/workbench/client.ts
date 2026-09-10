import { apiBaseFromReadBase } from "./domain";

export class WorkbenchError extends Error {
  constructor(public status: number, public uncertain = false) {
    super(status === 401 ? "会话已失效，请重新登录。" : status === 403 ? "当前身份没有此操作权限。" : status === 404 ? "对象不在当前范围内或尚未创建。" : status === 409 ? "状态已变化或需要对账。请刷新并核实，不要重复执行。" : status === 413 ? "图片超过 8 MiB 限制。" : status === 415 ? "图片格式或内容不受支持。" : status === 429 ? "当前容量已满，请稍后查看状态。" : status === 400 ? "输入不符合契约，请检查字段、版本与图片。" : uncertain ? "未收到确定结果。请刷新查看已提交状态，不要重新执行。" : "后端读取失败，请稍后重试。");
  }
}
export interface WorkbenchClient { get<T>(path: string, signal?: AbortSignal): Promise<T>; post<T>(path: string, body: unknown): Promise<T>; media(path: string, signal: AbortSignal): Promise<Blob> }
export function createWorkbenchClient(readBase: string, origin: string, token: string | null, writeAllowed: boolean, fetcher: typeof fetch = fetch, onUnauthorized: () => void = () => undefined): WorkbenchClient {
  const base = apiBaseFromReadBase(readBase, origin);
  const headers = () => {
    if (!token?.trim()) throw new WorkbenchError(401);
    return { Authorization: `Bearer ${token}` };
  };
  function url(path: string) {
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("..") || path.includes("\\") || /[\r\n]/.test(path)) throw new Error("请求路径无效。");
    return `${base}${path}`;
  }
  async function request<T>(path: string, method: "GET" | "POST", body?: unknown, signal?: AbortSignal): Promise<T> {
    if (method === "POST" && !writeAllowed) throw new WorkbenchError(403);
    const requestHeaders = headers();
    const multipart = typeof FormData !== "undefined" && body instanceof FormData;
    let response: Response;
    try {
      response = await fetcher(url(path), { method, headers: { ...requestHeaders, ...(method === "POST" && !multipart ? { "Content-Type": "application/json" } : {}) }, ...(method === "POST" ? { body: multipart ? body as FormData : JSON.stringify(body) } : {}), signal, cache: "no-store", redirect: "error", credentials: "omit" });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new WorkbenchError(0, method === "POST");
    }
    if (response.status === 401) onUnauthorized();
    if (!response.ok) throw new WorkbenchError(response.status, method === "POST" && response.status >= 500);
    let envelope: unknown;
    try { envelope = await response.json(); } catch { throw new WorkbenchError(0, method === "POST"); }
    if (!envelope || typeof envelope !== "object" || !("data" in envelope)) throw new WorkbenchError(0, method === "POST");
    return (envelope as {data: T}).data;
  }
  return {
    get: <T>(path: string, signal?: AbortSignal) => request<T>(path, "GET", undefined, signal),
    post: <T>(path: string, body: unknown) => request<T>(path, "POST", body),
    async media(path, signal) {
      const response = await fetcher(url(path), { headers: headers(), signal, cache: "no-store", redirect: "error", credentials: "omit" });
      if (response.status === 401) onUnauthorized();
      if (!response.ok) throw new WorkbenchError(response.status);
      if (!["image/png", "image/jpeg"].includes(response.headers.get("content-type")?.split(";")[0] ?? "")) throw new Error("媒体响应格式不受支持。");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("媒体响应为空。");
      const chunks: Uint8Array<ArrayBuffer>[] = []; let size = 0;
      try { while (true) { const {done,value} = await reader.read(); if (done) break; size += value.byteLength; if (size > 8388608) throw new Error("媒体响应超过大小限制。"); chunks.push(new Uint8Array(value)); } }
      catch (error) { await reader.cancel(); throw error; }
      finally { reader.releaseLock(); }
      if (!size) throw new Error("媒体响应为空。");
      return new Blob(chunks, { type: response.headers.get("content-type")!.split(";")[0] });
    }
  };
}
