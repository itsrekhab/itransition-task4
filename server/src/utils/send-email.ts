import nodemailer from "nodemailer";

import { env } from "@/env.js";

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
};

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: env.EMAIL_PORT === 465,
  auth: {
    user: env.EMAIL_USERNAME,
    pass: env.EMAIL_PASSWORD,
  },
});

export async function sendEmail(options: EmailOptions) {
  const mailOptions = {
    from: `Task 4 - ${env.EMAIL_USERNAME}`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Verification email sent to ${options.to}`);
}
