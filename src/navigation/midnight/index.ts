import type { NavigationNode } from "../types";
import currentData from "./current.json";
import zeroOneXData from "./previous-versions/0.1.x.json";
import zeroThreeXData from "./previous-versions/0.3.x.json";

const current = currentData as NavigationNode[];
const previousVersions: NavigationNode[] = [
	zeroThreeXData as NavigationNode,
	zeroOneXData as NavigationNode,
];

const midnightNavigation: NavigationNode[] = [
	...current,
	{
		type: "folder",
		name: "Previous Versions",
		children: previousVersions,
		defaultOpen: true,
	},
];

export default midnightNavigation;
