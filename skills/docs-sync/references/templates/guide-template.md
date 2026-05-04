# How-to guide template

Use this template when creating or rewriting a how-to guide. A how-to
guide is **task-oriented**: the reader has a concrete outcome in mind
and wants the shortest reliable path to it.

If the reader is learning the library for the first time, use
`tutorial-template.md` instead. If the reader is looking up a fact, use
`api-reference-template.md`. If the reader wants to understand *why*,
use `explanation-template.md`.

---

```mdx
---
title: <Action verb + object> (e.g. "Rotate an admin capability")
description: <One sentence describing the user goal.>
---

# <Title>

## Goal

<One short paragraph: what the reader will have done by the end of this
guide. Phrase it as the user's outcome, not the library's behavior.>

## Prerequisites

- <Library and version, e.g. `openzeppelin_access` v1.x.>
- <Sui CLI / toolchain version, if relevant.>
- <Any setup the reader needs, with links to install steps — do not
  reproduce them here.>
- <Familiarity assumed — link to explanations or tutorials, never
  re-teach.>

## When to use this

<2–4 bullets describing situations where this guide applies, and
*explicitly* situations where another guide or pattern is better.>

- Use when: <…>
- Use when: <…>
- Do **not** use when: <… — link to the alternative.>

## Minimal example

A self-contained snippet that performs the task with the smallest
reasonable inputs. The reader should be able to copy this, change the
inputs, and have a working result.

```move
// Minimal example: <one-line description>.
module my_app::example;

use openzeppelin_access::two_step_transfer;

public fun example(/* … */) {
    // <smallest sequence of calls>
}
```

## Step-by-step

Numbered steps, each with:

- A one-sentence imperative ("Wrap the object").
- A code block showing the call.
- A short note on what happened, only if non-obvious.

1. <Step name>
   ```move
   <code>
   ```
2. <Step name>
   ```move
   <code>
   ```
3. <Step name>
   ```move
   <code>
   ```

## Security considerations

<Apply `security.warning_style` from config. Use explicit warning
callouts where the user can footgun themselves. Be specific:>

> **WARNING**: <exact failure mode> happens if <exact condition>.

If the topic is in `security.require_security_sections_for`, this
section is **required** and must list:

- Who holds authority at each step.
- What an attacker can and cannot do at each step.
- The minimum invariants the user must preserve.

## Common mistakes

- <Mistake → why it fails → fix.>
- <Mistake → why it fails → fix.>
- <Mistake → why it fails → fix.>

## Full example

A complete, self-contained module or scenario the reader can drop into
their project. Larger than the minimal example; closer to production
shape.

```move
// Full example: <one-line description>.
module my_app::full_example;

// imports

// types

// functions

// tests (optional)
```

## Related API reference

- [`<module_a>`](../api/<package>.mdx#<package>-<module_a>)
- [`<function_b>`](../api/<package>.mdx#<package>-<module_a>-<function_b>)

## Version notes

- **Available since**: <RELEASE_VERSION>.
- **Last verified against**: <RELEASE_VERSION>.
- **Breaking changes**: <if any, link to migration section>.
```

---

## Authoring rules

- Keep it task-shaped. If you find yourself defining concepts, link to
  an explanation page.
- Do not branch in the step-by-step section. If two paths are equally
  valid, write two guides.
- Do not include narrative context that does not advance the task. The
  reader is busy.
- Do not include source-code links in guides. Link to the related API
  reference instead; API reference pages own source links.
- Match `docs.tone` from config. Default for the contracts-sui slice:
  *clear, precise, security-conscious*.
