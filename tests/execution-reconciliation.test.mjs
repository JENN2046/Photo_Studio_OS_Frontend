import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/features/workbench/ExecutionPanel.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX}}).outputText;
const attemptId = '00000000-0000-4000-8000-000000000001';
const taskRef = `synthetic:${attemptId}`;

// Exercise the actual rendered inputs and submit handlers without network or a browser.
// Only the fetched operation/control state is seeded; edits use the component's onChange.
function fixture({local = false, uncertain = false, recipeId = "recipe-fixture", localRecipes = [], readError = ""} = {}) {
  let cursor = 0;
  const state = [];
  const calls = []; const pending = [];
  const attempt = {id: attemptId, sequence: 1, revision: 7, fence: 3, capabilityId: local ? 'local.image.resize.v1' : 'synthetic.execute', submissionState: 'UNKNOWN', executionState: 'UNKNOWN', reservationCredits: 1};
  const operation = {id: 'operation-fixture', grantId: 'grant-fixture', state: 'UNKNOWN', attempts: [attempt, {...attempt, id: 'other-attempt', sequence: 2}]};
  const control = {mode: 'RUNNING', revision: 4, pool: {busy: true, phase: 'UNKNOWN', poolEpoch: 9}};
  const hooks = {
    useEffect() {}, useRef(value) { return {current: value}; },
    useState(initial) {
      const slot = cursor++;
      if (!(slot in state)) state[slot] = slot === 5 ? operation : slot === 6 ? control : slot === 7 ? readError : slot === 26 ? '/projects/project-fixture|||0|0' : typeof initial === 'function' ? initial() : initial;
      return [state[slot], value => { state[slot] = typeof value === 'function' ? value(state[slot]) : value; }];
    }
  };
  const module = {exports: {}};
  new Function('require', 'module', 'exports', compiled)(name => name === 'react' ? hooks : name === './parts' ? {Field:'Field', Panel:'Panel', Id:'Id'} : name === './domain' ? {createIntentKey:() => 'fixture-event', formatCredits:String} : require(name), module, module.exports);
  const run = (_label, action, mode) => { const promise = action().then(() => true); pending.push(promise); if (mode !== undefined) calls.push({controlMode:mode}); return promise; };
  const props = {client:{post:async (path, payload) => { calls.push({path,payload}); return {id:"created-fixture"}; }}, prefix:'/projects/project-fixture', unitId:'unit-fixture', recipeId, localRecipes, grants:[], operations:[operation], disabled:false, controlDisabled:false, controlUncertain:uncertain, run, runControl:run, refresh:0};
  const render = () => { cursor = 0; return module.exports.ExecutionPanel(props); };
  function nodes(node, predicate) { if (!node || typeof node !== 'object') return []; if (Array.isArray(node)) return node.flatMap(child => nodes(child,predicate)); return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children,predicate)]; }
  function field(label) { return nodes(render(), node => node.props?.label === label)[0]?.props.children; }
  function change(label, value) { const input = field(label); assert.ok(input, `field ${label}`); input.props.onChange({target:{value}}); }
  function formWithButton(text) { return nodes(render(), node => node.type === 'form' && nodes(node, child => child.type === 'button' && child.props.children === text).length)[0]; }
  async function submit(text) { const form = formWithButton(text); assert.ok(form); form.props.onSubmit({preventDefault() {}}); await Promise.all(pending); }
  change('待对账尝试', attemptId);
  return {calls, change, field, render, nodes, submit, formWithButton, props};
}

for (const outcome of ['attach_known_task', 'confirmed_succeeded', 'confirmed_failed']) {
  test(`${outcome} requires and submits the owner's explicit task reference`, async () => {
    const ui = fixture(); ui.change('对账结果', outcome);
    assert.equal(ui.field('已核实的合成任务引用').props.required, true);
    ui.change('已核实的合成任务引用', taskRef);
    ui.change('收敛操作理由', 'Owner verified synthetic task evidence');
    if (outcome !== 'attach_known_task') ui.change('核实的实际消耗', '2');
    await ui.submit('提交 Owner 对账声明');
    const payload = ui.calls[0].payload;
    assert.equal(payload.taskRef, taskRef); assert.equal(payload.outcome, outcome); assert.equal(payload.expectedRevision, 7);
    if (outcome === 'attach_known_task') assert.equal('actualCredits' in payload, false);
    else assert.equal(payload.actualCredits, 2);
  });
}

