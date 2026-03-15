import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { outfitsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

const seasonEnum = ["spring", "summer", "fall", "winter", "all"] as const;
const occasionEnum = ["casual", "work", "formal", "sport", "lounge", "special"] as const;

const createOutfitSchema = z.object({
  name: z.string().min(1),
  itemIds: z.array(z.string()),
  occasion: z.enum(occasionEnum),
  season: z.enum(seasonEnum),
  notes: z.string().optional(),
  favorite: z.boolean().optional().default(false),
});

function mapOutfit(outfit: typeof outfitsTable.$inferSelect) {
  let itemIds: string[] = [];
  try {
    itemIds = JSON.parse(outfit.itemIds);
  } catch {
    itemIds = [];
  }
  return {
    id: outfit.id,
    name: outfit.name,
    itemIds,
    occasion: outfit.occasion,
    season: outfit.season,
    notes: outfit.notes ?? undefined,
    favorite: outfit.favorite,
    createdAt: outfit.createdAt.toISOString(),
    updatedAt: outfit.updatedAt.toISOString(),
  };
}

router.get("/", async (_req, res) => {
  const outfits = await db.select().from(outfitsTable);
  res.json(outfits.map(mapOutfit));
});

router.post("/", async (req, res) => {
  const parsed = createOutfitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
    return;
  }
  const data = parsed.data;
  const id = generateId();
  const now = new Date();
  const [created] = await db.insert(outfitsTable).values({
    id,
    name: data.name,
    itemIds: JSON.stringify(data.itemIds),
    occasion: data.occasion,
    season: data.season,
    notes: data.notes ?? null,
    favorite: data.favorite ?? false,
    createdAt: now,
    updatedAt: now,
  }).returning();
  res.status(201).json(mapOutfit(created));
});

router.get("/:id", async (req, res) => {
  const [outfit] = await db.select().from(outfitsTable).where(eq(outfitsTable.id, req.params.id));
  if (!outfit) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(mapOutfit(outfit));
});

router.put("/:id", async (req, res) => {
  const parsed = createOutfitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
    return;
  }
  const data = parsed.data;
  const [updated] = await db.update(outfitsTable)
    .set({
      name: data.name,
      itemIds: JSON.stringify(data.itemIds),
      occasion: data.occasion,
      season: data.season,
      notes: data.notes ?? null,
      favorite: data.favorite ?? false,
      updatedAt: new Date(),
    })
    .where(eq(outfitsTable.id, req.params.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(mapOutfit(updated));
});

router.delete("/:id", async (req, res) => {
  await db.delete(outfitsTable).where(eq(outfitsTable.id, req.params.id));
  res.status(204).send();
});

export default router;
