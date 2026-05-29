#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { execSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCGEN_DIR = path.join(__dirname, "..", "docgen");

// Parse command line arguments
function parseArgs() {
	const args = process.argv.slice(2);
	const options = {
		contractsRepo:
			"https://github.com/OpenZeppelin/openzeppelin-contracts.git",
		contractsBranch: "master",
		tempDir: "temp-contracts",
		apiOutputDir: "content/contracts/5.x/api",
		examplesOutputDir: "examples",
		skipTemplateInject: false,
		preGenerated: null,
		guidesOutputDir: null,
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		switch (arg) {
			case "--help":
			case "-h":
				showHelp();
				process.exit(0);
				break;
			case "--repo":
			case "-r":
				options.contractsRepo = args[++i];
				break;
			case "--branch":
			case "-b":
				options.contractsBranch = args[++i];
				break;
			case "--temp-dir":
			case "-t":
				options.tempDir = args[++i];
				break;
			case "--api-output":
			case "-a":
				options.apiOutputDir = args[++i];
				break;
			case "--examples-output":
			case "-e":
				options.examplesOutputDir = args[++i];
				break;
			case "--skip-template-inject":
				options.skipTemplateInject = true;
				break;
			case "--pre-generated":
			case "-p":
				options.preGenerated = args[++i];
				break;
			case "--guides-output":
			case "-g":
				options.guidesOutputDir = args[++i];
				break;
			default:
				console.error(`Unknown option: ${arg}`);
				showHelp();
				process.exit(1);
		}
	}

	return options;
}

function showHelp() {
	console.log(`
Generate OpenZeppelin Contracts API documentation

Usage: node generate-api-docs.js [options]

Options:
  -r, --repo <url|path>      Contracts repository URL or local path
  -b, --branch <branch>      Contracts repository branch (default: master)
  -t, --temp-dir <dir>       Temporary directory for cloning (default: temp-contracts)
  -a, --api-output <dir>     API documentation output directory (default: content/contracts/5.x/api)
  -e, --examples-output <dir> Examples output directory (default: examples)
  -p, --pre-generated <path> Path within repo containing pre-generated MDX files (skips docgen)
  -g, --guides-output <dir>  Convert .adoc guides from docs/modules/ROOT/pages/ to MDX into <dir>
  --skip-template-inject     Skip injecting canonical templates (use source repo's own)
  -h, --help                 Show this help message

Modes:
  Default (Solidity repos):  Injects canonical templates, runs hardhat docgen, copies output
  --pre-generated (other):   Skips docgen entirely, copies pre-generated MDX from source repo

Examples:
  # Solidity repo (injects templates, runs docgen):
  node generate-api-docs.js --repo https://github.com/OpenZeppelin/openzeppelin-contracts.git --api-output content/contracts/5.x/api

  # Non-Solidity repo (copies pre-generated MDX):
  node generate-api-docs.js --repo https://github.com/OpenZeppelin/cairo-contracts.git --api-output content/contracts-cairo/3.x/api --pre-generated docs/api
`);
}

// Extract GitHub org/repo from a repo URL or path
function extractRepoInfo(repoPath) {
	// Handle GitHub URLs
	const githubMatch = repoPath.match(
		/github\.com\/([^/]+)\/([^/.]+)/,
	);
	if (githubMatch) {
		return { org: githubMatch[1], repo: githubMatch[2] };
	}
	// Handle local paths - extract from directory name
	const dirName = path.basename(repoPath.replace(/\/+$/, ""));
	return { org: "OpenZeppelin", repo: dirName };
}

// Derive the npm package name from the repo name
function derivePackageName(repoName) {
	// openzeppelin-contracts -> @openzeppelin/contracts
	// openzeppelin-community-contracts -> @openzeppelin/community-contracts
	// openzeppelin-confidential-contracts -> @openzeppelin/confidential-contracts
	const withoutPrefix = repoName.replace(/^openzeppelin-/, "");
	return withoutPrefix;
}

// Helpers and properties exported by templates-md/{helpers,properties}.js,
// used to generate ESM shim files when injecting into the new layout. The
// hardhat3-style docgen plugin only loads helpers.ts/properties.ts via
// `await import()`, so it needs real named exports — kebab-case CJS keys
// don't survive ESM interop.
const HELPER_EXPORTS = [
	"ozVersion", "readmePath", "readme", "names", "simpleId",
	"resetFunctionCounts", "eq", "stripContractsPrefix", "startsWith",
	"processNatspec", "typedParams", "slug", "title", "description",
	"withPrelude",
];
const PROPERTY_EXPORTS = [
	"anchor", "fullname", "inheritance", "hasFunctions", "hasEvents",
	"hasErrors", "internalVariables", "hasInternalVariables", "functions",
	"returns2", "inheritedFunctions",
];

