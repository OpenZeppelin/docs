---
name: update-stellar-docs
description: Update the OpenZeppelin docs repo to reflect a new stellar-contracts release
user_invocable: true
---

# Update Documentation for a New Release

## Context

This `docs` repository hosts the public documentation for Stellar Contracts under `content/stellar-contracts/`. With each new release, the documentation must be updated to reflect API changes, new modules, and breaking changes.

The sidebar navigation is managed in `src/navigation/stellar.json`. New pages must be registered there to appear.

## Workflow

When the user invokes this skill, ask for:
1. The path to the **stellar-contracts checkout**
2. The **previous tag** to compare against (e.g., `v0.7.1`)
3. The **release ref** (the SHA from `/release`, or `origin/main`)
4. Any additional context about the release (e.g., design rationale notes)

Work on a new branch from `origin/main` and open a PR; never push to `main`.

Then follow these steps:

### 1. Analyze Changes

- Run `git log <previous_tag>..<release_ref> --oneline` and `git diff <previous_tag>..<release_ref> --stat` in the stellar-contracts checkout
- Read the full diff for public-facing changes (traits, public functions, types, errors, events)
- Identify: new crates, breaking API changes, new extensions, removed APIs

### 2. Inspect Current Docs

- Read all files under `content/stellar-contracts/`
- Read `src/navigation/stellar.json` for sidebar structure
- Understand what is currently documented and how

### 3. Plan Changes

Categorize changes into:
- **New pages**: New crates or major modules that warrant their own documentation page
- **Breaking changes**: Removed/renamed methods, changed trait signatures, removed types — update all pages that reference them
- **Additive updates**: New extensions — add to existing pages

Present this plan and wait for confirmation before writing.

### 4. Apply Changes

For each documentation page:

#### Writing Style (Critical)
- **Concept-first, API-second**: Lead with Overview explaining *what* the module does and *why* someone would use it. Explain how it fits into the broader system. Walk through the workflow/lifecycle in plain terms. Only after the reader understands the concepts, present the trait signatures.
- Follow the existing page structure in the repo (title, source code link, overview, concepts, usage, trait API, see also)
- Follow [OpenZeppelin Documentation Standards](https://github.com/OpenZeppelin/docs/blob/main/STANDARDS.md)

#### What to Update
- **New crates**: Create a new `.mdx` page (or a folder of pages, like `tokens/confidential/`), add entries to `src/navigation/stellar.json`, add to the `index.mdx` module list
- **Breaking trait changes**: Find every page that references the old API and update it. Grep the docs directory to ensure no stale references remain.
- **Removed APIs**: Remove all references. Verify with grep after removal.
- **New extensions**: Add to the parent module's extensions section

#### What NOT to Change
- Internal storage details that don't affect the public API
- Packages not publicly exposed
- Code examples that still work correctly
- **Errors and Events**: Do not create dedicated Errors or Events sections in documentation pages — this is too low-level for the docs
- **Changelog**: Do not create or update changelog entries — the changelog is not part of the docs
- **Free functions / low-level helpers**: Do not document internal free functions, helper utilities, or low-level module exports — only document the public trait API

### 5. Verify

- Grep the docs directory for any stale references to removed APIs
- Ensure all new pages are registered in `src/navigation/stellar.json`
- Ensure cross-links between pages are valid
- Run `pnpm run build` and `pnpm run check` in this repo

## Key Files

| Purpose               | Path                                     |
| --------------------- | ---------------------------------------- |
| Documentation content | `content/stellar-contracts/`             |
| Sidebar navigation    | `src/navigation/stellar.json`            |
| Module index          | `content/stellar-contracts/index.mdx`    |
| Source code           | `<stellar-contracts checkout>/packages/` |
