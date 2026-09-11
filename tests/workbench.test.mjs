import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const cache = new Map();
function load(path) {
  const file = resolve(root, path);
  if (cache.has(file)) return cache.get(file).exports;
  const module = {exports: {}}; cache.set(file, module);
  const source = readFileSync(file, 'utf8');
  const output = ts.transpileModule(source, {fileName: file, compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true}}).outputText;
  const localRequire = name => {
    if (!name.startsWith('.')) return require(name);
    const base = resolve(dirname(file), name);
    return load([base, `${base}.ts`, `${base}.tsx`].find(existsSync));
  };
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
}
const domain = load('src/features/workbench/domain.ts');
const {createWorkbenchClient, WorkbenchError} = load('src/features/workbench/client.ts');
const readBase = 'http://127.0.0.1:31417/api/v2/read';
const fixtureToken = 'synthetic-fixture-token';
const id = '00000000-0000-4000-8000-000000000001';
const id2 = '00000000-0000-4000-8000-000000000002';
const envelope = value => new Response(JSON.stringify({data: value}), {status: 200, headers: {'content-type': 'application/json'}});

test('writes require a real session posture, token and owner role; mock/debug roles never suffice', () => {
  assert.equal(domain.canWrite(fixtureToken, 'backend', 'admin'), true);
  for (const values of [[null,'backend','admin'], ['', 'backend','admin'], [' ', 'backend','admin'], [fixtureToken,'mock','admin'], [fixtureToken,'debug','admin'], [fixtureToken,'backend','operator'], [fixtureToken,'backend','retoucher']]) assert.equal(domain.canWrite(...values), false);
});
test('read-base resolver preserves origin and only accepts the documented path without credentials/query', () => {
  assert.equal(domain.apiBaseFromReadBase(readBase, 'http://localhost'), 'http://127.0.0.1:31417/api/v1');
  assert.equal(domain.apiBaseFromReadBase('/api/v2/read/', 'https://studio.invalid'), 'https://studio.invalid/api/v1');
  for (const value of ['mock', '/api/v1', '/unrelated', 'file:///api/v2/read', 'https://user:pass@studio.invalid/api/v2/read', '/api/v2/read?role=owner', '/api/v2/read#owner']) assert.throws(() => domain.apiBaseFromReadBase(value, 'https://studio.invalid'));
});
test('command client supplies Bearer only, forbids redirects and does not use cookies/dev-role headers', async () => {
  const calls = []; const client = createWorkbenchClient(readBase, 'http://localhost', fixtureToken, true, async (...args) => { calls.push(args); return envelope({id}); });
  assert.deepEqual(await client.post('/projects', {name: 'Fixture'}), {id});
  assert.equal(calls[0][0], 'http://127.0.0.1:31417/api/v1/projects');
  assert.deepEqual(calls[0][1].headers, {Authorization: `Bearer ${fixtureToken}`, 'Content-Type':'application/json'});
  assert.equal(calls[0][1].redirect, 'error'); assert.equal(calls[0][1].credentials, 'omit');
});
test('missing token/read-only command posture causes zero requests, including FormData', async () => {
  let calls = 0; const fetcher = async () => { calls++; return envelope({}); };
  await assert.rejects(createWorkbenchClient(readBase, 'http://localhost', null, true, fetcher).get('/projects'), error => error.status === 401);
  await assert.rejects(createWorkbenchClient(readBase, 'http://localhost', fixtureToken, false, fetcher).post('/projects', new FormData()), error => error.status === 403);
  assert.equal(calls, 0);
});
test('multipart sends one native FormData payload without inventing a content boundary', async () => {
  let call; const client = createWorkbenchClient(readBase, 'http://localhost', fixtureToken, true, async (_, options) => { call = options; return envelope({id}); });
  const form = new FormData(); form.append('file', new Blob(['synthetic'], {type: 'image/png'}), 'fixture.png');
  await client.post('/projects/candidates', form);
  assert.equal(call.body, form); assert.deepEqual(Object.keys(call.headers), ['Authorization']);
});
test('network loss/server failure/malformed success after command is uncertain, never automatically retried', async () => {
  for (const fetcher of [async () => {throw new Error('sensitive raw fixture');}, async () => new Response('raw fixture', {status: 500}), async () => new Response('{bad', {status: 200}), async () => envelope(undefined)]) {
    let calls = 0;
    const client = createWorkbenchClient(readBase, 'http://localhost', fixtureToken, true, async (...args) => { calls++; return fetcher(...args); });
    await assert.rejects(client.post('/projects', {}), error => error instanceof WorkbenchError && error.uncertain && !error.message.includes('raw fixture'));
    assert.equal(calls, 1);
  }
});
test('known conflict/auth and invalid input statuses preserve failure class without exposing server error text', async () => {
  for (const status of [400,401,403,404,409,413,415,429]) {
    const client = createWorkbenchClient(readBase, 'http://localhost', fixtureToken, true, async () => new Response('raw fixture private response', {status}));
    await assert.rejects(client.post('/projects', {}), error => error.status === status && !error.uncertain && !error.message.includes('private'));
  }
});
test('pathname validation rejects raw and encoded escapes before any GET, POST or media request', async () => {
  let calls = 0; const client = createWorkbenchClient(readBase, 'http://localhost', fixtureToken, true, async () => { calls++; return envelope({}); });
  const badPaths = ['https://other.invalid/', '//other.invalid', '///other.invalid', '/../other', '/./projects',
    '/projects/../other', '/projects/..', '/projects/.', '/x\\y', '/x\ny', '/x\ty', '/x\u0000y',
    '/%2e%2e/other', '/.%2E/other', '/%2e./other', '/%2E/projects', '/%252e%252e/other',
    '/x%2fy', '/%2f%2fother.invalid', '/x%5Cy', '/x%255cy', '/x%3fy', '/x%23y', '/x%00y',
    '/projects/%', '/projects/%zz', '/projects#fragment', '/projects?cursor=value#fragment'];
  for (const path of badPaths) {
    await assert.rejects(client.get(path), error => error instanceof WorkbenchError && error.status === 400 && !error.uncertain);
    await assert.rejects(client.post(path, {}), error => error instanceof WorkbenchError && error.status === 400 && !error.uncertain);
    await assert.rejects(client.media(path, new AbortController().signal), error => error instanceof WorkbenchError && error.status === 400);
  }
  assert.equal(calls, 0);
});
test('opaque query cursors retain dots and encoded delimiters byte-for-byte under the fixed API base', async () => {
  const calls = []; const client = createWorkbenchClient(readBase, 'http://localhost', fixtureToken, false, async (...args) => { calls.push(args); return envelope({items: []}); });
  for (const cursor of ['head..tail', '../next', '//other.invalid/a', 'a\\b#?%2e%2e', 'space + unicode 日本語']) {
    const query = `?collection=candidates&limit=25&cursor=${encodeURIComponent(cursor)}`;
    const path = `/projects/${id}/production-units/${id2}/workbench${query}`;
    assert.deepEqual(await client.get(path), {items: []});
    assert.equal(calls.at(-1)[0], `http://127.0.0.1:31417/api/v1${path}`);
    const parsed = new URL(calls.at(-1)[0]);
    assert.equal(parsed.origin, 'http://127.0.0.1:31417'); assert.ok(parsed.pathname.startsWith('/api/v1/'));
    assert.equal(parsed.searchParams.get('cursor'), cursor);
  }
  // Dots inside an ordinary pathname segment are not a parent-directory segment.
  await client.get('/projects/version..label?cursor=left..right');
  assert.equal(calls.at(-1)[0], 'http://127.0.0.1:31417/api/v1/projects/version..label?cursor=left..right');
});
test('media reader allows only bounded PNG/JPEG and cancels overflow stream', async () => {
  const signal = new AbortController().signal;
  const clientFor = response => createWorkbenchClient(readBase, 'http://localhost', fixtureToken, false, async () => response);
  assert.equal((await clientFor(new Response('abc', {headers: {'content-type':'image/png'}})).media('/projects/media', signal)).size, 3);
  await assert.rejects(clientFor(new Response('<svg/>', {headers: {'content-type':'image/svg+xml'}})).media('/projects/media', signal));
  let canceled = false;
  const stream = new ReadableStream({start(controller) { controller.enqueue(new Uint8Array(8388609)); }, cancel() { canceled = true; }});
  await assert.rejects(clientFor(new Response(stream, {headers: {'content-type':'image/png'}})).media('/projects/media', signal));
  assert.equal(canceled, true);
});
test('partial collection pages preserve other sections and deduplicate repeated object identities', () => {
  const first = {recipes:{items:[{id}],limit:25,total:1,hasMore:false}, candidates:{items:[{id}],limit:25,total:2,hasMore:true,nextCursor:'opaque'}};
  const next = domain.mergeCollections(first, {candidates:{items:[{id},{id:id2}],limit:25,total:2,hasMore:false,nextCursor:null}}, true);
  assert.deepEqual(next.recipes, first.recipes); assert.equal(next.candidates.items.length, 2); assert.equal(next.candidates.hasMore, false); assert.equal(first.candidates.items.length, 1);
  assert.throws(() => domain.mergeCollections({}, JSON.parse('{"__proto__":{"items":[],"limit":25,"total":0}}')));
  assert.throws(() => domain.mergeCollections({}, {candidates:{items:[{id:'PRJ-128'}],limit:25,total:1}}));
});
test('credits preserve obligations above safe integer precision and distinguish unknown from zero', () => {
  assert.equal(domain.formatCredits('900719925474099312345'), '900719925474099312345');
  assert.equal(domain.formatCredits('0'), '0'); assert.equal(domain.formatCredits(undefined), '未提供');
  assert.equal(domain.formatCredits(Number.MAX_SAFE_INTEGER + 1), '未提供');
});
test('evaluation scores follow actual integer zero-to-five policy with no empty-as-zero coercion', () => {
  const values = Object.fromEntries(domain.SCORE_KEYS.map(key => [key, '4']));
  assert.deepEqual(Object.values(domain.evaluationScores(values)), [4,4,4,4,4]);
  for (const bad of ['', ' ', '3.5', '100', '-1', 'NaN']) assert.throws(() => domain.evaluationScores({...values, lighting: bad}));
});
test('image UI rejects obvious oversize/type errors without pretending to decode content', () => {
  domain.validateImage({size:8388608,type:'image/jpeg'});
  for (const file of [null, {size:0,type:'image/png'}, {size:8388609,type:'image/png'}, {size:10,type:'image/svg+xml'}]) assert.throws(() => domain.validateImage(file));
});
test('read-only spec editor exposes provenance and lock controls inside a disabled fieldset', () => {
  const {SpecEditor} = load('src/features/workbench/SpecEditor.tsx');
  // Server render verifies initial metadata for a new editor; browser integration
  // verifies effect-loaded persisted locks. It is not a replacement for that test.
  const html = renderToStaticMarkup(React.createElement(SpecEditor, {version:null,assets:[],disabled:true,onSave:async()=>{}}));
  assert.match(html, /<fieldset disabled/); assert.match(html, /human_explicit/); assert.match(html, /锁定此字段/); assert.match(html, /语义参考/);
});