test('switching attempts clears prior owner task evidence; not-created omits stale task and cost', async () => {
  const ui = fixture(); ui.change('对账结果', 'confirmed_succeeded'); ui.change('已核实的合成任务引用', taskRef);
  ui.change('待对账尝试', 'other-attempt');
  assert.equal(ui.field('已核实的合成任务引用').props.value, '');
  ui.change('已核实的合成任务引用', taskRef); ui.change('核实的实际消耗', '2');
  ui.change('对账结果', 'confirmed_not_created');
  assert.equal(ui.field('已核实的合成任务引用'), undefined);
  await ui.submit('提交 Owner 对账声明');
  assert.equal('taskRef' in ui.calls[0].payload, false); assert.equal('actualCredits' in ui.calls[0].payload, false);
});

test('UNKNOWN keeps pause/drain available and prevents the RUNNING submit without disabling mode selection', async () => {
  const ui = fixture({uncertain:true});
  for (const mode of ['PAUSED','DRAINING','RUNNING']) {
    ui.change('控制模式', mode);
    const form = ui.formWithButton('提交控制变更');
    const button = ui.nodes(form, node => node.type === 'button')[0];
    const fieldset = ui.nodes(form, node => node.type === 'fieldset')[0];
    assert.equal(fieldset.props.disabled, false);
    assert.equal(button.props.disabled, mode === 'RUNNING');
    if (mode !== 'RUNNING') { await ui.submit('提交控制变更'); assert.equal(ui.calls.at(-1).controlMode, mode); }
  }
});

test('a local recipe outside the independent recipe page can create a grant with its exact recipe', async () => {
  const plan={id:'local-plan',recipeId:'exact-out-of-page-recipe',inputSnapshotDigest:'synthetic-digest',width:20,height:20};
  const ui=fixture({recipeId:'',localRecipes:[plan]});
  let form=ui.formWithButton('明确创建授权');
  assert.equal(ui.nodes(form,n=>n.type==='fieldset')[0].props.disabled,false);
  assert.equal(ui.nodes(form,n=>n.type==='button')[0].props.disabled,true);
  ui.change('执行能力',plan.id);form=ui.formWithButton('明确创建授权');
  assert.equal(ui.nodes(form,n=>n.type==='button')[0].props.disabled,false);
  await ui.submit('明确创建授权');assert.equal(ui.calls[0].payload.recipeId,plan.recipeId);assert.equal(ui.calls[0].payload.localMediaRecipeId,plan.id);
});
test('detail refresh invalidates old operation writes immediately while known-control stop remains available', () => {
  const ui=fixture();
  assert.equal(Boolean(ui.nodes(ui.formWithButton('分配一次尝试'),n=>n.type==='fieldset')[0].props.disabled),false);
  ui.props.refresh++;
  assert.equal(ui.nodes(ui.formWithButton('分配一次尝试'),n=>n.type==='fieldset')[0].props.disabled,true);
  assert.equal(ui.nodes(ui.formWithButton('提交控制变更'),n=>n.type==='fieldset')[0].props.disabled,false);
});

for (const failure of ['stale', 'read_error']) {
  test(`RUNNING handler sends zero POST for ${failure} details while stop modes remain available`, async () => {
    const ui=fixture({readError:failure==='read_error'?'fixture unavailable':''});
    if(failure==='stale')ui.props.refresh++;
    ui.change('控制模式','RUNNING');
    assert.equal(ui.nodes(ui.formWithButton('提交控制变更'),n=>n.type==='button')[0].props.disabled,true);
    await ui.submit('提交控制变更');assert.equal(ui.calls.length,0);
    for(const mode of ['PAUSED','DRAINING']) {
      ui.change('控制模式',mode);await ui.submit('提交控制变更');
      assert.equal(ui.calls.filter(c=>c.path).at(-1).payload.mode,mode);
    }
    assert.equal(ui.calls.filter(c=>c.path).length,2);
  });
}

