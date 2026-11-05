import * as cheerio from 'cheerio';
import {
  GameCardItem,
  PopularGameItem,
  ScrapeListResult,
  ContentSection,
  GameDetailResult,
  DownloadMirror,
  DownloadPackage,
  ScrapedDownloadPageResult,
} from '../types.ts';

export const GENRE_CATEGORIES = [
  { name: 'Semua Genre', slug: '' },
  { name: 'Action', slug: 'action' },
  { name: 'Adventure', slug: 'adventure' },
  { name: 'Role-Playing', slug: 'role-playing' },
  { name: 'Simulation', slug: 'simulation' },
  { name: 'RPG', slug: 'rpg' },
  { name: 'Strategy', slug: 'strategy' },
  { name: 'Platformer', slug: 'platformer' },
  { name: 'Arcade', slug: 'arcade' },
  { name: 'Puzzle', slug: 'puzzle' },
  { name: 'Fighting', slug: 'fighting' },
  { name: 'Role-Playing Game', slug: 'role-playing-game' },
];

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function fetchHtml(targetUrl: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch ${targetUrl}: HTTP ${res.status} ${res.statusText}`);
    }

    const html = await res.text();
    return html;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function extractSlugFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || 'game';
  } catch {
    return url.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
  }
}

export function cleanGameTitle(rawTitle: string): string {
  return rawTitle
    .replace(/^Download\s+/i, '')
    .replace(/\s+Switch\s+(NSP|XCI|Homebrew Port|NSP\/XCI).*/i, '')
    .replace(/\s+Switch\s*$/i, '')
    .trim();
}

/**
 * Scrape the destination download website (e.g. dlarchive.my.id)
 * Extracts all mirror links (Fast Drive, Terabox, Filedon, Rush, Parted links, etc.)
 */
export async function scrapeDownloadPage(downloadPageUrl: string): Promise<ScrapedDownloadPageResult> {
  const targetUrl = downloadPageUrl.trim();
  const html = await fetchHtml(targetUrl);
  const $ = cheerio.load(html);

  const postTitle =
    $('h1.entry-title').text().trim() ||
    $('h1').first().text().trim() ||
    $('title').text().trim();

  const packages: DownloadPackage[] = [];
  let totalMirrors = 0;

  // 1. Parse standard dlarchive .roms-card sections
  $('.roms-card').each((_, cardEl) => {
    const cardTitle = $(cardEl).find('.roms-head .ttl').text().trim() || 'Download';

    // 1a. Single downloads (.roms-sub followed by .roms-grid)
    $(cardEl).find('.roms-sub').each((_, subEl) => {
      const packageTitle = $(subEl).text().trim();
      const grid = $(subEl).next('.roms-grid');
      const mirrors: DownloadMirror[] = [];

      grid.find('a.roms-btn').each((_, btnEl) => {
        const server = $(btnEl).text().trim() || 'Mirror';
        const link = $(btnEl).attr('href') || '';
        const isDirect = link !== '#' && link.startsWith('http');

        mirrors.push({
          server,
          url: link,
          isDirect,
        });
        totalMirrors++;
      });

      // Detect file size from packageTitle, e.g. "Base NSP : (5.1GB)"
      const sizeMatch = packageTitle.match(/\(([^)]+)\)/);
      const fileSize = sizeMatch ? sizeMatch[1] : undefined;

      let fileType = 'other';
      const lowerTitle = packageTitle.toLowerCase();
      if (lowerTitle.includes('base')) fileType = 'base';
      else if (lowerTitle.includes('update')) fileType = 'update';
      else if (lowerTitle.includes('dlc')) fileType = 'dlc';

      packages.push({
        cardTitle,
        packageTitle,
        fileType,
        fileSize,
        mirrors,
      });
    });

    // 1b. Parted downloads (.roms-pills)
    $(cardEl).find('.roms-pills').each((_, pillsEl) => {
      const provider = $(pillsEl).prev('div').text().trim() || 'Parted Cloud Host';
      const mirrors: DownloadMirror[] = [];

      $(pillsEl).find('a.roms-pill').each((_, pillEl) => {
        const part = $(pillEl).text().trim();
        const link = $(pillEl).attr('href') || '';
        const isDirect = link.startsWith('http');

        mirrors.push({
          server: provider,
          part,
          url: link,
          isDirect,
        });
        totalMirrors++;
      });

      packages.push({
        cardTitle,
        packageTitle: `${provider} (Parted Files)`,
        fileType: 'part',
        mirrors,
      });
    });
  });

  // 2. Generic Fallback: If no .roms-card found, look for general download buttons/links
  if (packages.length === 0) {
    const fallbackMirrors: DownloadMirror[] = [];
    $(
      'a[href*="drive.dlarchive"], a[href*="terabox"], a[href*="mediafire"], a[href*="mega.nz"], a[href*="filedon"], a[href*="pastekuy"], a.roms-btn, a.btn-download'
    ).each((_, a) => {
      const server = $(a).text().trim() || 'Direct Link';
      const link = $(a).attr('href') || '';
      if (link && link !== '#' && !fallbackMirrors.some((m) => m.url === link)) {
        fallbackMirrors.push({
          server,
          url: link,
          isDirect: link.startsWith('http'),
        });
        totalMirrors++;
      }
    });

    if (fallbackMirrors.length > 0) {
      packages.push({
        cardTitle: 'Download Links',
        packageTitle: 'Semua Tautan Unduhan',
        fileType: 'base',
        mirrors: fallbackMirrors,
      });
    }
  }

  return {
    downloadPageUrl: targetUrl,
    postTitle,
    packages,
    totalMirrorsFound: totalMirrors,
    scrapedAt: new Date().toISOString(),
  };
}

export async function scrapeGameList(options: {
  page?: number;
  search?: string;
  category?: string;
}): Promise<ScrapeListResult> {
  const page = Math.max(1, options.page || 1);
  const search = (options.search || '').trim();
  const category = (options.category || '').trim();

  let targetUrl = 'https://romsns.com/';

  if (search) {
    if (page > 1) {
      targetUrl = `https://romsns.com/page/${page}/?s=${encodeURIComponent(search)}`;
    } else {
      targetUrl = `https://romsns.com/?s=${encodeURIComponent(search)}`;
    }
  } else if (category) {
    if (page > 1) {
      targetUrl = `https://romsns.com/${category}/page/${page}/`;
    } else {
      targetUrl = `https://romsns.com/${category}/`;
    }
  } else if (page > 1) {
    targetUrl = `https://romsns.com/page/${page}/`;
  }

  const html = await fetchHtml(targetUrl);
  const $ = cheerio.load(html);

  // 1. Scrape main game grid
  const games: GameCardItem[] = [];
  $('.rgc-grid .rgc-item, .rgc-grid > a.rgc-card').each((_, el) => {
    const card = $(el).is('a.rgc-card') ? $(el) : $(el).find('a.rgc-card');
    const href = card.attr('href') || '';
    const title = card.find('.rgc-title-in').text().trim();
    if (!title || !href) return;

    let img = card.find('img').attr('src') || '';
    const srcset = card.find('img').attr('srcset');
    if (srcset) {
      const parts = srcset.split(',').map((s) => s.trim());
      const last = parts[parts.length - 1];
      if (last) {
        const candidate = last.split(' ')[0];
        if (candidate) img = candidate;
      }
    }

    const fileSize = card.find('.rgc-badge-size').text().trim() || 'N/A';
    const downloads =
      card.find('.rgc-download-number').text().trim() ||
      card.find('.rgc-badge-download').attr('data-rgc-download-count') ||
      '0';

    const formats: string[] = [];
    card.find('.rgc-format-pill').each((_, pill) => {
      const text = $(pill).text().trim();
      if (text) formats.push(text);
    });

    games.push({
      id: extractSlugFromUrl(href),
      title,
      url: href,
      coverImage: img,
      fileSize,
      downloads,
      formats: formats.length > 0 ? formats : ['.NSP'],
    });
  });

  // 2. Scrape popular games
  const popular: PopularGameItem[] = [];
  $('.rpc-popular-card').each((_, el) => {
    const card = $(el).find('a.rpc-card');
    const href = card.attr('href') || '';
    const title = card.find('.rpc-title').text().trim();
    if (!title) return;

    const img = card.find('img').attr('src') || '';
    const rating = card.find('.rpc-rating-badge').text().trim();
    const format = card.find('.rpc-format-badge').text().trim() || '.NSP';
    const fileSize = card.find('.rpc-badge-size').text().trim() || 'N/A';
    const downloads = card.find('.rpc-badge-download span').text().trim() || '0';

    popular.push({
      id: extractSlugFromUrl(href),
      title,
      url: href,
      coverImage: img,
      rating,
      format,
      fileSize,
      downloads,
    });
  });

  // 3. Scrape pagination numbers
  let totalPages = page;
  $('.rgc-pagination .page-numbers, .pagination .page-numbers').each((_, el) => {
    const text = $(el).text().trim();
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > totalPages) {
      totalPages = num;
    }
  });

  return {
    sourceUrl: targetUrl,
    query: search || undefined,
    category: category || undefined,
    page,
    totalPages: Math.max(totalPages, page),
    totalGamesOnPage: games.length,
    games,
    popular,
    categories: GENRE_CATEGORIES,
    scrapedAt: new Date().toISOString(),
  };
}

