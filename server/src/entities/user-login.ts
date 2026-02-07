import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { User } from "@/entities/user.js";

@Entity()
export class UserLogin {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, user => user.logins, { onDelete: "CASCADE" })
  userId!: number;

  @CreateDateColumn()
  loginTime!: Date;
}
