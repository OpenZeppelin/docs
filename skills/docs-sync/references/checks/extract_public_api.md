# extract_public_api spec

Extract the public API surface of a contracts library at a given
commit, in a stable, comparable form.

## Inputs

- `CONTRACTS_REPO_PATH` — local path to the contracts repo.
- `COMMIT_SHA` — commit to inspect (`<BASE_COMMIT>` or `<HEAD_COMMIT>`).
- `LANGUAGE` — from `library.language` in config (e.g. `MOVE_SUI`).
- `SOURCE_GLOBS` — globs for source files (default per language; for
  `MOVE_SUI`: `**/sources/**/*.move`, excluding `**/tests/**`,
  `**/examples/**`, `**/scripts/**`).

## Output

A structured JSON-shaped object with one entry per public item:

```
{
  "commit": "<COMMIT_SHA>",
  "language": "<LANGUAGE>",
  "modules": [
    {
      "package": "<package_name>",
      "module": "<module_name>",
      "path": "<relative path inside CONTRACTS_REPO_PATH>",
      "doc_summary": "<first paragraph of /// comments on the module>",
      "items": [
        {
          "kind": "function" | "struct" | "const" | "error" | "event" | "type_alias",
          "name": "<item_name>",
          "signature": "<canonical one-line form>",
          "type_parameters": ["<T: bounds>", ...],
          "abilities": ["key", "store", ...],          // structs only
          "visibility": "public" | "public(friend)" | "entry" | ...,
          "doc_summary": "<first paragraph of ///>",
          "doc_aborts": ["Aborts with EX if Y.", ...], // functions only
          "doc_emits":  ["Emits Z on W.", ...],         // functions only
          "abort_sites": ["EX", "EY"],                  // discovered from code
          "emit_sites":  ["Z"],                         // discovered from code
          "deprecated": true | false,
          "deprecated_message": "<text|null>"
        }
      ]
    }
  ]
}
```

### Canonical signature form

For determinism, normalize signatures:

- One line, no trailing whitespace.
- Spaces collapsed.
- Type parameters ordered as in source.
- Parameter names preserved verbatim.
- Abilities preserved verbatim.

## Procedure

1. Create a unique temporary directory with `mktemp -d`.
2. Resolve the commit in a detached temporary worktree:
       git -C <CONTRACTS_REPO_PATH> worktree add --detach <tmpdir>/<short-sha> <COMMIT_SHA>
   Use a temporary worktree so the main checkout is untouched. Do not
   stash, reset, or otherwise mutate the caller's checkout.
3. Glob source files per `SOURCE_GLOBS` inside the temporary worktree.
4. Parse each file:
   - For `MOVE_SUI`: parse `module ::name;` declarations, `public fun`
     / `entry fun` signatures, `struct ... has ...`, `const`, error
     constants (`E*`), event structs (those passed to `event::emit`).
   - Use a Move parser if available; otherwise a tolerant
     regex-based extractor with the patterns documented in
     `<LOCAL_DOCS_CONVENTIONS_PATH>`.
5. Walk function bodies (best-effort) to record abort and emit sites:
   - For abort sites, look for `abort <ECONST>` and
     `assert!(..., <ECONST>)`.
   - For emit sites, look for `event::emit(...)` and infer the event
     struct from the argument's constructor.
6. Normalize and emit JSON.
7. Remove the temporary worktree:
       git -C <CONTRACTS_REPO_PATH> worktree remove <tmpdir>/<short-sha>
   Then remove the temporary directory.

## Failure conditions

- Commit cannot be resolved → stop.
- No source files matched globs → stop. Likely a misconfigured
  language or path.
- Parse errors on >5% of files → continue but add a warning per
  failed file. The agent should record this in the report.
- Move parser unavailable AND regex extractor produced unbalanced
  output (e.g. unmatched braces in signatures) → fall back to
  conservative output: include items the agent can fully recover,
  list partial recoveries as `needs-human-review` findings.

## Interpretation

The agent calls this twice: once for `<BASE_COMMIT>`, once for
`<HEAD_COMMIT>`. The result is consumed by `compare_public_api.md`.

If extraction is clearly wrong (e.g. zero items recovered for a
module the diff shows changes in), do not proceed with classification
based on it. Stop and report which module's surface could not be
extracted.

## Notes for non-Move languages

The same shape applies to other contracts languages by changing the
parser. Per language hint:

- `CAIRO`: parse `mod`, `#[external(v0)]` / `#[generate_trait]`,
  `fn`, `struct`, `enum`, `event`. Abilities/abilities are not
  applicable; visibility is.
- `STYLUS`: parse Rust crates that compile to WASM; treat
  `#[external]` items as public.
- `SOLIDITY`: parse `contract`, `library`, `interface`,
  `function`, `event`, `error`, `modifier`; treat `external` and
  `public` as public surface.

The agent should set `library.language` correctly in config; the
extractor branches on it.
