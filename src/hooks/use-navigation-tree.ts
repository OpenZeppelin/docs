"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
	arbitrumStylusTree,
	ethereumEvmTree,
	impactTree,
	midnightTree,
	polkadotTree,
	starknetTree,
	stellarTree,
	suiTree,
	uniswapTree,
	zamaTree,
} from "@/navigation";

export function useNavigationTree() {
	const pathname = usePathname();

	// Read sessionStorage after mount so SSR and initial client render match.
	// Reading during render would cause hydration mismatches on shared paths
	// (/relayer, /monitor, /ui-builder, /ecosystem-adapters, /tools) where the active
	// ecosystem is only known on the client.
	const [lastEcosystem, setLastEcosystem] = useState<string | null>(null);

	// Track ecosystem changes in sessionStorage
	useEffect(() => {
		if (typeof window === "undefined") return;

		if (pathname.startsWith("/stellar-contracts")) {
			sessionStorage.setItem("lastEcosystem", "stellar");
		} else if (pathname.startsWith("/substrate-runtimes")) {
			sessionStorage.setItem("lastEcosystem", "polkadot");
		} else if (pathname.startsWith("/contracts-sui")) {
			sessionStorage.setItem("lastEcosystem", "sui");
		} else if (pathname.startsWith("/contracts-stylus")) {
			sessionStorage.setItem("lastEcosystem", "contracts-stylus");
		} else if (pathname.startsWith("/contracts-compact")) {
			sessionStorage.setItem("lastEcosystem", "midnight");
		} else if (pathname.startsWith("/confidential-contracts")) {
			sessionStorage.setItem("lastEcosystem", "zama");
		} else if (
			pathname.startsWith("/contracts") ||
			pathname.startsWith("/community-contracts") ||
			pathname.startsWith("/upgrades-plugins") ||
			pathname.startsWith("/wizard") ||
			pathname.startsWith("/upgrades") ||
			pathname.startsWith("/defender")
		) {
			sessionStorage.setItem("lastEcosystem", "ethereum");
		}
		// Note: /ui-builder, /monitor, /relayer, /ecosystem-adapters, and /tools are intentionally NOT set here
		// They inherit the lastEcosystem from whichever tab the user was in before navigating

		setLastEcosystem(sessionStorage.getItem("lastEcosystem"));
	}, [pathname]);

	// Determine which navigation tree to use based on the current path
	if (pathname.startsWith("/impact")) {
		return impactTree;
	} else if (pathname.startsWith("/contracts-stylus")) {
		return arbitrumStylusTree;
	} else if (pathname.startsWith("/contracts-cairo")) {
		return starknetTree;
	} else if (pathname.startsWith("/contracts-sui")) {
		return suiTree;
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
	}

	// For shared paths, use the lastEcosystem state (from sessionStorage after mount)
	if (
		pathname.startsWith("/monitor") ||
		pathname.startsWith("/relayer") ||
		pathname.startsWith("/ui-builder") ||
		pathname.startsWith("/ecosystem-adapters") ||
		pathname.startsWith("/tools")
	) {
		switch (lastEcosystem) {
			case "stellar":
				return stellarTree;
			case "polkadot":
				return polkadotTree;
			case "midnight":
				return midnightTree;
			case "ethereum":
				return ethereumEvmTree;
			case "contracts-stylus":
				return arbitrumStylusTree;
			case "zama":
				return zamaTree;
			default:
				return ethereumEvmTree;
		}
	}

	// Default to ethereumEvmTree for other paths
	return ethereumEvmTree;
}
