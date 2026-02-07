import type { Request, Response } from "express";

import { AppDataSource } from "@/data-source";
import { User } from "@/entities/user";

export async function getUsers(req: Request, res: Response) {
  const { sortBy = "lastLoginAt", order = "desc" } = req.query;

  const allowedSortFields = ["name", "email", "status", "lastLoginAt"];
  const actualSortBy = allowedSortFields.includes(sortBy as string)
    ? (sortBy as string)
    : "lastLoginAt";

  const actualOrder = (order as string).toUpperCase() === "ASC" ? "ASC" : "DESC";

  const userRepository = AppDataSource.getRepository(User);
  const users = await userRepository.find({
    order: {
      [actualSortBy]: actualOrder,
    },
  });

  res.json(users);
}

export async function blockUsers(req: Request, res: Response) {
  const { users } = req.body;
  const userRepository = AppDataSource.getRepository(User);
  for (const userId of users) {
    const user = await userRepository.findOneBy({
      id: userId,
    });
    if (!user)
      return res.status(404).json({ message: "User not found" });
    user.isBlocked = true;
    await userRepository.update({ id: userId }, user);
  }
  res.json(users);
}

export async function unblockUsers(req: Request, res: Response) {
  const { users } = req.body;
  const userRepository = AppDataSource.getRepository(User);
  for (const userId of users) {
    const user = await userRepository.findOneBy({
      id: userId,
    });
    if (!user)
      return res.status(404).json({ message: "User not found" });
    user.isBlocked = false;
    await userRepository.save(user);
  }
  res.json(users);
}

export async function deleteUsers(req: Request, res: Response) {
  const { users } = req.body;
  const userRepository = AppDataSource.getRepository(User);
  for (const userId of users) {
    const user = await userRepository.findOneBy({
      id: userId,
    });
    if (!user)
      return res.status(404).json({ message: "User not found" });
    await userRepository.remove(user);
  }
  res.json(users);
}

export async function deleteUnverifiedUsers(req: Request, res: Response) {
  const userRepository = AppDataSource.getRepository(User);
  const users = await userRepository.find({
    where: {
      status: "Unverified",
    },
  });
  for (const user of users) {
    await userRepository.remove(user);
  }
  res.json(users);
}
