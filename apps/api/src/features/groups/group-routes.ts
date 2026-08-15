import { Router } from "express";

import {
  createGroupSchema,
  groupMemberSchema,
  updateGroupSchema,
} from "@bastion/schemas";
import {
  addMember,
  create,
  get,
  list,
  listMembers,
  remove,
  removeMember,
  update,
} from "./group-controller.js";
import { requireAuth } from "src/middleware/authenticate.js";
import { validate } from "src/middleware/validator.js";
import { requireRole } from "src/middleware/authorize-role.js";

const router: Router = Router();

router.get("/", requireAuth, list);

router.get("/:id", requireAuth, get);

router.post(
  "/",
  requireAuth,
  requireRole("owner", "admin"),
  validate(createGroupSchema, "body"),
  create,
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("owner", "admin"),
  validate(updateGroupSchema, "body"),
  update,
);

router.post(
  "/:id/members",
  requireAuth,
  requireRole("owner", "admin"),
  validate(groupMemberSchema, "body"),
  addMember,
);

router.delete(
  "/:id/members/:userId",
  requireAuth,
  requireRole("owner", "admin"),
  removeMember,
);

router.get(
  "/:id/members",
  requireAuth,
  listMembers,
);

router.delete("/:id", requireAuth, requireRole("owner", "admin"), remove);

export default router;
