import { API_SOURCE_VERSION, COMPACT_COMPILER_VERSION, COMPACT_LANGUAGE_VERSION } from "./constants";

export const REPLACEMENTS = {
  include: ['**/content/contracts-compact/0.1.x/**/*.mdx'],
  replacements: {
    compact_compiler_version: COMPACT_COMPILER_VERSION,
    compact_language_version: COMPACT_LANGUAGE_VERSION,
    api_source_version: API_SOURCE_VERSION
  }
}
