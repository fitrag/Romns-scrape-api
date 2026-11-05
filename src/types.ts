export interface GameCardItem {
  id: string;
  title: string;
  url: string;
  coverImage: string;
  fileSize: string;
  downloads: string;
  formats: string[];
}

export interface PopularGameItem {
  id: string;
  title: string;
  url: string;
  coverImage: string;
  rating: string;
  format: string;
  fileSize: string;
  downloads: string;
}

export interface ScrapeListResult {
  sourceUrl: string;
  query?: string;
  category?: string;
  page: number;
  totalPages: number;
  totalGamesOnPage: number;
  games: GameCardItem[];
  popular: PopularGameItem[];
  categories: { name: string; slug: string }[];
  scrapedAt: string;
}

export interface ContentSection {
  heading: string;
  text: string;
  listItems?: string[];
}

export interface DownloadMirror {
  server: string;
  url: string;
  part?: string;
  isDirect: boolean;
}

export interface DownloadPackage {
  cardTitle: string;
  packageTitle: string;
  fileType?: string;
  fileSize?: string;
  mirrors: DownloadMirror[];
}

export interface ScrapedDownloadPageResult {
  downloadPageUrl: string;
  postTitle: string;
  packages: DownloadPackage[];
  totalMirrorsFound: number;
  scrapedAt: string;
}

export interface GameDetailResult {
  id: string;
  url: string;
  title: string;
  cleanTitle: string;
  coverImage: string;
  tableInfo: {
    size?: string;
    available?: string;
    region?: string;
    [key: string]: string | undefined;
  };
  downloadLink: string;
  downloadCount: string;
  downloadPageData?: ScrapedDownloadPageResult | null;
  storyline?: string;
  gameplay?: string;
  features: string[];
  tips: string[];
  conclusion?: string;
  sections: ContentSection[];
  recommendedGames: { title: string; url: string }[];
  rawTableHtml?: string;
  scrapedAt: string;
}

export interface PlaygroundResult {
  url: string;
  selector: string;
  attribute: string | null;
  totalMatched: number;
  results: {
    index: number;
    text: string;
    attributeValue?: string;
    htmlSnippet: string;
  }[];
  pageTitle: string;
  scrapedAt: string;
}
