import React, { useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  Copy,
  Check,
  Code,
  FileText,
  Terminal,
  ArrowUpRight,
  HardDrive,
  CloudDownload,
  Layers,
  Sparkles,
} from 'lucide-react';
import { GameDetailResult } from '../types.ts';

interface GameDetailModalProps {
  detail: GameDetailResult | null;
  isLoading: boolean;
  onClose: () => void;
  onSelectGameUrl: (url: string) => void;
}

export const GameDetailModal: React.FC<GameDetailModalProps> = ({
  detail,
  isLoading,
  onClose,
  onSelectGameUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'mirrors' | 'json' | 'selectors'>('info');
  const [copied, setCopied] = useState(false);
  const [copiedLinkIndex, setCopiedLinkIndex] = useState<string | null>(null);

  if (!detail && !isLoading) return null;

  const handleCopyJson = () => {
    if (!detail) return;
    navigator.clipboard.writeText(JSON.stringify(detail, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMirrorLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkIndex(id);
    setTimeout(() => setCopiedLinkIndex(null), 2000);
  };

  const handleDownloadJson = () => {
    if (!detail) return;
    const blob = new Blob([JSON.stringify(detail, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${detail.id}-scraped.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPage = detail?.downloadPageData;
  const packages = downloadPage?.packages || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="relative my-6 flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-800 bg-[#0e1422] shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-[#0b0f19]">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-rose-400">Data Terkstrak Cheerio</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{detail?.id || 'memuat...'}</span>
            </div>
            <h2 className="truncate text-base font-bold text-white sm:text-lg">
              {detail?.cleanTitle || detail?.title || 'Memuat Data...'}
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* View Mode Segmented Control */}
            <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                  activeTab === 'info'
                    ? 'bg-[#1e293b] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Ringkasan</span>
              </button>

              <button
                onClick={() => setActiveTab('mirrors')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                  activeTab === 'mirrors'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CloudDownload className="h-3.5 w-3.5" />
                <span>Mirror Unduhan ({downloadPage?.totalMirrorsFound || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('json')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                  activeTab === 'json'
                    ? 'bg-[#1e293b] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span>JSON</span>
              </button>

              <button
                onClick={() => setActiveTab('selectors')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                  activeTab === 'selectors'
                    ? 'bg-[#1e293b] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>Selector</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-200 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
              <p className="mt-4 text-sm font-semibold text-slate-200">
                Mem-parsing romsns.com &amp; dlarchive.my.id dengan Cheerio...
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Mengekstrak judul, metadata tabel .idb-table, tombol download, dan mirror cloud drive
              </p>
            </div>
          ) : detail ? (
            <>
              {/* TAB 1: INFO SUMMARY */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  {/* Hero Presentation */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start rounded-xl border border-slate-800/80 bg-[#111827] p-5">
                    {detail.coverImage && (
                      <div className="md:col-span-5 aspect-video overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
                        <img
                          src={detail.coverImage}
                          alt={detail.title}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="md:col-span-7 space-y-3">
                      {/* Clean Unboxed Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 tabular-nums">
                        <span className="font-semibold text-rose-400">Nintendo Switch</span>
                        <span aria-hidden="true">·</span>
                        <span>Ukuran: {detail.tableInfo.size || 'N/A'}</span>
                        <span aria-hidden="true">·</span>
                        <span>Region: {detail.tableInfo.region || 'USA/Global'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{detail.downloadCount} unduhan</span>
                      </div>

                      <h1 className="text-xl font-bold tracking-tight text-white">
                        {detail.title}
                      </h1>

                      <p className="text-xs text-slate-400 break-all">
                        Sumber:{' '}
                        <a
                          href={detail.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-300 hover:text-rose-400 underline underline-offset-2"
                        >
                          {detail.url}
                        </a>
                      </p>

                      {/* Primary Actions */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-2">
                        {downloadPage && downloadPage.totalMirrorsFound > 0 ? (
                          <button
                            onClick={() => setActiveTab('mirrors')}
                            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500"
                          >
                            <CloudDownload className="h-3.5 w-3.5" />
                            <span>Lihat {downloadPage.totalMirrorsFound} Link Mirror Cloud</span>
                          </button>
                        ) : detail.downloadLink ? (
                          <a
                            href={detail.downloadLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Buka Halaman Download</span>
                            <ExternalLink className="h-3 w-3 opacity-70" />
                          </a>
                        ) : null}

                        <button
                          onClick={handleCopyJson}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
                        >
                          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copied ? 'Tersalin' : 'Salin JSON'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Scraped Mirrors Quick Preview */}
                  {downloadPage && packages.length > 0 && (
                    <div className="rounded-xl border border-rose-500/20 bg-[#141b2d] p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CloudDownload className="h-4 w-4 text-rose-400" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                            Link Download Berhasil Di-scrape ({downloadPage.totalMirrorsFound} Mirror Ditemukan)
                          </h3>
                        </div>
                        <button
                          onClick={() => setActiveTab('mirrors')}
                          className="text-xs font-semibold text-rose-400 hover:underline"
                        >
                          Buka Semua Mirror →
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                        {packages.slice(0, 3).map((pkg, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-slate-800 bg-[#0b0f19] p-3 text-xs space-y-1.5"
                          >
                            <span className="font-semibold text-slate-200 block truncate">
                              {pkg.packageTitle}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {pkg.mirrors.map((m, mIdx) => (
                                <a
                                  key={mIdx}
                                  href={m.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded bg-[#1e293b] px-2 py-0.5 text-[11px] font-medium text-rose-300 hover:bg-rose-600 hover:text-white transition"
                                >
                                  <span>{m.part ? `${m.server} (${m.part})` : m.server}</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technical Specifications (Extracted from .idb-table) */}
                  <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Spesifikasi ROM (.idb-table)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="border-b sm:border-b-0 sm:border-r border-slate-800/80 pb-3 sm:pb-0 sm:pr-4">
                        <span className="text-slate-500 block mb-1">Ukuran File</span>
                        <span className="text-sm font-semibold text-white tabular-nums">
                          {detail.tableInfo.size || 'Tidak tercantum'}
                        </span>
                      </div>

                      <div className="border-b sm:border-b-0 sm:border-r border-slate-800/80 pb-3 sm:pb-0 sm:pr-4">
                        <span className="text-slate-500 block mb-1">Region Game</span>
                        <span className="text-sm font-semibold text-white">
                          {detail.tableInfo.region || 'USA / Global'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block mb-1">Total Unduhan Tercatat</span>
                        <span className="text-sm font-semibold text-white tabular-nums">
                          {detail.downloadCount} kali diunduh
                        </span>
                      </div>
                    </div>

                    {detail.tableInfo.available && (
                      <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs">
                        <span className="text-slate-500 block mb-1">Paket Konten Tersedia</span>
                        <p className="text-slate-200 leading-relaxed font-mono text-[11px]">
                          {detail.tableInfo.available}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Storyline */}
                  {detail.storyline && (
                    <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Alur Cerita (Storyline)
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line max-w-prose">
                        {detail.storyline}
                      </p>
                    </div>
                  )}

                  {/* Features List */}
                  {detail.features.length > 0 && (
                    <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Fitur Game
                      </h3>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                        {detail.features.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-rose-500 font-bold">―</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tips List */}
                  {detail.tips.length > 0 && (
                    <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Tips Bermain
                      </h3>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {detail.tips.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">―</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Games */}
                  {detail.recommendedGames.length > 0 && (
                    <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Rekomendasi Terkait
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {detail.recommendedGames.map((rec, idx) => (
                          <button
                            key={idx}
                            onClick={() => onSelectGameUrl(rec.url)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0b0f19] px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-700 hover:text-white"
                          >
                            <span>{rec.title}</span>
                            <ArrowUpRight className="h-3 w-3 text-slate-500" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DOWNLOAD MIRRORS (SCRAFED DARI DLARCHIVE) */}
              {activeTab === 'mirrors' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-rose-400">
                          Scraped dari dlarchive.my.id
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {downloadPage?.totalMirrorsFound || 0} Mirror Link
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1">
                        Daftar Tautan Download Asli &amp; Mirror Cloud
                      </h3>
                    </div>

                    {detail.downloadLink && (
                      <a
                        href={detail.downloadLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition"
                      >
                        <span>Halaman Sumber dlarchive</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {packages.length === 0 ? (
                    <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-8 text-center text-xs text-slate-400">
                      <p>Tidak ditemukan mirror otomatis pada tautan ini.</p>
                      {detail.downloadLink && (
                        <a
                          href={detail.downloadLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1 rounded bg-rose-600 px-3 py-1.5 text-white font-medium"
                        >
                          Buka Link Download Langsung
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {packages.map((pkg, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-800/80 bg-[#111827] p-4 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase font-mono ${
                                  pkg.fileType === 'base'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : pkg.fileType === 'update'
                                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                    : pkg.fileType === 'dlc'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                }`}
                              >
                                {pkg.fileType || 'ROM'}
                              </span>
                              <h4 className="text-xs font-bold text-white">
                                {pkg.packageTitle}
                              </h4>
                            </div>

                            <span className="text-[11px] text-slate-500 font-mono">
                              {pkg.cardTitle}
                            </span>
                          </div>

                          {/* Mirrors Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {pkg.mirrors.map((mirror, mIdx) => {
                              const key = `${idx}-${mIdx}`;
                              const isCopied = copiedLinkIndex === key;
                              const label = mirror.part
                                ? `${mirror.server} - ${mirror.part}`
                                : mirror.server;

                              return (
                                <div
                                  key={mIdx}
                                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#0b0f19] p-2.5 transition hover:border-slate-700"
                                >
                                  <a
                                    href={mirror.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 min-w-0 flex-1 group"
                                  >
                                    <CloudDownload className="h-4 w-4 text-rose-400 shrink-0" />
                                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                                      {label}
                                    </span>
                                    <ExternalLink className="h-3 w-3 text-slate-500 group-hover:text-rose-400 shrink-0" />
                                  </a>

                                  <button
                                    onClick={() => handleCopyMirrorLink(mirror.url, key)}
                                    title="Salin Tautan"
                                    className="p-1 text-slate-500 hover:text-white transition shrink-0 ml-1"
                                  >
                                    {isCopied ? (
                                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RAW JSON */}
              {activeTab === 'json' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">
                      Output JSON Scraped GameDetailResult
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyJson}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copied ? 'Tersalin' : 'Salin JSON'}</span>
                      </button>
                      <button
                        onClick={handleDownloadJson}
                        className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-500"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Unduh File</span>
                      </button>
                    </div>
                  </div>

                  <pre className="max-h-[500px] overflow-auto rounded-xl border border-slate-800 bg-[#0b0f19] p-4 font-mono text-xs text-slate-200">
                    {JSON.stringify(detail, null, 2)}
                  </pre>
                </div>
              )}

              {/* TAB 4: CHEERIO SELECTORS */}
              {activeTab === 'selectors' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">
                    Pemetaan query selector Cheerio yang digunakan untuk mengekstrak data dari halaman romsns.com dan dlarchive.my.id:
                  </p>

                  <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-[#0b0f19] font-mono text-xs">
                    <div className="p-3.5">
                      <span className="text-slate-500 block mb-1">1. Tombol Download Destination (romsns.com)</span>
                      <code className="text-rose-400">$('.idb-btns a.idb-btn').attr('href')</code>
                      <p className="mt-1 text-slate-300 font-sans text-xs">{detail.downloadLink}</p>
                    </div>

                    <div className="p-3.5">
                      <span className="text-slate-500 block mb-1">2. Kartu Download Mirror (dlarchive.my.id)</span>
                      <code className="text-rose-400">$('.roms-card').each((_, card) =&gt; &#123; ... &#125;)</code>
                      <p className="mt-1 text-slate-400 text-[11px]">
                        Single: .roms-sub + .roms-grid a.roms-btn | Parted: .roms-pills a.roms-pill
                      </p>
                    </div>

                    <div className="p-3.5">
                      <span className="text-slate-500 block mb-1">3. Mirror Cloud Hosts Terdeteksi</span>
                      <p className="mt-1 text-emerald-400 text-xs font-sans">
                        Fast Drive, Terabox, Filedon, Rush ({downloadPage?.totalMirrorsFound || 0} mirror links)
                      </p>
                    </div>

                    <div className="p-3.5">
                      <span className="text-slate-500 block mb-1">4. Tabel Metadata (.idb-table)</span>
                      <code className="text-rose-400">{`$('.idb-table tr').each((_, tr) => { const k = $(tr).find('th').text(); const v = $(tr).find('td').text(); })`}</code>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
