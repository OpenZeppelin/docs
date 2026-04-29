# docs-sync process

A deterministic, top-to-bottom workflow. Steps run in order. Do not
reorder. If a step fails, stop and surface the failure rather than
skipping ahead.

All paths in this document are relative to `<DOCS_REPO_PATH>` unless
explicitly prefixed with `<CONTRACTS_REPO_PATH>`.

---

## Step 0 — Collect runtime inputs

Inputs may arrive in two ways:

1. **Pre-supplied** in the invocation prompt (`LIBRARY_ID=contracts-sui`,
   `BASE_COMMIT=abc123`, etc.).
2. **Collected interactively** here, using the `AskUserQuestion` tool,
   for any required input the caller did not supply.

Required inputs (see SKILL.md for full list): `<MODE>`,
`<CONTRACTS_REPO_PATH>`, `<DOCS_REPO_PATH>`, `<BASE_COMMIT>`,
`<HEAD_COMMIT>`, `<LIBRARY_ID>`, `<DOCS_VERSION>`, `<RELEASE_VERSION>`,
`<DOCS_UPDATE_SCOPE>`.

### 0.1 Resolve from caller args and defaults first

Before prompting, fill in what can be inferred without the user:

- `<DOCS_REPO_PATH>`: default to the current working directory if it is
  the docs repo (verify by checking for `skills/docs-sync/SKILL.md`).
- `<LIBRARY_ID>`: if exactly one file exists under
  `skills/docs-sync/config/libraries/*.yml`, use that slice id.
- `<DOCS_VERSION>`: if the resolved slice has exactly one version
  directory under `docs.version_root`'s parent, use that.
- `<DOCS_UPDATE_SCOPE>`: default to `full` unless the caller scoped it.
- `<MODE>`: if not supplied, read `automation.default_mode` from the
  resolved config; otherwise default to `interactive`.

Record every default that was applied so the final report can list them
as assumptions.

### 0.2 If `<MODE>` resolves to `automatic`, do not prompt

In `automatic` mode, missing required inputs are a hard failure. Stop
with a clear message naming the missing fields. Do not invent SHAs,
versions, or paths.

### 0.3 Otherwise, prompt for missing inputs

For each input still missing, ask the user via `AskUserQuestion`. Group
related inputs into a single call (the tool accepts up to 4 questions
per call). Use the templates below.

**Bounded inputs — multiple choice** (let the user pick "Other" only
when the listed options truly do not fit):

- `<MODE>`: options `interactive` (Recommended) and `automatic`.
- `<DOCS_UPDATE_SCOPE>`: options `full` (Recommended), `api-only`,
  `guides-only`, `targeted:<paths>`.
- `<LIBRARY_ID>`: options enumerated from the filenames under
  `skills/docs-sync/config/libraries/*.yml`. If only one slice exists,
  skip the prompt and apply it as the default.

**Free-form inputs — ask via `AskUserQuestion` with a "Recommended"
default option plus "Other" for custom input:**

- `<CONTRACTS_REPO_PATH>`: an absolute filesystem path. No safe default
  unless the user has previously supplied one this session.
- `<BASE_COMMIT>` / `<HEAD_COMMIT>`: commit SHAs or refs in the
  contracts repo. If reasonable, suggest the latest tag as `<BASE>` and
  `HEAD` as `<HEAD>`; let the user override.
- `<DOCS_VERSION>`: e.g. `1.x`. Suggest the highest existing version
  directory in the slice.
- `<RELEASE_VERSION>`: e.g. `v1.2.0`. No safe default; ask.

### 0.4 Validate as you collect

After collection, validate inline and re-prompt on failure rather than
deferring to later steps:

- Paths exist and are git repos (`git -C <path> rev-parse
  --is-inside-work-tree`).
- `<CONTRACTS_REPO_PATH>` is not the same as `<DOCS_REPO_PATH>`.
- `<BASE_COMMIT>` and `<HEAD_COMMIT>` resolve in the contracts repo
  (`git -C <CONTRACTS_REPO_PATH> rev-parse --verify <SHA>^{commit}`).
- `<LIBRARY_ID>` has a config file at
  `skills/docs-sync/config/libraries/<LIBRARY_ID>.yml`.

If a validation fails in interactive mode, re-prompt for just that
field. If it fails in automatic mode (e.g. caller supplied a bad SHA),
stop with a clear error.

