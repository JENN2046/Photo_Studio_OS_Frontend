import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
async function flush(){for(let i=0;i<24;i++)await Promise.resolve();}
const uuid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
function pureModule(url){const module={exports:{}};const code=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',code)(name=>name.startsWith('.')?pureModule(new URL(name+'.ts',url)):require(name),module,module.exports);return module.exports;}
const domain=pureModule(new URL('../src/features/workbench/domain.ts',import.meta.url));
const resources=(kind,page=1)=>({page,limit:100,total:101,items:Array.from({length:page===1?100:1},(_,i)=>{const n=(page-1)*100+i+1;return kind==='assets'?{id:uuid(1000+n),originalFilename:`asset-${n}.png`}:{id:uuid(2000+n),skuCode:`SKU-${n}`,productName:`Product ${n}`};})});
function fixture({fakeTimers=false}={}){
  const timers=new Map();let timerId=0;
  const states=[],refs=[],memos=[],effects=[],queue=[];let s=0,r=0,m=0,e=0;
  const hooks={useState(initial){const i=s++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return [states[i],value=>{states[i]=typeof value==='function'?value(states[i]):value;}];},useRef(initial){return refs[r++]??={current:initial};},useMemo(fn,deps){const i=m++,old=memos[i];if(!old||deps.some((d,j)=>d!==old.deps[j]))memos[i]={deps,value:fn()};return memos[i].value;},useCallback(fn,deps){return hooks.useMemo(()=>fn,deps);},useEffect(fn,deps){const i=e++,old=effects[i];if(!old||deps.some((d,j)=>d!==old.deps[j])){effects[i]={deps,cleanup:old?.cleanup};queue.push(()=>{effects[i].cleanup?.();effects[i].cleanup=fn();});}}};
  const projectId=uuid(1),unitId=uuid(2);const version={id:uuid(3),specId:uuid(4),versionNumber:1,fields:{intent:{value:'fixed',provenance:'human_explicit',mutability:'locked'}},references:[{assetId:uuid(1101),role:'product_truth',provenance:'human_explicit',mutability:'locked'}]};
  const production={projectId,deliverables:[{id:uuid(5),name:'delivery',productionUnits:[{id:unitId,name:'unit',subjects:[],creativeSpec:{id:version.specId,currentVersion:1}}]}]};
  let getHandler=null,postHandler=async()=>({id:uuid(9)});const calls=[];
  class WorkbenchError extends Error{constructor(status,uncertain=false){super('synthetic failure');this.status=status;this.uncertain=uncertain;}}
  const transport={async get(path,signal){calls.push({method:'GET',path,signal});const override=getHandler?.(path,signal);if(override!==undefined)return override;if(path.includes('/assets?'))return resources('assets');if(path.includes('/skus?'))return resources('skus');if(path.endsWith('/production'))return production;if(path.endsWith('/workbench'))return {schemaVersion:'creative_workbench.v1',projectId,productionUnitId:unitId,collections:{}};if(path.includes('/creative-specs/'))return version;return {items:[],page:1,limit:50,total:0};},async post(path,body){calls.push({method:'POST',path,body});return postHandler();}};
  const module={exports:{}};const source=readFileSync(new URL('../src/features/workbench/CreativeWorkbench.tsx',import.meta.url),'utf8').replace(/import\.meta\.env\.VITE_BACKEND_API_BASE_URL/g,'""');const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const imports=name=>name==='react'?hooks:name==='./domain'?domain:name==='./client'?{WorkbenchError,createWorkbenchClient:()=>transport}:name==='react/jsx-runtime'?require(name):name.endsWith('.css')?{}:name==='./parts'?{Field:'Field',Panel:'Panel',Id:'Id'}:name.endsWith('/AppShell')?{AppShell:'AppShell'}:{[name.split('/').at(-1)]:name.split('/').at(-1)};
  new Function('require','module','exports','window','fetch','setTimeout','clearTimeout',code)(imports,module,module.exports,{location:{origin:'https://fixture.invalid',pathname:'/',search:''},history:{replaceState(){}}},()=>{throw Error('NO_NETWORK');},fakeTimers?(callback,ms)=>{timers.set(++timerId,{callback,ms});return timerId;}:setTimeout,fakeTimers?id=>timers.delete(id):clearTimeout);
  const props={accessToken:'synthetic-a',role:'admin',authRuntime:{source:'backend'},params:new URLSearchParams({projectId,unitId})};
  const render=()=>{s=0;r=0;m=0;e=0;return module.exports.CreativeWorkbench(props);};
  function nodes(node,pred){if(!node||typeof node!=='object')return [];if(Array.isArray(node))return node.flatMap(n=>nodes(n,pred));return [...(pred(node)?[node]:[]),...nodes(node.props?.children,pred)];}
  const button=label=>nodes(render(),n=>n.type==='button'&&n.props.children===label)[0];
  return {timers,calls,props,version,render,nodes,button,WorkbenchError,setGet(fn){getHandler=fn;},setPost(fn){postHandler=fn;},panel(){return nodes(render(),n=>n.type==='ExecutionPanel')[0].props;},spec(){return nodes(render(),n=>n.type==='SpecEditor')[0].props;},field(label){return nodes(render(),n=>n.props?.label===label)[0].props.children;},async settle(){render();for(let i=0;queue.length;i++){assert.ok(i<15,'effects settle');queue.splice(0).forEach(fn=>fn());await flush();render();}},async click(label){assert.ok(button(label),label);button(label).props.onClick();await flush();}};
}

test('both resources load page two once per class and expose the 101st real item without changing locked references',async()=>{
  const ui=fixture();await ui.settle();const asset=deferred(),sku=deferred();ui.setGet(path=>path.includes('assets?page=2')?asset.promise:path.includes('skus?page=2')?sku.promise:undefined);
  const clickAssets=ui.button('加载更多正式素材').props.onClick,clickSkus=ui.button('加载更多SKU').props.onClick;clickAssets();clickAssets();clickSkus();clickSkus();await flush();
  assert.equal(ui.calls.filter(c=>c.path.includes('?page=2&limit=100')).length,2);assert.equal(ui.button('加载更多正式素材').props.disabled,true);assert.equal(ui.button('加载更多SKU').props.disabled,true);
  const before=structuredClone(ui.spec().version.references);asset.resolve(resources('assets',2));sku.resolve(resources('skus',2));await flush();await ui.settle();
  assert.equal(ui.spec().assets.length,101);assert.equal(ui.spec().assets.at(-1).originalFilename,'asset-101.png');assert.deepEqual(ui.spec().version.references,before);
  ui.field('主体种类').props.onChange({target:{value:'sku'}});const options=ui.nodes(ui.field('主体标识'),n=>n.type==='option');assert.ok(options.some(n=>n.props.value===uuid(2101)&&n.props.children.join('').includes('Product 101')));
  ui.field('主体标识').props.onChange({target:{value:uuid(2101)}});assert.equal(ui.field('主体标识').props.value,uuid(2101));
  assert.ok(ui.nodes(ui.field('评估正式素材'),n=>n.type==='option').some(n=>n.props.value===uuid(1101)));
  assert.equal(ui.button('加载更多正式素材'),undefined);assert.equal(ui.panel().disabled,false);assert.equal(ui.calls.filter(c=>c.method==='POST').length,0);
});
for(const name of ['assets','skus']){
  test(`${name} pagination failure retries the same numbered page and leaves ordinary write state unchanged`,async()=>{
    const ui=fixture();await ui.settle();const label=name==='assets'?'正式素材':'SKU';let pages=0;
    ui.setGet(path=>{if(path.includes(`${name}?page=2`)){if(++pages===1)throw Error('synthetic page failure');return resources(name,2);}});
    await ui.click(`加载更多${label}`);assert.ok(ui.button(`重试加载${label}`));assert.equal(ui.panel().disabled,false);await ui.click(`重试加载${label}`);
    assert.equal(pages,2);assert.equal(ui.nodes(ui.render(),n=>n.props?.role==='alert').length,0);assert.equal(ui.panel().disabled,false);
  });
}
for(const outcome of ['resolve','reject']){
  test(`full reload discards late resource ${outcome} and old cleanup cannot release a new page request`,async()=>{
    const ui=fixture();await ui.settle();const old=deferred(),current=deferred();let pages=0;
    ui.setGet(path=>path.includes('assets?page=2')?(++pages===1?old.promise:current.promise):undefined);
    await ui.click('加载更多正式素材');const oldCall=ui.calls.at(-1);await ui.click('刷新持久记录');assert.equal(oldCall.signal.aborted,true);
    await ui.click('加载更多正式素材');if(outcome==='resolve')old.resolve(resources('assets',2));else old.reject(Error('stale page failure'));await flush();
    assert.equal(ui.spec().assets.length,100);assert.equal(ui.button('加载更多正式素材').props.disabled,true);ui.button('加载更多正式素材').props.onClick();assert.equal(pages,2);
    current.resolve(resources('assets',2));await flush();assert.equal(ui.spec().assets.length,101);assert.equal(ui.nodes(ui.render(),n=>n.props?.role==='alert').length,0);
  });
}
test('identity changes abort old resource pages and a fresh UNKNOWN snapshot can page without unlocking writes',async()=>{
  const ui=fixture();await ui.settle();const old=deferred();ui.setGet(path=>path.includes('assets?page=2')?old.promise:undefined);await ui.click('加载更多正式素材');const oldCall=ui.calls.at(-1);
  ui.props.accessToken='synthetic-b';ui.setGet(null);await ui.settle();assert.equal(oldCall.signal.aborted,true);old.resolve(resources('assets',2));await flush();assert.equal(ui.spec().assets.length,100);
  ui.setPost(async()=>{throw new ui.WorkbenchError(0,true);});let panel=ui.panel();await panel.run('uncertain',()=>panel.client.post('/allocate',{}));await ui.click('刷新持久记录');
  assert.equal(ui.panel().disabled,true);ui.setGet(path=>path.includes('assets?page=2')?resources('assets',2):undefined);await ui.click('加载更多正式素材');assert.equal(ui.spec().assets.length,101);assert.equal(ui.panel().disabled,true);
  assert.equal(await ui.panel().run('repeat',()=>panel.client.post('/allocate',{})),false);assert.equal(ui.calls.filter(c=>c.method==='POST').length,1);
});
test('a wrong numbered response is rejected without advancing the retry page',async()=>{
  const ui=fixture();await ui.settle();ui.setGet(path=>path.includes('assets?page=2')?{...resources('assets',2),page:3}:undefined);await ui.click('加载更多正式素材');assert.equal(ui.spec().assets.length,100);assert.ok(ui.button('重试加载正式素材'));
  ui.setGet(path=>path.includes('assets?page=2')?resources('assets',2):undefined);await ui.click('重试加载正式素材');assert.equal(ui.spec().assets.length,101);
});

for(const confirmed of [false,true])test(`superseded ${confirmed?'confirmed':'ordinary'} refresh cancels all four GETs even for captured repeated clicks`,async()=>{
  const ui=fixture();await ui.settle();if(confirmed){ui.setPost(async()=>{throw new ui.WorkbenchError(0,true);});const p=ui.panel();await p.run('uncertain',()=>p.client.post('/write',{}));}
  const pending=[];ui.setGet((path,signal)=>{const d=deferred();pending.push({...d,signal});return d.promise;});
  const label=confirmed?'我已核对持久记录':'刷新持久记录',click=ui.button(label).props.onClick;
  click();click();click();await flush();assert.equal(pending.length,12);assert.ok(pending.slice(0,8).every(r=>r.signal.aborted));assert.ok(pending.slice(8).every(r=>!r.signal.aborted));assert.equal(new Set(pending.slice(8).map(r=>r.signal)).size,1);assert.equal(ui.button(label).props.disabled,true);
  ui.setGet(null);click();await flush();assert.ok(pending.every(r=>r.signal.aborted));assert.equal(ui.panel().disabled,false);
  for(const r of pending)r.reject(Error('superseded-error'));await flush();assert.equal(ui.nodes(ui.render(),n=>n.props?.role==='alert').length,0);
});
test('one failed refresh GET aborts siblings and an explicit retry restores fresh state',async()=>{
  const ui=fixture();await ui.settle();const signals=[];ui.setGet((path,signal)=>{signals.push(signal);return path.endsWith('/production')?Promise.reject(Error('read failure')):new Promise(()=>{});});await ui.click('刷新持久记录');
  assert.equal(signals.length,4);assert.ok(signals.every(signal=>signal.aborted));assert.equal(ui.button('刷新持久记录').props.disabled,false);assert.equal(ui.panel().disabled,true);
  ui.setGet(null);await ui.click('刷新持久记录');assert.equal(ui.panel().disabled,false);
});
test('refresh timeout cancels all reads and permits an explicit retry without accepting UNKNOWN',async()=>{
  const ui=fixture({fakeTimers:true});await ui.settle();ui.setPost(async()=>{throw new ui.WorkbenchError(0,true);});const p=ui.panel();await p.run('uncertain',()=>p.client.post('/write',{}));
  const signals=[];ui.setGet((path,signal)=>{signals.push(signal);return new Promise(()=>{});});await ui.click('我已核对持久记录');assert.equal(ui.timers.size,1);const timer=[...ui.timers.values()][0];assert.equal(timer.ms,30000);timer.callback();await flush();
  assert.ok(signals.every(signal=>signal.aborted));assert.equal(ui.timers.size,0);assert.equal(ui.button('我已核对持久记录').props.disabled,false);assert.equal(ui.panel().disabled,true);assert.ok(ui.nodes(ui.render(),n=>n.props?.role==='alert').some(n=>n.props.children.includes('超时')));
  ui.setGet(null);await ui.click('刷新持久记录');assert.equal(ui.panel().disabled,true);await ui.click('我已核对持久记录');assert.equal(ui.panel().disabled,false);
});
for(const count of [0,32,33])test(`evaluation validates ${count} nonempty correction lines before entering the write gate`,async()=>{
  const ui=fixture();await ui.settle();ui.field('Workflow Recipe').props.onChange({target:{value:uuid(8)}});ui.field('评估正式素材').props.onChange({target:{value:uuid(1001)}});
  for(const key of domain.SCORE_KEYS)ui.field(`${key} 分数（0–5 整数）`).props.onChange({target:{value:'3'}});
  ui.field('修正建议（每行一条，最多32条）').props.onChange({target:{value:Array.from({length:count},(_,i)=>`  suggestion-${i}  `).join('\n\n')+'\n  \n'}});
  const form=ui.nodes(ui.render(),n=>n.type==='form'&&ui.nodes(n,c=>c.type==='button'&&c.props.children==='提交所填评分').length)[0];form.props.onSubmit({preventDefault(){}});await flush();
  const posts=ui.calls.filter(c=>c.method==='POST');assert.equal(posts.length,count>32?0:1);if(count<=32)assert.deepEqual(posts[0].body.correctionStrategies,Array.from({length:count},(_,i)=>`suggestion-${i}`));else{assert.ok(ui.nodes(ui.render(),n=>n.props?.role==='alert').some(n=>n.props.children.includes('最多32条')));assert.equal(ui.panel().disabled,false);}
});
