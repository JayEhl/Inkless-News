import { pgTable, text, serial, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const usersRelations = relations(users, ({ many }) => ({
  rssFeeds: many(rssFeeds),
  topics: many(topics),
  kindleSettings: many(kindleSettings),
  articles: many(articles),
  deliveryHistory: many(deliveryHistory)
}));

// RSS Feeds table
export const rssFeeds = pgTable("rss_feeds", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const rssFeedsRelations = relations(rssFeeds, ({ one }) => ({
  user: one(users, {
    fields: [rssFeeds.userId],
    references: [users.id]
  })
}));

// Topics table
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const topicsRelations = relations(topics, ({ one }) => ({
  user: one(users, {
    fields: [topics.userId],
    references: [users.id]
  })
}));

// Kindle Settings table
export const kindleSettings = pgTable("kindle_settings", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  active: boolean("active").default(true).notNull(),
  deliveryTime: integer("delivery_time").default(8).notNull(), // Hour of the day (5-12)
  format: text("format", { enum: ["pdf", "mobi", "epub"] }).default("pdf").notNull(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const kindleSettingsRelations = relations(kindleSettings, ({ one }) => ({
  user: one(users, {
    fields: [kindleSettings.userId],
    references: [users.id]
  })
}));

// Articles table
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  source: text("source").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isTruncated: boolean("is_truncated").default(false).notNull(),
  author: text("author"),
  copyright: text("copyright")
});

export const articlesRelations = relations(articles, ({ one }) => ({
  user: one(users, {
    fields: [articles.userId],
    references: [users.id]
  })
}));

// Delivery History table
export const deliveryHistory = pgTable("delivery_history", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  status: text("status").notNull(), // 'Sent' or 'Failed'
  articlesCount: integer("articles_count").default(0).notNull(),
  format: text("format", { enum: ["pdf", "mobi", "epub"] }).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const deliveryHistoryRelations = relations(deliveryHistory, ({ one }) => ({
  user: one(users, {
    fields: [deliveryHistory.userId],
    references: [users.id]
  })
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  email: (schema) => schema.email("Please enter a valid email address"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters")
});

export const insertRssFeedSchema = createInsertSchema(rssFeeds, {
  url: (schema) => schema.url("Please enter a valid URL")
});

export const insertTopicSchema = createInsertSchema(topics, {
  name: (schema) => schema.min(2, "Topic name must be at least 2 characters")
});

export const insertKindleSettingsSchema = createInsertSchema(kindleSettings, {
  email: (schema) => schema.email("Please enter a valid email address")
});

export const insertArticleSchema = createInsertSchema(articles);

export const insertDeliveryHistorySchema = createInsertSchema(deliveryHistory);

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type RssFeed = typeof rssFeeds.$inferSelect;
export type InsertRssFeed = z.infer<typeof insertRssFeedSchema>;

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;

export type KindleSettings = typeof kindleSettings.$inferSelect;
export type InsertKindleSettings = z.infer<typeof insertKindleSettingsSchema>;

export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;

export type DeliveryHistory = typeof deliveryHistory.$inferSelect;
export type InsertDeliveryHistory = z.infer<typeof insertDeliveryHistorySchema>;