test('committed POST remains committed if subsequent refresh fails without a second POST', async () => {
  const calls = []; const client = createWorkbenchClient(readBase, 'http://localhost', fixtureToken, true, async (_, options) => { calls.push(options.method); return options.method === 'POST' ? new Response(JSON.stringify({data:{id}}), {status:201}) : new Response('fixture unavailable', {status:503}); });
  let created;
  const result = await domain.completeCommand(async () => { created = await client.post('/projects/fixture/production-units', {}); }, async () => { await client.get('/projects/fixture/production'); });
  assert.equal(result.committed,true); assert.equal(result.error.status,503); assert.equal(created.id,id); assert.deepEqual(calls,['POST','GET']);
});
test('unknown execution response blocks start but permits explicit owner pause and drain', () => {
  for(const mode of ['PAUSED','DRAINING']) assert.equal(domain.canControlWorker(true,true,mode),true);
  assert.equal(domain.canControlWorker(true,true,'RUNNING'),false);
  assert.equal(domain.canControlWorker(true,false,'RUNNING'),true);
  for(const mode of ['PAUSED','DRAINING','RUNNING','unknown','']) assert.equal(domain.canControlWorker(false,false,mode),false);
  assert.equal(domain.canControlWorker(true,false,'unknown'),false);
});
test('field control uses label span without including dropdown option text in its name', () => {
  const {Field} = load('src/features/workbench/parts.tsx');
  const html = renderToStaticMarkup(React.createElement(Field,{label:'Project'},React.createElement('select',{},React.createElement('option',{},'Select project'))));
  const labelId = html.match(/<span id="([^"]+)">Project<\/span>/)?.[1];
  assert.ok(labelId); assert.ok(html.includes(`aria-labelledby="${labelId}"`));
});

