"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getEcosystemFromPath } from "@/lib/ecosystem-detection";
import { withVersionedRustBook } from "@/lib/relayer-rust-book";
import {
	arbitrumStylusTree,
	ethereumEvmTree,
	impactTree,
	midnightTree,
	polkadotTree,
	starknetTree,
	stellarTree,
	suiTree,
	tronTree,
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
		} else if (pathname.startsWith("/tron-contracts")) {
			sessionStorage.setItem("lastEcosystem", "tron");
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
		} else {
			// Shared paths (/ui-builder, /monitor, /relayer, /ecosystem-adapters, /tools)
			// have no ecosystem in their prefix. If the specific page is uniquely owned
			// by one ecosystem (e.g. /relayer/.../guides/stellar-channels-guide -> Stellar),
			// persist that so later navigation to ambiguous shared pages (quickstart, api/*)
			// stays in the same ecosystem context. Otherwise inherit the previous value.
			const detected = getEcosystemFromPath(pathname);
			if (detected) {
				sessionStorage.setItem("lastEcosystem", detected);
			}
		}

		setLastEcosystem(sessionStorage.getItem("lastEcosystem"));
	}, [pathname]);

	// Determine which navigation tree to use based on the current path
	const baseTree = (() => {
		if (pathname.startsWith("/impact")) {
			return impactTree;
		} else if (pathname.startsWith("/contracts-stylus")) {
			return arbitrumStylusTree;
		} else if (pathname.startsWith("/contracts-cairo")) {
			return starknetTree;
		} else if (pathname.startsWith("/contracts-sui")) {
			return suiTree;
		} else if (pathname.startsWith("/tron-contracts")) {
			return tronTree;
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

		// For shared paths, prefer the ecosystem that uniquely owns this specific page
		// (deterministic from the URL, so it works on a direct/first visit before
		// sessionStorage is read). Fall back to the lastEcosystem state for pages that
		// are shared across multiple ecosystems (e.g. the relayer quickstart).
		if (
			pathname.startsWith("/monitor") ||
			pathname.startsWith("/relayer") ||
			pathname.startsWith("/ui-builder") ||
			pathname.startsWith("/ecosystem-adapters") ||
			pathname.startsWith("/tools")
		) {
			switch (getEcosystemFromPath(pathname) ?? lastEcosystem) {
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
	})();

	// Point the relayer "Rust Book" link at the Netlify build matching the version
	// being viewed (e.g. /relayer/1.4.x/* -> docs-v1-4--). Returns the same tree
	// reference for non-versioned/non-relayer paths, so this is a no-op there.
	return useMemo(
		() => withVersionedRustBook(baseTree, pathname),
		[baseTree, pathname],
	);
}
