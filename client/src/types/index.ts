export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export interface RssFeed {
  id: number;
  url: string;
  userId: number;
}

export interface Topic {
  id: number;
  name: string;
  userId: number;
}

export interface KindleSettings {
  id: number;
  email: string;
  active: boolean;
  deliveryTime: number;
  format: 'pdf' | 'mobi';
  userId: number;
}

export interface FeedSuggestion {
  name: string;
  url: string;
}

export interface SuggestionsMap {
  [topic: string]: FeedSuggestion[];
}

export interface NextDelivery {
  date: string;
  time: string;
  status: 'Scheduled' | 'Pending' | 'Sent' | 'Failed';
  email: string;
}

export interface Article {
  id?: number;
  title: string;
  summary: string;
  source: string;
  url: string;
  category: string;
  date: string;
  userId?: number;
}

export interface DeliveryHistory {
  id: number;
  date: string;
  status: 'Sent' | 'Failed';
  articlesCount: number;
  format: 'pdf' | 'mobi';
  userId: number;
}
