# Doc update matrix

Maps every change classification (from `references/rules/change-classification.md`) to
the docs surfaces that must be updated.

Columns:

- **Change type** — primary or secondary classification name.
- **API ref** — must update API reference?
- **Guide** — must update or create a how-to guide?
- **Tutorial** — must update or create a tutorial?
- **Explanation** — must update or create an explanation page?
- **Example** — must update or create code examples?
- **Nav** — must update navigation (`<NAV_CONFIG_PATH>`)?
- **Release notes** — must add a changelog / release-notes entry?
- **Security warning** — must add or update an explicit warning callout?
- **Auto mode** — what automatic mode does without asking.
- **Interactive prompts** — focused questions to ask, only if the
  answer changes scope/audience/examples/release notes/security
  framing.

Cells use:

- `YES` — the agent must do it.
- `IF NEW TASK` — required only when the change enables a user task
  that did not exist before.
- `REVIEW` — read the relevant pages, edit only if they would now be
  wrong.
- `OPT` — optional; defer unless the matrix or local conventions force
  it.
- `NO` — do not edit.

> When multiple rows apply (a change with secondary classifications),
> the **union** of `YES`/`REVIEW`/`IF NEW TASK` cells across rows
> applies. `NO` is overridden by any other value.

---

## 1. New module/package

| Field | Value |
|---|---|
| API ref | YES |
| Guide | IF NEW TASK |
| Tutorial | OPT |
| Explanation | OPT |
| Example | YES (at least one usage example) |
| Nav | YES (Packages folder + API Reference folder) |
| Release notes | YES |
| Security warning | REVIEW (apply if topic in `security.require_security_sections_for`) |
| Auto mode | Generate API ref page + minimal package overview page from source comments and templates. Add nav entries. Insert a stub example using existing snippet style. |
| Interactive prompts | "Is this module aimed at <TARGET_AUDIENCE>, or a different audience?" • "Is there a concrete user task this enables that needs a how-to guide?" • "Should we draft an explanation page for the design, or is the package overview enough?" |

## 2. New public function

| Field | Value |
|---|---|
| API ref | YES |
| Guide | IF NEW TASK |
| Tutorial | OPT |
| Explanation | OPT |
| Example | REVIEW (add a snippet under the function entry) |
| Nav | NO (unless the new function lives in a brand-new module) |
| Release notes | YES |
| Security warning | REVIEW |
| Auto mode | Insert function entry into the appropriate API reference page in canonical order. Update example snippets if the surrounding module already has them. |
| Interactive prompts | "Does this function enable a new user task that should be its own how-to guide?" • "Are there security caveats users must see?" |

## 3. Changed function signature

| Field | Value |
|---|---|
| API ref | YES |
| Guide | YES (every guide that names the function) |
| Tutorial | REVIEW |
| Explanation | REVIEW |
| Example | YES (every example that calls the function) |
| Nav | NO (unless the path moved) |
| Release notes | YES (with migration note if breaking) |
| Security warning | REVIEW |
| Auto mode | Replace signature in API reference. Update every snippet that uses the function. Add migration note if `Breaking change` is a secondary. |
| Interactive prompts | "Should the migration note include a code-level before/after, or is a one-line note enough?" |

## 4. Changed behavior

| Field | Value |
|---|---|
| API ref | YES |
| Guide | YES |
| Tutorial | REVIEW |
| Explanation | REVIEW |
| Example | REVIEW |
| Nav | NO |
| Release notes | YES |
| Security warning | REVIEW |
| Auto mode | Update function description in API reference. Update guides that reference the prior behavior. |
| Interactive prompts | "Does the new behavior change the recommended pattern in any tutorial or explanation?" |

## 5. Changed abort/error condition

| Field | Value |
|---|---|
| API ref | YES |
| Guide | REVIEW |
| Tutorial | REVIEW |
| Explanation | NO |
| Example | REVIEW |
| Nav | NO |
| Release notes | OPT (YES if user-observable) |
| Security warning | REVIEW |
| Auto mode | Regenerate the function's `Aborts` block from source. Search guides for the error name and review references. |
| Interactive prompts | "Is the new abort condition something integrators commonly hit, or an internal invariant?" |

## 6. Changed event

| Field | Value |
|---|---|
| API ref | YES |
| Guide | YES if users must observe / index it |
| Tutorial | REVIEW |
| Explanation | OPT |
| Example | REVIEW (event handling snippet) |
| Nav | NO |
| Release notes | YES |
| Security warning | REVIEW |
| Auto mode | Update events section and the emitting function's `Emits` block. Update indexer/observer snippet if one exists. |
| Interactive prompts | "Should integrators be told to subscribe to this event in a how-to guide?" |

## 7. Changed type/struct

