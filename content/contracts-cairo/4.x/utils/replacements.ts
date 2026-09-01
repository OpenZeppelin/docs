import {
	API_SOURCE_VERSION,
	CLASS_HASH_SCARB_VERSION,
	CLASS_HASHES,
	OPENZEPPELIN_INTERFACES_VERSION,
	OPENZEPPELIN_TESTING_VERSION,
	OPENZEPPELIN_UTILS_VERSION,
	UMBRELLA_VERSION,
} from "./constants";

export const REPLACEMENTS = {
	include: ["**/content/contracts-cairo/4.x/**/*.mdx"],
	replacements: {
		umbrella_version: UMBRELLA_VERSION,
		api_source_version: API_SOURCE_VERSION,
		openzeppelin_interfaces_version: OPENZEPPELIN_INTERFACES_VERSION,
		openzeppelin_utils_version: OPENZEPPELIN_UTILS_VERSION,
		openzeppelin_testing_version: OPENZEPPELIN_TESTING_VERSION,
		class_hash_scarb_version: CLASS_HASH_SCARB_VERSION,
		...CLASS_HASHES,
	},
};
