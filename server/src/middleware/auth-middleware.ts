import type { NextFunction, Request, Response } from "express";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { ACCESS_TOKEN_MAX_AGE, COOKIE_OPTIONS, REFRESH_TOKEN_MAX_AGE } from "@/constants";
import { AppDataSource } from "@/data-source.js";
import { User } from "@/entities/user.js";
import { env } from "@/env.js";

export type TokenContents = {
  id: number;
};

export async function checkRefreshToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      env.REFRESH_TOKEN_SECRET!,
    ) as TokenContents;
    const usersRepository = AppDataSource.getRepository(User);
    const user = await usersRepository.findOne({ where: { id: decoded.id }, select: ["id", "email", "refreshTokenHash"] });

    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!isRefreshTokenValid) {
      user.refreshTokenHash = null;
      await usersRepository.save(user);
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (error) {
    res.clearCookie("accessToken", { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MAX_AGE });
    res.clearCookie("refreshToken", { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MAX_AGE });
    return res.status(401).json({ message: "Unauthorized" });
  }
}

export async function checkIfBlocked(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const usersRepository = AppDataSource.getRepository(User);
  const user = await usersRepository.findOne({ where: { id: (req.user as any)?.id }, select: ["id", "email", "refreshTokenHash", "isBlocked"] });

  if (!req.user || !user || user.isBlocked) {
    if (user) {
      user.refreshTokenHash = null;
      await usersRepository.save(user);
    }
    res.clearCookie("accessToken", { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MAX_AGE });
    res.clearCookie("refreshToken", { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MAX_AGE });
    return res.status(403).json({ message: "Access denied." });
  }

  next();
}
