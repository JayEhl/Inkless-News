import fetch from "node-fetch";
import { detectRssFeed } from "./rss";

interface SearchResult {
  name: string;
  url: string;
}

export async function searchRssFeeds(query: string, topic: string): Promise<SearchResult[]> {
  try {
    // Combine the search query with the topic for better results
    const searchQuery = `${query} ${topic} site:rss.com OR site:feedburner.com OR site:feedly.com`;
    
    // Use a search API to find potential RSS feeds
    const response = await fetch(`https://api.search.com/search?q=${encodeURIComponent(searchQuery)}`);
    const data = await response.json();
    
    // Process the search results
    const results: SearchResult[] = [];
    const processedUrls = new Set<string>();
    
    for (const result of data.results || []) {
      if (result.url && !processedUrls.has(result.url)) {
        processedUrls.add(result.url);
        
        // Try to detect the RSS feed URL
        const feedUrl = await detectRssFeed(result.url);
        if (feedUrl) {
          results.push({
            name: result.title || new URL(result.url).hostname,
            url: feedUrl
          });
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error("Error searching RSS feeds:", error);
    throw new Error("Failed to search RSS feeds");
  }
} 