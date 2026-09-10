import { useEffect, useRef, useState } from "react";
import type { WorkbenchClient } from "./client";
import type { Candidate, RunAction, Promotion } from "./types";
import { createIntentKey } from "./domain";
import { Field, Id, Media, Panel } from "./parts";

export function CandidatePanel({client, prefix, candidates, selectedId, onSelect, disabled, run, refresh}: {client: WorkbenchClient; prefix: string; candidates: Candidate[]; selectedId: string; onSelect: (id: string) => void; disabled: boolean; run: RunAction; refresh: number}) {
  const [candidate, setCandidate] = useState<Candidate | null>(null); const [compareId, setCompareId] = useState("");
  const [readError, setReadError] = useState(""); const [verified, setVerified] = useState("");
  const [reason, setReason] = useState(""); const [decision, setDecision] = useState("approved"); const [promotionConfirmed, setPromotionConfirmed] = useState(false);
  const promotionKeys = useRef(new Map<string, string>());
  useEffect(() => {
    const abort = new AbortController(); setCandidate(null); setReadError(""); setVerified(""); setPromotionConfirmed(false);
    if (selectedId) void client.get<Candidate>(`${prefix}/candidates/${selectedId}`, abort.signal).then(value => { if (!abort.signal.aborted) setCandidate(value); }).catch(error => { if (!abort.signal.aborted) setReadError(error.message); });
    return () => abort.abort();
  }, [client, prefix, selectedId, refresh]);
  const compare = candidates.find(item => item.id === compareId);
  const review = candidate?.reviews?.[0];
  const canPromote = candidate?.status === "approved" && review?.decision === "approved" && review.candidateRevision === candidate.revision;
  return <Panel title="候选对比与晋升">
    <div className="wb-row"><Field label="当前候选"><select value={selectedId} onChange={event => onSelect(event.target.value)}><option value="">选择候选</option>{candidates.map(item => <option key={item.id} value={item.id}>{item.status} · {item.id.slice(0, 8)} · {item.width}×{item.height}</option>)}</select></Field>
    <Field label="对比候选"><select value={compareId} onChange={event => setCompareId(event.target.value)}><option value="">不对比</option>{candidates.filter(item => item.id !== selectedId).map(item => <option key={item.id} value={item.id}>{item.status} · {item.id.slice(0, 8)}</option>)}</select></Field></div>
    {readError && <p role="alert">{readError}</p>}
    {candidate && <><div className="wb-comparison"><Media key={`${candidate.id}:${refresh}`} client={client} path={`${prefix}/candidates/${candidate.id}/media`} sha={candidate.contentSha256} label={`当前候选 ${candidate.id.slice(0, 8)}`} onVerified={setVerified} />{compare && <Media client={client} path={`${prefix}/candidates/${compare.id}/media`} sha={compare.contentSha256} label={`对比候选 ${compare.id.slice(0, 8)}`} />}</div>
      <p>{candidate.status} · 修订 {candidate.revision} · {candidate.width}×{candidate.height} · {candidate.byteSize} bytes</p><p>内容摘要 <Id value={candidate.contentSha256} /></p>
      <p>晋升前为探索候选；人工审核只适用于当前显示的摘要和修订。</p>
      {!candidate.promotionReceipt && <form onSubmit={event => { event.preventDefault(); void run("审核候选", async () => { await client.post(`${prefix}/candidates/${candidate.id}/reviews`, {decision, expectedRevision: candidate.revision, reviewedContentSha256: candidate.contentSha256, reason}); setReason(""); }); }}><fieldset disabled={disabled || verified !== candidate.contentSha256 || candidate.status === "promoted"}>
        <Field label="审核决定"><select value={decision} onChange={event => setDecision(event.target.value)}><option value="approved">批准此内容</option><option value="rejected">拒绝此内容</option></select></Field><Field label="审核理由"><textarea required maxLength={2000} value={reason} onChange={event => setReason(event.target.value)} /></Field><button type="submit">提交人工审核</button>
      </fieldset></form>}
      {review && <p>最近决定：{review.decision} · 修订 {review.candidateRevision} · <Id value={review.id} /></p>}
      {canPromote && <div className="wb-promotion"><label className="wb-check"><input type="checkbox" checked={promotionConfirmed} disabled={disabled} onChange={event => setPromotionConfirmed(event.target.checked)} />将此已审核候选晋升为正式素材</label><button disabled={disabled || !promotionConfirmed || verified !== candidate.contentSha256} onClick={() => { const identity = `${candidate.id}:${candidate.revision}:${review.id}`; let key = promotionKeys.current.get(identity); if (!key) { key = createIntentKey(); promotionKeys.current.set(identity, key); } void run("晋升候选", async () => { await client.post<Promotion>(`${prefix}/candidates/${candidate.id}/promote`, {reviewDecisionId: review.id, expectedRevision: candidate.revision, idempotencyKey: key}); }); }}>明确晋升</button></div>}
      {candidate.promotionReceipt && <div className="wb-receipt"><h3>已提交晋升凭据</h3><p><Id value={candidate.promotionReceipt.id} /></p><p>正式素材 <Id value={candidate.promotionReceipt.assetId} /></p><p>历史凭据不代表当前文件仍可用；下方单独读取正式媒体。</p><Media client={client} path={`${prefix}/assets/${candidate.promotionReceipt.assetId}/media`} sha={candidate.contentSha256} label="正式素材" /></div>}
    </>}
  </Panel>;
}
