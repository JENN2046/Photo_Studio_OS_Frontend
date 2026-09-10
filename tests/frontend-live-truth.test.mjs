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
// Compile source in memory. No server, browser session, generated files or network.
function sourceLoader(overrides = {}) {
  const cache = new Map();
  function load(file) {
    file = resolve(root, file);
    if (overrides[file]) return overrides[file];
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const output = ts.transpileModule(readFileSync(file, 'utf8'), {
      fileName: file,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }
    }).outputText;
    const localRequire = (name) => {
      if (!name.startsWith('.')) return require(name);
      const base = resolve(dirname(file), name);
      const candidate = [base, `${base}.ts`, `${base}.tsx`].find(existsSync);
      assert.ok(candidate, `Missing source import: ${name}`);
      return load(candidate);
    };
    new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
    return module.exports;
  }
  return load;
}
const load = sourceLoader();
const { mapCommandCenterV2 } = load('src/api/backendReadModels.ts');
const { createCommandCenterViewModel } = load('src/features/command-center/commandCenterViewModel.ts');
function fixture() {
  return {
    generatedAt: '2026-09-10T14:31:00.000Z',
    studio: { organizationId: 'fixture-org', name: 'Fixture Studio', timezone: 'UTC', mode: 'read_only' },
    coverage: { skuCoveragePercent: 67, completedSkus: 2, totalSkus: 3, missingShotCount: 1 },
    qc: { qcHealthPercent: 75, passed: 3, warning: 1, failed: 0, pendingAssets: 2 },
    workflowStages: [],
    riskPulse: [{ id: 'RISK-1', type: 'qc', severity: 'high', titleKey: 'risk', count: 9,
      consequence: 'Fixture risk from backend', href: '/display-only' }],
    approvalQueue: [{ id: 'queue-1', kind: 'qc', titleKey: 'queue', subtitle: 'Check pending assets',
      priority: 'high', href: '/display-only', readOnly: true }],
    activityTimeline: [],
    previews: {
      projects: [{ id: 'PRJ-128', name: 'Fixture Project A', status: 'in_progress' },
        { id: 'PRJ-129', name: 'Fixture Project B', status: 'completed' }],
      skus: [{ id: 'SKU-1', code: 'test', name: 'Fixture SKU', status: 'pending' }],
      assets: [{ id: 'AST-1', originalFilename: 'fixture.png', status: 'qc_passed' }],
      reviews: [{ id: 'REV-1', title: 'Fixture review', status: 'published', pendingCount: 2 }],
      deliveries: [{ id: 'DEL-1', status: 'preparing', itemCount: 3 }]
    }
  };
}

test('live snapshot preserves provided metrics and does not invent project statistics or readiness', () => {
  const input = fixture();
  const original = structuredClone(input);
  const output = mapCommandCenterV2(input);
  assert.deepEqual(input, original);
  assert.equal(output.generatedAt, input.generatedAt);
  assert.deepEqual(output.coverage, { skuCoveragePercent: 67, completedSkus: 2, totalSkus: 3 });
  assert.deepEqual(output.qc, { qcHealthPercent: 75, passed: 3, flagged: 1, pending: 2 });
  assert.equal(output.studio.readinessPercent, null);
  assert.equal(output.studio.activeProjectCount, null);
  for (const project of output.projects) {
    for (const key of ['client', 'owner', 'dueDate', 'skuCount', 'assetCount', 'reviewCount',
      'deliveryCount', 'riskLevel', 'completionPercent']) assert.equal(project[key], null, key);
  }
  assert.equal(output.projects[0].sourceStatus, 'in_progress');
  assert.equal(createCommandCenterViewModel(output).assetTotal, null);
});

test('risk and operational asset statuses never become visual evaluation scores', () => {
  for (const severity of ['high', 'medium', 'low']) {
    for (const status of ['qc_failed', 'qc_pending', 'qc_passed']) {
      const input = fixture();
      input.riskPulse[0].severity = severity;
      input.previews.assets[0].status = status;
      const output = mapCommandCenterV2(input);
      assert.deepEqual(output.aiInspectionFeed, []);
      assert.equal(output.assets[0].inspectionScore, null);
      assert.equal(output.riskPulse[0].signal, '9');
      assert.equal(output.riskPulse[0].label, 'Fixture risk from backend');
    }
  }
});

