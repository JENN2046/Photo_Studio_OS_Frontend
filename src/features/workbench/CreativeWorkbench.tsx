import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import type { Role } from "../auth/authTypes";
import type { AuthRuntimeView } from "../auth/useAuthState";
import { WorkbenchError, createWorkbenchClient } from "./client";
import { canWrite, isUuid, mergeCollections, SCORE_KEYS, FAILURE_CODES, evaluationScores, validateImage, canControlWorker, completeCommand, createScopedWriteGate } from "./domain";
import type { Asset, Candidate, CollectionName, Collections, Deliverable, Evaluation, ExplorationAttempt, LocalRecipe, Page, Production, Project, Recipe, RunAction, Scratchpad, Sku, SpecVersion, Unit, WorkbenchSnapshot } from "./types";
import { Field, Id, Panel } from "./parts";
import { SpecEditor } from "./SpecEditor";
import { CandidatePanel } from "./CandidatePanel";
import { ExecutionPanel } from "./ExecutionPanel";
import "./workbench.css";

const collectionLabels: Record<CollectionName, string> = { recipes: "Recipe", evaluations: "评估", scratchpads: "探索空间", explorationAttempts: "探索尝试", candidates: "候选", grants: "执行授权", operations: "执行操作", localMediaRecipes: "本地变换配方", mediaResults: "媒体结果" };

