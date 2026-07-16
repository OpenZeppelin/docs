# API reference template

Use this template when creating or refreshing an API reference page.
The page is generated from source comments and structured data; only
the prose carried over from existing pages is edited by hand.

This template assumes the slice's
`api_reference_layout.page_per: package` setting (one MDX file per
package, modules as sections inside). If a slice uses one page per
module, drop the per-module wrapper and apply the same internal
structure.

---

```mdx
---
title: <Package> API Reference
---

import { APIItem, APIGithubLinkHeader } from "@/components/api"

This page documents the public API of `<package_name>` for
<LIBRARY_HUMAN_NAME> `<RELEASE_VERSION>`.

### `<module_name>` [toc] [#<module_name>]

<APIGithubLinkHeader
  moduleName="<module_name>"
  link="<source_repo_url>/blob/<RELEASE_VERSION>/<source_path>"
/>

```move
use <package>::<module_name>;
```

<One-paragraph module summary, carried over from source `///`
comments.>

<Optional: a second short paragraph with the module's key invariants
or usage constraints. Keep it factual.>

Types

- [`<TypeName>`](#<module_name>-<TypeName>)

Functions

- [`<function_name>(<args>)`](#<module_name>-<function_name>)

Events

- [`<EventName>`](#<module_name>-<EventName>)

Errors

- [`<EErrorName>`](#<module_name>-<EErrorName>)

Constants

- [`<CONSTANT_NAME>`](#<module_name>-<CONSTANT_NAME>)

#### Types [!toc] [#<module_name>-Types]

<APIItem
  functionSignature="struct <TypeName><T: key + store>"
  id="<module_name>-<TypeName>"
  kind="struct"
>
<One-paragraph description.>

<Optional: per-field bullet list when fields are not self-explanatory.>

- `field_a: T` — <one-line description>.
- `field_b: u64` — <one-line description>.

<Optional: ability/ownership note, when non-obvious.>
</APIItem>

#### Constants [!toc] [#<module_name>-Constants]

<APIItem
  functionSignature="const <CONSTANT_NAME>: u64 = <value>;"
  id="<module_name>-<CONSTANT_NAME>"
  kind="const"
>
<One-line description.>
</APIItem>

#### Functions [!toc] [#<module_name>-Functions]

<APIItem
  functionSignature="public fun <function_name><T>(arg: &T, ctx: &mut TxContext): <ReturnType>"
  id="<module_name>-<function_name>"
  kind="function"
>
<Description paragraph(s) — what the function does.>

Aborts with `<EErrorName>` if `<condition>`.
Aborts with `<EOtherError>` if `<condition>`.

Emits `<EventName>` on `<when>`.

> **NOTE**: <only if needed; brief>.
> **WARNING**: <only if needed; brief>.

<Optional: one minimal example. Keep it small.>

```move
let result = <module_name>::<function_name>(&obj, ctx);
```
</APIItem>

#### Events [!toc] [#<module_name>-Events]

<APIItem
  functionSignature="public struct <EventName> has copy, drop"
  id="<module_name>-<EventName>"
  kind="event"
>
<One-paragraph description of when this event is emitted.>

- `field_a: ID` — <one-line description>.
- `field_b: address` — <one-line description>.
</APIItem>

#### Errors [!toc] [#<module_name>-Errors]

<APIItem
  functionSignature="const <EErrorName>: u64 = <code>;"
  id="<module_name>-<EErrorName>"
  kind="error"
>
<One-line condition that triggers this error.>
</APIItem>

---

## Type parameters

<If the module's exported items use type parameters with
non-obvious constraints, document them once at the module level
rather than repeating per item. Example:>

- `T: key + store` — the wrapped object type. Must be `key` so it can
  be transferred and `store` so it can be put inside another object.

## Abilities and ownership

<If the module establishes a non-trivial ownership pattern (e.g.
shared object with capability-gated mutation, or wrapped object with
constrained transfer), summarize it here.>

## Security notes

<Apply `security.warning_style` from config. Cross-link to the
matching explanation page when one exists.>

## Version history

- **<RELEASE_VERSION>**: <added / changed / removed items, one bullet
  each>.
- **<previous version>**: <…>.
```

---

## Authoring rules

- **Source order, not alphabetical**, for sections within a module.
  Source order is meaningful in Move and matches the contracts repo.
- **Carry over working prose** if it is accurate and tone-compliant. Do
  not churn untouched entries. When an entry is already being edited,
  trim verbose or indirect prose so it matches `docs.tone`.
- **Match canonical entry order** (description → Aborts → Emits →
  NOTE/INFO/WARNING) per `<LOCAL_DOCS_CONVENTIONS_PATH>`. For Sui this
  order is mandatory.
- **Stable anchors.** Use `<module>-<item>` ids. Do not change them on
  rename if the item is the same; add a redirect entry instead.
- **Source links pinned to `<RELEASE_VERSION>`** when one exists,
  otherwise to `<HEAD_COMMIT>`.

## Where to put the file

- File: `<API_REFERENCE_PATH>/<package>.mdx` for `page_per: package`.
- File: `<API_REFERENCE_PATH>/<package>/<module>.mdx` for
  `page_per: module`.
- Nav entry: under the `API Reference` folder in `<NAV_CONFIG_PATH>`.
