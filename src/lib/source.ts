import { docs } from "@/.source";
import { loader } from "fumadocs-core/source";
import { getCurrentVersionFromPath } from './versions';

// Version patterns to hide from navigation
const VERSION_PATTERNS = /^v\d+\.x$/;


// See https://fumadocs.vercel.app/docs/headless/source-api for more info
export const source = loader({
	// it assigns a URL to your pages
	baseUrl: "/",
	source: docs.toFumadocsSource(),
});

// Create a function that returns a context-aware modified source  
export function getModifiedSource(currentPath?: string) {
	const currentVersionInfo = currentPath ? getCurrentVersionFromPath(currentPath) : null;
	
	function flattenVersionFoldersForPath(tree: any): any {
		function processNode(node: any, parentLibraryId?: string): any {
			// Check if this node is a library folder (has $id that matches library names)
			const isLibraryFolder = node.$id && !node.$id.includes('/');
			const currentLibraryId = isLibraryFolder ? node.$id : parentLibraryId;
			
			if (node.type === 'folder' && VERSION_PATTERNS.test(node.name)) {
				// If this is a version folder, only include it if:
				// 1. We're currently viewing this library AND this version matches
				// 2. OR we're not viewing this library (show all content for other libraries)
				if (currentVersionInfo && currentLibraryId === currentVersionInfo.library) {
					// We're viewing this library - only show matching version
					if (node.name === currentVersionInfo.version) {
						return node.children?.map((child: any) => processNode(child, currentLibraryId)) || [];
					} else {
						return []; // Hide non-matching versions
					}
				} else {
					// We're not viewing this library - show all its content flattened
					return node.children?.map((child: any) => processNode(child, currentLibraryId)) || [];
				}
			}
			
			if (node.children) {
				// Process children recursively and flatten any arrays
				const processedChildren = node.children.map((child: any) => processNode(child, currentLibraryId));
				node.children = processedChildren.flat().filter((child: any) => child !== null && (Array.isArray(child) ? child.length > 0 : true));
			}
			
			return node;
		}
		
		// Process the root node and its children
		const processedTree = processNode(tree);
		return processedTree;
	}

	return {
		...source,
		get pageTree() {
			return flattenVersionFoldersForPath(source.pageTree);
		},
	};
}

