import { Router } from "express";
import { register } from "./auth-controller.js";
import { validate } from "../../../middleware/validator.js";
import { registerSchema } from "./auth-schema.js";

const router: Router = Router();

router.post("/register", validate(registerSchema, "body"), register);

export default router;
