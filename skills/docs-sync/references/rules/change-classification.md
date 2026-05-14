# Change classification

Each contract change must be assigned exactly one **primary**
classification. A change can also have **secondary** classifications
when more than one row applies (e.g. a removed function that was
security-sensitive).

Classifications are deterministic. Use only the names below; the docs
update matrix references them by exact name.

For every change, record:

- **File** (relative to `<CONTRACTS_REPO_PATH>`).
- **Construct** (module / function / struct / etc.).
- **Primary classification**.
- **Secondary classifications** (optional, comma-separated).
- **Evidence**: commit hash + hunk pointer.

---

## 1. New module/package

**Detection signals**
- A new file under the contracts library's source root, or
- A new top-level `module <addr>::<name>;` declaration not present at
  `<BASE_COMMIT>`.

**Required evidence**
- The file appears in `git diff --diff-filter=A`.
- Or `extract_public_api` reports a new module name.

**Documentation impact**
- API reference page required.
- Module overview page required (under `<VERSION_DOCS_ROOT>`).
- Navigation entry required under both `Packages` and `API Reference`.
- At least one usage example required.

**Common false positives**
- A file moved without API change: classify as
  `Internal-only implementation change` if no public surface differs.
- A test module (`*_tests.move`, `tests/...`): classify as
  `Internal-only implementation change`.

---

## 2. New public function

**Detection signals**
- A `public fun ...` (or `entry fun ...`, `public(...) fun ...`) that
  did not exist at `<BASE_COMMIT>`.

**Required evidence**
- Signature appears in `extract_public_api(<HEAD_COMMIT>)` and not in
  `extract_public_api(<BASE_COMMIT>)`.

**Documentation impact**
- API reference entry required.
- Guide update required if the function enables a new user task that
  cannot be done with existing API.

**Common false positives**
- A function whose visibility was widened from private to public —
  classify as `Changed function signature` (visibility) rather than
  "new", because callers may already exist and migration notes change.
- An internal helper renamed and re-exported under a public alias —
  classify as `Changed function signature`.

---

## 3. Changed function signature

**Detection signals**
- Same fully qualified function path exists at both commits, but at
  least one of: parameter list, return type, type parameters, abilities
  bound, visibility, `entry`-ness has changed.

**Required evidence**
- Signature strings differ between `extract_public_api` outputs at the
  two commits.

**Documentation impact**
- API reference entry required.
- Affected guides and examples required (search by name).
- Migration note required if the change is breaking.

**Common false positives**
- Whitespace/formatting-only changes: classify as
  `Documentation-only source comment change` if only `///` lines moved,
  or `Internal-only implementation change` for purely cosmetic formatting.
- Parameter renames with no type change: still counted (they break
  named-parameter call sites and break docs prose).

---

## 4. Changed behavior

**Detection signals**
- Signature unchanged, but the function body changed in a way that
  affects observable behavior: different result for the same inputs,
  different state mutation, different ordering of effects.

**Required evidence**
- Body diff in the function, AND at least one of:
  - A test was updated to reflect the new behavior.
  - Source comments / docs explicitly describe the new behavior.
  - A new abort/event/log was introduced (see those classifications).

**Documentation impact**
- API reference required (function description).
- Affected guides required.
- Explanation update required if the change reflects a new mental model.

**Common false positives**
- Refactor that produces the same observable result: classify as
  `Internal-only implementation change`.
- Performance-only optimization with no observable change other than
  gas/CU: classify as `Internal-only implementation change` unless
  documented limits change.

---

## 5. Changed abort/error condition

**Detection signals**
- A new error constant appears (e.g. `const ENewError: u64 = ...;`) and
  is referenced from a public function, **or**
- A public function gains/removes/relocates an `abort` / `assert!` /
  error-throwing call site.

**Required evidence**
- Error constant in `extract_public_api` differs.
- `assert!`/`abort`/equivalent call sites changed in a public function.