function pureModule(relative) {
  const file=new URL(relative,import.meta.url);const module={exports:{}};
  const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',code)(name=>name.startsWith('.')?pureModule(new URL(name+'.ts',file).href):require(name),module,module.exports);return module.exports;
}
const realDomain=pureModule('../src/features/workbench/domain.ts');
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
async function flush(){for(let i=0;i<20;i++)await Promise.resolve();}
function workbenchFixture({effectsEnabled=false}={}) {
  const state=[],refs=[],memos=[],effects=[],effectQueue=[];let cursor=0,refCursor=0,memoCursor=0,effectCursor=0;
  const projectId='00000000-0000-4000-8000-000000000011',unitId='00000000-0000-4000-8000-000000000012';
  const production={projectId,deliverables:[{id:'delivery',name:'fixture',productionUnits:[{id:unitId,name:'unit',creativeSpec:null,subjects:[]}]}]};
  const hooks={useEffect(fn,deps){if(!effectsEnabled)return;const i=effectCursor++,old=effects[i];if(!old||deps.some((d,j)=>d!==old.deps[j])){effects[i]={deps,cleanup:old?.cleanup};effectQueue.push(()=>{effects[i].cleanup?.();effects[i].cleanup=fn();});}},useState(initial){const i=cursor++;if(!(i in state))state[i]=typeof initial==='function'?initial():initial;return [state[i],value=>{state[i]=typeof value==='function'?value(state[i]):value;}];},useRef(initial){const i=refCursor++;return refs[i]??=( {current:initial});},useMemo(fn,deps){const i=memoCursor++,old=memos[i];if(!old||deps.some((d,j)=>d!==old.deps[j]))memos[i]={value:fn(),deps};return memos[i].value;},useCallback(fn,deps){return hooks.useMemo(()=>fn,deps);}};
  class WorkbenchError extends Error {constructor(status,uncertain=false){super('fixture failure');this.status=status;this.uncertain=uncertain;}}
  const calls=[];let failReads=false,getHandler=null,postHandler=async()=>({id:'fixture-created'});
  const transport={async get(path,signal){calls.push({method:'GET',path,signal});if(failReads)throw new WorkbenchError(503);if(getHandler){const override=getHandler(path);if(override!==undefined)return override;}if(path.endsWith('/production'))return production;if(path.endsWith('/workbench'))return {schemaVersion:'creative_workbench.v1',projectId,productionUnitId:unitId,collections:{}};return {items:[],total:0,limit:100};},async post(path,body){calls.push({method:'POST',path,body});return postHandler(path,body);}};
  const source=readFileSync(new URL('../src/features/workbench/CreativeWorkbench.tsx',import.meta.url),'utf8').replace(/import\.meta\.env\.VITE_BACKEND_API_BASE_URL/g,'""');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const module={exports:{}};
  new Function('require','module','exports','window','fetch',code)(name=>name==='react'?hooks:name==='./domain'?realDomain:name==='./client'?{WorkbenchError,createWorkbenchClient:()=>transport}:name.endsWith('.css')?{}:name==='react/jsx-runtime'?require(name):name==='./parts'?{Field:'Field',Panel:'Panel',Id:'Id'}:name.endsWith('/AppShell')?{AppShell:'AppShell'}:name==='./ExecutionPanel'?{ExecutionPanel:'ExecutionPanel'}:name==='./CandidatePanel'?{CandidatePanel:'CandidatePanel'}:name==='./SpecEditor'?{SpecEditor:'SpecEditor'}:require(name),module,module.exports,{location:{origin:'https://fixture.invalid',pathname:'/',search:''},history:{replaceState(){}}},()=>{throw Error('NO_NETWORK');});
  const props={accessToken:'synthetic-first-session',role:'admin',authRuntime:{source:'backend'},params:new URLSearchParams({projectId,unitId})};
  const render=()=>{cursor=0;refCursor=0;memoCursor=0;effectCursor=0;return module.exports.CreativeWorkbench(props);};
  function nodes(node,predicate){if(!node||typeof node!=='object')return [];if(Array.isArray(node))return node.flatMap(n=>nodes(n,predicate));return [...(predicate(node)?[node]:[]),...nodes(node.props?.children,predicate)];}
  const panel=()=>nodes(render(),n=>n.type==='ExecutionPanel')[0].props;
  const click=async label=>{const button=nodes(render(),n=>n.type==='button'&&n.props.children===label)[0];assert.ok(button);button.props.onClick();await flush();};
  return {calls,props,panel,click,render,nodes,WorkbenchError,production,async commitEffects(){render();for(let round=0;effectQueue.length;round++){assert.ok(round<10,"effects settle");const pending=effectQueue.splice(0);pending.forEach(fn=>fn());await flush();render();}},setGetHandler(value){getHandler=value;},setReadFailure(value){failReads=value;},setPostHandler(value){postHandler=value;}};
}

