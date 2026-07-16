# G3 proposal template — Docs edit plan

Emit this block at the end of process Step 11 in `interactive` mode.
End the turn after the trailing approval line. Every entry MUST attribute
the action to (a) the API items it covers and (b) the matrix row that
forced it — this lets the reviewer challenge specific lines without
re-deriving the plan.

If a section is empty, write `(none)` rather than omitting the heading.

```
🛑 Gate G3 — Docs edit plan
Summary: <N> to create, <N> to edit, <N> to delete, <N> skipped (out of scope)
Scope: <full | api-only | guides-only>

### Will create
- <path> — <category> — covers: <api items> — reason: <matrix row>
- (none)

### Will edit
- <path> — <category> — covers: <api items> — reason: <matrix row>
- (none)

### Will delete
- <path> — <category> — reason: <matrix row>
- (none)

### Will leave alone (matrix-required but out of <docs_update_scope>)
- <path> — would have been <category> — excluded by scope=<value>
- (none)

### Navigation deltas (will apply at Step 15)
- add:    <nav entry path>
- remove: <nav entry path>
- rename: <old path> -> <new path>
- (none)

### Rewrite breadth (drives Gate G4 in Step 13)
- broad rewrites (will stop at G4 individually):
  - <path> — <reason for broad classification>
  - (none)
- targeted rewrites (will apply without further approval):
  - <path> — <one-line summary of the change>
  - (none)

### Assumptions
- <one line per assumption — defaults applied, fallbacks taken, etc.>
- (none)

Reply "approve" to proceed with edits, or describe scope changes (e.g.
"skip release notes", "drop the new tutorial", "also include path X").
```
