---
name: feature-workflow
description: Use when implementing a feature, bug fix, refactor, test, or docs change in the perfect-datagrid repository. Covers branch creation, scoped implementation, tests, full verification, Conventional Commits, push, and pull requests.
---

# Feature Workflow

Use this workflow for any non-trivial change in this repository. Read `AGENTS.md` first; it is the source of truth.

## 1. Start from main

```bash
git status
git switch main
git pull --ff-only
git switch -c <type>/<short-name>
```

- Branch prefixes: `feat/`, `fix/`, `refactor/`, `docs/`, `test/`, `chore/`.
- Example: `feat/column-pinning`.
- Never commit directly to `main`.
- If the previous task was merged, start a new branch from the updated `main`; do not continue the merged branch.

## 2. Plan and scope

- Identify the public API impact and the smallest coherent change.
- For multi-step work create a todo list and keep it current.
- Keep the change focused; do not mix unrelated refactors.
- Check whether `AGENTS.md`, the demo, or public exports need updating.

## 3. Implement

Follow `AGENTS.md`, especially:

- `DataGrid.tsx` owns state; child components stay presentational.
- New public types in `types.ts`, pure helpers in `utils.ts`.
- Public API changes only through `src/index.ts` and `src/components/DataGrid/index.ts`.
- Styles in `DataGrid.css`, classes prefixed `pdg`, colors via `--pdg-*`.
- Keep `react`, `react-dom`, `react/jsx-runtime` external in `vite.config.ts`.
- Do not edit `dist/`; it is generated.
- No new dependencies without a clear reason.
- No comments unless they are necessary.

## 4. Tests

- Add or update tests in `src/components/DataGrid/DataGrid.test.tsx` for every behavior change.
- Use role-based queries (`getByRole`, `getByLabelText`).
- Account for jsdom limits: zero-size `getBoundingClientRect`, optional chaining for pointer capture.
- Prefer `fireEvent`, matching the existing tests.

## 5. Verify before commit

Run the full gate:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

Do not commit if any step fails. Re-run the full gate after fixing.

## 6. Review and commit

```bash
git status
git diff
```

- Stage only intended files.
- Never commit `node_modules/`, `dist/`, `.idea/`, secrets, or local `.env`.
- Make atomic commits in Conventional Commits format:

```text
type(scope): summary
```

- English, imperative mood, max 72 characters. Example: `feat(datagrid): add column pinning`.
- Split unrelated work into separate commits (for example, component feature and demo data).
- Do not amend published commits or force-push shared branches.
- Commit only when the user explicitly asks.

## 7. Push and PR

Push and open a PR only when the user explicitly asks.

```bash
git push -u origin <branch>
gh pr create --base main --head <branch> --title "<same style>" --body "..."
```

The PR body must include:

- what changed;
- why;
- how it was verified (commands and results).

After pushing, report the PR URL. If `gh` is unavailable, provide the compare URL from the push output.

## 8. After merge

```bash
git switch main
git pull --ff-only
git branch -d <branch>
```

Delete the remote branch if the platform did not.

## Checklist

- [ ] Branch created from up-to-date `main`
- [ ] Change scoped and follows architecture rules
- [ ] Tests added or updated
- [ ] `typecheck`, `lint`, `test`, `build` pass
- [ ] Diff reviewed; no generated files or secrets
- [ ] Conventional Commit created
- [ ] Branch pushed
- [ ] PR opened with what/why/verification
