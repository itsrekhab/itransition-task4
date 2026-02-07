import express from "express";
import passport from "passport";

import { blockUsers, deleteUnverifiedUsers, deleteUsers, getUsers, unblockUsers } from "@/controllers/users-controller";
import { checkIfBlocked } from "@/middleware/auth-middleware";

const router = express.Router();

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  checkIfBlocked,
  getUsers,
);

router.patch(
  "/block",
  passport.authenticate("jwt", { session: false }),
  checkIfBlocked,
  blockUsers,
);

router.patch(
  "/unblock",
  passport.authenticate("jwt", { session: false }),
  checkIfBlocked,
  unblockUsers,
);

router.delete(
  "/delete",
  passport.authenticate("jwt", { session: false }),
  checkIfBlocked,
  deleteUsers,
);

router.delete(
  "/delete-unverified",
  passport.authenticate("jwt", { session: false }),
  checkIfBlocked,
  deleteUnverifiedUsers,
);

export default router;
