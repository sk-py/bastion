import { Router } from "express";
import {
  completeInitialSetup,
  login,
  logout,
  logoutAll,
  me,
  addUser,
  updateUser,
  updateUserStatus,
} from "./auth-controller.js";
import { validate } from "../../../middleware/validator.js";
import { loginSchema, addUserSchema, updateUserSchema, updateUserStatusSchema } from "@bastion/schemas";
import { requireAuth } from "../../../middleware/authenticate.js";
import { requireSetupAuth } from "src/middleware/setup-auth.js";
import { initialSetupSchema } from "./auth-schema.js";
import { requireRole } from "src/middleware/authorize-role.js";

const router: Router = Router();

router.patch(
  "/setup",
  requireSetupAuth,
  validate(initialSetupSchema, "body"),
  completeInitialSetup,
);
router.post(
  "/add-user",
  requireAuth,
  requireRole("admin", "owner"),
  validate(addUserSchema, "body"),
  addUser,
);
router.post("/login", validate(loginSchema, "body"), login);
router.get("/logout", requireAuth, logout);
router.get("/logout-all", requireAuth, logoutAll);
router.get("/me", requireAuth, me);
router.patch(
  "/users/:id",
  requireAuth,
  requireRole("owner", "admin"),
  validate(updateUserSchema, "body"),
  updateUser,
);

router.patch(
  "/users/:id/status",
  requireAuth,
  requireRole("owner", "admin"),
  validate(updateUserStatusSchema, "body"),
  updateUserStatus,
);

export default router;
