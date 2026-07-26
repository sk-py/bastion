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

const router: Router = Router();

router.post(
  "/add",
  requireAuth,
  validate(createServerSchema, "body"),
  addNewServer,
);

router.delete(
  "/:id",
  requireAuth,
  validate(serverIdSchema, "params"),
  removeServerById,
);

router.get("/all", requireAuth, getAllServers);

router.patch(
  "/update/:id",
  requireAuth,
  validate(serverIdSchema, "params"),
  validate(updateServerSchema, "body"),
  updateServer,
);

router.post("/:id/test",requireAuth, validate(serverIdSchema,"params"), testServerConnection)

export default router;
