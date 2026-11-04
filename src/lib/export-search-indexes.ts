import { latestStable as cairoLatestStable } from "content/contracts-cairo/latest-versions";
import { latestStable as compactLatestStable } from "content/contracts-compact/latest-versions";
import type { DocumentRecord } from "fumadocs-core/search/algolia";
import type { Page } from "fumadocs-core/source";
import { source } from "@/lib/source";

const isCompactPage = (url: string) =>
	url === "/contracts-compact" || url.startsWith("/contracts-compact/");

const isCurrentCompactPage = (url: string) =>
	url === "/contracts-compact" ||
	url === `/contracts-compact/${compactLatestStable}` ||
	url.startsWith(`/contracts-compact/${compactLatestStable}/`);

export async function exportSearchIndexes() {
	const results: DocumentRecord[] = [];

	// Define version paths to exclude (keeping only latest versions)
	const excludedVersions = [
		"/3.x/",
		"/4.x/",
		"/0.1.0/",
		"/0.2.0/",
		"/2.0.0/",
		"/1.0.0/",
	];

	const filteredPages = source
		.getPages()
		.filter((page: Page) =>
			isCompactPage(page.url)
				? isCurrentCompactPage(page.url)
				: page.url.startsWith("/contracts-sui/") ||
					page.url === `/contracts-cairo/${cairoLatestStable}` ||
					page.url.startsWith(`/contracts-cairo/${cairoLatestStable}/`) ||
					!excludedVersions.some((excluded) => page.url.includes(excluded)),
		);

	for (const page of filteredPages) {
		const data = await page.data.load();
		results.push({
			_id: page.url,
			structured: data.structuredData,
			url: page.url,
			title: page.data.title,
			description: page.data.description,
			extra_data: data.body,
		});
	}

	return results;
}
