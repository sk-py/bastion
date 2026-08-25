import { Router } from "express";
import { getDashboardMetrics } from "./dashboard-controller.js";
import { requireAuth } from "../../middleware/authenticate.js";

const router: Router = Router();

router.get("/metrics", requireAuth, getDashboardMetrics);

export default router;
