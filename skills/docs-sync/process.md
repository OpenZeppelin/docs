# docs-sync process

A deterministic, top-to-bottom workflow. Steps run in order. Do not
reorder. If a step fails, stop and surface the failure rather than
skipping ahead.

All paths in this document are relative to `<DOCS_REPO_PATH>` unless
explicitly prefixed with `<CONTRACTS_REPO_PATH>`.

In `interactive` mode, the workflow stops at four gates (G1–G4) and
waits for explicit user approval. The skill MUST emit a structured
proposal block (templates under `references/proposals/`) and end its
turn at each gate. The skill MUST NOT call `AskUserQuestion` or any
other interactive tool — inputs are gathered by the harness from the
frontmatter `inputs` schema before this process starts. In `automatic`
mode, every gate is skipped and its proposal contents are appended to
the final report.

---

## Step 0 — Validate runtime inputs

Inputs arrive from the frontmatter `inputs` schema (the harness gathers
them upfront). Step 0 validates them and applies safe defaults — it
does not prompt the user.

### 0.1 Apply defaults

For each input that arrived empty, apply:

- `mode`: read `automation.default_mode` from the resolved slice config
  if present; otherwise `interactive`.
- `docs_repo_path`: current working directory, **only if** it is the
  docs repo (verify by checking that `skills/docs-sync/SKILL.md` exists
  inside it). Otherwise this is a hard error.
- `docs_update_scope`: `full`.
- `target_audience` / `docs_tone`: read from slice config; do not invent
  values.

Record every default that was applied so the G1 proposal and the final
report can list them as assumptions.

### 0.2 Validate

For each input, validate inline. On failure, **stop** and return a
single error message that names every failing field — do not partially
proceed.

- `contracts_repo_path` exists and is a git repo:
  `git -C <CONTRACTS_REPO_PATH> rev-parse --is-inside-work-tree`.
- `docs_repo_path` exists and is a git repo.
- `contracts_repo_path` is **not** the same path as `docs_repo_path`.
- `library_id` has a config file at
  `skills/docs-sync/config/libraries/<library_id>.yml`.
- `base_commit` and `head_commit` resolve in the contracts repo:
  `git -C <CONTRACTS_REPO_PATH> rev-parse --verify <SHA>^{commit}`.

In `automatic` mode, any validation failure is a hard error — never
invent SHAs, paths, or versions.

In `interactive` mode, the validation error is the response — the user
re-invokes with corrected inputs. The skill MUST NOT retry on its own.

## Step 1 — Confirm mode

The mode arrives as input. This step normalizes it for the rest of the
process:

- `interactive`: gates G1–G4 are active; broad rewrites need per-page
  approval at G4.
- `automatic`: gates are skipped; assumptions go into the final report.

## Step 2 — Load config memory

1. Resolve `<CONFIG_PATH>`:
   `skills/docs-sync/config/libraries/<library_id>.yml`.
2. If the file does not exist, **stop** with a clear error. Do not
   fabricate a config.
3. Parse the file as YAML.
4. Read `library.id`, `library.language`, `docs.*`, `navigation.*`,
   `examples.*`, `security.*`, `release.*`, `automation.*`.
5. Treat all `docs.*` paths as relative to `<DOCS_REPO_PATH>`.
6. Apply optional overrides from runtime: `target_audience` overrides
   `docs.target_audience`; `docs_tone` overrides `docs.tone`.

---

## 🛑 Gate G1 — Inputs & config confirmation

Active in `interactive` mode only. After Step 2 completes successfully,
emit the **G1 proposal block** (template:
`references/proposals/g1-inputs-and-config.md`) and **end the turn**.

The proposal block MUST contain:

- All resolved inputs, with each defaulted value clearly marked
  `(default applied)`.
- The resolved slice paths (`<LIBRARY_DOCS_ROOT>`, `<VERSION_DOCS_ROOT>`,
  `<API_REFERENCE_PATH>`, `<NAV_CONFIG_PATH>`,
  `<LOCAL_DOCS_CONVENTIONS_PATH>`).
- Mode and scope, with one-line consequences for each.
- Anything missing, ambiguous, or surprising flagged with `⚠️`.
- A trailing line: `Reply "approve" to proceed, or describe corrections.`

