# docs PR checklist

The agent must walk through this list at the end of every run, mark
each item pass / fail / N/A, and surface the result in the docs-sync
report. Do not skip items. If any item is `fail`, the run is **not
done** — either fix it (interactive: confirm with user; automatic:
within configured rules) or surface it explicitly.

---

## 1. API reference

- [ ] Every changed public item has an updated entry in
  `<API_REFERENCE_PATH>`.
- [ ] Every newly added public item has a new entry, in the canonical
  source order.
- [ ] Every removed public item has been removed from the reference
  page **and** from the in-page lists (Types, Functions, Events,
  Errors, Constants).
- [ ] Source links (`APIGithubLinkHeader` for Sui) point to
  `<RELEASE_VERSION>` (or `<HEAD_COMMIT>` if no tag exists), not to
  `main`.
- [ ] Function entries follow the canonical entry order from
  `<LOCAL_DOCS_CONVENTIONS_PATH>` (for Sui: description → Aborts →
  Emits → NOTE/INFO/WARNING).
- [ ] Anchors are stable for items that were not renamed.

## 2. Guides

- [ ] Every guide whose subject overlaps the change set has been
  reviewed.
- [ ] Stale signatures, parameter lists, error names, and event names
  are gone.
- [ ] New guides for `New module/package` and applicable `IF NEW TASK`
  rows in `references/rules/doc-update-matrix.md` have been created and
  follow `references/templates/guide-template.md`.

## 3. Tutorials

- [ ] Tutorials whose ending state depends on the changed API still
  produce the documented final result.
- [ ] No tutorial has gained a branch ("Option A or Option B") as a
  result of the change.
- [ ] Tutorial code snippets parse with the new API.

## 4. Explanations

- [ ] Explanation pages flagged by the matrix have been reviewed.
- [ ] No new how-to-style step lists were introduced into explanation
  pages.
- [ ] Security-sensitive design changes have an updated explanation.

## 5. Examples

- [ ] Embedded code snippets parse / compile per
  `examples.snippet_validation` (or `examples.compile_command` if set).
- [ ] No example uses a removed function, struct, error, or event.
- [ ] No example uses an outdated package address or module path.

## 6. Links

- [ ] Internal links inside the slice resolve to existing pages.
- [ ] Anchors inside the slice resolve to existing ids.
- [ ] No `#TODO`, `<TODO>`, or template `<PLACEHOLDER>` tokens remain
  unless `automation.fail_on_unresolved_placeholders: false`.

## 7. Navigation

- [ ] `<NAV_CONFIG_PATH>` lists every page reachable in the slice.
- [ ] `<NAV_CONFIG_PATH>` no longer references deleted pages.
- [ ] Folder structure matches `navigation.required_folders` if
  configured.
- [ ] No `meta.json` files were created or edited (per
  `navigation.forbid_meta_json: true`).

## 8. Changelog / release notes

- [ ] `Breaking change`, `Removed feature`, `Deprecated feature`, and
  user-observable behavior changes are reflected in release notes when
  this docs slice has an established release-notes location; otherwise
  the report lists the missing release-notes destination.
- [ ] Migration notes appear under the relevant guide or release-notes
  section for breaking changes.

## 9. Stale identifiers

- [ ] No removed function names appear in prose, headings, or links.
- [ ] No old package ids, addresses, or module paths appear.
- [ ] No old function signatures appear in code blocks or prose.
- [ ] No old event or error names appear in prose unless explicitly
  preserved as historical references in a "Version history" section.

## 10. Placeholders

- [ ] No `<TODO>`, `<FILL>`, `<TARGET_AUDIENCE>`, `<RELEASE_VERSION>`,
  `<…>` placeholders remain.
- [ ] If `automation.fail_on_unresolved_placeholders: true` and any
  remain, the run reports `fail` for this item and lists every
  unresolved placeholder by file and line.

## 11. Security-sensitive changes

- [ ] Every change classified `Security-sensitive behavior` has an
  explicit warning callout (per `security.warning_style`) in the
  affected reference entries.
- [ ] If the topic is in `security.require_security_sections_for`, the
  matching guide and explanation pages have a security section.
- [ ] Security warnings are factual and specific (no vague "be
  careful").

## 12. Breaking changes

- [ ] Every change classified `Breaking change` has either a migration
  section in the release notes, or a migration paragraph in the
  primary guide for the affected feature.
- [ ] Migration text shows before/after at code level if the matrix
  flagged "code-level before/after" in interactive mode (or by default
  in automatic mode for non-trivial signatures).

## 13. Assumptions recorded

- [ ] Every assumption made during the run is in the report's
  `Assumptions` section.
- [ ] Every unresolved TODO is in the report's `Unresolved TODOs`
  section, with file, line, and reason.

## 14. Scope of edits

- [ ] All edits are inside `<LIBRARY_DOCS_ROOT>` (recursively),
  `<NAV_CONFIG_PATH>`, or shared example files explicitly required by
  the matrix.
- [ ] No other docs slice (e.g. `content/contracts-cairo/`,
  `content/contracts-stylus/`) was touched.
- [ ] No source comments in `<CONTRACTS_REPO_PATH>` were edited unless
  `automation.allow_source_comment_edits: true` **and** the user
  authorized it.
- [ ] No `meta.json` files were created or edited.
- [ ] No personal local filesystem paths appear anywhere in the
  generated content.
