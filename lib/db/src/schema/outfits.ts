import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const outfitsTable = pgTable("outfits", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  itemIds: text("item_ids").notNull(),
  occasion: text("occasion").notNull(),
  season: text("season").notNull(),
  notes: text("notes"),
  favorite: boolean("favorite").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOutfitSchema = createInsertSchema(outfitsTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertOutfit = z.infer<typeof insertOutfitSchema>;
export type Outfit = typeof outfitsTable.$inferSelect;
