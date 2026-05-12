# G2 proposal template — Public API delta

Emit this block at the end of process Step 9 in `interactive` mode.
End the turn after the trailing approval line. Use full module paths
and full signatures — never truncate.

If a category is empty, write `(none)` rather than omitting the
heading; reviewers should be able to confirm at a glance that the
category was actually checked.

```
🛑 Gate G2 — Public API delta
Summary: +<N> functions, +<N> structs, +<N> events, +<N> errors,
         -<N> functions, -<N> structs, -<N> events, -<N> errors,
         <N> changed signatures, <N> changed doc comments
Diff range: <BASE_COMMIT>..<HEAD_COMMIT> (<N> commits)

### Added modules / packages
- <module::path>
- (none)

### Removed modules / packages
- <module::path>
- (none)

### Added public functions
- `<module::path::function_name(arg: Type, ...): ReturnType>`
- (none)

### Removed public functions
- `<module::path::function_name(arg: Type, ...): ReturnType>`
- (none)

### Changed function signatures
- `<module::path::function_name>`
  - before: `(<old args>): <old return>`
  - after:  `(<new args>): <new return>`
- (none)

### Added structs / types
- `<module::path::StructName has copy, drop>`
  - fields: <field: Type, ...>
- (none)

### Changed structs / types
- `<module::path::StructName>`
  - field changes: <field: Type added | removed | changed Type>
  - ability changes: <added/removed abilities>
- (none)

### Removed structs / types
- `<module::path::StructName>`
- (none)

### Added / removed constants
- added:   `<module::path::CONST_NAME: Type = value>`
- removed: `<module::path::CONST_NAME>`
- (none)

### Added / removed events
- added:   `<module::path::EventName>`
- removed: `<module::path::EventName>`
- (none)

### Added / removed errors / abort codes
- added:   `<module::path::EErrorName = N>`
- removed: `<module::path::EErrorName>`
- (none)

### Changed doc comments on public items
- `<module::path::item>` — <one-line summary of the comment change>
- (none)

### Skipped (out of public surface)
- <contracts file path> — reason: <tests/ | scripts/ | internal/ | vendored/>
- (none — say so explicitly so the reviewer knows nothing was hidden)

Reply "approve" to proceed to docs planning, or describe corrections
(e.g. "treat foo as private", "include bar/", "the change to baz is
internal only").
```
