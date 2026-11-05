import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeRouter from "./analyze";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
// /closet ve /outfits v1.0'da KAPALI: kimlik doğrulamasız, herkese açık
// okuma/yazma uçlarıydı ve mobil uygulama bunları kullanmıyor (veri cihazda).
// v1.1'de (Turso + hesap) authMiddleware ile birlikte geri eklenecek.
// Dosyalar (closet.ts, outfits.ts) duruyor, sadece bağlı değiller.
router.use("/analyze-clothing", analyzeRouter);

export default router;
