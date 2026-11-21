import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateFiles } from "next-validate-link";
import { extractAnchorIds } from "./link-anchors";

test("recognizes legacy anchors and multiline API components", () => {
	const content = `<a className="anchor" id='legacy'></a>

<APIItem
  functionSignature="balance(owner: Address) -> u256"
  kind="external"
  id = "Token-balance"
>
Description.
</APIItem>

<APIItemCompact id='Token-transfer' circuitSig="transfer()" kind="export" />`;
	assert.deepEqual(extractAnchorIds(content), [
		"legacy",
		"Token-balance",
		"Token-transfer",
	]);
});

test("collects explicit heading IDs even when hidden from the TOC", () => {
	assert.deepEqual(
		extractAnchorIds(
			"## Interfaces [#interfaces]\n\n#### Functions [!toc] [#Token-Functions]",
		),
		["interfaces", "Token-Functions"],
	);
});

test("deduplicates IDs shared by headings and API components", () => {
	assert.deepEqual(
		extractAnchorIds(
			'#### [!toc] [#shared]\n\n<APIItem id="shared" />\n\n<a id="shared"></a>',
		),
		["shared"],
	);
});

test("ignores example code, comments, dynamic IDs and unrelated components", () => {
	const content =
		'```mdx\n<APIItem id="example" />\n## Heading [#example-heading]\n```\n\n' +
		'`<a id="inline-example"></a>`\n\n' +
		'{/* <APIItem id="comment-example" /> */}\n\n' +
		'<APIItem id={someValue} />\n\n<Widget id="not-an-anchor" />\n\n<a id=""></a>';
	assert.deepEqual(extractAnchorIds(content), []);
});

test("recognizes the current Cairo introspection API anchors", async () => {
	const content = await readFile(
		new URL(
			"../content/contracts-cairo/4.x/api/introspection.mdx",
			import.meta.url,
		),
		"utf8",
	);
	const ids = extractAnchorIds(content);
	assert.ok(ids.includes("ISRC5-supports_interface"));
	assert.ok(ids.includes("SRC5Component-SRC5Impl"));
	assert.ok(ids.includes("SRC5Component-register_interface"));
	assert.ok(ids.includes("SRC5Component-deregister_interface"));
});

test("fragment validation accepts real MDX anchors and rejects absent ones", async () => {
	const content =
		'<APIItem id="Token-balance" />\n\n' +
		"#### Functions [!toc] [#Token-Functions]";
	const links = [
		"/api/example#Token-balance",
		"/api/example#Token-Functions",
		"/api/example#missing",
	];
	const file = {
		path: "guide.mdx",
		url: "/guide",
		content: links.map((url) => `[Link](${url})`).join(" "),
	};
	const baseline = await validateFiles([file], {
		scanned: {
			urls: new Map([["/api/example", { hashes: [] }]]),
			fallbackUrls: [],
		},
		ignoreFragment: false,
	});
	assert.deepEqual(
		baseline.flatMap((result) => result.errors).map((error) => error.url),
		links,
	);
	const results = await validateFiles([file], {
		scanned: {
			urls: new Map([["/api/example", { hashes: extractAnchorIds(content) }]]),
			fallbackUrls: [],
		},
		ignoreFragment: false,
		checkRelativePaths: "as-url",
	});
	assert.deepEqual(
		results.flatMap((result) => result.errors).map((error) => error.url),
		["/api/example#missing"],
	);
});
