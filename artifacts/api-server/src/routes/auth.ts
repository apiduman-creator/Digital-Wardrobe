import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";

const router = Router();

const bodySchema = z.object({
  email: z.string().email("Geçerli bir email girin."),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
});

function signToken(userId: string): string {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET tanımlı değil.");
  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Geçersiz istek." });
    return;
  }

  const { email, password } = parsed.data;

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .get();

  if (existing) {
    res.status(409).json({ error: "Bu email adresi zaten kayıtlı." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = randomUUID();

  await db.insert(usersTable).values({ id, email, passwordHash });

  res.status(201).json({ token: signToken(id) });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Geçersiz istek." });
    return;
  }

  const { email, password } = parsed.data;

  const user = await db
    .select({ id: usersTable.id, passwordHash: usersTable.passwordHash })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .get();

  if (!user) {
    res.status(401).json({ error: "Email veya şifre hatalı." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Email veya şifre hatalı." });
    return;
  }

  res.json({ token: signToken(user.id) });
});

export default router;
