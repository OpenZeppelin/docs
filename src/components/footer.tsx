import Link from "next/link";

export function Footer() {
	return (
		<footer className="mt-auto bg-card border-t">
			<div
				style={{ maxWidth: "1300px", height: "400px" }}
				className="mx-auto px-4 sm:px-6 py-12 sm:py-16"
			>
				<div className="flex lg:flex-row flex-col gap-12 items-start w-full justify-between">
					{/* Company Info */}
					<div className="flex flex-col gap-24">
						<div className="mb-6">
							<svg
								width="24"
								height="28.35"
								viewBox="0 0 127 150"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<title>Logo</title>
								<path
									d="M0 148.638C16.5023 120.086 30.5249 96.5383 48.3477 64.265C54.6433 53.3745 65.5217 46.6074 78.951 46.6074H100.052L41.1242 148.638H0Z"
									fill="#2E99FF"
								/>
								<path
									d="M0.186768 0H126.804L105.17 37.7215H0.186768V0Z"
									fill="#4F56FA"
								/>
								<path
									d="M63.6089 125.145C68.3703 116.728 76.0241 111.499 86.7442 111.499L126.827 111.389V148.641H50.0247C54.8332 140.394 59.0086 133.278 63.6089 125.145Z"
									fill="#09C2FF"
								/>
							</svg>
						</div>
						<div className="space-y-2 text-xs font-light">
							<div className="flex space-x-4 mb-6">
								<a
									href="https://github.com/OpenZeppelin"
									className="text-muted-foreground hover:text-foreground transition-colors"
									aria-label="GitHub"
								>
									<svg
										className="w-5 h-5"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<title>GitHub</title>
										<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
									</svg>
								</a>
								<a
									href="https://twitter.com/OpenZeppelin"
									className="text-muted-foreground hover:text-foreground transition-colors"
									aria-label="Twitter"
								>
									<svg
										className="w-5 h-5"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<title>Twitter</title>
										<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
									</svg>
								</a>
								<a
									href="https://www.linkedin.com/company/openzeppelin/"
									className="text-muted-foreground hover:text-foreground transition-colors"
									aria-label="LinkedIn"
								>
									<svg
										className="w-5 h-5"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<title>LinkedIn</title>
										<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
									</svg>
								</a>
							</div>
							<p className="text-muted-foreground">© 2025 Zeppelin Group Ltd</p>
							<div className="flex flex-col gap-1 text-muted-foreground">
								<Link
									href="https://openzeppelin.com/terms-of-service"
									className="hover:text-foreground transition-colors"
								>
									Terms of Service
								</Link>
								<Link
									href="https://openzeppelin.com/privacy-policy"
									className="hover:text-foreground transition-colors"
								>
									Privacy Policy
								</Link>
								<Link
									href="https://openzeppelin.com/trademark-guidelines"
									className="hover:text-foreground transition-colors"
								>
									Trademark Guidelines
								</Link>
								<Link
									href="https://openzeppelin.com/agpl-license"
									className="hover:text-foreground transition-colors"
								>
									AGPL License
								</Link>
							</div>
						</div>
					</div>

					{/* Products */}
					<div className="text-sm">
						<h3 className="font-medium text-foreground mb-4">Products</h3>
						<div className="space-y-3">
							<Link
								href="/contracts"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Contracts Library
							</Link>
							<Link
								href="/wizard"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Contracts Wizard
							</Link>
							<Link
								href="/upgrade-plugins"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Upgrade Plugins
							</Link>
							<Link
								href="https://mcp.openzeppelin.com"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Contracts MCP
							</Link>
							<Link
								href="/contracts-ui-builder"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Contracts UI Builder
							</Link>
							<Link
								href="/openzeppelin-relayer"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Relayer
							</Link>
							<Link
								href="/openzeppelin-monitor"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Monitor
							</Link>
							<Link
								href="/defender"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Defender
							</Link>
						</div>
					</div>

					{/* Services */}
					<div className="text-sm">
						<h3 className="font-medium text-foreground mb-4">Services</h3>
						<div className="space-y-3">
							<Link
								href="https://openzeppelin.com/security-audits"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Smart Contract Security Audit
							</Link>
							<Link
								href="https://openzeppelin.com/blockchain-infrastructure-audits"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Blockchain Infrastructure Audit
							</Link>
							<Link
								href="https://openzeppelin.com/zkp-practice"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								ZKP Practice
							</Link>
						</div>
					</div>

					{/* Solutions */}
					<div className="text-sm">
						<h3 className="font-medium text-foreground mb-4">Solutions</h3>
						<div className="space-y-3">
							<Link
								href="https://openzeppelin.com/ecosystem-stack"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Ecosystem Stack
							</Link>
							<Link
								href="https://openzeppelin.com/financial-institutions-stack"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Financial Institutions Stack
							</Link>
						</div>
					</div>

					{/* Resources */}
					<div className="text-sm">
						<h3 className="font-medium text-foreground mb-4">Resources</h3>
						<div className="space-y-3">
							<Link
								href="/"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Documentation
							</Link>
							<Link
								href="https://blog.openzeppelin.com"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Blog
							</Link>
							<Link
								href="https://forum.openzeppelin.com"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Forum
							</Link>
							<Link
								href="https://ethernaut.openzeppelin.com"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Ethernaut CTF
							</Link>
						</div>
					</div>

					{/* Company */}
					<div className="text-sm">
						<h3 className="font-medium text-foreground mb-4">Company</h3>
						<div className="space-y-3">
							<Link
								href="https://openzeppelin.com/about"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								About us
							</Link>
							<Link
								href="https://openzeppelin.com/careers"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Careers
							</Link>
							<Link
								href="https://openzeppelin.com/brand-kit"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Brand Kit
							</Link>
							<Link
								href="https://openzeppelin.com/trust"
								className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Trust
							</Link>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
