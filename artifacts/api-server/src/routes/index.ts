import { Router, type IRouter } from "express";
import healthRouter from "./health";
import medicalRouter from "./medical";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/medical", medicalRouter);

export default router;
