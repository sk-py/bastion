import { Router } from "express";
import { requireAuth } from "../../middleware/authenticate.js";
import {
  addNewServer,
  getAllServers,
  removeServerById,
  testServerConnection,
  updateServer,
} from "./server-controller.js";
import { validate } from "../../middleware/validator.js";
import {
  createServerSchema,
  serverIdSchema,
  updateServerSchema,
} from "./server-schema.js";
import { requireRole } from "../../middleware/authorize-role.js";

const router: Router = Router();

router.post(
  "/add",
  requireAuth,
  requireRole("owner", "admin"),
  validate(createServerSchema, "body"),
  addNewServer,
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("owner", "admin"),
  validate(serverIdSchema, "params"),
  removeServerById,
);

router.get("/all", requireAuth, getAllServers);

router.patch(
  "/update/:id",
  requireAuth,
  requireRole("owner", "admin"),
  validate(serverIdSchema, "params"),
  validate(updateServerSchema, "body"),
  updateServer,
);

router.post("/:id/test",requireAuth, validate(serverIdSchema,"params"), testServerConnection)

export default router;
