import { apiBaseFromReadBase } from "./domain";

export class WorkbenchError extends Error {
  constructor(public status: number, public uncertain = false) {
    super(status === 401 ? "会话已失效，请重新登录。" : status === 403 ? "当前身份没有此操作权限。" : status === 404 ? "对象不在当前范围内或尚未创建。" : status === 409 ? "状态已变化或需要对账。请刷新并核实，不要重复执行。" : status === 413 ? "图片超过 8 MiB 限制。" : status === 415 ? "图片格式或内容不受支持。" : status === 429 ? "当前容量已满，请稍后查看状态。" : status === 400 ? "输入不符合契约，请检查字段、版本与图片。" : uncertain ? "未收到确定结果。请刷新查看已提交状态，不要重新执行。" : "后端读取失败，请稍后重试。");
  }
}
export interface WorkbenchClient { get<T>(path: string, signal?: AbortSignal): Promise<T>; post<T>(path: string, body: unknown): Promise<T>; media(path: string, signal: AbortSignal): Promise<Blob> }
// One scheduler per loaded application module, shared across client replacement
// and origins. Only admission is shared: each job owns its read closure, token,
// callback and result. A cancelled active job still occupies this same slot.
type MediaJob = { read: () => Promise<Blob>; signal: AbortSignal;
  resolve: (blob: Blob) => void; reject: (error: unknown) => void; onAbort: () => void };
