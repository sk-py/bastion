import { Router } from "express";
import { requireAuth } from "../../middleware/authenticate.js";
import { addNewServer } from "./server-controller.js";
import { validate } from "../../middleware/validator.js";
import { createServerSchema } from "./server-schema.js";

const router: Router = Router();

router.post(
  "/add/server",
  validate(createServerSchema, "body"),
  requireAuth,
  addNewServer,
);

export default router;
