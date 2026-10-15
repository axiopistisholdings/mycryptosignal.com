import type { APIRoute } from 'astro';
import { getCoins, getDataBriefs, getNews } from '../lib/api';
import { SEED_COINS } from '../data/seed';
import { canonicalUrl, briefDate } from '../lib/site';

const STATIC_PATHS = [
  '/',
  '/signals',
  '/market',
  '/news',
  '/prices',
  '/api',
  '/docs',
  '/get-access',
  '/about',
  '/contact',
  '/editorial-policy',
  '/tools-and-partners',
  '/sponsors',
  '/disclosure',
  '/terms',
  '/privacy',
  '/disclaimer',
  '/copyright',
];

function urlEntry(path: string, lastmod: string, priority: string, changefreq: string): string {
  return `  <url>
    <loc>${canonicalUrl(path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

// Static XML sitemap generated at build (static pages + signal symbols + articles).
// Only real published URLs are listed — never sample/noindex pages.
export const GET: APIRoute = async () => {
  const today = new Date().toISOString().slice(0, 10);

  const [coins, news, briefs] = await Promise.all([getCoins(), getNews(undefined, 100), getDataBriefs(60)]);
  const coinSymbols = new Set<string>([
    ...coins.map((c) => c.symbol),
    // Only fall back to seed symbols when the API returned nothing at all.
    ...(coins.length ? [] : SEED_COINS.map((c) => c.symbol)),
  ]);

  const digestSlugs = news.filter((a) => !/^market-\d{4}-\d{2}-\d{2}$/.test(a.slug)).map((a) => a.slug);
  const briefDays = briefs.map((b) => briefDate(b.slug)).filter((d): d is string => Boolean(d));

  const entries: string[] = [];
  for (const p of STATIC_PATHS) {
    entries.push(urlEntry(p, today, p === '/' ? '1.0' : '0.7', p === '/news' || p === '/market' ? 'daily' : 'weekly'));
  }
  for (const symbol of coinSymbols) {
    entries.push(urlEntry(`/signals/${symbol.toLowerCase()}`, today, '0.6', 'daily'));
  }
  for (const day of briefDays) {
    entries.push(urlEntry(`/market/${day}`, today, '0.8', 'daily'));
  }
  for (const slug of digestSlugs) {
    entries.push(urlEntry(`/news/${slug}`, today, '0.6', 'weekly'));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};

export const prerender = true;