When the user replies:

- "approve" / "looks good" / "proceed" / "yes" → continue to Step 3.
- Anything else → treat as refinement, apply the requested changes,
  re-emit the G1 block, and wait again.

In `automatic` mode, append the G1 contents to the final report's
"Resolved inputs" section and continue to Step 3 without stopping.

---

## Step 3 — Resolve contracts repo and docs repo

(Validation in Step 0.2 already covers most of this; redo the checks
that depend on filesystem state at run time.)

1. Confirm the docs repo's working tree is clean **enough** to make
   reviewable edits (no unrelated unstaged changes that would muddy the
   diff). Warn but continue if not.

## Step 4 — Verify base and head commits ancestry

Step 0.2 already verified both commits resolve. Now confirm
`<BASE_COMMIT>` is an ancestor of `<HEAD_COMMIT>`:

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

Persist the output for use in Steps 6–11. Also gather:

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
- Added public functions, with full signatures.
- Removed public functions, with full signatures.
- Changed function signatures (parameter types/order, return type,
  visibility, abilities) — show **before → after** signatures.
- Added or changed structs/types and their fields/abilities.
- Added or removed constants.
- Added or removed events.
- Added or removed errors / abort codes.
- Changed doc comments on public items.

The spec is language-agnostic; for `MOVE_SUI`, parse `module ...`
declarations, `public fun`/`entry` signatures, `struct ... has ...`
declarations, `const`s, error constants (`E*`), and event structs.

This structured list is the input to Gate G2 below — make every entry
self-explanatory (full signature, full module path) so the user can
review without reopening source files.

---

## 🛑 Gate G2 — Public API delta confirmation

Active in `interactive` mode only. After Step 9 completes, emit the
**G2 proposal block** (template:
`references/proposals/g2-api-delta.md`) and **end the turn**.

The proposal block MUST contain, for each category, a bulleted list of
items with full signatures:

```
### Added public functions
- `module::path::function_name(arg: Type, ...): ReturnType`
- ...

### Removed public functions
- `module::path::function_name(arg: Type, ...): ReturnType`
- ...

### Changed function signatures
- `module::path::function_name`
  - before: `(old_arg: OldType): OldReturn`
  - after:  `(new_arg: NewType): NewReturn`
- ...

### Added / removed / changed structs, events, errors, constants
- ...
```

Also include:

- Total counts per category (`Added: 5 functions, 2 structs, …`).
- A "Skipped (out of public surface)" list of contracts files Step 8
  excluded, so the user can spot a wrongly-skipped file.
- A trailing line: `Reply "approve" to proceed to docs planning, or
  describe corrections (e.g. "treat foo as private", "include bar/").`

When the user replies:

- "approve" / "looks good" / "proceed" / "yes" → continue to Step 10.
- Anything else → treat as refinement to the API surface (re-classify,
  re-extract, etc.), re-emit the G2 block, and wait again.

In `automatic` mode, append the G2 contents to the final report's
"Public API delta" section and continue to Step 10 without stopping.

---

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

Build a per-file edit plan with:

- `action`: one of `create`, `edit`, `delete`.
- `path` relative to `<DOCS_REPO_PATH>`.
- `category`: API reference / guide / tutorial / explanation / example /
  navigation / release notes / security warning.
- `covers`: which API items from Step 9 this file addresses (so the
  user can sanity-check coverage).
- `reason`: which matrix row(s) forced this entry.

Also build a parallel "skipped" list for matrix-required updates that
fall outside `<DOCS_UPDATE_SCOPE>` — every skipped item must be
attributed to the scope choice that excluded it.

---

## 🛑 Gate G3 — Docs edit plan confirmation

Active in `interactive` mode only. After Step 11 completes, emit the
**G3 proposal block** (template:
`references/proposals/g3-docs-edit-plan.md`) and **end the turn**.

The proposal block MUST contain, in this order:

```
### Will create
- <path> — <category> — covers: <api items> — reason: <matrix row>
- ...

### Will edit
- <path> — <category> — covers: <api items> — reason: <matrix row>
- ...

### Will delete
- <path> — <category> — reason: <matrix row>
- ...

### Will leave alone (matrix-required but out of <docs_update_scope>)
- <path> — would have been <category> — excluded by scope=<value>
- ...

### Navigation deltas (will apply at Step 15)
- add: <nav entry path>
- remove: <nav entry path>
- rename: <old> -> <new>
```

