import { Router } from "express";
import { requireAuth } from "src/middleware/authenticate.js";
import { getDashboardMetrics } from "./dashboard-controller.js";

const router: Router = Router();

router.get("/metrics", requireAuth, getDashboardMetrics);

export default router;
