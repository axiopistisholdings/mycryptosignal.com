import type { APIRoute } from 'astro';
import { getNews } from '../lib/api';
import { SITE, canonicalUrl } from '../lib/site';
import { hrefForArticle } from '../lib/render';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Static RSS feed generated at build from the published articles (briefs + digests).
export const GET: APIRoute = async () => {
  const articles = (await getNews(undefined, 50)).slice().sort((a, b) => b.published_at - a.published_at);
  const now = new Date().toUTCString();

  const items = articles
    .map((a) => {
      const link = canonicalUrl(hrefForArticle(a.slug));
      const pub = new Date((a.published_at || 0) * 1000).toUTCString();
      const desc = a.excerpt ?? a.headline;
      return `    <item>
      <title>${escapeXml(a.headline)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pub}</pubDate>
      <category>${escapeXml(a.category ?? 'news')}</category>
      <description>${escapeXml(desc)}</description>
      <source url="${escapeXml(a.source_url)}">${escapeXml(a.source_name)}</source>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE.name)} — News &amp; market briefs</title>
    <link>${escapeXml(canonicalUrl('/news'))}</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${escapeXml(canonicalUrl('/feed.xml'))}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
};

export const prerender = true;
