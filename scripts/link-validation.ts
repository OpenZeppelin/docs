import {
	type FileObject,
	printErrors,
	scanURLs,
	validateFiles,
} from "next-validate-link";
import type { InferPageType } from "fumadocs-core/source";
import { source } from "@/lib/source";
import { writeFileSync } from "fs";

async function checkLinks() {
	// Parse command line arguments
	const outputFile = process.argv.includes("--output")
		? process.argv[process.argv.indexOf("--output") + 1]
		: null;

	const scope = process.argv.includes("--scope")
		? process.argv[process.argv.indexOf("--scope") + 1]
		: null;

	const ignoreFragments = !process.argv.includes("--no-ignore-fragments");

	const pages = await Promise.all(
		source.getPages().map(async (page) => {
			return {
				value: {
					slug: page.slugs,
				},
				hashes: await getHeadings(page),
			};
		}),
	);

	const scanned = await scanURLs({
		// pick a preset for your React framework
		preset: "next",
		populate: {
			"(docs)/[...slug]": pages,
		},
	});

	const validationResults = await validateFiles(await getFiles(scope), {
		scanned,
		// check `href` attributes in different MDX components
		markdown: {
			components: {
				Card: { attributes: ["href"] },
			},
		},
		ignoreFragment: ignoreFragments,
		// check relative paths
		checkRelativePaths: "as-url",
	});

	if (outputFile) {
		// Generate custom output format for file
		let output = "";
		let totalErrors = 0;
		let totalFiles = 0;

		for (const result of validationResults) {
			totalFiles++;
			if (result.errors.length > 0) {
				output += `Invalid URLs in ${result.file}:\n`;
				for (const error of result.errors) {
					totalErrors++;
					output += `${error.url}: ${error.reason} at line ${error.line} column ${error.column}\n`;
				}
				output += "------\n";
			}
		}

		output += `\nSummary: ${totalErrors} errors found in ${validationResults.filter((r) => r.errors.length > 0).length} files out of ${totalFiles} total files\n`;

		writeFileSync(outputFile, output);
		console.log(`Results saved to ${outputFile}`);
		console.log(
			`${totalErrors} errors found in ${validationResults.filter((r) => r.errors.length > 0).length} files`,
		);
	} else {
		// Use default printErrors for console output
		printErrors(validationResults, true);
	}
}

async function getHeadings({
	data,
}: InferPageType<typeof source>): Promise<string[]> {
	//const pageData = await data.load();
	//const tocHeadings = pageData.toc.map((item) => item.url.slice(1));
	const tocHeadings = data.toc.map((item) => item.url.slice(1));

	// Also extract actual anchor IDs from the content for API reference pages
	const content = await data.getText("raw");
	const anchorRegex = /<a id="([^"]+)"><\/a>/g;
	const anchorIds: string[] = [];
	let match: any;

	while ((match = anchorRegex.exec(content)) !== null) {
		anchorIds.push(match[1]);
	}

	// Combine TOC headings and actual anchor IDs, removing duplicates
	const allHeadings = [...new Set([...tocHeadings, ...anchorIds])];

	return allHeadings;
}

function getFiles(scope?: string | null) {
	let pages = source.getPages();

	// Filter pages based on scope if provided
	if (scope) {
		pages = pages.filter((page) => {
			// Convert scope pattern to regex
			// /contracts/* becomes ^/contracts/.*
			// contracts/* becomes ^.*contracts/.*
			const pattern = scope
				.replace(/\*/g, ".*")
				.replace(/^\//, "^/")
				.replace(/^(?!\^)/, "^.*");

			const regex = new RegExp(pattern);
			return regex.test(page.url) || regex.test(page.absolutePath);
		});
	}

	const promises = pages.map(
		async (page): Promise<FileObject> => ({
			path: page.absolutePath,
			content: await page.data.getText("raw"),
			url: page.url,
			data: page.data,
		}),
	);

	return Promise.all(promises);
}

void checkLinks();