**Documentation impact**
- API reference required (the function's `Aborts` block).
- Affected guides and examples reviewed for misleading error claims.

**Common false positives**
- Error constant renamed but same semantic — still record (callers and
  docs both reference the name).
- New `assert!` purely on internal invariants impossible to trigger
  externally: classify as `Internal-only implementation change`.

---

## 6. Changed event

**Detection signals**
- A new event struct (Sui: `struct ... has copy, drop` emitted via
  `event::emit`).
- Existing event struct gained or lost fields, or had field types
  changed.
- A public function added/removed an `event::emit(...)` call.

**Required evidence**
- Event struct definition differs between commits.
- Or call-site to `event::emit` differs in a public function.

**Documentation impact**
- API reference required (the function's `Emits` block and the events
  section).
- Guide update required if users must observe or index the event.

**Common false positives**
- Internal logging that is not an on-chain event: classify as
  `Internal-only implementation change`.

---

## 7. Changed type/struct

**Detection signals**
- A public struct/type gained or lost fields, abilities, or type
  parameters.
- A type alias or witness type changed.

**Required evidence**
- Struct definition differs in `extract_public_api`.

**Documentation impact**
- API reference required.
- Examples reviewed.

**Common false positives**
- Internal struct used only by private helpers: classify as
  `Internal-only implementation change`.

---

## 8. Changed ability/ownership semantics

**Detection signals**
- A struct's `has` clause changed (`key`, `store`, `copy`, `drop`).
- A capability type was introduced, removed, or its issuance pattern
  changed.
- An object was made shared/owned/frozen where it was not before.

**Required evidence**
- Ability list differs in `extract_public_api`.
- Or capability creation/transfer call sites differ in a public flow.

**Documentation impact**
- API reference required.
- Guide review required.
- Explanation **and** security note required (this category is almost
  always security-relevant).

**Common false positives**
- Adding `drop` to a purely value-returning struct: still record (it
  changes safety guarantees).

---

## 9. Breaking change

**Detection signals** (any of):
- A public item present at `<BASE_COMMIT>` is missing at `<HEAD_COMMIT>`.
- A public function's parameter list, parameter type order, return
  type, or visibility changed in a non-additive way.
- A public struct lost fields or abilities.
- A capability type's witness changed.

**Required evidence**
- Diff of public surface between the two commits.

**Documentation impact**
- API reference required.
- Migration guidance required (under guides or release notes).
- Changelog/release notes entry required.
- This is a secondary classification: it always co-occurs with one of
  `Removed feature`, `Changed function signature`, `Changed
  type/struct`, or `Changed ability/ownership semantics`.

**Common false positives**
- Adding a parameter with a default-style overload (Move does not
  natively have this — almost any signature change is breaking).

---

## 10. Security-sensitive behavior

**Detection signals** — the change touches any of:
- Access-control checks (admin, owner, role).
- Capability issuance, transfer, or surrender.
- Authorization / signature verification / replay protection.
- Asset transfer, escrow, custody, or accounting.
- Upgradeability hooks.
- Cryptographic primitives (hashing, signatures, randomness).

**Required evidence**
- Diff includes one of: new/removed `assert!` on access checks, new or
  changed capability handling, new or changed `transfer::*` paths,
  changes to signature verification calls, or changes to crypto module
  use.

**Documentation impact**
- Explanation or warning section required (per
  `security.warning_style`).
- This is a **secondary** classification — always pair with the primary
  classification of the change.

**Common false positives**
- Renaming a private helper used by access control: still record
  (security-sensitive even if internal-looking).
- Adding logging around an existing check: classify as
  `Internal-only implementation change` unless the check itself
  changed.

---

## 11. Deprecated feature

**Detection signals**
- An attribute / annotation marking deprecation (`#[deprecated]` or
  equivalent, or a `/// deprecated` doc convention).
- A doc comment explicitly marking the item as deprecated, even without
  a tooling-level annotation.

**Required evidence**
- Annotation or explicit doc-comment marker on the item.

**Documentation impact**
- Reference page must include a deprecation note with the deprecation
  release and replacement.
- Migration guidance required.

**Common false positives**
- A `// TODO: deprecate this` comment in the body is **not**
  deprecation. Only public-facing markers count.

---

## 12. Removed feature

**Detection signals**
- A public item present at `<BASE_COMMIT>` is missing at `<HEAD_COMMIT>`.

**Required evidence**
- Item missing in `extract_public_api(<HEAD_COMMIT>)`.

**Documentation impact**
- Migration guidance required.
- Release-notes entry required.
- Existing reference content for the item should be removed; existing
  guides that referenced it should be updated.

**Common false positives**
- Item moved to a different module or package: classify as
  `Changed function signature` (path changed) and add `Breaking change`
  as a secondary.

---

## 13. Documentation-only source comment change

**Detection signals**
- The diff for a file contains only changes to `///` doc comments or
  `//` comments. No code tokens changed.

**Required evidence**
- Hunks contain only comment-line additions/deletions/edits.

**Documentation impact**
- API reference may need refreshed prose.
- No code-level migration.

**Common false positives**
- A change that re-flows comments and also moves a `;` or whitespace
  inside code: count as `Internal-only implementation change` for the
  code part and `Documentation-only source comment change` for the
  comment part.

---

## 14. Example-only change

**Detection signals**
- The diff is restricted to files under an examples / samples / fixture
  directory inside the contracts repo (not under public sources).

**Required evidence**
- All changed paths match the contracts repo's example layout.

**Documentation impact**
- Update embedded examples in docs if the repo's examples are mirrored
  in the docs slice.

**Common false positives**
- Test files: classify as `Internal-only implementation change`.

---

## 15. Internal-only implementation change

**Detection signals**
- All changes are confined to non-public modules, internal helpers,
  tests, scripts, CI, or formatting.

**Required evidence**
- `extract_public_api(<BASE_COMMIT>) == extract_public_api(<HEAD_COMMIT>)`.
- Or all hunks fall in directories the project marks as internal.

**Documentation impact**
- None, unless behavior, security, performance, or stated limitations
  changed in a way users care about.

**Common false positives**
- A change that looks internal but flips a security invariant —
  classify as `Security-sensitive behavior` (secondary) on top of the
  primary classification.

---

## Multiple classifications

A single hunk often produces multiple classifications:

- A function signature changed in a way that breaks callers and the
  function checks access control:
  - Primary: `Changed function signature`
  - Secondary: `Breaking change`, `Security-sensitive behavior`
- A removed module that was deprecated last release:
  - Primary: `Removed feature`
  - Secondary: `Breaking change` (and possibly
    `Security-sensitive behavior`)

Record all secondaries — the matrix uses each classification
independently to decide what docs to update.
