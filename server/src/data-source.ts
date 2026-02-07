import "reflect-metadata";
import { DataSource } from "typeorm";

import { UserLogin } from "@/entities/user-login.js";
import { User } from "@/entities/user.js";

import { env } from "./env.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  entities: [User, UserLogin],
  synchronize: true,
  logging: false,
});
