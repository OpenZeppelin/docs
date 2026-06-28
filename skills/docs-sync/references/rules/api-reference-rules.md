# API reference rules

API reference must be **accurate, complete, and deterministic**. The
goal is that two agents running with the same contracts diff produce
the same reference output (modulo prose carried over from existing
pages).

This file defines the contract between source comments and reference
pages.

---

## Source comment format

The agent reads source comments to populate API reference. The expected
format depends on the language; for `MOVE_SUI`, doc comments use `///`
attached to the item.

### Required fields per item

#### Module

- One-paragraph summary of what the module does and who it's for.
- Optional: a short rationale paragraph (which belongs in
  Explanation, but if it is on the module it is acceptable in
  Reference as a single paragraph).

#### Public function

1. **Description** — what the function does, in one short paragraph.
2. **Aborts** — every abort condition reachable through this function,
   one line each. Use the project's canonical phrasing
   (`Aborts with <ErrorName> if <condition>.`).
3. **Emits** — every event emitted, one line each
   (`Emits <EventName> on <when>.`).
4. **Notes / warnings** — only `NOTE`, `INFO`, or `WARNING` callouts
   are allowed after the description / Aborts / Emits sections. The
   order matters: see below.

#### Struct / type

- Summary describing the role of the struct.
- Per-field one-line descriptions where the field name is not
  self-explanatory.
- Abilities and ownership semantics if non-obvious.

#### Constant

- One-line description if user-facing. Internal-only constants are
  excluded from the public surface.

#### Error

- One line stating the condition the error represents.

#### Event

- Summary describing the event.
- Per-field one-line descriptions.
- A note on indexing if the event is meant for off-chain consumers.

### Type parameters

Document type parameters in the function or struct description, using
the project's convention:

- `<T: key + store>` — explain the constraints.
- Note any phantom type parameters and what they encode.

### Abilities, ownership, capabilities, access control

- For structs: list `key`/`store`/`copy`/`drop` if non-obvious and
  explain why each is present or absent (one line each).
- For functions that gate behavior on a capability or sender check:
  state the gate explicitly (`Requires <Cap>`, `Sender must be
  <recorded principal>`).
- For shared-object flows: state the sharing model.
- For upgradeable modules: state the upgrade authority and what
  changes when the module is upgraded.

### Aborts and errors

For each abort condition, the reference entry must say:

- The error constant name (e.g. `ENotOwner`).
- The condition that triggers it.

Group multiple aborts into a list under the function entry's `Aborts`
section, in source order.

### Events

For each event emitted, the reference entry must say:

- The event struct name.
- A short trigger condition.

Cross-reference back to the events list at the top of the module page.

### Examples in reference

Inline code snippets are allowed inside `<APIItem>`-style entries when
they help disambiguate calling syntax. They must:

