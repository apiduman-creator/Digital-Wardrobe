import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { closetItemsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

const categoryEnum = ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories", "bags", "activewear", "sleepwear", "other"] as const;
const seasonEnum = ["spring", "summer", "fall", "winter", "all"] as const;
const occasionEnum = ["casual", "work", "formal", "sport", "lounge", "special"] as const;

const createItemSchema = z.object({
  name: z.string().min(1),
  category: z.enum(categoryEnum),
  color: z.string().min(1),
  brand: z.string().optional(),
  season: z.enum(seasonEnum),
  occasion: z.enum(occasionEnum),
  imageUri: z.string().optional(),
  notes: z.string().optional(),
  favorite: z.boolean().optional().default(false),
});

function mapItem(item: typeof closetItemsTable.$inferSelect) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    color: item.color,
    brand: item.brand ?? undefined,
    season: item.season,
    occasion: item.occasion,
    imageUri: item.imageUri ?? undefined,
    notes: item.notes ?? undefined,
    favorite: item.favorite,
    wearCount: item.wearCount,
    lastWorn: item.lastWorn ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

router.get("/items", async (req, res) => {
  const { category, season, color } = req.query;
  let items = await db.select().from(closetItemsTable);
  if (category && typeof category === "string") {
    items = items.filter((i) => i.category === category);
  }
  if (season && typeof season === "string") {
    items = items.filter((i) => i.season === season || i.season === "all");
  }
  if (color && typeof color === "string") {
    items = items.filter((i) => i.color.toLowerCase().includes(color.toLowerCase()));
  }
  res.json(items.map(mapItem));
});

router.post("/items", async (req, res) => {
  const parsed = createItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
    return;
  }
  const data = parsed.data;
  const id = generateId();
  const now = new Date();
  const [created] = await db.insert(closetItemsTable).values({
    id,
    name: data.name,
    category: data.category,
    color: data.color,
    brand: data.brand ?? null,
    season: data.season,
    occasion: data.occasion,
    imageUri: data.imageUri ?? null,
    notes: data.notes ?? null,
    favorite: data.favorite ?? false,
    wearCount: 0,
    lastWorn: null,
    createdAt: now,
    updatedAt: now,
  }).returning();
  res.status(201).json(mapItem(created));
});

router.get("/items/:id", async (req, res) => {
  const [item] = await db.select().from(closetItemsTable).where(eq(closetItemsTable.id, req.params.id));
  if (!item) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(mapItem(item));
});

router.put("/items/:id", async (req, res) => {
  const parsed = createItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
    return;
  }
  const data = parsed.data;
  const [updated] = await db.update(closetItemsTable)
    .set({
      name: data.name,
      category: data.category,
      color: data.color,
      brand: data.brand ?? null,
      season: data.season,
      occasion: data.occasion,
      imageUri: data.imageUri ?? null,
      notes: data.notes ?? null,
      favorite: data.favorite ?? false,
      updatedAt: new Date(),
    })
    .where(eq(closetItemsTable.id, req.params.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(mapItem(updated));
});

router.delete("/items/:id", async (req, res) => {
  await db.delete(closetItemsTable).where(eq(closetItemsTable.id, req.params.id));
  res.status(204).send();
});

export default router;
