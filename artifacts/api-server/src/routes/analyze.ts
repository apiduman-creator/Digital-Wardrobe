import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: Router = Router();

// 10 istek / dakika / IP
const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Çok fazla istek. Lütfen 1 dakika bekleyin." },
});

// ─── Strike helpers ───────────────────────────────────────────────────────────

type StrikeRow = { strikes: number; blocked_until: string | null };

async function getStrikeRow(ip: string): Promise<StrikeRow | undefined> {
  const rows = await db.all<StrikeRow>(
    sql`SELECT strikes, blocked_until FROM analyze_strikes WHERE ip = ${ip}`
  );
  return rows[0];
}

async function incrementStrikes(ip: string): Promise<number> {
  // Süresi dolmuş bloğu temizleyerek sayacı arttır; yeni kayıt yoksa 1'den başlat
  await db.run(sql`
    INSERT INTO analyze_strikes (ip, strikes, blocked_until, updated_at)
    VALUES (${ip}, 1, NULL, CURRENT_TIMESTAMP)
    ON CONFLICT(ip) DO UPDATE SET
      strikes = CASE
        WHEN blocked_until IS NOT NULL AND blocked_until <= datetime('now') THEN 1
        ELSE strikes + 1
      END,
      blocked_until = CASE
        WHEN blocked_until IS NOT NULL AND blocked_until <= datetime('now') THEN NULL
        ELSE blocked_until
      END,
      updated_at = CURRENT_TIMESTAMP
  `);
  const row = await getStrikeRow(ip);
  return row?.strikes ?? 1;
}

async function applyBlock(ip: string, hours: number): Promise<void> {
  const blockedUntil = new Date(Date.now() + hours * 3600 * 1000).toISOString();
  await db.run(sql`
    UPDATE analyze_strikes
    SET blocked_until = ${blockedUntil}, updated_at = CURRENT_TIMESTAMP
    WHERE ip = ${ip}
  `);
}

async function resetStrikes(ip: string): Promise<void> {
  await db.run(sql`
    UPDATE analyze_strikes
    SET strikes = 0, blocked_until = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE ip = ${ip}
  `);
}

// ─── POST /analyze-clothing ───────────────────────────────────────────────────

router.post("/", analyzeLimiter, async (req: Request, res: Response) => {
  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)
      ?.split(",")[0]
      ?.trim() ??
    req.socket.remoteAddress ??
    "unknown";

  // 1. Blok kontrolü
  const strikeRow = await getStrikeRow(ip);
  if (strikeRow?.blocked_until) {
    const blockedUntil = new Date(strikeRow.blocked_until);
    if (blockedUntil > new Date()) {
      const remainingH = Math.ceil((blockedUntil.getTime() - Date.now()) / 3600_000);
      res.status(403).json({ error: `Erişim engellendi. ${remainingH} saat sonra tekrar deneyin.` });
      return;
    }
  }

  // 2. Body doğrulama
  const { base64, mimeType } = req.body as { base64?: unknown; mimeType?: unknown };
  if (typeof base64 !== "string" || typeof mimeType !== "string") {
    res.status(400).json({ error: "base64 ve mimeType alanları zorunludur." });
    return;
  }

  // 3. Boyut kontrolü (5 MB)
  const byteSize = Buffer.byteLength(base64, "base64");
  if (byteSize > 5 * 1024 * 1024) {
    res.status(400).json({ error: "Fotoğraf boyutu 5 MB sınırını aşıyor." });
    return;
  }

  // 4. API anahtarı
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "Sunucu yapılandırma hatası: ANTHROPIC_API_KEY eksik." });
    return;
  }

  // 5. Anthropic API çağrısı
  let rawText: string;
  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } },
              {
                type: "text",
                text: `Bu fotoğrafı analiz et. Yalnızca aşağıdaki JSON formatında yanıt ver, başka hiçbir şey ekleme:

{
  "not_clothing": false,
  "name": "kıyafetin kısa Türkçe adı (ör: 'Lacivert Slim Fit Pantolon')",
  "category": "şunlardan biri: tops, bottoms, dresses, outerwear, shoes, accessories, bags, activewear, sleepwear, other",
  "color": "Türkçe renk adı (ör: 'Lacivert', 'Kırmızı', 'Beyaz')",
  "colorHex": "baskın rengin hex kodu (#RRGGBB)",
  "brand": "görünüyorsa marka adı, yoksa null",
  "occasions": ["casual","work","formal","sport","lounge","special"] listesinden uygun olanlar,
  "seasons": ["spring","summer","fall","winter"] listesinden uygun olanlar
}

Fotoğrafta kıyafet veya aksesuar YOKSA yalnızca şunu döndür:
{"not_clothing": true}`,
              },
            ],
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      throw new Error(`Anthropic ${anthropicRes.status}: ${errText}`);
    }

    const data = (await anthropicRes.json()) as { content?: Array<{ text?: string }> };
    rawText = data?.content?.[0]?.text ?? "";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: `AI servisi hatası: ${msg}` });
    return;
  }

  // 6. JSON ayrıştır
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    res.status(502).json({ error: "AI yanıtı ayrıştırılamadı." });
    return;
  }

  let result: Record<string, unknown>;
  try {
    result = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  } catch {
    res.status(502).json({ error: "AI yanıtı geçerli JSON değil." });
    return;
  }

  // 7. Strike sistemi — kıyafet dışı fotoğraf
  if (result["not_clothing"] === true) {
    const strikes = await incrementStrikes(ip);
    if (strikes >= 3) {
      await applyBlock(ip, 24);
      res.status(403).json({
        error: "Üst üste 3 kez kıyafet dışı fotoğraf gönderildi. 24 saat erişim engellendi.",
        not_clothing: true,
        blocked: true,
      });
      return;
    }
    res.status(422).json({
      error: `Fotoğrafta kıyafet tespit edilemedi. (${strikes}/3 uyarı)`,
      not_clothing: true,
      strikes,
    });
    return;
  }

  // 8. Başarılı — strike sıfırla
  if (strikeRow && (strikeRow.strikes > 0 || strikeRow.blocked_until)) {
    await resetStrikes(ip);
  }

  res.json(result);
});

export default router;
