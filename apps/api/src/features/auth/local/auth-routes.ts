import { Router } from "express";
import { login, logout, logoutAll, me, register } from "./auth-controller.js";
import { validate } from "../../../middleware/validator.js";
import { loginSchema, registerSchema } from "./auth-schema.js";
import { requireAuth } from "../../../middleware/authenticate.js";

const router: Router = Router();

router.post("/register", validate(registerSchema, "body"), register);
router.post("/login", validate(loginSchema, "body"), login);
router.get("/logout", requireAuth, logout);
router.get("/logout-all", requireAuth, logoutAll);
router.get("/me", requireAuth, me);

export default router;
