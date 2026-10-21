# docgen-fixup process

Deterministic workflow. Steps run in order. If a step fails, stop and surface — do not skip ahead.

All paths in this document are relative to the docs repo unless prefixed `<CONTRACTS_REPO_PATH>`.

---

## Step 0 — Validate inputs

Inputs arrive from the frontmatter `inputs` schema. Validate inline:

- `pr_number`: is a positive integer; PR exists and is open on `OpenZeppelin/docs`.
- `contracts_repo_path` (if provided): exists and is a git repo.
- `contracts_tag` (if provided): resolves in the source contracts repo.

Missing / invalid input is a hard error — return an error message naming every failing field. Never invent values.

## Step 1 — Fetch PR metadata

```
gh pr view <pr_number> --repo OpenZeppelin/docs \
  --json title,body,headRefName,baseRefName,changedFiles,url,mergeable
```

Record `headRefName` (branch), `baseRefName` (target — usually `main`), and the body.

## Step 2 — Resolve source repo, docs slice, and tag

Parse the PR body:

- **Repository** line names the source repo (e.g. `OpenZeppelin/openzeppelin-contracts`, `OpenZeppelin/openzeppelin-community-contracts`, `OpenZeppelin/openzeppelin-confidential-contracts`).
- **Reference** line names the tag / branch (e.g. `v5.7.0-rc.0`, `master`).
- **Output Directory** line names the docs slice (e.g. `content/contracts/5.x/api`, `content/community-contracts/api`, `content/confidential-contracts/api`).

Fill in `contracts_repo_path` and `contracts_tag` from inputs if provided; otherwise from the body. Then:

- Auto-detect the local checkout. Walk the parent of `<DOCS_REPO_PATH>` and any known sibling roots. For each candidate directory, run `git -C <candidate> remote get-url origin 2>/dev/null` and match against the parsed source repo. Common names to try, per source repo:

  | Source repo                                            | Candidate dir names                                    |
  |--------------------------------------------------------|--------------------------------------------------------|
  | `OpenZeppelin/openzeppelin-contracts`                  | `solidity`, `openzeppelin-contracts`                   |
  | `OpenZeppelin/openzeppelin-community-contracts`        | `community`, `openzeppelin-community-contracts`        |
  | `OpenZeppelin/openzeppelin-confidential-contracts`     | `confidential`, `openzeppelin-confidential-contracts`  |

  Fall back to a `git remote -v | grep <repo>` sweep across all directories under the workspace root if none of the common names hit. Do not invent a path.

- Fetch the tag: `git -C <CONTRACTS_REPO_PATH> fetch origin refs/tags/<contracts_tag>:refs/tags/<contracts_tag>` for a tag, or `git -C <CONTRACTS_REPO_PATH> fetch origin <contracts_tag>` for a branch (community-contracts and confidential-contracts often generate against `master`).
- Create a read-only worktree pinned at the ref:
  ```
  git -C <CONTRACTS_REPO_PATH> worktree add /tmp/oz-src-<slug> <contracts_tag>
  ```
  Use a slug that includes both the repo short-name and the ref so parallel runs don't collide: `oz-src-contracts-v5.7.0-rc.0`, `oz-src-community-master`, etc. Remove in Step 11.

Note the docs slice from the PR body so pattern-scan globs stay scoped to that slice (`content/<slice>/**/*.mdx`) and don't false-positive on other slices.

If auto-detection or fetching fails, stop with a clear error naming both the parsed repo and the candidate paths that were tried.

## Step 3 — Check out the PR branch locally

```
git -C <DOCS_REPO_PATH> fetch origin pull/<pr_number>/head:pr-<pr_number>
git -C <DOCS_REPO_PATH> checkout pr-<pr_number>
```

Record the previous branch so it can be restored at end of run.

## Step 4 — Capture per-file diffs

Stage the diff for pattern scanning:

```
mkdir -p /tmp/pr-<pr_number>-diffs
for f in $(gh pr diff <pr_number> --repo OpenZeppelin/docs --name-only); do
  safe=$(echo "$f" | sed 's|/|__|g')
  git -C <DOCS_REPO_PATH> diff origin/<baseRefName> pr-<pr_number> -- "$f" > "/tmp/pr-<pr_number>-diffs/$safe.diff"
done
```

