export interface Article {
  id?: number;
  title: string;
  summary: string;
  source: string;
  url: string;
  category: string;
  date?: string;
  isTruncated?: boolean;
  author?: string;
  copyright?: string;
} 