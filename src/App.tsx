import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Info,
  AlertTriangle,
  Flame,
  FileJson,
  Download,
  X,
} from 'lucide-react';
import { Header } from './components/Header.tsx';
import { GameCard } from './components/GameCard.tsx';
import { GameDetailModal } from './components/GameDetailModal.tsx';
import { CheerioPlayground } from './components/CheerioPlayground.tsx';
import { CodeViewer } from './components/CodeViewer.tsx';
import { RestApiHub } from './components/RestApiHub.tsx';
import {
  GameCardItem,
  PopularGameItem,
  ScrapeListResult,
  GameDetailResult,
} from './types.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'api' | 'playground' | 'code'>('catalog');

  // Catalog State
  const [games, setGames] = useState<GameCardItem[]>([]);
  const [popular, setPopular] = useState<PopularGameItem[]>([]);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [sourceUrl, setSourceUrl] = useState('https://romsns.com/');
  const [scrapedAt, setScrapedAt] = useState<string | null>(null);

  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [gamesError, setGamesError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedGameDetail, setSelectedGameDetail] = useState<GameDetailResult | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Export Modal State
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Quick search keywords
  const quickSearches = ['Pokemon', 'Mario', 'Zelda', 'GTA', 'Kirby', 'Dragon Ball'];

  // Fetch games list
  const fetchGames = async (p = 1, search = '', cat = '') => {
    setIsLoadingGames(true);
    setGamesError(null);

    try {
      const params = new URLSearchParams();
      if (p > 1) params.set('page', String(p));
      if (search) params.set('search', search);
      if (cat) params.set('category', cat);

      const res = await fetch(`/api/v1/games?${params.toString()}`);
      const json = await res.json();

      if (json.status !== 'success') {
        throw new Error(json.error || 'Gagal mengambil data dari romsns.com');
      }

      const listData = json.data;
      setGames(listData.games || []);
      setPage(listData.pagination?.currentPage || p);
      setTotalPages(listData.pagination?.totalPages || 1);
      setSourceUrl(json.meta?.scrapedFrom || 'https://romsns.com/');
      setScrapedAt(json.meta?.timestamp || new Date().toISOString());

      // Fetch categories once if empty
      if (categories.length === 0) {
        fetch('/api/v1/games/categories')
          .then((r) => r.json())
          .then((catJson) => {
            if (catJson.data?.categories) setCategories(catJson.data.categories);
          })
          .catch(() => {});
      }

      // Fetch popular games once if empty
      if (popular.length === 0) {
        fetch('/api/v1/games/popular')
          .then((r) => r.json())
          .then((popJson) => {
            if (popJson.data?.popular) setPopular(popJson.data.popular);
          })
          .catch(() => {});
      }
    } catch (err: any) {
      console.error('Error fetching games:', err);
      setGamesError(err.message || 'Terjadi kesalahan saat scraping');
    } finally {
      setIsLoadingGames(false);
    }
  };

  useEffect(() => {
    fetchGames(page, activeSearch, activeCategory);
  }, [page, activeSearch, activeCategory]);

  // Fetch single game detail using the REST API v1
  const handleOpenDetail = async (urlOrId: string) => {
    setDetailModalOpen(true);
    setIsLoadingDetail(true);
    setSelectedGameDetail(null);

    try {
      // Determine if slug or full URL
      let slug = urlOrId;
      if (urlOrId.startsWith('http')) {
        const parts = new URL(urlOrId).pathname.split('/').filter(Boolean);
        slug = parts[parts.length - 1] || urlOrId;
      }

      const res = await fetch(`/api/v1/games/${encodeURIComponent(slug)}`);
      const json = await res.json();
      if (json.status !== 'success') {
        throw new Error(json.error || 'Gagal mengambil detail game');
      }
      setSelectedGameDetail(json.data);
    } catch (err: any) {
      alert(`Gagal mengambil detail: ${err.message}`);
      setDetailModalOpen(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(searchQuery.trim());
  };

  const handleSelectQuickSearch = (term: string) => {
    setSearchQuery(term);
    setPage(1);
    setActiveSearch(term);
  };

  const handleSelectCategory = (slug: string) => {
    setActiveCategory(slug);
    setPage(1);
    setSearchQuery('');
    setActiveSearch('');
  };

  // Export handlers
  const handleDownloadJson = () => {
    const payload = {
      sourceUrl,
      scrapedAt,
      filter: { search: activeSearch, category: activeCategory, page },
      totalGamesOnPage: games.length,
      games,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `romsns-data-page-${page}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportModalOpen(false);
  };

  const handleDownloadCsv = () => {
    const headers = ['ID', 'Judul', 'Format', 'Ukuran', 'Unduhan', 'URL', 'CoverImage'];
    const rows = games.map((g) => [
      `"${g.id}"`,
      `"${g.title.replace(/"/g, '""')}"`,
      `"${g.formats.join(', ')}"`,
      `"${g.fileSize}"`,
      `"${g.downloads}"`,
      `"${g.url}"`,
      `"${g.coverImage}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `romsns-data-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-rose-600 selection:text-white">
      {/* 3-Zone Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExport={() => setExportModalOpen(true)}
        totalGames={games.length}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* TAB 1: CATALOG VIEW */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Scraped Popular Games Strip */}
            {popular.length > 0 && (
              <section className="rounded-xl border border-slate-800/80 bg-[#111827] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-rose-500" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Game Terpopuler (Scraped dari romsns.com)
                    </h2>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    GET /api/v1/games/popular
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                  {popular.map((pop) => (
                    <div
                      key={pop.id}
                      onClick={() => handleOpenDetail(pop.url)}
                      className="group cursor-pointer rounded-lg border border-slate-800/80 bg-[#0b0f19] p-2 transition hover:border-slate-700 hover:bg-[#141d2f]"
                    >
                      <div className="aspect-video w-full overflow-hidden rounded bg-slate-900">
                        <img
                          src={pop.coverImage}
                          alt={pop.title}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-103"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <p className="mt-2 line-clamp-1 text-xs font-semibold text-slate-200 group-hover:text-white">
                        {pop.title}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 tabular-nums">
                        <span>{pop.fileSize}</span>
                        <span>{pop.downloads} dl</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Filter and Control Workbench */}
            <section className="rounded-xl border border-slate-800/80 bg-[#111827] p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari game Nintendo Switch (contoh: Pokemon, Mario, Zelda, GTA)..."
                    className="w-full rounded-lg border border-slate-800 bg-[#0b0f19] py-2 pl-9 pr-24 text-xs font-medium text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none sm:text-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-500"
                  >
                    Scrape
                  </button>
                </form>

                {/* View switcher and Refresh */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex rounded-lg border border-slate-800 bg-[#0b0f19] p-0.5 text-xs">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded transition ${
                        viewMode === 'grid' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Tampilan Grid"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded transition ${
                        viewMode === 'table' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Tampilan Tabel Data"
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => fetchGames(page, activeSearch, activeCategory)}
                    disabled={isLoadingGames}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0b0f19] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:text-white"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoadingGames ? 'animate-spin text-rose-500' : ''}`} />
                    <span>Muat Ulang</span>
                  </button>
                </div>
              </div>

              {/* Quick Searches */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
                <span className="text-slate-400">Pencarian Cepat:</span>
                {quickSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSelectQuickSearch(term)}
                    className={`rounded px-2 py-0.5 transition ${
                      activeSearch.toLowerCase() === term.toLowerCase()
                        ? 'bg-rose-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    {term}
                  </button>
                ))}

                {activeSearch && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveSearch('');
                      setPage(1);
                    }}
                    className="ml-auto text-rose-400 hover:underline"
                  >
                    Reset Filter ({activeSearch})
                  </button>
                )}
              </div>

              {/* Genre Segmented Tabs */}
              {categories.length > 0 && (
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => handleSelectCategory(cat.slug)}
                      className={`whitespace-nowrap rounded-md px-2.5 py-1 font-medium transition ${
                        activeCategory === cat.slug
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Status & Source URL indicator */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2 font-mono">
                <span>Endpoint:</span>
                <span className="text-emerald-400">GET /api/v1/games</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-slate-500">Target: {sourceUrl}</span>
              </div>

              <div className="flex items-center gap-3 tabular-nums font-mono">
                <span>
                  Menampilkan <strong className="text-white">{games.length}</strong> game
                </span>
                {scrapedAt && (
                  <span className="hidden sm:inline">
                    · Diambil: {new Date(scrapedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            {/* Error Message */}
            {gamesError && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-6 text-center">
                <AlertTriangle className="mx-auto h-6 w-6 text-rose-500" />
                <h3 className="mt-2 text-sm font-bold text-white">Gagal Mengambil Data</h3>
                <p className="mt-1 text-xs text-rose-300">{gamesError}</p>
                <button
                  onClick={() => fetchGames(page, activeSearch, activeCategory)}
                  className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-500"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Skeleton Loading */}
            {isLoadingGames && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="animate-pulse rounded-xl border border-slate-800/80 bg-[#111827] p-3 space-y-3"
                  >
                    <div className="aspect-video w-full rounded bg-slate-800" />
                    <div className="h-4 w-3/4 rounded bg-slate-800" />
                    <div className="h-3 w-1/2 rounded bg-slate-800" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoadingGames && games.length === 0 && !gamesError && (
              <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-12 text-center">
                <Info className="mx-auto h-8 w-8 text-slate-500" />
                <h3 className="mt-3 text-sm font-bold text-white">Tidak ada data game ditemukan</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Coba kata kunci lain atau pilih genre &quot;Semua Genre&quot;.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveSearch('');
                    setActiveCategory('');
                    setPage(1);
                  }}
                  className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  Tampilkan Semua Game
                </button>
              </div>
            )}

            {/* Games Grid */}
            {!isLoadingGames && games.length > 0 && viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {games.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onSelect={(g) => handleOpenDetail(g.id || g.url)}
                    isLoadingDetail={isLoadingDetail}
                  />
                ))}
              </div>
            )}

            {/* High Density Table View */}
            {!isLoadingGames && games.length > 0 && viewMode === 'table' && (
              <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-[#111827]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800/80 bg-[#0b0f19] font-mono text-slate-400">
                      <tr>
                        <th className="py-2.5 px-3 w-16">Cover</th>
                        <th className="py-2.5 px-3">Judul ROM</th>
                        <th className="py-2.5 px-3">Format</th>
                        <th className="py-2.5 px-3 text-right">Ukuran</th>
                        <th className="py-2.5 px-3 text-right">Unduhan</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 tabular-nums">
                      {games.map((game) => (
                        <tr
                          key={game.id}
                          onClick={() => handleOpenDetail(game.id || game.url)}
                          className="cursor-pointer transition hover:bg-[#141d2f]"
                        >
                          <td className="py-2 px-3">
                            <img
                              src={game.coverImage}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="h-8 w-14 rounded object-cover bg-slate-900"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-slate-100 hover:text-white">
                              {game.title}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-400 font-mono">
                            {game.formats.join(', ')}
                          </td>
                          <td className="py-2 px-3 text-right text-rose-400 font-medium font-mono">
                            {game.fileSize}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-300 font-mono">
                            {game.downloads}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(game.id || game.url);
                              }}
                              className="font-medium text-rose-400 hover:underline"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {!isLoadingGames && games.length > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-[#111827] px-4 py-3">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1 || isLoadingGames}
                  className="flex items-center gap-1 rounded-md border border-slate-800 bg-[#0b0f19] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Sebelumnya</span>
                </button>

                <div className="text-xs font-mono text-slate-400 tabular-nums">
                  Halaman <strong className="text-white">{page}</strong> dari{' '}
                  <strong className="text-white">{totalPages}</strong>
                </div>

                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={page >= totalPages || isLoadingGames}
                  className="flex items-center gap-1 rounded-md border border-slate-800 bg-[#0b0f19] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PUBLIC REST API HUB */}
        {activeTab === 'api' && <RestApiHub />}

        {/* TAB 3: CHEERIO PLAYGROUND */}
        {activeTab === 'playground' && <CheerioPlayground />}

        {/* TAB 4: CODE SNIPPETS */}
        {activeTab === 'code' && <CodeViewer />}
      </main>

      {/* Detail Modal */}
      {detailModalOpen && (
        <GameDetailModal
          detail={selectedGameDetail}
          isLoading={isLoadingDetail}
          onClose={() => setDetailModalOpen(false)}
          onSelectGameUrl={(url) => handleOpenDetail(url)}
        />
      )}

      {/* Export Dialog Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0e1422] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Ekspor Data Hasil Scrape</h3>
              <button
                onClick={() => setExportModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Simpan {games.length} game yang sedang dimuat di halaman ini ke dalam format file yang Anda inginkan:
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={handleDownloadJson}
                className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-800 bg-[#111827] p-4 text-xs font-semibold text-slate-200 transition hover:border-slate-700 hover:text-white"
              >
                <FileJson className="h-6 w-6 text-rose-500" />
                <span>Format JSON (.json)</span>
              </button>

              <button
                onClick={handleDownloadCsv}
                className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-800 bg-[#111827] p-4 text-xs font-semibold text-slate-200 transition hover:border-slate-700 hover:text-white"
              >
                <Download className="h-6 w-6 text-cyan-400" />
                <span>Format CSV (.csv)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
