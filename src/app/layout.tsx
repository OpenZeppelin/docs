import "@/app/global.css";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { Provider } from "./provider";

const inter = Inter({
	subsets: ["latin"],
});

export const metadata: Metadata = {
	metadataBase: new URL("https://openzeppelin-docs-v2.netlify.app"),
	title: {
		default: "OpenZeppelin Docs",
		template: "%s | OpenZeppelin Docs",
	},
	description:
		"The official documentation for OpenZeppelin Libraries and Tools",
	keywords: [
		"OpenZeppelin",
		"smart contracts",
		"Ethereum",
		"Solidity",
		"blockchain",
		"security",
		"DeFi",
		"documentation",
	],
	creator: "OpenZeppelin",
	publisher: "OpenZeppelin",
	icons: {
		icon: [
			{ url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
		],
		apple: [
			{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
		],
		other: [
			{
				rel: "manifest",
				url: "/site.webmanifest",
			},
		],
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://docs.openzeppelin.com",
		siteName: "OpenZeppelin Docs",
		title: "OpenZeppelin Docs",
		description:
			"The official documentation for OpenZeppelin Libraries and Tools",
		images: [
			{
				url: "/social.png",
				width: 1200,
				height: 630,
				alt: "OpenZeppelin Docs",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		site: "@OpenZeppelin",
		creator: "@OpenZeppelin",
		title: "OpenZeppelin Docs",
		description:
			"The official documentation for OpenZeppelin Libraries and Tools",
		images: ["/social.png"],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
};

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className={inter.className} suppressHydrationWarning>
			<body className="flex flex-col min-h-screen">
				<GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID as string} />
				<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID as string} />
				<Provider>{children}</Provider>
			</body>
		</html>
	);
}
