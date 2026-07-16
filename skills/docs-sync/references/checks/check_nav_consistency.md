# check_nav_consistency spec

Cross-check the slice's navigation config against the actual content
on disk.

## Inputs

- `NAV_CONFIG_PATH` — `docs.nav_config_path` from config.
- `LIBRARY_DOCS_ROOT` — `docs.library_root` from config.
- `VERSION_DOCS_ROOT` — `docs.version_root` from config.
- `URL_TO_PATH` — function that maps a nav `url` to a content path.
  For Sui: `/contracts-sui/1.x/api/access` →
  `content/contracts-sui/1.x/api/access.mdx`.
- `REQUIRED_FOLDERS` — `navigation.required_folders` from config (if
  set).

## Output

```
{
  "nav_entries_pointing_nowhere": [
    {"name": "<nav label>", "url": "<url>", "expected_path": "<path>"}
  ],
  "pages_not_in_nav": [
    {"path": "<path>", "url_guess": "<url>"}
  ],
  "missing_required_folders": ["<folder name>", ...],
  "meta_json_files_present": ["<path>", ...]
}
```

## Procedure

1. Parse `<NAV_CONFIG_PATH>` as JSON. Walk it recursively and
   collect every `{ "type": "page", "url": "..." }` entry.
2. For each `url`, compute `URL_TO_PATH(url)`. If the file does not
   exist under `<DOCS_REPO_PATH>`, record under
   `nav_entries_pointing_nowhere`.
3. Walk every `*.mdx` under `<LIBRARY_DOCS_ROOT>`. For each, compute
   the canonical url. If no nav entry points to it, record under
   `pages_not_in_nav`.
4. For each name in `REQUIRED_FOLDERS`, check the nav structure has
   a folder of that name at the expected level. Record missing names
   under `missing_required_folders`.
5. Walk `<LIBRARY_DOCS_ROOT>` for any `meta.json` files. Record their
   paths under `meta_json_files_present`. (For slices where
   `navigation.forbid_meta_json: true`, this is always a fail.)

## Failure conditions

- `<NAV_CONFIG_PATH>` cannot be read or parsed → return a clear
  failure; the run cannot validate navigation.
- The slice has no canonical url-to-path mapping (i.e. the docs
  framework's routing is unknown) → return a soft failure and skip
  the cross-check; record the limitation in the report.

## Interpretation

- `nav_entries_pointing_nowhere` is a hard fail.
- `pages_not_in_nav` is a hard fail unless the page is explicitly
  unlisted (e.g. drafts), which the slice does not currently use —
  flag every such page.
- `missing_required_folders` is a hard fail.
- `meta_json_files_present` is a hard fail when
  `navigation.forbid_meta_json: true`.

Automatic mode auto-fixes the obvious cases:

- For pages added in this run with no nav entry, insert one
  alphabetically inside the matching folder per
  `navigation.required_folders` and the existing folder structure.
- For nav entries pointing at pages deleted in this run, remove the
  entry.

It does not auto-fix `meta_json_files_present`; deleting `meta.json`
files outside the run's scope is too aggressive. Surface the
finding so the slice owner can act.
