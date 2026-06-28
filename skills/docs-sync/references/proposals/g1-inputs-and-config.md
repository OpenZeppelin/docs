# G1 proposal template — Inputs & config

Emit this block at the end of process Step 2 in `interactive` mode.
End the turn after the trailing approval line. Do not interleave any
other tool calls or text after the block.

```
🛑 Gate G1 — Inputs & config

### Resolved inputs
- mode:                <value>           [default applied | from caller]
- contracts_repo_path: <abs path>
- docs_repo_path:      <abs path>        [default applied: cwd]
- base_commit:         <sha or ref>      (resolves to <full sha>)
- head_commit:         <sha or ref>      (resolves to <full sha>)
- library_id:          <id>
- docs_version:        <version>
- release_version:     <release tag>
- docs_update_scope:   <value>           [default applied: full]
- target_audience:     <value>           [from config | overridden]
- docs_tone:           <value>           [from config | overridden]

### Resolved slice paths (relative to docs_repo_path)
- library root:        <docs.library_root>
- version root:        <docs.version_root>
- API reference:       <docs.api_reference_path>
- nav config:          <docs.nav_config_path>
- local conventions:   <docs.local_conventions_path>

### Mode and scope
- mode = <interactive|automatic> — <one-line consequence>
- scope = <full|api-only|guides-only> — <one-line consequence>

### Flags
- ⚠️ <anything missing, ambiguous, or surprising — one line each>
- (omit this section entirely if there are no flags)

Reply "approve" to proceed, or describe corrections.
```
