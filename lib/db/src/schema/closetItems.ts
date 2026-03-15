import { pgTable, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const closetItemsTable = pgTable("closet_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  color: text("color").notNull(),
  brand: text("brand"),
  season: text("season").notNull(),
  occasion: text("occasion").notNull(),
  imageUri: text("image_uri"),
  notes: text("notes"),
  favorite: boolean("favorite").notNull().default(false),
  wearCount: integer("wear_count").notNull().default(0),
  lastWorn: text("last_worn"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertClosetItemSchema = createInsertSchema(closetItemsTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertClosetItem = z.infer<typeof insertClosetItemSchema>;
export type ClosetItem = typeof closetItemsTable.$inferSelect;
