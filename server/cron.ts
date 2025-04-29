import cron from "node-cron";
import { storage } from "./storage";
import { fetchFeed, isTruncatedContent } from "./rss";
import { summarizeArticle, curateArticles, categorizeArticle } from "./openai";
import { generateNewsDocument, sendEmailToKindle } from "./email";
import { format } from "date-fns";

export function setupScheduledTasks() {
  // Schedule the weekly Sunday delivery
  // This runs at 12:00 AM every Sunday, then processes each user's delivery
  // at their specified delivery time
  cron.schedule("0 0 * * 0", async () => {
    console.log("Starting scheduled Sunday deliveries processing...");
    try {
      // Get all users with active Kindle settings
      const usersWithKindleSettings = await getAllUsersWithActiveKindleSettings();
      
      console.log(`Found ${usersWithKindleSettings.length} users with active Kindle settings`);
      
      // Schedule deliveries for each user based on their delivery time
      for (const userData of usersWithKindleSettings) {
        const { user, kindleSettings } = userData;
        
        // Schedule the delivery for the user's specified time
        // Hours are in 24-hour format (5-12 AM → 5-12)
        const deliveryHour = kindleSettings.deliveryTime;
        
        // Schedule the delivery for the specific hour
        cron.schedule(`0 ${deliveryHour} * * 0`, async () => {
          console.log(`Delivering newspaper to user ${user.id} (${user.email}) at ${deliveryHour}:00 AM`);
          try {
            await processUserDelivery(user.id);
          } catch (error) {
            console.error(`Failed to deliver newspaper to user ${user.id}:`, error);
          }
        }, {
          scheduled: true,
          timezone: "UTC" // Consider user's timezone in a production app
        });
      }
    } catch (error) {
      console.error("Error scheduling Sunday deliveries:", error);
    }
  });
}

async function getAllUsersWithActiveKindleSettings() {
  // In a real application, you would have a more efficient way to query
  // all users with active Kindle settings. Here we'll do a simplified version.
  
  // Get all users
  const allUsers = await storage.getAllUsers();
  const usersWithSettings = [];
  
  // Check each user's Kindle settings
  for (const user of allUsers) {
    const kindleSettings = await storage.getKindleSettings(user.id);
    if (kindleSettings && kindleSettings.active && kindleSettings.email) {
      usersWithSettings.push({ user, kindleSettings });
    }
  }
  
  return usersWithSettings;
}

async function processUserDelivery(userId: number) {
  try {
    // Get user data
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    
    // Get Kindle settings
    const settings = await storage.getKindleSettings(userId);
    if (!settings || !settings.active || !settings.email) {
      throw new Error(`User ${userId} does not have active Kindle settings`);
    }
    
    // Get feeds and topics
    const feeds = await storage.getRssFeeds(userId);
    const topics = await storage.getTopics(userId);
    
    if (feeds.length === 0) {
      throw new Error(`User ${userId} has no RSS feeds configured`);
    }
    
    // Get articles from feeds
    const topicNames = topics.map(t => t.name);
    const articles = [];
    
    for (const feed of feeds) {
      try {
        console.log(`Fetching feed: ${feed.url}`);
        const feedData = await fetchFeed(feed.url);
        console.log(`Found ${feedData.items.length} items in feed`);
        
        // Check if items already exist in database to avoid duplicates
        for (const item of feedData.items) {
          if (!item.link) {
            console.log(`Skipping item without link: ${item.title}`);
            continue;
          }
          
          const existingArticle = await storage.getArticleByUrl(item.link, userId);
          if (existingArticle) {
            console.log(`Skipping existing article: ${item.title}`);
            continue;
          }
          
          // Check if content is truncated
          const isTruncated = isTruncatedContent(item);
          
          // Use content exactly as provided by the publisher
          const content = getPublisherContent(item);
            
          if (!content) {
            console.log(`Skipping item without content: ${item.title}`);
            continue;
          }
          
          // Get source information
          const source = feedData.title || feed.url.split("/")[2] || "RSS Feed";
          const author = item.creator || item.author || "";
          const copyright = feedData.copyright || feedData.rights || "";
          
          console.log(`Processing article: ${item.title}`);
          articles.push({
            title: item.title,
            content,
            url: item.link,
            source,
            author,
            copyright,
            isTruncated
          });
        }
      } catch (error) {
        console.error(`Error fetching feed ${feed.url}:`, error);
        // Continue with other feeds
      }
    }
    
    console.log(`Found ${articles.length} new articles to process`);
    
    if (articles.length === 0) {
      throw new Error(`No new articles found for user ${userId}`);
    }
    
    // Curate articles
    const curated = await curateArticles(articles, topicNames);
    console.log(`Curated ${curated.selected.length} articles`);
    
    // Generate summaries and store in database
    const articlesWithSummaries = [];
    
    for (const article of curated.selected) {
      try {
        // For truncated content, use the publisher's content as is
        // For full content, generate a summary that respects copyright
        const summary = article.isTruncated 
          ? article.content 
          : await summarizeArticle(article.title, article.content);
        
        // Store in database
        const savedArticle = await storage.addArticle({
          title: article.title,
          summary,
          source: article.source,
          url: article.url,
          category: article.category,
          userId,
          isTruncated: article.isTruncated,
          author: article.author,
          copyright: article.copyright
        });
        
        articlesWithSummaries.push({
          ...article,
          summary,
          id: savedArticle.id
        });
      } catch (error) {
        console.error(`Error processing article ${article.title}:`, error);
        // Continue with other articles
      }
    }
    
    if (articlesWithSummaries.length === 0) {
      throw new Error(`Failed to process any articles for user ${userId}`);
    }
    
    // Generate document
    const document = await generateNewsDocument(articlesWithSummaries, {
      username: user.username,
      date: format(new Date(), "MMMM d, yyyy"),
      format: settings.format
    });
    
    // Send to Kindle
    await sendEmailToKindle({
      to: settings.email,
      name: user.username,
      document,
      format: settings.format
    });
    
    // Create delivery history
    await storage.addDeliveryHistory({
      date: new Date(),
      status: "Sent",
      articlesCount: articlesWithSummaries.length,
      format: settings.format,
      userId
    });
    
    console.log(`Successfully delivered newspaper to user ${userId}`);
  } catch (error) {
    console.error(`Error processing delivery for user ${userId}:`, error);
    
    // Record failed delivery in history
    try {
      await storage.addDeliveryHistory({
        date: new Date(),
        status: "Failed",
        articlesCount: 0,
        format: "pdf", // Default
        userId
      });
    } catch (historyError) {
      console.error(`Failed to record delivery history for user ${userId}:`, historyError);
    }
    
    throw error;
  }
}
