"use client";

import { useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import BackButton from "@/components/ui/BackButton";
import Footer from "@/components/layout/Footer";

const LAST_UPDATED = "September 5, 2026";
const EFFECTIVE_DATE = "September 5, 2026";

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: "introduction",
    title: "1. Introduction",
    content: (
      <>
        <p>
          Welcome to <strong>Elite Tamil Matrimony</strong> (&ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), operated by Elite Tamil Matrimony (a division
          of BharatMatrimony group). We are committed to protecting your personal information and your right to
          privacy.
        </p>
        <p>
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit
          our website <strong>elitetamilmatrimony.com</strong> and use our services. Please read this policy carefully.
          If you disagree with its terms, please discontinue use of the Platform immediately.
        </p>
        <p>
          By accessing or using our Platform, you acknowledge that you have read, understood, and agree to be bound
          by this Privacy Policy. This policy is incorporated into and forms part of our{" "}
          <Link href="/terms" style={{ color: "var(--primary)", textDecoration: "underline" }}>
            Terms of Use
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: "data-collected",
    title: "2. Information We Collect",
    content: (
      <>
        <p>We collect information in the following ways:</p>

        <h4>2.1 Information You Provide Directly</h4>
        <ul>
          <li><strong>Identity Data:</strong> Full name, date of birth, gender, religion, caste, sub-caste, gothram, mother tongue, marital status</li>
          <li><strong>Contact Data:</strong> Mobile number, email address, city, state, country, native place</li>
          <li><strong>Profile Data:</strong> Height, weight, physical status, education, college, occupation, company, employment type, annual income, diet, smoking/drinking habits, disabilities</li>
          <li><strong>Astrological Data:</strong> Star (Nakshatram), Rasi, Dhosham details</li>
          <li><strong>Family Data:</strong> Father&apos;s occupation, mother&apos;s occupation, family type, family status, number of brothers/sisters</li>
          <li><strong>Partner Preferences:</strong> Age range, religion, caste, education, occupation, income, height, country, marital status, mother tongue</li>
          <li><strong>Photos and Media:</strong> Profile photographs and additional gallery images you upload</li>
          <li><strong>About Me:</strong> Any free-text biography or description you write</li>
          <li><strong>Authentication Credentials:</strong> Password (stored as a salted hash — never in plain text), OTP verification records</li>
          <li><strong>Payment Information:</strong> Membership plan selected, amount paid; we do NOT store your card/bank details — these are processed by our payment partner (Razorpay)</li>
        </ul>

        <h4>2.2 Information Collected Automatically</h4>
        <ul>
          <li><strong>Device Data:</strong> Device type, operating system, browser type and version, screen resolution</li>
          <li><strong>Log Data:</strong> IP address, pages visited, time spent on pages, referrer URL, clickstream data, search queries on the Platform</li>
          <li><strong>Cookies and Tracking:</strong> Session cookies, persistent cookies, local storage tokens (see Section 8 — Cookie Policy)</li>
          <li><strong>Usage Analytics:</strong> Features used, profiles viewed, messages sent (metadata only, not content), search filters applied</li>
          <li><strong>Location Data:</strong> Approximate location derived from IP address. We do not collect GPS coordinates.</li>
          <li><strong>Performance Data:</strong> App crash reports, load times, error logs</li>
        </ul>

        <h4>2.3 Information from Third Parties</h4>
        <ul>
          <li><strong>MSG91 (SMS OTP Provider):</strong> OTP delivery status, mobile verification confirmation</li>
          <li><strong>Resend (Email OTP Provider):</strong> Email delivery status, bounce information</li>
          <li><strong>Razorpay (Payment Gateway):</strong> Payment status, transaction reference ID</li>
          <li><strong>Supabase (Database &amp; Auth Provider):</strong> Authentication events, session metadata</li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Information",
    content: (
      <>
        <p>We use the information we collect for the following lawful purposes:</p>
        <ul>
          <li><strong>Matchmaking Services:</strong> Displaying your profile to potential matches based on compatibility algorithms and partner preferences</li>
          <li><strong>Account Management:</strong> Creating and maintaining your account, authenticating your identity, processing OTPs and password logins</li>
          <li><strong>Communication:</strong> Sending you OTPs, match notifications, interest alerts, system messages, and important service announcements via SMS and email</li>
          <li><strong>Payment Processing:</strong> Verifying and processing membership payments, generating invoices, managing subscription renewals</li>
          <li><strong>Fraud Prevention &amp; Safety:</strong> Detecting fake profiles, suspicious login patterns, duplicate accounts, and other abuse. Rate-limiting login attempts to protect accounts.</li>
          <li><strong>Legal Compliance:</strong> Complying with Indian law, court orders, law enforcement requests, and regulatory requirements under the Information Technology Act 2000 and its amendments</li>
          <li><strong>Platform Improvement:</strong> Analyzing usage data to improve features, fix bugs, and personalize your experience</li>
          <li><strong>Marketing Communications:</strong> Sending promotional offers and updates about new features (you may opt out at any time by contacting us)</li>
          <li><strong>Dispute Resolution:</strong> Investigating complaints, resolving disputes between users, enforcing our Terms of Use</li>
          <li><strong>Security:</strong> Monitoring for security threats, maintaining audit logs, storing rate-limiting data in cookies to prevent brute-force attacks</li>
        </ul>

        <div className="policy-notice">
          <strong>⚠️ Important Limitation:</strong> Elite Tamil Matrimony is an introduction platform only. We do
          not conduct background checks, verify marital status, criminal records, employment claims, income
          claims, or any other information provided by users. The Platform connects people — all further verification,
          due diligence, and decision-making responsibility lies entirely with you.
        </div>
      </>
    ),
  },
  {
    id: "data-sharing",
    title: "4. How We Share Your Information",
    content: (
      <>
        <p>We do not sell your personal data. We share your information only in the following circumstances:</p>
        <ul>
          <li><strong>With Other Members:</strong> Your profile information (name, age, location, photos, educational and professional details, partner preferences) is visible to registered members of the Platform as part of the matchmaking service. Sensitive contact details (mobile number, email) are only shared when both parties express mutual interest and as per your privacy settings.</li>
          <li><strong>Service Providers:</strong> We engage trusted third-party vendors to operate our Platform:
            <ul>
              <li>Supabase Inc. — Database, authentication, and file storage</li>
              <li>MSG91 — SMS OTP delivery</li>
              <li>Resend — Transactional email delivery</li>
              <li>Razorpay — Payment processing</li>
              <li>Cloudflare — CDN and DDoS protection</li>
            </ul>
            These vendors process data only as instructed by us and are bound by confidentiality obligations.
          </li>
          <li><strong>Legal Requirements:</strong> We may disclose your information to government authorities, law enforcement agencies, or courts when required by law, court order, subpoena, or to protect the rights, property, or safety of our users or the public</li>
          <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of all or a portion of our assets, your data may be transferred to the acquiring entity, subject to equivalent privacy protections</li>
          <li><strong>With Your Consent:</strong> For any other purpose disclosed to you at the time of collection, or with your explicit consent</li>
        </ul>
        <p>We do <strong>not</strong> share your data with advertisers, data brokers, or any third party for their independent marketing purposes.</p>
      </>
    ),
  },
  {
    id: "data-retention",
    title: "5. Data Retention",
    content: (
      <>
        <p>We retain your personal data for as long as necessary to provide our services and comply with legal obligations:</p>
        <ul>
          <li><strong>Active Accounts:</strong> Your profile data is retained for the duration of your account and for 3 years after account closure or deletion request, as required by applicable Indian law</li>
          <li><strong>Payment Records:</strong> Financial transaction records are retained for 7 years as required under the Income Tax Act and GST rules</li>
          <li><strong>Audit Logs:</strong> Security and access logs are retained for 1 year</li>
          <li><strong>OTP Records:</strong> OTP delivery logs are retained for 90 days</li>
          <li><strong>Deleted Accounts:</strong> When you delete your account, your profile is removed from public view immediately. However, residual data may remain in our backup systems for up to 90 days before permanent deletion.</li>
        </ul>
        <div className="policy-notice">
          <strong>Note:</strong> We cannot guarantee deletion of data that has been cached, indexed, or
          shared by other users (e.g., screenshots of your profile taken by other members). This is beyond
          our technical control.
        </div>
      </>
    ),
  },
  {
    id: "security",
    title: "6. Data Security",
    content: (
      <>
        <p>We implement industry-standard security measures to protect your data:</p>
        <ul>
          <li>SSL/TLS encryption for all data in transit</li>
          <li>AES-256 encryption for sensitive data at rest in Supabase</li>
          <li>Passwords are hashed using bcrypt with a salt — never stored in plain text</li>
          <li>Row-Level Security (RLS) policies on our database — users can only access their own data unless explicitly permitted</li>
          <li>Rate limiting on all authentication endpoints (login, OTP) to prevent brute-force attacks</li>
          <li>Login attempt tracking stored in secure cookies to prevent bypass via page refresh</li>
          <li>Regular security audits and dependency updates</li>
        </ul>
        <div className="policy-notice policy-warning">
          <strong>⚠️ No Absolute Security Guarantee:</strong> Despite our best efforts, no method of transmission
          over the Internet or electronic storage is 100% secure. We cannot guarantee the absolute security of
          your data. In the event of a data breach, we will notify affected users as required by applicable law.
          The Platform shall not be liable for any unauthorized access resulting from factors beyond our reasonable
          control, including but not limited to user negligence, phishing attacks, malware, or third-party
          service provider breaches.
        </div>
      </>
    ),
  },
  {
    id: "user-rights",
    title: "7. Your Rights",
    content: (
      <>
        <p>As a user, you have the following rights with respect to your personal data:</p>
        <ul>
          <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you</li>
          <li><strong>Right to Correction:</strong> Update or correct inaccurate or incomplete information via your profile settings or by contacting us</li>
          <li><strong>Right to Deletion:</strong> Request deletion of your account and associated data (subject to legal retention requirements). To delete your account, contact <a href="mailto:support@elitetamilmatrimony.com" style={{ color: "var(--primary)" }}>support@elitetamilmatrimony.com</a></li>
          <li><strong>Right to Restrict Processing:</strong> Request that we limit how we use your data in certain circumstances</li>
          <li><strong>Right to Data Portability:</strong> Request your profile data in a portable format</li>
          <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for marketing communications at any time by unsubscribing or contacting us</li>
          <li><strong>Right to Object:</strong> Object to processing of your personal data where we rely on legitimate interests as our legal basis</li>
        </ul>
        <p>
          To exercise any of these rights, please email us at{" "}
          <a href="mailto:privacy@elitetamilmatrimony.com" style={{ color: "var(--primary)" }}>
            privacy@elitetamilmatrimony.com
          </a>{" "}
          with the subject line &ldquo;Privacy Rights Request.&rdquo; We will respond within 30 days.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "8. Cookie Policy",
    content: (
      <>
        <p>We use cookies and similar tracking technologies on our Platform. Cookies are small text files stored on your device.</p>

        <h4>Types of Cookies We Use</h4>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ background: "var(--primary-light)" }}>
              <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", border: "1px solid var(--border-color)" }}>Cookie Name / Type</th>
              <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", border: "1px solid var(--border-color)" }}>Purpose</th>
              <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", border: "1px solid var(--border-color)" }}>Duration</th>
              <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", border: "1px solid var(--border-color)" }}>Essential?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>Session / Auth Token</td>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>Keeps you logged in securely</td>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>Session</td>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>✅ Yes</td>
            </tr>
            <tr>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>etm_cookie_consent</td>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>Remembers your cookie consent choice</td>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>1 year</td>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>✅ Yes</td>
            </tr>
            <tr>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>etm_rl_pw_*</td>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>Tracks failed login attempts to prevent brute-force attacks</td>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>Up to 24 hours</td>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>✅ Yes (Security)</td>
            </tr>
            <tr>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>etm_auth_email_*</td>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>Caches authentication email for faster login on repeat visits</td>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>Persistent (localStorage)</td>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>✅ Yes</td>
            </tr>
            <tr>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>Analytics Cookies</td>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>Understand how users navigate the Platform</td>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>Up to 2 years</td>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>❌ Optional</td>
            </tr>
            <tr>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>Layout / Offline Cache</td>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>Service Worker cache for faster page loads</td>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>Until cache cleared</td>
              <td style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>❌ Optional</td>
            </tr>
          </tbody>
        </table>

        <p style={{ marginTop: "1rem" }}>
          You can control cookies through your browser settings. Note that disabling essential cookies may break
          your ability to stay logged in. To opt out of optional analytics cookies, click &ldquo;Reject Non-Essential&rdquo;
          on the cookie banner shown on your first visit.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "9. Platform Liability & Disclaimer",
    content: (
      <>
        <div className="policy-notice policy-warning">
          <strong>⚠️ IMPORTANT — PLEASE READ CAREFULLY</strong>
        </div>

        <p>
          Elite Tamil Matrimony is an <strong>online introduction/matchmaking platform</strong>. We provide a
          technology platform to help users find potential marriage partners. We are <strong>not a matrimonial agency,
          dating service, or guarantee of marriage</strong>.
        </p>

        <h4>9.1 No Responsibility for User Actions</h4>
        <p>
          We do not verify, and are not responsible for, the accuracy of information provided by any user. All
          profile information is self-reported. We explicitly disclaim responsibility for:
        </p>
        <ul>
          <li>Fake, fraudulent, or misrepresented profiles</li>
          <li>Any meeting, interaction, or relationship that arises from using this Platform</li>
          <li>Any physical harm, emotional distress, financial loss, or other damage resulting from meeting or communicating with another user</li>
          <li>Any matrimonial disputes, divorces, or relationship breakdowns</li>
          <li>Any fraud, cheating, or misrepresentation by another user</li>
          <li>Any decisions you make based on information on this Platform</li>
        </ul>

        <h4>9.2 No Responsibility for Data Loss</h4>
        <p>
          While we maintain regular backups, we are <strong>not liable for any loss of your profile data, photos,
          messages, or any other content</strong> due to:
        </p>
        <ul>
          <li>Technical failures, server outages, or infrastructure issues</li>
          <li>Cyber attacks, unauthorized access, or data breaches beyond our reasonable control</li>
          <li>Account deletion or termination (voluntary or enforced)</li>
          <li>Migration or upgrade of our database or hosting infrastructure</li>
          <li>Acts of God, natural disasters, or force majeure events</li>
        </ul>
        <p>
          We strongly recommend maintaining copies of any important information you provide to the Platform.
        </p>

        <h4>9.3 No Responsibility for Account Terminations</h4>
        <p>
          We reserve the right to suspend or permanently terminate any user account at our sole discretion, with
          or without notice, for violations of our Terms of Use, suspected fraud, complaints from other users,
          or any other reason we deem appropriate. We are <strong>not liable for any loss resulting from account
          suspension or termination</strong>, including loss of membership fees (except where Indian consumer
          protection law provides otherwise).
        </p>

        <h4>9.4 No Responsibility for Disputes Between Users</h4>
        <p>
          Any disputes, claims, or controversies arising between users of this Platform are solely between those
          users. Elite Tamil Matrimony is not a party to any such dispute and shall have no obligation to
          participate, mediate, arbitrate, or resolve any such dispute. Any legal costs or liabilities arising
          from user-to-user disputes shall be borne solely by the relevant parties.
        </p>

        <h4>9.5 Limitation of Liability</h4>
        <p>
          To the maximum extent permitted by applicable law, Elite Tamil Matrimony, its directors, employees,
          agents, and partners shall not be liable for any indirect, incidental, special, consequential, or
          punitive damages, including but not limited to loss of profits, loss of data, loss of goodwill, service
          interruption, computer damage, or system failure, even if we have been advised of the possibility of
          such damages.
        </p>
        <p>
          In no event shall our total cumulative liability to you for all claims exceed the amount you paid to us
          in the 3 months immediately preceding the event giving rise to the claim, or ₹500 (whichever is lower),
          to the extent permitted by law.
        </p>

        <h4>9.6 Third-Party Services</h4>
        <p>
          Our Platform integrates third-party services (Razorpay, MSG91, Resend, Supabase, Cloudflare). We are not
          responsible for any failures, outages, data breaches, or misconduct by these third-party services. Their
          own privacy policies and terms govern your interactions with them.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "10. Children's Privacy",
    content: (
      <>
        <p>
          Our Platform is strictly intended for adults aged 18 and above. We do not knowingly collect personal
          information from anyone under 18 years of age. If we discover that a user is under 18, we will
          immediately terminate their account and delete all associated data.
        </p>
        <p>
          If you believe a minor has created an account on our Platform, please contact us at{" "}
          <a href="mailto:support@elitetamilmatrimony.com" style={{ color: "var(--primary)" }}>
            support@elitetamilmatrimony.com
          </a>{" "}
          immediately.
        </p>
      </>
    ),
  },
  {
    id: "transfers",
    title: "11. International Data Transfers",
    content: (
      <>
        <p>
          Our primary database and infrastructure are hosted in data centers that may be located outside India
          (including the United States via Supabase). By using our Platform, you consent to the transfer of
          your information to countries that may have different data protection laws than India.
        </p>
        <p>
          We ensure appropriate safeguards are in place for such transfers, including standard contractual clauses
          with our service providers. If you have questions about international transfers, contact us at{" "}
          <a href="mailto:privacy@elitetamilmatrimony.com" style={{ color: "var(--primary)" }}>
            privacy@elitetamilmatrimony.com
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "12. Changes to This Privacy Policy",
    content: (
      <>
        <p>
          We may update this Privacy Policy from time to time. When we do, we will update the &ldquo;Last Updated&rdquo;
          date at the top of this page. For significant changes, we will provide a more prominent notice (such as
          a banner on the Platform or an email notification).
        </p>
        <p>
          Your continued use of the Platform after any changes to this Privacy Policy constitutes your acceptance
          of those changes. If you do not agree with the updated policy, you must stop using the Platform and
          delete your account.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "13. Contact Us",
    content: (
      <>
        <p>If you have questions, concerns, or requests regarding this Privacy Policy, please contact us:</p>
        <div style={{ background: "var(--bg-light)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "1.25rem", marginTop: "0.75rem" }}>
          <p style={{ margin: "0 0 0.5rem" }}><strong>Elite Tamil Matrimony — Privacy Officer</strong></p>
          <p style={{ margin: "0 0 0.25rem" }}>📧 <a href="mailto:privacy@elitetamilmatrimony.com" style={{ color: "var(--primary)" }}>privacy@elitetamilmatrimony.com</a></p>
          <p style={{ margin: "0 0 0.25rem" }}>📧 General Support: <a href="mailto:support@elitetamilmatrimony.com" style={{ color: "var(--primary)" }}>support@elitetamilmatrimony.com</a></p>
          <p style={{ margin: "0 0 0.25rem" }}>📞 <a href="tel:+919360653547" style={{ color: "var(--primary)" }}>+91 93606 53547</a></p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "var(--text-medium)" }}>
            We will respond to all privacy-related inquiries within <strong>30 business days</strong>.
          </p>
        </div>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return (
    <>
      <Navbar />
      <main style={{ background: "#FAF4F0", minHeight: "calc(100vh - 120px)", padding: "1.5rem 0 4rem", overflowX: "hidden" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.25rem", boxSizing: "border-box" }}>
          {/* Back Button */}
          <div style={{ marginBottom: "1rem" }}>
            <BackButton style={{ background: "#fff", border: "1px solid #E5D5C5", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }} />
          </div>

          {/* Hero Banner Card — Matching Reference Image */}
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
              <div style={{
                background: "rgba(255, 255, 255, 0.12)",
                width: "52px",
                height: "52px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
              </div>
              <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "#fff", fontFamily: "var(--font-sans)" }}>
                Privacy Policy
              </h1>
            </div>
            <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.9)", fontSize: "1.0625rem", lineHeight: 1.65, maxWidth: "750px", fontWeight: 400 }}>
              Your privacy matters to us. This policy explains how Elite Tamil Matrimony collects, uses, and protects your personal information.
            </p>
            <div style={{ marginTop: "1.25rem", display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.85)", fontWeight: 500 }}>
              <span>🗓️ Last Updated: {LAST_UPDATED}</span>
              <span>✅ Effective Date: {EFFECTIVE_DATE}</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
            {/* Table of Contents */}
            <nav
              style={{
                background: "#fff",
                border: "1px solid #E5D5C5",
                borderRadius: "14px",
                padding: "1.5rem 1.75rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, margin: "0 0 1rem", color: "#111" }}>
                Table of Contents
              </h2>
              <ol style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      style={{ color: "#6B1A2A", textDecoration: "none", fontSize: "0.875rem", lineHeight: 1.5, fontWeight: 500 }}
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {/* Sections */}
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                style={{
                  background: "#fff",
                  border: "1px solid #E5D5C5",
                  borderRadius: "14px",
                  padding: "1.75rem 2rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  scrollMarginTop: "80px",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#6B1A2A",
                    margin: "0 0 1.25rem",
                    paddingBottom: "0.75rem",
                    borderBottom: "1.5px solid #F8ECE8",
                  }}
                >
                  {section.title}
                </h2>
                <div className="policy-content">{section.content}</div>
              </section>
            ))}
          </div>

          {/* Bottom nav */}
          <div
            style={{
              marginTop: "2.25rem",
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Link href="/terms" style={{ background: "#6B1A2A", color: "#fff", padding: "0.625rem 1.5rem", borderRadius: "30px", textDecoration: "none", fontWeight: 700, fontSize: "0.875rem" }}>
              Read Terms of Use →
            </Link>
            <Link href="/" style={{ background: "#fff", border: "1.5px solid #6B1A2A", color: "#6B1A2A", padding: "0.625rem 1.5rem", borderRadius: "30px", textDecoration: "none", fontWeight: 700, fontSize: "0.875rem" }}>
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />

      <style>{`
        .policy-content p {
          margin: 0 0 0.875rem;
          font-size: 0.9375rem;
          line-height: 1.7;
          color: var(--text-dark);
        }
        .policy-content ul, .policy-content ol {
          margin: 0 0 1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .policy-content li {
          font-size: 0.9375rem;
          line-height: 1.65;
          color: var(--text-dark);
        }
        .policy-content h4 {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--text-dark);
          margin: 1.25rem 0 0.5rem;
        }
        .policy-notice {
          background: #FFF8E1;
          border-left: 4px solid #F59E0B;
          padding: 0.875rem 1rem;
          border-radius: 0 6px 6px 0;
          margin: 1rem 0;
          font-size: 0.875rem;
          line-height: 1.6;
          color: #92400E;
        }
        .policy-notice.policy-warning {
          background: #FEF2F2;
          border-left-color: #EF4444;
          color: #991B1B;
        }
        .policy-content table td, .policy-content table th {
          font-size: 0.8125rem;
        }
      `}</style>
    </>
  );
}