test('blank or undefined configuration uses the same-origin command API without widening write authority', async () => {
  for(const value of [undefined,'','  ']) {
    assert.equal(domain.apiBaseFromReadBase(value,'https://studio.invalid'),'https://studio.invalid/api/v1');
    const calls=[];const client=createWorkbenchClient(value,'https://studio.invalid',fixtureToken,true,async (...args)=>{calls.push(args);return envelope({id});});
    await client.post('/projects',{});assert.equal(calls[0][0],'https://studio.invalid/api/v1/projects');
    assert.equal(calls[0][1].headers.Authorization,`Bearer ${fixtureToken}`);assert.equal(calls[0][1].credentials,'omit');
    let deniedCalls=0;const denied=async()=>{deniedCalls++;return envelope({});};
    await assert.rejects(createWorkbenchClient(value,'https://studio.invalid',null,true,denied).post('/projects',{}),e=>e.status===401);
    await assert.rejects(createWorkbenchClient(value,'https://studio.invalid',fixtureToken,false,denied).post('/projects',{}),e=>e.status===403);
    assert.equal(deniedCalls,0);
  }
});
test('explicit mock never creates a real workbench transport even with a token and write posture', () => {
  let calls=0;const fetcher=async()=>{calls++;return envelope({});};
  for(const value of ['mock',' mock '])assert.throws(()=>createWorkbenchClient(value,'https://studio.invalid',fixtureToken,true,fetcher),/模拟/);
  assert.equal(calls,0);
});

