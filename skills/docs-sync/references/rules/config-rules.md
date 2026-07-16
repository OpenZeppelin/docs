# docs-sync config rules

The `skills/docs-sync/config/` tree is **shared memory** committed to the
docs repo. It is the source of truth that lets every developer and every
agent run the docs-sync process the same way.

## File layout

```
skills/docs-sync/
  config/
    libraries/
      <LIBRARY_ID>.yml              # one file per docs slice
```

One config file per `<LIBRARY_ID>`. If a single library has multiple
documented versions, the active version lives in `docs.version` and any
older or newer versions get their own config file
(`<LIBRARY_ID>-<VERSION>.yml`) when their layout, conventions, or
navigation differ.

## Hard rules

1. **Repo-relative only.** Every path inside a config file (`content_root`,
   `library_root`, `version_root`, `api_reference_path`, `product_index_path`,
   `version_index_path`, `local_conventions_path`, `nav_config_path`,
   `examples_root`) is relative to `<DOCS_REPO_PATH>`. Never write absolute paths
   (e.g. `/Users/...`, `/home/...`, `C:\\...`).
2. **No personal local paths.** Runtime local paths
   (`<CONTRACTS_REPO_PATH>`, `<DOCS_REPO_PATH>`) are passed as inputs at
   call time. They are never persisted to config.
3. **No secrets.** API keys, tokens, internal URLs, or anything sensitive
   must not be added to config. The skill is checked into git.
4. **Config beats inference.** When config defines a value, the agent uses
   that value. The agent only falls back to inferring from the docs tree
   when a field is empty or absent.
5. **Don't silently widen scope.** Editing config to add new docs slices
   or change `library_root` is a project-level decision. The agent must
   call this out in the docs-sync report and, in interactive mode, ask
   before changing it.

## Reading config

The agent's first concrete step on every run is:

1. Resolve `<CONFIG_PATH>` (default
   `skills/docs-sync/config/libraries/<LIBRARY_ID>.yml`).
2. Fail fast if the file does not exist. Do not fabricate defaults.
3. Treat all `docs.*` paths as relative to `<DOCS_REPO_PATH>`.
4. Validate that `library_root`, `version_root`, `api_reference_path`,
   and `nav_config_path` exist on disk under `<DOCS_REPO_PATH>`. If any
   is missing, stop and report it.

## Updating config

The agent **may** update config when, and only when, it discovers a
durable project convention that is not yet recorded:

- A new docs slice or version that the team has clearly adopted (a
  populated `version_root`, with at least an index page and one piece of
  reference content).
- A navigation file that has been renamed or moved.
- A local conventions file added at `local_conventions_path`.

The agent **must not** update config to:

- Reflect a one-off experiment in a feature branch.
- Capture personal preferences (file organization, tone changes) that the
  user has not explicitly framed as project-wide.
- Hard-code a runtime value (e.g. a contracts repo path or a release tag).

When the agent does change config, it records the change in the
docs-sync report (`Config changes` section) with old/new values and a
short rationale. In interactive mode it asks first.

## Source-comment policy

`automation.allow_source_comment_edits` controls whether the agent is
allowed to modify source/doc comments inside `<CONTRACTS_REPO_PATH>`.

- `false` (default): the agent must not edit source comments. If
  reference content is incomplete, it generates only accurate
  deterministic content and records a `needs-human-review` finding.
- `true`: the agent may edit source comments **only if** the user
  explicitly asks for it in the run prompt. Even then the agent should
  keep edits scoped to the modules touched by the diff.

## Failure handling

`automation.fail_on_unresolved_placeholders` controls how the agent
reacts to leftover placeholders in generated docs (`<TODO>`, `<FILL>`,
`<TARGET_AUDIENCE>`, `<RELEASE_VERSION>`, etc.):

- `true`: the agent stops and reports unresolved placeholders before
  finishing.
- `false`: the agent emits placeholders as TODOs in the report and
  continues.
