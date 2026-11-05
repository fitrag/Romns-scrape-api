import React from 'react';
import { Download } from 'lucide-react';

interface HeaderProps {
  activeTab: 'catalog' | 'api' | 'playground' | 'code';
  setActiveTab: (tab: 'catalog' | 'api' | 'playground' | 'code') => void;
  onOpenExport: () => void;
  totalGames: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenExport,
  totalGames,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0b0f19]/95 backdrop-blur-md">
      {/* Strict 3-Zone Top Bar Contract */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('catalog');
            }}
            className="flex items-center gap-2 text-base font-extrabold tracking-tight text-white transition hover:text-rose-400 whitespace-nowrap shrink-0"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-xs font-black text-white">
              NS
            </span>
            <span>romsns<span className="text-rose-500">.extractor</span></span>
          </a>
        </div>

        {/* Zone 2: 4 single-line nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'catalog'
                ? 'text-white border-b-2 border-rose-500 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            Katalog Game
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'api'
                ? 'text-white border-b-2 border-rose-500 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            REST API Hub
          </button>

          <button
            onClick={() => setActiveTab('playground')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'playground'
                ? 'text-white border-b-2 border-rose-500 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            Cheerio Playground
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'code'
                ? 'text-white border-b-2 border-rose-500 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            Skrip Node.js
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Mobile Tab Select */}
          <div className="flex md:hidden rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-2 py-1 rounded font-medium ${
                activeTab === 'catalog' ? 'bg-rose-600 text-white' : 'text-slate-400'
              }`}
            >
              Katalog
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-2 py-1 rounded font-medium ${
                activeTab === 'api' ? 'bg-rose-600 text-white' : 'text-slate-400'
              }`}
            >
              API
            </button>
            <button
              onClick={() => setActiveTab('playground')}
              className={`px-2 py-1 rounded font-medium ${
                activeTab === 'playground' ? 'bg-rose-600 text-white' : 'text-slate-400'
              }`}
            >
              Console
            </button>
          </div>

          <button
            onClick={onOpenExport}
            className="flex items-center gap-2 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-500 whitespace-nowrap shrink-0 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor ({totalGames})</span>
          </button>
        </div>
      </div>
    </header>
  );
};