const mediaFlush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
function mediaQueueFixture() {
  const calls = []; const streams = [];
  const client = createWorkbenchClient(readBase, 'http://localhost', fixtureToken, true, async (url, options) => {
    calls.push({url, options}); if (options.method === 'POST') return envelope({id});
    let controller; const record = {canceled:false};
    const stream = new ReadableStream({start(value) {controller = value;}, cancel() {record.canceled = true;}});
    record.finish = () => { controller.enqueue(new Uint8Array([1,2,3])); controller.close(); };
    streams.push(record); return new Response(stream, {headers:{'content-type':'image/png'}});
  });
  return {client, calls, streams};
}
test('three simultaneous media reads are FIFO serial through complete body consumption; POST is unaffected', async () => {
  const f = mediaQueueFixture(), signal = new AbortController().signal;
  const reads = [1,2,3].map(n => f.client.media(`/projects/media${n}`, signal));
  await mediaFlush(); assert.equal(f.calls.length, 1);
  assert.deepEqual(await f.client.post('/projects', {}), {id}); assert.equal(f.calls.length, 2);
  f.streams[0].finish(); assert.equal((await reads[0]).size, 3); await mediaFlush();
  assert.equal(f.calls.filter(c => c.options.method !== 'POST').length, 2);
  assert.ok(f.calls.at(-1).url.endsWith('/media2')); f.streams[1].finish(); await reads[1]; await mediaFlush();
  assert.ok(f.calls.at(-1).url.endsWith('/media3')); f.streams[2].finish(); await reads[2];
});
test('queued media abort removes its job immediately without fetching or delaying the next live job', async () => {
  const f = mediaQueueFixture(), active = f.client.media('/projects/active', new AbortController().signal);
  const canceled = new AbortController(), next = new AbortController();
  const queued = f.client.media('/projects/canceled', canceled.signal); queued.catch(() => {});
  const final = f.client.media('/projects/final', next.signal);
  canceled.abort(); await assert.rejects(queued, error => error.name === 'AbortError'); assert.equal(f.calls.length, 1);
  f.streams[0].finish(); await active; await mediaFlush();
  assert.equal(f.calls.length, 2); assert.ok(f.calls[1].url.endsWith('/final')); f.streams[1].finish(); await final;
});
test('in-flight subscriber abort does not release the read slot before bounded body completion', async () => {
  const f = mediaQueueFixture(), canceled = new AbortController();
  const active = f.client.media('/projects/active', canceled.signal); active.catch(() => {});
  const queued = f.client.media('/projects/next', new AbortController().signal); let settled = false;
  active.finally(() => { settled = true; }).catch(() => {});
  await mediaFlush(); canceled.abort(); await mediaFlush();
  assert.equal(settled, false); assert.equal(f.calls.length, 1); assert.equal(f.calls[0].options.signal.aborted, false);
  f.streams[0].finish(); await assert.rejects(active, error => error.name === 'AbortError'); await mediaFlush();
  assert.equal(f.calls.length, 2); f.streams[1].finish(); await queued;
});
test('media waiting queue admits at most four jobs and abort frees queued capacity', async () => {
  const f = mediaQueueFixture(), active = f.client.media('/projects/active', new AbortController().signal);
  const controllers = Array.from({length:4}, () => new AbortController());
  const pending = controllers.map((c,i) => { const p = f.client.media(`/projects/wait${i}`, c.signal); p.catch(() => {}); return p; });
  await assert.rejects(f.client.media('/projects/excess', new AbortController().signal), error => error.status === 429);
  assert.equal(f.calls.length, 1);
  controllers[0].abort(); await assert.rejects(pending[0], error => error.name === 'AbortError');
  const replacementController = new AbortController(), replacement = f.client.media('/projects/replacement', replacementController.signal); replacement.catch(() => {});
  for (const c of controllers.slice(1)) c.abort(); replacementController.abort();
  for (const p of [...pending.slice(1),replacement]) await assert.rejects(p, error => error.name === 'AbortError');
  f.streams[0].finish(); await active; await mediaFlush(); assert.equal(f.calls.length, 1);
});
test('media errors release admission without retrying the failed request', async () => {
  for (const response of [new Response('busy',{status:503}), new Response('<svg/>',{headers:{'content-type':'image/svg+xml'}})]) {
    const paths=[]; const client=createWorkbenchClient(readBase,'http://localhost',fixtureToken,false,async url=>{paths.push(url);return paths.length===1?response:new Response('png',{headers:{'content-type':'image/png'}});});
    const first=client.media('/projects/first',new AbortController().signal),next=client.media('/projects/next',new AbortController().signal);
    await assert.rejects(first); assert.equal((await next).size,3); assert.equal(paths.length,2); assert.ok(paths[1].endsWith('/next'));
  }
});
test('media deadline aborts stalled fetch or body and releases the queue without an automatic retry', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  for (const stage of ['fetch','body']) {
    const calls=[];let canceled=false;
    const client=createWorkbenchClient(readBase,'http://localhost',fixtureToken,false,async (url,options)=>{
      calls.push({url,options});if(calls.length>1)return new Response('png',{headers:{'content-type':'image/png'}});
      if(stage==='fetch')return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('fixture abort','AbortError')),{once:true}));
      return new Response(new ReadableStream({cancel(){canceled=true;}}),{headers:{'content-type':'image/png'}});
    });
    const first=client.media('/projects/stalled',new AbortController().signal);first.catch(()=>{});
    const next=client.media('/projects/next',new AbortController().signal);await mediaFlush();
    t.mock.timers.tick(29999);await mediaFlush();assert.equal(calls.length,1);
    t.mock.timers.tick(1);await assert.rejects(first,error=>error.name==='TimeoutError');
    assert.equal((await next).size,3);assert.equal(calls.length,2);assert.equal(calls[0].options.signal.aborted,true);
    if(stage==='body')assert.equal(canceled,true);
  }
});

