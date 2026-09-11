import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const code=ts.transpileModule(readFileSync(new URL('../src/features/workbench/ExecutionPanel.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
const page=(label,hasMore=false)=>({items:[{id:label,phase:label,kind:label,reservationCredits:0,consumedCredits:0,releasedCredits:0}],total:2,limit:25,hasMore,nextCursor:hasMore?'cursor..one':null});
function fixture(effectsEnabled=false,{fakeTimers=false}={}){
  const timers=new Map();let timerId=0;
  let stateCursor=0,refCursor=0,effectCursor=0;const state=[],refs=[],requests=[],effects=[],pending=[];
  const seeded={2:'grant-id',3:'operation-id',4:{id:'grant-id',costUnit:'synthetic_credit',maxTotalCredits:1,reservedCredits:0,consumedCredits:0},5:{id:'operation-id',state:'READY',attempts:[]}};
  const hooks={useEffect(callback,deps){const i=effectCursor++;if(effectsEnabled&&(!effects[i]||deps.some((v,j)=>!Object.is(v,effects[i].deps[j])))){pending.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,cleanup:callback()};});}},useState(initial){const i=stateCursor++;if(!(i in state))state[i]=i in seeded?seeded[i]:typeof initial==='function'?initial():initial;return [state[i],v=>{state[i]=typeof v==='function'?v(state[i]):v;}];},useRef(initial){const i=refCursor++;return refs[i]??={current:initial};}};
  const module={exports:{}};
  new Function('require','module','exports','window','document','setTimeout','clearTimeout',code)(name=>name==='react'?hooks:name==='./parts'?{Field:'Field',Panel:'Panel',Id:'Id'}:name==='./domain'?{createIntentKey:()=>{throw Error('NO_WRITE');},formatCredits:String}:require(name),module,module.exports,{setInterval(){return 1;},clearInterval(){}},{hidden:false},fakeTimers?(callback,ms)=>{timers.set(++timerId,{callback,ms});return timerId;}:setTimeout,fakeTimers?id=>timers.delete(id):clearTimeout);
  const props={client:{get(path,signal){if(effectsEnabled&&!/budget-entries|\/events\?/.test(path))return Promise.resolve(path.endsWith("/ledger")?seeded[4]:path.endsWith("/control")?{mode:"PAUSED",revision:1,pool:{busy:false}}:seeded[5]);const d=deferred();requests.push({...d,path,signal});return d.promise;},post(){throw Error('NO_WRITE');}},prefix:'/projects/project-id',unitId:'unit-id',recipeId:'',localRecipes:[],grants:[],operations:[],disabled:false,controlDisabled:false,controlUncertain:false,run(){throw Error('NO_WRITE');},runControl(){throw Error('NO_WRITE');},refresh:0};
  const render=()=>{stateCursor=0;refCursor=0;effectCursor=0;return module.exports.ExecutionPanel(props);};
  const nodes=(n,p)=>!n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(v=>nodes(v,p)):[...(p(n)?[n]:[]),...nodes(n.props?.children,p)];
  const text=n=>n==null?'':typeof n==='string'||typeof n==='number'?String(n):Array.isArray(n)?n.map(text).join(' '):text(n.props?.children);
  return {timers,props,requests,render,nodes,button(label){return nodes(render(),n=>n.type==='button'&&n.props.children===label)[0];},async commit(){for(let i=0;i<4;i++){render();const batch=pending.splice(0);for(const effect of batch)effect();await flush();}render();},text:()=>text(render()),async click(label){const b=nodes(render(),n=>n.type==='button'&&n.props.children===label)[0];assert.ok(b,label);b.props.onClick();await flush();}};
}
for(const kind of ['entries','events'])for(const stale of ['success','failure'])test(`${kind} discards superseded history ${stale}`,async()=>{
  const ui=fixture(),label=kind==='entries'?'读取预算流水':'读取执行事件';
  await ui.click(label);await ui.click(label);assert.equal(ui.requests.length,2);
  ui.requests[1].resolve(page('latest-history'));await flush();assert.ok(ui.text().includes('latest-history'));
  if(stale==='success')ui.requests[0].resolve(page('stale-history'));else ui.requests[0].reject(new Error('stale-history-error'));
  await flush();assert.ok(ui.text().includes('latest-history'));assert.ok(!ui.text().includes('stale-history'));
});
test('history reload supersedes old append and blocks appending its old cursor while pending',async()=>{
  const ui=fixture();await ui.click('读取预算流水');ui.requests[0].resolve(page('first-history',true));await flush();
  await ui.click('加载更多预算流水');await ui.click('加载更多预算流水');assert.equal(ui.requests.length,2);assert.ok(ui.requests[1].path.endsWith('cursor=cursor..one'));
  await ui.click('读取预算流水');await ui.click('加载更多预算流水');assert.equal(ui.requests.length,3);
  ui.requests[1].resolve(page('old-append'));await flush();assert.ok(!ui.text().includes('old-append'));
  ui.requests[2].resolve(page('fresh-history'));await flush();assert.ok(ui.text().includes('fresh-history'));assert.ok(!ui.text().includes('first-history'));
});
test('budget and event history reads have independent request ownership',async()=>{
  const ui=fixture();await ui.click('读取预算流水');await ui.click('读取执行事件');
  ui.requests[1].resolve(page('event-history'));ui.requests[0].resolve(page('budget-history'));await flush();
  assert.ok(ui.text().includes('event-history'));assert.ok(ui.text().includes('budget-history'));
});