test('actual workbench run holds committed writes through refresh failure and accepts only a fresh scoped read',async()=>{
  const ui=workbenchFixture();await ui.click('刷新持久记录');assert.equal(ui.panel().disabled,false);
  ui.setReadFailure(true);let panel=ui.panel();assert.equal(await panel.run('预留预算',()=>panel.client.post('/allocate',{})),true);
  assert.equal(ui.panel().disabled,true);assert.equal(await ui.panel().run('重复预算',()=>panel.client.post('/allocate',{})),false);
  await ui.click('刷新持久记录');assert.equal(ui.panel().disabled,true);assert.equal(ui.calls.filter(c=>c.path==='/allocate').length,1);
  assert.equal(await ui.panel().runControl('停止',()=>panel.client.post('/pause',{}),'PAUSED'),true);assert.equal(ui.panel().disabled,true);
  ui.setReadFailure(false);await ui.click('刷新持久记录');assert.equal(ui.panel().disabled,false);
});
test('unknown outcome remains locked after ordinary refresh; explicit confirmation also needs a successful read',async()=>{
  const ui=workbenchFixture();await ui.click('刷新持久记录');ui.setPostHandler(async()=>{throw new ui.WorkbenchError(0,true);});
  const panel=ui.panel();assert.equal(await panel.run('未知预算',()=>panel.client.post('/allocate',{})),false);
  await ui.click('刷新持久记录');assert.equal(ui.panel().disabled,true);
  ui.setReadFailure(true);await ui.click('我已核对持久记录');assert.equal(ui.panel().disabled,true);
  ui.setReadFailure(false);await ui.click('我已核对持久记录');assert.equal(ui.panel().disabled,false);
});
test('old identity completion cannot clear the newer scope pending ticket or unblock its writes',async()=>{
  const ui=workbenchFixture();await ui.click('刷新持久记录');const old=deferred(),next=deferred();let count=0;ui.setPostHandler(()=>++count===1?old.promise:next.promise);
  let panel=ui.panel();const prior=panel.run('旧身份请求',()=>panel.client.post('/allocate',{}));
  ui.props.accessToken='synthetic-second-session';ui.render();assert.equal(ui.panel().disabled,true);await ui.click('刷新持久记录');
  panel=ui.panel();const current=panel.run('新身份请求',()=>panel.client.post('/allocate',{}));old.resolve({id:'old'});assert.equal(await prior,false);
  assert.equal(ui.panel().disabled,true);assert.equal(await ui.panel().run('重复新请求',()=>panel.client.post('/allocate',{})),false);
  assert.ok(ui.nodes(ui.render(),n=>n.type==='strong'&&String(n.props.children).includes('新身份请求')).length);
  next.resolve({id:'next'});assert.equal(await current,true);assert.equal(ui.panel().disabled,false);
});
test('stale read receipts cannot unlock a later committed or newly selected scope',()=>{
  const gate=realDomain.createScopedWriteGate(),one={},two={};gate.activate(one);gate.acceptRead(gate.beginRead(one));const earlier=gate.beginRead(one);gate.acceptRead(earlier);
  const command=gate.begin(one,'write');gate.committed(command);assert.equal(gate.acceptRead(earlier),false);assert.equal(gate.snapshot().recovery,'committed_refresh');
  const old=gate.beginRead(one);gate.activate(two);assert.equal(gate.acceptRead(old,true),false);assert.equal(gate.finish(command),false);assert.equal(gate.snapshot().recovery,'refresh_required');
});

 test('a delayed earlier refresh cannot overwrite the state published after a committed command',async()=>{
  const ui=workbenchFixture();await ui.click('刷新持久记录');
  const earlier=deferred();let reads=0;
  const freshProduction={...ui.production,deliverables:[{...ui.production.deliverables[0],name:'fresh-after-commit'}]};
  ui.setGetHandler(path=>path.endsWith('/production')?(++reads===1?earlier.promise:freshProduction):undefined);
  await ui.click('刷新持久记录'); // R1 remains pending.
  await ui.click('刷新持久记录'); // R2 publishes and unlocks.
  let panel=ui.panel();assert.equal(panel.disabled,false);
  assert.equal(await panel.run('提交一次',()=>panel.client.post('/allocate',{})),true); // R3 reads after commit.
  assert.equal(ui.panel().disabled,false);const refreshed=ui.panel().refresh;
  earlier.resolve({...ui.production,deliverables:[{...ui.production.deliverables[0],name:'stale-before-commit'}]});await flush();
  const labels=ui.nodes(ui.render(),n=>n.type==='option').map(n=>n.props.children);
  assert.ok(labels.includes('fresh-after-commit'));assert.ok(!labels.includes('stale-before-commit'));
  assert.equal(ui.panel().refresh,refreshed);assert.equal(ui.panel().disabled,false);
  assert.equal(ui.calls.filter(c=>c.path==='/allocate').length,1);
 });

