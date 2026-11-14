import { parseResumeMarkdown } from "./parserMd";
import { renderResumeHtml } from "./renderHtml";
import { activeResume$ } from "./store";

const MAX_MARKDOWN_CHARS = 80_000;
const PRINT_FRAME_TTL_MS = 120_000;

let printing = false;

export function printActiveResume(): Promise<void> {
	if (printing) return Promise.resolve();

	const markdown = activeResume$.get()?.data ?? "";
	if (markdown.trim() === "") return Promise.resolve();

	if (markdown.length > MAX_MARKDOWN_CHARS) {
		return Promise.reject(new Error("O currículo é grande demais para exportar."));
	}

	const html = renderResumeHtml(parseResumeMarkdown(markdown));
	return openPrintFrame(html);
}

function openPrintFrame(html: string): Promise<void> {
	printing = true;

	return new Promise((resolve, reject) => {
		const iframe = document.createElement("iframe");
		iframe.setAttribute("aria-hidden", "true");
		iframe.tabIndex = -1;
		iframe.style.cssText = "position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;pointer-events:none;";

		let released = false;
		let started = false;
		const release = () => {
			if (released) return;
			released = true;
			printing = false;
			iframe.remove();
		};

		const fail = (message: string) => {
			release();
			reject(new Error(message));
		};

		const loadTimer = window.setTimeout(() => {
			if (!started) fail("Não foi possível abrir a impressão neste navegador.");
		}, 3_000);

		iframe.onload = () => {
			if (started) return;
			const frameWindow = iframe.contentWindow;
			const frameDoc = iframe.contentDocument;
			if (!frameWindow || !frameDoc || frameDoc.body.childElementCount === 0) return;

			started = true;
			window.clearTimeout(loadTimer);
			frameWindow.addEventListener("afterprint", release, { once: true });
			window.setTimeout(release, PRINT_FRAME_TTL_MS);

			try {
				frameWindow.focus();
				frameWindow.print();
				resolve();
			} catch {
				fail("Não foi possível abrir a impressão neste navegador.");
			}
		};

		iframe.srcdoc = html;
		document.body.appendChild(iframe);
	});
}
