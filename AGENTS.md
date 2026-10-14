<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Working rules

- Before you start, confirm `git status` is clean.
- Make one change at a time, then run `npx tsc --noEmit` once.
- If the same error appears twice in a row, STOP: show the exact error and the relevant lines of code, and ask how to proceed.
- Never run more than 3 commands without reporting what changed.
- After each task, stop so the user can commit.
- Do not edit files with `node -e` or inline scripts; use the file edit/write tools only.
