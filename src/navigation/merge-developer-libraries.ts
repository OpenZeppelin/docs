import sharedDeveloperLibraries from "./shared/developer-libraries.json";
import type { NavigationNode } from "./types";

const OPEN_SOURCE_TOOLS = "Open Source Tools";

const developerLibrariesBlock = sharedDeveloperLibraries as NavigationNode[];

/**
 * Inserts the shared "Developer Libraries" block (Ecosystem Adapters + UIKit)
 * before the "Open Source Tools" section when present; otherwise appends
 * (e.g. Midnight has no Open Source Tools in-tree).
 */
export function mergeDeveloperLibraries(
	nodes: readonly NavigationNode[],
): NavigationNode[] {
	const openSourceIdx = nodes.findIndex(
		(n) => n.type === "separator" && n.name === OPEN_SOURCE_TOOLS,
	);
	if (openSourceIdx !== -1) {
		return [
			...nodes.slice(0, openSourceIdx),
			...developerLibrariesBlock,
			...nodes.slice(openSourceIdx),
		];
	}
	return [...nodes, ...developerLibrariesBlock];
}
