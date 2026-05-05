# Photo Studio OS Frontend — Autopilot Rails Pack

This pack adds a persistent execution rail for `Photo_Studio_OS_Frontend`.

It is designed to work together with:

```text
AGENTS.md — Photo Studio OS Frontend Sustained Autopilot Final v1.0
```

Purpose:

```text
AGENTS.md tells Codex how to behave.
.agent_board tells Codex what to continue, what was done, what is blocked, and where to resume.
```

This pack does not authorize backend changes, deployment, push, dependency changes, production writes, secrets changes, or destructive commands.

---

## Files

```text
.agent_board/
  TASK_QUEUE.md
  CHECKPOINT.md
  RUN_STATE.md
  HANDOFF.md
  BLOCKERS.md
  DECISIONS.md
  VALIDATION_LOG.md

scripts/
  validate-local.ps1
  validate-local.sh
```

---

## How to install

Copy the contents of this pack into the root of:

```text
A:\Photo_Studio_OS_Frontend
```

Expected result:

```text
A:\Photo_Studio_OS_Frontend
  AGENTS.md
  .agent_board/
    TASK_QUEUE.md
    CHECKPOINT.md
    RUN_STATE.md
    HANDOFF.md
    BLOCKERS.md
    DECISIONS.md
    VALIDATION_LOG.md
  scripts/
    validate-local.ps1
    validate-local.sh
```

---

## Recommended Codex prompt

```text
你现在在 A:\Photo_Studio_OS_Frontend。

读取 AGENTS.md 和 .agent_board/*。

使用 A4-Sustained Local Frontend Autopilot。

目标：
持续推进 Command Center Read-only Alpha。

要求：
1. 先检查 repo reality：branch、status、diff、scripts。
2. 读取 .agent_board/TASK_QUEUE.md。
3. 如果任务队列为空，按 AGENTS.md 自动生成下一批安全任务。
4. 每次只推进一个主任务。
5. 做完后更新 TASK_QUEUE.md、CHECKPOINT.md、RUN_STATE.md、VALIDATION_LOG.md。
6. 队列未完成且没有 hard stop，就继续。
7. 只在真正 hard stop 时停下，并更新 BLOCKERS.md 和 HANDOFF.md。
8. 默认用中文汇报，代码、命令、路径、错误、日志保持原文。

禁止：
- 不要改 backend repo。
- 不要改 root control repo。
- 不要新增依赖。
- 不要改 .env。
- 不要部署。
- 不要 push。
- 不要 git add .
- 不要使用 3000 / 6005 / 6006 端口。
```

---

## Current principle

```text
The frontend may open its eyes.
It must not touch the engine.
The agent may keep walking.
It must stop only at the cliff.
```
