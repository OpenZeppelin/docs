# G4 proposal template — Per-page broad rewrite

Emit this block in process Step 13, in `interactive` mode, **once per
broad rewrite** before editing the file. Targeted rewrites do not stop
at G4. End the turn after the trailing approval line.

```
🛑 Gate G4 — Page rewrite: <path>

- Diátaxis category: <tutorial | how-to | reference | explanation>
  - move: <unchanged> | <old category> -> <new category>
- Action: <create | rewrite-whole-page | rewrite-sections>
- Sections affected: <list of section headings, or "whole page">
- Triggered by:
  - api items: <list from Step 9 — full names>
  - matrix row: <row id or one-line description>
- Approach: <one paragraph describing the structure and substance of
  the rewrite — what stays, what changes, what gets added>
- Risk / `needs-human-review` flags:
  - <one line per concern, or "none">

Reply "approve" to apply this rewrite, "skip" to leave the page as-is
and record needs-human-review, or describe changes to the approach.
```

## When to classify a rewrite as "broad" (and thus subject to G4)

Per process Step 13, a rewrite is **broad** when any of the following
is true:

- The page is being created from scratch.
- The Diátaxis category is moving.
- More than one named section is being rewritten.
- The whole page is being regenerated.
- The change adds or removes a security warning section.

Otherwise, the rewrite is **targeted** — single signature swap, single
snippet update, one short paragraph edit — and proceeds without G4.

When in doubt, classify as broad. The cost of an extra G4 stop is small;
the cost of a silent broad rewrite is large.
