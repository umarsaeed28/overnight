import nodemailer from "nodemailer";
import { RESET_TOKEN_TTL_HOURS } from "./rules";

const transport = nodemailer.createTransport({ url: process.env.SMTP_URL });

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  await transport.sendMail({
    to: email,
    from: process.env.MAIL_FROM ?? "no-reply@shopdemo.example",
    subject: "Reset your ShopDemo password",
    text: [
      "Someone asked to reset the password for this email address.",
      `${APP_URL}/reset-password?token=${token}`,
      `The link works for ${RESET_TOKEN_TTL_HOURS} hours.`,
      "If this was not you, ignore this email.",
    ].join("\n\n"),
  });
}

export async function sendOrderConfirmation(email: string, orderId: string): Promise<void> {
  await transport.sendMail({
    to: email,
    from: process.env.MAIL_FROM ?? "no-reply@shopdemo.example",
    subject: `ShopDemo order ${orderId}`,
    text: `Thanks for your order. Reference ${orderId}.`,
  });
}
