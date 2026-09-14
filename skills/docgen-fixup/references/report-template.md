# docgen-fixup run report

Emit inline at end of run. Do not write to a file unless the user asks.

## PR reviewed

- PR: [OpenZeppelin/docs#<pr_number>](<pr_url>)
- Source: `<contracts_repo>@<contracts_tag>`
- Base: `<baseRefName>`
- Head: `<headRefName>`
- Changed files: <count>

## Patterns matched

For each pattern from `references/patterns.md` that had hits:

### <pattern-name>

- Hits: <count>
- MDX patched: <count>
- Upstream PR: <url or "n/a">
- Skipped: <count with reasons>

Example line for a hit:

- `<file>:<line>` — <one-line description of the fix>

## Upstream PRs opened

- [<upstream-repo>#<pr>](<url>) — <one-line subject>

## New patterns discovered

For any regression pattern encountered that was not in the catalog:

- Name: `<pattern-name>`
- File added: `references/patterns.md` (new entry appended)
- One-line description
- First observed on: PR #<n>

If none: `None.`

## Skipped / needs human review

- <file>:<line> — <reason>

If none: `None.`

## Next steps

- What the user should verify before merging (e.g. render one of the patched pages in the dev server).
- Any pattern that has no clean fix yet.
