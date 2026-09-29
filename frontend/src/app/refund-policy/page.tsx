import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import BackButton from "@/components/ui/BackButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — Elite Tamil Matrimony",
  description:
    "Learn about the refund, cancellation, and fee policies for Elite Tamil Matrimony memberships and services.",
};

export default function RefundPolicyPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: "#FAF4F0", minHeight: "calc(100vh - 120px)", padding: "1.5rem 0 4rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.25rem" }}>
          {/* Back Button */}
          <div style={{ marginBottom: "1rem" }}>
            <BackButton style={{ background: "#fff", border: "1px solid #E5D5C5", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }} />
          </div>

          {/* Hero Header */}
          <div
            style={{
              background: "#6B1A2A",
              borderRadius: "16px",
              padding: "2.25rem 2.5rem",
              marginBottom: "1.75rem",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(107, 26, 42, 0.12)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1.125rem", marginBottom: "0.75rem" }}>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  width: "52px",
                  height: "52px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="6" y1="12" x2="10" y2="12" />
                  <line x1="14" y1="12" x2="18" y2="12" />
                </svg>
              </div>
              <h1 style={{ margin: 0, fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 800, color: "#fff" }}>
                Refund &amp; Cancellation Policy
              </h1>
            </div>
            <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.9)", fontSize: "1rem", lineHeight: 1.6, maxWidth: "750px" }}>
              Information regarding subscription cancellations, refund eligibility, and payment processing rules.
            </p>
          </div>

          {/* Policy Content Card */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #E5D5C5",
              borderRadius: "14px",
              padding: "2rem 2.25rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              gap: "1.75rem",
              fontSize: "0.9375rem",
              color: "#333",
              lineHeight: 1.75,
            }}
          >
            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#6B1A2A", margin: "0 0 0.75rem", borderBottom: "1.5px solid #F8ECE8", paddingBottom: "0.5rem" }}>
                1. General Membership Fee Policy
              </h2>
              <p>
                Elite Tamil Matrimony provides digital matchmaking and premium subscription features. All membership fees paid on <strong>elitetamilmatrimony.com</strong> are generally <strong>non-refundable</strong> once the subscription plan is activated and feature access is granted.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#6B1A2A", margin: "0 0 0.75rem", borderBottom: "1.5px solid #F8ECE8", paddingBottom: "0.5rem" }}>
                2. Exceptions &amp; Refund Eligibility
              </h2>
              <p>A refund request may be reviewed and considered only under the following specific circumstances:</p>
              <ul style={{ paddingLeft: "1.25rem", margin: "0.5rem 0" }}>
                <li><strong>Duplicate Billing:</strong> Multiple payments processed inadvertently for a single transaction due to a gateway error.</li>
                <li><strong>Technical Failure:</strong> Payment completed successfully but premium services were not credited to your account and could not be provisioned after contacting support.</li>
              </ul>
              <p style={{ marginTop: "0.5rem" }}>
                Refund requests under these conditions must be submitted within <strong>48 hours</strong> of the transaction date.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#6B1A2A", margin: "0 0 0.75rem", borderBottom: "1.5px solid #F8ECE8", paddingBottom: "0.5rem" }}>
                3. Non-Refundable Scenarios
              </h2>
              <p>Refunds will not be granted under the following conditions:</p>
              <ul style={{ paddingLeft: "1.25rem", margin: "0.5rem 0" }}>
                <li>Change of mind or finding a match before plan expiration.</li>
                <li>Lack of response from other registered members or matches.</li>
                <li>Suspension or termination of an account resulting from a violation of our <Link href="/terms" style={{ color: "var(--primary)", textDecoration: "underline" }}>Terms of Use</Link>.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#6B1A2A", margin: "0 0 0.75rem", borderBottom: "1.5px solid #F8ECE8", paddingBottom: "0.5rem" }}>
                4. Processing of Approved Refunds
              </h2>
              <p>
                If a refund is approved by our support team, the amount will be processed back to the original payment method (Credit/Debit Card, Netbanking, UPI) within <strong>5 to 7 business days</strong>.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#6B1A2A", margin: "0 0 0.75rem", borderBottom: "1.5px solid #F8ECE8", paddingBottom: "0.5rem" }}>
                5. Contact Us
              </h2>
              <p style={{ margin: 0 }}>
                For any queries regarding payments or refund requests, please contact our support team at <a href="mailto:support@elitetamilmatrimony.com" style={{ color: "var(--primary)", textDecoration: "underline" }}>support@elitetamilmatrimony.com</a> or reach out via our <Link href="/contact" style={{ color: "var(--primary)", textDecoration: "underline" }}>Contact Page</Link>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
