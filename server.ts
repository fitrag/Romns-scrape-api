import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  scrapeGameList,
  scrapeGameDetail,
  scrapeDownloadPage,
  scrapeCustomSelector,
  GENRE_CATEGORIES,
} from './src/services/cheerioScraper.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-Memory Cache (3 minutes TTL) to keep API fast and avoid hammering romsns.com
const cache = new Map<string, { data: any; expiry: number }>();
function getCached(key: string) {
  const item = cache.get(key);
  if (item && item.expiry > Date.now()) return item.data;
  if (item) cache.delete(key);
  return null;
}
function setCache(key: string, data: any, ttlMs = 180000) {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // JSON Body Parser
  app.use(express.json());

  // CORS Middleware for external consumers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // ==========================================
  // REST API v1 ENDPOINTS
  // ==========================================

  // 1. GET /api/v1/games (List, Search, Filter & Pagination)
  app.get('/api/v1/games', async (req, res) => {
    const startTime = Date.now();
    try {
      const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10)) : 1;
      const search = ((req.query.search || req.query.q || '') as string).trim();
      const category = ((req.query.category || req.query.genre || '') as string).trim();

      const cacheKey = `list:${page}:${search}:${category}`;
      let data = getCached(cacheKey);
      let isCached = true;

      if (!data) {
        isCached = false;
        data = await scrapeGameList({ page, search, category });
        setCache(cacheKey, data, 180000); // 3 minutes cache
      }

      const totalPages = data.totalPages;
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const buildUrl = (p: number) => {
        const q = new URLSearchParams();
        if (p > 1) q.set('page', String(p));
        if (search) q.set('search', search);
        if (category) q.set('category', category);
        const str = q.toString();
        return `/api/v1/games${str ? `?${str}` : ''}`;
      };

      res.json({
        status: 'success',
        statusCode: 200,
        data: {
          pagination: {
            currentPage: page,
            totalPages,
            totalOnPage: data.games.length,
            hasNextPage: hasNext,
            hasPrevPage: hasPrev,
            nextPageUrl: hasNext ? buildUrl(page + 1) : null,
            prevPageUrl: hasPrev ? buildUrl(page - 1) : null,
          },
          filter: {
            search: search || null,
            category: category || null,
          },
          games: data.games,
        },
        meta: {
          cached: isCached,
          responseTimeMs: Date.now() - startTime,
          scrapedFrom: data.sourceUrl,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('API /api/v1/games error:', error);
      res.status(500).json({
        status: 'error',
        statusCode: 500,
        error: error.message || 'Gagal mengambil data dari romsns.com',
      });
    }
  });

  // 2. GET /api/v1/games/popular (Trending ROMs)
  app.get('/api/v1/games/popular', async (_req, res) => {
    const startTime = Date.now();
    try {
      const cacheKey = 'popular:list';
      let popular = getCached(cacheKey);
      let isCached = true;

      if (!popular) {
        isCached = false;
        const data = await scrapeGameList({ page: 1 });
        popular = data.popular;
        setCache(cacheKey, popular, 300000);
      }

      res.json({
        status: 'success',
        statusCode: 200,
        data: {
          total: popular.length,
          popular,
        },
        meta: {
          cached: isCached,
          responseTimeMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        statusCode: 500,
        error: error.message || 'Gagal mengambil game populer',
      });
    }
  });

  // 3. GET /api/v1/games/categories
  app.get('/api/v1/games/categories', (_req, res) => {
    res.json({
      status: 'success',
      statusCode: 200,
      data: {
        total: GENRE_CATEGORIES.length,
        categories: GENRE_CATEGORIES,
      },
    });
  });

  // 4. GET /api/v1/games/:id (Single game detail with scraped download page)
  app.get('/api/v1/games/:id', async (req, res) => {
    const startTime = Date.now();
    try {
      const idOrSlug = req.params.id;
      if (!idOrSlug) {
        return res.status(400).json({
          status: 'error',
          statusCode: 400,
          error: 'Parameter ID atau slug game wajib diisi',
        });
      }

      const cacheKey = `detail:${idOrSlug}`;
      let detail = getCached(cacheKey);
      let isCached = true;

      if (!detail) {
        isCached = false;
        detail = await scrapeGameDetail(idOrSlug, { scrapeDownloadPageMirrors: true });
        setCache(cacheKey, detail, 600000); // 10 minutes cache
      }

      res.json({
        status: 'success',
        statusCode: 200,
        data: detail,
        meta: {
          cached: isCached,
          responseTimeMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('API /api/v1/games/:id error:', error);
      res.status(500).json({
        status: 'error',
        statusCode: 500,
        error: error.message || 'Gagal mengambil detail game',
      });
    }
  });

  // 5. GET /api/v1/games/:id/mirrors (Scrapes and returns cloud download mirrors from dlarchive)
  app.get('/api/v1/games/:id/mirrors', async (req, res) => {
    const startTime = Date.now();
    try {
      const idOrSlug = req.params.id;
      const detail = await scrapeGameDetail(idOrSlug, { scrapeDownloadPageMirrors: true });

      if (!detail.downloadLink) {
        return res.status(404).json({
          status: 'error',
          statusCode: 404,
          error: 'Game ini tidak memiliki tautan halaman unduh',
        });
      }

      let mirrorsData = detail.downloadPageData;
      if (!mirrorsData && detail.downloadLink) {
        mirrorsData = await scrapeDownloadPage(detail.downloadLink);
      }

      res.json({
        status: 'success',
        statusCode: 200,
        data: {
          gameId: detail.id,
          gameTitle: detail.title,
          cleanTitle: detail.cleanTitle,
          downloadPageUrl: detail.downloadLink,
          fileSize: detail.tableInfo.size || 'N/A',
          region: detail.tableInfo.region || 'N/A',
          downloadMirrors: mirrorsData,
        },
        meta: {
          responseTimeMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('API /api/v1/games/:id/mirrors error:', error);
      res.status(500).json({
        status: 'error',
        statusCode: 500,
        error: error.message || 'Gagal mengambil mirror unduhan',
      });
    }
  });

  // 6. GET /api/v1/games/:id/download (Quick download info endpoint)
  app.get('/api/v1/games/:id/download', async (req, res) => {
    try {
      const idOrSlug = req.params.id;
      const detail = await scrapeGameDetail(idOrSlug, { scrapeDownloadPageMirrors: false });

      res.json({
        status: 'success',
        statusCode: 200,
        data: {
          id: detail.id,
          title: detail.title,
          cleanTitle: detail.cleanTitle,
          downloadLink: detail.downloadLink,
          fileSize: detail.tableInfo.size || 'N/A',
          region: detail.tableInfo.region || 'N/A',
          availablePackages: detail.tableInfo.available || 'N/A',
          downloadCount: detail.downloadCount,
          sourceUrl: detail.url,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        statusCode: 500,
        error: error.message || 'Gagal mengambil link download game',
      });
    }
  });

  // 7. GET /api/v1/scrape/download-page (Directly scrape any dlarchive download page)
  app.get('/api/v1/scrape/download-page', async (req, res) => {
    const startTime = Date.now();
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({
          status: 'error',
          statusCode: 400,
          error: 'Parameter "url" (link dlarchive) wajib diisi',
        });
      }

      const result = await scrapeDownloadPage(url);
      res.json({
        status: 'success',
        statusCode: 200,
        data: result,
        meta: {
          responseTimeMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        statusCode: 500,
        error: error.message || 'Gagal mem-parsing halaman download',
      });
    }
  });

  // 8. POST /api/v1/scrape/selector (Live Cheerio Selector Executor)
  app.post('/api/v1/scrape/selector', async (req, res) => {
    const startTime = Date.now();
    try {
      const { url, selector, attribute } = req.body;
      if (!selector) {
        return res.status(400).json({
          status: 'error',
          statusCode: 400,
          error: 'Parameter "selector" wajib diisi (contoh: ".rgc-title-in")',
        });
      }

      const result = await scrapeCustomSelector(url || 'https://romsns.com/', selector, attribute);
      res.json({
        status: 'success',
        statusCode: 200,
        data: result,
        meta: {
          responseTimeMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('API /api/v1/scrape/selector error:', error);
      res.status(500).json({
        status: 'error',
        statusCode: 500,
        error: error.message || 'Gagal menjalankan query selector',
      });
    }
  });

  // 9. GET /api/v1/openapi.json
  app.get('/api/v1/openapi.json', (req, res) => {
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;

    res.json({
      openapi: '3.0.0',
      info: {
        title: 'ROMsNS & DLArchive Cheerio Scraper REST API',
        version: '1.1.0',
        description:
          'RESTful API untuk scraping data Nintendo Switch ROM dari romsns.com dan ekstraksi mirror link unduhan (Fast Drive, Terabox, Filedon, Rush) dari dlarchive.my.id.',
      },
      servers: [{ url: baseUrl }],
      paths: {
        '/api/v1/games': {
          get: { summary: 'Ambil daftar game terpaginasi dengan pencarian & filter genre' },
        },
        '/api/v1/games/popular': {
          get: { summary: 'Ambil game terpopuler saat ini' },
        },
        '/api/v1/games/{id}': {
          get: { summary: 'Ambil detail lengkap game termasuk alur cerita dan mirror download' },
        },
        '/api/v1/games/{id}/mirrors': {
          get: { summary: 'Ekstrak semua tautan mirror download (Fast Drive, Terabox, Filedon, Parted) dari dlarchive' },
        },
        '/api/v1/games/{id}/download': {
          get: { summary: 'Ambil tautan unduh utama & metadata' },
        },
        '/api/v1/scrape/download-page': {
          get: { summary: 'Scrape halaman download dlarchive.my.id secara langsung' },
        },
      },
    });
  });

  // Backward compatibility
  app.get('/api/games', async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const search = (req.query.search as string) || '';
      const category = (req.query.category as string) || '';
      const data = await scrapeGameList({ page, search, category });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/games/detail', async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: 'Parameter "url" diperlukan' });
      const detail = await scrapeGameDetail(url);
      res.json({ success: true, data: detail });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      version: '1.1.0',
      apiPrefix: '/api/v1',
      cacheItems: cache.size,
      time: new Date().toISOString(),
    });
  });

  // Serve static files in production or Vite middleware in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Scraper App & REST API running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server error:', err);
  process.exit(1);
});
