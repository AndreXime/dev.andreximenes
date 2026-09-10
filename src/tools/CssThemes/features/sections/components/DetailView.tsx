import { useEffect, useRef, useState } from "react";
import { Button } from "../../../components/ui/Button";
import type { SectionVariation } from "../../../sections/catalog";

export function DetailView({ variation }: { variation: SectionVariation }) {
	const previewRef = useRef<HTMLDivElement>(null);
	const [copied, setCopied] = useState(false);
	const Component = variation.component;

	async function copyHtml() {
		const html = previewRef.current?.innerHTML;
		if (!html) return;

		await navigator.clipboard.writeText(html);
		setCopied(true);
	}

	useEffect(() => {
		if (!copied) return;

		const timeoutId = window.setTimeout(() => setCopied(false), 2000);
		return () => window.clearTimeout(timeoutId);
	}, [copied]);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex justify-end">
				<Button variant="outline" size="sm" onClick={() => void copyHtml()}>
					{copied ? "HTML copiado" : "Copiar HTML"}
				</Button>
			</div>
			<div ref={previewRef} className="-mx-5 overflow-hidden rounded-ct-lg border border-ct-border sm:mx-0">
				<Component />
			</div>
		</div>
	);
}