function tsShim(varName, sourcePath, exports) {
	return [
		`import ${varName} from '${sourcePath}';`,
		"",
		...exports.map(e => `export const ${e} = ${varName}.${e};`),
		"",
	].join("\n");
}

async function injectTemplates(tempDir, options) {
	const { contractsRepo, contractsBranch, apiOutputDir } = options;
	const repoInfo = extractRepoInfo(contractsRepo);
	const packageName = derivePackageName(repoInfo.repo);

	console.log("📋 Injecting canonical MDX templates...");

	// Detect new layout (hardhat3-style): docs/config.mjs + docs/templates/.
	// Legacy layout uses docs/config.js + docs/templates-md/.
	let newLayout = false;
	try {
		await fs.access(path.join(tempDir, "docs", "config.mjs"));
		newLayout = true;
	} catch {}

	const templatesTarget = path.join(
		tempDir,
		"docs",
		newLayout ? "templates" : "templates-md",
	);
	const configTarget = path.join(
		tempDir,
		"docs",
		newLayout ? "config.mjs" : "config.js",
	);
	const configSource = path.join(
		DOCGEN_DIR,
		newLayout ? "config-md.mjs" : "config-md.js",
	);

	if (newLayout) {
		console.log("  ✓ Detected new layout (config.mjs + docs/templates/)");
	}

	// Wipe target templates dir to avoid stale files from the cloned repo
	// (e.g. the hardhat3 branch's helpers.ts/properties.ts/contract.hbs).
	await fs.rm(templatesTarget, { recursive: true, force: true });
	await fs.mkdir(templatesTarget, { recursive: true });
	await copyDirRecursive(
		path.join(DOCGEN_DIR, "templates-md"),
		templatesTarget,
	);

	await fs.copyFile(configSource, configTarget);

	// The new plugin loads helpers via `require.resolve(dir + '/helpers.ts')`
	// and `await import(...)` — only `.ts` is searched and only ESM named
	// function exports are picked up. Rename our CJS .js files to .cjs and
	// emit thin .ts shims that re-export each function.
	const helpersFileName = newLayout ? "helpers.cjs" : "helpers.js";
	const propertiesFileName = newLayout ? "properties.cjs" : "properties.js";
	if (newLayout) {
		await fs.rename(
			path.join(templatesTarget, "helpers.js"),
			path.join(templatesTarget, helpersFileName),
		);
		await fs.rename(
			path.join(templatesTarget, "properties.js"),
			path.join(templatesTarget, propertiesFileName),
		);
		// `require('./helpers')` in properties.cjs no longer resolves once
		// the file is renamed (Node's CJS resolver does not search for
		// `.cjs` by default). Patch the import to use the explicit name.
		const propertiesCjsPath = path.join(templatesTarget, propertiesFileName);
		let propertiesSource = await fs.readFile(propertiesCjsPath, "utf8");
		propertiesSource = propertiesSource.replace(
			/require\(['"]\.\/helpers['"]\)/g,
			"require('./helpers.cjs')",
		);
		await fs.writeFile(propertiesCjsPath, propertiesSource, "utf8");
		await fs.writeFile(
			path.join(templatesTarget, "helpers.ts"),
			tsShim("h", "./helpers.cjs", HELPER_EXPORTS),
			"utf8",
		);
		await fs.writeFile(
			path.join(templatesTarget, "properties.ts"),
			tsShim("p", "./properties.cjs", PROPERTY_EXPORTS),
			"utf8",
		);
	}

	// Customize API_DOCS_PATH in helpers (URL path = file path minus content/)
	const apiDocsPath = apiOutputDir.replace(/^content\//, "");
	const helpersPath = path.join(templatesTarget, helpersFileName);
	let helpers = await fs.readFile(helpersPath, "utf8");
	helpers = helpers.replace(
		/const API_DOCS_PATH = ['"][^'"]+['"]/,
		`const API_DOCS_PATH = '${apiDocsPath}'`,
	);
	await fs.writeFile(helpersPath, helpers, "utf8");
	console.log(`  ✓ API_DOCS_PATH set to '${apiDocsPath}'`);

	// Customize GitHub link and import path in contract.hbs
	const contractPath = path.join(templatesTarget, "contract.hbs");
	let contract = await fs.readFile(contractPath, "utf8");

	contract = contract.replace(
		/OpenZeppelin\/openzeppelin-contracts/g,
		`${repoInfo.org}/${repoInfo.repo}`,
	);

	// Use the actual cloned ref for GitHub source links (master for repos
	// without releases, the tag for tagged runs). Avoids 404s like
	// /blob/v0.0.1/... when community-contracts package.json has a placeholder
	// version that doesn't correspond to an actual tag.
	contract = contract.replace(
		/blob\/v\{\{ozVersion\}\}/g,
		`blob/${contractsBranch}`,
	);

	// Canonical template has @openzeppelin/{{absolutePath}} with absolutePath
	// starting "contracts/...". For openzeppelin-contracts that's correct
	// (npm package is `@openzeppelin/contracts`, file path keeps the prefix).
	// For other packages (community-contracts, confidential-contracts), the
	// npm package is published with `contracts/` as the package root, so the
	// import skips that prefix via the stripContractsPrefix helper.
	if (packageName !== "contracts") {
		contract = contract.replace(
			/import "@openzeppelin\/\{\{__item_context\.file\.absolutePath\}\}";/g,
			`import "@openzeppelin/${packageName}/{{stripContractsPrefix __item_context.file.absolutePath}}";`,
		);
	}
	await fs.writeFile(contractPath, contract, "utf8");
	console.log(
		`  ✓ GitHub link set to ${repoInfo.org}/${repoInfo.repo}`,
	);
	console.log(
		`  ✓ Import path set to @openzeppelin/${packageName}/`,
	);
}

async function generateApiDocs(options) {
	const {
		contractsRepo,
		contractsBranch,
		tempDir,
		apiOutputDir,
		examplesOutputDir,
		skipTemplateInject,
		preGenerated,
		guidesOutputDir,
	} = options;

	console.log("🔄 Generating OpenZeppelin API documentation...");
	console.log(`📦 Repository: ${contractsRepo}`);
	console.log(`🌿 Branch: ${contractsBranch}`);
	console.log(`📂 API Output: ${apiOutputDir}`);
	if (preGenerated) {
		console.log(`📋 Mode: pre-generated (source path: ${preGenerated})`);
	} else {
		console.log(`📂 Examples Output: ${examplesOutputDir}`);
	}
	if (guidesOutputDir) {
		console.log(`📖 Guides Output: ${guidesOutputDir}`);
	}

	try {
		// Back up index.mdx if it exists
		const indexPath = path.join(apiOutputDir, "index.mdx");
		let indexBackup = null;
		try {
			indexBackup = await fs.readFile(indexPath, "utf8");
			console.log("💾 Backing up existing index.mdx...");
		} catch (error) {
			// index.mdx doesn't exist, no need to back up
		}

		// Clean up previous runs
		console.log("🧹 Cleaning up previous runs...");
		await fs.rm(tempDir, { recursive: true, force: true });
		await fs.rm(apiOutputDir, { recursive: true, force: true });

		// Create output directory
		await fs.mkdir(apiOutputDir, { recursive: true });

		// Clone the repository (works for both URLs and local paths)
		console.log("📦 Cloning repository...");
		execFileSync(
			"git",
			["clone", "--depth", "1", "--branch", contractsBranch, "--recurse-submodules", contractsRepo, tempDir],
			{ stdio: "inherit" },
		);

		// Pre-generated mode: just copy MDX files from source repo, skip docgen
		if (preGenerated) {
			const sourcePath = path.join(tempDir, preGenerated);
			try {
				await fs.access(sourcePath);
				await copyDirRecursive(sourcePath, apiOutputDir);
				console.log(`✅ Pre-generated docs copied from ${preGenerated}`);
			} catch (error) {
				console.log(
					`❌ Error: Pre-generated docs not found at ${preGenerated}`,
				);
				process.exit(1);
			}

			// Restore index.mdx if backed up
			if (indexBackup) {
				console.log("♻️  Restoring index.mdx...");
				await fs.writeFile(indexPath, indexBackup, "utf8");
			}

			// Clean up
			console.log("🧹 Cleaning up...");
			await fs.rm(tempDir, { recursive: true, force: true });

			console.log("🎉 API documentation generation complete!");
			console.log(`📂 Documentation available in: ${apiOutputDir}`);
			return;
		}

		// Solidity docgen mode: inject templates and run generation
		if (!skipTemplateInject) {
			await injectTemplates(tempDir, options);
		}

		// Navigate to contracts directory and install dependencies
		console.log("📚 Installing dependencies...");
		const originalDir = process.cwd();
		process.chdir(tempDir);

		try {
			execSync("npm install --silent", { stdio: "inherit" });

			// Generate MDX documentation
			console.log("🏗️  Generating MDX documentation...");
			execSync("npm run prepare-docs", { stdio: "inherit" });

			// Copy generated files
			console.log("📋 Copying generated documentation...");
			const docsPath = path.join("docs", "modules", "api", "pages");

			try {
				await fs.access(docsPath);
				// Copy API docs
				const apiSource = path.join(process.cwd(), docsPath);
				const apiDest = path.join(originalDir, apiOutputDir);
				await copyDirRecursive(apiSource, apiDest);
				console.log(`✅ API documentation copied to ${apiOutputDir}`);
			} catch (error) {
				console.log(
					"❌ Error: Documentation not found at expected location",
				);
				process.exit(1);
			}

			// Copy examples if they exist
			const examplesPath = path.join("docs", "modules", "api", "examples");
			if (
				await fs
					.access(examplesPath)
					.then(() => true)
					.catch(() => false)
			) {
				const examplesDest = path.join(originalDir, examplesOutputDir);
				await fs.mkdir(examplesDest, { recursive: true });
				await copyDirRecursive(
					path.join(process.cwd(), examplesPath),
					examplesDest,
				);
				console.log(`✅ Examples copied to ${examplesOutputDir}`);
			}
		} finally {
			// Go back to original directory
			process.chdir(originalDir);
		}

		// Restore index.mdx if it was backed up
		if (indexBackup) {
			console.log("♻️  Restoring index.mdx...");
			await fs.writeFile(indexPath, indexBackup, "utf8");
		}

		// Convert AsciiDoc guides (docs/modules/ROOT/pages) to MDX
		if (guidesOutputDir) {
			await convertGuides(tempDir, guidesOutputDir, apiOutputDir);
		}

		// Clean up temporary directory
		console.log("🧹 Cleaning up...");
		await fs.rm(tempDir, { recursive: true, force: true });

		console.log("🎉 API documentation generation complete!");
		console.log(`📂 Documentation available in: ${apiOutputDir}`);
	} catch (error) {
		console.error("❌ Error generating API documentation:", error.message);
		process.exit(1);
	}
}

async function convertGuides(tempDir, guidesOutputDir, apiOutputDir) {
	const guidesPath = path.join(tempDir, "docs", "modules", "ROOT", "pages");

	try {
		await fs.access(guidesPath);
	} catch {
		console.log(`ℹ️  No guides at ${guidesPath}, skipping conversion`);
		return;
	}

	console.log("📖 Converting AsciiDoc guides to MDX...");
	const apiRoute = apiOutputDir.replace(/^content\//, "");
	const scriptPath = path.join(__dirname, "convert-adoc.js");

	execFileSync("node", [scriptPath, guidesPath, apiRoute], {
		stdio: "inherit",
	});

	await fs.mkdir(guidesOutputDir, { recursive: true });
	await copyMdxRecursive(guidesPath, guidesOutputDir);
	console.log(`✅ Guides copied to ${guidesOutputDir}`);
}

async function copyMdxRecursive(srcDir, destDir) {
	const entries = await fs.readdir(srcDir, { withFileTypes: true });
	for (const entry of entries) {
		const srcPath = path.join(srcDir, entry.name);
		const destPath = path.join(destDir, entry.name);
		if (entry.isDirectory()) {
			await fs.mkdir(destPath, { recursive: true });
			await copyMdxRecursive(srcPath, destPath);
		} else if (entry.isFile() && entry.name.endsWith(".mdx")) {
			await fs.copyFile(srcPath, destPath);
		}
	}
}

async function copyDirRecursive(src, dest) {
	await fs.mkdir(dest, { recursive: true });
	const entries = await fs.readdir(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isSymbolicLink()) {
			// Resolve symlink and copy the target; skip broken symlinks
			try {
				const realPath = await fs.realpath(srcPath);
				const stat = await fs.stat(realPath);
				if (stat.isDirectory()) {
					await copyDirRecursive(realPath, destPath);
				} else {
					await fs.copyFile(realPath, destPath);
				}
			} catch {
				// Broken symlink, skip
			}
		} else if (entry.isDirectory()) {
			// Skip node_modules and .git when copying local repos
			if (entry.name === "node_modules" || entry.name === ".git") continue;
			await copyDirRecursive(srcPath, destPath);
		} else {
			await fs.copyFile(srcPath, destPath);
		}
	}
}

// Main execution
const options = parseArgs();
generateApiDocs(options);
