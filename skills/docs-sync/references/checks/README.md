# docs-sync helper scripts

These files are validation and extraction **specs**, not executable
scripts. They define the inputs, outputs, failure conditions, and
interpretation rules for each helper the agent uses during a
`docs-sync` run.

The agent should pick the most appropriate concrete command in its
runtime environment (rg, grep, language-specific parsers, project
tooling) to satisfy each helper's contract. If the project ships a real
implementation, prefer it and record the command used.

## Files

| File | Purpose |
|---|---|
| [extract_public_api.md](./extract_public_api.md) | Extract the public API surface at a given commit. |
| [compare_public_api.md](./compare_public_api.md) | Diff two extracted surfaces and produce a structured change list. |
| [detect_missing_pages.md](./detect_missing_pages.md) | Find public items that lack a reference entry. |
| [check_links.md](./check_links.md) | Validate internal links and anchors inside the slice. |
| [check_code_snippets.md](./check_code_snippets.md) | Validate fenced code blocks per `examples.snippet_validation`. |
| [check_nav_consistency.md](./check_nav_consistency.md) | Cross-check navigation config against actual content. |
| [find_stale_identifiers.md](./find_stale_identifiers.md) | Find references to removed names, addresses, signatures. |

Each helper:

- Lists explicit inputs.
- Lists expected outputs in a stable, parseable shape.
- Lists failure conditions that should make the agent stop or warn.
- Lists how the agent should interpret the result (block the run? add
  a `needs-human-review` finding? auto-fix?).
