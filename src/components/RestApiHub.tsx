import React, { useState } from 'react';
import {
  Send,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Download,
  Terminal,
  Clock,
  Layers,
} from 'lucide-react';

interface EndpointConfig {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  title: string;
  description: string;
  defaultParams?: Record<string, string>;
  defaultBody?: string;
  sampleId?: string;
}

export const RestApiHub: React.FC = () => {
  const [activeEndpointId, setActiveEndpointId] = useState<string>('list');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<'curl' | 'js' | 'python'>('curl');

  // Interactive Request State
  const [queryParams, setQueryParams] = useState<Record<string, string>>({
    search: 'mario',
    page: '1',
    category: '',
  });
  const [slugParam, setSlugParam] = useState('hot-wheels-unleashed-2-turbocharged-switch-nsp-xci');
  const [dlarchiveUrlParam, setDlarchiveUrlParam] = useState(
    'https://dlarchive.my.id/?post_type=roms&p=1493'
  );
  const [jsonBody, setJsonBody] = useState(
    JSON.stringify(
      {
        url: 'https://romsns.com/',
        selector: '.rgc-title-in',
      },
      null,
      2
    )
  );

  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const endpoints: EndpointConfig[] = [
    {
      id: 'list',
      method: 'GET',
      path: '/api/v1/games',
      title: 'Daftar Game & Pencarian',
      description: 'Mengekstrak daftar game terpaginasi, mendukung pencarian kata kunci dan filter genre.',
      defaultParams: { search: 'mario', page: '1', category: '' },
    },
    {
      id: 'popular',
      method: 'GET',
      path: '/api/v1/games/popular',
      title: 'Game Terpopuler',
      description: 'Mengambil daftar game Nintendo Switch terpopuler saat ini yang tercatat di romsns.com.',
    },
    {
      id: 'categories',
      method: 'GET',
      path: '/api/v1/games/categories',
      title: 'Kategori / Genre',
      description: 'Mendapatkan daftar lengkap genre (Action, Adventure, RPG, Strategy, Fighting, dll).',
    },
    {
      id: 'detail',
      method: 'GET',
      path: '/api/v1/games/:id',
      title: 'Detail Game Lengkap',
      description: 'Mengekstrak spesifikasi ROM (Size, Region, DLC), tautan download, dan alur cerita.',
      sampleId: 'hot-wheels-unleashed-2-turbocharged-switch-nsp-xci',
    },
    {
      id: 'download',
      method: 'GET',
      path: '/api/v1/games/:id/download',
      title: 'Link Download & Ukuran ROM',
      description: 'Endpoint cepat yang hanya mengembalikan tautan unduh langsung dan ukuran file.',
      sampleId: 'hot-wheels-unleashed-2-turbocharged-switch-nsp-xci',
    },
    {
      id: 'mirrors',
      method: 'GET',
      path: '/api/v1/games/:id/mirrors',
      title: 'Scrape Mirror Link Download (dlarchive)',
      description: 'Mengekstrak seluruh mirror download (Fast Drive, Terabox, Filedon, Rush, Parted) langsung dari website penyedia link.',
      sampleId: 'hot-wheels-unleashed-2-turbocharged-switch-nsp-xci',
    },
    {
      id: 'dlarchive',
      method: 'GET',
      path: '/api/v1/scrape/download-page',
      title: 'Scrape Halaman dlarchive Langsung',
      description: 'Mengekstrak paket mirror dari tautan URL dlarchive.my.id manapun secara langsung.',
    },
    {
      id: 'selector',
      method: 'POST',
      path: '/api/v1/scrape/selector',
      title: 'Custom CSS Selector Scraper',
      description: 'Mengekstrak elemen DOM kustom apapun di romsns.com secara dinamis.',
      defaultBody: JSON.stringify(
        {
          url: 'https://romsns.com/',
          selector: '.rgc-title-in',
        },
        null,
        2
      ),
    },
  ];

  const currentEndpoint = endpoints.find((e) => e.id === activeEndpointId) || endpoints[0];

  // Construct active execution URL
  const buildRequestUrl = () => {
    let resolvedPath = currentEndpoint.path;
    if (resolvedPath.includes(':id')) {
      resolvedPath = resolvedPath.replace(':id', encodeURIComponent(slugParam.trim() || 'game'));
    }

    if (currentEndpoint.method === 'GET' && currentEndpoint.id === 'list') {
      const sp = new URLSearchParams();
      if (queryParams.page && queryParams.page !== '1') sp.set('page', queryParams.page);
      if (queryParams.search) sp.set('search', queryParams.search);
      if (queryParams.category) sp.set('category', queryParams.category);
      const qStr = sp.toString();
      if (qStr) resolvedPath += `?${qStr}`;
    }

    if (currentEndpoint.id === 'dlarchive') {
      resolvedPath += `?url=${encodeURIComponent(dlarchiveUrlParam.trim())}`;
    }

    return resolvedPath;
  };

  const fullUrl = `${baseUrl}${buildRequestUrl()}`;

  // Execute Request Live
  const handleExecuteRequest = async () => {
    setIsLoading(true);
    setResponseData(null);
    setResponseStatus(null);
    setResponseTime(null);

    const startTime = performance.now();

    try {
      const options: RequestInit = {
        method: currentEndpoint.method,
        headers: {
          Accept: 'application/json',
          ...(currentEndpoint.method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(currentEndpoint.method === 'POST' ? { body: jsonBody } : {}),
      };

      const res = await fetch(buildRequestUrl(), options);
      const elapsed = Math.round(performance.now() - startTime);

      setResponseStatus(res.status);
      setResponseTime(elapsed);

      // Collect some headers
      const headersMap: Record<string, string> = {};
      headersMap['content-type'] = res.headers.get('content-type') || 'application/json';
      setResponseHeaders(headersMap);

      const json = await res.json();
      setResponseData(json);
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData({ error: err.message || 'Gagal menghubungi endpoint API' });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate code snippet
  const generateSnippet = () => {
    if (codeLanguage === 'curl') {
      if (currentEndpoint.method === 'POST') {
        return `curl -X POST "${fullUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${jsonBody.replace(/\n\s*/g, '')}'`;
      }
      return `curl -X GET "${fullUrl}" \\
  -H "Accept: application/json"`;
    }

    if (codeLanguage === 'js') {
      if (currentEndpoint.method === 'POST') {
        return `const response = await fetch("${fullUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${jsonBody})
});
const data = await response.json();
console.log(data);`;
      }
      return `const response = await fetch("${fullUrl}");
const data = await response.json();
console.log(data);`;
    }

    if (codeLanguage === 'python') {
      if (currentEndpoint.method === 'POST') {
        return `import requests

url = "${fullUrl}"
payload = ${jsonBody.replace(/true/g, 'True').replace(/false/g, 'False')}

response = requests.post(url, json=payload)
data = response.json()
print(data)`;
      }
      return `import requests

url = "${fullUrl}"
response = requests.get(url)
data = response.json()
print(data)`;
    }

    return '';
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(generateSnippet());
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Base URL */}
      <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
                v1.0.0
              </span>
              <h2 className="text-base font-bold text-white">
                Public REST API Hub
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Endpoint REST API publik berstandar JSON untuk mengekstrak data game Nintendo Switch langsung dari romsns.com. Lengkap dengan CORS aktif dan caching cepat.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/api/v1/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0b0f19] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:text-white"
            >
              <Download className="h-3.5 w-3.5 text-rose-400" />
              <span>OpenAPI 3.0 Spec</span>
            </a>
          </div>
        </div>

        {/* Base URL Box */}
        <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-800 bg-[#0b0f19] px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-slate-500 shrink-0 font-medium">Base URL:</span>
            <code className="font-mono text-slate-200 truncate">{baseUrl}/api/v1</code>
          </div>

          <button
            onClick={copyUrl}
            className="flex items-center gap-1 text-slate-400 hover:text-white shrink-0 ml-2"
          >
            {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="text-[11px]">{copiedUrl ? 'Tersalin' : 'Salin URL'}</span>
          </button>
        </div>
      </div>

      {/* Main Console Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Endpoint Navigation List */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 block mb-2">
            Pilih Endpoint
          </span>

          <div className="space-y-1.5">
            {endpoints.map((ep) => (
              <button
                key={ep.id}
                onClick={() => {
                  setActiveEndpointId(ep.id);
                  setResponseData(null);
                  setResponseStatus(null);
                }}
                className={`w-full text-left rounded-lg p-3 transition border ${
                  activeEndpointId === ep.id
                    ? 'border-rose-500/50 bg-[#162035] text-white shadow-sm'
                    : 'border-slate-800/80 bg-[#111827] text-slate-300 hover:border-slate-700 hover:bg-[#141d2f]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold font-mono ${
                      ep.method === 'GET'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-200">
                    {ep.path}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  {ep.title}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Endpoint Inspector & Live Tester */}
        <div className="lg:col-span-8 space-y-5">
          {/* Active Endpoint Card */}
          <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-mono font-bold ${
                    currentEndpoint.method === 'GET'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}
                >
                  {currentEndpoint.method}
                </span>
                <h3 className="text-sm font-bold text-white font-mono">
                  {currentEndpoint.path}
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                {currentEndpoint.description}
              </p>
            </div>

            {/* Parameter Controls */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              {/* Route: /api/v1/games (Query Params) */}
              {currentEndpoint.id === 'list' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      search (query)
                    </label>
                    <input
                      type="text"
                      value={queryParams.search}
                      onChange={(e) => setQueryParams({ ...queryParams, search: e.target.value })}
                      placeholder="mario, zelda"
                      className="w-full rounded-md border border-slate-800 bg-[#0b0f19] px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      category (slug)
                    </label>
                    <input
                      type="text"
                      value={queryParams.category}
                      onChange={(e) => setQueryParams({ ...queryParams, category: e.target.value })}
                      placeholder="action, rpg"
                      className="w-full rounded-md border border-slate-800 bg-[#0b0f19] px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      page (nomor)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={queryParams.page}
                      onChange={(e) => setQueryParams({ ...queryParams, page: e.target.value })}
                      className="w-full rounded-md border border-slate-800 bg-[#0b0f19] px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Route: /api/v1/games/:id (detail, download, mirrors) */}
              {(currentEndpoint.id === 'detail' || currentEndpoint.id === 'download' || currentEndpoint.id === 'mirrors') && (
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    :id (Slug Game dari URL)
                  </label>
                  <input
                    type="text"
                    value={slugParam}
                    onChange={(e) => setSlugParam(e.target.value)}
                    placeholder="hot-wheels-unleashed-2-turbocharged-switch-nsp-xci"
                    className="w-full rounded-md border border-slate-800 bg-[#0b0f19] px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Route: /api/v1/scrape/download-page */}
              {currentEndpoint.id === 'dlarchive' && (
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    url (Tautan Halaman dlarchive.my.id)
                  </label>
                  <input
                    type="url"
                    value={dlarchiveUrlParam}
                    onChange={(e) => setDlarchiveUrlParam(e.target.value)}
                    placeholder="https://dlarchive.my.id/?post_type=roms&p=1493"
                    className="w-full rounded-md border border-slate-800 bg-[#0b0f19] px-3 py-1.5 text-xs font-mono text-rose-300 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Route: POST /api/v1/scrape/selector */}
              {currentEndpoint.id === 'selector' && (
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Request Body (JSON)
                  </label>
                  <textarea
                    rows={4}
                    value={jsonBody}
                    onChange={(e) => setJsonBody(e.target.value)}
                    className="w-full rounded-md border border-slate-800 bg-[#0b0f19] p-3 text-xs font-mono text-cyan-300 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Execution Action Button */}
              <div className="flex items-center justify-between pt-2">
                <span className="font-mono text-[11px] text-slate-400 truncate max-w-md">
                  {fullUrl}
                </span>

                <button
                  onClick={handleExecuteRequest}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:opacity-50 shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isLoading ? 'Mengirim Request...' : 'Uji Endpoint Live'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Response Inspector Box */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0b0f19] overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-2.5 bg-[#111827]">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300">Live Response</span>

                {responseStatus !== null && (
                  <span
                    className={`rounded px-2 py-0.5 text-[11px] font-mono font-bold ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {responseStatus} OK
                  </span>
                )}

                {responseTime !== null && (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <Clock className="h-3 w-3 text-slate-500" />
                    <span>{responseTime}ms</span>
                  </span>
                )}
              </div>

              {responseData && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
                    setCopiedSnippet(true);
                    setTimeout(() => setCopiedSnippet(false), 2000);
                  }}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                >
                  {copiedSnippet ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedSnippet ? 'Tersalin' : 'Salin JSON'}</span>
                </button>
              )}
            </div>

            <div className="p-4">
              {isLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent mx-auto mb-2" />
                  <span>Mengambil data dari romsns.com secara server-side...</span>
                </div>
              ) : responseData ? (
                <pre className="max-h-[420px] overflow-auto font-mono text-xs text-slate-200 leading-relaxed">
                  {JSON.stringify(responseData, null, 2)}
                </pre>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500">
                  Klik tombol <strong>&quot;Uji Endpoint Live&quot;</strong> di atas untuk memanggil endpoint dan melihat respons JSON secara langsung.
                </div>
              )}
            </div>
          </div>

          {/* Integration Code Snippets (cURL / JS / Python) */}
          <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Code2 className="h-4 w-4 text-rose-400" />
                <span>Contoh Kode Integrasi</span>
              </span>

              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setCodeLanguage('curl')}
                  className={`px-2 py-1 rounded transition ${
                    codeLanguage === 'curl' ? 'bg-[#1e293b] text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setCodeLanguage('js')}
                  className={`px-2 py-1 rounded transition ${
                    codeLanguage === 'js' ? 'bg-[#1e293b] text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  JavaScript
                </button>
                <button
                  onClick={() => setCodeLanguage('python')}
                  className={`px-2 py-1 rounded transition ${
                    codeLanguage === 'python' ? 'bg-[#1e293b] text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Python
                </button>

                <button
                  onClick={copySnippet}
                  className="ml-2 flex items-center gap-1 rounded bg-[#0b0f19] border border-slate-800 px-2 py-1 text-slate-300 hover:text-white"
                >
                  {copiedSnippet ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>Salin</span>
                </button>
              </div>
            </div>

            <pre className="overflow-x-auto rounded-lg bg-[#0b0f19] p-3 font-mono text-xs text-rose-300 leading-relaxed border border-slate-800/80">
              <code>{generateSnippet()}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
