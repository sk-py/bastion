import { Router } from "express";
import { listServers, listUsers } from "./workspace-controller.js";
import { requireAuth } from "../../middleware/authenticate.js";

const router: Router = Router();

router.get("/users", requireAuth, listUsers);

router.get("/servers", requireAuth, listServers);

export default router;