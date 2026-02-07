import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { UserLogin } from "@/entities/user-login.js";

enum Status {
  UNVERIFIED = "Unverified",
  ACTIVE = "Active",
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 100 })
  name!: string;

  @Column("varchar", { nullable: true })
  title!: string | null;

  @Index({ unique: true })
  @Column("varchar", {
    unique: true,
    nullable: false,
  })
  email!: string;

  @Column("varchar", { select: false })
  passwordHash!: string;

  @Column("varchar", { select: false })
  passwordSalt!: string;

  @Column("varchar", { nullable: true, select: false })
  refreshTokenHash!: string | null;

  @Column({
    type: "enum",
    enum: Status,
    default: Status.UNVERIFIED,
  })
  status!: "Unverified" | "Active";

  @Column("boolean", { default: false })
  isBlocked!: boolean;

  @CreateDateColumn()
  lastLoginAt!: Date;

  @OneToMany(() => UserLogin, login => login.userId)
  logins!: UserLogin[];

  @Index({ unique: true })
  @Column("varchar", { nullable: true, select: false })
  emailVerificationToken!: string | null;

  @Column("timestamp", { nullable: true, select: false })
  emailVerificationTokenExpiresAt!: Date | null;
}
