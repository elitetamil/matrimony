import { Cashfree, CFEnvironment } from "cashfree-pg";

/**
 * Cashfree SDK Server-side Initialization
 *
 * Uses Cashfree PG Server SDK v6
 * Credentials must be set in environment variables:
 * - CASHFREE_APP_ID
 * - CASHFREE_SECRET_KEY
 * - CASHFREE_ENVIRONMENT (SANDBOX or PRODUCTION)
 */

export function getCashfreeClient() {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const env = (process.env.CASHFREE_ENVIRONMENT || "SANDBOX").toUpperCase();

  const isDummyAppId = !appId || appId === "your_test_app_id" || appId.includes("dummy");
  const isDummySecret = !secretKey || secretKey === "your_test_secret_key" || secretKey.includes("dummy");

  if (isDummyAppId || isDummySecret) {
    throw new Error(
      "Cashfree credentials are not configured or contain placeholder values. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in your .env.local file."
    );
  }

  const cfEnvironment =
    env === "PRODUCTION" ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

  return new Cashfree(cfEnvironment, appId, secretKey);
}

export interface CreateOrderParams {
  orderId: string;
  orderAmount: number; // In Rupees (e.g. 4719)
  customerId: string;
  customerPhone: string;
  customerName?: string;
  customerEmail?: string;
  returnUrl?: string;
  orderNote?: string;
}

/**
 * Creates a Cashfree payment order and returns the payment_session_id
 */
export async function createCashfreeOrder(params: CreateOrderParams) {
  const client = getCashfreeClient();

  // Cashfree requires phone number formatted with 10 digits
  let cleanPhone = params.customerPhone ? params.customerPhone.replace(/\D/g, "") : "";
  if (cleanPhone.length > 10 && cleanPhone.startsWith("91")) {
    cleanPhone = cleanPhone.slice(2);
  }

  const isProduction =
    process.env.NODE_ENV === "production" ||
    (process.env.CASHFREE_ENVIRONMENT || "").toUpperCase() === "PRODUCTION";

  if (cleanPhone.length !== 10) {
    if (isProduction) {
      throw new Error(
        "A valid 10-digit customer mobile number is required to create a payment order."
      );
    }
    // Sandbox only fallback for local testing when user has no phone in profile
    cleanPhone = "9999999999";
  }

  // Ensure clean customer ID without special characters
  const cleanCustomerId = params.customerId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);

  const request = {
    order_id: params.orderId,
    order_amount: Math.round(params.orderAmount * 100) / 100, // Two decimals
    order_currency: "INR",
    customer_details: {
      customer_id: cleanCustomerId,
      customer_phone: cleanPhone,
      customer_email: params.customerEmail || "member@elitetamilmatrimony.com",
      customer_name: params.customerName || "Member",
    },
    order_meta: params.returnUrl
      ? {
          return_url: params.returnUrl,
        }
      : undefined,
    order_note: params.orderNote || "Elite Tamil Matrimony Membership",
  };

  const response = await client.PGCreateOrder(request);
  return response.data;
}

/**
 * Fetches order details directly from Cashfree
 */
export async function getCashfreeOrder(orderId: string) {
  const client = getCashfreeClient();
  const response = await client.PGFetchOrder(orderId);
  return response.data;
}

/**
 * Fetches all payment transactions for an order directly from Cashfree
 */
export async function getCashfreeOrderPayments(orderId: string) {
  const client = getCashfreeClient();
  const response = await client.PGOrderFetchPayments(orderId);
  return response.data;
}

/**
 * Verifies webhook signature against raw request body
 */
export function verifyCashfreeWebhookSignature(
  signature: string,
  rawBody: string,
  timestamp: string
): boolean {
  try {
    const client = getCashfreeClient();
    // PGVerifyWebhookSignature throws or returns true on validation
    const verified = client.PGVerifyWebhookSignature(signature, rawBody, timestamp);
    return Boolean(verified);
  } catch (err) {
    console.warn("[Cashfree Webhook] Signature verification failed:", err);
    return false;
  }
}
