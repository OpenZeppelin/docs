"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { baseOptions } from "@/app/layout.config";
import {
	ArbitrumIcon,
	EthereumIcon,
	MidnightIcon,
	PolkadotIcon,
	StarknetIcon,
	StellarIcon,
	SuiIcon,
	UniswapIcon,
	ZamaIcon,
} from "@/components/icons";
import { DocsLayout } from "@/components/layout/docs";
import { useNavigationTree } from "@/hooks/use-navigation-tree";

interface DocsLayoutClientProps {
	children: ReactNode;
}

export function DocsLayoutClient({ children }: DocsLayoutClientProps) {
	const currentTree = useNavigationTree();
	const pathname = usePathname();

	// Read sessionStorage in an effect so SSR and the initial client render match;
	// reading it during render would cause a hydration mismatch on shared paths
	// (e.g. /relayer/*) where the active ecosystem is only known on the client.
	const [lastEcosystem, setLastEcosystem] = useState<string | null>(null);
	// biome-ignore lint/correctness/useExhaustiveDependencies: re-read sessionStorage when pathname changes
	useEffect(() => {
		setLastEcosystem(sessionStorage.getItem("lastEcosystem"));
	}, [pathname]);

	// Determine if shared paths should be included in Stellar tab based on sessionStorage
	const tabs = useMemo(() => {
		// Don't show ecosystem tabs on impact pages
		if (pathname.startsWith("/impact")) {
			return [];
		}

		const isSharedPath =
			pathname.startsWith("/monitor") ||
			pathname.startsWith("/relayer") ||
			pathname.startsWith("/ui-builder") ||
			pathname.startsWith("/ecosystem-adapters");

		// Include shared paths in Stellar tab only if coming from Stellar context
		const stellarUrls =
			isSharedPath && lastEcosystem === "stellar"
				? new Set([
						"/stellar-contracts",
						"/monitor",
						"/relayer",
						"/ui-builder",
						"/ecosystem-adapters",
					])
				: new Set(["/stellar-contracts"]);

		// Include shared paths in Polkadot tab only if coming from Polkadot context
		const polkadotUrls =
			isSharedPath && lastEcosystem === "polkadot"
				? new Set([
						"/substrate-runtimes",
						"/monitor",
						"/relayer",
						"/ecosystem-adapters",
					])
				: new Set(["/substrate-runtimes"]);

		const arbitrumStylusUrls =
			isSharedPath && lastEcosystem === "contracts-stylus"
				? new Set([
						"/contracts-stylus",
						"/monitor",
						"/relayer",
						"/ecosystem-adapters",
					])
				: new Set(["/contracts-stylus"]);

		// Ecosystem Adapters is cross-cutting: attribute it to the last active tab
		// (Stellar, Polkadot, Arbitrum Stylus, Midnight, Zama) or default to Ethereum.
		const ethereumUrls = new Set([
			"/contracts",
			"/community-contracts",
			"/upgrades-plugins",
			"/wizard",
			"/relayer",
			"/monitor",
			"/ui-builder",
			"/upgrades",
			"/defender",
			"/tools",
		]);
		if (
			!isSharedPath ||
			!lastEcosystem ||
			!["stellar", "polkadot", "contracts-stylus", "midnight", "zama"].includes(
				lastEcosystem,
			)
		) {
			ethereumUrls.add("/ecosystem-adapters");
		}

		const midnightUrls =
			isSharedPath && lastEcosystem === "midnight"
				? new Set(["/contracts-compact", "/ecosystem-adapters"])
				: new Set(["/contracts-compact"]);

		const zamaUrls =
			isSharedPath && lastEcosystem === "zama"
				? new Set([
						"/confidential-contracts",
						"/relayer",
						"/ecosystem-adapters",
					])
				: new Set(["/confidential-contracts"]);

		return [
			{
				title: "Ethereum & EVM",
				url: "/contracts",
				icon: <EthereumIcon className="w-5 h-5" />,
				urls: ethereumUrls,
			},
			{
				title: "Arbitrum Stylus",
				url: "/contracts-stylus",
				icon: <ArbitrumIcon className="w-5 h-5" />,
				urls: arbitrumStylusUrls,
			},
			{
				title: "Starknet",
				url: "/contracts-cairo",
				icon: <StarknetIcon className="w-5 h-5" />,
			},
			{
				title: "Sui",
				url: "/contracts-sui",
				icon: <SuiIcon className="w-5 h-5" />,
			},
			{
				title: "Stellar",
				url: "/stellar-contracts",
				icon: <StellarIcon className="w-5 h-5" />,
				urls: stellarUrls,
			},
			{
				title: "Midnight",
				url: "/contracts-compact",
				icon: <MidnightIcon className="w-5 h-5" />,
				urls: midnightUrls,
			},
			{
				title: "Polkadot",
				url: "/substrate-runtimes",
				icon: <PolkadotIcon className="w-5 h-5" />,
				urls: polkadotUrls,
			},
			{
				title: "Uniswap Hooks",
				url: "/uniswap-hooks",
				icon: <UniswapIcon className="w-5 h-5" />,
			},
			{
				title: "Zama FHEVM",
				url: "/confidential-contracts",
				icon: <ZamaIcon className="w-5 h-5" />,
				urls: zamaUrls,
			},
		];
	}, [pathname, lastEcosystem]);

	return (
		<DocsLayout
			tree={currentTree}
			nav={{ ...baseOptions, mode: "top", transparentMode: "none" }}
			{...baseOptions}
			sidebar={{
				tabs,
			}}
		>
			{children}
		</DocsLayout>
	);
}