test('a canceled old client read holds shared admission across new tokens and base origins', async () => {
  const old = mediaQueueFixture(), abort = new AbortController();
  const active = old.client.media('/projects/old', abort.signal); active.catch(() => {});
  const calls = []; const next = createWorkbenchClient('https://next.invalid/api/v2/read', 'https://page.invalid', 'synthetic-next-token', false,
    async (url, options) => { calls.push({url,options}); return new Response('new-only', {headers:{'content-type':'image/png'}}); });
  await mediaFlush(); abort.abort();
  const pending = next.media('/projects/next', new AbortController().signal); await mediaFlush();
  assert.equal(calls.length, 0); assert.equal(old.calls[0].options.signal.aborted, false);
  old.streams[0].finish(); await assert.rejects(active, error => error.name === 'AbortError');
  assert.equal(await (await pending).text(), 'new-only'); assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://next.invalid/api/v1/projects/next');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer synthetic-next-token');
  assert.equal(old.calls[0].options.headers.Authorization, `Bearer ${fixtureToken}`);
});
test('shared media slots never share client credentials, unauthorized callbacks or blobs', async () => {
  const calls = [], unauthorized = [];
  const make = (name, status) => createWorkbenchClient(`https://${name}.invalid/api/v2/read`, 'https://page.invalid', `synthetic-${name}`, false,
    async (url, options) => { calls.push({name,url,headers:options.headers}); return new Response(name, {status,headers:{'content-type':'image/png'}}); }, () => unauthorized.push(name));
  const denied = make('denied',401).media('/projects/media',new AbortController().signal); denied.catch(() => {});
  const first = make('first',200).media('/projects/media',new AbortController().signal);
  const second = make('second',200).media('/projects/media',new AbortController().signal);
  await assert.rejects(denied, error => error.status === 401);
  const a = await first, b = await second; assert.notEqual(a,b); assert.equal(await a.text(),'first'); assert.equal(await b.text(),'second');
  assert.deepEqual(unauthorized,['denied']); assert.deepEqual(calls.map(call => call.name),['denied','first','second']);
  for (const call of calls) { assert.equal(call.headers.Authorization,`Bearer synthetic-${call.name}`); assert.ok(call.url.startsWith(`https://${call.name}.invalid/api/v1/`)); }
});
test('new client instances share the four-job queue cap and queued cancellation frees one shared place', async () => {
  const old = mediaQueueFixture(), active = old.client.media('/projects/active',new AbortController().signal);
  let fetched = 0;
  const make = () => createWorkbenchClient(readBase,'http://localhost',fixtureToken,false,async () => { fetched++; return new Response('png',{headers:{'content-type':'image/png'}}); });
  const controllers = Array.from({length:4},() => new AbortController());
  const pending = controllers.map(c => { const p = make().media('/projects/queued',c.signal); p.catch(() => {}); return p; });
  await assert.rejects(make().media('/projects/excess',new AbortController().signal),error => error.status === 429); assert.equal(fetched,0);
  controllers[0].abort(); await assert.rejects(pending[0],error => error.name === 'AbortError');
  const replacement = make().media('/projects/replacement',new AbortController().signal);
  for (const controller of controllers.slice(1)) controller.abort();
  for (const p of pending.slice(1)) await assert.rejects(p,error => error.name === 'AbortError');
  old.streams[0].finish(); await active; assert.equal((await replacement).size,3); assert.equal(fetched,1);
});
test('an old client timeout frees shared admission for a new client without retrying either request', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  let oldCalls=0,newCalls=0,oldSignal;
  const old=createWorkbenchClient(readBase,'http://localhost','synthetic-old',false,async (_url,options)=>{
    oldCalls++;oldSignal=options.signal;return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('fixture aborted','AbortError')),{once:true}));
  });
  const fresh=createWorkbenchClient('https://fresh.invalid/api/v2/read','https://page.invalid','synthetic-fresh',false,async ()=>{newCalls++;return new Response('fresh',{headers:{'content-type':'image/png'}});});
  const active=old.media('/projects/stalled',new AbortController().signal);active.catch(()=>{});
  const pending=fresh.media('/projects/fresh',new AbortController().signal);await mediaFlush();
  assert.equal(oldCalls,1);assert.equal(newCalls,0);t.mock.timers.tick(30000);
  await assert.rejects(active,error=>error.name==='TimeoutError');assert.equal(await (await pending).text(),'fresh');
  assert.equal(oldSignal.aborted,true);assert.equal(oldCalls,1);assert.equal(newCalls,1);
});

