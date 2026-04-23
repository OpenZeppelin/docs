import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
	arbitrumStylusTree,
	ethereumEvmTree,
	impactTree,
	midnightTree,
	type NavigationFolder,
	type NavigationNode,
	type NavigationPage,
	type NavigationTree,
	polkadotTree,
	starknetTree,
	stellarTree,
	suiTree,
	uniswapTree,
	zamaTree,
} from "@/navigation";

const SITE_ORIGIN = "https://docs.openzeppelin.com";
const CONTENT_ROOT = path.resolve(process.cwd(), "content");
const OUTPUT_PATH = path.resolve(process.cwd(), "public", "llms.txt");

const TREES: NavigationTree[] = [
	ethereumEvmTree,
	stellarTree,
	starknetTree,
	arbitrumStylusTree,
	suiTree,
	midnightTree,
	zamaTree,
	polkadotTree,
	uniswapTree,
	impactTree,
];

const INTRO = `# OpenZeppelin Docs

> Security-first libraries, tools, and infrastructure for building on Ethereum and other blockchains. Covers smart contract libraries for Solidity, Cairo, Stylus, Sui, Midnight, Stellar, Zama FHEVM, and Polkadot; operational tools (Defender, Monitor, Relayer, UI Builder); and the Upgrades Plugins and Contract Wizard.

Each ecosystem section lists the smart-contract libraries and language-specific guides for that chain. Cross-ecosystem tools — Defender, Monitor, Relayer, UI Builder, Role Manager — are grouped at the end under "Open Source Tools" to avoid duplication. Unversioned URLs (for example \`/contracts/\`) redirect to the latest supported version.
`;

const SHARED_TOOLS_SEPARATOR = "Open Source Tools";

const frontmatterCache = new Map<
	string,
	{ title?: string; description?: string } | null
>();

function resolveMdxPath(url: string): string | null {
	const withoutHash = url.split("#")[0].split("?")[0];
	const rel = withoutHash.replace(/^\//, "").replace(/\/$/, "");
	if (!rel) return null;

	const candidates = [
		path.join(CONTENT_ROOT, `${rel}.mdx`),
		path.join(CONTENT_ROOT, rel, "index.mdx"),
	];
	for (const candidate of candidates) {
		if (existsSync(candidate)) return candidate;
	}
	return null;
}

function parseFrontmatter(
	filePath: string,
): { title?: string; description?: string } | null {
	const cached = frontmatterCache.get(filePath);
	if (cached !== undefined) return cached;

	const raw = readFileSync(filePath, "utf8");
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) {
		frontmatterCache.set(filePath, null);
		return null;
	}

	const result: { title?: string; description?: string } = {};
	for (const line of match[1].split(/\r?\n/)) {
		const kv = line.match(/^(title|description)\s*:\s*(.*)$/);
		if (!kv) continue;
		let value = kv[2].trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		if (value) result[kv[1] as "title" | "description"] = value;
	}

	frontmatterCache.set(filePath, result);
	return result;
}

function cleanDescription(raw: string): string {
	return raw
		.replace(/\s+/g, " ")
		.replace(/\.\s*$/, "")
		.trim();
}

function formatBullet(page: NavigationPage, breadcrumb: string[]): string {
	if (page.external) return "";

	const filePath = resolveMdxPath(page.url);
	const frontmatter = filePath ? parseFrontmatter(filePath) : null;

	const label = [...breadcrumb, page.name]
		.filter((s, i, arr) => !(i > 0 && arr[i - 1] === s))
		.join(" — ");

	const url = `${SITE_ORIGIN}${page.url}`;
	const description = frontmatter?.description
		? `: ${cleanDescription(frontmatter.description)}`
		: "";

	return `- [${label}](${url})${description}`;
}

interface WalkContext {
	lines: string[];
	breadcrumb: string[];
	seen: Set<string>;
}