- Be language-tagged (` ```move`).
- Be syntactically valid.
- Use the same import / address conventions as
  `<LOCAL_DOCS_CONVENTIONS_PATH>`.

Do **not** include tutorials inside reference entries. If an example
needs more than ~10 lines of context, link to a guide instead.

---

## Layout

For Sui (and any slice with `api_reference_layout.page_per: package`):

- One MDX file per package under `<API_REFERENCE_PATH>`.
- Within the file, each module is a section using the configured
  module section component (Sui: `<APIItem>`).
- Each module section follows the canonical entry order from
  `<LOCAL_DOCS_CONVENTIONS_PATH>`. For Sui:
  1. Module description paragraph(s).
  2. **Aborts** lines (when present).
  3. **Emits** lines (when present).
  4. NOTE / INFO / WARNING callouts (in that order).
- Source links use the configured component
  (Sui: `<APIGithubLinkHeader>`) pinned to `<RELEASE_VERSION>`.

If the slice instead uses one page per module (set
`api_reference_layout.page_per: module`), each module is its own MDX
file under `<API_REFERENCE_PATH>/<package>/<module>.mdx`. The
canonical entry order still applies inside each file.

---

## Handling missing or weak source comments

The agent does **not** edit source comments by default. It reacts as
follows:

| Situation | Action |
|---|---|
| Public item has no `///` doc comment at all | Generate the deterministic signature/field list only. Add a `needs-human-review` finding; avoid inline TODOs unless the page would otherwise be misleading or incomplete. |
| Doc comment exists but lacks `Aborts` for an abort the function clearly reaches | Generate the `Aborts` line from the source `assert!`/`abort` site when the condition is clear; otherwise add a `needs-human-review` finding. |
| Doc comment exists but lacks `Emits` for an event clearly emitted | Generate the `Emits` line from the source `event::emit` site when the trigger is clear; otherwise add a `needs-human-review` finding. |
| Doc comment is wrong (contradicts the code) | Replace the doc-side prose; do not edit source. Record in report. |
| Doc comment is fine but the project's local conventions changed | Reformat in docs only. |

### `automation.allow_source_comment_edits` true

Only when this flag is `true` and the user explicitly asked to fix
source comments may the agent edit `///` lines in the contracts repo.
Even then:

- Edits stay scoped to public items touched by the diff.
- Each edit is recorded in the report (`Source comment edits` section).
- The agent commits source-comment edits separately (one commit per
  module), so they can be reviewed independently from the actual code
  changes — but does not push.

### Automatic mode

Behavior with weak/missing comments:

- Generate the deterministic parts (signature, errors list, events
  list, fields list).
- Avoid placeholder prose. Record missing or weak prose as
  `needs-human-review` unless an inline TODO is the only honest output.
- Continue. Do not block the run on weak comments.

If `automation.fail_on_unresolved_placeholders: true`, any inline TODO
or template placeholder fails Step 16. Prefer report findings over
leaving placeholders in docs.

### Interactive mode

Behavior with weak/missing comments:

- Surface the gap in the proposed plan: "Module `X` has 3 public
  functions without descriptions. Generate deterministic entries and
  flag for review, or pause for source-doc fill-in?"
- Default action if the user does not answer: generate deterministic
  entries and record `needs-human-review` findings.

---

## Source-comment edit rule (must)

The agent MUST NOT modify source comments in the contracts repo unless
**both** are true:

1. `automation.allow_source_comment_edits: true` in the slice's config.
2. The user explicitly asked for source-comment edits in the run prompt
   (or in interactive responses).

Even when both are true, the agent stays scoped to public items the
diff already touched. The agent does not opportunistically rewrite
unrelated comments.

---

## Determinism rules

To keep API reference comparable run-to-run:

1. **Sort sections in source order** when the source order is
   meaningful (Sui modules use source order); sort alphabetically only
   when the language has no inherent order.
2. **Preserve prose carried over** if it is accurate and
   tone-compliant. Do not churn untouched sections. When an entry is
   already being edited, trim verbose or indirect prose so it matches
   `docs.tone`.
3. **Use exact identifier strings** from the source. Do not
   pretty-print signatures.
4. **Pin source links to a release tag** when one exists; otherwise
   pin to `<HEAD_COMMIT>`.
5. **Keep anchors stable**. The Sui slice uses `<module>-<item>`
   anchors; preserve them across renames when the underlying item is
   the same.

---

## Removal

When a public item is removed:

- Delete its `<APIItem>` block from the reference page.
- Remove its entries from the in-page lists (Types, Functions, Events,
  Errors).
- Remove the matching nav entry if the entire module was removed.
- Add a `Removed in <RELEASE_VERSION>` line under a "Version history"
  section at the bottom of the reference page (or create the section).
- Search the slice for stale links and either repoint them to the
  replacement (if any) or delete them.

Do not silently delete a reference page just because the file in the
contracts repo moved. Confirm with `extract_public_api` that the item
is actually gone.