export function CreativeWorkbench({accessToken, role, authRuntime, params}: {accessToken: string | null; role: Role | null; authRuntime: AuthRuntimeView; params: URLSearchParams}) {
  const [projectId, setProjectId] = useState(() => isUuid(params.get("projectId") ?? "") ? params.get("projectId")! : "");
  const [unitId, setUnitId] = useState(() => isUuid(params.get("unitId") ?? "") ? params.get("unitId")! : "");
  const [projects, setProjects] = useState<Project[]>([]); const [projectPage, setProjectPage] = useState(1); const [projectTotal, setProjectTotal] = useState(0);
  const [production, setProduction] = useState<Production | null>(null); const [assets, setAssets] = useState<Asset[]>([]); const [skus, setSkus] = useState<Sku[]>([]);
  const [collections, setCollections] = useState<Collections>({}); const [spec, setSpec] = useState<SpecVersion | null>(null);
  const [recipeId, setRecipeId] = useState(""); const [recipe, setRecipe] = useState<Recipe | null>(null); const [scratchpadId, setScratchpadId] = useState(""); const [attemptId, setAttemptId] = useState(""); const [candidateId, setCandidateId] = useState("");
  const [refresh, setRefresh] = useState(0); const [projectLoading, setProjectLoading] = useState(false); const [unitLoading, setUnitLoading] = useState(false); const loading = projectLoading || unitLoading; const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const controlLock = useRef<object | null>(null); const loadingRead = useRef<object | null>(null);
  const gate = useRef(createScopedWriteGate()); const [, renderGate] = useState(0);
  const identity = useMemo(() => ({}), [accessToken, role, authRuntime.source]); const identityRef = useRef(identity); identityRef.current = identity;
  const scope = useMemo(() => ({}), [identity, projectId, unitId]); gate.current.activate(scope);
  const {pending, recovery, generation} = gate.current.snapshot(); const uncertain = recovery === "unknown"; const stale = recovery !== null;
  const [sessionFailed, setSessionFailed] = useState(false); const pageReads = useRef(new Map<CollectionName, object>()); const collectionRead = useRef<{ scope: object; revision: number } | null>(null);
  const [deliverableId, setDeliverableId] = useState(""); const [name, setName] = useState(""); const [intent, setIntent] = useState(""); const [unitName, setUnitName] = useState(""); const [subjectKind, setSubjectKind] = useState("subject"); const [subject, setSubject] = useState("");
  const [scratchTitle, setScratchTitle] = useState(""); const [file, setFile] = useState<File | null>(null); const uploadRef = useRef<HTMLInputElement>(null);
  const [width, setWidth] = useState(1024); const [height, setHeight] = useState(1024);
  const [failures, setFailures] = useState<string[]>([]); const [corrections, setCorrections] = useState("");
  const [evaluationAsset, setEvaluationAsset] = useState(""); const [scores, setScores] = useState<Record<string, string>>(Object.fromEntries(SCORE_KEYS.map(key => [key, ""]))); const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const writeAllowed = canWrite(accessToken, authRuntime.source, role) && !sessionFailed;
  const clientState = useMemo(() => {
    try {
      const transport = createWorkbenchClient(import.meta.env.VITE_BACKEND_API_BASE_URL ?? "", window.location.origin, accessToken, writeAllowed, fetch, () => { if (identityRef.current === identity) setSessionFailed(true); });
      const post = async <T,>(path: string, body: unknown): Promise<T> => { const requestScope = gate.current.capture(); const result = await transport.post<T>(path, body); if (!gate.current.isCurrent(requestScope)) throw new Error("请求所属范围已切换，请在原范围核对记录。"); return result; };
      return {client: {...transport, post}, error: ""};
    }
    catch (error) { return {client: null, error: error instanceof Error ? error.message : "后端配置不可用。"}; }
  }, [accessToken, writeAllowed, identity]);
  const client = clientState.client;
  const prefix = `/projects/${projectId}`;
  const units = production?.deliverables.flatMap(item => item.productionUnits) ?? [];
  const unit = units.find(item => item.id === unitId);
  const busy = !writeAllowed || Boolean(pending) || stale || loading;
  const readFailure = useCallback((error: unknown) => { if (error instanceof WorkbenchError && error.status === 401) setSessionFailed(true); setError(error instanceof Error ? error.message : "读取失败。"); }, []);

  useEffect(() => { setSessionFailed(false); setProduction(null); setCollections({}); setProjects([]); setProjectPage(1); setSpec(null); setRecipe(null); setAssets([]); setSkus([]); }, [accessToken]);
  useEffect(() => {
    const abort = new AbortController(); if (!client || !accessToken || sessionFailed) return;
    void client.get<Page<Project>>(`/projects?page=${projectPage}&limit=50`, abort.signal).then(page => { if (abort.signal.aborted) return; setProjects(previous => projectPage === 1 ? page.items : [...new Map([...previous, ...page.items].map(item => [item.id, item])).values()]); setProjectTotal(page.total); }).catch(error => { if (!abort.signal.aborted) readFailure(error); });
    return () => abort.abort();
  }, [client, accessToken, projectPage, sessionFailed, readFailure]);
  useEffect(() => {
    setProduction(null); setCollections({}); setSpec(null); setRecipe(null); setRecipeId(""); setScratchpadId(""); setAttemptId(""); setCandidateId(""); setAssets([]); setSkus([]); setDeliverableId("");
  }, [client, projectId]);
  useEffect(() => {
    setCollections({}); setSpec(null); setRecipeId(""); setRecipe(null); setScratchpadId(""); setAttemptId(""); setCandidateId(""); setEvaluation(null);
  }, [client, projectId, unitId]);
  useEffect(() => {
    const abort = new AbortController(); setSpec(null);
    if (!client || !unit?.creativeSpec) return;
    void client.get<SpecVersion>(`${prefix}/creative-specs/${unit.creativeSpec.id}/versions/${unit.creativeSpec.currentVersion}`, abort.signal).then(value => { if (!abort.signal.aborted) setSpec(value); }).catch(error => { if (!abort.signal.aborted) readFailure(error); });
    return () => abort.abort();
  }, [client, prefix, unit?.creativeSpec?.id, unit?.creativeSpec?.currentVersion, readFailure]);
  useEffect(() => {
    const abort = new AbortController(); setRecipe(null);
    if (client && recipeId) void client.get<Recipe>(`${prefix}/workflow-recipes/${recipeId}`, abort.signal).then(value => { if (!abort.signal.aborted) setRecipe(value); }).catch(error => { if (!abort.signal.aborted) readFailure(error); });
    return () => abort.abort();
  }, [client, prefix, recipeId, readFailure]);
  useEffect(() => {
    const query = new URLSearchParams(); if (projectId) query.set("projectId", projectId); if (unitId) query.set("unitId", unitId);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#creative-workbench${query.size ? `?${query}` : ""}`);
  }, [projectId, unitId]);

  const reload = useCallback(async (confirmedUnknown = false, signal?: AbortSignal) => {
    if (!client || !projectId || !accessToken || signal?.aborted || !gate.current.isCurrent(scope)) return false;
    const readTicket = gate.current.beginRead(scope); if (!readTicket) return false;
    loadingRead.current = readTicket; renderGate(value => value + 1); setProjectLoading(true); setUnitLoading(Boolean(unitId)); pageReads.current.clear();
    try {
      const [fresh, snapshot, refreshedAssets, refreshedSkus] = await Promise.all([
        client.get<Production>(`${prefix}/production`, signal),
        unitId ? client.get<WorkbenchSnapshot>(`${prefix}/production-units/${unitId}/workbench`, signal) : Promise.resolve(null),
        client.get<Page<Asset>>(`${prefix}/assets?limit=100`, signal),
        client.get<Page<Sku>>(`${prefix}/skus?limit=100`, signal)
      ]);
      if (signal?.aborted || !gate.current.isReadCurrent(readTicket)) return false;
      if (fresh.projectId !== projectId || (snapshot && (snapshot.schemaVersion !== "creative_workbench.v1" || snapshot.projectId !== projectId || snapshot.productionUnitId !== unitId))) throw new Error("刷新响应范围不匹配。");
      const nextCollections = snapshot ? mergeCollections({}, snapshot.collections) : {};
      setProduction(fresh); setAssets(refreshedAssets.items); setSkus(refreshedSkus.items);
      collectionRead.current = readTicket; setCollections(nextCollections); setRefresh(value => value + 1);
      if (refreshedAssets.total > refreshedAssets.items.length || refreshedSkus.total > refreshedSkus.items.length) setNotice("参考素材 / SKU 当前显示前 100 项；其余记录尚未加载。");
      const unlocked = gate.current.acceptRead(readTicket, confirmedUnknown); renderGate(value => value + 1);
      if (unlocked) setError(""); return unlocked;
    } catch (error) {
      if (signal?.aborted || !gate.current.isReadCurrent(readTicket)) return false;
      throw error;
    } finally {
      if (loadingRead.current === readTicket) { loadingRead.current = null; setProjectLoading(false); setUnitLoading(false); }
    }
  }, [client, projectId, prefix, unitId, accessToken, scope]);
  useEffect(() => {
    const abort = new AbortController(); controlLock.current = null; loadingRead.current = null; pageReads.current.clear(); setNotice(""); setError(""); setProjectLoading(false); setUnitLoading(false);
    void reload(false, abort.signal).catch(error => { if (!abort.signal.aborted && gate.current.isCurrent(scope)) readFailure(error); });
    return () => abort.abort();
  }, [scope, reload, readFailure]);
  const run: RunAction = useCallback(async (label, action) => {
    if (!writeAllowed) return false; const ticket = gate.current.begin(scope, label); if (!ticket) return false;
    renderGate(value => value + 1); setError(""); setNotice("");
    try {
      const result = await completeCommand(async () => { await action(); gate.current.committed(ticket); if (gate.current.isCurrent(scope)) renderGate(value => value + 1); }, async () => { if (gate.current.isCurrent(scope)) { setNotice(`${label}已提交。`); await reload(); } });
      if (result.error !== undefined && gate.current.isCurrent(scope)) {
        if (result.error instanceof WorkbenchError && result.error.uncertain && !result.committed) gate.current.unknown(scope);
        else if (result.error instanceof WorkbenchError && result.error.status === 409) gate.current.requireRefresh(scope);
        readFailure(result.error);
        if (result.committed) setNotice(`${label}已提交，但刷新失败。普通写入保持锁定，请刷新查看结果。`);
      }
      return result.committed;
    } finally { if (gate.current.finish(ticket)) renderGate(value => value + 1); }
  }, [writeAllowed, scope, reload, readFailure]);
  const runControl: RunAction = useCallback(async (label, action, safeControlMode) => {
    if (!gate.current.isCurrent(scope) || !canControlWorker(writeAllowed, gate.current.snapshot().recovery !== null, safeControlMode ?? "") || controlLock.current) return false;
    const ticket = {}; controlLock.current = ticket;
    try { await action(); if (gate.current.isCurrent(scope)) { setNotice(`${label}已提交，等待 Worker 停止证据。`); setRefresh(value => value + 1); } return true; }
    catch (error) { if (gate.current.isCurrent(scope)) { if (error instanceof WorkbenchError && error.uncertain) gate.current.unknown(scope); else if (error instanceof WorkbenchError && error.status === 409) gate.current.requireRefresh(scope); readFailure(error); renderGate(value => value + 1); } return false; }
    finally { if (controlLock.current === ticket) controlLock.current = null; }
  }, [writeAllowed, scope, readFailure]);
  async function loadMore(name: CollectionName) {
    if (!client || pageReads.current.has(name)) return; const page = collections[name]; if (!page?.hasMore || !page.nextCursor) return;
    const readTicket = collectionRead.current; if (!readTicket || !gate.current.isReadCurrent(readTicket)) return;
    const request = {}; pageReads.current.set(name, request);
    try {
      const snapshot = await client.get<WorkbenchSnapshot>(`${prefix}/production-units/${unitId}/workbench?collection=${name}&limit=25&cursor=${encodeURIComponent(page.nextCursor)}`);
      if (!gate.current.isReadCurrent(readTicket) || pageReads.current.get(name) !== request) return;
      if (snapshot.schemaVersion !== "creative_workbench.v1" || snapshot.projectId !== projectId || snapshot.productionUnitId !== unitId) throw new Error("分页响应范围不匹配。");
      setCollections(current => current[name]?.nextCursor === page.nextCursor ? mergeCollections(current, snapshot.collections, true) : current);
    } catch (error) {
      if (gate.current.isReadCurrent(readTicket) && pageReads.current.get(name) === request) readFailure(error);
    } finally { if (pageReads.current.get(name) === request) pageReads.current.delete(name); }
  }

  if (!client || !accessToken || sessionFailed) return <AppShell><main className="creative-workbench"><Panel title="创作工作台"><p role="status">{clientState.error || (sessionFailed ? "会话已失效，请使用现有登录入口重新登录。" : "真实工作台需要已有的 Bearer 会话。模拟角色只用于只读演示，不能执行创作写入。")}</p><a href="#">返回命令中心</a></Panel></main></AppShell>;
  return <AppShell><main className="creative-workbench"><header className="wb-heading"><div><p className="eyebrow">PHOTO STUDIO / CREATIVE WORKBENCH</p><h1>创作工作台</h1><p>从规格到候选，再到有凭据的正式素材。</p></div><a href="#">返回命令中心</a></header>
    <div className="wb-status" aria-live="polite"><span>{writeAllowed ? "Owner 创作会话" : "只读会话"}</span>{pending && <strong>{pending}提交中…</strong>}{loading && <span>正在读取…</span>}{notice && <p>{notice}</p>}{error && <p role="alert">{error}</p>}{uncertain && <div><p>上一操作结果不确定。先刷新并检查记录；不会自动重复提交。</p><button disabled={Boolean(pending)} onClick={() => void reload(true).then(unlocked => { if (unlocked && gate.current.isCurrent(scope)) setNotice("已完成持久记录刷新与人工核对；新的操作须再次明确提交。"); }).catch(error => { if (gate.current.isCurrent(scope)) readFailure(error); })}>我已核对持久记录</button></div>}{recovery === "refresh_required" && projectId && <p>当前范围待刷新；普通写入保持锁定。</p>}{recovery === "committed_refresh" && <p>操作已提交，等待当前范围刷新成功；普通写入已锁定。</p>}<button disabled={Boolean(pending) || !projectId} onClick={() => void reload().catch(error => { if (gate.current.isCurrent(scope)) readFailure(error); })}>刷新持久记录</button></div>
    <Panel title="项目与生产单元"><div className="wb-row"><Field label="项目"><select value={projectId} disabled={Boolean(pending)} onChange={event => { setProjectId(event.target.value); setUnitId(""); }}><option value="">选择项目</option>{projectId && !projects.some(item => item.id === projectId) && <option value={projectId}>{projectId}</option>}{projects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="生产单元"><select value={unitId} disabled={Boolean(pending) || !production} onChange={event => setUnitId(event.target.value)}><option value="">选择生产单元</option>{units.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field></div>{projects.length < projectTotal && <button onClick={() => setProjectPage(page => page + 1)}>加载更多项目</button>}
      {production && <details><summary>建立交付项与生产单元</summary><div className="wb-columns"><form onSubmit={event => { event.preventDefault(); void run("创建交付项", async () => { const result = await client.post<Deliverable>(`${prefix}/deliverables`, {name, intent, outputKind: "image"}); setDeliverableId(result.id); setName(""); }); }}><fieldset disabled={busy}><Field label="交付项名称"><input required maxLength={160} value={name} onChange={event => setName(event.target.value)} /></Field><Field label="交付意图"><textarea maxLength={5000} value={intent} onChange={event => setIntent(event.target.value)} /></Field><button type="submit">创建交付项</button></fieldset></form>
      <form onSubmit={event => { event.preventDefault(); void run("创建生产单元", async () => { const result = await client.post<Unit>(`${prefix}/deliverables/${deliverableId}/production-units`, {name: unitName, kind: "image", subjects: [{kind: subjectKind, ...(subjectKind === "sku" ? {skuId: subject} : {subjectKey: subject}), role: "subject"}]}); setProduction(current => current ? {...current, deliverables: current.deliverables.map(item => item.id === deliverableId ? {...item, productionUnits: [...item.productionUnits.filter(unit => unit.id !== result.id), result]} : item)} : current); setUnitId(result.id); setUnitName(""); }); }}><fieldset disabled={busy}><Field label="所属交付项"><select required value={deliverableId} onChange={event => setDeliverableId(event.target.value)}><option value="">选择交付项</option>{production.deliverables.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="生产单元名称"><input required maxLength={160} value={unitName} onChange={event => setUnitName(event.target.value)} /></Field><Field label="主体种类"><select value={subjectKind} onChange={event => { setSubjectKind(event.target.value); setSubject(""); }}><option value="subject">独立主体</option><option value="sku">项目 SKU</option></select></Field><Field label="主体标识">{subjectKind === "sku" ? <select required value={subject} onChange={event => setSubject(event.target.value)}><option value="">选择 SKU</option>{skus.map(item => <option value={item.id} key={item.id}>{item.code} · {item.name}</option>)}</select> : <input required pattern="[A-Za-z0-9][A-Za-z0-9._-]{0,119}" maxLength={120} value={subject} onChange={event => setSubject(event.target.value)} />}</Field><button type="submit">创建生产单元</button></fieldset></form></div></details>}
    </Panel>
    {unit && <><div className="wb-scope"><strong>{unit.name}</strong><Id value={unit.id} /><span>{unit.subjects.length} 个主体绑定</span></div><div className="wb-columns">
      <Panel title="创作规格与来源"><SpecEditor key={`${unit.id}:${spec?.id ?? "new"}`} version={spec} assets={assets} disabled={busy || Boolean(unit.creativeSpec && !spec)} onSave={async body => { await run("保存创作规格", async () => { await client.post(spec ? `${prefix}/creative-specs/${spec.specId}/versions` : `${prefix}/production-units/${unit.id}/creative-specs`, body); }); }} /></Panel>
      <div><Panel title="Recipe 与探索空间"><Field label="Workflow Recipe"><select value={recipeId} onChange={event => setRecipeId(event.target.value)}><option value="">选择 Recipe</option>{collections.recipes?.items.map(item => <option key={item.id} value={item.id}>{item.compilerVersion} · {item.id.slice(0, 8)}</option>)}</select></Field>
        <button disabled={busy || !spec} onClick={() => void run("编译 Recipe", async () => { const result = await client.post<Recipe>(`${prefix}/workflow-recipes`, {creativeSpecVersionId: spec!.id, compilerVersion: "creative_prompt.v1", ...(recipeId ? {sourceRecipeId: recipeId} : {})}); setRecipeId(result.id); })}>从当前规格编译 Recipe</button>
        {recipe && <div><p>精确版本 <Id value={recipe.creativeSpecVersionId} /></p><p>输出摘要 <Id value={recipe.outputDigest} /></p><details><summary>编译投影（不替代创作真值）</summary><pre>{recipe.prompt}</pre>{recipe.negativePrompt && <pre>{recipe.negativePrompt}</pre>}</details></div>}
        <form onSubmit={event => { event.preventDefault(); void run("创建探索空间", async () => { const result = await client.post<Scratchpad>(`${prefix}/production-units/${unit.id}/scratchpads`, {title: scratchTitle}); setScratchpadId(result.id); setScratchTitle(""); }); }}><fieldset disabled={busy}><Field label="探索空间标题"><input required maxLength={160} value={scratchTitle} onChange={event => setScratchTitle(event.target.value)} /></Field><button type="submit">创建探索空间</button></fieldset></form>
        <Field label="探索空间"><select value={scratchpadId} onChange={event => { setScratchpadId(event.target.value); setAttemptId(""); }}><option value="">选择探索空间</option>{collections.scratchpads?.items.map(item => <option value={item.id} key={item.id}>{item.title} · {item.status}</option>)}</select></Field>
        <button disabled={busy || !scratchpadId || !recipeId} onClick={() => void run("创建上传尝试", async () => { const result = await client.post<ExplorationAttempt>(`${prefix}/scratchpads/${scratchpadId}/attempts`, {recipeId}); setAttemptId(result.id); })}>建立手动上传尝试</button>
        <Field label="上传尝试"><select value={attemptId} onChange={event => setAttemptId(event.target.value)}><option value="">选择开放的上传尝试</option>{collections.explorationAttempts?.items.filter(item => item.kind === "manual_upload" && item.status === "open" && (!scratchpadId || item.scratchpadId === scratchpadId)).map(item => <option key={item.id} value={item.id}>{item.id.slice(0, 8)} · {item.status}</option>)}</select></Field>
        <form onSubmit={event => { event.preventDefault(); void run("上传候选图片", async () => { validateImage(file); const body = new FormData(); body.append("file", file!); const result = await client.post<Candidate>(`${prefix}/exploration-attempts/${attemptId}/candidates`, body); setCandidateId(result.id); setFile(null); if (uploadRef.current) uploadRef.current.value = ""; }); }}><fieldset disabled={busy || !attemptId}><Field label="候选图片"><input ref={uploadRef} required type="file" accept="image/png,image/jpeg" onChange={event => setFile(event.target.files?.[0] ?? null)} /></Field><small>单文件，PNG/JPEG，≤ 8 MiB，≤ 1600 万像素；后端完整解码验证。</small><button type="submit">上传并创建候选</button></fieldset></form>
      </Panel></div>
    </div>
    <CandidatePanel key={`${projectId}:${unitId}`} client={client} prefix={prefix} candidates={collections.candidates?.items ?? []} selectedId={candidateId} onSelect={setCandidateId} disabled={busy} run={run} refresh={refresh} />
    <div className="wb-columns"><Panel title="本地图片变换配方"><p>以当前候选为输入，绑定同一 Recipe 和目标探索空间。固定 PNG、等比容纳、不放大。</p><form onSubmit={event => { event.preventDefault(); void run("创建本地变换配方", async () => { if (width * height > 16000000) throw new Error("输出像素数超过上限。"); const candidate = collections.candidates?.items.find(item => item.id === candidateId); const attempt = collections.explorationAttempts?.items.find(item => item.id === candidate?.attemptId); if (!attempt) throw new Error("请先加载此候选所属的探索尝试以核对 Recipe。"); await client.post<LocalRecipe>(`${prefix}/scratchpads/${scratchpadId}/local-media-recipes`, {sourceCandidateId: candidateId, recipeId: attempt.recipeId, width, height}); }); }}><fieldset disabled={busy || !candidateId || !scratchpadId}><p>源候选 <Id value={candidateId} /> · 目标空间 <Id value={scratchpadId} /></p><div className="wb-row"><Field label="最大宽度"><input required type="number" min={1} max={4096} value={width} onChange={event => setWidth(Number(event.target.value))} /></Field><Field label="最大高度"><input required type="number" min={1} max={4096} value={height} onChange={event => setHeight(Number(event.target.value))} /></Field></div><button type="submit">创建不可变变换配方</button></fieldset></form>
      {collections.localMediaRecipes?.items.map(item => <p key={item.id}>{item.width}×{item.height} · <Id value={item.id} /> · 输入快照 <Id value={item.inputSnapshotDigest} /></p>)}
      <h3>已提交媒体结果</h3>{collections.mediaResults?.items.map(item => <p key={item.id}>结果 <Id value={item.id} /> <button onClick={() => setCandidateId(item.candidateId)}>查看输出候选</button></p>)}
    </Panel><Panel title="正式素材评估记录"><p>这里记录人工提供的评分，由既定策略计算决定；不是自动视觉巡检，也不证明素材由所选 Recipe 生成。</p><form onSubmit={event => { event.preventDefault(); void run("记录素材评估", async () => { const result = await client.post<Evaluation>(`${prefix}/workflow-recipes/${recipeId}/evaluations`, {assetId: evaluationAsset, policyVersion: "visual_quality.v1", scores: evaluationScores(scores), failureCodes: failures, correctionStrategies: corrections.split("\n").map(line => line.trim()).filter(Boolean)}); setEvaluation(result); }); }}><fieldset disabled={busy || !recipeId}><Field label="评估正式素材"><select required value={evaluationAsset} onChange={event => setEvaluationAsset(event.target.value)}><option value="">选择正式素材</option>{assets.map(item => <option key={item.id} value={item.id}>{item.originalFilename ?? item.id}</option>)}</select></Field>{SCORE_KEYS.map(key => <Field key={key} label={`${key} 分数（0–5 整数）`}><input required type="number" min={0} max={5} step={1} value={scores[key]} onChange={event => setScores(current => ({...current, [key]: event.target.value}))} /></Field>)}<Field label="已观察到的问题"><select multiple value={failures} onChange={event => setFailures(Array.from(event.target.selectedOptions).map(option => option.value))}>{FAILURE_CODES.map(code => <option key={code}>{code}</option>)}</select></Field><Field label="修正建议（每行一条，最多32条）"><textarea maxLength={16000} value={corrections} onChange={event => setCorrections(event.target.value)} /></Field><button type="submit">提交所填评分</button></fieldset></form>{evaluation && <p>计算决定：{evaluation.decision} · <Id value={evaluation.id} /></p>}{collections.evaluations?.items.map(item => <p key={item.id}>{item.decision} · <Id value={item.id} /></p>)}</Panel></div>
    <ExecutionPanel key={generation} client={client} prefix={prefix} unitId={unit.id} recipeId={recipeId} localRecipes={collections.localMediaRecipes?.items ?? []} grants={collections.grants?.items ?? []} operations={collections.operations?.items ?? []} disabled={busy} controlDisabled={!writeAllowed} controlUncertain={stale} run={run} runControl={runControl} refresh={refresh} />
    <Panel title="持久集合与分页"><div className="wb-collections">{(Object.keys(collectionLabels) as CollectionName[]).map(name => { const page = collections[name]; return <div key={name}><strong>{collectionLabels[name]}</strong><span>{page ? `${page.items.length} / ${page.total}` : "未提供"}</span>{page?.hasMore && <button onClick={() => void loadMore(name)}>加载更多{collectionLabels[name]}</button>}</div>; })}</div></Panel>
    </>}
  </main></AppShell>;
}