for(const kind of ['entries','events'])test(`${kind} parent refresh invalidates displayed history and captured cursor before effects`,async()=>{
  const ui=fixture(true),label=kind==='entries'?'读取预算流水':'读取执行事件',more=kind==='entries'?'加载更多预算流水':'加载更多执行事件';await ui.commit();
  await ui.click(label);ui.requests[0].resolve(page('before-command',true));await flush();const oldMore=ui.button(more);assert.ok(oldMore);
  ui.props.refresh++;assert.ok(!ui.text().includes('before-command'));assert.equal(ui.button(more),undefined);
  oldMore.props.onClick();await flush();assert.equal(ui.requests.length,1);
  await ui.commit();assert.ok(!ui.text().includes('before-command'));await ui.click(label);assert.equal(ui.requests.length,2);assert.ok(!ui.requests[1].path.includes('cursor='));
  ui.requests[1].resolve(page('after-command'));await flush();assert.ok(ui.text().includes('after-command'));
});
for(const kind of ['entries','events'])for(const stale of ['success','failure'])test(`${kind} parent refresh discards pending history ${stale} and allows a new read`,async()=>{
  const ui=fixture(true),label=kind==='entries'?'读取预算流水':'读取执行事件';await ui.commit();await ui.click(label);
  ui.props.refresh++;ui.render();
  if(stale==='success')ui.requests[0].resolve(page('obsolete-history'));else ui.requests[0].reject(Error('obsolete-history-error'));
  await flush();assert.ok(!ui.text().includes('obsolete-history'));await ui.commit();assert.ok(!ui.text().includes('obsolete-history'));
  await ui.click(label);ui.requests[1].resolve(page('current-history'));await flush();assert.ok(ui.text().includes('current-history'));
});
test('refresh clears both history pages and errors without fetching history automatically',async()=>{
  const ui=fixture(true);await ui.commit();await ui.click('读取预算流水');await ui.click('读取执行事件');ui.requests[0].resolve(page('old-budget',true));ui.requests[1].resolve(page('old-events',true));await flush();
  await ui.click('读取执行事件');ui.requests[2].reject(Error('old-history-error'));await flush();assert.ok(ui.text().includes('old-history-error'));
  ui.props.refresh++;await ui.commit();assert.equal(ui.requests.length,3);for(const old of ['old-budget','old-events','old-history-error'])assert.ok(!ui.text().includes(old));
});
test('an old refresh request cannot release a current history request owner',async()=>{
  const ui=fixture(true);await ui.commit();await ui.click('读取预算流水');ui.props.refresh++;await ui.commit();await ui.click('读取预算流水');
  ui.requests[1].resolve(page('current-page',true));await flush();await ui.click('加载更多预算流水');assert.equal(ui.requests.length,3);
  ui.requests[0].resolve(page('old-page'));await flush();await ui.click('加载更多预算流水');assert.equal(ui.requests.length,3);
  ui.requests[2].resolve(page('current-append'));await flush();assert.ok(ui.text().includes('current-append'));assert.ok(!ui.text().includes('old-page'));
});

for(const kind of ['entries','events'])test(`${kind} repeated first-page reads cancel previous requests and preserve only the latest owner`,async()=>{
  const ui=fixture(),label=kind==='entries'?'读取预算流水':'读取执行事件';const click=ui.button(label).props.onClick;click();click();click();await flush();
  assert.equal(ui.requests.length,3);assert.ok(ui.requests.slice(0,2).every(r=>r.signal.aborted));assert.equal(ui.requests[2].signal.aborted,false);
  ui.requests[2].resolve(page('latest-only'));await flush();assert.ok(ui.text().includes('latest-only'));assert.equal(ui.requests[2].signal.aborted,true);
});
test('history refresh and scope cleanup abort both active history requests',async()=>{
  const ui=fixture(true);await ui.commit();await ui.click('读取预算流水');await ui.click('读取执行事件');ui.props.refresh++;await ui.commit();
  assert.ok(ui.requests.every(r=>r.signal.aborted));assert.ok(!ui.text().includes('历史读取已取消'));
  await ui.click('读取预算流水');ui.props.unitId='new-unit';await ui.commit();assert.equal(ui.requests[2].signal.aborted,true);
});
for(const kind of ['entries','events'])test(`${kind} history deadline releases a hanging read for explicit retry`,async()=>{
  const ui=fixture(false,{fakeTimers:true}),label=kind==='entries'?'读取预算流水':'读取执行事件';await ui.click(label);assert.equal(ui.timers.size,1);const timer=[...ui.timers.values()][0];assert.equal(timer.ms,30000);timer.callback();await flush();
  assert.equal(ui.requests[0].signal.aborted,true);assert.equal(ui.timers.size,0);assert.ok(ui.text().includes('历史读取超时'));
  await ui.click(label);assert.ok(!ui.text().includes('历史读取超时'));ui.requests[1].resolve(page('retry-success'));await flush();assert.ok(ui.text().includes('retry-success'));assert.equal(ui.timers.size,0);
});