Once all inputs are present and validated, proceed to Step 1. Steps 3
and 4 below still run, but become no-ops because the same checks have
already passed.

## Step 1 — Select mode

1. If the caller passed `<MODE>`, use it.
2. Otherwise read `automation.default_mode` from the config file
   (Step 2).
3. Otherwise default to `interactive`.

Mode behavior:

- `interactive`: summarize and classify before broad edits. Ask only
  questions whose answers change scope, examples, release notes,
  audience, or security framing. API reference edits can proceed
  deterministically; broad guide/tutorial/explanation rewrites need
  confirmation.
- `automatic`: ask no questions. Infer from config and sibling pages.
  Record assumptions. If a required decision cannot be inferred safely,
  stop or record `needs-human-review` rather than inventing context.

## Step 2 — Load config memory

1. Resolve `<CONFIG_PATH>`. Default:
   `skills/docs-sync/config/libraries/<LIBRARY_ID>.yml`.
2. If the file does not exist, **stop**. Do not fabricate a config; ask
   the user (interactive) or fail with a clear message (automatic).
3. Parse the file as YAML.
4. Read `library.id`, `library.language`, `docs.*`, `navigation.*`,
   `examples.*`, `security.*`, `release.*`, `automation.*`.
5. Treat all `docs.*` paths as relative to `<DOCS_REPO_PATH>`.
6. Apply optional overrides from runtime: `<TARGET_AUDIENCE>` overrides
   `docs.target_audience`; `<DOCS_TONE>` overrides `docs.tone`.

## Step 3 — Resolve contracts repo and docs repo

1. Verify `<CONTRACTS_REPO_PATH>` exists and is a git repository:
   `git -C <CONTRACTS_REPO_PATH> rev-parse --is-inside-work-tree`.
2. Verify `<DOCS_REPO_PATH>` exists and is a git repository.
3. Confirm `<CONTRACTS_REPO_PATH>` is **not** the same as
   `<DOCS_REPO_PATH>`.
4. Confirm the docs repo's working tree is clean **enough** to make
   reviewable edits (no unrelated unstaged changes that would muddy the
   diff). Warn but continue if not.

## Step 4 — Verify base and head commits

```
git -C <CONTRACTS_REPO_PATH> rev-parse --verify <BASE_COMMIT>^{commit}
git -C <CONTRACTS_REPO_PATH> rev-parse --verify <HEAD_COMMIT>^{commit}
```

Both must resolve. If either fails:

- Interactive: ask the user to fetch the right revision.
- Automatic: stop with a clear error.

Confirm `<BASE_COMMIT>` is an ancestor of `<HEAD_COMMIT>`:

```
git -C <CONTRACTS_REPO_PATH> merge-base --is-ancestor <BASE_COMMIT> <HEAD_COMMIT>
```

If not, warn (the diff will still be computed, but the relationship is
unusual — record it in the report).

## Step 5 — Compute the contracts diff

```
git -C <CONTRACTS_REPO_PATH> diff --stat <BASE_COMMIT>..<HEAD_COMMIT>
git -C <CONTRACTS_REPO_PATH> diff <BASE_COMMIT>..<HEAD_COMMIT>
```

Persist the output for use in Steps 6–10. Also gather:

```
git -C <CONTRACTS_REPO_PATH> log --pretty=oneline <BASE_COMMIT>..<HEAD_COMMIT>
```

…to label classifications in the report.

This diff is the **only** accepted source of truth for what changed.
Anything in chat (PR descriptions, summaries, pasted snippets) is
context, not authority.

## Step 6 — Resolve the target docs slice

Resolve and verify each slice path on disk:

| Variable                       | Source                                         |
| ------------------------------ | ---------------------------------------------- |
| `<DOCS_CONTENT_ROOT>`          | `docs.content_root`                            |
| `<LIBRARY_DOCS_ROOT>`          | `docs.library_root`                            |
| `<VERSION_DOCS_ROOT>`          | `docs.version_root`                            |
| `<API_REFERENCE_PATH>`         | `docs.api_reference_path`                      |
| `<NAV_CONFIG_PATH>`            | `docs.nav_config_path`                         |
| `<LOCAL_DOCS_CONVENTIONS_PATH>`| `docs.local_conventions_path`                  |
| `<PRODUCT_INDEX_PATH>`         | `docs.product_index_path`                      |
| `<VERSION_INDEX_PATH>`         | `docs.version_index_path`                      |