function productionNamed(ui, name) {
  return {...ui.production,deliverables:[{...ui.production.deliverables[0],name}]};
}
function assertLatestRefresh(ui, refresh, locked) {
  const labels=ui.nodes(ui.render(),n=>n.type==='option').map(n=>n.props.children);
  assert.ok(labels.includes('latest-read'));assert.ok(!labels.includes('earlier-read'));
  assert.equal(ui.panel().refresh,refresh);assert.equal(ui.panel().disabled,locked);
}
test('concurrent same-scope refreshes without a POST publish only the newest read',async()=>{
  const ui=workbenchFixture();await ui.click('刷新持久记录');
  const earlier=deferred();let reads=0;
  ui.setGetHandler(path=>path.endsWith('/production')?(++reads===1?earlier.promise:productionNamed(ui,'latest-read')):undefined);
  await ui.click('刷新持久记录');await ui.click('刷新持久记录');
  const refresh=ui.panel().refresh;assertLatestRefresh(ui,refresh,false);
  earlier.resolve(productionNamed(ui,'earlier-read'));await flush();
  assertLatestRefresh(ui,refresh,false);assert.equal(ui.calls.filter(c=>c.method==='POST').length,0);
});
for(const earlierConfirmed of [false,true]) {
  test(`UNKNOWN concurrent reads reject the older ${earlierConfirmed?'confirmed':'ordinary'} ticket for publishing and unlocking`,async()=>{
    const ui=workbenchFixture();await ui.click('刷新持久记录');
    ui.setPostHandler(async()=>{throw new ui.WorkbenchError(0,true);});
    const panel=ui.panel();await panel.run('未知提交',()=>panel.client.post('/allocate',{}));
    assert.equal(ui.panel().disabled,true);
    const earlier=deferred();let reads=0;
    ui.setGetHandler(path=>path.endsWith('/production')?(++reads===1?earlier.promise:productionNamed(ui,'latest-read')):undefined);
    const ordinary='刷新持久记录',confirmed='我已核对持久记录';
    await ui.click(earlierConfirmed?confirmed:ordinary);
    await ui.click(earlierConfirmed?ordinary:confirmed);
    const refresh=ui.panel().refresh;assertLatestRefresh(ui,refresh,earlierConfirmed);
    earlier.resolve(productionNamed(ui,'earlier-read'));await flush();
    assertLatestRefresh(ui,refresh,earlierConfirmed);
    if(earlierConfirmed) {
      // A fresh ordinary read can display data, but stale confirmation cannot unlock it.
      assert.equal(await ui.panel().run('重复提交',()=>panel.client.post('/allocate',{})),false);
      await ui.click(confirmed);assert.equal(ui.panel().disabled,false);
    }
    assert.equal(ui.calls.filter(c=>c.path==='/allocate').length,1);
  });
}

const collectionPage=(items,hasMore=false,nextCursor=null)=>({items,total:items.length,limit:25,hasMore,nextCursor});
function workbenchSnapshot(ui,collections={}) {return {schemaVersion:'creative_workbench.v1',projectId:ui.production.projectId,productionUnitId:ui.production.deliverables[0].productionUnits[0].id,collections};}
for(const delayedPart of ['project_sku','unit_collection']) {
  test(`real initial effects cannot publish late ${delayedPart} over the latest complete refresh`,async()=>{
    const ui=workbenchFixture({effectsEnabled:true}),earlier=deferred();let productionReads=0,skuReads=0,unitReads=0;
    const oldCandidate={id:'00000000-0000-4000-8000-000000000021',status:'old'},newCandidate={id:'00000000-0000-4000-8000-000000000021',status:'new'};
    ui.setGetHandler(path=>{
      if(path.endsWith('/production'))return productionNamed(ui,++productionReads===1?'earlier-read':'latest-read');
      if(path.includes('/skus?'))return ++skuReads===1&&delayedPart==='project_sku'?earlier.promise:collectionPage([{id:'sku-new',code:'NEW',name:'fresh-sku'}]);
      if(path.endsWith('/workbench'))return ++unitReads===1&&delayedPart==='unit_collection'?earlier.promise:workbenchSnapshot(ui,{candidates:collectionPage([newCandidate])});
    });
    await ui.commitEffects();assert.ok(ui.calls.some(c=>c.signal),'actual effect issued an abortable request');
    await ui.click('刷新持久记录');const refresh=ui.panel().refresh;
    earlier.resolve(delayedPart==='project_sku'?collectionPage([{id:'sku-old',code:'OLD',name:'stale-sku'}]):workbenchSnapshot(ui,{candidates:collectionPage([oldCandidate])}));
    await flush();await ui.commitEffects();assertLatestRefresh(ui,refresh,false);
    const candidatePanel=ui.nodes(ui.render(),n=>n.type==='CandidatePanel')[0];assert.equal(candidatePanel.props.candidates[0].status,'new');
    const subject=ui.nodes(ui.render(),n=>n.props?.label==='主体种类')[0].props.children;subject.props.onChange({target:{value:'sku'}});
    const choices=ui.nodes(ui.render(),n=>n.type==='option').flatMap(n=>n.props.children).join(' ');
    assert.ok(choices.includes('fresh-sku'));assert.ok(!choices.includes('stale-sku'));
  });
}
test('ordinary POST 409 holds writes until production, collections, assets and SKU all refresh successfully',async()=>{
  const ui=workbenchFixture();await ui.click('刷新持久记录');ui.setPostHandler(async()=>{throw new ui.WorkbenchError(409);});
  const panel=ui.panel();assert.equal(await panel.run('CAS conflict',()=>panel.client.post('/allocate',{})),false);
  assert.equal(ui.panel().disabled,true);assert.equal(await ui.panel().run('repeat',()=>panel.client.post('/allocate',{})),false);
  ui.setGetHandler(path=>{if(path.includes('/skus?'))throw new ui.WorkbenchError(503);});
  await ui.click('刷新持久记录');assert.equal(ui.panel().disabled,true);
  ui.setGetHandler(null);await ui.click('刷新持久记录');assert.equal(ui.panel().disabled,false);
  assert.equal(ui.calls.filter(c=>c.path==='/allocate').length,1);
});
test('control 409 requires a fresh scope but preserves safe stop and never downgrades UNKNOWN',async()=>{
  const ui=workbenchFixture();await ui.click('刷新持久记录');ui.setPostHandler(async()=>{throw new ui.WorkbenchError(409);});
  let panel=ui.panel();await panel.runControl('pause conflict',()=>panel.client.post('/pause',{}),'PAUSED');assert.equal(ui.panel().disabled,true);
  ui.setPostHandler(async()=>({id:'stopped'}));panel=ui.panel();assert.equal(await panel.runControl('drain',()=>panel.client.post('/drain',{}),'DRAINING'),true);assert.equal(ui.panel().disabled,true);
  await ui.click('刷新持久记录');assert.equal(ui.panel().disabled,false);
  ui.setPostHandler(async()=>{throw new ui.WorkbenchError(0,true);});panel=ui.panel();await panel.run('unknown',()=>panel.client.post('/allocate',{}));
  ui.setPostHandler(async()=>{throw new ui.WorkbenchError(409);});panel=ui.panel();await panel.runControl('pause conflict',()=>panel.client.post('/pause',{}),'PAUSED');
  await ui.click('刷新持久记录');assert.equal(ui.panel().disabled,true);await ui.click('我已核对持久记录');assert.equal(ui.panel().disabled,false);
});
test('a superseded refresh rejection cannot replace the latest successful UI with an error',async()=>{
  const ui=workbenchFixture();await ui.click('刷新持久记录');const earlier=deferred();let reads=0;
  ui.setGetHandler(path=>path.endsWith('/production')?(++reads===1?earlier.promise:productionNamed(ui,'latest-read')):undefined);
  await ui.click('刷新持久记录');await ui.click('刷新持久记录');const refresh=ui.panel().refresh;
  earlier.reject(new Error('stale-read-error'));await flush();assertLatestRefresh(ui,refresh,false);
  assert.equal(ui.nodes(ui.render(),n=>n.props?.role==='alert').length,0);
});

