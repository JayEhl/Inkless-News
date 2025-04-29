import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { rssParser, fetchFeed } from "./rss";
import { summarizeArticle, isArticleRelevant, categorizeArticle, curateArticles } from "./openai";
import { sendEmailToKindle, generateNewsDocument } from "./email";
import { setupScheduledTasks } from "./cron";
import { format } from "date-fns";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);
  
  // Set up authentication routes
  setupAuth(app);

  // Schedule tasks for weekly delivery
  setupScheduledTasks();

  // Remove any existing root handler
  app._router.stack = app._router.stack.filter((layer: any) => {
    return layer.route?.path !== '/';
  });

  // API Routes
  // RSS Feeds
  app.get("/api/rss-feeds", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const feeds = await storage.getRssFeeds(req.user.id);
      res.json(feeds);
    } catch (error) {
      console.error("Error fetching RSS feeds:", error);
      res.status(500).json({ message: "Failed to fetch RSS feeds" });
    }
  });

  app.post("/api/rss-feeds", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }
      
      let feedUrl = url;
      
      // If the URL doesn't look like an RSS feed, try to detect it
      if (!url.match(/\.(xml|rss|atom|feed)$/i)) {
        console.log(`Attempting to detect RSS feed for website: ${url}`);
        const detectedFeed = await detectRssFeed(url);
        
        if (!detectedFeed) {
          // Check if it's a known site
          const urlObj = new URL(url);
          const hostname = urlObj.hostname;
          
          if (hostname.includes("economist.com")) {
            return res.status(400).json({ 
              message: "Site not Possible",
              details: "Please use one of these Economist feed URLs:\n" +
                "- https://www.economist.com/business/rss.xml (Business)\n" +
                "- https://www.economist.com/finance-and-economics/rss.xml (Finance)\n" +
                "- https://www.economist.com/science-and-technology/rss.xml (Science)\n" +
                "- https://www.economist.com/international/rss.xml (International)\n" +
                "- https://www.economist.com/culture/rss.xml (Culture)"
            });
          } else if (hostname.includes("news24.com")) {
            return res.status(400).json({ 
              message: "Site not Possible",
              details: "Please use one of these News24 feed URLs:\n" +
                "- https://www.news24.com/rss/feed/news24 (Main news)\n" +
                "- https://www.news24.com/rss/feed/sport24 (Sports)\n" +
                "- https://www.news24.com/rss/feed/fin24 (Finance)\n" +
                "- https://www.news24.com/rss/feed/health24 (Health)\n" +
                "- https://www.news24.com/rss/feed/parent24 (Parenting)\n" +
                "- https://www.news24.com/rss/feed/wheels24 (Motoring)\n" +
                "- https://www.news24.com/rss/feed/food24 (Food)\n" +
                "- https://www.news24.com/rss/feed/travel24 (Travel)\n" +
                "- https://www.news24.com/rss/feed/entertainment24 (Entertainment)\n" +
                "- https://www.news24.com/rss/feed/tech24 (Technology)"
            });
          }
          
          return res.status(400).json({ 
            message: "Site not Possible",
            details: "No RSS feed found for this website. The site may not provide an RSS feed or it may be using a non-standard format."
          });
        }
        
        feedUrl = detectedFeed;
        console.log(`Detected RSS feed: ${feedUrl}`);
      }
      
      // Validate that the URL is a valid RSS feed
      try {
        const feed = await fetchFeed(feedUrl);
        if (!feed || !feed.items || feed.items.length === 0) {
          return res.status(400).json({ 
            message: "Invalid RSS feed URL",
            details: "The feed appears to be empty or invalid."
          });
        }
      } catch (error) {
        return res.status(400).json({ 
          message: "Invalid RSS feed URL",
          details: "The provided URL is not a valid RSS feed."
        });
      }
      
      const feed = await storage.addRssFeed(req.user.id, feedUrl);
      res.status(201).json(feed);
    } catch (error) {
      console.error("Error adding RSS feed:", error);
      res.status(500).json({ message: "Failed to add RSS feed" });
    }
  });

  app.delete("/api/rss-feeds/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const feedId = parseInt(req.params.id);
      if (isNaN(feedId)) {
        return res.status(400).json({ message: "Invalid feed ID" });
      }
      
      await storage.removeRssFeed(feedId, req.user.id);
      res.status(200).json({ message: "RSS feed removed successfully" });
    } catch (error) {
      console.error("Error removing RSS feed:", error);
      res.status(500).json({ message: "Failed to remove RSS feed" });
    }
  });

  // Topics
  app.get("/api/topics", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const topics = await storage.getTopics(req.user.id);
      res.json(topics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  app.post("/api/topics", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Topic name is required" });
      }
      
      // Check if topic already exists for this user
      const existingTopics = await storage.getTopics(req.user.id);
      if (existingTopics.some(t => t.name.toLowerCase() === name.toLowerCase())) {
        return res.status(400).json({ message: "Topic already exists" });
      }
      
      const topic = await storage.addTopic(req.user.id, name);
      res.status(201).json(topic);
    } catch (error) {
      console.error("Error adding topic:", error);
      res.status(500).json({ message: "Failed to add topic" });
    }
  });

  app.delete("/api/topics/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const topicId = parseInt(req.params.id);
      if (isNaN(topicId)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }
      
      await storage.removeTopic(topicId, req.user.id);
      res.status(200).json({ message: "Topic removed successfully" });
    } catch (error) {
      console.error("Error removing topic:", error);
      res.status(500).json({ message: "Failed to remove topic" });
    }
  });

  // Kindle Settings
  app.get("/api/kindle-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const settings = await storage.getKindleSettings(req.user.id);
      if (!settings) {
        // Create default settings if none exist
        const defaultSettings = await storage.updateKindleSettings(req.user.id, {
          email: req.user.email,
          active: true,
          deliveryTime: 8,
          format: "pdf"
        });
        return res.json(defaultSettings);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching Kindle settings:", error);
      res.status(500).json({ message: "Failed to fetch Kindle settings" });
    }
  });

  app.patch("/api/kindle-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const settingsSchema = z.object({
        email: z.string().email().optional(),
        active: z.boolean().optional(),
        deliveryTime: z.number().min(5).max(12).optional(),
        format: z.enum(["pdf", "mobi", "epub"]).optional()
      });
      
      const validatedData = settingsSchema.parse(req.body);
      const settings = await storage.updateKindleSettings(req.user.id, validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error updating Kindle settings:", error);
      res.status(500).json({ message: "Failed to update Kindle settings" });
    }
  });

  // Article Preview
  app.get("/api/articles/preview", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      // Get up to 6 most recent articles for preview
      const articles = await storage.getArticles(req.user.id);
      const previewArticles = articles.slice(0, 6);
      
      if (previewArticles.length === 0) {
        // If no articles in storage, generate some preview ones from RSS feeds
        const feeds = await storage.getRssFeeds(req.user.id);
        const topics = await storage.getTopics(req.user.id);
        
        if (feeds.length > 0) {
          const sampleArticles = [];
          for (const feed of feeds.slice(0, 2)) { // Only check the first 2 feeds for performance
            try {
              const feedData = await fetchFeed(feed.url);
              const feedItems = feedData.items.slice(0, 3); // Get 3 items from each feed
              
              for (const item of feedItems) {
                // Generate a category for the article
                const topicNames = topics.map(t => t.name);
                const category = topics.length > 0 
                  ? await categorizeArticle(item.title, item.content || item.contentSnippet || "", topicNames)
                  : "General";
                
                // Check if content is truncated
                const isTruncated = isTruncatedContent(item);
                
                // Use content exactly as provided by the publisher
                const content = getPublisherContent(item);
                
                // For preview, use the publisher's content as is
                const summary = content;
                
                sampleArticles.push({
                  title: item.title,
                  summary,
                  source: feedData.title || feed.url.split("/")[2] || "RSS Feed",
                  url: item.link,
                  category,
                  date: format(new Date(item.pubDate || new Date()), "MMMM d, yyyy"),
                  isTruncated,
                  author: item.creator || item.author || "",
                  copyright: feedData.copyright || feedData.rights || ""
                });
              }
            } catch (error) {
              console.error(`Error fetching preview from feed ${feed.url}:`, error);
              // Continue with other feeds
            }
          }
          
          return res.json(sampleArticles);
        } else {
          // No feeds or articles, return an empty array
          return res.json([]);
        }
      }
      
      // Format articles for the frontend
      const formattedArticles = previewArticles.map(article => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        source: article.source,
        url: article.url,
        category: article.category,
        date: format(new Date(article.createdAt), "MMMM d, yyyy"),
        isTruncated: article.isTruncated,
        author: article.author,
        copyright: article.copyright
      }));
      
      res.json(formattedArticles);
    } catch (error) {
      console.error("Error fetching article previews:", error);
      res.status(500).json({ message: "Failed to fetch article previews" });
    }
  });

  // Next Delivery Info
  app.get("/api/delivery/next", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const settings = await storage.getKindleSettings(req.user.id);
      
      if (!settings) {
        return res.status(404).json({ message: "Kindle settings not found" });
      }
      
      // Calculate next Sunday
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek; // If today is Sunday, it's next Sunday
      const nextSunday = new Date(today);
      nextSunday.setDate(today.getDate() + daysUntilSunday);
      
      // Format the date and time
      const formattedDate = format(nextSunday, "MMMM d, yyyy");
      const formattedTime = `${settings.deliveryTime}:00 AM`;
      
      const nextDelivery = {
        date: formattedDate,
        time: formattedTime,
        status: settings.active ? "Scheduled" : "Pending",
        email: settings.email
      };
      
      res.json(nextDelivery);
    } catch (error) {
      console.error("Error fetching next delivery info:", error);
      res.status(500).json({ message: "Failed to fetch next delivery info" });
    }
  });

  // Delivery History
  app.get("/api/delivery/history", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const history = await storage.getDeliveryHistory(req.user.id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching delivery history:", error);
      res.status(500).json({ message: "Failed to fetch delivery history" });
    }
  });

  // Test Delivery
  app.post("/api/delivery/test", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      // Get user's settings
      const settings = await storage.getKindleSettings(req.user.id);
      
      if (!settings || !settings.email) {
        return res.status(400).json({ message: "Kindle email not configured" });
      }
      
      // Fetch feeds and topics
      const feeds = await storage.getRssFeeds(req.user.id);
      const topics = await storage.getTopics(req.user.id);
      
      if (feeds.length === 0) {
        return res.status(400).json({ message: "No RSS feeds configured" });
      }
      
      // Get articles from feeds
      const topicNames = topics.map(t => t.name);
      const articles = [];
      
      // Limit to 3 feeds for test delivery
      for (const feed of feeds.slice(0, 3)) {
        try {
          const feedData = await fetchFeed(feed.url);
          const feedItems = feedData.items.slice(0, 5); // Get 5 items per feed for test
          
          for (const item of feedItems) {
            const content = item.content || item.contentSnippet || "";
            articles.push({
              title: item.title,
              content,
              url: item.link,
              source: feedData.title || feed.url.split("/")[2] || "RSS Feed"
            });
          }
        } catch (error) {
          console.error(`Error fetching feed ${feed.url}:`, error);
          // Continue with other feeds
        }
      }
      
      if (articles.length === 0) {
        return res.status(400).json({ message: "Could not fetch any articles from your feeds" });
      }
      
      // Curate articles
      const curated = await curateArticles(articles, topicNames, 10);
      
      // Generate summaries
      const articlesWithSummaries = await Promise.all(
        curated.selected.map(async article => {
          const summary = await summarizeArticle(article.title, article.content);
          return {
            ...article,
            summary
          };
        })
      );
      
      // Generate document based on format (PDF/MOBI)
      const document = await generateNewsDocument(articlesWithSummaries, {
        username: req.user.username,
        date: format(new Date(), "MMMM d, yyyy"),
        format: settings.format
      });
      
      // Send to Kindle
      await sendEmailToKindle({
        to: settings.email,
        name: req.user.username,
        document,
        format: settings.format
      });
      
      // Create a delivery history entry
      await storage.addDeliveryHistory({
        date: new Date(),
        status: "Sent",
        articlesCount: articlesWithSummaries.length,
        format: settings.format,
        userId: req.user.id
      });
      
      res.status(200).json({ message: "Test delivery sent successfully" });
    } catch (error) {
      console.error("Error sending test delivery:", error);
      res.status(500).json({ message: "Failed to send test delivery: " + (error instanceof Error ? error.message : "Unknown error") });
    }
  });

  // Send Delivery Now
  app.post("/api/delivery/now", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      // Get user's settings
      const settings = await storage.getKindleSettings(req.user.id);
      
      if (!settings || !settings.email) {
        return res.status(400).json({ message: "Kindle email not configured" });
      }
      
      // Fetch feeds and topics
      const feeds = await storage.getRssFeeds(req.user.id);
      const topics = await storage.getTopics(req.user.id);
      
      if (feeds.length === 0) {
        return res.status(400).json({ message: "No RSS feeds configured" });
      }
      
      // Get articles from feeds
      const topicNames = topics.map(t => t.name);
      const articles = [];
      
      for (const feed of feeds) {
        try {
          const feedData = await fetchFeed(feed.url);
          // Get more items for a regular delivery
          const feedItems = feedData.items.slice(0, 10); 
          
          for (const item of feedItems) {
            const content = item.content || item.contentSnippet || "";
            articles.push({
              title: item.title,
              content,
              url: item.link,
              source: feedData.title || feed.url.split("/")[2] || "RSS Feed"
            });
          }
        } catch (error) {
          console.error(`Error fetching feed ${feed.url}:`, error);
          // Continue with other feeds
        }
      }
      
      if (articles.length === 0) {
        return res.status(400).json({ message: "Could not fetch any articles from your feeds" });
      }
      
      // Curate articles - use more articles for a full delivery
      const curated = await curateArticles(articles, topicNames, 10);
      
      // Generate summaries
      const articlesWithSummaries = await Promise.all(
        curated.selected.map(async article => {
          const summary = await summarizeArticle(article.title, article.content);
          return {
            ...article,
            summary
          };
        })
      );
      
      // Generate document based on format (PDF/MOBI/EPUB)
      const document = await generateNewsDocument(articlesWithSummaries, {
        username: req.user.username,
        date: format(new Date(), "MMMM d, yyyy"),
        format: settings.format
      });
      
      // Send to Kindle
      await sendEmailToKindle({
        to: settings.email,
        name: req.user.username,
        document,
        format: settings.format
      });
      
      // Create a delivery history entry
      await storage.addDeliveryHistory({
        date: new Date(),
        status: "Sent",
        articlesCount: articlesWithSummaries.length,
        format: settings.format,
        userId: req.user.id
      });
      
      // Store selected articles in the database
      for (const article of articlesWithSummaries) {
        // Check if article already exists to avoid duplicates
        const existingArticle = await storage.getArticleByUrl(article.url, req.user.id);
        if (!existingArticle) {
          await storage.addArticle({
            title: article.title,
            summary: article.summary,
            source: article.source,
            url: article.url,
            category: article.category || "General",
            userId: req.user.id
          });
        }
      }
      
      res.status(200).json({ message: "Delivery sent successfully" });
    } catch (error) {
      console.error("Error sending delivery:", error);
      res.status(500).json({ message: "Failed to send delivery: " + (error instanceof Error ? error.message : "Unknown error") });
    }
  });

  // Save All Settings
  app.post("/api/settings/save-all", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      // This endpoint doesn't do anything special since all settings are saved individually
      // But it provides a way for the frontend to trigger a "save all" action
      res.status(200).json({ message: "All settings saved successfully" });
    } catch (error) {
      console.error("Error saving all settings:", error);
      res.status(500).json({ message: "Failed to save all settings" });
    }
  });

  // Search RSS feeds
  app.post("/api/rss-feeds/search", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const { query, topic } = req.body;
      
      if (!query || !topic) {
        return res.status(400).json({ message: "Query and topic are required" });
      }
      
      // Search for RSS feeds using the query and topic
      const searchResults = await searchRssFeeds(query, topic);
      res.json(searchResults);
    } catch (error) {
      console.error("Error searching RSS feeds:", error);
      res.status(500).json({ message: "Failed to search RSS feeds" });
    }
  });

  return server;
}
