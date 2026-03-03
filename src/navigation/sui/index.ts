import type { NavigationNode } from "../types";
import currentData from "./current.json";

const current = currentData as NavigationNode[];

const suiNavigation: NavigationNode[] = [...current];

export default suiNavigation;
