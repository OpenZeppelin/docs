# check_links spec

Validate internal links and anchors inside the docs slice.

## Inputs

- `LIBRARY_DOCS_ROOT` — `docs.library_root` from config.
- `VERSION_DOCS_ROOT` — `docs.version_root` from config.
- `NAV_CONFIG_PATH` — `docs.nav_config_path` from config.
- `EXTERNAL_CHECK` — `false` by default. When `false`, do not fetch
  external URLs.

## Output

```
{
  "broken_internal_links": [
    {"file": "<path>", "line": <int>, "href": "<href>", "reason": "<why>"}
  ],
  "broken_anchors": [
    {"file": "<path>", "line": <int>, "href": "<href>", "anchor": "<id>"}
  ],
  "broken_relative_paths": [
    {"file": "<path>", "line": <int>, "href": "<href>"}
  ],
  "external_links_skipped": [
    {"file": "<path>", "line": <int>, "href": "<href>"}
  ]
}
```

## Procedure

1. Walk every `*.mdx` file under `<LIBRARY_DOCS_ROOT>`.
2. For each markdown link `[text](href)` (including images and JSX
   attribute hrefs):
   - If `href` starts with `http://` or `https://` and
     `EXTERNAL_CHECK` is false, record under `external_links_skipped`
     and skip.
   - If `href` starts with `/`, treat as a docs-site root-relative
     URL. Resolve to a content path using the docs framework rules:
     `/contracts-sui/1.x/api/access` → `content/contracts-sui/1.x/api/access.mdx`.
   - If `href` starts with `./` or `../`, resolve relative to the
     current file.
   - If `href` contains a `#fragment`, split into path and anchor.
3. For each resolved path, check that the file exists.
4. For each anchor, parse the target file and confirm the anchor is
   declared (look for `id="..."` and `<a id="..."></a>`, also any
   `[#anchor]` syntax this slice uses).
5. For navigation: parse `<NAV_CONFIG_PATH>` JSON, resolve every
   `url` to a content file the same way, and record any nav entry
   that points nowhere as a `broken_internal_links` finding.

## Failure conditions

- A file under `<LIBRARY_DOCS_ROOT>` cannot be parsed as MDX → record
  with `reason: "parse_error"` and continue.
- `<NAV_CONFIG_PATH>` cannot be parsed as JSON → return a clear
  failure; the run cannot complete navigation validation.

## Interpretation

- Any `broken_internal_links`, `broken_anchors`, or
  `broken_relative_paths` entry is a `fail` for the Links validation
  step in `process.md`.
- Automatic mode tries to auto-fix:
  - If the broken anchor was renamed in this run (per
    `compare_public_api`), repoint the link.
  - If the broken file path was renamed in this run, repoint the
    link.
  - Otherwise, leave the link and add a `needs-human-review`
    finding.
- Interactive mode lists each finding once and asks "auto-fix where
  possible? (yes/no)" — never re-asks within the same run.
