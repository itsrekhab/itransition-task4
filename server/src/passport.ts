import type { Request } from "express";

import passport from "passport";
import PassportJwt from "passport-jwt";

import type { TokenContents } from "@/middleware/auth-middleware";

import { AppDataSource } from "@/data-source.js";
import { User } from "@/entities/user";
import { env } from "@/env.js";

const { Strategy: JwtStrategy } = PassportJwt;

const opts = {
  jwtFromRequest: (req: Request) => {
    let token = null;
    if (req && req.cookies) {
      token = req.cookies.accessToken;
    }
    return token;
  },
  secretOrKey: env.ACCESS_TOKEN_SECRET,
} satisfies PassportJwt.StrategyOptionsWithoutRequest;

passport.use(
  new JwtStrategy(opts, async (jwt_payload: TokenContents, done) => {
    try {
      const usersRepository = AppDataSource.getRepository(User);
      const user = await usersRepository.findOne({
        where: { id: jwt_payload.id },
      });

      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    }
    catch (error) {
      return done(error, false);
    }
  }),
);
