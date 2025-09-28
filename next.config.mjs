import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
	reactStrictMode: true,
	output: "export",
	images: { unoptimized: true },
	experimental: { turbopackScopeHoisting: false },
};

export default withMDX(config);
