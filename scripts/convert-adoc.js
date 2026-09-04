#!/usr/bin/env node

import { promises as fs } from "node:fs";
import fsSync from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { glob } from "glob";

async function convertAdocFiles(directory, apiRoute = "contracts/5.x/api") {
	if (!directory) {
		console.error("Usage: node convert-adoc.js <directory> [apiRoute]");
		process.exit(1);
	}

	const adocFiles = await glob(`${directory}/**/*.adoc`);

	for (const adocFile of adocFiles) {
		console.log(`Processing: ${adocFile}`);

		const dir = path.dirname(adocFile);
		const filename = path.basename(adocFile, ".adoc");
		const mdxFile = path.join(dir, `${filename}.mdx`);

		try {
			// Read original file
			let content = await fs.readFile(adocFile, "utf8");

			// Replace code blocks with includes
			content = content.replace(
				/```solidity\s*\ninclude::api:example\$([^[\]]+)\[\]\s*\n```/g,
				"<include cwd lang='solidity'>./examples/$1</include>",
			);

			content = content.replace(
				/\[source,solidity\]\s*\n----\s*\ninclude::api:example\$([^[\]]+)\[\]\s*\n----/g,
				"<include cwd lang='solidity'>./examples/$1</include>",
			);

			// Convert remaining markdown-style fenced blocks to AsciiDoc
			// `[source,lang]\n----\n...\n----` form BEFORE downdoc runs.
			// downdoc mangles the contents of triple-backtick blocks inside
			// .adoc sources (strips `//` comment lines, de-indents nested
			// braces, drops closing `}`), because it doesn't recognise them
			// as verbatim. `----` blocks are treated as literal, so this
			// preprocess step preserves indentation and comments exactly.
			content = content.replace(
				/```([a-zA-Z0-9_-]+)?\s*\n([\s\S]*?)\n```/g,
				(_match, lang, body) => {
					const source = lang ? `[source,${lang}]\n` : "";
					return `${source}----\n${body}\n----`;
				},
			);

			// Replace TIP: and NOTE: callouts with <Callout> tags
			content = content.replace(
				/^(TIP|NOTE):\s*(.+)$/gm,
				"<Callout>\n$2\n</Callout>",
			);

			content = content.replace(
				/^(IMPORTANT|WARNING|CAUTION):\s*(.+)$/gm,
				"<Callout type='warn'>\n$2\n</Callout>",
			);

			// Handle multi-line callouts
			content = content.replace(
				/^(TIP|NOTE):\s*\n((?:.*\n?)*?)(?=\n\n|$)/gm,
				"<Callout>\n$2\n</Callout>",
			);

			content = content.replace(
				/^(IMPORTANT|WARNING|CAUTION):\s*\n((?:.*\n?)*?)(?=\n\n|$)/gm,
				"<Callout type='warn'>\n$2\n</Callout>",
			);
			// Write preprocessed content
			const tempFile = path.join(dir, `temp_${filename}.adoc`);
			await fs.writeFile(tempFile, content, "utf8");

			// Run downdoc
			execSync(`pnpm dlx downdoc "${tempFile}"`, { stdio: "pipe" });

			// Find the generated .md file
			const tempMdFile = path.join(dir, `temp_${filename}.md`);
			let mdContent = await fs.readFile(tempMdFile, "utf8");

			// Fix HTML entities globally
			mdContent = mdContent
				.replace(/&lt;/g, "<")
				.replace(/&gt;/g, ">")
				.replace(/&quot;/g, '"')
				.replace(/&#x27;/g, "'")
				.replace(/&#x2F;/g, "/")
				.replace(/&amp;/g, "&"); // This should be last to avoid double-decoding

			// Convert api: links to dynamic api route and change .adoc to .mdx
			mdContent = mdContent.replace(
				/\(api:([^)]+)\.adoc([^)]*)\)/g,
				`(/${apiRoute}/$1$2)`,
			);

			// Add forward slash to image paths
			mdContent = mdContent.replace(
				/!\[([^\]]*)\]\(([^/)][^)]*\.(png|jpg|jpeg|gif|svg|webp))\)/g,
				"![$1](/$2)",
			);

			// Fix xref: links - remove xref: and convert .adoc to .mdx
			mdContent = mdContent.replace(
				/xref:\[([^\]]+)\]\(([^)]+)\)/g,
				"[$1]($2)",
			);

			// Strip .adoc extensions and rewrite bare same-module slugs to absolute
			// site paths. Relative `./foo` would resolve correctly from a page like
			// /<route>/access-control but NOT from the index (/<route>), so use
			// absolute paths everywhere. Drop trailing /index for index pages.
			// Skip absolute paths, explicit relatives, anchors, protocol URLs, and
			// Antora `module::` cross-module xrefs (handled below).
			const guideRoute = apiRoute.replace(/\/api$/, "");
			mdContent = mdContent.replace(
				/\]\(([^)]+)\.adoc([^)]*)\)/g,
				(_match, slug, rest) => {
					if (
						slug.startsWith("/") ||
						slug.startsWith("./") ||
						slug.startsWith("../") ||
						slug.startsWith("#") ||
						slug.includes("://") ||
						slug.includes("::")
					) {
						return `](${slug}${rest})`;
					}
					const path = slug === "index" ? "" : `/${slug}`;
					return `](/${guideRoute}${path}${rest})`;
				},
			);

			// Resolve Antora cross-module xrefs that downdoc leaves as-is.
			// e.g. `xref:contracts::accounts.adoc#X[Y]` becomes `[Y](contracts::accounts#X)`
			// after the steps above. Map them to absolute site paths per module.
			// Drop trailing /index for index pages so the URL resolves to the
			// section root rather than the literal /index slug.
			const moduleBases = {
				contracts: "/contracts/5.x",
				"community-contracts": "/community-contracts",
				"confidential-contracts": "/confidential-contracts",
				"upgrades-plugins": "/upgrades-plugins",
				defender: "/defender",
				learn: "/contracts/5.x/learn",
			};
			mdContent = mdContent.replace(
				/\]\(([a-z-]+)::(?:([a-z-]+):)?([^)]+)\)/g,
				(match, mod, submod, rest) => {
					const base = moduleBases[mod];
					if (!base) return match;
					const subPath = submod ? `/${submod}` : "";
					const restPath = rest === "index"
						? ""
						: rest.startsWith("index#")
							? rest.slice("index".length)
							: `/${rest}`;
					return `](${base}${subPath}${restPath})`;
				},
			);

			// Fix curly bracket file references {filename} -> filename, but preserve
			// braces in code blocks and in math regions ($...$ / $$...$$) so LaTeX
			// like `\frac{u}{n}` survives.
			const parts = mdContent.split(
				/(```[\s\S]*?```|\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g,
			);
			mdContent = parts
				.map((part, index) => {
					// Every odd index is a preserved region (code block or math).
					if (index % 2 === 1) {
						return part;
					}
					return part.replace(/\{([^}]+)\}/g, "$1");
				})
				.join("");

			// Fix HTML-style callouts <dl><dt><strong>📌 NOTE</strong></dt><dd> ... </dd></dl>
			// Handle multi-line callouts by using a more permissive pattern
			mdContent = mdContent.replace(
				/<dl><dt><strong>[📌🔔ℹ️💡]\s*(NOTE|TIP|INFO)<\/strong><\/dt><dd>([\s\S]*?)<\/dd><\/dl>/gu,
				"<Callout>\n$2\n</Callout>",
			);

			mdContent = mdContent.replace(
				/<dl><dt><strong>[⚠️🚨❗]\s*(WARNING|IMPORTANT|CAUTION|DANGER)<\/strong><\/dt><dd>([\s\S]*?)<\/dd><\/dl>/g,
				"<Callout type='warn'>\n$2\n</Callout>",
			);

			// Handle cases where </dd></dl> might be missing or malformed
			mdContent = mdContent.replace(
				/<dl><dt><strong>[📌🔔ℹ️💡]\s*(NOTE|TIP|INFO)<\/strong><\/dt><dd>([\s\S]*?)(?=\n\n|<dl>|$)/gu,
				"<Callout>\n$2\n</Callout>",
			);

			mdContent = mdContent.replace(
				/<dl><dt><strong>[⚠️🚨❗]\s*(WARNING|IMPORTANT|CAUTION|DANGER)<\/strong><\/dt><dd>([\s\S]*?)(?=\n\n|<dl>|$)/g,
				"<Callout type='warn'>\n$2\n</Callout>",
			);

			// Fix xref patterns with complex anchors like xref:#ISRC6-\\__execute__[...]
			mdContent = mdContent.replace(
				/xref:#([^[\]]+)\[([^\]]+)\]/g,
				"[$2](#$1)",
			);

			// Fix simple xref patterns
			mdContent = mdContent.replace(/xref:([^[\s]+)\[([^\]]+)\]/g, "[$2]($1)");

			// Clean up orphaned HTML tags from malformed callouts
			// Handle orphaned <dl><dt><strong>EMOJI TYPE</strong></dt><dd> without closing tags
			mdContent = mdContent.replace(
				/<dl><dt><strong>[📌🔔ℹ️💡]\s*(NOTE|TIP|INFO)<\/strong><\/dt><dd>\s*\n([\s\S]*?)(?=\n\n|<dl>|$)/gu,
				"<Callout>\n$2\n</Callout>",
			);

			mdContent = mdContent.replace(
				/<dl><dt><strong>[⚠️🚨❗]\s*(WARNING|IMPORTANT|CAUTION|DANGER)<\/strong><\/dt><dd>\s*\n([\s\S]*?)(?=\n\n|<dl>|$)/g,
				"<Callout type='warn'>\n$2\n</Callout>",
			);

			// Clean up any remaining orphaned HTML tags
			mdContent = mdContent.replace(
				/<dl><dt><strong>.*?<\/strong><\/dt><dd>/g,
				"",
			);
			mdContent = mdContent.replace(/<\/dd><\/dl>/g, "");
			mdContent = mdContent.replace(/<dd>/g, "");
			mdContent = mdContent.replace(/<\/dd>/g, "");
			mdContent = mdContent.replace(/<dl>/g, "");
			mdContent = mdContent.replace(/<\/dl>/g, "");

			// AsciiDoc passthrough `+name+` that downdoc preserved inside backticks
			// (e.g. ``+IERC7984Receiver+``) — strip the leading/trailing + signs.
			// Run before the code-aware split below so we can match across the
			// backticks; restricted to identifier-like content so legitimate
			// `a + b` style code is left alone.
			mdContent = mdContent.replace(/`\+([^\s`+]+)\+`/g, "`$1`");

			// AsciiDoc inline mailto: `mailto:URL[label]` → `[label](mailto:URL)`
			// Run before the code-aware split since mailto in code blocks is
			// rare and would render fine either way.
			mdContent = mdContent.replace(
				/mailto:([^\s[]+)\[([^\]]+)\]/g,
				"[$2](mailto:$1)",
			);

			// Code-aware processing: skip triple-backtick blocks and inline code.
			// Inside non-code regions:
			//  - ++text++ → `text` (AsciiDoc passthrough monospace, single-line,
			//    identifier-like content so we don't mangle Solidity ++i in code
			//    blocks that downdoc may have left fenced incorrectly)
			//  - bare < before digit/whitespace-word → &lt; (MDX-safe, e.g.
			//    "<1 share", "< 0x80")
			const codeSplit = mdContent.split(/(```[\s\S]*?```|`[^`\n]*`)/g);
			mdContent = codeSplit
				.map((part, idx) => {
					if (idx % 2 === 1) return part;
					return part
						.replace(/\+\+([^+\n]+)\+\+/g, "`$1`")
						.replace(/(<)(\s+\w|\d)/g, "&lt;$2");
				})
				.join("");
			// Extract title
			const headerMatch = mdContent.match(/^#+\s+(.+)$/m);
			const title = headerMatch ? headerMatch[1].trim() : filename;

			// Remove the first H1 from content
			const contentWithoutFirstH1 = mdContent
				.replace(/^#+\s+.+$/m, "")
				.replace(/^\n+/, "");

			// Create MDX with frontmatter — JSON.stringify quotes and escapes
			// the title so colons (e.g. "ERC-7540: ...") don't break YAML parsing.
			const mdxContent = `---
title: ${JSON.stringify(title)}
---

${contentWithoutFirstH1}`;

			await fs.writeFile(mdxFile, mdxContent, "utf8");

			// Cleanup
			await fs.unlink(tempMdFile);
			await fs.unlink(tempFile);
			await fs.unlink(adocFile);

			console.log("  ✓ Converted successfully");
		} catch (error) {
			console.log(`  ✗ Error: ${error.message}`);
		}
	}
}

