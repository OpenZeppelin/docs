# Regression pattern catalog

Every pattern the `docgen-fixup` skill knows how to detect and fix. Add new entries as new regressions emerge; do not delete entries even when the underlying pipeline bug is fixed — pinned regens against old tags can still hit them.

Each entry:

- **Symptom** — what the reader sees in the generated MDX.
- **Detection** — a grep or scan that finds hits.
- **Root cause** — where in the pipeline (docgen resolver, regex, template, `downdoc`, upstream NatSpec, upstream `.adoc`) it comes from.
- **Upstream fix** — the change to the source `.sol` / `.adoc` so the next regen produces correct output. `n/a` if there is no clean upstream fix.
- **MDX patch** — the direct patch to apply on the current PR.
- **Example** — one concrete case from a prior regen.

---

## 1. Broken Solidity code block in a hand-authored guide

**Symptom**: a fenced ```` ```solidity ```` block inside a guide `.mdx` has mangled indentation on interior lines and/or a missing closing brace. Copy-pasting the block would not compile.

**Detection**:
```
git diff origin/<base> pr-<N> -- 'content/**/*.mdx' \
  | awk '/```solidity/,/```/' \
  | grep -nE '^\+' \
  | grep -E '^\+ {0,4}(super|return|revert|emit)|^\+\}$'
```
False-positive check: the same block on `origin/<base>` did NOT have the same shape (the regression is new in this PR).

**Root cause**: `downdoc` mangles the contents of triple-backtick fenced blocks when they live inside a `.adoc` source (it treats them as prose, strips `//` comment lines, de-indents nested `{}`). `scripts/convert-adoc.js` preprocesses these to `[source,lang]\n----\n...\n----` form before running `downdoc` — but if a maintainer bypasses that preprocess (or a new fenced-block variant slips through the regex), the mangle returns.

**Upstream fix**: rewrite the block in the source `.adoc` as `[source,lang]\n----\n...\n----` explicitly, or as `include::api:example$path/to/File.sol[]`. Do not rely on the preprocess to catch new syntaxes.

**MDX patch**: restore indentation and closing braces by copying the corresponding code from the source `.adoc` (or the referenced example `.sol`).

