# Proposal templates for docs-sync gates

In `interactive` mode, the docs-sync workflow stops at four gates. At
each gate, the skill emits a structured **proposal block** based on one
of the templates in this directory and ends its turn, waiting for the
user to approve or refine.

| Gate | Template                       | Stops after process step          |
|------|--------------------------------|-----------------------------------|
| G1   | `g1-inputs-and-config.md`      | Step 2 (config loaded)            |
| G2   | `g2-api-delta.md`              | Step 9 (public API extracted)     |
| G3   | `g3-docs-edit-plan.md`         | Step 11 (edit plan aggregated)    |
| G4   | `g4-page-rewrite.md`           | per broad rewrite in Step 13      |

## Approval phrases

The skill MUST treat these (case-insensitive) as approval to proceed:

- `approve`
- `approved`
- `looks good`
- `lgtm`
- `proceed`
- `yes`
- `go`

Anything else is a **refinement** — apply the requested change, re-emit
the same gate's proposal block with the updated content, and wait
again. The skill MUST NOT proceed past a gate without explicit
approval.

## Style rules for proposal blocks

- Plain markdown. No emoji except the `⚠️` flag on warning lines and the
  `🛑` header marker on the gate heading itself.
- Use full module paths and full function signatures — never truncate.
- Counts go in the header (`12 to edit, 5 to create`) so the user can
  triage before reading the full list.
- One trailing line is always the approval prompt — no other content
  after it.

## Why no `AskUserQuestion`

The skill body is atomic and Catalina-compliant. Inputs are gathered
upfront via the frontmatter `inputs` schema. Mid-execution gates use
plain text + end-of-turn instead of an interactive tool, which keeps
the skill reusable in both Claude Code sessions and any harness that
collects inputs without an interactive prompt loop.
