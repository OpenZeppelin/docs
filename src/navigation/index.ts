import arbitrumStylusData from "./arbitrum-stylus.json";
import ethereumEvmData from "./ethereum-evm.json";
import midnightData from "./midnight.json";
import starknetData from "./starknet.json";
import stellarData from "./stellar.json";
import type { NavigationNode, NavigationTree } from "./types";
import zamaData from "./zama.json";

// Type-safe imports with proper typing
const ethereumEvm = ethereumEvmData as NavigationNode[];
const arbitrumStylus = arbitrumStylusData as NavigationNode[];
const stellar = stellarData as NavigationNode[];
const midnight = midnightData as NavigationNode[];
const starknet = starknetData as NavigationNode[];
const zama = zamaData as NavigationNode[];

// Create separate navigation trees for each blockchain
export const ethereumEvmTree: NavigationTree = {
	name: "Ethereum & EVM",
	children: ethereumEvm,
};

export const arbitrumStylusTree: NavigationTree = {
	name: "Arbitrum Stylus",
	children: arbitrumStylus,
};

export const stellarTree: NavigationTree = {
	name: "Stellar",
	children: stellar,
};

export const midnightTree: NavigationTree = {
	name: "Midnight",
	children: midnight,
};

export const starknetTree: NavigationTree = {
	name: "Starknet",
	children: starknet,
};

export const zamaTree: NavigationTree = {
	name: "Zama",
	children: zama,
};

export * from "./types";
