# check_code_snippets spec

Validate fenced code blocks in the docs slice per the slice's
`examples.snippet_validation` setting.

## Inputs

- `LIBRARY_DOCS_ROOT` — `docs.library_root` from config.
- `LANGUAGE` — `library.language` from config.
- `VALIDATION_LEVEL` — `examples.snippet_validation`:
  - `none` — skip validation entirely.
  - `syntax` — parse code blocks and report syntax errors.
  - `compile` — run `examples.compile_command` (if set) on
    extracted snippets.
  - `test` — same as `compile` but also run tests.
- `COMPILE_COMMAND` — `examples.compile_command` (if set).
- `EXAMPLES_ROOT` — `examples.examples_root` (if set; otherwise empty
  and only embedded snippets are checked).

## Output

```
{
  "snippets_total": <int>,
  "snippets_validated": <int>,
  "syntax_errors": [
    {"file": "<path>", "line": <int>, "language": "<lang>",
     "message": "<parser message>"}
  ],
  "compile_errors": [
    {"file": "<path>", "line": <int>, "command": "<cmd>",
     "stdout": "<...>", "stderr": "<...>"}
  ]
}
```

## Procedure

1. Walk every `*.mdx` under `<LIBRARY_DOCS_ROOT>`.
2. Extract fenced code blocks. Track:
   - File path and starting line number.
   - Fence info string (` ```move`, ` ```cairo`, etc.).
   - Block content.
3. For each block whose language matches `LANGUAGE` (or is plausibly
   the slice's language — for `MOVE_SUI`: `move`, `move-sui`,
   `move2024`):
   - If `VALIDATION_LEVEL == none`: skip.
   - If `VALIDATION_LEVEL == syntax`: parse with the language's
     parser. Record a `syntax_errors` entry on failure.
   - If `VALIDATION_LEVEL in {compile, test}`:
     a. Extract to a temporary file under a scratch project.
     b. Run `COMPILE_COMMAND` against the scratch project.
     c. Record `compile_errors` on non-zero exit.
4. If `EXAMPLES_ROOT` is set, validate the project there separately
   using the same level.

## Failure conditions

- The configured parser/compiler is not available → record once at
  the run level and downgrade to the next-lower validation level
  (e.g. `compile` → `syntax`). Note the downgrade in the report.
- A snippet has no language tag → skip and add a soft warning;
  unmarked code blocks are not part of the public docs guarantee.

## Interpretation

- `syntax_errors` and `compile_errors` are hard failures for the
  Code snippets validation step in `process.md`.
- Automatic mode attempts up to one round of mechanical fixes for
  obvious issues (stale identifiers, renamed items per
  `compare_public_api`). After one round, remaining failures are
  recorded as `needs-human-review`.
- Interactive mode prints the failure count and the first few
  examples and asks whether to auto-fix or leave alone.

Snippets in tutorials and how-to guides have a higher bar (they
should compile when possible). Snippets inside reference entries are
typically illustrative; `syntax`-level validation is enough.