test('independent preview lists do not imply relationships, owners or a zero minute ETA', () => {
  const output = mapCommandCenterV2(fixture());
  for (const collection of ['skus', 'reviews', 'deliveries', 'approvalQueue']) {
    assert.equal(output[collection][0].projectId, null, collection);
  }
  assert.equal(output.skus[0].heroAssetId, null);
  assert.equal(output.skus[0].assetCount, null);
  assert.equal(output.skus[0].reviewState, null);
  assert.equal(output.assets[0].skuId, null);
  assert.equal(output.assets[0].usage, null);
  assert.equal(output.reviews[0].reviewer, null);
  assert.equal(output.approvalQueue[0].ageHours, null);
  assert.equal(output.approvalQueue[0].priority, 'high');
  assert.equal(output.approvalQueue[0].state, 'waiting');
});

test('shell header uses supplied snapshot facts, with unknown defaults and workbench navigation', () => {
  const { AppShell } = load('src/components/layout/AppShell.tsx');
  const empty = renderToStaticMarkup(React.createElement(AppShell, null, 'content'));
  assert.match(empty, /快照时间未提供/);
  assert.match(empty, /风险项数量未提供/);
  assert.doesNotMatch(empty, /布鲁克林|2026-05-05|09:30/);
  const actual = renderToStaticMarkup(React.createElement(AppShell, {
    studioName: 'Fixture Studio', snapshotAt: fixture().generatedAt,
    sourceLabel: '后端只读', riskSignalCount: 1
  }, 'content'));
  assert.match(actual, /Fixture Studio/);
  assert.match(actual, /2026-09-10T14:31:00.000Z/);
  assert.match(actual, /风险信号 1 项/);
  assert.match(actual, /href="#creative-workbench"/);
});

test('live dashboard renders unavailable evidence, exact raw stage, and chooser without v2 IDs', () => {
  const snapshot = mapCommandCenterV2(fixture());
  const hookFile = resolve(root, 'src/features/command-center/useCommandCenterSnapshot.ts');
  const { CommandCenter } = sourceLoader({ [hookFile]: { useCommandCenterSnapshot: () => ({
    snapshot, status: 'ready', errorMessage: null, debugState: 'live', canRetry: false,
    retry() {}, runtime: { source: 'backend', sourceLabel: '后端只读', transportLabel: '已连接',
      boundaryLabel: '后端快照 / 本面板只读' }
  }) } })('src/features/command-center/CommandCenter.tsx');
  const html = renderToStaticMarkup(React.createElement(CommandCenter, { accessToken: null,
    authRuntime: { source: 'backend', sourceLabel: '后端', sessionLabel: '已登录', roleLabel: 'owner',
      permissionLabel: 'fixture' } }));
  assert.doesNotMatch(html, /gauge-reference-image|gauge-reference-texture|\/reference\/gauge-/);
  assert.match(html, /后端未提供就绪度/);
  assert.match(html, /visibility="hidden"/);
  assert.match(html, /in_progress/);
  assert.match(html, /等待时间未提供/);
  assert.match(html, /当前快照未提供视觉评价/);
  assert.match(html, /Fixture risk from backend/);
  assert.doesNotMatch(html, /projectId=PRJ-|reviewSessionId=REV-|deliveryId=DEL-/);
  assert.doesNotMatch(html.replace(/<[^>]*>/g, " "), /3 \/ 5|进行到第|预计 ·|3 张主图|72%|84%|94%/);
  assert.match(html, /href="#creative-workbench"/);
});