const mediaQueue: MediaJob[] = []; let mediaActive = false;
const abortError = () => new DOMException("媒体读取已取消。", "AbortError");
function drainMedia() {
  if (mediaActive) return;
  const job = mediaQueue.shift(); if (!job) return;
  job.signal.removeEventListener("abort", job.onAbort);
  if (job.signal.aborted) { job.reject(abortError()); drainMedia(); return; }
  mediaActive = true;
  void job.read().then(
    blob => job.signal.aborted ? job.reject(abortError()) : job.resolve(blob),
    error => job.reject(job.signal.aborted ? abortError() : error)
  ).finally(() => { mediaActive = false; drainMedia(); });
}
export function createWorkbenchClient(readBase: string | undefined, origin: string, token: string | null, writeAllowed: boolean, fetcher: typeof fetch = fetch, onUnauthorized: () => void = () => undefined): WorkbenchClient {
  const base = apiBaseFromReadBase(readBase, origin);
  const headers = () => {
    if (!token?.trim()) throw new WorkbenchError(401);
    return { Authorization: `Bearer ${token}` };
  };
  function url(path: string) {
    if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")
      || path.includes("#") || /[\u0000-\u0020\u007f]/.test(path)) throw new WorkbenchError(400);
    // Query values are opaque (including encoded cursors containing '..').
    // Only path segments participate in traversal checks; never decode or
    // reserialize the query that will be sent to Core.
    const pathname = path.split("?", 1)[0];
    for (const segment of pathname.split("/")) {
      let decoded: string;
      try { decoded = decodeURIComponent(segment); } catch { throw new WorkbenchError(400); }
      if (decoded === "." || decoded === ".." || /[\\/?#%\u0000-\u0020\u007f]/.test(decoded)) throw new WorkbenchError(400);
    }
    const target = `${base}${path}`;
    const parsed = new URL(target);
    if (parsed.origin !== new URL(base).origin || !parsed.pathname.startsWith("/api/v1/")) throw new WorkbenchError(400);
    return target;
  }
  async function request<T>(path: string, method: "GET" | "POST", body?: unknown, signal?: AbortSignal): Promise<T> {
    if (method === "POST" && !writeAllowed) throw new WorkbenchError(403);
    const requestHeaders = headers();
    const target = url(path);
    const multipart = typeof FormData !== "undefined" && body instanceof FormData;
    const controller = method === "POST" ? new AbortController() : null;
    const expiresAt = Date.now() + 30000;
    const checkDeadline = () => { if (controller && (controller.signal.aborted || Date.now() >= expiresAt)) throw new WorkbenchError(0, true); };
    const consume = async () => {
      let response: Response;
      try {
        response = await fetcher(target, { method, headers: { ...requestHeaders, ...(method === "POST" && !multipart ? { "Content-Type": "application/json" } : {}) }, ...(method === "POST" ? { body: multipart ? body as FormData : JSON.stringify(body) } : {}), signal: controller?.signal ?? signal, cache: "no-store", redirect: "error", credentials: "omit" });
      } catch (error) {
        if (!controller && signal?.aborted) throw error;
        throw new WorkbenchError(0, method === "POST");
      }
      checkDeadline();
      if (response.status === 401) onUnauthorized();
      if (!response.ok) throw new WorkbenchError(response.status, method === "POST" && response.status >= 500);
      let envelope: unknown;
      try { envelope = await response.json(); } catch { throw new WorkbenchError(0, method === "POST"); }
      checkDeadline();
      if (!envelope || typeof envelope !== "object" || !("data" in envelope)) throw new WorkbenchError(0, method === "POST");
      return (envelope as {data: T}).data;
    };
    if (!controller) return consume();
    // Expiry bounds the caller's wait, not Core execution. Even after 201 headers,
    // an incomplete body is UNKNOWN and must never cause an automatic retry.
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new WorkbenchError(0, true)); }, 30000); });
    try { return await Promise.race([consume(), timeout]); }
    finally { clearTimeout(timer!); }
  }
  async function readMedia(target: string, requestHeaders: HeadersInit): Promise<Blob> {
    const controller = new AbortController();
    const timeoutError = new DOMException("媒体读取超时，请刷新后核对。", "TimeoutError");
    let reader: ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>> | undefined;
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => {
      controller.abort(); void reader?.cancel().catch(() => undefined); reject(timeoutError);
    }, 30000); });
    const consume = async () => {
      const response = await fetcher(target, { headers: requestHeaders, signal: controller.signal, cache: "no-store", redirect: "error", credentials: "omit" });
      if (controller.signal.aborted) throw timeoutError;
      if (response.status === 401) onUnauthorized();
      if (!response.ok) { await response.body?.cancel(); throw new WorkbenchError(response.status); }
      if (!["image/png", "image/jpeg"].includes(response.headers.get("content-type")?.split(";")[0] ?? "")) { await response.body?.cancel(); throw new Error("媒体响应格式不受支持。"); }
      reader = response.body?.getReader();
      if (!reader) throw new Error("媒体响应为空。");
      const chunks: Uint8Array<ArrayBuffer>[] = []; let size = 0;
      try { while (true) { const {done,value} = await reader.read(); if (done) break; size += value.byteLength; if (size > 8388608) throw new Error("媒体响应超过大小限制。"); chunks.push(new Uint8Array(value)); } }
      catch (error) { await reader.cancel(); throw error; }
      finally { reader.releaseLock(); }
      if (controller.signal.aborted) throw timeoutError;
      if (!size) throw new Error("媒体响应为空。");
      return new Blob(chunks, { type: response.headers.get("content-type")!.split(";")[0] });
    };
    try { return await Promise.race([consume(), timeout]); }
    finally { clearTimeout(timer!); }
  }
  return {
    get: <T>(path: string, signal?: AbortSignal) => request<T>(path, "GET", undefined, signal),
    post: <T>(path: string, body: unknown) => request<T>(path, "POST", body),
    async media(path, signal) {
      if (signal.aborted) return Promise.reject(abortError());
      const target = url(path), requestHeaders = headers();
      if (mediaActive && mediaQueue.length >= 4) return Promise.reject(new WorkbenchError(429));
      return new Promise<Blob>((resolve, reject) => {
        const job: MediaJob = { read: () => readMedia(target, requestHeaders), signal, resolve, reject, onAbort: () => {
          const index = mediaQueue.indexOf(job);
          if (index >= 0) { mediaQueue.splice(index, 1); signal.removeEventListener("abort", job.onAbort); reject(abortError()); }
        } };
        signal.addEventListener("abort", job.onAbort, { once: true });
        mediaQueue.push(job); drainMedia();
      });
    }
  };
}
