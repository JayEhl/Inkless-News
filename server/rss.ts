import Parser from "rss-parser";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

// Create a parser instance with custom fields
export const rssParser = new Parser({
  customFields: {
    item: [
      "content:encoded",
      "description",
      "content",
      "summary",
      "author",
      "copyright",
      "rights",
      "image",
      "thumbnail"
    ],
    feed: [
      "copyright",
      "rights",
      "language",
      "image",
      "logo"
    ]
  }
});

// Type for RSS feed item
export interface RssItem {
  title: string;
  link?: string;
  pubDate?: string;
  creator?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  categories?: string[];
  isoDate?: string;
  author?: string;
  copyright?: string;
  rights?: string;
  image?: string;
  thumbnail?: string;
}

// Type for RSS feed
export interface RssFeed {
  title?: string;
  description?: string;
  link?: string;
  items: RssItem[];
  lastBuildDate?: string;
  pubDate?: string;
  copyright?: string;
  rights?: string;
  language?: string;
  image?: string;
  logo?: string;
}

// Check if an RSS item has truncated content
export function isTruncatedContent(item: RssItem): boolean {
  // If there's no content but there is a contentSnippet, it's likely truncated
  if (!item.content && item.contentSnippet) {
    return true;
  }
  
  // If content exists but is very short (less than 100 characters), it's likely truncated
  if (item.content && item.content.length < 100) {
    return true;
  }
  
  return false;
}

// Get the content exactly as provided by the publisher
export function getPublisherContent(item: RssItem): string {
  // Use content in the exact order provided by the publisher
  return item.content || item.contentSnippet || "";
}

// Fetch and parse an RSS feed
export async function fetchFeed(url: string): Promise<RssFeed> {
  try {
    const feed = await rssParser.parseURL(url);
    
    // Convert the feed to our interface, preserving all original content
    const rssFeed: RssFeed = {
      title: feed.title,
      description: feed.description,
      link: feed.link,
      items: feed.items.map(item => ({
        title: item.title || "Untitled",
        link: item.link,
        pubDate: item.pubDate,
        creator: item.creator,
        content: item["content:encoded"] || item.content,
        contentSnippet: item.contentSnippet,
        guid: item.guid,
        categories: item.categories,
        isoDate: item.isoDate,
        author: item.author,
        copyright: item.copyright,
        rights: item.rights,
        image: item.image,
        thumbnail: item.thumbnail
      })),
      lastBuildDate: feed.lastBuildDate,
      pubDate: feed.pubDate,
      copyright: feed.copyright,
      rights: feed.rights,
      language: feed.language,
      image: feed.image,
      logo: feed.logo
    };
    
    return rssFeed;
  } catch (error) {
    console.error(`Error fetching RSS feed from ${url}:`, error);
    throw new Error(`Failed to fetch or parse RSS feed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// Extract text content from HTML
export function extractTextFromHtml(html: string): string {
  // Simple regex to remove HTML tags - in a production app, use a proper HTML parser
  return html
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

// Get a clean, shortened version of HTML content for summarization
export function getCleanContent(content: string, maxLength: number = 2000): string {
  if (!content) return "";
  
  const text = extractTextFromHtml(content);
  
  // Truncate if necessary
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + "...";
  }
  
  return text;
}

// Common RSS feed paths to check
const COMMON_FEED_PATHS = [
  "/feed",
  "/rss",
  "/feed.xml",
  "/rss.xml",
  "/atom.xml",
  "/feed/rss",
  "/feed/atom",
  "/feed/rss2",
  "/feed/atom.xml",
  "/feed/rss.xml",
  "/feed/rss2.xml",
  "/feed/atom/rss",
  "/feed/atom/rss.xml",
  "/feed/atom/atom.xml",
  "/feed/atom/rss2.xml",
  "/feed/rss/atom",
  "/feed/rss/atom.xml",
  "/feed/rss/rss.xml",
  "/feed/rss/rss2.xml",
  "/feed/rss2/atom",
  "/feed/rss2/atom.xml",
  "/feed/rss2/rss.xml",
  "/feed/rss2/rss2.xml"
];

// Site-specific feed paths
const SITE_SPECIFIC_FEEDS: Record<string, string[]> = {
  "economist.com": [
    "/business/rss.xml",
    "/finance-and-economics/rss.xml",
    "/science-and-technology/rss.xml",
    "/international/rss.xml",
    "/culture/rss.xml",
    "/rss"
  ],
  "news24.com": [
    "/rss/feed/news24",
    "/rss/feed/sport24",
    "/rss/feed/fin24",
    "/rss/feed/health24",
    "/rss/feed/parent24",
    "/rss/feed/wheels24",
    "/rss/feed/food24",
    "/rss/feed/travel24",
    "/rss/feed/entertainment24",
    "/rss/feed/tech24"
  ]
};

// News24 specific feed categories
const NEWS24_FEED_CATEGORIES = [
  "news24",
  "sport24",
  "fin24",
  "health24",
  "parent24",
  "wheels24",
  "food24",
  "travel24",
  "entertainment24",
  "tech24"
];

// Detect RSS feed from a website URL
export async function detectRssFeed(websiteUrl: string): Promise<string | null> {
  try {
    // Normalize the URL
    const url = new URL(websiteUrl);
    const baseUrl = `${url.protocol}//${url.hostname}`;
    const hostname = url.hostname;
    
    // Special handling for The Economist
    if (hostname.includes("economist.com")) {
      // Try The Economist's feed paths
      for (const path of SITE_SPECIFIC_FEEDS["economist.com"]) {
        const feedUrl = `${baseUrl}${path}`;
        try {
          const feed = await rssParser.parseURL(feedUrl);
          if (feed) {
            return feedUrl;
          }
        } catch (error) {
          console.log(`Invalid Economist feed URL: ${feedUrl}`);
        }
      }
    }
    
    // First, try to find RSS feed links in the HTML
    const response = await fetch(websiteUrl);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Look for RSS feed links in the HTML
    const feedLinks = Array.from(document.querySelectorAll('link[type="application/rss+xml"], link[type="application/atom+xml"]'));
    for (const link of feedLinks) {
      const href = link.getAttribute('href');
      if (href) {
        // Handle relative URLs
        const feedUrl = new URL(href, baseUrl).toString();
        try {
          const feed = await rssParser.parseURL(feedUrl);
          if (feed) {
            return feedUrl;
          }
        } catch (error) {
          console.log(`Invalid feed URL: ${feedUrl}`);
        }
      }
    }
    
    // Try site-specific feed paths
    const siteSpecificPaths = SITE_SPECIFIC_FEEDS[hostname] || [];
    for (const path of siteSpecificPaths) {
      const feedUrl = `${baseUrl}${path}`;
      try {
        const feed = await rssParser.parseURL(feedUrl);
        if (feed) {
          return feedUrl;
        }
      } catch (error) {
        console.log(`Invalid feed URL: ${feedUrl}`);
      }
    }
    
    // If no site-specific paths found, try common feed paths
    for (const path of COMMON_FEED_PATHS) {
      const feedUrl = `${baseUrl}${path}`;
      try {
        const feed = await rssParser.parseURL(feedUrl);
        if (feed) {
          return feedUrl;
        }
      } catch (error) {
        console.log(`Invalid feed URL: ${feedUrl}`);
      }
    }
    
    // No valid feed found
    return null;
  } catch (error) {
    console.error(`Error detecting RSS feed for ${websiteUrl}:`, error);
    return null;
  }
}
