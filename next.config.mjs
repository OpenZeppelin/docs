import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
	reactStrictMode: true,
	experimental: {
		// Reduce memory usage during build
		webpackBuildWorker: true,
	},
	// Optimize static generation
	staticPageGenerationTimeout: 240,
	generateBuildId: () => "build",
};

export default withMDX(config);
