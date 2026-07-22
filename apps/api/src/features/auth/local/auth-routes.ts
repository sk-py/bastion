import { Router } from "express";
import { login, register } from "./auth-controller.js";
import { validate } from "../../../middleware/validator.js";
import { loginSchema, registerSchema } from "./auth-schema.js";

const router: Router = Router();

router.post("/register", validate(registerSchema, "body"), register);
router.post("/login", validate(loginSchema, "body"), login);

export default router;
