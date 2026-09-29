import nodemailer from "nodemailer";
import { Resend } from "resend";

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(options: SendMailOptions): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html, text } = options;

  // 1. Resend API (Preferred & Verified for elitetamilmatrimony.com)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && resendKey !== "re_dummy_key_for_build" && !resendKey.includes("dummy")) {
    try {
      const resend = new Resend(resendKey);
      const resendFrom = process.env.RESEND_FROM_EMAIL || "Elite Tamil Matrimony <admin@elitetamilmatrimony.com>";
      const { error } = await resend.emails.send({
        from: resendFrom,
        to: [to],
        subject,
        html,
        text,
      });

      if (error) {
        console.error("[sendEmail] Resend error:", error);
        return { success: false, error: `Resend error: ${error.message}` };
      }

      console.log(`[sendEmail] Email successfully sent to ${to} via Resend (${resendFrom})`);
      return { success: true };
    } catch (resendErr: any) {
      console.error("[sendEmail] Resend delivery failed:", resendErr);
      return { success: false, error: resendErr?.message || "Resend delivery error" };
    }
  }

  // 2. Zoho Mail / SMTP Fallback
  const smtpHost = process.env.SMTP_HOST || (process.env.ZOHO_EMAIL ? "smtppro.zoho.in" : undefined);
  const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
  const smtpUser = process.env.SMTP_USER || process.env.ZOHO_EMAIL;
  const smtpPass = process.env.SMTP_PASS || process.env.ZOHO_PASSWORD || process.env.ZOHO_APP_PASSWORD;
  const fromAddress =
    process.env.SMTP_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    (smtpUser ? `Elite Tamil Matrimony <${smtpUser}>` : "Elite Tamil Matrimony <admin@elitetamilmatrimony.com>");

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost || "smtppro.zoho.in",
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: true,
        },
      });

      await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
        text,
      });

      console.log(`[sendEmail] Email successfully sent to ${to} via SMTP (${smtpHost || "Zoho"})`);
      return { success: true };
    } catch (smtpErr: any) {
      console.error("[sendEmail] SMTP delivery failed:", smtpErr);
      return {
        success: false,
        error: `SMTP sending failed: ${smtpErr?.message || "Please verify SMTP credentials"}`,
      };
    }
  }

  // 3. Neither configured
  return {
    success: false,
    error: "Email service is not configured. Please add RESEND_API_KEY to .env.local.",
  };
}
