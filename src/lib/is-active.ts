import type { SidebarTab } from "fumadocs-ui/utils/get-sidebar-tabs";

function normalize(url: string) {
  if (url.length > 1 && url.endsWith("/")) return url.slice(0, -1);
  return url;
}

// Products that have versioned paths like /product/X.Y.x/...
const VERSIONED_PRODUCTS = ["/relayer", "/monitor"];

// Version pattern: matches patterns like "1.3.x", "1.0.x", "2.1.x"
const VERSION_PATTERN = /^(\d+\.\d+\.x)$/;

interface ParsedPath {
  base: string;
  version: string | null; // null means development/unversioned
  subpath: string;
}

/**
 * Parses a path for versioned products.
 * For "/relayer/1.3.x/quickstart" returns { base: "/relayer", version: "1.3.x", subpath: "/quickstart" }
 * For "/relayer/quickstart" (development) returns { base: "/relayer", version: null, subpath: "/quickstart" }
 * For "/relayer" (development root) returns { base: "/relayer", version: null, subpath: "" }
 * For non-product paths, returns null.
 */
function parseProductPath(path: string): ParsedPath | null {
  const normalizedPath = normalize(path);

  for (const product of VERSIONED_PRODUCTS) {
    if (normalizedPath === product) {
      // Exact match to product root (development version)
      return { base: product, version: null, subpath: "" };
    }

    if (normalizedPath.startsWith(`${product}/`)) {
      const remainder = normalizedPath.slice(product.length + 1); // +1 for the slash
      const segments = remainder.split("/");
      const firstSegment = segments[0];

      if (firstSegment && VERSION_PATTERN.test(firstSegment)) {
        // Versioned path: /relayer/1.3.x or /relayer/1.3.x/quickstart
        return {
          base: product,
          version: firstSegment,
          subpath: segments.length > 1 ? `/${segments.slice(1).join("/")}` : "",
        };
      }
      // Development path with subpath: /relayer/quickstart
      return {
        base: product,
        version: null,
        subpath: `/${remainder}`,
      };
    }
  }

  return null;
}

export function isActive(
  url: string,
  pathname: string,
  nested = true
): boolean {
  url = normalize(url);
  pathname = normalize(pathname);

  // Standard exact match or nested match
  if (url === pathname || (nested && pathname.startsWith(`${url}/`))) {
    return true;
  }

  // Check for versioned/development path matching
  const urlParsed = parseProductPath(url);
  const pathnameParsed = parseProductPath(pathname);

  if (urlParsed && pathnameParsed) {
    // Both are paths for the same product
    if (urlParsed.base === pathnameParsed.base) {
      // Same subpath means it's the same "page" just different version
      if (urlParsed.subpath === pathnameParsed.subpath) {
        return true;
      }

      // Check if pathname is nested under url's subpath
      if (
        nested &&
        pathnameParsed.subpath.startsWith(`${urlParsed.subpath}/`)
      ) {
        return true;
      }

      // Handle root match: /relayer/1.3.x should match any /relayer/* when nested
      if (nested && urlParsed.subpath === "") {
        return true;
      }
    }
  }

  return false;
}

export function isTabActive(tab: SidebarTab, pathname: string) {
  if (tab.urls) {
    const normalizedPathname = normalize(pathname);
    return Array.from(tab.urls).some((url) =>
      isActive(url, normalizedPathname, true)
    );
  }

  return isActive(tab.url, pathname, true);
}
