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
  for (const value of ['', '/api/v1', '/unrelated', 'file:///api/v2/read', 'https://user:pass@studio.invalid/api/v2/read', '/api/v2/read?role=owner', '/api/v2/read#owner']) assert.throws(() => domain.apiBaseFromReadBase(value, 'https://studio.invalid'));
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
test('request paths cannot replace origin or traverse directories', async () => {
  let calls = 0; const client = createWorkbenchClient(readBase, 'http://localhost', fixtureToken, true, async () => { calls++; return envelope({}); });
  for (const path of ['https://other.invalid/', '//other.invalid', '/../other', '/x\\y', '/x\ny']) await assert.rejects(client.get(path));
  assert.equal(calls, 0);
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
