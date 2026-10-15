import type { APIRoute } from 'astro';
import { getNews } from '../lib/api';
import { SITE, canonicalUrl } from '../lib/site';
import { hrefForArticle } from '../lib/render';
import { isNewsSitemapExcluded } from '../lib/partners';

// Google News sitemap — ONLY articles published in the last 2 days, in the
// `news:` namespace with the required publication/date/title children.
// https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  const cutoff = Date.now() - TWO_DAYS_MS;
  const articles = await getNews(undefined, 100);

  const recent = articles
    .filter((a) => (a.published_at || 0) * 1000 >= cutoff)
    // Defensive: monetized/legal pages must never enter the news sitemap.
    .filter((a) => !isNewsSitemapExcluded(hrefForArticle(a.slug)))
    .sort((a, b) => b.published_at - a.published_at);

  const entries = recent
    .map((a) => {
      const loc = canonicalUrl(hrefForArticle(a.slug));
      const pubDate = new Date((a.published_at || 0) * 1000).toISOString();
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(SITE.name)}</news:name>
        <news:language>${SITE.language}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(a.headline)}</news:title>
    </news:news>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries}
</urlset>
`;

  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};

export const prerender = true;
