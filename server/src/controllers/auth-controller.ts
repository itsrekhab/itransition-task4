import type { Request, Response } from "express";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { QueryFailedError } from "typeorm";

import { ACCESS_TOKEN_MAX_AGE, COOKIE_OPTIONS, REFRESH_TOKEN_MAX_AGE } from "@/constants";
import { AppDataSource } from "@/data-source.js";
import { UserLogin } from "@/entities/user-login";
import { User } from "@/entities/user.js";
import { env } from "@/env.js";

function generateTokens(user: User): {
  accessToken: string;
  refreshToken: string;
} {
  const accessToken = jwt.sign({ id: user.id }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id: user.id }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
}

export async function refreshTokens(req: Request, res: Response) {
  const user = req.user as User;
  const refreshTokenFromCookie = req.cookies.refreshToken;

  if (!user || !refreshTokenFromCookie) {
    res.clearCookie("accessToken", { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MAX_AGE });
    res.clearCookie("refreshToken", { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MAX_AGE });
    return res
      .status(401)
      .json({
        message: "Unauthorized: Invalid refresh state. Please log in again.",
      });
  }

  try {
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);
    user.refreshTokenHash = hashedNewRefreshToken;
    await AppDataSource.getRepository(User).save(user);

    res.cookie("accessToken", accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MAX_AGE });
    res.cookie("refreshToken", newRefreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MAX_AGE });

    return res.status(200).send(user);
  }
  catch (error) {
    console.error("Error refreshing token:", error);
    res.clearCookie("accessToken", { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MAX_AGE });
    res.clearCookie("refreshToken", { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MAX_AGE });
    return res
      .status(500)
      .json({
        message:
          "Internal server error during token refresh. Please log in again.",
      });
  }
}

export async function signIn(req: Request, res: Response) {
  const { email, password } = req.body;

  try {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { email },
      select: ["id", "passwordHash", "email", "isBlocked"],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Access denied." });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenHash = hashedRefreshToken;

    const userLogin = new UserLogin();
    userLogin.userId = user.id;
    const savedUserLogin = await AppDataSource.getRepository(UserLogin).save(userLogin);

    user.lastLoginAt = savedUserLogin.loginTime;
    await AppDataSource.getRepository(User).save(user);

    res.cookie("accessToken", accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MAX_AGE });
    res.cookie("refreshToken", refreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MAX_AGE });

    return res.status(200).send({ ...user, passwordHash: undefined, refreshTokenHash: undefined });
  }
  catch (error) {
    console.error("Error signing in:", error);
    return res
      .status(500)
      .json({ message: "Internal server error during sign in." });
  }
}

export async function signOut(req: Request, res: Response) {
  const user = req.user as User;

  if (user) {
    user.refreshTokenHash = null;
    await AppDataSource.getRepository(User).save(user);
  }

  try {
    res.clearCookie("accessToken", { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MAX_AGE });
    res.clearCookie("refreshToken", { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MAX_AGE });
    return res.status(200).send();
  }
  catch (error) {
    console.error("Error logging out:", error);
    return res
      .status(500)
      .json({ message: "Internal server error during logout." });
  }
}

export async function checkLogin(req: Request, res: Response) {
  const userInJwt = req.user as User;

  const userInDb = await AppDataSource.getRepository(User).findOneBy({ id: userInJwt.id });

  if (!userInJwt || !userInDb) {
    res.clearCookie("accessToken", { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MAX_AGE });
    res.clearCookie("refreshToken", { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MAX_AGE });
    return res.status(401).json({ message: "Unauthorized: Invalid user." });
  }

  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Expires", "0");

  return res.status(200).send(userInDb);
}

export async function registerUser(req: Request, res: Response) {
  const { email, name, title, password } = req.body;

  try {
    if (password.length === 0) {
      return res.status(400).json({ message: "Must enter non-empty password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User();

    user.email = email || null;
    user.name = name || null;
    user.title = title || null;
    user.passwordHash = hashedPassword;
    user.passwordSalt = salt;

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );

    user.emailVerificationToken = verificationToken;
    user.emailVerificationTokenExpiresAt = verificationTokenExpiresAt;

    const userWithoutToken = await AppDataSource.getRepository(User).save(user);

    const verificationLink = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const _emailHtml = `
         <h1>Welcome to our app!</h1>
         <p>Please verify your email address by clicking on the link below:</p>
         <a href="${verificationLink}">Verify Email</a>
         <p>This link will expire in 24 hours.</p>
       `;

    // await sendEmail({
    //   to: user.email,
    //   subject: "Email verification",
    //   html: emailHtml,
    // });
    const { accessToken, refreshToken } = generateTokens(userWithoutToken);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
    userWithoutToken.refreshTokenHash = hashedRefreshToken;

    const savedUser = await AppDataSource.getRepository(User).save(userWithoutToken);

    res.cookie("accessToken", accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MAX_AGE });
    res.cookie("refreshToken", refreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MAX_AGE });

    return res.status(201).send({ ...savedUser, passwordHash: null, refreshTokenHash: null, emailVerificationToken: null, emailVerificationTokenExpiresAt: null });
  }
  catch (error) {
    console.error("Error signing up:", error);
    if (error instanceof QueryFailedError) {
      switch (error.driverError.code) {
        case "23505":
          return res
            .status(400)
            .json({ message: "An account with this email already exists." });
        case "23502":
          return res
            .status(400)
            .json({ message: "All fields must be provided." });
        default:
          return res
            .status(400)
            .json({ message: "An error occurred while signing up." });
      }
    }
    else if (error instanceof Error) {
      return res
        .status(500)
        .json({ message: "Internal server error." });
    }
  }
}

export async function verifyEmail(req: Request, res: Response) {
  // const { token } = req.query;

  // if (!token || typeof token !== "string") {
  //   return res.status(400).json({ message: "Invalid verification link." });
  // }

  try {
    const usersRepository = AppDataSource.getRepository(User);
    const user = await usersRepository.findOne({
      where: { email: (req.user as any)?.email },
      select: [
        "status",
        "emailVerificationToken",
        "emailVerificationTokenExpiresAt",
      ],
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found or already verified." });
    }

    if (user.status === "Active") {
      return res
        .status(200)
        .json({ message: "Email already verified. You can now log in." });
    }

    if (!user.emailVerificationToken || !user.emailVerificationTokenExpiresAt) {
      return res
        .status(400)
        .json({ message: "No verification token found for this user." });
    }

    if (new Date() > user.emailVerificationTokenExpiresAt) {
      user.emailVerificationToken = null;
      user.emailVerificationTokenExpiresAt = null;
      await usersRepository.save(user);
      return res
        .status(400)
        .json({
          message: "Verification link has expired. Please request a new one.",
        });
    }

    user.status = "Active";
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiresAt = null;
    await usersRepository.update({ email: (req.user as any)?.email }, user);

    return res
      .status(200)
      .json({ message: "Email verified successfully! You can now log in." });
  }
  catch (error) {
    console.error("Error verifying email:", error);
    return res
      .status(500)
      .json({ message: "Internal server error during email verification." });
  }
}