export async function scrapeGameDetail(
  url: string,
  options?: { scrapeDownloadPageMirrors?: boolean }
): Promise<GameDetailResult> {
  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http')) {
    targetUrl = `https://romsns.com/${targetUrl.replace(/^\//, '')}/`;
  }

  const html = await fetchHtml(targetUrl);
  const $ = cheerio.load(html);

  const rawTitle = $('h1').first().text().trim() || $('title').text().trim();
  const cleanTitle = cleanGameTitle(rawTitle);

  let coverImage = $('meta[property="og:image"]').attr('content') || '';
  if (!coverImage) {
    coverImage = $('.idb-card-body img, .entry-content img, .gb-container img, .wp-block-image img')
      .first()
      .attr('src') || '';
  }

  // Info table parsing (.idb-table)
  const tableInfo: Record<string, string> = {};
  $('.idb-table tr').each((_, tr) => {
    const key = $(tr).find('th').text().trim().toLowerCase();
    const val = $(tr).find('td').text().trim();
    if (key && val) {
      tableInfo[key] = val;
    }
  });

  const rawTableHtml = $('.idb-table').html() || undefined;

  // Download destination link (dlarchive)
  const downloadLink = $('.idb-btns a.idb-btn, a[data-idb-download-post]').attr('href') || '';
  const downloadCount =
    $('.idb-download-count strong').text().trim() ||
    $('.idb-download-count').text().replace(/Downloads:\s*/i, '').trim() ||
    '0';

  // Extract content sections (.ams-content h2, h3)
  const sections: ContentSection[] = [];
  let storyline: string | undefined;
  let gameplay: string | undefined;
  const features: string[] = [];
  const tips: string[] = [];
  let conclusion: string | undefined;

  $('.ams-content h2, .ams-content h3').each((_, el) => {
    const heading = $(el).text().trim();
    let text = '';
    const listItems: string[] = [];

    let next = $(el).next();
    while (next.length && !next.is('h2, h3, h4, style, section')) {
      if (next.is('p')) {
        const pText = next.text().trim();
        if (pText) {
          text += (text ? '\n\n' : '') + pText;
        }
      } else if (next.is('ul, ol')) {
        next.find('li').each((_, li) => {
          const itemText = $(li).text().trim();
          if (itemText) listItems.push(itemText);
        });
      }
      next = next.next();
    }

    const lowerHeading = heading.toLowerCase();
    if (lowerHeading.includes('storyline') || lowerHeading.includes('story') || lowerHeading.includes('plot')) {
      storyline = text;
    } else if (lowerHeading.includes('tips')) {
      if (listItems.length > 0) tips.push(...listItems);
    } else if (lowerHeading.includes('gameplay') || lowerHeading.includes('features')) {
      gameplay = text;
      if (listItems.length > 0) features.push(...listItems);
    } else if (lowerHeading.includes('conclusion')) {
      conclusion = text;
    }

    sections.push({
      heading,
      text,
      listItems: listItems.length > 0 ? listItems : undefined,
    });
  });

  // Recommended / related games
  const recommendedGames: { title: string; url: string }[] = [];
  $('ul li a[href*="romsns.com"]').each((_, a) => {
    const title = $(a).text().trim();
    const href = $(a).attr('href') || '';
    if (
      title &&
      href &&
      href !== targetUrl &&
      !href.includes('/category/') &&
      !href.includes('/how-to-download') &&
      !recommendedGames.some((r) => r.url === href)
    ) {
      recommendedGames.push({ title, url: href });
    }
  });

  // Scrape the download destination website as well (defaults to true)
  let downloadPageData: ScrapedDownloadPageResult | null = null;
  const shouldScrapeDownloadPage =
    options?.scrapeDownloadPageMirrors !== false && Boolean(downloadLink && downloadLink.startsWith('http'));

  if (shouldScrapeDownloadPage) {
    try {
      downloadPageData = await scrapeDownloadPage(downloadLink);
    } catch (err: any) {
      console.warn(`Could not scrape download mirror site (${downloadLink}):`, err.message);
    }
  }

  return {
    id: extractSlugFromUrl(targetUrl),
    url: targetUrl,
    title: rawTitle,
    cleanTitle: cleanTitle || rawTitle,
    coverImage,
    tableInfo: {
      size: tableInfo['size'],
      available: tableInfo['available'],
      region: tableInfo['region'],
      ...tableInfo,
    },
    downloadLink,
    downloadCount,
    downloadPageData,
    storyline,
    gameplay,
    features,
    tips,
    conclusion,
    sections,
    recommendedGames: recommendedGames.slice(0, 8),
    rawTableHtml,
    scrapedAt: new Date().toISOString(),
  };
}

export async function scrapeCustomSelector(url: string, selector: string, attribute?: string) {
  const targetUrl = url.trim() || 'https://romsns.com/';
  const html = await fetchHtml(targetUrl);
  const $ = cheerio.load(html);

  const matched = $(selector);
  const results: { index: number; text: string; attributeValue?: string; htmlSnippet: string }[] = [];

  matched.each((index, el) => {
    if (index >= 30) return;
    const text = $(el).text().trim();
    const attributeValue = attribute ? $(el).attr(attribute) : undefined;
    const outerHtml = $.html(el);
    const htmlSnippet = outerHtml.length > 300 ? outerHtml.substring(0, 300) + '...' : outerHtml;

    results.push({
      index: index + 1,
      text,
      attributeValue,
      htmlSnippet,
    });
  });

  return {
    url: targetUrl,
    selector,
    attribute: attribute || null,
    totalMatched: matched.length,
    results,
    pageTitle: $('title').text().trim(),
    scrapedAt: new Date().toISOString(),
  };
}
