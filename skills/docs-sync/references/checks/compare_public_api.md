# compare_public_api spec

Diff two extracted public API surfaces (output of
`extract_public_api`) and produce a structured change list.

## Inputs

- `BASE_SURFACE` — JSON output of `extract_public_api(<BASE_COMMIT>)`.
- `HEAD_SURFACE` — JSON output of `extract_public_api(<HEAD_COMMIT>)`.

## Output

```
{
  "added_modules":   [ {"package": "...", "module": "...", "path": "..."} ],
  "removed_modules": [ ... ],
  "renamed_modules": [ {"from": {...}, "to": {...}} ],

  "added_items":   [ {"package": "...", "module": "...", "kind": "...", "name": "...", "signature": "..."} ],
  "removed_items": [ ... ],
  "changed_items": [
    {
      "package": "...",
      "module": "...",
      "kind": "...",
      "name": "...",
      "before": { "signature": "...", "abilities": [...], "type_parameters": [...], "doc_summary": "...", "doc_aborts": [...], "doc_emits": [...] },
      "after":  { "signature": "...", "abilities": [...], "type_parameters": [...], "doc_summary": "...", "doc_aborts": [...], "doc_emits": [...] },
      "diff_dimensions": ["signature" | "abilities" | "type_parameters" | "visibility" | "doc_only" | "abort_set" | "emit_set"]
    }
  ],

  "deprecation_added": [ ... ],
  "deprecation_removed": [ ... ]
}
```

## Procedure

1. Build a key for each item: `<package>::<module>::<name>::<kind>`.
2. Compute set differences:
   - `added` = items in `HEAD_SURFACE` not in `BASE_SURFACE`.
   - `removed` = items in `BASE_SURFACE` not in `HEAD_SURFACE`.
   - `intersection` = items in both.
3. For each item in `intersection`, compute `diff_dimensions`:
   - `signature` if the canonical signature string changed.
   - `abilities` if the abilities list changed (structs).
   - `type_parameters` if the type parameter list changed.
   - `visibility` if visibility changed (e.g. `public(friend)` →
     `public`).
   - `doc_only` if only `doc_summary`, `doc_aborts`, or `doc_emits`
     changed and nothing structural.
   - `abort_set` if `abort_sites` differs.
   - `emit_set` if `emit_sites` differs.
4. Detect rename candidates: items removed from one module and added
   to another with a matching signature and similar name. Emit them
   as `renamed_modules` (or `renamed_items`) only when confidence is
   high (signatures and abilities both match). Otherwise leave them
   in `removed_items` + `added_items`.
5. Detect deprecation transitions: items that gained
   `deprecated: true` between commits go to `deprecation_added`;
   items that lost it go to `deprecation_removed`.

## Failure conditions

- Inputs missing or malformed → stop.
- More than 50% of items show `signature` change in a single run →
  warn (likely a parser drift between extractor versions, not a real
  refactor). The agent should sanity-check before classifying.

## Interpretation

The output of this helper is the canonical structured input for
`references/rules/change-classification.md`. The agent maps `diff_dimensions` and
membership in added/removed/changed sets to classification names:

- `added_modules` → `New module/package`.
- `removed_modules` → `Removed feature` (+ `Breaking change`
  secondary).
- `added_items` of kind `function` → `New public function`.
- `added_items` of kind `event` → `Changed event`.
- `removed_items` → `Removed feature` (+ `Breaking change`).
- `changed_items` with `diff_dimensions` containing `signature`,
  `type_parameters`, or `visibility` → `Changed function signature`
  (+ `Breaking change` if not additive).
- `changed_items` with `abort_set` only → `Changed abort/error
  condition`.
- `changed_items` with `emit_set` only → `Changed event`.
- `changed_items` with `abilities` only → `Changed ability/ownership
  semantics`.
- `changed_items` with `doc_only` only → `Documentation-only source
  comment change`.
- `deprecation_added` → `Deprecated feature`.

The agent must still apply the secondary `Security-sensitive
behavior` classification by inspecting which modules / functions
were touched (per the trigger list in
`references/rules/change-classification.md`).
