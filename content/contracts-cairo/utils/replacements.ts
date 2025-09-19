import { OPENZEPPELIN_INTERFACES_VERSION, OPENZEPPELIN_UTILS_VERSION, UMBRELLA_VERSION } from "./constants";

export const REPLACEMENTS = {
  include: ['**/content/contracts-cairo/**/*.mdx'],
  replacements: {
    umbrella_version: UMBRELLA_VERSION,
    openzeppelin_interfaces_version: OPENZEPPELIN_INTERFACES_VERSION,
    openzeppelin_utils_version: OPENZEPPELIN_UTILS_VERSION,
  }
}
