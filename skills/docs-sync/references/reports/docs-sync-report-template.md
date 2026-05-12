# docs-sync report template

End each run with a compact Markdown report in the final response. Do
not create a report file unless the user asks.

Use repo-relative paths only. Do not include personal absolute
filesystem paths.

```markdown
## docs-sync report

- Mode: <interactive | automatic>
- Library/version: <LIBRARY_ID> <DOCS_VERSION>
- Contracts range: <BASE_COMMIT>..<HEAD_COMMIT>
- Release/source pin: <RELEASE_VERSION | HEAD_COMMIT>
- Scope: <DOCS_UPDATE_SCOPE>
- Config: skills/docs-sync/config/libraries/<LIBRARY_ID>.yml

### Change Summary

| Construct | Classification | Docs impact | Evidence |
|---|---|---|---|
| <module/item> | <primary + secondary> | <pages/surfaces> | <commit/file/hunk> |

### Files Updated

- <path> — <what changed>

### Validation

- Public API coverage: pass | fail | skipped — <evidence>
- Stale identifiers: pass | fail | skipped — <evidence>
- Code snippets: pass | fail | skipped — <evidence>
- Links: pass | fail | skipped — <evidence>
- Navigation: pass | fail | skipped — <evidence>
- Placeholders: pass | fail — <evidence>

### Human Review

- Assumptions: <none | bullets>
- Needs human review: <none | bullets with path and reason>
- Skipped by scope: <none | bullets>

### Suggested PR

Title: docs(<LIBRARY_ID>/<DOCS_VERSION>): sync to <RELEASE_VERSION>

Body:
- <high-signal summary bullet>
- <validation bullet>
- <reviewer note if needed>
```
