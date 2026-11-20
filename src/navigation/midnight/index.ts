import { latestStable } from "content/contracts-compact/latest-versions";
import type { NavigationNode } from "../types";
import currentData from "./current.json";

const LATEST_TOKEN = "{{latest}}";

// current.json writes versioned URLs with a `{{latest}}` segment so a version
// bump is one edit in latest-versions.js. The landing page keeps its literal URL.
function resolveLatest(nodes: NavigationNode[]): NavigationNode[] {
	return nodes.map((node) => {
		switch (node.type) {
			case "page":
				return {
					...node,
					url: node.url.replaceAll(LATEST_TOKEN, latestStable),
				};
			case "folder":
				return {
					...node,
					index: node.index
						? {
								...node.index,
								url: node.index.url.replaceAll(LATEST_TOKEN, latestStable),
							}
						: node.index,
					children: resolveLatest(node.children),
				};
			default:
				return node;
		}
	});
}

const current = resolveLatest(currentData as NavigationNode[]);

const midnightNavigation: NavigationNode[] = [...current];

export default midnightNavigation;
