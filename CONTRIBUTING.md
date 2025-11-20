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
pnpm run check:fix
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

- `source.config.ts` - Fumadocs MDX configuration with math, mermaid, and code highlighting support
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
- Base documentation layout component from Fumadocs
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

## Content Features

### MDX Enhancements

The site uses Fumadocs with the following MDX enhancements:

- **Math Support**: LaTeX math rendering with KaTeX
- **Mermaid Diagrams**: Flowcharts and diagrams using Mermaid syntax
- **Code Highlighting**: Multi-theme syntax highlighting with line numbers
- **OpenAPI Integration**: Automatic API documentation generation from OpenAPI specs

### Interactive Elements

**OpenZeppelin Wizard** - Embedded contract generation tool for creating Solidity smart contracts

**Code Examples** - Copy-to-clipboard functionality for code blocks

**Version Switching** - Multi-version documentation support with version-specific content

**Responsive Design** - Mobile-optimized navigation and content rendering

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
