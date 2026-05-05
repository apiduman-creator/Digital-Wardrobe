import { Router, type IRouter } from "express";
import healthRouter from "./health";
import closetRouter from "./closet";
import outfitsRouter from "./outfits";
import analyzeRouter from "./analyze";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/closet", closetRouter);
router.use("/outfits", outfitsRouter);
router.use("/analyze-clothing", analyzeRouter);

export default router;
