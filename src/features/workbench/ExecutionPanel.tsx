import { useEffect, useRef, useState } from "react";
import type { WorkbenchClient } from "./client";
import { createIntentKey, formatCredits } from "./domain";
import type { BudgetEntry, ExecutionEvent, Grant, LocalControl, LocalRecipe, Operation, Page, RunAction } from "./types";
import { Field, Id, Panel } from "./parts";

function dateInput(value: Date) { return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
type StopConfirmation = { client: WorkbenchClient; prefix: string; unitId: string; operationId: string; attemptId: string; attemptRevision: number; attemptFence: number; poolEpoch: number; poolAttemptId?: string; poolProjectId?: string };
export function ExecutionPanel({client, prefix, unitId, recipeId, localRecipes, grants, operations, disabled, controlDisabled, controlUncertain, run, runControl, refresh}: {client: WorkbenchClient; prefix: string; unitId: string; recipeId: string; localRecipes: LocalRecipe[]; grants: Grant[]; operations: Operation[]; disabled: boolean; controlDisabled: boolean; controlUncertain: boolean; run: RunAction; runControl: RunAction; refresh: number}) {
  const [controlPending, setControlPending] = useState(false);
  const [planId, setPlanId] = useState(""); const [grantId, setGrantId] = useState(""); const [operationId, setOperationId] = useState("");
  const [grant, setGrant] = useState<Grant | null>(null); const [operation, setOperation] = useState<Operation | null>(null); const [control, setControl] = useState<LocalControl | null>(null);
  const historyEpoch = useRef(0);
  const historyRequests = useRef<{ entries?: object; events?: object }>({});
  const [readError, setReadError] = useState(""); const [tick, setTick] = useState(0);
  const [startsAt, setStartsAt] = useState(() => dateInput(new Date())); const [expiresAt, setExpiresAt] = useState(() => dateInput(new Date(Date.now() + 3600000)));
  const [maxAttempts, setMaxAttempts] = useState(3); const [maxAttemptCredits, setMaxAttemptCredits] = useState(1); const [maxTotalCredits, setMaxTotalCredits] = useState(3); const [wallClock, setWallClock] = useState(30000); const [reservation, setReservation] = useState(1);
  const [reason, setReason] = useState(""); const [controlMode, setControlMode] = useState("PAUSED");
  const [reconcileId, setReconcileId] = useState(""); const [outcome, setOutcome] = useState("confirmed_not_created"); const [taskRef, setTaskRef] = useState(""); const [actualCredits, setActualCredits] = useState(0); const [stopConfirmation, setStopConfirmation] = useState<StopConfirmation | null>(null);
  const [entries, setEntries] = useState<Page<BudgetEntry> | null>(null); const [events, setEvents] = useState<Page<ExecutionEvent> | null>(null);
  const [historyError, setHistoryError] = useState("");
  const [detailsReadKey, setDetailsReadKey] = useState("");
  const detailsKey = [prefix, grantId, operationId, refresh, tick].join("|");
  const detailDisabled = disabled || detailsReadKey !== detailsKey || Boolean(readError);
  const startControlBlocked = controlUncertain || detailsReadKey !== detailsKey || Boolean(readError);
  useEffect(() => {
    const abort = new AbortController(); setReadError(""); setGrant(null); setOperation(null);
    void Promise.all([
      grantId ? client.get<Grant>(`${prefix}/execution-grants/${grantId}/ledger`, abort.signal) : Promise.resolve(null),
      operationId ? client.get<Operation>(`${prefix}/execution-operations/${operationId}`, abort.signal) : Promise.resolve(null),
      client.get<LocalControl>(`${prefix}/local-worker/control`, abort.signal)
    ]).then(([nextGrant, nextOperation, nextControl]) => { if (!abort.signal.aborted) { setGrant(nextGrant); setOperation(nextOperation); setControl(nextControl); setDetailsReadKey(detailsKey); } }).catch(error => { if (!abort.signal.aborted) setReadError(error.message); });
    return () => abort.abort();
  }, [client, prefix, grantId, operationId, refresh, tick, detailsKey]);
  useEffect(() => { historyEpoch.current += 1; setOperation(null); setGrant(null); setEntries(null); setEvents(null); setHistoryError(""); setReconcileId(""); setTaskRef(""); setStopConfirmation(null); }, [grantId, operationId]);
  useEffect(() => {
    const timer = window.setInterval(() => { if (!document.hidden && (operation?.attempts?.some(attempt => !attempt.settledAt) || control?.pool.busy)) setTick(value => value + 1); }, 4000);
    return () => window.clearInterval(timer);
  }, [operation, control]);
  const currentPlan = localRecipes.find(item => item.id === planId);
  const effectiveRecipeId = planId ? currentPlan?.recipeId ?? "" : recipeId;
  const selectedAttempt = operation?.attempts?.find(item => item.id === reconcileId);
  const isLocal = selectedAttempt?.capabilityId === "local.image.resize.v1";
  const poolEpoch = control?.pool.poolEpoch;
  const stopContext: StopConfirmation | null = isLocal && selectedAttempt && operation && typeof poolEpoch === "number" && Number.isSafeInteger(poolEpoch) && poolEpoch >= 0
    ? {client, prefix, unitId, operationId: operation.id, attemptId: selectedAttempt.id, attemptRevision: selectedAttempt.revision, attemptFence: selectedAttempt.fence, poolEpoch, poolAttemptId: control?.pool.attemptId, poolProjectId: control?.pool.projectId} : null;
  const confirmedStopped = !detailDisabled && Boolean(stopConfirmation && stopContext && (Object.keys(stopContext) as Array<keyof StopConfirmation>).every(key => stopConfirmation[key] === stopContext[key]));
  const requiresTaskRef = ["attach_known_task", "confirmed_succeeded", "confirmed_failed"].includes(outcome);
  const requestHistory = async (kind: "entries" | "events", more: boolean) => {
    if (more && historyRequests.current[kind]) return;
    const request = {}; historyRequests.current[kind] = request;
    setHistoryError(""); const epoch = historyEpoch.current; const prior = kind === "entries" ? entries : events;
    const path = kind === "entries" ? `${prefix}/execution-grants/${grantId}/budget-entries` : `${prefix}/execution-operations/${operationId}/events`;
    try { const next = await client.get<Page<BudgetEntry & ExecutionEvent>>(`${path}?limit=25${more && prior?.nextCursor ? `&cursor=${encodeURIComponent(prior.nextCursor)}` : ""}`); if (epoch !== historyEpoch.current || historyRequests.current[kind] !== request) return; const merged = {...next, items: more ? [...(prior?.items ?? []), ...next.items] : next.items}; if (kind === "entries") setEntries(merged as Page<BudgetEntry>); else setEvents(merged as Page<ExecutionEvent>); }
    catch (error) { if (epoch === historyEpoch.current && historyRequests.current[kind] === request) setHistoryError(error instanceof Error ? error.message : "历史读取失败。"); }
    finally { if (historyRequests.current[kind] === request) delete historyRequests.current[kind]; }
  };
  return <Panel title="执行授权、预算与本地 Worker">
    <p>每次执行须先明确授权、创建操作并预留预算。关闭页面或请求超时不代表 Worker 已停止。</p>
    <details><summary>创建执行授权</summary><form onSubmit={event => { event.preventDefault(); if (!effectiveRecipeId) return; void run("创建执行授权", async () => { const result = await client.post<Grant>(`${prefix}/production-units/${unitId}/execution-grants`, {recipeId: effectiveRecipeId, ...(currentPlan ? {localMediaRecipeId: currentPlan.id} : {}), startsAt: new Date(startsAt).toISOString(), expiresAt: new Date(expiresAt).toISOString(), maxAttempts, maxAttemptCredits, maxTotalCredits, maxConcurrentAttempts: 1, maxWallClockMs: wallClock, maxAdapterCallsPerAttempt: currentPlan ? 1 : 3}); setGrantId(result.id); }); }}><fieldset disabled={disabled}>
      <Field label="执行能力"><select value={planId} onChange={event => { setPlanId(event.target.value); if (event.target.value) { setMaxAttemptCredits(1); setWallClock(current => Math.min(current, 30000)); } }}><option value="">synthetic.execute · 纯合成验证</option>{localRecipes.map(plan => <option value={plan.id} key={plan.id}>local.image.resize.v1 · {plan.width}×{plan.height} · {plan.id.slice(0, 8)}</option>)}</select></Field>
      {planId && !currentPlan && <p role="status">所选本地配方不在当前已加载记录中，请加载对应记录或重新选择执行能力。</p>}
      <p>精确 Recipe <Id value={effectiveRecipeId} />{currentPlan && <> · 输入快照 <Id value={currentPlan.inputSnapshotDigest} /></>}</p>
      <div className="wb-row"><Field label="授权开始时间"><input required type="datetime-local" value={startsAt} onChange={event => setStartsAt(event.target.value)} /></Field><Field label="授权结束时间"><input required type="datetime-local" value={expiresAt} min={startsAt} onChange={event => setExpiresAt(event.target.value)} /></Field></div>
      <div className="wb-row"><Field label="最大尝试次数"><input type="number" required min={1} max={100} value={maxAttempts} onChange={event => setMaxAttempts(Number(event.target.value))} /></Field><Field label="单次预算上限"><input type="number" required min={1} max={currentPlan ? 1 : 1000000000} value={maxAttemptCredits} onChange={event => setMaxAttemptCredits(Number(event.target.value))} /></Field><Field label="总预算上限"><input type="number" required min={1} max={1000000000} value={maxTotalCredits} onChange={event => setMaxTotalCredits(Number(event.target.value))} /></Field><Field label="执行时限 ms"><input type="number" required min={1} max={currentPlan ? 30000 : 86400000} value={wallClock} onChange={event => setWallClock(Number(event.target.value))} /></Field></div>
      <p>并发上限 1；每次最多 {currentPlan ? 1 : 3} 次适配器调用。计量单位：{currentPlan ? "local_compute_unit" : "synthetic_credit"}，不是货币。</p><button type="submit" disabled={!effectiveRecipeId}>明确创建授权</button>
    </fieldset></form></details>
    <div className="wb-row"><Field label="执行授权"><select value={grantId} onChange={event => { setGrantId(event.target.value); setOperationId(""); }}><option value="">选择授权</option>{grants.map(item => <option value={item.id} key={item.id}>{item.capabilityId} · {item.id.slice(0, 8)}{item.revokedAt ? " · 已撤销" : ""}</option>)}</select></Field>
    <Field label="执行操作"><select value={operationId} onChange={event => { setOperationId(event.target.value); const selected = operations.find(item => item.id === event.target.value); if (selected) setGrantId(selected.grantId); }}><option value="">选择操作</option>{operations.map(item => <option value={item.id} key={item.id}>{item.effectiveState ?? item.state} · {item.id.slice(0, 8)}</option>)}</select></Field></div>
    {readError && <p role="alert">{readError}</p>}
    {grant && <div className="wb-budget"><h3>授权预算 · {grant.costUnit}</h3><p>总额 {formatCredits(grant.maxTotalCredits)} · 已预留 {formatCredits(grant.reservedCredits)} · 已消耗 {formatCredits(grant.consumedCredits)}</p><p>到期 {grant.expiresAt} · {grant.revokedAt ? "已撤销" : "未撤销"}</p><button disabled={detailDisabled || Boolean(grant.revokedAt)} onClick={() => void run("创建执行操作", async () => { const result = await client.post<Operation>(`${prefix}/execution-operations`, {grantId: grant.id, requestKey: createIntentKey()}); setOperationId(result.id); })}>创建操作</button><button onClick={() => void requestHistory("entries", false)}>读取预算流水</button></div>}
    {operation && <div className="wb-operation"><h3>{operation.effectiveState ?? operation.state}</h3><Id value={operation.id} />{(operation.effectiveQuarantined || operation.reconciliationDue) && <p role="alert">需要对账，新的执行受到隔离限制。不要重新提交已有任务。</p>}
      <form onSubmit={event => { event.preventDefault(); void run("预留执行预算", async () => { await client.post(`${prefix}/execution-operations/${operation.id}/attempts`, {reservationCredits: reservation, requestKey: createIntentKey()}); }); }}><fieldset disabled={detailDisabled || operation.effectiveQuarantined}><Field label="本次预留预算"><input type="number" required min={1} max={1000000000} value={reservation} onChange={event => setReservation(Number(event.target.value))} /></Field><button type="submit">分配一次尝试</button></fieldset></form>
      {operation.attempts?.map(attempt => <article key={attempt.id} className="wb-attempt"><h4>尝试 {attempt.sequence} · {attempt.submissionState} / {attempt.executionState}</h4><Id value={attempt.id} /><p>修订 {attempt.revision} · fence {attempt.fence} · 预留 {formatCredits(attempt.reservationCredits)} · 实际 {formatCredits(attempt.actualCredits)} · {attempt.settledAt ? "已结算" : "未结算"}</p>
        <button disabled={detailDisabled || !["synthetic.execute", "local.image.resize.v1"].includes(attempt.capabilityId) || Boolean(attempt.settledAt) || (attempt.capabilityId !== "synthetic.execute" && (control?.mode !== "RUNNING" || control.pool.busy))} onClick={() => void run(attempt.capabilityId === "synthetic.execute" ? "运行合成验证" : "运行本地图片变换", async () => { await client.post(`${prefix}/execution-attempts/${attempt.id}/${attempt.capabilityId === "synthetic.execute" ? "simulate" : "run-local"}`, {}); })}>{attempt.capabilityId === "synthetic.execute" ? "合成执行 / 已知任务查询" : "明确运行本地 Worker"}</button>
        {!attempt.settledAt && <button disabled={detailDisabled} onClick={() => void run("恢复执行记录", async () => { await client.post(`${prefix}/execution-attempts/${attempt.id}/recover`, {}); })}>核对过期状态</button>}
      </article>)}<button onClick={() => void requestHistory("events", false)}>读取执行事件</button>
    </div>}
    <div className="wb-history">{entries && <><h3>预算流水 · 已加载 {entries.items.length} / {entries.total}</h3>{entries.items.map(item => <p key={item.id}>{item.phase} · 预留 {formatCredits(item.reservationCredits)} · 消耗 {formatCredits(item.consumedCredits)} · 释放 {formatCredits(item.releasedCredits)} · <Id value={item.id} /></p>)}{entries.hasMore && <button onClick={() => void requestHistory("entries", true)}>加载更多预算流水</button>}</>}{events && <><h3>执行事件 · 已加载 {events.items.length} / {events.total}</h3>{events.items.map(item => <p key={item.id}>{item.eventType ?? item.kind} · {item.outcome ?? ""} · <Id value={item.id} /></p>)}{events.hasMore && <button onClick={() => void requestHistory("events", true)}>加载更多执行事件</button>}</>}{historyError && <p role="alert">{historyError}</p>}</div>
    {control && <div className="wb-control"><h3>本地 Worker 控制</h3><p>模式 {control.mode} · 修订 {control.revision} · 容量 {control.pool.busy ? "占用" : "空闲"} · {control.pool.phase}{control.pool.stopRequested ? " · 已请求停止，等待停止证据" : ""}</p><p>暂停和排空发出停止请求；只有真实停止后才能释放容量。手动运行不代表系统感知用户活动。</p>
      <form onSubmit={event => { event.preventDefault(); if (controlDisabled || controlPending || (controlMode === "RUNNING" && startControlBlocked)) return; setControlPending(true); void runControl("更改本地控制", async () => { await client.post(`${prefix}/local-worker/control`, {expectedRevision: control.revision, mode: controlMode, reason}); }, controlMode).finally(() => setControlPending(false)); }}><fieldset disabled={controlDisabled || controlPending}><Field label="控制模式"><select value={controlMode} onChange={event => setControlMode(event.target.value)}><option value="PAUSED">暂停</option><option value="DRAINING">排空并停止</option><option value="RUNNING">允许手动运行</option></select></Field><Field label="执行控制理由"><textarea required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} /></Field><button type="submit" disabled={startControlBlocked && controlMode === "RUNNING"}>提交控制变更</button></fieldset></form>
    </div>}
    <details><summary>撤销、放弃与 Owner 对账</summary><p>放弃不会消除未解决义务。Owner 声明是人工证明，不是独立 Provider 回执。</p><Field label="收敛操作理由"><textarea required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} /></Field>
      <div className="wb-row"><button disabled={detailDisabled || !grant || !reason.trim()} onClick={() => void run("撤销授权", async () => { await client.post(`${prefix}/execution-grants/${grantId}/revoke`, {reason}); })}>撤销所选授权</button><button disabled={detailDisabled || !operation || !reason.trim()} onClick={() => void run("放弃操作", async () => { await client.post(`${prefix}/execution-operations/${operationId}/abandon`, {reason}); })}>放弃所选操作</button></div>
      <Field label="待对账尝试"><select value={reconcileId} onChange={event => { setReconcileId(event.target.value); setTaskRef(""); setStopConfirmation(null); }}><option value="">选择尝试</option>{operation?.attempts?.filter(item => !item.settledAt).map(item => <option key={item.id} value={item.id}>尝试 {item.sequence} · {item.id.slice(0, 8)}</option>)}</select></Field>
      {selectedAttempt && <form onSubmit={event => { event.preventDefault(); if (detailDisabled || (isLocal && !confirmedStopped)) return; void run("Owner 执行对账", async () => { const eventKey = createIntentKey(); if (isLocal) { if (!confirmedStopped || !stopConfirmation) throw new Error("必须明确核实 Worker 已停止，并重新读取精确 pool epoch。"); await client.post(`${prefix}/execution-attempts/${selectedAttempt.id}/reconcile-local-stopped`, {poolEpoch: stopConfirmation.poolEpoch, expectedRevision: stopConfirmation.attemptRevision, eventKey, confirmWorkerStopped: true, reason}); } else { await client.post(`${prefix}/execution-operations/${operationId}/attempts/${selectedAttempt.id}/reconcile`, {eventKey, expectedRevision: selectedAttempt.revision, outcome, reason, ...(requiresTaskRef ? {taskRef} : {}), ...(["confirmed_succeeded", "confirmed_failed"].includes(outcome) ? {actualCredits} : {})}); } }); }}><fieldset disabled={detailDisabled}>
        {isLocal ? <label className="wb-check"><input type="checkbox" required checked={confirmedStopped} onChange={event => setStopConfirmation(event.target.checked && !detailDisabled ? stopContext : null)} />我已独立核实此 Worker 确实停止（租约过期不能证明停止）</label> : <><Field label="对账结果"><select value={outcome} onChange={event => setOutcome(event.target.value)}><option value="confirmed_not_created">确认未创建</option><option value="attach_known_task">关联已知合成任务</option><option value="confirmed_succeeded">确认成功</option><option value="confirmed_failed">确认失败</option><option value="abandon">放弃并保留义务</option></select></Field>{requiresTaskRef && <Field label="已核实的合成任务引用"><input required pattern="synthetic:[0-9a-f-]{36}" value={taskRef} onChange={event => setTaskRef(event.target.value)} /></Field>}{["confirmed_succeeded", "confirmed_failed"].includes(outcome) && <Field label="核实的实际消耗"><input required type="number" min={0} max={1000000000} value={actualCredits} onChange={event => setActualCredits(Number(event.target.value))} /></Field>}</>}
        <button disabled={!reason.trim() || (isLocal && !confirmedStopped)} type="submit">提交 Owner 对账声明</button>
      </fieldset></form>}
    </details>
  </Panel>;
}