## Step 5 — Run the pattern catalog

For each pattern in `references/patterns.md`, in order:

1. Run its **Detection** command / heuristic against the diff (or the PR branch's MDX, whichever the pattern specifies).
2. Collect hits — one row per (file, line, matched snippet).
3. For each hit, verify against upstream source in `/tmp/oz-src-<tag>/` before flagging. Skip if the hit is a false positive (the pattern description says how).
4. If the pattern **has** an upstream fix, note the upstream file + line for the eventual upstream PR.

## Step 6 — Findings gate (interactive mode)

Emit ONE findings block per pattern that has hits. Format:

```
## Pattern: <pattern-name>
Symptom: <one-line>
Root cause: <one-line>

### Hits
- <file>:<line> — <short snippet>
  → MDX patch: <what the fix will do>
  → Upstream: <file>:<line> — <what the upstream fix will do>  (or: "no clean upstream fix")

### Approval
Reply "apply" to patch the MDX + open the upstream PR, "skip" to leave this pattern alone this run, or refine to change the plan.
```

End the turn after emitting all findings blocks. Wait for the user's response. Accept: `apply`, `apply all`, `skip`, or refinements. Anything else re-emit + wait.

In `automatic` mode, skip this gate — apply every patch immediately.

## Step 7 — Apply MDX patches

For each approved pattern:

1. Read the affected MDX file (must Read before Edit).
2. Apply the direct patch described in `references/patterns.md`. Use `Edit` with enough surrounding context to make the `old_string` unique.
3. Verify the patch: re-grep for the pattern's detection signature on the file; the hit should be gone.

Never batch a rewrite. One `Edit` per (file, hit).

## Step 8 — Open upstream PRs

For each approved pattern with an upstream fix:

1. Group hits by target file — one branch per file is fine, one branch per pattern is better.
2. Create a worktree on the source contracts repo (do not disturb the user's current checkout):
   ```
   git -C <CONTRACTS_REPO_PATH> worktree add /tmp/oz-upstream-<slug> origin/master
   ```
3. Apply the upstream edits in that worktree.
4. Commit with a subject in the form `docs: <what changed> in <file>`.
5. Push to the user's fork:
   ```
   git -C /tmp/oz-upstream-<slug> push <fork-remote> <branch>
   ```
   The fork remote is the one whose URL points at the user's GitHub username. Do not push to `origin` on the contracts repo.
6. Open a PR:
   ```
   gh pr create --repo <upstream-repo> --base master --head <fork-user>:<branch> \
     --title "<subject>" --body "<body referencing the docs PR that surfaced this>"
   ```
7. Remove the worktree.

Record the PR URL for the final report.

## Step 9 — Commit and push the MDX patches

```
git -C <DOCS_REPO_PATH> add <patched-mdx-files>
git -C <DOCS_REPO_PATH> commit -m "fixup: apply docgen-fixup patterns to <pr_number>"
git -C <DOCS_REPO_PATH> push origin pr-<pr_number>:<headRefName>
```

Only push if the user's docs remote points at their fork or they have write access to `OpenZeppelin/docs`. Verify with `git remote -v` before pushing. If neither is true, stop and surface — do not force it.

## Step 10 — Catalog new patterns (if any)

If Step 5 surfaced a regression pattern that is NOT in `references/patterns.md`:

1. Draft a new entry in the same shape as an existing one (Symptom / Detection / Root cause / Upstream fix / MDX patch / Example).
2. Append it to `references/patterns.md`.
3. Commit under the same message so the catalog grows with each run.

## Step 11 — Restore local state

- Return the docs repo to the branch it was on when the run started.
- Remove `/tmp/oz-src-<tag>/`, `/tmp/oz-upstream-<slug>/`, `/tmp/pr-<pr_number>-diffs/`.
- Do not delete the `pr-<pr_number>` local branch — leave it available for follow-up.

## Step 12 — Report

Emit the report per `references/report-template.md`. Inline in the final message — do not write to a file unless the user asks.
