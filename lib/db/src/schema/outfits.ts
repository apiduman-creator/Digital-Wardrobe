import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const outfitsTable = sqliteTable("outfits", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  itemIds: text("item_ids").notNull(),
  occasion: text("occasion").notNull(),
  season: text("season").notNull(),
  notes: text("notes"),
  favorite: integer("favorite", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertOutfitSchema = createInsertSchema(outfitsTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertOutfit = z.infer<typeof insertOutfitSchema>;
export type Outfit = typeof outfitsTable.$inferSelect;
