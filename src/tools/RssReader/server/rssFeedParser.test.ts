import { describe, expect, it } from "vitest";
import { parseFeedXml } from "./rssFeedParser";

const SAMPLE_RSS = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Canal de Teste</title>
    <description>Descricao do canal</description>
    <item>
      <title>Primeiro post</title>
      <link>https://example.com/primeiro</link>
      <description>Resumo curto do primeiro post</description>
      <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Segundo post</title>
      <link>https://example.com/segundo</link>
      <description><![CDATA[<p>Com <b>HTML</b></p>]]></description>
      <pubDate>Tue, 02 Jan 2024 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

describe("parseFeedXml", () => {
	it("extrai titulo, descricao e artigos", () => {
		const parsed = parseFeedXml(SAMPLE_RSS);

		expect(parsed.title).toBe("Canal de Teste");
		expect(parsed.description).toBe("Descricao do canal");
		expect(parsed.articles).toHaveLength(2);
		expect(parsed.articles[0]?.title).toBe("Segundo post");
		expect(parsed.articles[0]?.summary).toContain("Com HTML");
		expect(parsed.articles[0]?.summary).not.toContain("<b>");
		expect(parsed.articles[1]?.link).toBe("https://example.com/primeiro");
	});

	it("retorna artigos vazios para xml sem items", () => {
		const parsed = parseFeedXml("<not-a-feed/>");
		expect(parsed.title).toBe("Feed RSS");
		expect(parsed.articles).toEqual([]);
	});
});
