# Diátaxis rules for this docs slice

This skill follows the Diátaxis framework. Each docs page belongs to
exactly one of four categories. Mixing categories is the most common
docs failure mode and the first thing to fix on review.

## The four categories

### Tutorial — *learning-oriented*

A safe, linear path for a first-time user to build something and gain
confidence. The user trusts the author to make good choices for them.

- Goal: the user finishes a working artifact and understands the basic
  shape of the library.
- Voice: imperative, encouraging, hand-holding.
- Scope: one path. No options, no detours.
- Promise: every step works. The user does not have to make decisions.

### How-to guide — *task-oriented*

Instructions for accomplishing a specific real-world task. The user
already knows what they want; the guide tells them how.

- Goal: a concrete outcome ("transfer ownership of a wrapped object",
  "register an indexed event", "rotate an admin capability").
- Voice: direct, concise, problem-first.
- Scope: one task. Optional variants belong at the bottom or in another
  guide.
- Promise: an experienced reader can scan and execute.

### Reference — *information-oriented*

Factual, complete API documentation. No teaching, no opinion, no
narrative. Generated or maintained from source comments where possible.

- Goal: the user looks up an exact signature, error, or event.
- Voice: terse, neutral, technical.
- Scope: every public item.
- Promise: accurate and exhaustive.

### Explanation — *understanding-oriented*

Conceptual material covering rationale, tradeoffs, mental models,
security model, and design context.

- Goal: the user builds a mental model strong enough to reason about
  edge cases the docs do not cover.
- Voice: discursive, analytical, willing to discuss alternatives.
- Scope: a topic, not a function.
- Promise: explains *why*, not *how*.

---

## Rules to avoid mixing modes

1. **Tutorials must not branch.** "Here's how to do X. Or you could do
   Y." is a guide, not a tutorial.
2. **Guides must not teach concepts.** If you find yourself defining
   terms, link to an explanation page.
3. **Reference must not editorialize.** No "this is the recommended
   approach". Recommendations belong in guides; tradeoffs belong in
   explanations.
4. **Explanations must not be how-tos in disguise.** No step lists. No
   commands to run.
5. **Each page declares its category.** Use frontmatter or the page's
   first sentence to make the category obvious.
6. **One outcome per guide. One topic per explanation. One artifact per
   tutorial.** When two outcomes belong together, split the page.
7. **Source links belong in Reference.** Tutorials, guides, and
   explanations should link to the related API reference, not directly
   to source code. API reference owns source links.

---

## What belongs in each (Sui examples)

### Tutorial — belongs

- "Build your first Sui module that uses `openzeppelin_access`
  capabilities."
- A linear walkthrough that ends with a working `move test`.

### Tutorial — does not belong

- A page comparing two ways to do access control.
- A reference for every function in `openzeppelin_access`.
- A discussion of when *not* to use `two_step_transfer`.

### How-to guide — belongs

- "Transfer ownership of a wrapped object using `two_step_transfer`."
- "Add a new admin capability and rotate the previous one."
- "Subscribe to `TransferAccepted` events from an off-chain indexer."

### How-to guide — does not belong

- A teaching introduction to capabilities.
- A regenerated dump of every function on the module.
- A multi-page essay about ownership theory.

### Reference — belongs

- The auto-generated page for `openzeppelin_access::two_step_transfer`,
  with module summary, types, functions, events, errors.
- Per-function entries with description, `Aborts ...`, `Emits ...`, and
  brief NOTE/INFO/WARNING blocks.

### Reference — does not belong

- A walkthrough of how to use the module.
- A "Why we built it this way" section.
- Free-form opinion about call patterns.

### Explanation — belongs

- "Two-step transfer: rationale and tradeoffs vs. immediate transfer."
- "How OpenZeppelin Contracts for Sui models capabilities."
- "Security model of `openzeppelin_access`."

### Explanation — does not belong

- A function signature.
- A literal step list.
- A glossary entry that should live next to its first use.

---

## Checklist for a new docs page

Use this list before writing or filing the page in `<VERSION_DOCS_ROOT>`.

1. **What does the reader want when they land here?**
   - To learn the library from zero → **Tutorial**.
   - To get one specific job done → **How-to guide**.
   - To look up a fact → **Reference**.
   - To understand why → **Explanation**.

2. **Will this page have a step list?**
   - Yes, and the steps are linear and beginner-safe → Tutorial.
   - Yes, and the steps assume the reader knows the library → How-to guide.
   - No → Reference or Explanation.

3. **Does it list every public item?**
   - Yes → Reference.
   - No → not Reference.

4. **Does it explain *why*?**
   - Yes, primarily → Explanation.
   - Yes, but in service of a task → How-to guide. Move the rationale
     to the bottom or link out.

5. **Where does it live?**
   - Tutorial → `<VERSION_DOCS_ROOT>/learn/`.
   - How-to guide → `<VERSION_DOCS_ROOT>/<package>.mdx` (package
     overview pages function as guides) or its own task page.
   - Reference → `<API_REFERENCE_PATH>/<package>.mdx`.
   - Explanation → `<VERSION_DOCS_ROOT>/<package>.mdx` rationale section
     for short pieces, or a dedicated page for substantial topics.

6. **Was the category obvious from the first paragraph?** If not,
   rewrite the first paragraph until it is.

---

## Refactoring rules

When updating an existing page, fix mode-mixing as you go, but only
within scope of the change set:

- A reference page that contains a tutorial-style preamble: keep the
  preamble in the same edit only if you are also editing that section
  for accuracy. Otherwise leave a `needs-human-review` finding in the
  report and move on.
- A tutorial that branches into options: file a `needs-human-review`
  finding rather than rewriting opportunistically.
- An explanation that has drifted into how-to: same — flag, don't
  rewrite outside the change set.

The `docs-sync` run is not a refactor pass. The goal is to keep docs
truthful relative to the contracts diff, not to rewrite the slice.
