import chromium from "@sparticuz/chromium";
import puppeteer, { type Browser } from "puppeteer-core";

let generating = false;

export function isPdfGenerationBusy(): boolean {
	return generating;
}

export async function generatePdfFromHtml(html: string): Promise<Uint8Array> {
	if (generating) {
		throw new Error("BUSY");
	}

	generating = true;
	let browser: Browser | null = null;

	try {
		chromium.setGraphicsMode = false;

		browser = await puppeteer.launch({
			args: chromium.args,
			defaultViewport: {
				deviceScaleFactor: 1,
				hasTouch: false,
				height: 1123,
				isLandscape: false,
				isMobile: false,
				width: 794,
			},
			executablePath: await chromium.executablePath(),
			headless: true,
		});

		const page = await browser.newPage();
		await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 20_000 });
		const pdf = await page.pdf({
			format: "A4",
			printBackground: true,
			preferCSSPageSize: true,
			margin: { top: "0", right: "0", bottom: "0", left: "0" },
		});
		await page.close();
		return pdf;
	} finally {
		if (browser) {
			await browser.close().catch(() => undefined);
		}
		generating = false;
	}
}
