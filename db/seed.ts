import { db } from "./index";
import * as schema from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    console.log("Starting database seed...");

    // Create demo user if it doesn't exist
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, "demo@example.com")
    });

    if (!existingUser) {
      console.log("Creating demo user...");
      
      const hashedPassword = await hashPassword("password123");
      
      const [user] = await db.insert(schema.users).values({
        username: "demo",
        email: "demo@example.com",
        password: hashedPassword
      }).returning();
      
      console.log(`Created demo user with ID: ${user.id}`);
      
      // Create Kindle settings for the demo user
      await db.insert(schema.kindleSettings).values({
        email: "demo@kindle.com",
        active: true,
        deliveryTime: 8,
        format: "pdf",
        userId: user.id
      });
      
      // Add sample RSS feeds
      const feedUrls = [
        "https://techcrunch.com/feed/",
        "https://www.wired.com/feed/rss",
        "https://www.theverge.com/rss/index.xml"
      ];
      
      for (const url of feedUrls) {
        await db.insert(schema.rssFeeds).values({
          url,
          userId: user.id
        });
      }
      
      // Add sample topics
      const topics = ["Technology", "Science", "Business"];
      
      for (const name of topics) {
        await db.insert(schema.topics).values({
          name,
          userId: user.id
        });
      }
      
      // Add sample article history
      const articles = [
        {
          title: "Apple Releases New MacBook Pro with Enhanced AI Capabilities",
          summary: "Apple has announced a new MacBook Pro model featuring enhanced AI capabilities powered by their latest M3 chip. The new processor includes dedicated neural engine cores that can process machine learning tasks up to 40% faster than previous models. This advancement allows for improved performance in applications like video editing, 3D rendering, and voice recognition, without draining battery life.",
          source: "TechCrunch",
          url: "https://techcrunch.com/sample-article-1",
          category: "Technology",
          userId: user.id
        },
        {
          title: "New Study Shows Promise in Cancer Treatment Research",
          summary: "Researchers at Stanford University have published findings on a breakthrough in cancer treatment. The study demonstrates how targeted immunotherapy, combined with conventional treatments, can significantly improve patient outcomes in certain types of aggressive cancers. The research team found that this combination approach reduced tumor size by an average of 60% in clinical trials.",
          source: "Nature",
          url: "https://nature.com/sample-article-2",
          category: "Science",
          userId: user.id
        },
        {
          title: "Global Markets React to Federal Reserve Interest Rate Decision",
          summary: "Global financial markets showed mixed reactions to the Federal Reserve's decision to maintain current interest rates. While U.S. stocks initially rallied on the news, European markets experienced a slight decline. Analysts suggest this divergence reflects different economic recovery rates across regions, with the U.S. showing stronger employment data and consumer spending than European counterparts.",
          source: "Financial Times",
          url: "https://ft.com/sample-article-3",
          category: "Business",
          userId: user.id
        }
      ];
      
      for (const article of articles) {
        await db.insert(schema.articles).values(article);
      }
      
      // Add sample delivery history
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const deliveryHistory = [
        {
          date: twoWeeksAgo,
          status: "Sent",
          articlesCount: 12,
          format: "pdf",
          userId: user.id
        },
        {
          date: oneWeekAgo,
          status: "Sent",
          articlesCount: 10,
          format: "pdf",
          userId: user.id
        }
      ];
      
      for (const history of deliveryHistory) {
        await db.insert(schema.deliveryHistory).values(history);
      }
      
      console.log("Demo data created successfully");
    } else {
      console.log("Demo user already exists, skipping seed");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