Also include:

- Total counts (`5 to create, 12 to edit, 1 to delete, 3 skipped`).
- A list of pages where the rewrite will be **broad** (full-section or
  whole-page rewrite) vs **targeted** (single signature/snippet swap).
  Broad rewrites trigger Gate G4 individually in Step 13.
- A trailing line: `Reply "approve" to proceed with edits, or describe
  scope changes (e.g. "skip release notes", "drop the new tutorial").`

When the user replies:

- "approve" / "looks good" / "proceed" / "yes" → continue to Step 12.
- Anything else → treat as refinement, update the plan, re-emit the G3
  block, and wait again.

In `automatic` mode, append the G3 contents to the final report's
"Docs edit plan" section and continue to Step 12 without stopping.

---

## Step 12 — Update API reference

API reference edits are deterministic translations of the API delta
into reference pages — they proceed without per-page approval (the
overall set was approved at G3). Follow
`references/rules/api-reference-rules.md`:

1. For each touched module, read the existing API reference page (if
   any) under `<API_REFERENCE_PATH>`.
2. Regenerate the structured sections (Types, Functions, Events, Errors)
   from the source.
3. Preserve existing prose that is accurate and tone-compliant. Replace
   prose that no longer matches the source, and trim affected prose that
   is verbose, repetitive, or indirect.
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

After completing Step 12, output a one-line summary: `Step 12 — API
reference updated: <N> files edited, <M> files created.` Then continue.

## Step 13 — Update guides, tutorials, and explanations

For every guide/tutorial/explanation flagged in Step 11 and approved at
G3, decide whether the rewrite is **targeted** (single
signature/snippet/section change) or **broad** (multi-section or
whole-page rewrite, new page, or Diátaxis category move).

- **Targeted rewrites** proceed without further approval. Apply the
  edit, then move on.
- **Broad rewrites** stop at Gate G4 (below) and wait for per-page
  approval before editing.

For each rewrite (targeted or broad):

1. Use `references/rules/diataxis-rules.md` to confirm the page is
   still in the right Diátaxis category. If not, propose a move
   (interactive, via G4) or record it as a `needs-human-review` finding
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
6. Keep touched prose aligned with `docs.tone`: direct, concise,
   precise, and security-conscious. Remove filler and obvious narration
   in the sections already being edited.

---

## 🛑 Gate G4 — Per-page rewrite confirmation (broad rewrites only)

Active in `interactive` mode only, and only for **broad rewrites** as
defined in Step 13. Targeted rewrites do not stop here.

For each broad rewrite, before editing the file:

1. Emit the **G4 proposal block** (template:
   `references/proposals/g4-page-rewrite.md`).
2. **End the turn** and wait for approval.

The proposal block MUST contain:

```
### Page: <path>
- Diátaxis category: <category> (unchanged | move from <old> to <new>)
- Action: <create | rewrite | section-rewrite>
- Sections affected: <list of section headings, or "whole page">
- Triggered by: <api items from Step 9 + matrix row(s)>
- Approach: <one paragraph describing the structure of the rewrite>

Reply "approve" to apply this rewrite, or describe changes.
```

When the user replies:

- "approve" → apply the rewrite and continue to the next broad rewrite
  (or to Step 14 if none remain).
- "skip" → record the page as `needs-human-review` and move on.
- Anything else → treat as refinement, update the approach, re-emit the
  G4 block for this page, and wait again.

In `automatic` mode, all rewrites proceed without G4. Pages that would
have triggered a Diátaxis move are recorded as `needs-human-review`.

---

## Step 14 — Update examples

If the docs slice has an `examples_root`, update it. If examples live as
fenced code blocks inside MDX, update those.

- Replace stale identifiers, package addresses, and signatures.
- Run `examples.compile_command` if set; otherwise apply
  `examples.snippet_validation` (e.g. `syntax`-only validation).
- Do not create new example projects unless the matrix requires one
  (e.g. `New module/package`).

## Step 15 — Update navigation / sidebar

Open `<NAV_CONFIG_PATH>` and apply the deltas approved at G3:

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
