# Explanation template

Use this template when creating or rewriting an explanation page. An
explanation is **understanding-oriented**: it builds the reader's
mental model, covers rationale, tradeoffs, security model, and
integration context.

An explanation does **not** teach a workflow (use a tutorial), does
**not** prescribe a recipe (use a how-to guide), and does **not** list
function signatures (use the reference).

---

```mdx
---
title: <Topic, e.g. "Two-step ownership transfer: model and tradeoffs">
description: <One sentence framing the topic.>
---

# <Title>

## Problem

<One or two paragraphs framing the problem this design exists to
solve. State it from the user's perspective. Why would a developer
care? What goes wrong if the problem is ignored?>

## Mental model

<The model we want the reader to internalize. Diagrams or simple text
sketches are encouraged. Define the actors, the objects, and the
invariants in 3–6 short paragraphs.>

- **Actors**: <who initiates / approves / observes / cancels?>
- **Objects**: <what state lives where?>
- **Invariants**: <what is always true while a flow is in progress?>

## Design rationale

<Why is the system shaped this way? Walk through the constraints that
forced the design:

- Move language constraints (abilities, ownership, type system).
- Sui object model constraints (owned vs shared, transfer rules).
- Security constraints (least privilege, replay protection,
  recoverability).
- Operational constraints (PTB composability, gas, indexing).>

## Alternatives considered

<2–4 alternatives that were considered and rejected, each with one
paragraph on why. This is the section that pays the most readers per
line written — most users land on explanations to confirm or
challenge their own design instincts.>

- **Alternative A — <name>.** Pros: <…>. Cons: <…>. Reason rejected: <…>.
- **Alternative B — <name>.** Pros: <…>. Cons: <…>. Reason rejected: <…>.
- **Alternative C — <name>.** Pros: <…>. Cons: <…>. Reason rejected: <…>.

## Tradeoffs

<What does the chosen design give up? Be honest. If the design has a
worse worst case than an alternative, say so.>

- <Tradeoff: extra round-trip / extra object / more events.>
- <Tradeoff: different failure mode that integrators must handle.>
- <Tradeoff: stricter prerequisites for integrators.>

## Security implications

<Apply `security.warning_style` from config. Cover, in order:>

1. **Trust assumptions** — who must be honest for the design to hold?
2. **Authority model** — who can do what at each stage?
3. **Failure modes** — what can go wrong, and what happens when it does?
4. **Recoverability** — how do users undo a mistake?
5. **Replay / griefing / denial-of-service** — how is it prevented?

If this topic is in `security.require_security_sections_for`, expand
this section in detail. Use explicit `WARNING` callouts for
self-inflicted footguns.

## Integration notes

<How does this design interact with the rest of the library, with
PTBs, with off-chain indexers, with upgrade paths?>

- **Composability**: <PTB-friendly? Hot-potato patterns? `entry`
  vs `public`?>
- **Indexing**: <which events should off-chain consumers subscribe to?>
- **Upgrade considerations**: <what stays stable across module
  upgrades, what doesn't?>
- **Cross-package interactions**: <known interactions with other
  OpenZeppelin Contracts for Sui packages.>

## Related guides

- [<task that uses this design>](../<package>.mdx)
- [<another task>](../<package>.mdx)

## Related API reference

- [`<module>`](../api/<package>.mdx#<package>-<module>)
- [`<function>`](../api/<package>.mdx#<package>-<module>-<function>)
```

---

## Authoring rules

- **No step lists.** If the page would benefit from a step list, the
  content belongs in a how-to guide.
- **No exhaustive function listings.** That belongs in reference. If
  you mention a function, link to it instead of redocumenting it.
- **State opinions clearly.** Explanations are the one place where the
  docs may say "we recommend X over Y, because Z".
- **Match `docs.tone` from config.** Default: *clear, precise,
  security-conscious*. In explanations this means: willing to discuss
  what could go wrong and willing to compare to alternatives.

## Where to put the file

- File: `<VERSION_DOCS_ROOT>/<package>.mdx` for short rationale
  attached to a package overview, or
  `<VERSION_DOCS_ROOT>/<topic>.mdx` for a stand-alone explanation.
- Nav entry: under the `Packages` folder in `<NAV_CONFIG_PATH>`, or a
  dedicated "Concepts" / "Explanations" folder if the slice has one.
