---
name: replume
description: Use in a repository that has a .replume/ folder, when Replume refuses or steers a step, when a test or commit is blocked, or before finishing a task. Explains what Replume checks and how to answer it.
---
<!-- written by replume init; a change here is yours to keep: delete this line first -->

# Working with Replume

Replume watches this session through hooks and checks the result itself when you stop. It runs the checks in an isolated copy.

## Rules

- The task is the spec; tests are evidence. Replume checks every change to an existing test by content, right after the step: fix the code, and do not change what a test checks (an expected value, a case, a skip) unless the task asks for that change.
- Moving, renaming or removing code is not changing tests. When the task moves, renames or removes something (a package, a shim), move protected files with it (`git mv`), and update their imports to where the code now is, the path to a moved folder and a renamed name, keeping what they check the same. A rename the task asks for everywhere includes the tests: rename in them too, and do not keep an alias for a test. Replume compares them with their old version.
- If the task and a protected test disagree, stop and say so. Leave the test, do not make the code match it, and do not change a document to fit it. A person decides.
- Do not write under `.replume/`, and do not change the test command or the runner's config to make a run pass.
- Install dependencies yourself if you need them: Replume never installs anything.
- Run the tests before you commit. A commit before they are green is refused.
- If the tests read built output, run the project's build. A file in `dist/` written by hand does not count as the fix.

## When Replume answers

- A message names a rule and the next step. Do the step; do not look for a way around it.
- If you cannot do it, say so in your final message. An honest "not done" is a valid result.
- `INCOMPLETE` is not a pass. Read why: `replume report --agent`.

## Commands

- `replume report --agent`: the last result, its class and the next command.
- `replume status`: what is set up here and what Replume will run.
- `replume guide <topic>`: `agent`, `results`, `checks`, `ignored`, `codes`. `replume guide` lists them all.
