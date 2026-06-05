import type { NavigationNode, NavigationTree } from "@/navigation";
import { parseProductPath } from "./is-active";

// Matches the relayer "Rust Book" external link host, e.g.
// "docs-v1-5--openzeppelin-relayer.netlify.app".
const RUST_BOOK_HOST_RE = /docs-v\d+-\d+--openzeppelin-relayer\.netlify\.app/;

// "1.4.x" -> "v1-4" (the Netlify branch-deploy tag for that release).
function deployTag(version: string): string | null {
	const m = version.match(/^(\d+)\.(\d+)\.x$/);
	return m ? `v${m[1]}-${m[2]}` : null;
}

function rewriteHost(url: string, tag: string): string {
	return url.replace(
		RUST_BOOK_HOST_RE,
		`docs-${tag}--openzeppelin-relayer.netlify.app`,
	);
}

function rewriteNodes(nodes: NavigationNode[], tag: string): NavigationNode[] {
	return nodes.map((node) => {
		if (node.type === "page") {
			return RUST_BOOK_HOST_RE.test(node.url)
				? { ...node, url: rewriteHost(node.url, tag) }
				: node;
		}
		if (node.type === "folder") {
			const index =
				node.index && RUST_BOOK_HOST_RE.test(node.index.url)
					? { ...node.index, url: rewriteHost(node.index.url, tag) }
					: node.index;
			return { ...node, index, children: rewriteNodes(node.children, tag) };
		}
		return node;
	});
}

/**
 * Returns a copy of the navigation tree with the relayer "Rust Book" external
 * link pointed at the Netlify build matching the version in `pathname`
 * (e.g. `/relayer/1.4.x/*` -> `docs-v1-4--...`).
 *
 * For the unversioned/development path (bare `/relayer/*`) the tree is returned
 * unchanged, so the JSON default (latest stable, currently v1-5) is used. The
 * tree is only cloned when a rewrite is actually needed, so non-relayer and
 * latest/bare navigations keep their shared (uncloned) tree reference.
 */
export function withVersionedRustBook(
	tree: NavigationTree,
	pathname: string,
): NavigationTree {
	const parsed = parseProductPath(pathname);
	if (!parsed || parsed.base !== "/relayer" || !parsed.version) return tree;

	const tag = deployTag(parsed.version);
	if (!tag) return tree;

	return { ...tree, children: rewriteNodes(tree.children, tag) };
}
