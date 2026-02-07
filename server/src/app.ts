import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";

import "@/passport.js";
import passport from "passport";

import authRoutes from "@/api/auth.js";
import api from "@/api/index.js";
import { env } from "@/env.js";

const frontendPath = path.join(__dirname, env.NODE_ENV === "production" ? "../../../client/dist" : "../../client/dist");
const app = express();

app.use(morgan("dev"));
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());

app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api", api);

app.use(express.static(frontendPath));
app.use("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

export default app;