async function clickCandidatePage(ui) {
  const button=ui.nodes(ui.render(),n=>n.type==='button'&&Array.isArray(n.props.children)&&n.props.children.join('')==='加载更多候选')[0];
  assert.ok(button);button.props.onClick();await flush();
}
function candidateItems(ui){return ui.nodes(ui.render(),n=>n.type==='CandidatePanel')[0].props.candidates;}
for(const outcome of ['success','failure']) {
  test(`stale pagination ${outcome} after a fresh scope read cannot overwrite data or errors`,async()=>{
    const ui=workbenchFixture(),earlier=deferred();const id='00000000-0000-4000-8000-000000000021';let pageCalls=0,fullReads=0;
    ui.setGetHandler(path=>{
      if(path.includes('?collection=')){pageCalls++;return earlier.promise;}
      if(path.endsWith('/workbench'))return workbenchSnapshot(ui,{candidates:collectionPage([{id,status:++fullReads===1?'before':'fresh'}],true,'cursor-a')});
    });
    await ui.click('刷新持久记录');await clickCandidatePage(ui);await clickCandidatePage(ui);assert.equal(pageCalls,1);
    await ui.click('刷新持久记录');assert.equal(candidateItems(ui)[0].status,'fresh');
    if(outcome==='success')earlier.resolve(workbenchSnapshot(ui,{candidates:collectionPage([{id,status:'stale'}],false)}));
    else earlier.reject(new Error('stale-page-error'));
    await flush();assert.equal(candidateItems(ui)[0].status,'fresh');assert.equal(ui.nodes(ui.render(),n=>n.props?.role==='alert').length,0);
    assert.equal(ui.panel().disabled,false);
  });
}
test('pagination rejects a mismatched scope and accepts a subsequent correctly scoped page',async()=>{
  const ui=workbenchFixture();const first='00000000-0000-4000-8000-000000000021',second='00000000-0000-4000-8000-000000000022';let pages=0;
  ui.setGetHandler(path=>{
    if(path.includes('?collection=')){const snapshot=workbenchSnapshot(ui,{candidates:collectionPage([{id:second,status:'page2'}])});return ++pages===1?{...snapshot,productionUnitId:'wrong-unit'}:snapshot;}
    if(path.endsWith('/workbench'))return workbenchSnapshot(ui,{candidates:collectionPage([{id:first,status:'page1'}],true,'cursor-a')});
  });
  await ui.click('刷新持久记录');await clickCandidatePage(ui);assert.deepEqual(candidateItems(ui).map(x=>x.id),[first]);
  assert.equal(ui.nodes(ui.render(),n=>n.props?.role==='alert').length,1);
  await clickCandidatePage(ui);assert.deepEqual(candidateItems(ui).map(x=>x.id),[first,second]);assert.equal(ui.panel().disabled,false);
});
test('safe stop stays available during full refresh and a conflict cannot strand its loading marker',async()=>{
  const ui=workbenchFixture();await ui.click('刷新持久记录');const pending=deferred();
  ui.setGetHandler(path=>path.endsWith('/production')?pending.promise:undefined);await ui.click('刷新持久记录');
  assert.equal(ui.panel().controlDisabled,false);assert.equal(ui.panel().controlUncertain,true);
  ui.setPostHandler(async()=>{throw new ui.WorkbenchError(409);});let panel=ui.panel();
  await panel.runControl('pause',()=>panel.client.post('/pause',{}),'PAUSED');
  pending.resolve(ui.production);await flush();
  assert.equal(ui.nodes(ui.render(),n=>n.type==='span'&&n.props.children==='正在读取…').length,0);assert.equal(ui.panel().disabled,true);
  ui.setPostHandler(async()=>({id:'drained'}));panel=ui.panel();assert.equal(await panel.runControl('drain',()=>panel.client.post('/drain',{}),'DRAINING'),true);
  assert.equal(ui.panel().disabled,true);ui.setGetHandler(null);await ui.click('刷新持久记录');assert.equal(ui.panel().disabled,false);
});

