# AGENTS.md - Contracts for Sui Docs Conventions

## Scope
- Applies to files under `content/contracts-sui/`.
- Applies to Move snippets embedded in Markdown/MDX docs.

## Move code quality checklist
- Apply Sui Move code quality best practices to all examples and snippets.
- Prefer `movefmt` in editor and CI to keep style consistent.

## Package manifest
- Use Move 2024 edition in `Move.toml` (`edition = "2024"` or `edition = "2024.beta"`).
- Do not add explicit framework dependencies in modern Sui manifests unless strictly required.
- Prefix named addresses to avoid collisions (for example `my_protocol_math` instead of `math`).

## Modules, imports, and constants
- Prefer module declarations with `;` (`module my_package::my_module;`) over brace-wrapped module declarations.
- Do not use `use x::{Self};`; use `use x;`.
- When importing a module and one of its members, prefer `use x::{Self, Member};`.
- Error constants use `E` + PascalCase (for example `ENotAuthorized`).
- Regular constants use `ALL_CAPS` (for example `MY_CONSTANT`).

## Move Import Style
- Prefer combining symbols from the same module into one `use` statement.
- Avoid nested grouped imports.
- Keep grouped imports compact:
  - One line when readable.
  - If wrapped, use at most 3 lines.
- If a grouped import would require more than 3 lines, split it into multiple `use` statements.
- When splitting, group imports by semantic compatibility (similar concern/purpose), not arbitrarily.

## Examples

Preferred single line:
```move
use openzeppelin_math::{rounding, u64};
```

Allowed wrapped form (max 3 lines):
```move
use openzeppelin_math::{
    rounding, u64, u128
};
```

If it exceeds 3 lines, split by semantics:
```move
use openzeppelin_math::{rounding, u64, u128};
use openzeppelin_math::{decimal_scaling, u256};
```

## Struct and event naming
- Capability types end with `Cap` (for example `AdminCap`).
- Do not use `Potato` suffix for hot-potato values.
- Event structs are past tense (for example `UserRegistered`).
- Dynamic field keys use positional structs with `Key` suffix (for example `DynamicFieldKey()`).

## Function signatures and API shape
- Do not use `public entry`; use either `public` or `entry`.
- Prefer composable functions for PTBs; keep non-composable entry points explicit.
- Parameter ordering:
  - Objects first (except `Clock`).
  - Capability parameters second.
  - Pure values after objects/caps.
  - `ctx: &mut TxContext` last.
- Getter naming:
  - Use field-based names (`name`), not `get_name`.
  - Mutable getters end in `_mut` (`details_mut`).

## API Reference entry order
- In API Reference function entries, place behavior description paragraphs first.
- Place `Aborts ...` text after the description.
- Place `Emits ...` text after `Aborts ...`.
- If both are present, the order is always: description, then `Aborts`, then `Emits`.
- After `Aborts`/`Emits`, only `NOTE`, `INFO`, or `WARNING` blocks can appear.

## Function body idioms
- Prefer dot notation (`x.y(...)`) over function-call notation (`y(x, ...)`) whenever Move supports method syntax for the first argument.
- Prefer method-style calls when available (for example `id.delete()`, `ctx.sender()`, `payment.split(...).into_balance()`).
- Do not import `std::string::utf8`; use `b"...".to_string()` or `b"...".to_ascii_string()`.
- Prefer vector literal/index/method style over legacy `vector::empty/push_back/borrow/length`.
- Use index syntax for compatible collections (for example `&x[&10]`, `&mut x[&10]`).

## Macro-first control flow
- Prefer macros over manual `while` loops where available:
  - Option: `do!`, `destroy_or!`.
  - Repetition: `N.do!`.
  - Vector construction/iteration: `vector::tabulate!`, `do_ref!`, `destroy!`, `fold!`, `filter!`.

## Testing
- Combine test attributes in one line (`#[test, expected_failure(...)]`).
- In `expected_failure` tests, do not add cleanup past the failure point.
- In `_tests` modules, do not prefix test function names with `test_`.
- Do not use `test_scenario` when only a context is needed; prefer `tx_context::dummy()`.
- Do not pass abort codes to `assert!`.
- Use `assert_eq!` whenever possible.
- Prefer `sui::test_utils::destroy` for cleanup in tests.

## Pattern matching and comments
- Use 2024 unpack shorthand (`let MyStruct { id, .. } = value;`) when ignoring fields.
- Doc comments use `///` (not JavaDoc-style comments).
- Add short `//` comments around non-obvious logic, assumptions, and TODOs.
