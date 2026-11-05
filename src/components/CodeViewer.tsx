import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export const CodeViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'esm' | 'detail' | 'mirrors' | 'cjs' | 'cli'>('esm');
  const [copied, setCopied] = useState(false);

  const snippets = {
    esm: `/**
 * ROMsNS Scraper - Node.js (ES Module / TypeScript)
 * Prasyarat: npm install cheerio
 */
import * as cheerio from 'cheerio';

async function fetchRomsnsGames(page = 1, searchQuery = '') {
  const url = searchQuery
    ? \`https://romsns.com/\${page > 1 ? \`page/\${page}/\` : ''}?s=\${encodeURIComponent(searchQuery)}\`
    : \`https://romsns.com/\${page > 1 ? \`page/\${page}/\` : ''}\`;

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const games = [];

  $('.rgc-grid .rgc-item, .rgc-grid > a.rgc-card').each((_, element) => {
    const card = $(element).is('a.rgc-card') ? $(element) : $(element).find('a.rgc-card');
    const href = card.attr('href') || '';
    const title = card.find('.rgc-title-in').text().trim();
    const coverImage = card.find('img').attr('src') || '';
    const fileSize = card.find('.rgc-badge-size').text().trim();
    const downloads = card.find('.rgc-download-number').text().trim();

    const formats = [];
    card.find('.rgc-format-pill').each((_, pill) => {
      formats.push($(pill).text().trim());
    });

    if (title && href) {
      games.push({
        title,
        url: href,
        coverImage,
        fileSize,
        downloads,
        formats,
      });
    }
  });

  return games;
}

// Eksekusi
fetchRomsnsGames(1, 'pokemon')
  .then((games) => console.log(JSON.stringify(games, null, 2)))
  .catch(console.error);`,

    detail: `/**
 * ROMsNS Detail Scraper - Mengambil Info Game & Link Download Langsung
 * Prasyarat: npm install cheerio
 */
import * as cheerio from 'cheerio';

async function scrapeGameDetail(gameUrl) {
  const response = await fetch(gameUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  });

  const html = await response.text();
  const $ = cheerio.load(html);

  // Judul & Cover
  const title = $('h1').first().text().trim();
  const coverImage =
    $('meta[property="og:image"]').attr('content') ||
    $('.idb-card-body img, .ams-content img').first().attr('src') ||
    '';

  // Metadata Tabel (.idb-table: Size, Available, Region)
  const metadata = {};
  $('.idb-table tr').each((_, tr) => {
    const key = $(tr).find('th').text().trim();
    const val = $(tr).find('td').text().trim();
    if (key) metadata[key] = val;
  });

  // Tombol Download & Hitungan Unduhan
  const downloadLink = $('.idb-btns a.idb-btn').attr('href') || '';
  const downloadCount = $('.idb-download-count strong').text().trim();

  // Alur Cerita & Fitur Game
  let storyline = '';
  const features = [];
  const tips = [];

  $('.ams-content h2, .ams-content h3').each((_, el) => {
    const heading = $(el).text().trim().toLowerCase();
    const paragraph = $(el).next('p').text().trim();

    if (heading.includes('storyline') || heading.includes('story')) {
      storyline = paragraph;
    } else if (heading.includes('gameplay')) {
      $(el).nextAll('ul').first().find('li').each((_, li) => {
        features.push($(li).text().trim());
      });
    } else if (heading.includes('tips')) {
      $(el).nextAll('ul').first().find('li').each((_, li) => {
        tips.push($(li).text().trim());
      });
    }
  });

  return {
    title,
    coverImage,
    metadata,
    downloadLink,
    downloadCount,
    storyline,
    features,
    tips,
  };
}

// Eksekusi
scrapeGameDetail('https://romsns.com/hot-wheels-unleashed-2-turbocharged-switch-nsp-xci/')
  .then(console.log)
  .catch(console.error);`,

    mirrors: `/**
 * DLArchive Scraper - Mengekstrak Mirror Cloud (Fast Drive, Terabox, Filedon, Rush)
 * Prasyarat: npm install cheerio
 */
import * as cheerio from 'cheerio';

async function scrapeDownloadMirrors(dlarchiveUrl) {
  console.log(\`[Scrape Mirrors] Mengambil: \${dlarchiveUrl}\`);

  const response = await fetch(dlarchiveUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  });

  const html = await response.text();
  const $ = cheerio.load(html);
  const packages = [];

  // Parse kartu download (.roms-card)
  $('.roms-card').each((_, cardEl) => {
    const cardTitle = $(cardEl).find('.roms-head .ttl').text().trim() || 'Download';

    // 1. Single Package (.roms-sub + .roms-grid)
    $(cardEl).find('.roms-sub').each((_, subEl) => {
      const packageTitle = $(subEl).text().trim();
      const grid = $(subEl).next('.roms-grid');
      const mirrors = [];

      grid.find('a.roms-btn').each((_, btnEl) => {
        mirrors.push({
          server: $(btnEl).text().trim(),
          url: $(btnEl).attr('href') || '',
        });
      });

      packages.push({ cardTitle, packageTitle, mirrors });
    });

    // 2. Parted Package (.roms-pills)
    $(cardEl).find('.roms-pills').each((_, pillsEl) => {
      const provider = $(pillsEl).prev('div').text().trim() || 'Parted Host';
      const mirrors = [];

      $(pillsEl).find('a.roms-pill').each((_, pillEl) => {
        mirrors.push({
          server: provider,
          part: $(pillEl).text().trim(),
          url: $(pillEl).attr('href') || '',
        });
      });

      packages.push({ cardTitle, packageTitle: provider, mirrors });
    });
  });

  return packages;
}

// Eksekusi:
scrapeDownloadMirrors('https://dlarchive.my.id/?post_type=roms&p=1493')
  .then((packages) => console.log(JSON.stringify(packages, null, 2)))
  .catch(console.error);`,

    cjs: `/**
 * ROMsNS Scraper - CommonJS (Node.js Lama / require)
 */
const cheerio = require('cheerio');

async function getGames() {
  const url = 'https://romsns.com/';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  const results = [];
  $('.rgc-grid .rgc-item').each((_, el) => {
    const card = $(el).find('a.rgc-card');
    results.push({
      title: card.find('.rgc-title-in').text().trim(),
      url: card.attr('href'),
      size: card.find('.rgc-badge-size').text().trim(),
      downloads: card.find('.rgc-download-number').text().trim(),
    });
  });

  console.log(results);
}

getGames();`,

    cli: `# Perintah CLI Scraper di Terminal:

# Scrape daftar game terbaru
npm run scrape -- --latest

# Cari game spesifik
npm run scrape -- --search "mario"
npm run scrape -- --search "zelda"

# Filter berdasarkan genre
npm run scrape -- --category action --page 1

# Ambil detail lengkap suatu game beserta semua mirror link unduhan
npm run scrape -- --detail "https://romsns.com/hot-wheels-unleashed-2-turbocharged-switch-nsp-xci/"

# Simpan hasil langsung ke file JSON
npm run scrape -- --search "pokemon" --json > pokemon-roms.json`,
  };

  const currentCode = snippets[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-800/80 bg-[#111827] p-5">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Kode Node.js Cheerio Siap Pakai
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pilih format skrip yang sesuai dengan kebutuhan proyek Node.js Anda.
          </p>
        </div>

        {/* Tab Segmented Control */}
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-800 bg-[#0b0f19] p-0.5 text-xs">
          <button
            onClick={() => setActiveTab('esm')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'esm' ? 'bg-[#1e293b] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            ESM / TS
          </button>
          <button
            onClick={() => setActiveTab('detail')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'detail' ? 'bg-[#1e293b] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Detail Game
          </button>
          <button
            onClick={() => setActiveTab('mirrors')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'mirrors' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mirror dlarchive
          </button>
          <button
            onClick={() => setActiveTab('cjs')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'cjs' ? 'bg-[#1e293b] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            CommonJS
          </button>
          <button
            onClick={() => setActiveTab('cli')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'cli' ? 'bg-[#1e293b] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Terminal CLI
          </button>
        </div>
      </div>

      {/* Code Editor Container */}
      <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-[#0b0f19] shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-2 bg-[#111827]/70">
          <span className="font-mono text-xs text-slate-400">
            {activeTab === 'cli' ? 'terminal-commands.sh' : `scraper-${activeTab}.js`}
          </span>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'Tersalin' : 'Salin Kode'}</span>
          </button>
        </div>

        <pre className="overflow-x-auto p-4 font-mono text-xs text-slate-200 leading-relaxed max-h-[500px]">
          <code>{currentCode}</code>
        </pre>
      </div>

      {/* Explanatory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-4">
          <h3 className="font-bold text-white mb-1">1. Pasang Library</h3>
          <p className="text-slate-400 leading-relaxed mb-2">
            Pasang package Cheerio melalui npm atau yarn pada direktori proyek Anda.
          </p>
          <code className="block rounded bg-[#0b0f19] p-2 font-mono text-[11px] text-rose-400">
            npm install cheerio
          </code>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-4">
          <h3 className="font-bold text-white mb-1">2. Headers User-Agent</h3>
          <p className="text-slate-400 leading-relaxed">
            romsns.com dan dlarchive.my.id membutuhkan header <code className="text-slate-200">User-Agent</code> browser standar untuk mencegah penolakan request HTTP 403.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-4">
          <h3 className="font-bold text-white mb-1">3. Selector Download Mirror</h3>
          <p className="text-slate-400 leading-relaxed">
            Halaman tujuan unduh (dlarchive) memuat kartu <code className="text-slate-200">.roms-card</code> dengan tautan <code className="text-slate-200">.roms-grid a.roms-btn</code> untuk server Fast Drive, Terabox, Filedon, dan Rush.
          </p>
        </div>
      </div>
    </div>
  );
};
