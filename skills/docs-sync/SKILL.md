---
name: docs-sync
description: Update the centralized OpenZeppelin docs repo after a smart contracts library changes. Use after a contracts release, a merged PR in a contracts library, or any time you need to bring a docs slice (library + version) back in line with the contracts repo. The skill takes two contract commits (BASE_COMMIT, HEAD_COMMIT) as the source of truth and produces docs edits that follow the Diátaxis framework. Trigger on phrases like "sync docs for contracts-sui", "update docs after the contracts PR", "regenerate API reference for v1.x", "docs-sync".
---

# docs-sync

Use this skill when the contracts library has changed and the centralized
docs repo needs to be brought back in sync. The skill lives **inside the
docs repo**; the contracts repo is supplied at runtime.

## When to use

- A contracts library has merged a PR or cut a release and the docs need
  updating.
- The user names a docs slice and two commits in the contracts repo.
- The user asks to "sync docs", "update API reference for `<LIBRARY_ID>`",
  or "document the changes between commit A and commit B".

Do **not** trigger this skill for:

- Pure docs cleanup unrelated to contracts changes (use a regular edit).
- Changes that have not yet landed in a commit on the contracts repo.

## Required runtime inputs

Collect these before editing:

- `<MODE>`: `interactive` or `automatic`.
- `<CONTRACTS_REPO_PATH>`: local path to the contracts repo (runtime).
- `<DOCS_REPO_PATH>`: local path to this docs repo (runtime).
- `<BASE_COMMIT>`: contracts commit immediately **before** the change set.
- `<HEAD_COMMIT>`: contracts commit at the **tip** of the change set.
- `<LIBRARY_ID>`: docs slice id (e.g. `contracts-sui`).
- `<DOCS_VERSION>`: docs version (e.g. `1.x`).
- `<RELEASE_VERSION>`: human-facing release tag (e.g. `v1.1.0`).
- `<DOCS_UPDATE_SCOPE>`: `full`, `api-only`, `guides-only`, or
  `targeted:<paths>`. Default: `full`.

Optional:

- `<TARGET_AUDIENCE>`
- `<DOCS_TONE>`

## Source-of-truth constraint

The contracts diff is computed by the agent itself, from two commits:

```
git -C <CONTRACTS_REPO_PATH> diff <BASE_COMMIT>..<HEAD_COMMIT>
```

The skill must **not** accept any of the following as the primary source
of truth:

- Raw pasted diffs.
- Patch files.
- Uncommitted local changes.
- PR descriptions or commit messages.
- Informal change summaries.

## Mode selection

1. If the caller passed `<MODE>`, use it.
2. Otherwise read `automation.default_mode` from config
   (`skills/docs-sync/config/libraries/<LIBRARY_ID>.yml`).
3. Otherwise default to `interactive`.

- **interactive**: summarize and classify first. Ask only questions that
  change scope, examples, release notes, audience, or security framing.
  API reference edits may proceed deterministically; broad guide,
  tutorial, or explanation rewrites need confirmation.
- **automatic**: ask no questions. Infer from config and sibling pages,
  apply all required matrix updates within scope, and record assumptions.
  If a required decision cannot be inferred safely, stop or leave a
  `needs-human-review` finding instead of fabricating content.

## Scope selection

- `full`: apply the full matrix.
- `api-only`: update API reference, source links, stale identifiers in
  API pages, and API navigation only. Report skipped guide/tutorial/
  explanation/example/release-note work as out of scope.
- `guides-only`: update guides, tutorials, explanations, and snippets.
  Still inspect the API diff so stale prose can be found, but do not
  regenerate reference pages.
- `targeted:<paths>`: edit only the listed docs paths plus required
  navigation changes for those paths. Report every matrix-required
  update outside the target set as skipped.

## Config memory

Always load:

```
skills/docs-sync/config/libraries/<LIBRARY_ID>.yml
```

This file is committed to the docs repo and is the canonical source of
docs slice paths, navigation system, examples style, security rules, and
automation defaults. Read `references/rules/config-rules.md` only when
config is missing, malformed, or needs a durable convention update.

All `docs.*` paths in config are **relative to `<DOCS_REPO_PATH>`**. Never
hard-code absolute filesystem paths in config, prompts, reports, or
generated docs.

## Reference Files

Read only what the run needs:

1. `process.md` — the deterministic end-to-end workflow.
2. `references/rules/change-classification.md` — how to classify each
   contract change.
3. `references/rules/doc-update-matrix.md` — what docs each change type
   forces.
4. `references/rules/api-reference-rules.md` — required for API
   reference updates.
5. `references/rules/diataxis-rules.md` — required when creating or reshaping tutorial,
   guide, explanation, or reference content.
6. Templates under `references/templates/` — only when creating new
   pages or replacing a broken structure.
7. `references/rules/docs-pr-checklist.md` and
   `references/reports/docs-sync-report-template.md` — final validation
   and summary.

Use the validation specs under `references/checks/` as check definitions. They are
not executable scripts unless later replaced with real tooling.

## Scope of edits

Edit only:

- Files inside the resolved docs slice
  (`docs.library_root` and `docs.version_root` from config, recursively).
- The matching navigation config (`docs.nav_config_path`).
- Shared example files **only if** the matrix says they must change.

Do **not**:

- Touch other docs slices in the centralized repo.
- Create or edit `meta.json` files. The docs repo uses centralized
  navigation under `src/navigation/` — see the local conventions file
  at `docs.local_conventions_path` for slice-specific rules.
- Modify source/doc comments in the contracts repo unless
  `automation.allow_source_comment_edits: true` **and** the user asked.

## End of run

Run through `references/rules/docs-pr-checklist.md` before claiming the
run is done. End with a compact docs-sync report following
`references/reports/docs-sync-report-template.md`. Do not create a
report file unless the user asks for one.
