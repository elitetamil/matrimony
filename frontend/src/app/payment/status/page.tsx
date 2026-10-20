"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CompactFooter from "@/components/layout/CompactFooter";
import { Check, AlertCircle, RefreshCw, Crown, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cacheActivePlan } from "@/hooks/useMembership";
import { supabase } from "@/lib/supabase";

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, refresh } = useAuth();

  const orderId = searchParams.get("order_id");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planDetails, setPlanDetails] = useState<{ plan: string; planPeriod: string; expiry: string } | null>(null);

  useEffect(() => {
    if (!orderId) {
      router.push("/membership");
      return;
    }

    let isMounted = true;

    async function verifyOrder() {
      setLoading(true);
      setError(null);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        if (!token) {
          setError("Please log in to verify and view your payment status.");
          return;
        }

        const res = await fetch("/api/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            order_id: orderId,
          }),
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.success) {
          setSuccess(true);
          setPlanDetails({
            plan: data.plan,
            planPeriod: data.planPeriod,
            expiry: data.expiry,
          });

          // Cache plan client-side
          if (user?.id) {
            cacheActivePlan(user.id, data.plan, data.expiry);
          }

          // Refresh profile in background
          setTimeout(() => {
            refresh().catch(() => {});
          }, 1200);
        } else {
          setSuccess(false);
          setError(data.error || "Payment verification could not be completed.");
        }
      } catch (err: any) {
        if (!isMounted) return;
        setSuccess(false);
        setError(err.message || "Network error while verifying payment status.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verifyOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId, user?.id]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--background-light, #FAF6F1)" }}>
      <Navbar />

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "6rem 1rem 3rem" }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--border-color, #E8DCC8)",
            borderRadius: "var(--radius-xl, 16px)",
            padding: "2.5rem 1.75rem",
            maxWidth: "480px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 8px 32px rgba(107,26,42,0.08)",
          }}
        >
          {loading && (
            <div>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  border: "4px solid rgba(107,26,42,0.15)",
                  borderTopColor: "var(--primary, #6B1A2A)",
                  borderRadius: "50%",
                  margin: "0 auto 1.5rem",
                  animation: "spin 1s linear infinite",
                }}
              />
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-dark, #222)", marginBottom: "0.5rem" }}>
                Verifying Payment Status
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--text-medium, #666)", margin: 0 }}>
                Please wait while we confirm your transaction with Cashfree...
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted, #999)", marginTop: "0.75rem" }}>
                Order ID: <code>{orderId}</code>
              </p>
            </div>
          )}

          {!loading && success && (
            <div>
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--primary, #6B1A2A) 0%, var(--secondary, #C8973A) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.25rem",
                  boxShadow: "0 4px 20px rgba(107,26,42,0.25)",
                }}
              >
                <Check size={36} color="#fff" strokeWidth={2.5} />
              </div>

              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-dark, #222)", marginBottom: "0.5rem" }}>
                Payment Successful!
              </h2>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "linear-gradient(135deg, #6B1A2A 0%, #C8973A 100%)",
                  color: "#fff",
                  padding: "0.375rem 1.25rem",
                  borderRadius: "var(--radius-full, 9999px)",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  margin: "0 auto 1rem",
                }}
              >
                <Crown size={18} />
                <span>{planDetails?.plan || "Premium"} Member</span>
              </div>

              <p style={{ color: "var(--text-medium, #555)", fontSize: "0.9375rem", lineHeight: 1.5, marginBottom: "0.5rem" }}>
                Congratulations! Your <strong>{planDetails?.plan}</strong> plan ({planDetails?.planPeriod}) has been activated successfully.
              </p>

              {planDetails?.expiry && (
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted, #777)", marginBottom: "1.75rem" }}>
                  Valid until:{" "}
                  <strong>
                    {new Date(planDetails.expiry).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                </p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <Link
                  href="/matches"
                  className="btn btn-primary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "var(--radius-full, 9999px)",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  <span>Explore Matches</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/"
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-medium, #666)",
                    textDecoration: "none",
                    padding: "0.5rem",
                  }}
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          )}

          {!loading && !success && (
            <div>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "#FFEBEE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.25rem",
                  color: "#D32F2F",
                }}
              >
                <AlertCircle size={32} />
              </div>

              <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--text-dark, #222)", marginBottom: "0.5rem" }}>
                Payment Incomplete or Failed
              </h2>

              <p style={{ color: "var(--text-medium, #555)", fontSize: "0.875rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
                {error || "The payment transaction was not completed or was cancelled."}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <Link
                  href="/membership"
                  className="btn btn-primary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "var(--radius-full, 9999px)",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  <RefreshCw size={16} />
                  <span>Try Again</span>
                </Link>

                <Link
                  href="/contact"
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--text-muted, #777)",
                    textDecoration: "none",
                    padding: "0.5rem",
                  }}
                >
                  Need help? Contact Support
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <CompactFooter />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div>Loading status...</div>
        </div>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}
