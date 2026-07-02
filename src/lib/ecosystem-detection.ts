import {
	arbitrumStylusTree,
	ethereumEvmTree,
	midnightTree,
	type NavigationNode,
	type NavigationTree,
	polkadotTree,
	starknetTree,
	stellarTree,
	suiTree,
	tronTree,
	uniswapTree,
	zamaTree,
} from "@/navigation";
import { normalize, parseProductPath } from "./is-active";

/**
 * Ecosystem identifiers. These MUST match the values written to
 * `sessionStorage.lastEcosystem` and the cases handled in
 * `use-navigation-tree.ts` / `docs-layout-client.tsx`.
 */
export type EcosystemKey =
	| "ethereum"
	| "stellar"
	| "zama"
	| "contracts-stylus"
	| "polkadot"
	| "midnight"
	| "sui"
	| "starknet"
	| "tron"
	| "uniswap";

const TREES: Array<{ key: EcosystemKey; tree: NavigationTree }> = [
	{ key: "ethereum", tree: ethereumEvmTree },
	{ key: "stellar", tree: stellarTree },
	{ key: "zama", tree: zamaTree },
	{ key: "contracts-stylus", tree: arbitrumStylusTree },
	{ key: "polkadot", tree: polkadotTree },
	{ key: "midnight", tree: midnightTree },
	{ key: "sui", tree: suiTree },
	{ key: "starknet", tree: starknetTree },
	{ key: "tron", tree: tronTree },
	{ key: "uniswap", tree: uniswapTree },
];

/**
 * Version-agnostic canonical key for an internal URL. For versioned products
 * (`/relayer`, `/monitor`) the `/1.x.x/` segment is stripped so that
 * `/relayer/1.5.x/guides/x`, `/relayer/1.4.x/guides/x` and the redirected bare
 * `/relayer/guides/x` all collapse to the same key. Returns null for external
 * or empty URLs.
 */
function canonicalKey(url: string): string | null {
	if (!url || url.startsWith("http")) return null;
	const parsed = parseProductPath(url);
	if (parsed) return `${parsed.base}${parsed.subpath}`;
	return normalize(url);
}

function collectUrls(nodes: NavigationNode[], out: string[]): void {
	for (const node of nodes) {
		if (node.type === "page" && !node.external) {
			out.push(node.url);
		} else if (node.type === "folder") {
			if (node.index?.url && !node.index.external) out.push(node.index.url);
			collectUrls(node.children, out);
		}
	}
}

/**
 * Map from canonical URL -> set of ecosystems whose navigation tree contains
 * that page. Computed once at module load. A page owned by exactly one
 * ecosystem is uniquely attributable to it (e.g. the Stellar relayer guides
 * only live in the Stellar tree); a page in several trees (e.g. the relayer
 * quickstart) is ambiguous.
 */
const ownerMap: Map<string, Set<EcosystemKey>> = (() => {
	const map = new Map<string, Set<EcosystemKey>>();
	for (const { key, tree } of TREES) {
		const urls: string[] = [];
		collectUrls(tree.children, urls);
		for (const url of urls) {
			const ck = canonicalKey(url);
			if (!ck) continue;
			let set = map.get(ck);
			if (!set) {
				set = new Set();
				map.set(ck, set);
			}
			set.add(key);
		}
	}
	return map;
})();

/**
 * Determines the owning ecosystem for a path purely from the URL, by checking
 * which ecosystem navigation tree(s) contain it.
 *
 * Returns the ecosystem only when the page is owned by EXACTLY ONE tree (e.g.
 * `/relayer/.../guides/stellar-channels-guide` lives only in the Stellar tree).
 * Returns null when the page is shared across ecosystems (ambiguous — e.g. the
 * relayer quickstart) or unknown, so callers can fall back to other signals.
 *
 * This function is pure and deterministic from `pathname` (no `window` /
 * `sessionStorage` access), so it is safe to call during SSR and the initial
 * client render without causing a hydration mismatch.
 */
export function getEcosystemFromPath(pathname: string): EcosystemKey | null {
	const ck = canonicalKey(pathname);
	if (!ck) return null;
	const owners = ownerMap.get(ck);
	if (owners && owners.size === 1) {
		return owners.values().next().value ?? null;
	}
	return null;
}