test('mock dashboard remains visibly marked and waiting age is not an estimated completion time', () => {
  const { commandCenterMock } = load('src/mocks/commandCenter.mock.ts');
  const hookFile = resolve(root, 'src/features/command-center/useCommandCenterSnapshot.ts');
  const { CommandCenter } = sourceLoader({ [hookFile]: { useCommandCenterSnapshot: () => ({
    snapshot: commandCenterMock, status: 'ready', errorMessage: null, debugState: 'live', canRetry: false,
    retry() {}, runtime: { source: 'mock', sourceLabel: '本地模拟', transportLabel: '后端未配置',
      boundaryLabel: '模拟数据 / 本面板只读' }
  }) } })('src/features/command-center/CommandCenter.tsx');
  const html = renderToStaticMarkup(React.createElement(CommandCenter, { accessToken: null,
    authRuntime: { source: 'mock', sourceLabel: '本地模拟', sessionLabel: '模拟会话', roleLabel: '模拟角色',
      permissionLabel: 'fixture' } }));
  assert.match(html, /本地模拟/);
  assert.match(html, /模拟就绪度/);
  assert.match(html, /已等待 · 45分钟/);
  assert.match(html, /Agent 巡检（模拟）/);
  assert.doesNotMatch(html, /预计 ·|进行到第/);
});


test('unknown backend risk severity remains unknown and absent actor is not an entity type', () => {
  const input = fixture();
  input.riskPulse[0].severity = 'unrecognized';
  input.activityTimeline.push({ id: 'event-1', at: input.generatedAt, action: 'update',
    entityType: 'asset', summary: 'Fixture event' });
  const output = mapCommandCenterV2(input);
  assert.equal(output.riskPulse[0].level, 'unknown');
  assert.equal(output.activityTimeline[0].actor, '未提供');
});


test('backend read failure displays its real source without mock success or a fake snapshot time', () => {
  const hookFile = resolve(root, 'src/features/command-center/useCommandCenterSnapshot.ts');
  const { CommandCenter } = sourceLoader({ [hookFile]: { useCommandCenterSnapshot: () => ({
    snapshot: null, status: 'error', errorMessage: 'Fixture read failed', debugState: 'live', canRetry: false,
    retry() {}, runtime: { source: 'backend-error', sourceLabel: '后端只读', transportLabel: '请求失败',
      boundaryLabel: '后端快照 / 本面板只读' }
  }) } })('src/features/command-center/CommandCenter.tsx');
  const html = renderToStaticMarkup(React.createElement(CommandCenter, { accessToken: null,
    authRuntime: { source: 'backend', sourceLabel: '后端', sessionLabel: '已登录', roleLabel: 'owner',
      permissionLabel: 'fixture' } }));
  assert.match(html, /Fixture read failed/);
  assert.match(html, /后端只读/);
  assert.match(html, /请求失败/);
  assert.match(html, /快照时间未提供/);
  assert.doesNotMatch(html, /模拟适配器|本地模拟|布鲁克林|2026-05-05|inspection-score/);
});

test('only explicit mock gauge presentation renders baked numeric textures; defaults are dynamic', () => {
  const {GaugeCluster}=load('src/components/gauges/GaugeCluster.tsx');
  const snapshot=mapCommandCenterV2(fixture());
  for(const presentation of [undefined,'live']) {
    const html=renderToStaticMarkup(React.createElement(GaugeCluster,{studio:snapshot.studio,coverage:snapshot.coverage,qc:snapshot.qc,presentation}));
    assert.doesNotMatch(html,/gauge-reference-image|gauge-reference-texture|\/reference\/gauge-/);
    assert.match(html,/>67%<|>67<!--/);assert.match(html,/>75%</);assert.match(html,/未提供/);
    const defs=[...html.matchAll(/<(?:radialGradient|linearGradient|filter) id="([^"]+)"/g)].map(x=>x[1]);
    assert.equal(defs.length,15);assert.equal(new Set(defs).size,15);
  }
  const mock=renderToStaticMarkup(React.createElement(GaugeCluster,{studio:snapshot.studio,coverage:snapshot.coverage,qc:snapshot.qc,presentation:'mock'}));
  assert.equal((mock.match(/class="gauge-reference-image"/g)||[]).length,3);
});
