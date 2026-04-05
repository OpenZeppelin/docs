const { version } = require('../../package.json');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const API_DOCS_PATH = 'contracts/5.x/api';

module.exports['oz-version'] = () => version;

module.exports['readme-path'] = opts => {
  const pageId = opts.data.root.id;
  const basePath = pageId.replace(/\.(adoc|mdx)$/, '');
  return 'contracts/' + basePath + '/README.adoc';
};

module.exports.readme = readmePath => {
  try {
    if (fs.existsSync(readmePath)) {
      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      return processAdocContent(readmeContent);
    }
  } catch (error) {
    console.warn(`Warning: Could not process README at ${readmePath}:`, error.message);
  }
  return '';
};

module.exports.names = params => params?.map(p => p.name).join(', ');

// Simple function counter for unique IDs
const functionNameCounts = {};

module.exports['simple-id'] = function (name) {
  if (!functionNameCounts[name]) {
    functionNameCounts[name] = 1;
    return name;
  } else {
    functionNameCounts[name]++;
    return `${name}-${functionNameCounts[name]}`;
  }
};

module.exports['reset-function-counts'] = function () {
  Object.keys(functionNameCounts).forEach(key => delete functionNameCounts[key]);
  return '';
};

module.exports.eq = (a, b) => a === b;
module.exports['starts-with'] = (str, prefix) => str && str.startsWith(prefix);

// Process natspec content with {REF} and link replacement
module.exports['process-natspec'] = function (natspec, opts) {
  if (!natspec) return '';

  const currentPage = opts.data.root.__item_context?.page || opts.data.root.id;
  const links = getAllLinks(opts.data.site.items, currentPage);

  const processed = processReferences(natspec, links, currentPage);
  return processCallouts(processed); // Add callout processing at the end
};

module.exports['typed-params'] = params => {
  return params?.map(p => `${p.type}${p.indexed ? ' indexed' : ''}${p.name ? ' ' + p.name : ''}`).join(', ');
};

const slug = (module.exports.slug = str => {
  if (str === undefined) {
    throw new Error('Missing argument');
  }
  return str.replace(/\W/g, '-');
});

// Link generation and caching
const linksCache = new WeakMap();

function getAllLinks(items, currentPage) {
  if (currentPage) {
    const cacheKey = currentPage;
    let cache = linksCache.get(items);
    if (!cache) {
      cache = new Map();
      linksCache.set(items, cache);
    }

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
  }

  const res = {};
  // Track which page each link key belongs to for same-page preference
  const linkPages = {};
  const currentPagePath = currentPage ? currentPage.replace(/\.mdx$/, '') : '';

  for (const item of items) {
    const pagePath = item.__item_context.page.replace(/\.mdx$/, '');
    const linkPath = generateLinkPath(pagePath, currentPagePath, item.anchor);

    // Generate xref keys for legacy compatibility
    res[`xref-${item.anchor}`] = linkPath;
    linkPages[`xref-${item.anchor}`] = pagePath;

    // Generate original case xref keys
    if (item.__item_context && item.__item_context.contract) {
      let originalAnchor = item.__item_context.contract.name + '-' + item.name;
      if ('parameters' in item) {
        const signature = item.parameters.parameters.map(v => v.typeName.typeDescriptions.typeString).join(',');
        originalAnchor += slug('(' + signature + ')');
      }
      res[`xref-${originalAnchor}`] = linkPath;
      linkPages[`xref-${originalAnchor}`] = pagePath;
    }

    const key = slug(item.fullName);
    res[key] = `[\`${item.fullName}\`](${linkPath})`;
    linkPages[key] = pagePath;
  }

  // Attach page info for same-page preference in findBestMatch
  res.__linkPages = linkPages;
  res.__currentPagePath = currentPagePath;

  if (currentPage) {
    let cache = linksCache.get(items);
    if (!cache) {
      cache = new Map();
      linksCache.set(items, cache);
    }
    cache.set(currentPage, res);
  }

  return res;
}

