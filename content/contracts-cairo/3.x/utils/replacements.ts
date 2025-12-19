import { CLASS_HASHES, CLASS_HASH_SCARB_VERSION, UMBRELLA_VERSION } from "./constants";

export const REPLACEMENTS = {
  include: ['**/content/contracts-cairo/3.x/**/*.mdx'],
  replacements: {
    umbrella_version: UMBRELLA_VERSION,
    class_hash_scarb_version: CLASS_HASH_SCARB_VERSION,
    ...CLASS_HASHES,
  }
}
