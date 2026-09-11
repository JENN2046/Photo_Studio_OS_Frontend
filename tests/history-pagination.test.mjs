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
function fixture(){
  let stateCursor=0,refCursor=0;const state=[],refs=[],requests=[];
  const seeded={2:'grant-id',3:'operation-id',4:{id:'grant-id',costUnit:'synthetic_credit',maxTotalCredits:1,reservedCredits:0,consumedCredits:0},5:{id:'operation-id',state:'READY',attempts:[]}};
  const hooks={useEffect(){},useState(initial){const i=stateCursor++;if(!(i in state))state[i]=i in seeded?seeded[i]:typeof initial==='function'?initial():initial;return [state[i],v=>{state[i]=typeof v==='function'?v(state[i]):v;}];},useRef(initial){const i=refCursor++;return refs[i]??={current:initial};}};
  const module={exports:{}};
  new Function('require','module','exports',code)(name=>name==='react'?hooks:name==='./parts'?{Field:'Field',Panel:'Panel',Id:'Id'}:name==='./domain'?{createIntentKey:()=>{throw Error('NO_WRITE');},formatCredits:String}:require(name),module,module.exports);
  const props={client:{get(path){const d=deferred();requests.push({...d,path});return d.promise;},post(){throw Error('NO_WRITE');}},prefix:'/projects/project-id',unitId:'unit-id',recipeId:'',localRecipes:[],grants:[],operations:[],disabled:false,controlDisabled:false,controlUncertain:false,run(){throw Error('NO_WRITE');},runControl(){throw Error('NO_WRITE');},refresh:0};
  const render=()=>{stateCursor=0;refCursor=0;return module.exports.ExecutionPanel(props);};
  const nodes=(n,p)=>!n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(v=>nodes(v,p)):[...(p(n)?[n]:[]),...nodes(n.props?.children,p)];
  const text=n=>n==null?'':typeof n==='string'||typeof n==='number'?String(n):Array.isArray(n)?n.map(text).join(' '):text(n.props?.children);
  return {requests,render,nodes,text:()=>text(render()),async click(label){const b=nodes(render(),n=>n.type==='button'&&n.props.children===label)[0];assert.ok(b,label);b.props.onClick();await flush();}};
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
