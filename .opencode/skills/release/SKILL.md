---
name: release
description: Use when preparing or publishing a new perfect-datagrid version to npm. Covers version choice, the release branch, verification, tarball inspection, the release PR, tagging, publishing with 2FA, and post-release checks.
---

# Release

Use this workflow to publish a new version of `perfect-datagrid` to the public npm registry. Read `AGENTS.md` first.

Only commit, push, merge, tag, and publish when the user explicitly asks for a release. Prepare the release before publishing; never bump a version that is already on npm.

## 1. Preconditions

```bash
git status
git switch main
git pull --ff-only
npm whoami
npm view perfect-datagrid version dist-tags --json
```

- Working tree must be clean and `main` must contain everything meant for the release.
- `npm whoami` must return the maintainer account. `401 Unauthorized` means the token expired — run `npm login` again.
- `npm view` tells which versions already exist. Publishing over an existing version fails with `You cannot publish over the previously published versions: X.Y.Z`.
- The registry must be `https://registry.npmjs.org/`.

## 2. Choose the version

Follow semver for the public API in `src/components/DataGrid/types.ts`:

- `patch` — bug fixes only, no API change;
- `minor` — new props, columns options, exports or behaviour;
- `major` — breaking changes to props, types or defaults.

Keep the version in step with the user's decision; mention it before bumping if the change type is ambiguous.

## 3. Release branch

```bash
git switch -c chore/release-<version>
npm version <version> --no-git-tag-version
```

- The branch prefix is `chore/release-`.
- `npm version --no-git-tag-version` updates `package.json` and `package-lock.json` without creating a commit or tag.
- Verify the version: `npm pkg get version`.

## 4. Metadata check

Confirm `package.json` still has:

- `files: ["dist"]`, `main`, `module`, `types`, and the `exports` map for `.` and `./style.css`;
- `peerDependencies` on `react`/`react-dom` and `engines.node`;
- `license`, `repository`, `homepage`, `bugs`, `publishConfig.access: "public"`.

Update `README.md` when public API, props, columns options, or behaviour changed. `README.md` and `LICENSE` are always included in the tarball even though `files` only lists `dist`.

## 5. Full verification

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

- Do not continue if any step fails.
- `build` regenerates `dist/` (ESM, CJS, source maps, `d.ts`, `style.css`). Never edit or commit `dist/`.
- New public types must be re-exported through `src/components/DataGrid/index.ts` and `src/index.ts`; check them in `dist/components/DataGrid/types.d.ts`.

## 6. Inspect the tarball

```bash
npm pack --dry-run
```

Expected tarball: `dist/index.js`, `dist/index.cjs`, both source maps, `dist/index.d.ts` plus component `d.ts` files, `dist/style.css`, `README.md`, `LICENSE`, `package.json`. Roughly 23 files and 60 kB packed.

Fail the release if `node_modules/`, `.idea/`, `.env`, tests, or `src/` are included, or if the CSS entry or declaration files are missing.

Optional smoke test:

```bash
tmp=$(mktemp -d)
npm pack --pack-destination "$tmp"
cd "$tmp" && npm init -y >/dev/null && npm install ./perfect-datagrid-<version>.tgz
node -e "import('perfect-datagrid').then((m) => console.log(Object.keys(m)))"
```

## 7. Release commit and PR

```bash
git add package.json package-lock.json
git commit -m "chore(release): bump version to <version>"
git push -u origin chore/release-<version>
gh pr create --base main --head chore/release-<version> \
  --title "chore(release): <version>" \
  --body "<what changed since the previous version, why, verification commands and results>"
```

- The commit only bumps the version; changelog and docs changes belong to their own feature PRs.
- The PR body lists the user-visible changes since the last published version and the verification output.

## 8. Merge and tag

After green checks and the user's approval:

```bash
gh pr merge <number> --merge --delete-branch
git switch main && git pull --ff-only
npm run build
git tag -a v<version> -m "v<version>"
git push origin v<version>
```

- Tag `main` only after the release PR is merged.
- Rebuild on `main` so the published artifacts come from the merged commit.

## 9. Publish

```bash
npm publish --access public
```

- The package is unscoped and public; `--access public` matches `publishConfig`.
- npm requires 2FA or a granular access token with bypass 2FA enabled.

Failure modes:

- `403 ... Two-factor authentication ... required` — pass a fresh code with `npm publish --access public --otp=<code>`, enable 2FA on the account, or use a bypass-2FA token.
- `401 Unauthorized` on `npm whoami`/`npm publish` — the session expired; run `npm login` again.
- `404 Not Found` on `PUT` — npm hides permission problems: the token is invalid, belongs to another account, or lacks publish rights.
- `You cannot publish over the previously published versions` — the version is already used; bump and restart from step 2.

If the user prefers to publish manually, hand over the exact command and wait for confirmation instead of retrying.

## 10. Verify the publication

```bash
npm view perfect-datagrid version dist-tags.latest
npm view perfect-datagrid@<version> files --json
```

- `version` and `dist-tags.latest` must point at the new version.
- Check that `dist/style.css` and `dist/index.d.ts` are reachable through the `exports` map.
- Optionally repeat the temp-directory install against the registry version instead of the tarball.

## 11. After release

- The next change starts from the updated `main`; the version stays until the next release.
- Prefer `npm deprecate perfect-datagrid@<version> "<reason>"` and a patch release over unpublishing.
- Never reuse a published version number.

## Checklist

- [ ] `main` is clean, up to date, and contains the intended changes
- [ ] `npm whoami` works and 2FA or a bypass token is available
- [ ] Version chosen per semver and absent from `npm view perfect-datagrid versions`
- [ ] Release branch `chore/release-<version>` created from `main`
- [ ] `package.json` version and lockfile updated
- [ ] `typecheck`, `lint`, `test`, `build` pass
- [ ] `npm pack --dry-run` contains only `dist`, README, LICENSE, `package.json`
- [ ] Release commit and PR created; PR body lists changes and verification
- [ ] PR merged after green checks
- [ ] `npm run build` on merged `main`
- [ ] Annotated tag `v<version>` pushed
- [ ] `npm publish --access public` succeeded
- [ ] `npm view` reports the new `latest`
