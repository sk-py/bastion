import { Router } from "express";
import { requireAuth } from "src/middleware/authenticate.js";
import { getRecordings, streamRecording } from "./recording-controller.js";
import { validate } from "src/middleware/validator.js";

const router: Router = Router()


router.get("/",requireAuth, getRecordings);
router.get("/:id/stream", requireAuth, streamRecording);

export default router;