test('UNKNOWN can read more from a freshly published snapshot without unlocking writes',async()=>{
  const ui=workbenchFixture();const first='00000000-0000-4000-8000-000000000021',second='00000000-0000-4000-8000-000000000022';let pages=0;
  ui.setGetHandler(path=>{
    if(path.includes('?collection=')){pages++;return workbenchSnapshot(ui,{candidates:collectionPage([{id:second,status:'older-persisted'}])});}
    if(path.endsWith('/workbench'))return workbenchSnapshot(ui,{candidates:collectionPage([{id:first,status:'persisted'}],true,'cursor-a')});
  });
  await ui.click('刷新持久记录');ui.setPostHandler(async()=>{throw new ui.WorkbenchError(0,true);});const panel=ui.panel();await panel.run('unknown',()=>panel.client.post('/allocate',{}));
  await clickCandidatePage(ui);assert.equal(pages,0); // Pre-conflict snapshot is stale.
  await ui.click('刷新持久记录');assert.equal(ui.panel().disabled,true);
  await clickCandidatePage(ui);assert.equal(pages,1);assert.deepEqual(candidateItems(ui).map(x=>x.id),[first,second]);assert.equal(ui.panel().disabled,true);
});

test('ordinary pending blocks RUNNING while one emergency stop can overlap without clearing either ticket',async()=>{
  const ui=workbenchFixture();await ui.click('刷新持久记录');const ordinary=deferred(),stop=deferred();
  ui.setPostHandler(path=>path==='/allocate'?ordinary.promise:stop.promise);
  let panel=ui.panel();const work=panel.run('ordinary in flight',()=>panel.client.post('/allocate',{}));
  panel=ui.panel();assert.equal(panel.controlUncertain,true);assert.equal(panel.controlDisabled,false);
  assert.equal(await panel.runControl('start',()=>panel.client.post('/start',{}),'RUNNING'),false);
  const stopping=panel.runControl('emergency pause',()=>panel.client.post('/pause',{}),'PAUSED');
  assert.equal(ui.panel().disabled,true);assert.equal(ui.panel().controlDisabled,true);
  assert.equal(await ui.panel().runControl('duplicate stop',()=>panel.client.post('/drain',{}),'DRAINING'),false);
  ordinary.resolve({id:'allocated'});assert.equal(await work,true);
  assert.equal(ui.panel().disabled,true);assert.equal(await ui.panel().run('duplicate ordinary',()=>panel.client.post('/allocate',{})),false);
  stop.resolve({id:'paused'});assert.equal(await stopping,true);assert.equal(ui.panel().disabled,false);
  assert.deepEqual(ui.calls.filter(c=>c.method==='POST').map(c=>c.path),['/allocate','/pause']);
});
for(const mode of ['RUNNING','PAUSED','DRAINING']) {
  test(`${mode} control in flight blocks ordinary writes and duplicate controls in the actual parent handlers`,async()=>{
    const ui=workbenchFixture();await ui.click('刷新持久记录');const pending=deferred();ui.setPostHandler(()=>pending.promise);
    const panel=ui.panel();const control=panel.runControl('control in flight',()=>panel.client.post('/control',{}),mode);
    assert.equal(ui.panel().disabled,true);assert.equal(ui.panel().controlDisabled,true);
    for(const label of ['项目','生产单元']) {
      const select=ui.nodes(ui.render(),n=>n.props?.label===label)[0].props.children;const previous=select.props.value;
      assert.equal(select.props.disabled,true);select.props.onChange({target:{value:'00000000-0000-4000-8000-000000000099'}});
      assert.equal(ui.nodes(ui.render(),n=>n.props?.label===label)[0].props.children.props.value,previous);
    }
    assert.equal(await panel.run('ordinary',()=>panel.client.post('/allocate',{})),false);
    assert.equal(await panel.runControl('duplicate',()=>panel.client.post('/other-control',{}),'PAUSED'),false);
    assert.equal(ui.calls.filter(c=>c.method==='POST').length,1);
    pending.resolve({id:'controlled'});assert.equal(await control,true);assert.equal(ui.panel().disabled,false);
  });
}
test('an emergency stop UNKNOWN remains UNKNOWN when overlapping ordinary work commits; stop 409 cannot downgrade it',async()=>{
  const ui=workbenchFixture();await ui.click('刷新持久记录');const pending=deferred();
  ui.setPostHandler(path=>path==='/allocate'?pending.promise:Promise.reject(new ui.WorkbenchError(0,true)));
  let panel=ui.panel();const ordinary=panel.run('ordinary',()=>panel.client.post('/allocate',{}));
  assert.equal(await panel.runControl('uncertain stop',()=>panel.client.post('/pause',{}),'PAUSED'),false);
  pending.resolve({id:'allocated'});assert.equal(await ordinary,true);assert.equal(ui.panel().disabled,true);
  assert.equal(await ui.panel().runControl('start',()=>panel.client.post('/start',{}),'RUNNING'),false);
  ui.setPostHandler(async()=>{throw new ui.WorkbenchError(409);});panel=ui.panel();
  assert.equal(await panel.runControl('conflicted stop',()=>panel.client.post('/drain',{}),'DRAINING'),false);
  await ui.click('刷新持久记录');assert.equal(ui.panel().disabled,true);
  assert.equal(await ui.panel().run('duplicate ordinary',()=>panel.client.post('/allocate',{})),false);
  await ui.click('我已核对持久记录');assert.equal(ui.panel().disabled,false);
  assert.equal(ui.calls.filter(c=>c.path==='/allocate').length,1);
});
test('an old identity control completion cannot clear the newer control ticket or permit ordinary writes',async()=>{
  const ui=workbenchFixture();await ui.click('刷新持久记录');const old=deferred(),fresh=deferred();let calls=0;
  ui.setPostHandler(()=>++calls===1?old.promise:fresh.promise);
  let panel=ui.panel();const prior=panel.runControl('old control',()=>panel.client.post('/old-control',{}),'PAUSED');
  ui.props.accessToken='synthetic-next-identity';ui.render();await ui.click('刷新持久记录');
  panel=ui.panel();const current=panel.runControl('new control',()=>panel.client.post('/new-control',{}),'PAUSED');
  old.resolve({id:'old'});assert.equal(await prior,false);assert.equal(ui.panel().disabled,true);assert.equal(ui.panel().controlDisabled,true);
  assert.equal(await ui.panel().run('ordinary',()=>panel.client.post('/allocate',{})),false);
  assert.equal(await ui.panel().runControl('duplicate',()=>panel.client.post('/duplicate',{}),'PAUSED'),false);
  fresh.resolve({id:'fresh'});assert.equal(await current,true);assert.equal(ui.panel().disabled,false);assert.equal(calls,2);
});
test('a selected local plan missing after reload cannot silently become a synthetic grant',async()=>{
  const plan={id:'local-plan',recipeId:'local-recipe',inputSnapshotDigest:'synthetic-digest',width:20,height:20};
  const ui=fixture({recipeId:'independent-synthetic-recipe',localRecipes:[plan]});ui.change('执行能力',plan.id);
  ui.props.localRecipes=[];
  assert.equal(ui.nodes(ui.formWithButton('明确创建授权'),n=>n.type==='button')[0].props.disabled,true);
  await ui.submit('明确创建授权');assert.equal(ui.calls.length,0);
  ui.change('执行能力','');assert.equal(ui.nodes(ui.formWithButton('明确创建授权'),n=>n.type==='button')[0].props.disabled,false);
  await ui.submit('明确创建授权');assert.equal(ui.calls[0].payload.recipeId,'independent-synthetic-recipe');assert.equal('localMediaRecipeId' in ui.calls[0].payload,false);
});