**Example** (PR #206): `content/contracts/5.x/extending-contracts.mdx:52-56` — `super.revokeRole(...)` dedented to 4 spaces, function closing `}` at column 0, function-level closing `}` missing.

---

## 2. NatSpec `{Type}` / `{Contract.method}` leaks as raw anchor fragment

**Symptom**: prose inside an API MDX contains a bare `#Contract-something-Type` fragment sitting in the middle of a sentence (not inside a Markdown link).

**Detection**:
```
grep -rnP '(?<![(/])#[A-Z][A-Za-z0-9]+-[A-Za-z_][A-Za-z0-9_-]+' content/**/api/**/*.mdx \
  | grep -vE '<a id=|href="#|]\(#|\(/'
```

**Root cause**: `helpers.js findBestMatch()` uses "last hyphenated segment equals key" as a match heuristic. A NatSpec ref like `{bytes32}` or `{ICompoundTimelock}` — where the name is a primitive type or an external interface with no doc page — will match some unrelated composite anchor whose last segment coincidentally ends in that name (e.g. `ERC20FlashMint-RETURN_VALUE-bytes32`). The resolver emits the wrong anchor, and downstream some code path drops the wrapping `[text](url)`, leaving a bare `#…` fragment in prose.

**Upstream fix**: rewrite the NatSpec ref so it does not use `{}` for a name that has no doc page. Use inline code instead: `` `bytes32` ``, `` `ICompoundTimelock` ``. If the ref is intended as a real link to a page that exists (e.g. `TimelockController`), use `{TimelockController}` explicitly.

**MDX patch**: replace the bare `#…` fragment with the intended inline code (or with a correct Markdown link if the target actually exists).

**Examples** (PR #206):
- `content/contracts/5.x/api/governance.mdx:7213-7214` — `{ICompoundTimelock}` leaked as `#GovernorTimelockCompound-_timelock-contract-ICompoundTimelock`.
- `content/contracts/5.x/api/token/ERC20.mdx:2206` — `{bytes32}` leaked as `#ERC20FlashMint-RETURN_VALUE-bytes32`.

---

## 3. Cross-contract method mis-linking (overloaded method names)

**Symptom**: prose in a contract's API section references an abstract method by name, but the emitted link points at a different contract's method that happens to share the name — often with a different type signature. Copy-pasting the referenced signature would not compile against the current contract.

**Detection**: for each contract's section, grep for `[Contract.method](#Contract-method-…)` links where the linked `Contract` prefix differs from the containing section's contract.

**Root cause**: `helpers.js findBestMatch()` preferences same-page matches but does not preference same-contract when multiple contracts on the same page expose a method with the same name (e.g. `_onSend` on `BridgeFungible`, `BridgeNonFungible`, and `BridgeERC1155`). The first arbitrary match wins.

**Upstream fix**: `n/a`. Reword the NatSpec to use the fully-qualified form `{Contract._method-…-…}` so the resolver hits the direct-match path instead of the last-segment heuristic. Test locally with a docgen dry-run before committing.

**MDX patch**: repoint the link to the current contract's method (correct anchor + correct type signature). Verify the target anchor exists in the file.

**Example** (PR #206): `content/contracts/5.x/api/crosschain.mdx:1335-1336` and `:1739-1740` — `BridgeFungible` / `BridgeNonFungible` section bullets linked to `BridgeERC1155._onSend/_onReceive` with array-typed signatures. Correct target: same-contract `_onSend/_onReceive` with `(address, uint256)`.

---

## 4. Dangling struct / enum / UDVT anchor

**Symptom**: an in-page link like `[Contract.Struct](#Contract-Struct)` has no matching `<a id="Contract-Struct">` anywhere in the file. Clicking navigates to a non-existent fragment.

**Detection**:
```
python3 -c '
import re, glob
for f in glob.glob("content/**/api/**/*.mdx", recursive=True):
    t = open(f).read()
    defs = set(re.findall(r"<a id=\"([^\"]+)\"", t))
    for m in re.finditer(r"\]\(#([A-Z][A-Za-z0-9_.-]+)\)", t):
        if m.group(1) not in defs:
            print(f"{f}:{t[:m.start()].count(chr(10))+1}: dangling #{m.group(1)}")
'
```
Filter to anchors that are new in this PR vs `origin/<base>` — inheritance-related dangles are a separate, broader issue.

**Root cause**: `contract.hbs` emits `<a id>` for structs (as of the fix that shipped with PR #206). For **enums** and **user-defined value types** it does not — those are still on the "if a NatSpec ref hits one, the link dangles" path. Slugs for those AST node types are still registered by `getAllLinks`, so `{EnumType}` in NatSpec produces a link to a nonexistent anchor.

**Upstream fix**: rewrite the NatSpec ref to inline code (`` `EnumType` ``) or link to the contract page (`{Contract}`).

**MDX patch**: either emit the missing `<a id>` alongside the contract's main anchor, or rewrite the link into inline code. Prefer the anchor when the reader benefits from a jump target.

**Example** (PR #206): `content/contracts/5.x/api/utils.mdx` — `[RateLimiter.RefillingBucket](#RateLimiter-RefillingBucket)` and `[RateLimiter.SlidingWindow](#RateLimiter-SlidingWindow)` in the RateLimiter description. Fixed by rendering full struct sections (see the `contract.hbs` change that shipped with PR #206).

---

## 5. AsciiDoc heading conversion leaves trailing `===`

**Symptom**: an MDX heading like `### Section title ===` — the trailing equals signs from an AsciiDoc symmetric setext form leaked through into the Markdown output.

**Detection**:
```
grep -rnE '^#+ .*=+ *$' content/**/*.mdx
```

**Root cause**: NatSpec author wrote `=== Section title ===` (equals on both sides — legacy AsciiDoc symmetric setext). `docgen/templates-md/helpers.js processCallouts()` converts leading `===` to `###` but does not strip the trailing `===`. The transformer regex is deliberately kept narrow — this is an upstream authoring mistake.

**Upstream fix**: drop the trailing `===` in the source `.sol` NatSpec. Standard form in this codebase is leading-only (`* === Section title`).

**MDX patch**: strip the trailing `===` from the heading.

**Example** (PR #206): `content/contracts/5.x/api/utils.mdx:9286` — `### Limiter vs. entries ===` from `contracts/utils/RateLimiter.sol:23`. Upstream fixed in [OpenZeppelin/openzeppelin-contracts#6612](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/6612).

---

## 6. `[TIP]==== ... ====` block admonition dumped as prose

**Symptom**: content that should be wrapped in a `<Callout>` component renders as plain paragraph text, often with two or three empty lines where the block delimiters used to be.

**Detection**:
```
# Blank runs of 3+ lines in generated MDX are often a signature of stripped admonition delimiters
grep -rnE '^$' content/**/*.mdx | awk -F: '{print $1":"$2}' | uniq -c | awk '$1 >= 3'
# Then verify each hit against the source .adoc to see if a [TIP]====/[NOTE]==== block sat there.
```

**Root cause**: `downdoc` converts AsciiDoc `[TIP]==== ... ====` block admonitions into `<dl><dt><strong>💡 TIP</strong></dt><dd>…</dd></dl>` (HTML description list, with an emoji). `scripts/convert-adoc.js` then converts this shape back to `<Callout>`. If a new emoji shape appears (or `downdoc` upgrades change the wrapper), the character-class regex in `convert-adoc.js` will miss it, the final cleanup will strip the `<dl>` tags, and the inner content survives as prose.

**Upstream fix**: `n/a`. Keep the `.adoc` in the standard `[TIP]====` block form; when adding a new emoji or a new admonition, extend the character class in `scripts/convert-adoc.js` accordingly (that IS a legitimate transformer change, not upstream-error masking).

**MDX patch**: wrap the orphaned prose in `<Callout>` (`<Callout type="warn">` for WARNING / IMPORTANT / CAUTION).

**Example** (PR #206): `content/contracts/5.x/paymasters.mdx:333-342` — a `[TIP]====` block in `paymasters.adoc:325-332` dumped as prose because `convert-adoc.js` was missing 💡 in its emoji character class. Transformer fix landed with PR #206; the block itself was patched into a `<Callout>` in the same PR.

---

## 7. External `docs.openzeppelin.com` URL rewritten to a broken internal path

**Symptom**: a link on an OZ docs page points at `/defender/module/actions#some-anchor` (or another internal path with a fragment), but the fragment does not exist on the target page. Clicking navigates to the page but not the intended section.

**Detection**:
```
# Extract internal links with fragments, verify each anchor exists on the target page
grep -rnoE '\]\(/[a-z0-9/-]+#[a-z0-9-]+\)' content/**/*.mdx
```
For each match, resolve `/<path>` → `content/<path>.mdx` and grep the file for `<a id="<fragment>">`.

**Root cause**: as part of consolidating docs onto one site, the transformer rewrites absolute `https://docs.openzeppelin.com/…` URLs to relative site paths. The rewrite is purely textual — it does not verify the target anchor exists. When the historical site's anchor scheme differed from the current MDX site's (or when the referenced content actually lives on a different page now), the result is a broken in-site link.

**Upstream fix**: rewrite the xref in the source `.adoc` to point at the correct target page and (optionally) anchor. Use `xref:defender::module/foo.adoc[Label]` — no fragment — if the whole page is the target.

**MDX patch**: repoint the link to the correct target page. Drop the fragment if the whole page is the target.

**Example** (PR #206): `content/contracts/5.x/governance.mdx:39` and `:114` — both `Defender Proposals` links pointed at `/defender/module/actions#transaction-proposals-reference` (anchor did not exist). Correct target: `/defender/module/transaction-proposals`. Upstream fixed in [OpenZeppelin/openzeppelin-contracts#6612](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/6612).
