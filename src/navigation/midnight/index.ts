import type { NavigationNode } from "../types";
import currentData from "./current.json";

const current = currentData as NavigationNode[];

const midnightNavigation: NavigationNode[] = [...current];

export default midnightNavigation;
