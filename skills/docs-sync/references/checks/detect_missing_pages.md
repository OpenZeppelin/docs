# detect_missing_pages spec

Find public items that lack a reference entry in the docs slice.

## Inputs

- `HEAD_SURFACE` — JSON output of `extract_public_api(<HEAD_COMMIT>)`.
- `API_REFERENCE_PATH` — `docs.api_reference_path` from config
  (relative to `<DOCS_REPO_PATH>`).
- `LAYOUT` — `api_reference_layout.page_per` from config
  (`package` or `module`).
- `ANCHOR_CONVENTION` — how reference anchors are formed
  (default for Sui: `<module>-<item>`).

## Output

```
{
  "missing_modules": [
    {"package": "...", "module": "...", "expected_path": "<path>"}
  ],
  "missing_items": [
    {"package": "...", "module": "...", "kind": "...", "name": "...",
     "expected_anchor": "<anchor>", "expected_path": "<path>"}
  ],
  "orphan_pages": [
    {"path": "<path>", "reason": "no matching public item"}
  ]
}
```

## Procedure

1. For each module in `HEAD_SURFACE`, compute the expected page path:
   - `LAYOUT == "package"`:
     `<API_REFERENCE_PATH>/<package>.mdx`.
   - `LAYOUT == "module"`:
     `<API_REFERENCE_PATH>/<package>/<module>.mdx`.
2. Check that the file exists. If not, record under
   `missing_modules`.
3. If the file exists, parse it for declared anchors (any `id="..."`
   on `<APIItem>` blocks, plus literal `<a id="..."></a>` tags).
4. For each `item` in the module, compute the expected anchor per
   `ANCHOR_CONVENTION` (default `<module>-<item>`).
5. If the anchor is not present in the page, record under
   `missing_items`.
6. Walk every existing page under `<API_REFERENCE_PATH>`. For each,
   parse anchors and confirm at least one item in `HEAD_SURFACE`
   maps to it. If none does, record under `orphan_pages`.

## Failure conditions

- `<API_REFERENCE_PATH>` does not exist on disk → record at the run
  level (the agent already handles this in process.md Step 6).
- Parsing an MDX page failed → record the page in
  `orphan_pages` with reason `parse_error` and continue.

## Interpretation

- `missing_modules` is a hard finding. The agent must create the
  missing page (automatic mode) or surface it for confirmation
  (interactive mode).
- `missing_items` is a hard finding for items in `HEAD_SURFACE`. The
  agent must add the entry to the page in canonical source order.
- `orphan_pages` is a soft finding. Reasons include:
  - The item was renamed (likely paired with a `missing_items`
    entry).
  - The item was removed in this run.
  - The page documents something no longer in the public surface
    extractor (possible parser issue — surface as a warning).

In the report, `orphan_pages` is reviewed against `removed_items`
from `compare_public_api`. Pages whose only items were removed should
be deleted (Removed feature classification); pages whose orphan
status is unexplained become `needs-human-review`.
