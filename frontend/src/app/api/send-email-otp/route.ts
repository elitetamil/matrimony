import { NextRequest, NextResponse } from "next/server";
import { generateOtp, storeOtp } from "@/lib/email/otp-store";
import { otpEmailHtml, otpEmailText } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/sender";
import { validateEmail } from "@/lib/email-validator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name } = body as { email: string; name?: string };

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json({ error: emailValidation.error || "Please enter a valid Gmail address." }, { status: 400 });
    }

    // Always generate dynamic 6-digit random OTP
    const otp = generateOtp();
    
    // Store OTP in DB FIRST — if this fails, do not send the email
    try {
      await storeOtp(email, otp);
    } catch (storeErr) {
      console.error("[send-email-otp] storeOtp threw:", storeErr);
      return NextResponse.json(
        { error: "Could not save OTP. Please try again." },
        { status: 500 }
      );
    }

    const displayName = name || "there";

    const result = await sendEmail({
      to: email,
      subject: "Verify your email — Elite Tamil Matrimony",
      html: otpEmailHtml(displayName, otp),
      text: otpEmailText(displayName, otp),
    });

    if (!result.success) {
      console.error("[send-email-otp] Email delivery error:", result.error);
      return NextResponse.json(
        { error: result.error || "Failed to send OTP email. Please check email settings." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[send-email-otp] Unexpected error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

