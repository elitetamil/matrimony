declare module "@cashfreepayments/cashfree-js" {
  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: "_modal" | "_self" | "_blank";
  }

  export interface CashfreeCheckoutResult {
    error?: {
      message?: string;
      code?: string;
      type?: string;
    };
    redirect?: boolean;
    paymentDetails?: Record<string, unknown>;
  }

  export interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<CashfreeCheckoutResult | void>;
  }

  export interface CashfreeLoadOptions {
    mode: "sandbox" | "production";
  }

  export function load(options: CashfreeLoadOptions): Promise<CashfreeInstance>;
}