function walk(nodes: NavigationNode[], ctx: WalkContext): void {
	for (const node of nodes) {
		if (node.type === "separator") {
			ctx.lines.push("");
			ctx.lines.push(`### ${node.name}`);
			ctx.lines.push("");
			continue;
		}

		if (node.type === "page") {
			if (ctx.seen.has(node.url)) continue;
			ctx.seen.add(node.url);
			const bullet = formatBullet(node, ctx.breadcrumb);
			if (bullet) ctx.lines.push(bullet);
			continue;
		}

		if (node.type === "folder") {
			const folder = node as NavigationFolder;
			const nextBreadcrumb = [...ctx.breadcrumb, folder.name];

			if (folder.index && !ctx.seen.has(folder.index.url)) {
				ctx.seen.add(folder.index.url);
				const bullet = formatBullet(folder.index, nextBreadcrumb);
				if (bullet) ctx.lines.push(bullet);
			}

			walk(folder.children, {
				...ctx,
				breadcrumb: nextBreadcrumb,
			});
		}
	}
}

function splitSharedTools(nodes: NavigationNode[]): {
	ecosystem: NavigationNode[];
	shared: NavigationNode[];
} {
	const separatorIndex = nodes.findIndex(
		(n) => n.type === "separator" && n.name === SHARED_TOOLS_SEPARATOR,
	);
	if (separatorIndex === -1) return { ecosystem: nodes, shared: [] };
	return {
		ecosystem: nodes.slice(0, separatorIndex),
		shared: nodes.slice(separatorIndex + 1),
	};
}

function mergeByName(nodes: NavigationNode[]): NavigationNode[] {
	const folders = new Map<string, NavigationFolder>();
	const pages = new Map<string, NavigationPage>();
	const order: Array<{ kind: "folder" | "page"; key: string }> = [];

	for (const node of nodes) {
		if (node.type === "separator") continue;

		if (node.type === "folder") {
			const existing = folders.get(node.name);
			if (existing) {
				existing.children = mergeByName([
					...existing.children,
					...node.children,
				]);
			} else {
				folders.set(node.name, {
					type: "folder",
					name: node.name,
					defaultOpen: node.defaultOpen,
					index: node.index,
					children: mergeByName(node.children),
				});
				order.push({ kind: "folder", key: node.name });
			}
			continue;
		}

		if (!pages.has(node.url)) {
			pages.set(node.url, node);
			order.push({ kind: "page", key: node.url });
		}
	}

	return order.map((o) =>
		o.kind === "folder"
			? (folders.get(o.key) as NavigationNode)
			: (pages.get(o.key) as NavigationNode),
	);
}

function renderSection(
	heading: string,
	nodes: NavigationNode[],
	sharedSeen: Set<string>,
): string | null {
	const lines: string[] = [];
	walk(nodes, {
		lines,
		breadcrumb: [],
		seen: sharedSeen,
	});
	if (lines.every((l) => l.trim() === "" || l.startsWith("###"))) {
		return null;
	}
	const body = `${heading}\n\n${lines.join("\n")}`;
	return `${body.replace(/\n{3,}/g, "\n\n")}\n`;
}

function main(): void {
	const sharedSeen = new Set<string>();
	const ecosystemSections: string[] = [];
	const sharedToolNodes: NavigationNode[] = [];

	for (const tree of TREES) {
		const { ecosystem, shared } = splitSharedTools(tree.children);

		const section = renderSection(
			`## ${tree.name}`,
			ecosystem,
			new Set<string>(),
		);
		if (section) ecosystemSections.push(section);

		for (const node of shared) sharedToolNodes.push(node);
	}

	const toolsSection = renderSection(
		`## Open Source Tools`,
		mergeByName(sharedToolNodes),
		sharedSeen,
	);

	const parts = [INTRO, ...ecosystemSections];
	if (toolsSection) parts.push(toolsSection);

	writeFileSync(OUTPUT_PATH, parts.join("\n"), "utf8");

	const pageCount = Array.from(frontmatterCache.keys()).length;
	const missingCount = Array.from(frontmatterCache.values()).filter(
		(v) => v === null,
	).length;
	console.log(`Wrote ${OUTPUT_PATH}`);
	console.log(`  Pages with frontmatter: ${pageCount - missingCount}`);
	console.log(`  Pages without frontmatter: ${missingCount}`);
}

main();
