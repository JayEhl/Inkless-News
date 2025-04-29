import { SuggestionsMap } from "@/types";

// Map of topics to popular RSS feeds
export const rssFeedMapping: SuggestionsMap = {
  "technology": [
    { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
    { name: "Wired", url: "https://www.wired.com/feed/rss" },
    { name: "Ars Technica", url: "https://arstechnica.com/feed/" },
    { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
    { name: "MIT Technology Review", url: "https://www.technologyreview.com/feed/" }
  ],
  "business": [
    { name: "Forbes", url: "https://www.forbes.com/business/feed/" },
    { name: "Financial Times", url: "https://www.ft.com/rss/home" },
    { name: "The Economist", url: "https://www.economist.com/business/rss.xml" },
    { name: "Harvard Business Review", url: "https://hbr.org/feed" },
    { name: "Bloomberg", url: "https://www.bloomberg.com/feed/technology/feed.xml" }
  ],
  "science": [
    { name: "Nature", url: "https://www.nature.com/nature.rss" },
    { name: "Scientific American", url: "https://www.scientificamerican.com/rss/" },
    { name: "Science Daily", url: "https://www.sciencedaily.com/rss/top/science.xml" },
    { name: "New Scientist", url: "https://www.newscientist.com/feed/home/" },
    { name: "AAAS Science", url: "https://www.science.org/rss/news_current.xml" }
  ],
  "sports": [
    { name: "ESPN", url: "https://www.espn.com/espn/rss/news" },
    { name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml" },
    { name: "Sports Illustrated", url: "https://www.si.com/rss/si_main" },
    { name: "Bleacher Report", url: "https://bleacherreport.com/articles/feed" },
    { name: "The Athletic", url: "https://theathletic.com/rss-feed/" }
  ],
  "politics": [
    { name: "Politico", url: "https://www.politico.com/rss/politicopicks.xml" },
    { name: "The Hill", url: "https://thehill.com/news/feed/" },
    { name: "NPR Politics", url: "https://feeds.npr.org/1014/rss.xml" },
    { name: "BBC Politics", url: "https://feeds.bbci.co.uk/news/politics/rss.xml" },
    { name: "Reuters Politics", url: "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best" }
  ],
  "entertainment": [
    { name: "Variety", url: "https://variety.com/feed/" },
    { name: "Hollywood Reporter", url: "https://www.hollywoodreporter.com/feed/" },
    { name: "Entertainment Weekly", url: "https://ew.com/feed/" },
    { name: "Deadline", url: "https://deadline.com/feed/" },
    { name: "Rolling Stone", url: "https://www.rollingstone.com/feed/" }
  ],
  "health": [
    { name: "WebMD", url: "https://rssfeeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC" },
    { name: "Medical News Today", url: "https://www.medicalnewstoday.com/newsfeeds/rss/medical" },
    { name: "Harvard Health", url: "https://www.health.harvard.edu/blog/feed" },
    { name: "CDC", url: "https://tools.cdc.gov/api/v2/resources/media/132608.rss" },
    { name: "NIH News", url: "https://www.nih.gov/news-events/news-releases/feed.xml" }
  ]
};

// Function to get suggested feeds for a given topic
export function getSuggestedFeeds(topic: string): FeedSuggestion[] {
  const normalizedTopic = topic.toLowerCase().trim();
  
  // Check if the exact topic exists in our mapping
  if (rssFeedMapping[normalizedTopic]) {
    return rssFeedMapping[normalizedTopic];
  }
  
  // Check if the topic is a partial match of any keys
  for (const [key, feeds] of Object.entries(rssFeedMapping)) {
    if (key.toLowerCase().includes(normalizedTopic) || 
        normalizedTopic.includes(key.toLowerCase())) {
      return feeds;
    }
  }
  
  // If no match is found, return an empty array
  return [];
}

export interface FeedSuggestion {
  name: string;
  url: string;
}
