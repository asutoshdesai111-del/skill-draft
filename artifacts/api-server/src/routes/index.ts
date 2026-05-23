import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import resumesRouter from "./resumes";
import sectionsRouter from "./sections";
import templatesRouter from "./templates";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(resumesRouter);
router.use(sectionsRouter);
router.use(templatesRouter);

export default router;
