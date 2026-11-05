import React, { useState } from 'react';
import { ExternalLink, ArrowRight, Copy, Check } from 'lucide-react';
import { GameCardItem } from '../types.ts';

interface GameCardProps {
  game: GameCardItem;
  onSelect: (game: GameCardItem) => void;
  isLoadingDetail?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onSelect, isLoadingDetail }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyJson = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(game, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format labels without pill boxes
  const formatsText = game.formats.map((f) => f.replace(/^\./, '')).join(' / ');

  return (
    <article
      onClick={() => onSelect(game)}
      className="group flex flex-col justify-between overflow-hidden rounded-xl border border-slate-800/80 bg-[#111827] transition-all duration-200 hover:border-slate-700 hover:bg-[#141d2f] cursor-pointer"
    >
      <div>
        {/* Cover Thumbnail (16:9 ratio with clean fallback) */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
          <img
            src={game.coverImage || ''}
            alt={game.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
            onError={(e) => {
              // Graceful styled fallback container
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.fallback-placeholder')) {
                const placeholder = document.createElement('div');
                placeholder.className =
                  'fallback-placeholder absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-slate-900 text-slate-500';
                placeholder.innerHTML = `
                  <span class="text-xs font-mono font-medium text-slate-400 mb-1">Nintendo Switch</span>
                  <span class="text-[11px] line-clamp-2 text-slate-500">${game.title}</span>
                `;
                parent.appendChild(placeholder);
              }
            }}
          />

          {/* Quick Copy JSON Action */}
          <button
            onClick={handleCopyJson}
            title="Salin JSON Cheerio Card"
            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-md bg-slate-950/80 text-slate-400 backdrop-blur-sm transition hover:bg-slate-900 hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Card Body with Zero-Pill Typography */}
        <div className="p-4 space-y-2">
          {/* Unboxed Metadata Strip (Anti-Slop Zero Pill Rule §1.A) */}
          <div className="flex items-center gap-2 text-xs text-slate-400 tabular-nums">
            <span className="font-semibold text-rose-400">{formatsText || 'NSP'}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{game.fileSize}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{game.downloads} unduhan</span>
          </div>

          {/* Title */}
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-100 transition-colors group-hover:text-white">
            {game.title}
          </h3>
        </div>
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between border-t border-slate-800/60 px-4 py-2.5 text-xs">
        <a
          href={game.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-slate-400 transition hover:text-slate-200"
        >
          <span>romsns.com</span>
          <ExternalLink className="h-3 w-3" />
        </a>

        <button
          onClick={() => onSelect(game)}
          disabled={isLoadingDetail}
          className="flex items-center gap-1 font-medium text-rose-400 transition group-hover:text-rose-300"
        >
          <span>{isLoadingDetail ? 'Memuat...' : 'Detail Data'}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </article>
  );
};
