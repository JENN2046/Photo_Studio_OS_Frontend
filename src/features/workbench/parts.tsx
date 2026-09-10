import { cloneElement, isValidElement, useEffect, useId, useState, type ReactElement, type ReactNode } from "react";
import type { WorkbenchClient } from "./client";

export function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`panel wb-panel ${className}`}><h2>{title}</h2>{children}</section>;
}
export function Field({label, children}: {label: string; children: ReactNode}) { const labelId = useId(); return <label className="wb-field"><span id={labelId}>{label}</span>{isValidElement(children) ? cloneElement(children as ReactElement<{"aria-labelledby"?: string}>, {"aria-labelledby": labelId}) : children}</label>; }
export function Details({value, label = "记录详情"}: {value: unknown; label?: string}) {
  return <details className="wb-details"><summary>{label}</summary><pre>{JSON.stringify(value, null, 2)}</pre></details>;
}
export function Id({value}: {value?: string | null}) { return <code className="wb-id" title={value ?? ""}>{value || "未提供"}</code>; }
export function Media({client, path, sha, label, onVerified}: {client: WorkbenchClient; path: string; sha?: string; label: string; onVerified?: (sha: string) => void}) {
  const [state, setState] = useState<{url?: string; error?: string}>({});
  useEffect(() => {
    const abort = new AbortController(); let objectUrl: string | undefined;
    setState({});
    void client.media(path, abort.signal).then(async blob => {
      if (sha) {
        const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
        const actual = Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
        if (actual !== sha) throw new Error("媒体摘要与候选记录不一致。");
      }
      if (abort.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob); setState({url: objectUrl});
    }).catch(error => { if (!abort.signal.aborted) setState({error: error instanceof Error ? error.message : "媒体不可用。"}); });
    return () => { abort.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [client, path, sha]);
  return <figure className="wb-media">{state.url ? <img src={state.url} alt={label} onLoad={() => { if (sha) onVerified?.(sha); }} onError={() => setState({error: "当前浏览器无法解码媒体。"})} /> : <p role="status">{state.error ?? "正在读取已验证媒体…"}</p>}<figcaption>{label}</figcaption></figure>;
}
