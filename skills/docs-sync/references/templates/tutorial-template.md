# Tutorial template

Use this template when creating or rewriting a tutorial. A tutorial is
**learning-oriented**: a first-time user follows a single safe linear
path and ends with a working artifact.

A tutorial does **not** branch, does **not** present alternatives, and
does **not** explain the design. Save those for explanations and
how-to guides.

---

```mdx
---
title: <Imperative + outcome> (e.g. "Build your first wrapped object")
description: <One sentence: what the reader will build.>
---

# <Title>

## What you'll learn

<One short paragraph stating the learning goal in concrete terms. Not
"You will understand capabilities." Instead: "You will build a Sui
module that mints, wraps, and transfers an object using
`openzeppelin_access::two_step_transfer`, and run its tests
successfully.">

## What you'll build

<A specific, observable artifact: a module, a working test suite, a
runnable script, etc. Include the final file structure if helpful.>

```
my_first_oz/
├── Move.toml
└── sources/
    ├── my_first_oz.move
    └── my_first_oz_tests.move
```

## Prerequisites

- <Toolchain — exact versions.>
- <Optional: a quick check command the reader can run to confirm setup.>
- <Reading: only one or two links, and only when truly required.>

## Starting point

<Provide the exact starting state. Either:
- a `git clone` of a starter branch in the docs repo's examples, or
- the literal contents of every starter file inline.>

```toml
# Move.toml — starter
[package]
name = "my_first_oz"
edition = "2024"
```

```move
// sources/my_first_oz.move — starter
module my_first_oz::my_first_oz;
```

## Step 1 — <verb + object>

<One short paragraph framing the step. What are we doing and why does
it move us forward? The reader does not need to understand "why"
deeply — they need to know that this step is intentional.>

```move
<exact code the reader pastes>
```

**Checkpoint**: <a one-line check the reader runs to confirm progress
— e.g. `sui move build` succeeds, or a specific test passes.>

## Step 2 — <verb + object>

<…>

```move
<…>
```

**Checkpoint**: <…>

## Step 3 — <verb + object>

<…>

```move
<…>
```

**Checkpoint**: <…>

## Expected result

<Show the final state the reader should now have:
- the final file contents (or a diff from start),
- the output of running tests,
- any explorer / CLI command outputs that confirm success.>

```
$ sui move test
…
PASS    [ 0 ] my_first_oz::my_first_oz_tests::happy_path
```

## Cleanup or next steps

- <One-line cleanup if the tutorial used disposable resources.>
- <Where to go next: pointer to one or two how-to guides for adjacent
  tasks.>

## Related reference and explanation

- Reference: [`<package>` API](../api/<package>.mdx)
- Explanation: [<topic explanation>](./<explanation-page>.mdx)
- More guides: [<guide title>](./<guide>.mdx)
```

---

## Authoring rules

- **One path.** No "Option A or Option B" branches. If alternatives
  matter, write a separate guide.
- **Every step works.** If a step depends on platform behavior that
  differs by OS, document it inline; do not silently drop the reader
  into a difference.
- **No design discussion.** Save it for an explanation. The reader is
  not ready to evaluate tradeoffs yet.
- **Checkpoints earn trust.** Every 1–3 steps, give the reader a way to
  confirm they are still on the rails.
- **Match `docs.tone` from config.** Default: *clear, precise,
  security-conscious*. In tutorials this means: encouraging, but with
  honest security warnings inline rather than postponed.

## Where to put the file

- File: `<VERSION_DOCS_ROOT>/learn/<kebab-case-title>.mdx`.
- Nav entry: under the `Learn` folder in `<NAV_CONFIG_PATH>`.
