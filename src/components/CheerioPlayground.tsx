import React, { useState } from 'react';
import { Play, Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { PlaygroundResult } from '../types.ts';

export const CheerioPlayground: React.FC = () => {
  const [url, setUrl] = useState('https://romsns.com/');
  const [selector, setSelector] = useState('.rgc-title-in');
  const [attribute, setAttribute] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const presets = [
    { label: 'Judul Game', sel: '.rgc-title-in', attr: '' },
    { label: 'Tautan ROM', sel: '.rgc-grid a.rgc-card', attr: 'href' },
    { label: 'Ukuran File', sel: '.rgc-badge-size', attr: '' },
    { label: 'Cover Poster', sel: '.rgc-thumb img', attr: 'src' },
    { label: 'Game Populer', sel: '.rpc-popular-card .rpc-title', attr: '' },
    { label: 'Tabel Info (Detail)', sel: '.idb-table tr', attr: '' },
  ];

  const handleRun = async (customSel?: string, customAttr?: string) => {
    const selToRun = customSel !== undefined ? customSel : selector;
    const attrToRun = customAttr !== undefined ? customAttr : attribute;

    if (!selToRun.trim()) {
      setError('Masukkan selector CSS terlebih dahulu');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/scrape/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          selector: selToRun.trim(),
          attribute: attrToRun.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Query selector gagal dieksekusi');
      }

      setResult(json.data);
    } catch (err: any) {
      setError(err.message || 'Gagal menghubungi server');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (p: typeof presets[0]) => {
    setSelector(p.sel);
    setAttribute(p.attr);
    handleRun(p.sel, p.attr);
  };

  const copyGeneratedCode = () => {
    const code = `import * as cheerio from 'cheerio';

const res = await fetch('${url}');
const html = await res.text();
const $ = cheerio.load(html);

$('${selector}').each((i, el) => {
  ${
    attribute
      ? `const val = $(el).attr('${attribute}');\n  console.log(val);`
      : `const text = $(el).text().trim();\n  console.log(text);`
  }
});`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Console Input Bar */}
      <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Cheerio DOM Inspector
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Uji selector CSS langsung terhadap dokumen HTML live dari romsns.com secara server-side.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 mr-1">Preset Cepat:</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(p)}
              className="rounded border border-slate-800 bg-[#0b0f19] px-2.5 py-1 text-slate-300 transition hover:border-slate-700 hover:text-white"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Target URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://romsns.com/"
              className="w-full rounded-lg border border-slate-800 bg-[#0b0f19] px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-4">
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              CSS Selector Cheerio
            </label>
            <input
              type="text"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              placeholder=".rgc-title-in, a.rgc-card"
              className="w-full rounded-lg border border-slate-800 bg-[#0b0f19] px-3 py-2 text-xs font-mono text-rose-400 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Atribut (Opsional)
            </label>
            <input
              type="text"
              value={attribute}
              onChange={(e) => setAttribute(e.target.value)}
              placeholder="href, src"
              className="w-full rounded-lg border border-slate-800 bg-[#0b0f19] px-3 py-2 text-xs font-mono text-cyan-400 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-1 flex items-end">
            <button
              onClick={() => handleRun()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-white" />
              )}
              <span>Jalankan</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-950/20 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Viewport */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2 tabular-nums">
              <span>
                Ditemukan <strong className="text-white">{result.totalMatched}</strong> elemen
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-300">{result.selector}</span>
            </div>

            <button
              onClick={copyGeneratedCode}
              className="flex items-center gap-1.5 rounded border border-slate-800 bg-[#111827] px-2.5 py-1 text-xs text-slate-300 transition hover:text-white hover:border-slate-700"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Tersalin' : 'Salin Skrip Node.js'}</span>
            </button>
          </div>

          {/* High Density Match Table */}
          <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-[#111827]">
            <div className="max-h-[480px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#0b0f19] border-b border-slate-800 font-mono text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-slate-500">#</th>
                    <th className="py-2.5 px-3">Teks Yang Diekstrak (.text())</th>
                    {result.attribute && (
                      <th className="py-2.5 px-3 text-cyan-400 font-medium">
                        Atribut: [{result.attribute}]
                      </th>
                    )}
                    <th className="py-2.5 px-3">HTML Snippet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {result.results.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500 font-sans">
                        Tidak ada elemen yang cocok dengan selector ini di URL tersebut.
                      </td>
                    </tr>
                  ) : (
                    result.results.map((item) => (
                      <tr key={item.index} className="hover:bg-[#141d2f]">
                        <td className="py-2 px-3 text-slate-500 tabular-nums">{item.index}</td>
                        <td className="py-2 px-3 font-semibold text-slate-100 max-w-sm truncate">
                          {item.text || '<kosong>'}
                        </td>
                        {result.attribute && (
                          <td className="py-2 px-3 text-cyan-300 max-w-xs truncate">
                            {item.attributeValue || '<null>'}
                          </td>
                        )}
                        <td className="py-2 px-3 text-slate-400 text-[11px] max-w-md truncate">
                          {item.htmlSnippet}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
