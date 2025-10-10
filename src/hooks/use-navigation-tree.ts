"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
	arbitrumStylusTree,
	ethereumEvmTree,
	midnightTree,
	polkadotTree,
	starknetTree,
	stellarTree,
	uniswapTree,
	zamaTree,
} from "@/navigation";

export function useNavigationTree() {
	const pathname = usePathname();

	// Track ecosystem changes in sessionStorage
	useEffect(() => {
		if (typeof window === "undefined") return;

		if (pathname.startsWith("/stellar-contracts")) {
			sessionStorage.setItem("lastEcosystem", "stellar");
		} else if (
			pathname.startsWith("/contracts") ||
			pathname.startsWith("/community-contracts") ||
			pathname.startsWith("/upgrades-plugins") ||
			pathname.startsWith("/wizard") ||
			pathname.startsWith("/ui-builder") ||
			pathname.startsWith("/upgrades") ||
			pathname.startsWith("/defender") ||
			pathname.startsWith("/tools")
		) {
			sessionStorage.setItem("lastEcosystem", "ethereum");
		}
	}, [pathname]);

	// Determine which navigation tree to use based on the current path
	if (pathname.startsWith("/contracts-stylus")) {
		return arbitrumStylusTree;
	} else if (pathname.startsWith("/contracts-cairo")) {
		return starknetTree;
	} else if (pathname.startsWith("/stellar-contracts")) {
		return stellarTree;
	} else if (pathname.startsWith("/contracts-compact")) {
		return midnightTree;
	} else if (pathname.startsWith("/confidential-contracts")) {
		return zamaTree;
	} else if (pathname.startsWith("/uniswap-hooks")) {
		return uniswapTree;
	} else if (pathname.startsWith("/substrate-runtimes")) {
		return polkadotTree;
	} else if (pathname.startsWith("/tools")) {
		return ethereumEvmTree;
	}

	// For shared paths like /monitor and /relayer, check sessionStorage to see
	// which ecosystem was last active, defaulting to ethereumEvmTree
	if (typeof window !== "undefined") {
		const lastEcosystem = sessionStorage.getItem("lastEcosystem");

		if (pathname.startsWith("/monitor") || pathname.startsWith("/relayer")) {
			switch (lastEcosystem) {
				case "stellar":
					return stellarTree;
			}
		}
	}

	// Default to ethereumEvmTree for other paths
	return ethereumEvmTree;
}