test('POST timeout bounds a noncooperative fetch and ignores its late unauthorized response without retrying', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  let resolveFetch,requestSignal,calls=0,unauthorized=0,settled=false;
  const client=createWorkbenchClient(readBase,'http://localhost',fixtureToken,true,async (_url,options)=>{
    calls++;requestSignal=options.signal;return new Promise(resolve=>{resolveFetch=resolve;});
  },()=>unauthorized++);
  const pending=client.post('/projects',{});pending.then(()=>{settled=true;},()=>{settled=true;});
  t.mock.timers.tick(29999);await mediaFlush();assert.equal(settled,false);assert.equal(requestSignal.aborted,false);
  t.mock.timers.tick(1);await assert.rejects(pending,error=>error instanceof WorkbenchError&&error.status===0&&error.uncertain);
  assert.equal(requestSignal.aborted,true);assert.equal(calls,1);
  resolveFetch(new Response('late failure',{status:401}));await mediaFlush();assert.equal(unauthorized,0);assert.equal(calls,1);
});
test('the POST deadline covers 201 response-body consumption using the original request budget', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  let resolveFetch,resolveBody,requestSignal,calls=0,jsonCalls=0,published=false;
  const client=createWorkbenchClient(readBase,'http://localhost',fixtureToken,true,async (_url,options)=>{
    calls++;requestSignal=options.signal;return new Promise(resolve=>{resolveFetch=resolve;});
  });
  const form=new FormData();form.append('file',new Blob(['synthetic']), 'fixture.png');
  const pending=client.post('/projects/candidates',form);pending.then(()=>{published=true;},()=>{});
  t.mock.timers.tick(20000);resolveFetch({status:201,ok:true,json(){jsonCalls++;return new Promise(resolve=>{resolveBody=resolve;});}});
  await mediaFlush();assert.equal(jsonCalls,1);t.mock.timers.tick(9999);await mediaFlush();assert.equal(requestSignal.aborted,false);
  t.mock.timers.tick(1);await assert.rejects(pending,error=>error instanceof WorkbenchError&&error.uncertain);
  assert.equal(requestSignal.aborted,true);resolveBody({data:{id}});await mediaFlush();assert.equal(published,false);assert.equal(calls,1);
});
test('a cooperative POST abort error still reports an uncertain outcome and suppresses raw transport details', async t => {
  t.mock.timers.enable({apis:['setTimeout']});let calls=0;
  const client=createWorkbenchClient(readBase,'http://localhost',fixtureToken,true,async (_url,options)=>{
    calls++;return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('raw fixture transport details')),{once:true}));
  });
  const pending=client.post('/projects',{});pending.catch(()=>{});t.mock.timers.tick(30000);
  await assert.rejects(pending,error=>error instanceof WorkbenchError&&error.uncertain&&!error.message.includes('raw fixture'));assert.equal(calls,1);
});
test('completed POST success and known 403 or 409 clear their timers and preserve deterministic outcomes', async t => {
  t.mock.timers.enable({apis:['setTimeout']});const signals=[];
  for(const status of [201,403,409]){
    const client=createWorkbenchClient(readBase,'http://localhost',fixtureToken,true,async (_url,options)=>{
      signals.push(options.signal);return {status,ok:status===201,json(){assert.equal(status,201,'error response does not need a body to classify');return Promise.resolve({data:{id}});}};
    });
    if(status===201)assert.deepEqual(await client.post('/projects',{}),{id});
    else await assert.rejects(client.post('/projects',{}),error=>error.status===status&&!error.uncertain);
  }
  t.mock.timers.tick(60000);await mediaFlush();assert.ok(signals.every(signal=>!signal.aborted));
});
test('GET keeps its caller AbortSignal and does not acquire the POST deadline', async t => {
  t.mock.timers.enable({apis:['setTimeout']});const abort=new AbortController();let received,settled=false;
  const client=createWorkbenchClient(readBase,'http://localhost',fixtureToken,true,async (_url,options)=>{
    received=options.signal;return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('caller canceled','AbortError')),{once:true}));
  });
  const pending=client.get('/projects',abort.signal);pending.then(()=>{settled=true;},()=>{settled=true;});
  t.mock.timers.tick(60000);await mediaFlush();assert.equal(received,abort.signal);assert.equal(settled,false);assert.equal(abort.signal.aborted,false);
  abort.abort();await assert.rejects(pending,error=>error.name==='AbortError'&&!(error instanceof WorkbenchError));
});
