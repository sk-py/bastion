import { Router } from "express";
import { requireAuth } from "src/middleware/authenticate.js";
import { checkFileExists, uploadFile } from "./terminal-controller.js";

const router: Router = Router();

router.get("/file/exists", requireAuth, checkFileExists);
router.post("/file/upload", requireAuth, uploadFile);

export default router;
