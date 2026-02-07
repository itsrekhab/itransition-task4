import { Router } from "express";
import passport from "passport";

import {
  checkLogin,
  refreshTokens,
  registerUser,
  signIn,
  signOut,
  verifyEmail,
} from "@/controllers/auth-controller.js";
import { checkIfBlocked, checkRefreshToken } from "@/middleware/auth-middleware.js"; // Import the middleware

const router = Router();

router.post("/login", signIn);
router.post("/register", registerUser);
router.get("/check", passport.authenticate("jwt", { session: false }), checkIfBlocked, checkLogin);
router.post("/refresh", checkRefreshToken, refreshTokens);
router.post(
  "/logout",
  passport.authenticate("jwt", { session: false }),
  signOut,
);
router.get("/verify-email", passport.authenticate("jwt", { session: false }), checkIfBlocked, verifyEmail);

export default router;
