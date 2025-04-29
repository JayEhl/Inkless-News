import { db } from "@db";
import { 
  users, 
  usersRelations, 
  rssFeeds, 
  topics, 
  kindleSettings,
  articles,
  deliveryHistory
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "@db";
import { User, InsertUser } from "@shared/schema";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser: (id: number) => Promise<User | undefined>;
  getUserByUsername: (username: string) => Promise<User | undefined>;
  getUserByEmail: (email: string) => Promise<User | undefined>;
  createUser: (userData: InsertUser) => Promise<User>;
  getAllUsers: () => Promise<User[]>;

  // RSS feed operations
  getRssFeeds: (userId: number) => Promise<typeof rssFeeds.$inferSelect[]>;
  addRssFeed: (userId: number, url: string) => Promise<typeof rssFeeds.$inferSelect>;
  removeRssFeed: (id: number, userId: number) => Promise<void>;

  // Topics operations
  getTopics: (userId: number) => Promise<typeof topics.$inferSelect[]>;
  addTopic: (userId: number, name: string) => Promise<typeof topics.$inferSelect>;
  removeTopic: (id: number, userId: number) => Promise<void>;

  // Kindle settings operations
  getKindleSettings: (userId: number) => Promise<typeof kindleSettings.$inferSelect | undefined>;
  updateKindleSettings: (userId: number, settings: Partial<typeof kindleSettings.$inferSelect>) => Promise<typeof kindleSettings.$inferSelect>;

  // Articles operations
  getArticles: (userId: number) => Promise<typeof articles.$inferSelect[]>;
  addArticle: (articleData: typeof articles.$inferInsert) => Promise<typeof articles.$inferSelect>;
  getArticleByUrl: (url: string, userId: number) => Promise<typeof articles.$inferSelect | undefined>;

  // Delivery history operations
  getDeliveryHistory: (userId: number) => Promise<typeof deliveryHistory.$inferSelect[]>;
  addDeliveryHistory: (historyData: typeof deliveryHistory.$inferInsert) => Promise<typeof deliveryHistory.$inferSelect>;

  sessionStore: session.Store;
}

class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      tableName: 'session',
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id)
    });
    return result;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.username, username)
    });
    return result;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    return result;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.query.users.findMany({
      orderBy: [desc(users.createdAt)]
    });
  }

  // RSS feed operations
  async getRssFeeds(userId: number): Promise<typeof rssFeeds.$inferSelect[]> {
    return await db.query.rssFeeds.findMany({
      where: eq(rssFeeds.userId, userId),
      orderBy: [desc(rssFeeds.createdAt)]
    });
  }

  async addRssFeed(userId: number, url: string): Promise<typeof rssFeeds.$inferSelect> {
    const [feed] = await db.insert(rssFeeds).values({
      url,
      userId
    }).returning();
    return feed;
  }

  async removeRssFeed(id: number, userId: number): Promise<void> {
    await db.delete(rssFeeds).where(
      and(
        eq(rssFeeds.id, id),
        eq(rssFeeds.userId, userId)
      )
    );
  }

  // Topics operations
  async getTopics(userId: number): Promise<typeof topics.$inferSelect[]> {
    return await db.query.topics.findMany({
      where: eq(topics.userId, userId),
      orderBy: [desc(topics.createdAt)]
    });
  }

  async addTopic(userId: number, name: string): Promise<typeof topics.$inferSelect> {
    const [topic] = await db.insert(topics).values({
      name,
      userId
    }).returning();
    return topic;
  }

  async removeTopic(id: number, userId: number): Promise<void> {
    await db.delete(topics).where(
      and(
        eq(topics.id, id),
        eq(topics.userId, userId)
      )
    );
  }

  // Kindle settings operations
  async getKindleSettings(userId: number): Promise<typeof kindleSettings.$inferSelect | undefined> {
    return await db.query.kindleSettings.findFirst({
      where: eq(kindleSettings.userId, userId)
    });
  }

  async updateKindleSettings(userId: number, settings: Partial<typeof kindleSettings.$inferSelect>): Promise<typeof kindleSettings.$inferSelect> {
    const existingSettings = await this.getKindleSettings(userId);
    
    if (existingSettings) {
      // Update existing settings
      const [updated] = await db.update(kindleSettings)
        .set(settings)
        .where(eq(kindleSettings.userId, userId))
        .returning();
      return updated;
    } else {
      // Create new settings
      const [created] = await db.insert(kindleSettings)
        .values({
          ...settings,
          userId,
          email: settings.email || '',
          active: settings.active !== undefined ? settings.active : true,
          deliveryTime: settings.deliveryTime || 8,
          format: settings.format || 'pdf'
        })
        .returning();
      return created;
    }
  }

  // Articles operations
  async getArticles(userId: number): Promise<typeof articles.$inferSelect[]> {
    return await db.query.articles.findMany({
      where: eq(articles.userId, userId),
      orderBy: [desc(articles.createdAt)]
    });
  }

  async addArticle(articleData: typeof articles.$inferInsert): Promise<typeof articles.$inferSelect> {
    const [article] = await db.insert(articles).values(articleData).returning();
    return article;
  }

  async getArticleByUrl(url: string, userId: number): Promise<typeof articles.$inferSelect | undefined> {
    return await db.query.articles.findFirst({
      where: and(
        eq(articles.url, url),
        eq(articles.userId, userId)
      )
    });
  }

  // Delivery history operations
  async getDeliveryHistory(userId: number): Promise<typeof deliveryHistory.$inferSelect[]> {
    return await db.query.deliveryHistory.findMany({
      where: eq(deliveryHistory.userId, userId),
      orderBy: [desc(deliveryHistory.date)]
    });
  }

  async addDeliveryHistory(historyData: typeof deliveryHistory.$inferInsert): Promise<typeof deliveryHistory.$inferSelect> {
    const [history] = await db.insert(deliveryHistory).values(historyData).returning();
    return history;
  }
}

export const storage = new DatabaseStorage();
