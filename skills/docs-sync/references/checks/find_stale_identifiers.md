# find_stale_identifiers spec

Find references to removed or renamed names, package ids, addresses,
and function signatures inside the docs slice.

## Inputs

- `LIBRARY_DOCS_ROOT` — `docs.library_root` from config.
- `COMPARE_RESULT` — output of `compare_public_api`, which lists
  removed, renamed, and changed items.
- `RELEASE_VERSION` — the new release tag.
- `OLD_RELEASE_VERSIONS` — optional list of older release tags to
  search for (legacy version pins in source links).
- `KNOWN_ADDRESSES` — optional list of canonical package addresses
  for the contracts library (current and previous), if the project
  embeds them.

## Output

```
{
  "stale_function_names": [
    {"file": "<path>", "line": <int>, "name": "<name>", "context": "<excerpt>"}
  ],
  "stale_event_names":   [ ... ],
  "stale_error_names":   [ ... ],
  "stale_struct_names":  [ ... ],
  "stale_signatures":    [ {"file": ..., "line": ..., "before_signature": "<sig>", "after_signature": "<sig>", "context": "<excerpt>"} ],
  "stale_addresses":     [ {"file": ..., "line": ..., "address": "<addr>"} ],
  "stale_version_pins":  [ {"file": ..., "line": ..., "old_version": "<v>", "expected_version": "<RELEASE_VERSION>"} ]
}
```

## Procedure

1. Build the search lists from `COMPARE_RESULT`:
   - `removed_function_names` ← every removed `function` item name.
   - `removed_event_names` ← every removed `event` item name.
   - `removed_error_names` ← every removed error const name.
   - `removed_struct_names` ← every removed `struct` item name.
   - `signature_diffs` ← every `changed_items` entry where
     `signature` is in `diff_dimensions`.
2. For each name in the removed lists, grep the slice
   (`<LIBRARY_DOCS_ROOT>` recursively) and record matches.
3. For each `signature_diff`, search for the `before` signature
   string verbatim and record matches that are not already
   accompanied by the `after` signature in the same block.
4. For each url containing `OLD_RELEASE_VERSIONS` (e.g. `/blob/v1.0.0/`),
   record under `stale_version_pins` if the release pinned for the
   touched module is now `<RELEASE_VERSION>`.
5. For each address in `KNOWN_ADDRESSES` that is not the current
   canonical address, record under `stale_addresses`.

## Failure conditions

- `COMPARE_RESULT` missing or malformed → stop.
- No `LIBRARY_DOCS_ROOT` on disk → stop (process.md Step 6 catches
  this earlier).

## Interpretation

- Every entry in the output is a finding. Automatic mode applies
  these rules:
  - For renamed items where the rename is high-confidence (per
    `compare_public_api`), substitute the new name in prose links
    and headings, but **never** silently rewrite code blocks for
    semantics.
  - For `stale_version_pins`, update to `<RELEASE_VERSION>`.
  - For `stale_addresses`, do not auto-update — addresses are
    sensitive; surface as a hard finding.
  - For `stale_function_names` / event / error / struct without a
    rename target, surface as `needs-human-review`.
- Interactive mode prints the count per category and asks whether
  to auto-fix the safe categories.

Heuristic rules to avoid false positives:

- Skip matches inside fenced code blocks marked as
  pre-`<RELEASE_VERSION>` snippets (look for a fence info string
  containing the old version, or a heading like
  "Before <release>:").
- Skip matches inside a "Version history" section.
- Skip matches where the surrounding text explicitly uses words like
  "deprecated" or "removed in <version>".
