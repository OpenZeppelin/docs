import { remark } from "remark";
import remarkMath from "remark-math";
import remarkMdx from "remark-mdx";
import { visit } from "unist-util-visit";

/** Collect rendered MDX anchors that are not necessarily present in the TOC. */
export function extractAnchorIds(content: string): string[] {
	const tree = remark().use(remarkMath).use(remarkMdx).parse(content);
	const ids = new Set<string>();

	visit(tree, (node) => {
		if (node.type === "heading") {
			const last = node.children.at(-1);
			// Match Fumadocs' trailing custom-ID syntax, including [!toc] headings.
			if (last?.type === "text") {
				const match = /\s*\[#([^\]]+)]\s*$/.exec(last.value);
				if (match?.[1]) ids.add(match[1]);
			}
		} else if (
			(node.type === "mdxJsxFlowElement" ||
				node.type === "mdxJsxTextElement") &&
			(node.name === "a" ||
				node.name === "APIItem" ||
				node.name === "APIItemCompact")
		) {
			const id = node.attributes.find(
				(attribute) =>
					attribute.type === "mdxJsxAttribute" && attribute.name === "id",
			);
			if (
				id?.type === "mdxJsxAttribute" &&
				typeof id.value === "string" &&
				id.value
			) {
				ids.add(id.value);
			}
		}
	});

	return [...ids];
}
