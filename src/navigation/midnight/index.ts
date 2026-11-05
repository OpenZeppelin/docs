import { latestStable } from "content/contracts-compact/latest-versions";
import type { NavigationNode } from "../types";
import currentData from "./current.json";

const BASE = "/contracts-compact";

// current.json lists the latest set without a version segment; prefix every
// page but the landing so a version bump is one edit in latest-versions.js.
function versioned(node: NavigationNode): NavigationNode {
	if (
		node.type === "page" &&
		node.url !== BASE &&
		node.url.startsWith(`${BASE}/`)
	) {
		return {
			...node,
			url: `${BASE}/${latestStable}${node.url.slice(BASE.length)}`,
		};
	}
	if (node.type === "folder") {
		return { ...node, children: node.children.map(versioned) };
	}
	return node;
}

const current = (currentData as NavigationNode[]).map(versioned);

const midnightNavigation: NavigationNode[] = [...current];

export default midnightNavigation;
