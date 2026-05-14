---
name: docs-sync
description: Use this skill to update the centralized OpenZeppelin docs repo after a smart contracts library changes. Trigger after a contracts release, a merged PR in a contracts library, or any time a docs slice (library + version) needs to be brought back in line with the contracts repo. The skill takes two contract commits (BASE_COMMIT, HEAD_COMMIT) as the source of truth and produces docs edits that follow the Diátaxis framework. Use whenever the user says "sync docs for contracts-sui", "update docs after the contracts PR", "regenerate API reference for v1.x", or "docs-sync".
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
inputs:
  mode:
    type: choice
    prompt: "Run mode. interactive shows structured proposals at each gate and waits for approval; automatic infers from config and runs end-to-end without prompts."
    options:
      - interactive
      - automatic
    default: interactive
    required: false
  contracts_repo_path:
    type: text
    prompt: "Absolute filesystem path to the contracts repo (the source of truth). Must be a git repo, must NOT be the same as the docs repo."
    required: true
  docs_repo_path:
    type: text
    prompt: "Absolute filesystem path to the docs repo (where edits will land). Leave blank to use the current working directory."
    required: false
  base_commit:
    type: text
    prompt: "BASE_COMMIT — git SHA, tag, or ref in the contracts repo marking the START of the diff (typically the previous release tag)."
    required: true
  head_commit:
    type: text
    prompt: "HEAD_COMMIT — git SHA, tag, or ref in the contracts repo marking the END of the diff (typically the new release tag, or HEAD)."
    required: true
  library_id:
    type: text
    prompt: "LIBRARY_ID — the docs slice to update (e.g., contracts-sui). Must match a config file at skills/docs-sync/config/libraries/<library_id>.yml."
    required: true
  docs_version:
    type: text
    prompt: "DOCS_VERSION — the version directory inside the slice to edit (e.g., 1.x)."
    required: true
  release_version:
    type: text
    prompt: "RELEASE_VERSION — the contracts release tag this sync targets (e.g., v1.2.0). Used for source-link version pins and release notes."
    required: true
  docs_update_scope:
    type: choice
    prompt: "Scope of docs to update. full = everything the matrix requires; api-only = API reference + nav + source links only; guides-only = guides/tutorials/explanations + snippets only."
    options:
      - full
      - api-only
      - guides-only
    default: full
    required: false
  target_audience:
    type: text
    prompt: "TARGET_AUDIENCE override. Leave blank to use the value in the slice config."
    required: false
  docs_tone:
    type: text
    prompt: "DOCS_TONE override. Leave blank to use the value in the slice config."
    required: false
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

## Inputs

All required inputs are declared in the frontmatter `inputs` schema and
gathered by the harness before the skill body runs. The skill body must
not prompt for inputs interactively; if a required input is missing or
fails validation, return a clear error message that names the field and
let the caller re-invoke.

The full input set is:

| Input                | Required | Notes                                            |
|----------------------|----------|--------------------------------------------------|
| `mode`               | no       | `interactive` (default) or `automatic`           |
| `contracts_repo_path`| yes      | absolute path; must be a git repo                |
| `docs_repo_path`     | no       | defaults to current working directory            |
| `base_commit`        | yes      | git SHA / tag / ref in the contracts repo        |
| `head_commit`        | yes      | git SHA / tag / ref in the contracts repo        |
| `library_id`         | yes      | must have `config/libraries/<library_id>.yml`    |
| `docs_version`       | yes      | e.g. `1.x`                                       |
| `release_version`    | yes      | e.g. `v1.2.0`                                    |
| `docs_update_scope`  | no       | `full` (default), `api-only`, `guides-only`      |
| `target_audience`    | no       | overrides config                                 |
| `docs_tone`          | no       | overrides config                                 |

`process.md` Step 0 validates these and applies safe defaults. In
`automatic` mode, missing or invalid required inputs are a hard failure
— never invent SHAs, paths, or versions.

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

## Mode behavior

- **interactive**: Runs through structured proposal gates (see below).
  Stops after each gate and waits for the user to approve, refine, or
  reject the plan. API reference edits within an approved plan proceed
  deterministically; broad guide/tutorial/explanation rewrites need
  per-page approval.
- **automatic**: Skips all gates. Applies every matrix-required update
  within scope, records every assumption in the report. If a required
  decision cannot be inferred safely, stops or records
  `needs-human-review` rather than fabricating content.

## Interactive gates

Interactive runs **MUST** stop at each of the following gates and wait
for explicit user approval before continuing. The skill does this by
emitting a structured proposal block and ending its turn — the user's
next message is the approval (or refinement). Do not use `AskUserQuestion` or any other interactive tool at any gate; gates are pure text + end-of-turn.

| Gate                      | Stop point             | What is shown                                                                              |
|---------------------------|------------------------|--------------------------------------------------------------------------------------------|
| **G1 — Inputs & config**  | after Step 2           | resolved inputs, slice paths, automation defaults; flag missing/odd values                 |
| **G2 — Public API delta** | after Step 9           | added / removed / changed modules, functions, structs, events, errors with signatures      |
| **G3 — Docs edit plan**   | after Step 11          | every doc file to be **created**, **edited**, or **deleted**, grouped by category, with the API items each one covers and matrix-required pages that are out of scope |
| **G4 — Per-page rewrites**| before each broad rewrite in Step 13 | the file path, the sections to be rewritten, and the rationale (Diátaxis category, matrix row) |

Each proposal block uses the templates in `references/proposals/` (see
that directory's `README.md`). Approval phrases the skill should accept:
"approve", "looks good", "proceed", "yes". Anything else is treated as a
refinement — apply the requested changes, re-emit the proposal, and wait
again.

In `automatic` mode, gates are skipped and the proposal contents are
written to the final report instead.

## Scope behavior

- `full`: apply the full matrix.
- `api-only`: update API reference, source links, stale identifiers in
  API pages, and API navigation only. Report skipped guide/tutorial/
  explanation/example/release-note work as out of scope.
- `guides-only`: update guides, tutorials, explanations, and snippets.
  Still inspect the API diff so stale prose can be found, but do not
  regenerate reference pages.

(Targeted scope by path list is not exposed as an input; if a caller
needs it, they can refine the G3 plan before approving.)

## Config memory

Always load:

```
skills/docs-sync/config/libraries/<library_id>.yml
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
2. `references/proposals/` — proposal-block templates for the G1–G4 gates.
3. `references/rules/change-classification.md` — how to classify each
   contract change.
4. `references/rules/doc-update-matrix.md` — what docs each change type
   forces.
5. `references/rules/api-reference-rules.md` — required for API
   reference updates.
6. `references/rules/diataxis-rules.md` — required when creating or
   reshaping tutorial, guide, explanation, or reference content.
7. Templates under `references/templates/` — only when creating new
   pages or replacing a broken structure.
8. `references/rules/docs-pr-checklist.md` and
   `references/reports/docs-sync-report-template.md` — final validation
   and summary.

Use the validation specs under `references/checks/` as check
definitions. They are not executable scripts unless later replaced with
real tooling.

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