For each, check that the file or directory exists under
`<DOCS_REPO_PATH>`. For missing pieces:

1. If `docs.library_root` exists but `docs.version_root` does not, stop;
   a new version needs an explicit setup decision.
2. If `docs.api_reference_path` is missing and the scoped run requires
   API reference updates, create it and record the assumption.
3. If `docs.nav_config_path` is missing, stop; do not invent navigation.
4. If `docs.local_conventions_path` is missing, fall back to repo-root
   `AGENTS.md` and record the fallback.

## Step 7 — Read local docs conventions

If `<LOCAL_DOCS_CONVENTIONS_PATH>` exists, read it and treat it as
authoritative for that docs slice (formatting, code style in snippets,
section ordering, naming conventions, table formats, etc.).

If it does not exist, fall back to the repo-root `AGENTS.md` (e.g.
`<DOCS_REPO_PATH>/AGENTS.md`) for global rules and record the fallback.

For Sui specifically:

- Local conventions live at `content/contracts-sui/AGENTS.md`.
- API Reference function entry order is **description, then `Aborts ...`,
  then `Emits ...`**, with only NOTE/INFO/WARNING blocks afterwards.

## Step 8 — Inspect contract changes

From the diff in Step 5, group hunks by file and by language construct.
For each changed file, record:

- File path (relative to `<CONTRACTS_REPO_PATH>`).
- Whether it is part of the public API surface (sources/, package
  manifests) or internal (tests/, scripts/, internal helpers).
- The high-level construct affected: module, struct, function, constant,
  event, error, ability, capability, doc comment.

Skip files outside the contracts library's documented surface (CI,
internal tooling, vendored libs). Record what was skipped.

## Step 9 — Extract or compare the public API surface

Use `references/checks/extract_public_api.md` as the extraction
specification to extract the public API surface at both `<BASE_COMMIT>`
and `<HEAD_COMMIT>`. Use `references/checks/compare_public_api.md` as
the comparison spec. If executable project tooling exists, prefer it and
record the command. Produce a structured list:

- Added modules / packages.
- Removed modules / packages.
- Added public functions, with signatures.
- Removed public functions.
- Changed function signatures (parameter types/order, return type,
  visibility, abilities).
- Added or changed structs/types and their fields/abilities.
- Added or removed constants.
- Added or removed events.
- Added or removed errors / abort codes.
- Changed doc comments on public items.

The spec is language-agnostic; for `MOVE_SUI`, parse `module ...`
declarations, `public fun`/`entry` signatures, `struct ... has ...`
declarations, `const`s, error constants (`E*`), and event structs.

## Step 10 — Classify changes

Apply `references/rules/change-classification.md` to the structured
list from Step 9 and to the raw diff from Step 5. Each change becomes
one or more rows of:

| File / construct | Classification | Evidence (commit, hunk) |

Classification values are exactly the names in
`references/rules/change-classification.md`.

## Step 11 — Decide required docs updates

For each classified change, look up the corresponding row in
`references/rules/doc-update-matrix.md`. The matrix tells you:

- Whether API reference must update.
- Whether a guide, tutorial, or explanation must update.
- Whether examples must update.
- Whether navigation must update.
- Whether changelog/release notes must update.
- Whether a security warning is required.
- The default behavior in automatic mode.
- The questions to ask in interactive mode.

Aggregate the required updates per docs page so the same page is not
edited multiple times in incompatible ways.

Apply `<DOCS_UPDATE_SCOPE>`:

- `full`: keep every matrix-required update.
- `api-only`: keep API reference, API source-link, API stale identifier,
  and API navigation updates only; report other required work as skipped.
- `guides-only`: keep guide, tutorial, explanation, and snippet updates;
  do not regenerate API reference pages.
- `targeted:<paths>`: keep only listed paths plus navigation changes
  required for those paths; report omitted matrix-required work.

In `interactive` mode, present the aggregated plan and wait for
confirmation before broad rewrites of guides, tutorials, or
explanations. API reference updates proceed without confirmation but
follow `references/rules/api-reference-rules.md`.

## Step 12 — Update API reference

Follow `references/rules/api-reference-rules.md`:

1. For each touched module, read the existing API reference page (if
   any) under `<API_REFERENCE_PATH>`.
2. Regenerate the structured sections (Types, Functions, Events, Errors)
   from the source.