function generateLinkPath(pagePath, currentPagePath, anchor) {
  // Same page: use fragment-only link
  if (
    currentPagePath &&
    (pagePath === currentPagePath || pagePath.split('/').pop() === currentPagePath.split('/').pop())
  ) {
    return `#${anchor}`;
  }

  // Cross-page: use absolute path with API_DOCS_PATH prefix
  return `/${API_DOCS_PATH}/${pagePath}#${anchor}`;
}

// Process {REF} and other references
function processReferences(content, links) {
  let result = content;

  // Handle {REF:Contract.method} patterns
  result = result.replace(/\{REF:([^}]+)\}/g, (match, refId) => {
    const resolvedRef = resolveReference(refId, links);
    return resolvedRef || match;
  });

  // Handle AsciiDoc-style {xref-...}[text] patterns
  result = result.replace(/\{(xref-[-._a-z0-9]+)\}\[([^\]]*)\]/gi, (match, key, linkText) => {
    const replacement = links[key];
    return replacement ? `[${linkText}](${replacement})` : match;
  });

  // Handle cross-references in format {Contract-function-parameters}
  result = result.replace(
    /\{([A-Z][a-zA-Z0-9]*)-([a-zA-Z_][a-zA-Z0-9]*)-([^-}]+)\}/g,
    (match, contract, func, params) => {
      const commaParams = params
        .replace(/-bytes\[\]/g, ',bytes[]')
        .replace(/-uint[0-9]*/g, ',uint$1')
        .replace(/-address/g, ',address')
        .replace(/-bool/g, ',bool')
        .replace(/-string/g, ',string');
      const slugifiedParams = commaParams.replace(/\W/g, '-');
      const xrefKey = `xref-${contract}-${func}-${slugifiedParams}`;
      const replacement = links[xrefKey];
      if (replacement) {
        return `[\`${contract}.${func}\`](${replacement})`;
      }
      return match;
    },
  );

  // Handle cross-references in format {Contract-function-parameters}
  result = result.replace(
    /\{([A-Z][a-zA-Z0-9]*)-([a-zA-Z_][a-zA-Z0-9]*)-([^}]+)\}/g,
    (match, contract, func, params) => {
      const commaParams = params
        .replace(/-bytes\[\]/g, ',bytes[]')
        .replace(/-uint[0-9]*/g, ',uint$1')
        .replace(/-address/g, ',address')
        .replace(/-bool/g, ',bool')
        .replace(/-string/g, ',string');
      const slugifiedParams = `(${commaParams})`.replace(/\W/g, '-');
      const xrefKey = `xref-${contract}-${func}${slugifiedParams}`;
      const replacement = links[xrefKey];
      if (replacement) {
        return `[\`${contract}.${func}\`](${replacement})`;
      }
      return match;
    },
  );

  // Replace {link-key} placeholders with markdown links
  result = result.replace(/\{([-._a-z0-9]+)\}/gi, (match, key) => {
    const replacement = findBestMatch(key, links);
    return replacement || `\`${key}\``;
  });

  result = cleanupContent(result);

  // Escape bare < that aren't HTML/JSX tags (e.g., "< 0x80", "< 128")
  // Must run after cleanupContent (which decodes &lt; to <) and before processCallouts
  result = result.replace(/(<)(\s+\w)/g, '&lt;$2');

  return result;
}

function resolveReference(refId, links) {
  // Try direct match first
  const directKey = `xref-${refId.replace(/\./g, '-')}`;
  if (links[directKey]) {
    const parts = refId.split('.');
    const displayText = parts.length > 1 ? `${parts[0]}.${parts[1]}` : refId;
    return `[\`${displayText}\`](${links[directKey]})`;
  }

  // Try fuzzy matching
  const matchingKeys = Object.keys(links).filter(key => {
    const normalizedKey = key.replace('xref-', '').toLowerCase();
    const normalizedRef = refId.replace(/\./g, '-').toLowerCase();
    return normalizedKey.includes(normalizedRef) || normalizedRef.includes(normalizedKey);
  });

  if (matchingKeys.length > 0) {
    const bestMatch = matchingKeys[0];
    const parts = refId.split('.');
    const displayText = parts.length > 1 ? `${parts[0]}.${parts[1]}` : refId;
    return `[\`${displayText}\`](${links[bestMatch]})`;
  }

  return null;
}

