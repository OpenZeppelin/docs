interface OZWizardProps {
	tab?: string;
	lang?: string;
	version?: string;
}

export default function OZWizard({ tab, lang, version }: OZWizardProps) {
	return (
		<div
			dangerouslySetInnerHTML={{
				__html: `
				<script async src="https://wizard.openzeppelin.com/build/embed.js"></script>
				<oz-wizard
					style="display: 'block'; min-height: '40rem'"
					${tab && `data-tab=${tab}`}
					${lang && `data-lang=${lang}`}
					${version && `version=${version}`}
				/>
      `,
			}}
		/>
	);
}
