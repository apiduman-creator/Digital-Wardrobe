import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const closetItemsTable = sqliteTable("closet_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  color: text("color").notNull(),
  brand: text("brand"),
  season: text("season").notNull(),
  occasion: text("occasion").notNull(),
  imageUri: text("image_uri"),
  notes: text("notes"),
  favorite: integer("favorite", { mode: "boolean" }).notNull().default(false),
  wearCount: integer("wear_count").notNull().default(0),
  lastWorn: text("last_worn"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertClosetItemSchema = createInsertSchema(closetItemsTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertClosetItem = z.infer<typeof insertClosetItemSchema>;
export type ClosetItem = typeof closetItemsTable.$inferSelect;
