import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
	reactStrictMode: true,
	experimental: {
		// Reduce memory usage during build
		webpackBuildWorker: true,
		// Generate fewer pages concurrently
		staticWorkerRequestDeduplication: true,
	},
	// Optimize static generation
	staticPageGenerationTimeout: 240,
	generateBuildId: () => "build",
	// Use ISR to reduce build time and memory usage
	output: "standalone",
};

export default withMDX(config);