| Field | Value |
|---|---|
| API ref | YES |
| Guide | REVIEW |
| Tutorial | REVIEW |
| Explanation | OPT |
| Example | REVIEW |
| Nav | NO |
| Release notes | YES if breaking |
| Security warning | REVIEW |
| Auto mode | Replace the struct definition in API reference. Update field documentation. |
| Interactive prompts | "Did the field semantics change for users, or is this a rename only?" |

## 8. Changed ability/ownership semantics

| Field | Value |
|---|---|
| API ref | YES |
| Guide | YES |
| Tutorial | REVIEW |
| Explanation | YES |
| Example | REVIEW |
| Nav | NO |
| Release notes | YES |
| Security warning | YES |
| Auto mode | Update API reference; add or refresh an explanation note covering the new ownership/ability model; add a security warning callout. Do not delete prior explanation prose without confirmation. |
| Interactive prompts | "Does this change the recommended custody pattern?" • "Does it affect upgrade migration?" |

## 9. Breaking change

| Field | Value |
|---|---|
| API ref | YES |
| Guide | YES |
| Tutorial | REVIEW |
| Explanation | REVIEW |
| Example | YES |
| Nav | REVIEW |
| Release notes | YES (migration section required) |
| Security warning | REVIEW |
| Auto mode | Add a migration section under release notes; do not delete pre-break content unless the corresponding API was removed. |
| Interactive prompts | "Should we publish a stand-alone migration guide, or fold the migration into the release notes?" |

## 10. Security-sensitive behavior

| Field | Value |
|---|---|
| API ref | YES (security note in the relevant function/module) |
| Guide | REVIEW |
| Tutorial | REVIEW |
| Explanation | YES |
| Example | REVIEW |
| Nav | NO |
| Release notes | YES |
| Security warning | YES |
| Auto mode | Apply `security.warning_style` callout in the affected reference entries; ensure an explanation page exists for the topic and link both ways. |
| Interactive prompts | "Should this be a top-level security advisory in release notes?" |

## 11. Deprecated feature

| Field | Value |
|---|---|
| API ref | YES (deprecation note + replacement) |
| Guide | REVIEW |
| Tutorial | REVIEW |
| Explanation | REVIEW |
| Example | REVIEW (replace usage with replacement) |
| Nav | NO |
| Release notes | YES |
| Security warning | REVIEW |
| Auto mode | Add `Deprecated in <RELEASE_VERSION>` block to the reference entry; suggest replacement. Add migration note. Do not delete the entry. |
| Interactive prompts | "Should existing examples switch to the replacement now, or stay on the deprecated API until removal?" |

## 12. Removed feature

| Field | Value |
|---|---|
| API ref | YES (delete entry; add removal note in version history) |
| Guide | YES (remove or rewrite usage; add migration) |
| Tutorial | REVIEW |
| Explanation | REVIEW |
| Example | YES (replace or delete) |
| Nav | YES (remove dead nav entries) |
| Release notes | YES (Removed section) |
| Security warning | REVIEW |
| Auto mode | Remove the API reference entry, the nav entry, and stale references. Preserve a "Removed in <RELEASE_VERSION>" line in the version-history section. |
| Interactive prompts | "Was this removal intentional and final, or temporarily reverted?" |

## 13. Documentation-only source comment change

| Field | Value |
|---|---|
| API ref | REVIEW (refresh prose if it diverges from new comments) |
| Guide | NO |
| Tutorial | NO |
| Explanation | NO |
| Example | NO |
| Nav | NO |
| Release notes | NO |
| Security warning | NO |
| Auto mode | Refresh API reference prose only. Skip if the new comment is purely cosmetic. |
| Interactive prompts | (none — too low-impact to interrupt) |

## 14. Example-only change

| Field | Value |
|---|---|
| API ref | NO |
| Guide | REVIEW |
| Tutorial | REVIEW |
| Explanation | NO |
| Example | YES |
| Nav | NO |
| Release notes | OPT |
| Security warning | NO |
| Auto mode | Mirror example changes into the docs slice's embedded examples or `examples_root`. |
| Interactive prompts | (none) |

## 15. Internal-only implementation change

| Field | Value |
|---|---|
| API ref | NO |
| Guide | NO |
| Tutorial | NO |
| Explanation | NO |
| Example | NO |
| Nav | NO |
| Release notes | NO (unless behavior, security, performance, or limitations changed) |
| Security warning | NO |
| Auto mode | No-op. Record in report. |
| Interactive prompts | (none) |

---

## Aggregation rules

When the same docs page is touched by multiple change classifications:

1. Take the union of required updates.
2. Apply API reference updates first (deterministic).
3. Then apply guide / tutorial / explanation updates, in that order.
4. Then update examples.
5. Then update navigation.
6. Then update release notes.

Each docs page is edited at most once per run.