3. Preserve existing prose that is still accurate; replace prose that no
   longer matches the source.
4. Honor the entry order from `<LOCAL_DOCS_CONVENTIONS_PATH>` (for Sui:
   description, then Aborts, then Emits, then NOTE/INFO/WARNING).
5. If a public item has weak or missing source comments, generate only
   the deterministic parts and add a `needs-human-review` report item.
   Add inline TODO comments only when there is no better accurate prose;
   unresolved TODOs fail validation when
   `automation.fail_on_unresolved_placeholders: true`.
6. Update source links / version pins (`APIGithubLinkHeader` for Sui)
   to point to `<RELEASE_VERSION>` (or `<HEAD_COMMIT>` if no matching
   tag exists).

## Step 13 — Update guides, tutorials, and explanations

For every guide/tutorial/explanation flagged in Step 11:

1. Use `references/rules/diataxis-rules.md` to confirm the page is
   still in the right Diátaxis category. If not, propose a move
   (interactive) or record it as a `needs-human-review` finding
   (automatic).
2. Apply the matching template (`references/templates/guide-template.md`,
   `references/templates/tutorial-template.md`,
   `references/templates/explanation-template.md`) when creating new
   pages.
3. When updating existing pages, edit only the sections affected by the
   change set. Do not rewrite working content.
4. Update inline code snippets to match the new API. Update prose that
   describes signatures, arguments, abort conditions, or events.
5. Add or update security warnings according to
   `security.warning_style` and `security.require_security_sections_for`
   from config.

## Step 14 — Update examples

If the docs slice has an `examples_root`, update it. If examples live as
fenced code blocks inside MDX, update those.

- Replace stale identifiers, package addresses, and signatures.
- Run `examples.compile_command` if set; otherwise apply
  `examples.snippet_validation` (e.g. `syntax`-only validation).
- Do not create new example projects unless the matrix requires one
  (e.g. `New module/package`).

## Step 15 — Update navigation / sidebar

Open `<NAV_CONFIG_PATH>` and apply the deltas:

- Add new modules to the `Packages` and `API Reference` folders (or the
  equivalent labels for the slice).
- Remove entries for deleted modules.
- Rename entries when modules were renamed.
- Preserve existing order otherwise; insert new entries alphabetically
  within their folder.
- Do **not** create or edit `meta.json` files. The docs repo uses
  centralized JSON navigation under `src/navigation/`.

For Sui specifically, edit `src/navigation/sui/current.json`.

## Step 16 — Validate

Run, in order. The files under `references/checks/` are validation
specs, not guaranteed executables; use project tooling or implement the
checks directly from the specs.

1. **Public API coverage**: every public item from Step 9 has a
   reference entry. Use `references/checks/detect_missing_pages.md`.
2. **Stale identifiers**: search the docs slice for removed names,
   package ids, addresses, and old signatures.
   `references/checks/find_stale_identifiers.md`.
3. **Code snippets**: parse fenced code blocks per
   `examples.snippet_validation`. `references/checks/check_code_snippets.md`.
4. **Links**: validate internal links and anchors within the slice.
   `references/checks/check_links.md`.
5. **Navigation consistency**: every doc page reachable via
   `<NAV_CONFIG_PATH>` exists, and every existing reference page is
   reachable via navigation. `references/checks/check_nav_consistency.md`.
6. **Placeholder check**: no unresolved `<TODO>`, `<FILL>`, or template
   placeholder tokens remain. If
   `automation.fail_on_unresolved_placeholders: true` and any are
   found, stop.

Each validation produces a pass/fail status and a list of findings. All
findings go into the report.

## Step 17 — Produce docs PR summary

Walk through `references/rules/docs-pr-checklist.md`. Do not skip
items. Mark each as pass/fail/N/A with one-line evidence.

Then fill out the compact
`references/reports/docs-sync-report-template.md` in the final run
output. Do not create `docs-sync-report.md` unless the user asks.

The report includes a suggested PR title and body, ready for `gh pr
create`.

## Step 18 — Record assumptions and unresolved issues

Anything that wasn't directly evidenced by the diff or the config goes
into the report as either:

- An **assumption** (the agent picked a reasonable default and continued).
- An **unresolved TODO** (the agent could not safely proceed and left a
  marker for a human).

Both lists must be exhaustive. The goal is for the next person — human
or agent — to pick up the work without re-running the whole process.
