#!/usr/bin/env node
/**
 * ROMsNS Cheerio Node.js CLI Scraper
 * Run with: npm run scrape OR npx tsx src/scraper-cli.ts
 */

import { scrapeGameList, scrapeGameDetail } from './services/cheerioScraper.ts';

async function main() {
  const args = process.argv.slice(2);
  const helpRequested = args.includes('--help') || args.includes('-h');
  const asJson = args.includes('--json');

  if (helpRequested || args.length === 0) {
    console.log(`
🎮 ROMsNS Cheerio Node.js Scraper
===================================
Usage:
  npx tsx src/scraper-cli.ts [options]
  npm run scrape -- [options]

Options:
  --latest                  Scrape latest Nintendo Switch games from homepage
  --page <number>           Specify page number (e.g. --page 2)
  --search <query>          Search games (e.g. --search "pokemon")
  --category <slug>         Filter by category (e.g. --category action)
  --detail <url_or_slug>    Scrape full details of a specific game
  --json                    Output pure JSON (useful for piping to jq or file)
  --help, -h                Show this help message

Examples:
  npm run scrape -- --latest
  npm run scrape -- --search mario
  npm run scrape -- --category rpg --page 1
  npm run scrape -- --detail hot-wheels-unleashed-2-turbocharged-switch-nsp-xci
    `);
    if (!args.length) {
      console.log('⚡ Menjalankan default scrape halaman terbaru (latest games)...\n');
    } else {
      return;
    }
  }

  // Parse arguments
  let search: string | undefined;
  let category: string | undefined;
  let detailTarget: string | undefined;
  let page = 1;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--search' && args[i + 1]) {
      search = args[++i];
    } else if (arg === '--category' && args[i + 1]) {
      category = args[++i];
    } else if (arg === '--page' && args[i + 1]) {
      page = parseInt(args[++i], 10) || 1;
    } else if (arg === '--detail' && args[i + 1]) {
      detailTarget = args[++i];
    }
  }

  try {
    if (detailTarget) {
      if (!asJson) console.log(`🔍 Mengambil detail game dari: ${detailTarget} menggunakan Cheerio...\n`);
      const detail = await scrapeGameDetail(detailTarget);
      if (asJson) {
        console.log(JSON.stringify(detail, null, 2));
      } else {
        console.log('==================================================');
        console.log(`📌 Judul Game   : ${detail.title}`);
        console.log(`💾 Ukuran File  : ${detail.tableInfo.size || 'N/A'}`);
        console.log(`🌍 Region       : ${detail.tableInfo.region || 'N/A'}`);
        console.log(`📦 Konten       : ${detail.tableInfo.available || 'N/A'}`);
        console.log(`⬇️ Total Unduh  : ${detail.downloadCount}`);
        console.log(`🔗 Link ROM     : ${detail.downloadLink || 'Tidak tersedia'}`);

        if (detail.downloadPageData && detail.downloadPageData.packages.length > 0) {
          console.log('--------------------------------------------------');
          console.log(`☁️ Mirror Cloud Download (${detail.downloadPageData.totalMirrorsFound} tautan ditemukan):`);
          detail.downloadPageData.packages.forEach((pkg) => {
            console.log(`  📦 ${pkg.packageTitle}:`);
            pkg.mirrors.forEach((m) => {
              const label = m.part ? `${m.server} [${m.part}]` : m.server;
              console.log(`     ↳ ${label.padEnd(16)}: ${m.url}`);
            });
          });
        }

        console.log('--------------------------------------------------');
        if (detail.storyline) {
          console.log(`📖 Alur Cerita:\n${detail.storyline.slice(0, 300)}...\n`);
        }
        if (detail.features.length) {
          console.log(`⭐ Fitur (${detail.features.length}):`);
          detail.features.slice(0, 5).forEach((f) => console.log(`  • ${f}`));
        }
        console.log('==================================================');
      }
      return;
    }

    // List scraping
    if (!asJson) {
      console.log(`🔍 Mengambil data dari https://romsns.com/ (Page ${page}${search ? `, Query: "${search}"` : ''}${category ? `, Genre: "${category}"` : ''})...\n`);
    }

    const result = await scrapeGameList({ page, search, category });

    if (asJson) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`✅ Berhasil mengambil ${result.games.length} game dari romsns.com:`);
      console.log('-----------------------------------------------------------------------------------------------------');
      console.log(
        '#'.padEnd(4) +
        'Judul Game'.padEnd(46) +
        'Format'.padEnd(12) +
        'Ukuran'.padEnd(10) +
        'Unduhan'.padEnd(10)
      );
      console.log('-----------------------------------------------------------------------------------------------------');
      result.games.forEach((game, idx) => {
        const shortTitle = game.title.length > 42 ? game.title.substring(0, 40) + '..' : game.title;
        console.log(
          `${idx + 1}`.padEnd(4) +
          shortTitle.padEnd(46) +
          game.formats.join(', ').padEnd(12) +
          game.fileSize.padEnd(10) +
          game.downloads.padEnd(10)
        );
      });
      console.log('-----------------------------------------------------------------------------------------------------');
      console.log(`📄 Halaman ${result.page} dari ${result.totalPages} | Sumber: ${result.sourceUrl}`);
      console.log(`💡 Untuk detail lengkap, jalankan: npm run scrape -- --detail "${result.games[0]?.url || 'url'}"`);
    }
  } catch (error: any) {
    console.error('❌ Terjadi kesalahan saat scraping:', error.message);
    process.exit(1);
  }
}

main();
