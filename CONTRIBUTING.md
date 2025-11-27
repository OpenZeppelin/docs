# Contributing

Thank you for your interest in contributing to the OpenZeppelin Docs! We welcome contributions from everyone.

## How to Contribute

Please follow this guide if you have something to contribute.

### Reporting Issues

If you find a bug or have a suggestion for improvement:

1. Check if the issue already exists in [GitHub issues](https://github.com/OpenZeppelin/docs/issues)
2. If not, create a new issue with a clear description
3. Wait for a team member to comment before moving forward with a pull request

### Making Changes

1. Fork the repository
2. Create a new branch for your change
3. Follow the local development guide in the [README](README.md) or with the steps [below](#development-setup)
4. Use [conventional commits](https://www.conventionalcommits.org/) when making changes
5. Make sure your changes follow the [OpenZeppelin Docs Standards](STANDARDS.md)
6. Submit a pull request

### Pull Request Guidelines

- Keep pull requests focused on a single feature or fix
- Write clear commit messages
- Spelling fixes should be grouped as much as possible (i.e. fixing multiple errors instead of just one)

### Development Setup

1. Make sure [pnpm](https://pnpm.io) is installed

```bash
pnpm --version
```

2. Clone the repo and install dependencies

```bash
git clone https://github.com/OpenZeppelin/docs
cd docs
pnpm install
```

3. Run the `dev` server to see a live preview and have your changes reflected at `http://localhost:3000`

```bash
pnpm dev
```

4. After making changes run the lint command to make formatting rules are applied

```bash
pnpm run check
```

## Project Structure

Understanding the project structure will help you navigate the codebase and make effective contributions.

### Content Organization

The documentation content is organized in the `content/` directory with the following structure:

```
content/
├── community-contracts/     # Community-contributed contracts
├── confidential-contracts/  # Confidential/privacy-focused contracts
├── contracts/              # Core OpenZeppelin Contracts documentation
├── contracts-cairo/        # Cairo contracts for StarkNet
├── contracts-compact/      # Compact contract implementations
├── contracts-stylus/       # Stylus contracts for Arbitrum
├── ui-builder/             # UI Builder documentation
├── defender/               # Defender platform documentation
├── monitor/                # Monitoring tools documentation
├── relayer/                # Relayer service documentation
├── stellar-contracts/      # Stellar blockchain contracts
├── substrate-runtimes/     # Substrate runtime documentation
├── uniswap-hooks/          # Uniswap v4 hooks
├── upgrades-plugins/       # Upgrade plugins documentation
├── upgrades.mdx            # General upgrades guide
└── wizard.mdx              # Contract wizard documentation
```

Each product directory typically contains:

- `index.mdx` - Main documentation entry point
- `changelog.mdx` - Version history and changes
- Subdirectories for specific features/modules
- API reference files (often auto-generated)

### Application Structure

The application follows Next.js 13+ app directory structure:

| Path                                    | Description                                                    |
| --------------------------------------- | -------------------------------------------------------------- |
| `src/app/(docs)/`                       | Documentation pages route group                                |
| `src/app/(docs)/layout.tsx`             | Docs layout wrapper                                            |
| `src/app/(docs)/[...slug]/page.tsx`     | Dynamic documentation pages (catch-all route)                  |
| `src/app/page.tsx`                      | Homepage                                                       |
| `src/app/layout.tsx`                    | Root application layout                                        |
| `src/app/layout.config.tsx`             | Shared layout configuration and top navigation                 |
| `src/components/`                       | Reusable React components                                      |
| `src/components/layout/`                | Layout-specific components                                     |
| `src/components/icons/`                 | Custom SVG icons for products                                  |
| `src/components/ui/`                    | UI component library                                           |
| `src/lib/source.ts`                     | Content source adapter with Fumadocs loader                    |
| `src/navigation/`                       | Navigation tree configurations (JSON files)                    |
| `src/hooks/`                            | Custom React hooks                                             |

### Configuration Files

- `source.config.ts` - [Fumadocs](https://fumadocs.dev) MDX configuration with math, mermaid, and code highlighting support
- `next.config.mjs` - Next.js configuration
- `postcss.config.mjs` - PostCSS configuration for styling
- `tsconfig.json` - TypeScript configuration

## Navigation System

The navigation system is one of the most complex parts of the application. Understanding how it works is essential for adding new products or modifying navigation structure.

### Multi-Ecosystem Navigation

The documentation supports multiple blockchain ecosystems, each with its own navigation tree:

- **Ethereum & EVM** (`ethereum-evm.json`)
- **Arbitrum Stylus** (`arbitrum-stylus.json`)
- **Starknet** (`starknet/` directory with versioned files)
- **Stellar** (`stellar.json`)
- **Midnight** (`midnight.json`)
- **Polkadot** (`polkadot.json`)
- **Uniswap Hooks** (`uniswap.json`)
- **Zama FHEVM** (`zama.json`)

Navigation trees are located in `src/navigation/` and are defined as JSON files.

### How Navigation Tree Selection Works

The navigation system uses the `useNavigationTree` hook (`src/hooks/use-navigation-tree.ts`) to dynamically determine which navigation tree to display based on the current URL path.

**Key logic:**

1. The hook checks the `pathname` to determine which ecosystem the user is viewing
2. For most paths, there's a direct mapping (e.g., `/contracts-cairo` → Starknet tree)
3. Some paths like `/monitor`, `/relayer`, and `/ui-builder` are **shared across multiple ecosystems**

### Shared Paths Across Ecosystems

Some tools work across multiple blockchain ecosystems:

- `/monitor` - Available in Ethereum, Stellar, Polkadot, and Arbitrum Stylus
- `/relayer` - Available in Ethereum, Stellar, Polkadot, and Arbitrum Stylus
- `/ui-builder` - Available in Ethereum and Stellar

**How it works:**

1. When a user navigates to an ecosystem-specific page (e.g., `/stellar-contracts`), the ecosystem is stored in `sessionStorage` with key `lastEcosystem`
2. When the user then navigates to a shared path like `/monitor`, the system checks `sessionStorage` to determine which navigation tree to show
3. The sidebar tabs (displayed in `DocsLayoutClient`) dynamically include or exclude shared paths based on the last ecosystem visited

**Example flow:**

```
User visits /stellar-contracts
  → sessionStorage.setItem('lastEcosystem', 'stellar')
  → Stellar navigation tree is shown
  
User navigates to /monitor
  → Check sessionStorage.getItem('lastEcosystem') → 'stellar'
  → Display Stellar navigation tree (which includes /monitor)
  → Stellar tab remains active
```

This approach ensures that shared tools appear in the correct ecosystem context while maintaining a consistent user experience.

### Ecosystem Tabs

The sidebar displays ecosystem tabs defined in `src/components/layout/docs-layout-client.tsx`. Each tab has:

- `title` - Display name (e.g., "Ethereum & EVM")
- `url` - Primary URL for the ecosystem
- `icon` - Custom icon component
- `urls` - Set of URLs that belong to this ecosystem (including shared paths when appropriate)

The active tab is determined by checking if the current pathname matches any URL in the tab's `urls` set.

### Navigation JSON Structure

Navigation trees are defined using a specific structure with the following node types:

**Page Node:**
```json
{
  "type": "page",
  "name": "Getting Started",
  "url": "/contracts"
}
```

**Folder Node:**
```json
{
  "type": "folder",
  "name": "Tokens",
  "index": {
    "type": "page",
    "name": "Overview",
    "url": "/contracts/5.x/tokens"
  },
  "children": [...]
}
```

**Separator Node:**
```json
{
  "type": "separator",
  "name": "Open Source Tools"
}
```

### Modifying Navigation

To add or modify navigation:

1. Locate the appropriate JSON file in `src/navigation/`
2. Edit the JSON structure following the node types above
3. Ensure URLs match the actual MDX file locations in `content/`
4. If adding a new ecosystem, create a new JSON file and register it in `src/navigation/index.ts`
5. Update `useNavigationTree` hook if needed
6. Update ecosystem tabs in `DocsLayoutClient` if adding a new ecosystem

## Key Components

### Layout Components

**DocsLayoutClient** (`src/components/layout/docs-layout-client.tsx`)
- Main client-side layout wrapper for documentation pages
- Manages ecosystem tabs and determines which should be displayed
- Handles the logic for showing shared paths in the correct ecosystem context
- Receives the navigation tree from `useNavigationTree` hook

**DocsLayout** (`src/components/layout/docs.tsx`)
- Base documentation layout component from [Fumadocs](https://fumadocs.dev)
- Renders the sidebar, navigation, and page content
- Configured with navigation tree and tab information

### UI Components

**Card & SmallCard** - Content cards for homepage and feature highlights

**TOC (Table of Contents)** - Auto-generated from page headings with scrollspy functionality

**Search** - Full-text search interface with custom result formatting

**ThemeToggle** - Light/dark mode switching

**VersionBanner** - Version-specific messaging and warnings

### Custom Icons

Product-specific icons located in `src/components/icons/`:

- **Blockchain Icons**: Ethereum, Arbitrum, Starknet, Stellar, Polkadot, Midnight, Zama
- **Product Icons**: Contracts, Defender, Monitor, Relayer
- **Tool Icons**: Wizard, Ethernaut, and others

Icons are React components that accept className props for styling.

## Documentation Framework

This project is built on [Fumadocs](https://fumadocs.dev), a modern documentation framework that provides:

- **MDX Support**: Write documentation in MDX with React components
- **Built-in Search**: Full-text search powered by Algolia
- **OpenAPI Integration**: Automatic API reference generation from OpenAPI specs
- **Type-safe Content**: TypeScript integration for content and navigation
- **Theme Support**: Built-in light/dark mode with customizable themes

Fumadocs handles the core infrastructure, allowing us to focus on content and customization. For detailed framework documentation, visit [fumadocs.dev](https://fumadocs.dev).

## Automation Scripts

The repository includes several automation scripts in the `scripts/` directory to help maintain documentation quality and automate repetitive tasks.

### API Documentation Generation

**Script**: `scripts/generate-api-docs.js`

This script automates the generation of Solidity API reference documentation from OpenZeppelin contract repositories using Solidity Docgen.

**How it works:**

1. Clones a specified contracts repository (with branch selection)
2. Installs dependencies and runs the `npm run prepare-docs` command
3. Copies generated markdown files from the `docs/modules/api/pages` directory
4. Copies example files from `docs/modules/api/examples` if available
5. Places the generated documentation in the specified output directory
6. Cleans up temporary files

**Usage:**

```bash
node scripts/generate-api-docs.js \
  --repo https://github.com/OpenZeppelin/openzeppelin-contracts.git \
  --branch master \
  --api-output content/contracts/5.x/api \
  --examples-output examples
```

**Options:**

- `--repo, -r` - Contracts repository URL
- `--branch, -b` - Branch to clone (default: master)
- `--temp-dir, -t` - Temporary directory for cloning (default: temp-contracts)
- `--api-output, -a` - API documentation output directory
- `--examples-output, -e` - Examples output directory
- `--help, -h` - Show help message

**Requirements:**

The target repository must have:
- A `docs/config-md.js` file (Solidity Docgen configuration)
- A `docs/templates-md/` directory (markdown templates)
- An `npm run prepare-docs` script that generates documentation

See the [README](README.md#solidity-docgen) for instructions on setting up a repository for API generation.

### OpenAPI Documentation

**File**: `src/lib/openapi.ts`

This file configures OpenAPI specification integration using Fumadocs OpenAPI server utilities.

**How it works:**

The `openapi.ts` file creates an OpenAPI instance that:
1. Fetches OpenAPI spec files from remote URLs (e.g., GitHub raw URLs)
2. Parses the specifications
3. Makes them available to Fumadocs for automatic API documentation generation

**Current configuration:**

```typescript
export const openapi = createOpenAPI({
  input: [
    "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-relayer/refs/heads/main/openapi.json",
  ],
});
```

**Adding new OpenAPI specs:**

To add documentation for a new API, add the URL to the `input` array:

```typescript
export const openapi = createOpenAPI({
  input: [
    "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-relayer/refs/heads/main/openapi.json",
    "https://raw.githubusercontent.com/YourOrg/your-api/main/openapi.json",
  ],
});
```

The OpenAPI documentation is automatically rendered in MDX files using Fumadocs transformers configured in `source.config.ts`.

### Changelog Generation

**Script**: `scripts/generate-changelog.js`

This script automatically generates changelog documentation from GitHub releases using the `changelog-from-release` tool.

**How it works:**

1. Uses the `changelog-from-release` CLI tool to fetch GitHub releases
2. Formats the release notes as markdown
3. Adds MDX frontmatter with title metadata
4. Removes the tool's generated tag
5. Writes the formatted changelog to `changelog.mdx`

**Usage:**

```bash
node scripts/generate-changelog.js <repo_url> <output_directory>
```

**Example:**

```bash
node scripts/generate-changelog.js \
  OpenZeppelin/openzeppelin-relayer \
  content/relayer/1.2.x
```

This generates `content/relayer/1.2.x/changelog.mdx` with all releases from the repository.

**Requirements:**

Install `changelog-from-release`:
```bash
# macOS
brew install changelog-from-release

# Or download from: https://github.com/rhysd/changelog-from-release
```

**Output format:**

```mdx
---
title: Changelog
---

# [Version] - Date

Release notes content...
```

### Link Validation

**Script**: `scripts/link-validation.ts`

A comprehensive link validation tool that checks all internal links in documentation files and navigation structures.

**How it works:**

1. **Scans all MDX files** in the `content/` directory
2. **Extracts URLs** from markdown links and custom components (like `Card` components)
3. **Validates navigation trees** to ensure all URLs in JSON navigation files exist
4. **Checks fragments** (hash links) to ensure heading IDs exist on target pages
5. **Reports broken links** with file locations and line numbers

**Usage:**

```bash
# Check all links and print to console
npx tsx scripts/link-validation.ts

# Check specific scope (e.g., only contracts documentation)
npx tsx scripts/link-validation.ts --scope "/contracts/*"

# Output results to a file
npx tsx scripts/link-validation.ts --output link-errors.txt

# Disable fragment checking
npx tsx scripts/link-validation.ts --no-ignore-fragments
```

**Options:**

- `--scope <pattern>` - Validate only files matching the pattern (supports wildcards)
- `--output <file>` - Write results to a file instead of console
- `--no-ignore-fragments` - Include fragment validation (hash links)

**What it validates:**

1. **File links**: All markdown links in `.mdx` files
2. **Component links**: `href` attributes in custom components like `Card`
3. **Navigation URLs**: All URLs in navigation JSON files
4. **Fragment links**: Heading anchors (`#heading-id`) on pages
5. **Relative paths**: Relative file paths resolved as URLs

**Example output:**

```
Invalid URLs in content/contracts/5.x/tokens.mdx:
/contracts/invalid-page: URL not found in site pages at line 45 column 12
/contracts/5.x/erc20#nonexistent-heading: Fragment '#nonexistent-heading' not found on page at line 78 column 5
------

Invalid URLs in Navigation Trees:
Ethereum & EVM: /deprecated/old-page - URL not found in site pages
------

Summary: 3 errors found in 2 files out of 150 total files
```

**When to run:**

- Before submitting a pull request
- After adding or reorganizing documentation
- After updating navigation structures
- As part of CI/CD pipeline (recommended)

### Search Content Synchronization

**Script**: `scripts/sync-search-content.ts`  
**Workflow**: `.github/workflows/sync-search.yml`

This script synchronizes documentation content with Algolia search indexes, enabling full-text search across the documentation.

**How it works:**

1. **Creates a temporary route** (`src/app/static.json/route.ts`) that exports search indexes
2. **Runs a Next.js build** to generate static search data at `.next/server/app/static.json.body`
3. **Reads the generated search records** containing page metadata and content
4. **Syncs to Algolia** using the Fumadocs Algolia integration
5. **Cleans up temporary files** after completion

**Search index structure:**

The script uses `src/lib/export-search-indexes.ts` to generate search records:

```typescript
{
  _id: "/contracts/5.x/erc20",           // Page URL (unique ID)
  url: "/contracts/5.x/erc20",           // Page URL
  title: "ERC-20 Tokens",                 // Page title
  description: "Guide to ERC-20...",      // Page description
  structured: { ... },                    // Structured content for search
  extra_data: { ... }                     // Full page content
}
```

**Version filtering:**

The script automatically excludes old documentation versions from search to keep results focused on current content:

```typescript
const excludedVersions = ["/3.x/", "/4.x/", "/1.0.0/", "/0.1.0/", ...];
```

**Manual usage:**

```bash
# Sync search content to Algolia
bun run scripts/sync-search-content.ts
```

**Required environment variables:**

```bash
NEXT_PUBLIC_ALGOLIA_ID=your-algolia-app-id # Set it both GitHub settings and Netlify Settings
ALGOLIA_PRIVATE_KEY=your-algolia-admin-api-key # Only set locally and GitHub settings
```

**Automated workflow:**

The `.github/workflows/sync-search.yml` workflow automatically runs on every push to the `main` branch:

```yaml
on:
  push:
    branches: [main]
```

**How Algolia search works:**

1. **Indexing**: The sync script sends document records to Algolia's `document` index
2. **Search UI**: Fumadocs provides a built-in search component that queries Algolia
3. **Real-time updates**: Search results are updated automatically when content changes
4. **Ranked results**: Algolia handles relevance ranking, typo tolerance, and result highlighting

**Configuration:**

Search behavior is configured through Fumadocs in `src/lib/source.ts` and the search component in the layout. Algolia handles:
- Instant search with type-ahead
- Fuzzy matching for typos
- Result highlighting
- Search analytics

**Troubleshooting:**

If search results are outdated:
1. Check if the GitHub workflow ran successfully
2. Verify environment variables are set in GitHub secrets
3. Manually run the sync script locally
4. Check Algolia dashboard for index status

## Content Features

### MDX Enhancements

The site uses [Fumadocs](https://fumadocs.dev) with the following MDX enhancements:

- **Math Support**: LaTeX math rendering with KaTeX
- **Mermaid Diagrams**: Flowcharts and diagrams using Mermaid syntax
- **Code Highlighting**: Multi-theme syntax highlighting with line numbers
- **OpenAPI Integration**: Automatic API documentation generation from OpenAPI specs

### Interactive Elements

**OpenZeppelin Wizard** - Embedded contract generation tool for creating Solidity smart contracts

**Code Examples** - Copy-to-clipboard functionality for code blocks powered by Fumadocs

**Version Switching** - Multi-version documentation support with version-specific content

**Responsive Design** - Mobile-optimized navigation and content rendering

For more information on Fumadocs features, see the [official documentation](https://fumadocs.dev/docs).

## Adding New Content

### Adding a New Documentation Page

1. Create a new `.mdx` file in the appropriate `content/` subdirectory
2. Add frontmatter with metadata:
   ```mdx
   ---
   title: Page Title
   description: Page description for SEO
   ---
   ```
3. Write your content using MDX syntax
4. Add the page to the navigation JSON file in `src/navigation/`
5. Test locally with `pnpm dev`

### Adding a New Product/Ecosystem

1. Create a new directory in `content/` (e.g., `content/new-product/`)
2. Create an `index.mdx` file as the entry point
3. Create a navigation JSON file in `src/navigation/` (e.g., `new-product.json`)
4. Register the navigation tree in `src/navigation/index.ts`:
   ```ts
   import newProductData from "./new-product.json";
   
   export const newProductTree: NavigationTree = {
     name: "New Product",
     children: newProductData as NavigationNode[],
   };
   ```
5. Update `useNavigationTree` hook in `src/hooks/use-navigation-tree.ts` to include the new path
6. Add a new tab in `DocsLayoutClient` (`src/components/layout/docs-layout-client.tsx`) with appropriate icon
7. Create or import a custom icon for the product in `src/components/icons/`

### Versioning Content

For version-specific documentation:

1. Create a versioned subdirectory (e.g., `content/contracts/5.x/`)
2. Maintain older versions in parallel directories (e.g., `4.x/`, `3.x/`)
3. Update navigation to include version-specific paths
4. Use the "Previous Versions" folder pattern in navigation JSON for clarity

## Code of Conduct

Please be respectful and constructive in all interactions. We strive to maintain a welcoming and inclusive environment for all contributors.

## Questions?

If you have questions about contributing, feel free to open an issue or reach out to the maintainers.
