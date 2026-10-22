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
		guidesMdx: null,
		sourcePackage: "",
		packageName: null,
		guidesOnly: false,
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
			case "--guides-mdx":
				options.guidesMdx = args[++i];
				break;
			case "--source-package":
			case "-s":
				options.sourcePackage = args[++i];
				break;
			case "--package-name":
				options.packageName = args[++i];
				break;
			case "--guides-only":
				options.guidesOnly = true;
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
  --guides-mdx <path>        Path within repo containing MDX guides to copy into --guides-output (skips .adoc conversion)
  -s, --source-package <dir> Path within repo of the Solidity package to run docgen in (default: repo root)
  --package-name <name>      npm package name used in import paths (default: derived from the repo name)
  --guides-only              Only copy the --guides-mdx guides into --guides-output (no API docs; --api-output is ignored)
  --skip-template-inject     Skip injecting canonical templates (use source repo's own)
  -h, --help                 Show this help message

Modes:
  Default (Solidity repos):  Injects canonical templates, runs hardhat docgen, copies output
  --pre-generated (other):   Skips docgen entirely, copies pre-generated MDX from source repo

Examples:
  # Solidity repo (injects templates, runs docgen):
  node generate-api-docs.js --repo https://github.com/OpenZeppelin/openzeppelin-contracts.git --api-output content/contracts/5.x/api

  # Solidity package in a monorepo, with MDX guides:
  node generate-api-docs.js --repo https://github.com/OpenZeppelin/openzeppelin-accounts.git --api-output content/accounts/api --source-package packages/contracts --package-name @openzeppelin-accounts/contracts --guides-output content/accounts --guides-mdx docs

  # TypeScript package with hand-written MDX guides only:
  node generate-api-docs.js --repo https://github.com/OpenZeppelin/identity-sdk.git --branch main --guides-only --guides-output content/identity-sdk --guides-mdx docs

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

async function injectTemplates(tempDir, options) {
	const { contractsRepo, contractsBranch, apiOutputDir, sourcePackage } =
		options;
	const repoInfo = extractRepoInfo(contractsRepo);
	const packageName = options.packageName ?? derivePackageName(repoInfo.repo);
	const packageDir = path.join(tempDir, sourcePackage);

	console.log("📋 Injecting canonical MDX templates...");

	const templatesTarget = path.join(packageDir, "docs", "templates-md");
	// Overwrite the cloned repo's docs/config.js with our canonical config.
	// The cloned repo's hardhat config and prepare-docs.sh scripts both load
	// `./docs/config`, so this single overwrite covers both paths without
	// needing a separate config-md.js write or a hardhat-config regex patch.
	const configTarget = path.join(packageDir, "docs", "config.js");

	await fs.mkdir(templatesTarget, { recursive: true });
	await copyDirRecursive(
		path.join(DOCGEN_DIR, "templates-md"),
		templatesTarget,
	);

	await fs.copyFile(path.join(DOCGEN_DIR, "config-md.js"), configTarget);

	// Customize API_DOCS_PATH in helpers.js (URL path = file path minus content/)
	const apiDocsPath = apiOutputDir.replace(/^content\//, "");
	const helpersPath = path.join(templatesTarget, "helpers.js");
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
		/blob\/v\{\{oz-version\}\}/g,
		`blob/${contractsBranch}`,
	);

	// Source paths are relative to the package, so prefix them with its location in the repo
	if (sourcePackage) {
		const prefix = sourcePackage.replace(/^\/+|\/+$/g, "");
		contract = contract.replace(
			/(blob\/[^"]*?\/)(\{\{__item_context\.file\.absolutePath\}\})/g,
			`$1${prefix}/$2`,
		);
	}

	// Canonical template has @openzeppelin/{{absolutePath}} with absolutePath
	// starting "contracts/...". For openzeppelin-contracts that's correct
	// (npm package is `@openzeppelin/contracts`, file path keeps the prefix).
	// For other packages (community-contracts, confidential-contracts), the
	// npm package is published with `contracts/` as the package root, so the
	// import skips that prefix — strip it via the strip-contracts-prefix helper.
	// An explicit --package-name is used verbatim (e.g. @openzeppelin-accounts/contracts).
	const importPrefix = options.packageName ?? `@openzeppelin/${packageName}`;
	if (packageName !== "contracts") {
		contract = contract.replace(
			/import "@openzeppelin\/\{\{__item_context\.file\.absolutePath\}\}";/g,
			`import "${importPrefix}/{{strip-contracts-prefix __item_context.file.absolutePath}}";`,
		);
	}
	await fs.writeFile(contractPath, contract, "utf8");
	console.log(
		`  ✓ GitHub link set to ${repoInfo.org}/${repoInfo.repo}`,
	);
	console.log(
		`  ✓ Import path set to ${packageName === "contracts" ? "@openzeppelin/contracts" : importPrefix}/`,
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
		guidesMdx,
		sourcePackage,
	} = options;

	if (options.guidesOnly) {
		await generateGuidesOnly(options);
		return;
	}

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

		// Install dependencies at the repo root (pnpm workspaces) and run docgen in the package directory
		console.log("📚 Installing dependencies...");
		const originalDir = process.cwd();
		const usePnpm = await fs
			.access(path.join(tempDir, "pnpm-lock.yaml"))
			.then(() => true)
			.catch(() => false);
		if (usePnpm) {
			execSync("pnpm install --frozen-lockfile", {
				cwd: tempDir,
				stdio: "inherit",
			});
		}
		process.chdir(path.join(tempDir, sourcePackage));

		try {
			if (!usePnpm) {
				execSync("npm install --silent", { stdio: "inherit" });
			}

			// Generate MDX documentation
			console.log("🏗️  Generating MDX documentation...");
			execSync(`${usePnpm ? "pnpm" : "npm"} run prepare-docs`, {
				stdio: "inherit",
			});

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

		// Restore index.mdx if it was backed up, unless docgen generated one (root-level README.adoc)
		const indexGenerated = await fs
			.access(indexPath)
			.then(() => true)
			.catch(() => false);
		if (indexBackup && !indexGenerated) {
			console.log("♻️  Restoring index.mdx...");
			await fs.writeFile(indexPath, indexBackup, "utf8");
		}

		// Copy MDX guides as-is, or convert AsciiDoc guides (docs/modules/ROOT/pages) to MDX
		if (guidesOutputDir && guidesMdx) {
			await copyGuides(tempDir, guidesMdx, guidesOutputDir);
		} else if (guidesOutputDir) {
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

// Copy a repo's MDX guides with no API docs (e.g. TypeScript packages). The output directory
// is owned by the guides, so it is cleared first to drop pages removed upstream.
async function generateGuidesOnly(options) {
	const { contractsRepo, contractsBranch, tempDir, guidesOutputDir, guidesMdx } =
		options;

	if (!guidesOutputDir || !guidesMdx) {
		console.error("❌ --guides-only requires --guides-output and --guides-mdx");
		process.exit(1);
	}

	console.log("📖 Copying MDX guides...");
	console.log(`📦 Repository: ${contractsRepo}`);
	console.log(`🌿 Branch: ${contractsBranch}`);
	console.log(`📂 Guides Output: ${guidesOutputDir}`);

	try {
		await fs.rm(tempDir, { recursive: true, force: true });
		await fs.rm(guidesOutputDir, { recursive: true, force: true });

		execFileSync(
			"git",
			["clone", "--depth", "1", "--branch", contractsBranch, contractsRepo, tempDir],
			{ stdio: "inherit" },
		);

		await copyGuides(tempDir, guidesMdx, guidesOutputDir);

		await fs.rm(tempDir, { recursive: true, force: true });
		console.log("🎉 Guides copy complete!");
	} catch (error) {
		console.error("❌ Error copying guides:", error.message);
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

async function copyGuides(tempDir, guidesMdx, guidesOutputDir) {
	const guidesPath = path.join(tempDir, guidesMdx);

	try {
		await fs.access(guidesPath);
	} catch {
		console.log(`❌ Error: MDX guides not found at ${guidesMdx}`);
		process.exit(1);
	}

	console.log("📖 Copying MDX guides...");
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