// Process files to remove curly brackets after conversion
function processFile(filePath) {
	try {
		// Only process .mdx files (skip .adoc files)
		if (!filePath.endsWith(".mdx")) {
			console.log(`Skipped: ${filePath}`);
			return;
		}

		const content = fsSync.readFileSync(filePath, "utf8");
		// Split content by code blocks and math regions, process the rest.
		const parts = content.split(
			/(```[\s\S]*?```|\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g,
		);
		const modifiedContent = parts
			.map((part, index) => {
				// Every odd index is a preserved region (code block or math).
				if (index % 2 === 1) {
					return part;
				}
				return part.replace(/[{}]/g, "");
			})
			.join("");

		fsSync.writeFileSync(filePath, modifiedContent, "utf8");
		console.log(`Processed: ${filePath}`);
	} catch (error) {
		console.error(`Error processing ${filePath}: ${error.message}`);
	}
}

function crawlDirectory(dirPath) {
	try {
		const items = fsSync.readdirSync(dirPath);

		for (const item of items) {
			const itemPath = path.join(dirPath, item);
			const stats = fsSync.statSync(itemPath);

			if (stats.isDirectory()) {
				crawlDirectory(itemPath);
			} else if (stats.isFile()) {
				processFile(itemPath);
			}
		}
	} catch (error) {
		console.error(`Error crawling directory ${dirPath}: ${error.message}`);
	}
}

const directory = process.argv[2];
const apiRoute = process.argv[3];

async function main() {
	await convertAdocFiles(directory, apiRoute);
	// Run bracket processing after conversion
	crawlDirectory(directory);
}

main().catch(console.error);
