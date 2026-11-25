const path = require('path');
const fs = require('fs');

// Page files that group contracts into API pages. README.mdx is used as-is; README.adoc is converted.
const READMES = ['README.mdx', 'README.adoc'];

/** @type import('solidity-docgen/dist/config').UserConfig */
module.exports = {
  outputDir: 'docs/modules/api/pages',
  templates: 'docs/templates-md',
  exclude: ['mocks'],
  pageExtension: '.mdx',
  pages: (_, file, config) => {
    const sourcesDir = path.resolve(config.root, config.sourcesDir);
    let dir = path.resolve(config.root, file.absolutePath);
    while (dir.startsWith(sourcesDir)) {
      dir = path.dirname(dir);
      if (READMES.some(readme => fs.existsSync(path.join(dir, readme)))) {
        // A README at the sources root documents root-level contracts on the index page
        return (path.relative(sourcesDir, dir) || 'index') + config.pageExtension;
      }
    }
  },
};