function findBestMatch(key, links) {
  // Exact match first
  if (links[key]) {
    return links[key];
  }

  const linkPages = links.__linkPages || {};
  const currentPagePath = links.__currentPagePath || '';

  // Match by contract function name (e.g., {transfer} matches ERC20-transfer)
  // Only match if the key is the final segment after the last hyphen
  const matchingKeys = Object.keys(links).filter(linkKey => {
    if (linkKey.startsWith('__')) return false; // skip metadata keys
    const parts = linkKey.split('-');
    return parts.length >= 2 && parts[parts.length - 1] === key;
  });

  if (matchingKeys.length > 0) {
    const nonXrefMatches = matchingKeys.filter(k => !k.startsWith('xref-'));
    const candidates = nonXrefMatches.length > 0 ? nonXrefMatches : matchingKeys;

    // Prefer matches from the same page (e.g., ERC20.name over Governor.name on the ERC20 page)
    if (currentPagePath && candidates.length > 1) {
      const samePageMatch = candidates.find(k => linkPages[k] === currentPagePath);
      if (samePageMatch) {
        return links[samePageMatch];
      }
    }

    return links[candidates[0]];
  }

  return undefined;
}

function cleanupContent(content) {
  const apiDocsBase = '/' + API_DOCS_PATH;
  const docsBase = apiDocsBase.replace(/\/api$/, '');
  return content
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=')
    .replace(/&amp;/g, '&')
    .replace(/\{(\[`[^`]+`\]\([^)]+\))\}/g, '$1')
    .replace(/https?:\/\/[^\s[]+\[[^\]]+\]/g, match => {
      const urlMatch = match.match(/^(https?:\/\/[^[]+)\[([^\]]+)\]$/);
      return urlMatch ? `[${urlMatch[2]}](${urlMatch[1]})` : match;
    })
    // Convert remaining Antora xref patterns in natspec
    // xref:ROOT:filename.adoc#anchor[text] -> [text](docsBase/filename#anchor)
    .replace(/xref:ROOT:([^[]+)\.adoc(?:#([^[]*))?\[([^\]]*)\]/g, (_, file, anchor, text) =>
      `[${text}](${docsBase}/${file}${anchor ? '#' + anchor : ''})`)
    // xref:api:filename.adoc#anchor[text] -> [text](apiDocsBase/filename#anchor)
    .replace(/xref:api:([^[]+)\.adoc(?:#([^[]*))?\[([^\]]*)\]/g, (_, file, anchor, text) =>
      `[${text}](${apiDocsBase}/${file}${anchor ? '#' + anchor : ''})`)
    // xref:module::filename.adoc[text] -> [text](docsBase/module/filename)
    // Modules like "learn" are relative to the product docs base, not site root
    .replace(/xref:([a-z-]+)::([^[]+)\.adoc(?:#([^[]*))?\[([^\]]*)\]/g, (_, mod, file, anchor, text) => {
      // upgrades-plugins is a separate product at site root
      const base = mod === 'upgrades-plugins' ? '' : docsBase;
      return `[${text}](${base}/${mod}/${file}${anchor ? '#' + anchor : ''})`;
    })
    // xref:filename.adoc#anchor[text] -> [text](apiDocsBase/filename#anchor) (bare, within API context)
    .replace(/xref:([^:[\s]+)\.adoc(?:#([^[]*))?\[([^\]]*)\]/g, (_, file, anchor, text) =>
      `[${text}](${apiDocsBase}/${file}${anchor ? '#' + anchor : ''})`)
    // Strip /index from links
    .replace(/\/index([#)])/g, '$1');
}

function processAdocContent(content) {
  try {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adoc-process-'));
    const tempAdocFile = path.join(tempDir, 'temp.adoc');
    const tempMdFile = path.join(tempDir, 'temp.md');

    // Preprocess AsciiDoc content - only handle non-admonition transformations here
    const processedContent = content
      .replace(
        /```solidity\s*\ninclude::api:example\$([^[\]]+)\[\]\s*\n```/g,
        "<include cwd lang='solidity'>./examples/$1</include>",
      )
      .replace(
        /\[source,solidity\]\s*\n----\s*\ninclude::api:example\$([^[\]]+)\[\]\s*\n----/g,
        "<include cwd lang='solidity'>./examples/$1</include>",
      );

    fs.writeFileSync(tempAdocFile, processedContent, 'utf8');

    execSync(`npx downdoc "${tempAdocFile}"`, {
      stdio: 'pipe',
      cwd: process.cwd(),
    });

    let mdContent = fs.readFileSync(tempMdFile, 'utf8');

    // Clean up and transform markdown, then process callouts once at the end
    // Convert Antora xref patterns that downdoc turns into markdown links
    const apiDocsBase = '/' + API_DOCS_PATH;
    const docsBase = apiDocsBase.replace(/\/api$/, '');
    mdContent = cleanupContent(mdContent)
      // api:filename.adoc#anchor -> /contracts/5.x/api/filename#anchor
      .replace(/\(api:([^)]+)\.adoc([^)]*)\)/g, `(${apiDocsBase}/$1$2)`)
      // ROOT:filename.adoc -> docs base (non-API pages like guides)
      .replace(/\(ROOT:([^)]+)\.adoc([^)]*)\)/g, `(${docsBase}/$1$2)`)
      // upgrades-plugins::filename.adoc -> /upgrades-plugins/filename
      .replace(/\(upgrades-plugins::([^)]+)\.adoc([^)]*)\)/g, '(/upgrades-plugins/$1$2)')
      // Strip /index from links (Fumadocs routes index.mdx as the directory root)
      .replace(/\/index([#)])/g, '$1')
      // governance.adoc#anchor -> /contracts/5.x/api/governance#anchor (within API context)
      .replace(/\(([a-z0-9-]+)\.adoc(#[^)]*)\)/g, `(${apiDocsBase}/$1$2)`)
      // Clean up any remaining bare .adoc references
      .replace(/([a-z0-9-]+)\.adoc/g, '$1')
      .replace(/!\[([^\]]*)\]\(([^/)][^)]*\.(png|jpg|jpeg|gif|svg|webp))\)/g, '![$1](/$2)')
      .replace(/^#+\s+.+$/m, '')
      .replace(/^\n+/, '');

    // Process callouts once at the very end
    mdContent = processCallouts(mdContent);

    // Cleanup temp files
    try {
      fs.unlinkSync(tempAdocFile);
      fs.unlinkSync(tempMdFile);
      fs.rmdirSync(tempDir);
    } catch (cleanupError) {
      console.warn('Warning: Could not clean up temp files:', cleanupError.message);
    }

    return mdContent;
  } catch (error) {
    console.warn('Warning: Failed to process AsciiDoc content:', error.message);
    return content;
  }
}

function processCallouts(content) {
  // Convert AsciiDoc headings in natspec (==== heading -> #### heading)
  // Must come BEFORE block delimiter normalization
  let result = content.replace(/^={4}\s+(.+)$/gm, '#### $1');
  result = result.replace(/^={3}\s+(.+)$/gm, '### $1');
  result = result.replace(/^={2}\s+(.+)$/gm, '## $1');

  // Normalize whitespace around block delimiters to make patterns more consistent
  result = result.replace(/\s*\n====\s*\n/g, '\n====\n').replace(/\n====\s*\n/g, '\n====\n');

  // Handle AsciiDoc block admonitions (with ====)
  result = result.replace(/^\[(NOTE|TIP)\]\s*\n====\s*\n([\s\S]*?)\n====$/gm, '<Callout>\n$2\n</Callout>');
  result = result.replace(
    /^\[(IMPORTANT|WARNING|CAUTION)\]\s*\n====\s*\n([\s\S]*?)\n====$/gm,
    '<Callout type="warn">\n$2\n</Callout>',
  );

  // Handle single/multi-line admonitions (NOTE: content until blank line)
  result = result.replace(/^(NOTE|TIP):\s*([\s\S]*?)(?=\n\n|$)/gm, '<Callout>\n$2\n</Callout>');
  result = result.replace(/^(IMPORTANT|WARNING|CAUTION):\s*([\s\S]*?)(?=\n\n|$)/gm, '<Callout type="warn">\n$2\n</Callout>');

  // Handle markdown-style bold admonitions (the ones you're seeing)
  result = result.replace(
    /^\*\*⚠️ WARNING\*\*\\\s*\n([\s\S]*?)(?=\n\n|\n\*\*|$)/gm,
    '<Callout type="warn">\n$1\n</Callout>',
  );
  result = result.replace(
    /^\*\*❗ IMPORTANT\*\*\\\s*\n([\s\S]*?)(?=\n\n|\n\*\*|$)/gm,
    '<Callout type="warn">\n$1\n</Callout>',
  );
  result = result.replace(/^\*\*📌 NOTE\*\*\\\s*\n([\s\S]*?)(?=\n\n|\n\*\*|$)/gm, '<Callout>\n$1\n</Callout>');
  result = result.replace(/^\*\*💡 TIP\*\*\\\s*\n([\s\S]*?)(?=\n\n|\n\*\*|$)/gm, '<Callout>\n$1\n</Callout>');

  // Handle any remaining HTML-style admonitions from downdoc conversion
  result = result.replace(
    /<dl><dt><strong>(?:💡|📌|ℹ️)?\s*(TIP|NOTE|INFO)<\/strong><\/dt><dd>\s*([\s\S]*?)\s*<\/dd><\/dl>/g,
    '<Callout>\n$2\n</Callout>',
  );
  result = result.replace(
    /<dl><dt><strong>(?:⚠️|❗)?\s*(WARNING|IMPORTANT)<\/strong><\/dt><dd>\s*([\s\S]*?)\s*<\/dd><\/dl>/g,
    '<Callout type="warn">\n$2\n</Callout>',
  );

  // Fix prematurely closed callouts - move </Callout> to after all paragraph text
  // This handles cases where </Callout> was inserted after the first line but there's more text
  result = result.replace(/(<Callout[^>]*>\n[^<]+)\n<\/Callout>\n([^<\n]+(?:\n[^<\n]+)*)/g, '$1\n$2\n</Callout>');

  // Clean up "better viewed at" notices (keep these at the end)
  result = result.replace(/^\*\*📌 NOTE\*\*\\\s*\nThis document is better viewed at [^\n]*\n*/gm, '');
  result = result.replace(/^\*\*⚠️ WARNING\*\*\\\s*\nThis document is better viewed at [^\n]*\n*/gm, '');
  result = result.replace(/^\*\*❗ IMPORTANT\*\*\\\s*\nThis document is better viewed at [^\n]*\n*/gm, '');
  result = result.replace(/^\*\*💡 TIP\*\*\\\s*\nThis document is better viewed at [^\n]*\n*/gm, '');

  // More generic cleanup for "better viewed at" notices
  result = result.replace(/This document is better viewed at https:\/\/docs\.openzeppelin\.com[^\n]*\n*/g, '');

  // Remove any resulting callouts that only contain the "better viewed at" message
  result = result.replace(/<Callout[^>]*>\s*This document is better viewed at [^\n]*\s*<\/Callout>\s*/g, '');
  result = result.replace(/<Callout[^>]*>\s*<\/Callout>/g, '');

  // Remove callouts that only contain whitespace/newlines
  result = result.replace(/<Callout[^>]*>\s*\n\s*<\/Callout>/g, '');

  // Remove any remaining standalone ==== block delimiters (orphaned from callout processing)
  result = result.replace(/^====\s*$/gm, '');

  return result;
}

module.exports.title = opts => {
  const pageId = opts.data.root.id;
  const basePath = pageId.replace(/\.(adoc|mdx)$/, '');
  const parts = basePath.split('/');
  const dirName = parts[parts.length - 1] || 'Contracts';
  return dirName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

module.exports.description = opts => {
  const pageId = opts.data.root.id;
  const basePath = pageId.replace(/\.(adoc|mdx)$/, '');
  const parts = basePath.split('/');
  const dirName = parts[parts.length - 1] || 'contracts';
  return `Smart contract ${dirName.replace('-', ' ')} utilities and implementations`;
};

module.exports['with-prelude'] = opts => {
  const currentPage = opts.data.root.id;
  const links = getAllLinks(opts.data.site.items, currentPage);
  const contents = opts.fn();

  const processed = processReferences(contents, links);
  return processCallouts(processed); // Add callout processing here too
};
