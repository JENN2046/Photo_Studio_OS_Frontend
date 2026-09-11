import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return {promise,resolve,reject}; };
async function flush() { for(let i=0;i<20;i++) await Promise.resolve(); }
function pureModule(url) {
  const module={exports:{}};
  const code=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',code)(name=>name.startsWith('.')?pureModule(new URL(name+'.ts',url)):require(name),module,module.exports);
  return module.exports;
}
const domain=pureModule(new URL('../src/features/workbench/domain.ts',import.meta.url));
function fixture() {
  const states=[],refs=[],memos=[],effects=[],queued=[];let s=0,r=0,m=0,e=0;
  const hooks={
    useState(initial){const i=s++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return [states[i],value=>{states[i]=typeof value==='function'?value(states[i]):value;}];},
    useRef(initial){return refs[r++]??={current:initial};},
    useMemo(fn,deps){const i=m++,prior=memos[i];if(!prior||deps.some((d,j)=>d!==prior.deps[j]))memos[i]={deps,value:fn()};return memos[i].value;},
    useCallback(fn,deps){return hooks.useMemo(()=>fn,deps);},
    useEffect(fn,deps){const i=e++,prior=effects[i];if(!prior||deps.some((d,j)=>d!==prior.deps[j])){effects[i]={deps,cleanup:prior?.cleanup};queued.push(()=>{effects[i].cleanup?.();effects[i].cleanup=fn();});}}
  };
  const calls=[];
  const createWorkbenchClient=(_base,_origin,token)=>({get(path,signal){const pending=deferred();calls.push({token,path,signal,...pending});return pending.promise;},post(){throw Error('NO_POST');}});
  const module={exports:{}};
  const source=readFileSync(new URL('../src/features/workbench/CreativeWorkbench.tsx',import.meta.url),'utf8').replace(/import\.meta\.env\.VITE_BACKEND_API_BASE_URL/g,'""');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const imports=name=>name==='react'?hooks:name==='./domain'?domain:name==='./client'?{createWorkbenchClient,WorkbenchError:class extends Error{}}:name==='react/jsx-runtime'?require(name):name.endsWith('.css')?{}:name==='./parts'?{Field:'Field',Panel:'Panel',Id:'Id'}:name.endsWith('/AppShell')?{AppShell:'AppShell'}:{[name.split('/').at(-1)]:name.split('/').at(-1)};
  new Function('require','module','exports','window','fetch',code)(imports,module,module.exports,{location:{origin:'https://fixture.invalid',pathname:'/',search:''},history:{replaceState(){}}},()=>{throw Error('NO_NETWORK');});
  const props={accessToken:'session-a',role:'admin',authRuntime:{source:'backend'},params:new URLSearchParams()};
  const render=()=>{s=0;r=0;m=0;e=0;return module.exports.CreativeWorkbench(props);};
  function nodes(node,predicate){if(!node||typeof node!=='object')return [];if(Array.isArray(node))return node.flatMap(n=>nodes(n,predicate));return [...(predicate(node)?[node]:[]),...nodes(node.props?.children,predicate)];}
  const button=()=>nodes(render(),n=>n.type==='button'&&['加载更多项目','重试加载项目'].includes(n.props.children))[0];
  return {props,calls,render,button,nodes,async effects(){render();for(let rounds=0;queued.length;rounds++){assert.ok(rounds<12,'effects converge');queued.splice(0).forEach(fn=>fn());await flush();render();}},names(){return nodes(render(),n=>n.type==='option').map(n=>n.props.children);}};
}
const page=(name,total=3)=>({items:[{id:name,name}],total,limit:50});
const pageNumber=call=>Number(new URL(call.path,'https://fixture.invalid').searchParams.get('page'));

test('actual project pagination serializes same-render clicks and appends every completed page',async()=>{
  const ui=fixture();await ui.effects();assert.deepEqual(ui.calls.map(pageNumber),[1]);
  ui.calls[0].resolve(page('first'));await flush();await ui.effects();
  const click=ui.button().props.onClick;click();click();await flush();await ui.effects();
  assert.deepEqual(ui.calls.map(pageNumber),[1,2]);assert.equal(ui.button().props.disabled,true);assert.equal(ui.calls[1].signal.aborted,false);
  ui.calls[1].resolve(page('second'));await flush();await ui.effects();assert.equal(ui.button().props.disabled,false);
  ui.button().props.onClick();await ui.effects();assert.deepEqual(ui.calls.map(pageNumber),[1,2,3]);
  ui.calls[2].resolve(page('third'));await flush();await ui.effects();
  assert.deepEqual(ui.names().filter(n=>['first','second','third'].includes(n)),['first','second','third']);assert.equal(ui.button(),undefined);
});

test('failed project pages retry the same page and advance only after success',async()=>{
  const ui=fixture();await ui.effects();ui.calls[0].resolve(page('first'));await flush();await ui.effects();
  ui.button().props.onClick();await ui.effects();ui.calls[1].reject(new Error('synthetic page failure'));await flush();await ui.effects();
  assert.equal(ui.button().props.children,'重试加载项目');assert.equal(ui.button().props.disabled,false);
  const retry=ui.button().props.onClick;retry();retry();await ui.effects();assert.deepEqual(ui.calls.map(pageNumber),[1,2,2]);
  ui.calls[2].resolve(page('second'));await flush();await ui.effects();ui.button().props.onClick();await ui.effects();
  assert.deepEqual(ui.calls.map(pageNumber),[1,2,2,3]);ui.calls[3].resolve(page('third'));await flush();
});

test('an initial project failure has a page-one retry even without any project totals',async()=>{
  const ui=fixture();await ui.effects();ui.calls[0].reject(new Error('synthetic initial failure'));await flush();await ui.effects();
  assert.equal(ui.button().props.children,'重试加载项目');ui.button().props.onClick();await ui.effects();
  assert.deepEqual(ui.calls.map(pageNumber),[1,1]);ui.calls[1].resolve(page('recovered',1));await flush();await ui.effects();assert.ok(ui.names().includes('recovered'));
});

for(const oldOutcome of ['resolve','reject']) {
  test(`identity replacement starts at page one and an old ${oldOutcome} cannot release the new request`,async()=>{
    const ui=fixture();await ui.effects();ui.calls[0].resolve(page('old-first'));await flush();await ui.effects();
    ui.button().props.onClick();await ui.effects();const old=ui.calls[1];
    ui.props.accessToken='session-b';await ui.effects();assert.equal(old.signal.aborted,true);
    assert.deepEqual(ui.calls.map(c=>[c.token,pageNumber(c)]),[['session-a',1],['session-a',2],['session-b',1]]);
    ui.calls[2].resolve(page('new-first'));await flush();await ui.effects();ui.button().props.onClick();await ui.effects();const newer=ui.calls[3];
    if(oldOutcome==='resolve')old.resolve(page('old-late'));else old.reject(new Error('stale identity failure'));
    await flush();await ui.effects();assert.equal(ui.button().props.disabled,true);assert.equal(newer.signal.aborted,false);
    ui.button().props.onClick();await ui.effects();assert.equal(ui.calls.length,4);assert.ok(!ui.names().includes('old-late'));assert.ok(!ui.names().includes('old-first'));
    assert.equal(ui.nodes(ui.render(),n=>n.props?.role==='alert').length,0);
    newer.resolve(page('new-second',2));await flush();await ui.effects();assert.ok(ui.names().includes('new-second'));assert.equal(ui.button(),undefined);
  });
}
