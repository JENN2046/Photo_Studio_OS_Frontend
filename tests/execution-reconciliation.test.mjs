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
function fixture({local = false, uncertain = false} = {}) {
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
      if (!(slot in state)) state[slot] = slot === 5 ? operation : slot === 6 ? control : typeof initial === 'function' ? initial() : initial;
      return [state[slot], value => { state[slot] = typeof value === 'function' ? value(state[slot]) : value; }];
    }
  };
  const module = {exports: {}};
  new Function('require', 'module', 'exports', compiled)(name => name === 'react' ? hooks : name === './parts' ? {Field:'Field', Panel:'Panel', Id:'Id'} : name === './domain' ? {createIntentKey:() => 'fixture-event', formatCredits:String} : require(name), module, module.exports);
  const run = (_label, action, mode) => { const promise = action().then(() => true); pending.push(promise); if (mode !== undefined) calls.push({controlMode:mode}); return promise; };
  const props = {client:{post:async (path, payload) => { calls.push({path,payload}); }}, prefix:'/projects/project-fixture', unitId:'unit-fixture', recipeId:'recipe-fixture', localRecipes:[], grants:[], operations:[operation], disabled:false, controlDisabled:false, controlUncertain:uncertain, run, runControl:run, refresh:0};
  const render = () => { cursor = 0; return module.exports.ExecutionPanel(props); };
  function nodes(node, predicate) { if (!node || typeof node !== 'object') return []; if (Array.isArray(node)) return node.flatMap(child => nodes(child,predicate)); return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children,predicate)]; }
  function field(label) { return nodes(render(), node => node.props?.label === label)[0]?.props.children; }
  function change(label, value) { const input = field(label); assert.ok(input, `field ${label}`); input.props.onChange({target:{value}}); }
  function formWithButton(text) { return nodes(render(), node => node.type === 'form' && nodes(node, child => child.type === 'button' && child.props.children === text).length)[0]; }
  async function submit(text) { const form = formWithButton(text); assert.ok(form); form.props.onSubmit({preventDefault() {}}); await Promise.all(pending); }
  change('待对账尝试', attemptId);
  return {calls, change, field, render, nodes, submit, formWithButton};
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
