"use client";

import { useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import BackButton from "@/components/ui/BackButton";
import StaticPageHeader from "@/components/ui/StaticPageHeader";
import CompactFooter from "@/components/layout/CompactFooter";

const LAST_UPDATED = "September 5, 2026";
const EFFECTIVE_DATE = "September 5, 2026";

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: (
      <>
        <p>
          Welcome to <strong>Elite Tamil Matrimony</strong> (&ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). By accessing, browsing, or
          using this website and its services, you agree to be legally bound by these Terms of Use
          (&ldquo;Terms&rdquo;). If you do not agree to these Terms, <strong>do not use this Platform</strong>.
        </p>
        <p>
          These Terms constitute a legally binding agreement between you and Elite Tamil Matrimony. They are
          incorporated with our{" "}
          <Link href="/privacy-policy" style={{ color: "var(--primary)" }}>
            Privacy Policy
          </Link>
          , which forms part of this agreement.
        </p>
        <p>
          We reserve the right to modify these Terms at any time. Continued use of the Platform after changes
          are posted constitutes your acceptance of the modified Terms.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "2. Eligibility",
    content: (
      <>
        <p>To use this Platform, you must:</p>
        <ul>
          <li>Be at least <strong>18 years of age</strong></li>
          <li>Be a natural person (not a corporation or other legal entity)</li>
          <li>Be legally eligible to marry under applicable Indian law at the time of seeking a match</li>
          <li>Currently be <strong>unmarried, widowed, or divorced</strong> (if divorced, legally so per Indian court order)</li>
          <li>Have the legal capacity to enter into this agreement</li>
          <li>Not be barred from using this Platform under any applicable law</li>
          <li>Not have previously been permanently banned from this Platform</li>
        </ul>
        <p>
          By creating an account, you represent and warrant that all of the above conditions are satisfied. If
          we discover that any representation is false, we reserve the right to immediately terminate your account
          without notice and without liability.
        </p>
        <p>
          <strong>For profiles created on behalf of others:</strong> The person creating the profile (e.g., a
          parent creating a profile for their child) represents that they have the express consent of the person
          whose profile is being created, and that the above eligibility criteria apply to that person.
        </p>
      </>
    ),
  },
  {
    id: "registration",
    title: "3. Account Registration & Security",
    content: (
      <>
        <ul>
          <li>You must provide accurate, truthful, and complete information when registering. You agree to keep your information updated.</li>
          <li>You are responsible for maintaining the confidentiality of your password and login credentials.</li>
          <li>You are responsible for all activities that occur under your account, whether authorised by you or not.</li>
          <li>You must immediately notify us at <a href="mailto:support@elitetamilmatrimony.com" style={{ color: "var(--primary)" }}>support@elitetamilmatrimony.com</a> if you suspect unauthorised access to your account.</li>
          <li>We will never ask for your password by phone, email, or chat. Any communication requesting your password is fraudulent.</li>
          <li>One person may maintain multiple profiles (e.g., for different family members) but each profile must represent a distinct, real individual who meets the eligibility criteria.</li>
        </ul>
      </>
    ),
  },
  {
    id: "user-rules",
    title: "4. User Rules & Prohibited Conduct",
    content: (
      <>
        <div className="policy-notice policy-warning">
          <strong>⚠️ MANDATORY RULES — Violation will result in permanent account ban</strong>
        </div>

        <p>
          By using this Platform, you agree to comply with the following rules. Violations may result in
          warnings, temporary suspension, or <strong>permanent account termination without refund</strong>.
          We maintain sole discretion in determining whether a violation has occurred and the appropriate
          consequence.
        </p>

        <h4>4.1 Absolutely Prohibited — Immediate Permanent Ban</h4>
        <p>The following violations will result in <strong>immediate permanent ban</strong> of your account(s):</p>
        <ul>
          <li><strong>Fake Identity:</strong> Creating a profile with false name, fake photos of another person, or misrepresenting your identity</li>
          <li><strong>Underage Profiles:</strong> Creating a profile for anyone under 18 years of age</li>
          <li><strong>Currently Married:</strong> Using the Platform while being legally married (unless widowed or legally divorced)</li>
          <li><strong>Sexual Content:</strong> Sending, requesting, or sharing obscene, pornographic, or sexually explicit content</li>
          <li><strong>Harassment &amp; Threats:</strong> Threatening, intimidating, stalking, abusing, defaming, or harassing any user or staff member</li>
          <li><strong>Fraud:</strong> Attempting to deceive users for money, gifts, or any form of financial benefit; catfishing; romance scams</li>
          <li><strong>Human Trafficking:</strong> Any activity related to trafficking, forced marriage, or exploitation</li>
          <li><strong>Platform Hacking:</strong> Attempting to gain unauthorised access to our systems, other accounts, databases, or servers</li>
          <li><strong>Multiple Bans:</strong> Creating a new account after a permanent ban</li>
        </ul>

        <h4>4.2 Prohibited — Progressive Enforcement (Warning → Suspension → Permanent Ban)</h4>
        <ul>
          <li>Soliciting money, gifts, or favours from other users</li>
          <li>Sharing contact information (phone, email, WhatsApp, social media) before the Platform permits it</li>
          <li>Copying, scraping, or harvesting profile information for use outside the Platform</li>
          <li>Using automated bots, scripts, or crawlers to access or interact with the Platform</li>
          <li>Impersonating any other person, including another member, celebrity, or ETM staff</li>
          <li>Sending spam, chain letters, or unsolicited bulk messages</li>
          <li>Posting profiles for commercial purposes, advertising, or promoting services</li>
          <li>Using the Platform for any purpose other than genuine matrimonial search</li>
          <li>Uploading content that infringes any copyright, trademark, or other intellectual property</li>
          <li>Using offensive, derogatory, or discriminatory language based on caste, religion, gender, or any protected characteristic</li>
          <li>Attempting to circumvent rate limiting, login lockouts, or other security measures</li>
        </ul>

        <h4>4.3 Account Ban Policy</h4>
        <p>Our enforcement process for non-immediate violations:</p>
        <ol>
          <li><strong>1st violation:</strong> Written warning</li>
          <li><strong>2nd violation:</strong> 7-day account suspension</li>
          <li><strong>3rd violation:</strong> 30-day account suspension</li>
          <li><strong>4th violation:</strong> Permanent account ban</li>
        </ol>
        <p>
          For severe violations (Section 4.1), accounts will be permanently banned immediately without prior warning.
          Banned users will <strong>not be entitled to any refund</strong> of membership fees.
          Ban decisions are final and are at the sole discretion of Elite Tamil Matrimony.
        </p>

        <div className="policy-notice">
          <strong>📢 Reporting Violations:</strong> If you encounter another user violating these rules, please
          report them immediately via the &ldquo;Report Profile&rdquo; button or email{" "}
          <a href="mailto:support@elitetamilmatrimony.com" style={{ color: "var(--primary)" }}>
            trust@elitetamilmatrimony.com
          </a>
          . We review all reports within 48 hours.
        </div>
      </>
    ),
  },
  {
    id: "platform-role",
    title: "5. Platform Role & Disclaimer",
    content: (
      <>
        <p>
          Elite Tamil Matrimony is an <strong>online technology platform</strong> that facilitates introductions
          between individuals seeking marriage partners. We are expressly <strong>NOT</strong>:
        </p>
        <ul>
          <li>A matrimonial agency or matchmaking bureau</li>
          <li>A background verification service</li>
          <li>A guarantor of marriage, compatibility, or any outcome</li>
          <li>A party to any relationship, engagement, or marriage that may result from using this Platform</li>
        </ul>

        <h4>5.1 No Verification of Profile Information</h4>
        <p>
          We do not verify the accuracy of any information provided by users, including but not limited to:
          name, age, marital status, educational qualifications, employment, income, photos, or family details.
          All information on profiles is self-declared. You must conduct your own due diligence before proceeding
          with any relationship.
        </p>

        <h4>5.2 No Liability for Meetings or Interactions</h4>
        <p>
          If you choose to meet another user in person, you do so entirely at your own risk. Elite Tamil
          Matrimony shall not be liable for any physical harm, emotional distress, financial loss, or any other
          consequence arising from meetings or interactions between users. We strongly recommend meeting in
          public places and conducting proper background checks before meeting any person found online.
        </p>

        <h4>5.3 No Liability for Disputes</h4>
        <p>
          Any disputes, disagreements, or legal proceedings between users of this Platform are solely the
          responsibility of the involved parties. Elite Tamil Matrimony is not a party to any such dispute
          and will not intervene unless required by law. We are not liable for any loss, damage, or expense
          arising from user-to-user disputes.
        </p>

        <h4>5.4 No Liability for Data Loss or Service Interruption</h4>
        <p>
          While we maintain backups and employ industry-standard infrastructure, we are not liable for:
        </p>
        <ul>
          <li>Loss of your profile data, photos, messages, or any other content</li>
          <li>Service downtime, technical failures, or platform unavailability</li>
          <li>Data loss resulting from server failures, cyber attacks, or force majeure events</li>
          <li>Corruption or loss of data during migrations, updates, or maintenance</li>
        </ul>
        <p>
          We recommend you maintain copies of any important information you upload to the Platform.
        </p>

        <h4>5.5 No Liability for Account Terminations</h4>
        <p>
          We reserve the right to suspend or permanently terminate any account at our sole discretion,
          including (but not limited to) for violations of these Terms, suspected fraud, or in response to
          user complaints. We are not liable for any loss arising from account termination. No refund will be
          issued for terminations resulting from Terms violations.
        </p>
      </>
    ),
  },
  {
    id: "membership",
    title: "6. Membership & Payments",
    content: (
      <>
        <h4>6.1 Free vs. Paid Membership</h4>
        <p>
          The Platform offers both free and paid membership plans. Free members have limited access to features.
          Paid (premium) members enjoy enhanced features as described in our membership plans.
        </p>

        <h4>6.2 Payment</h4>
        <ul>
          <li>All payments are processed securely through Razorpay, our payment gateway partner.</li>
          <li>All prices are in Indian Rupees (INR) and inclusive of applicable GST.</li>
          <li>By purchasing a membership, you authorise us to charge your chosen payment method for the stated amount.</li>
          <li>We do not store your card details. Payment information is handled entirely by Razorpay.</li>
        </ul>

        <h4>6.3 Refund Policy</h4>
        <ul>
          <li>Membership fees are <strong>non-refundable</strong> once a paid plan is activated, except where required by Indian consumer protection law.</li>
          <li>No refund will be issued if your account is suspended or terminated due to a Terms violation.</li>
          <li>If you believe you were charged in error, contact us within 7 days at <a href="mailto:billing@elitetamilmatrimony.com" style={{ color: "var(--primary)" }}>billing@elitetamilmatrimony.com</a></li>
          <li>Membership plans are personal and non-transferable.</li>
        </ul>

        <h4>6.4 Membership Expiry</h4>
        <p>
          Membership plans expire after the stated duration. We do not auto-renew memberships. Upon expiry,
          your account automatically reverts to free status — no data is deleted.
        </p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "7. Intellectual Property",
    content: (
      <>
        <h4>7.1 Our Content</h4>
        <p>
          The Platform, including its design, code, text, graphics, logos, and all other content created by
          us, is the intellectual property of Elite Tamil Matrimony and is protected by Indian and international
          copyright, trademark, and other IP laws. You may not copy, reproduce, distribute, or create
          derivative works without our express written permission.
        </p>

        <h4>7.2 Your Content</h4>
        <p>
          You retain ownership of any content you upload (photos, text, etc.). By uploading content, you grant
          Elite Tamil Matrimony a <strong>non-exclusive, royalty-free, worldwide licence</strong> to use, display,
          and distribute your content on the Platform for the purpose of providing our services.
        </p>
        <p>
          By uploading photos, you confirm that:
        </p>
        <ul>
          <li>The photos are of you personally and you have the right to use them</li>
          <li>The photos are recent and accurately represent your appearance</li>
          <li>You have not used another person&apos;s photo or AI-generated images</li>
          <li>The photos do not contain any inappropriate, offensive, or illegal content</li>
        </ul>
        <p>
          We reserve the right to remove any content that violates these Terms without notice.
        </p>
      </>
    ),
  },
  {
    id: "privacy",
    title: "8. Privacy",
    content: (
      <>
        <p>
          Your use of the Platform is also governed by our{" "}
          <Link href="/privacy-policy" style={{ color: "var(--primary)" }}>
            Privacy Policy
          </Link>
          , which is incorporated into these Terms by reference. Please review our Privacy Policy carefully
          to understand how we collect, use, and protect your personal data.
        </p>
      </>
    ),
  },
  {
    id: "limitation-liability",
    title: "9. Limitation of Liability & Indemnification",
    content: (
      <>
        <h4>9.1 Limitation of Liability</h4>
        <p>
          To the maximum extent permitted by applicable law, Elite Tamil Matrimony and its directors,
          employees, agents, partners, and affiliates shall not be liable for any:
        </p>
        <ul>
          <li>Indirect, incidental, special, consequential, or punitive damages</li>
          <li>Loss of profits, data, business, goodwill, or reputation</li>
          <li>Damages arising from your reliance on profile information provided by other users</li>
          <li>Damages from service outages, bugs, or security breaches beyond our reasonable control</li>
          <li>Damages from unauthorised account access due to user negligence</li>
          <li>Damages resulting from meetings or interactions with other users</li>
        </ul>
        <p>
          Our maximum aggregate liability to you for all claims shall not exceed the total amount paid by you
          to us in the 3 months preceding the claim, or ₹500, whichever is lower — to the extent permitted
          by applicable law.
        </p>

        <h4>9.2 Indemnification</h4>
        <p>
          You agree to indemnify, defend, and hold harmless Elite Tamil Matrimony, its directors, employees,
          agents, and partners from and against any claims, liabilities, damages, losses, and expenses
          (including reasonable legal fees) arising out of or in connection with:
        </p>
        <ul>
          <li>Your violation of these Terms</li>
          <li>Your violation of any applicable law</li>
          <li>Your content (photos, profile information, messages) infringing any third-party rights</li>
          <li>Any dispute between you and another user</li>
          <li>Your misrepresentation of any information on the Platform</li>
        </ul>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "10. Governing Law & Dispute Resolution",
    content: (
      <>
        <h4>10.1 Governing Law</h4>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of <strong>India</strong>.
          Any disputes shall be subject to the exclusive jurisdiction of the courts located in{" "}
          <strong>Chennai, Tamil Nadu, India</strong>.
        </p>

        <h4>10.2 Arbitration</h4>
        <p>
          Any dispute, claim, or controversy arising out of or relating to these Terms or the Platform that
          cannot be resolved informally shall be resolved by <strong>binding arbitration</strong> under the
          Arbitration and Conciliation Act, 1996 of India. The arbitration shall be conducted in Chennai,
          Tamil Nadu, in the English language. The arbitrator&apos;s decision shall be final and binding.
        </p>
        <p>
          Before initiating arbitration, you agree to first attempt to resolve the dispute by contacting us at{" "}
          <a href="mailto:support@elitetamilmatrimony.com" style={{ color: "var(--primary)" }}>
            legal@elitetamilmatrimony.com
          </a>{" "}
          and giving us 30 days to respond.
        </p>

        <h4>10.3 Class Action Waiver</h4>
        <p>
          You agree that any dispute resolution proceedings will be conducted only on an individual basis
          and not as a class, consolidated, or representative action. You waive your right to participate
          in any class-action lawsuit against Elite Tamil Matrimony.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    title: "11. Termination",
    content: (
      <>
        <h4>11.1 Termination by You</h4>
        <p>
          You may close your account at any time by contacting us at{" "}
          <a href="mailto:support@elitetamilmatrimony.com" style={{ color: "var(--primary)" }}>
            support@elitetamilmatrimony.com
          </a>
          . Upon closure, your profile will be immediately hidden from other users. Data will be deleted per
          our data retention policy (see Privacy Policy, Section 5).
        </p>

        <h4>11.2 Termination by Us</h4>
        <p>
          We may suspend or permanently terminate your account at any time, with or without notice, for:
        </p>
        <ul>
          <li>Violations of these Terms or any other applicable policy</li>
          <li>Suspected fraud, abuse, or illegal activity</li>
          <li>Requests from law enforcement or court orders</li>
          <li>Extended account inactivity (over 2 years)</li>
          <li>Any other reason at our sole discretion</li>
        </ul>
        <p>
          Upon termination, all licences granted to you are immediately revoked. You lose access to all data,
          messages, and features. No refund will be issued for unused membership days, except where required
          by applicable law.
        </p>

        <h4>11.3 Effect of Termination</h4>
        <p>
          Sections 5, 7, 9, and 10 of these Terms shall survive termination and continue to apply.
        </p>
      </>
    ),
  },
  {
    id: "miscellaneous",
    title: "12. Miscellaneous",
    content: (
      <>
        <ul>
          <li><strong>Entire Agreement:</strong> These Terms and our Privacy Policy constitute the entire agreement between you and Elite Tamil Matrimony with respect to the Platform.</li>
          <li><strong>Severability:</strong> If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.</li>
          <li><strong>Waiver:</strong> Our failure to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision.</li>
          <li><strong>Assignment:</strong> You may not assign or transfer your rights or obligations under these Terms without our prior written consent. We may assign our rights without restriction.</li>
          <li><strong>Force Majeure:</strong> We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including natural disasters, government actions, pandemics, internet outages, or third-party service failures.</li>
          <li><strong>No Partnership:</strong> Nothing in these Terms creates any partnership, employment, or agency relationship between you and Elite Tamil Matrimony.</li>
          <li><strong>Language:</strong> These Terms are written in English. In the event of any conflict between an English version and any translation, the English version prevails.</li>
        </ul>
      </>
    ),
  },
  {
    id: "contact",
    title: "13. Contact Us",
    content: (
      <>
        <p>For questions about these Terms, please contact:</p>
        <div style={{ background: "var(--bg-light)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "1.25rem", marginTop: "0.75rem" }}>
          <p style={{ margin: "0 0 0.5rem" }}><strong>Elite Tamil Matrimony — Legal Team</strong></p>
          <p style={{ margin: "0 0 0.25rem" }}>📧 <a href="mailto:legal@elitetamilmatrimony.com" style={{ color: "var(--primary)" }}>legal@elitetamilmatrimony.com</a></p>
          <p style={{ margin: "0 0 0.25rem" }}>📧 General Support: <a href="mailto:support@elitetamilmatrimony.com" style={{ color: "var(--primary)" }}>support@elitetamilmatrimony.com</a></p>
          <p style={{ margin: "0 0 0.25rem" }}>📞 <a href="tel:+919360653547" style={{ color: "var(--primary)" }}>+91 93606 53547</a></p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "var(--text-medium)" }}>
            We will respond to legal inquiries within <strong>10 business days</strong>.
          </p>
        </div>
      </>
    ),
  },
];

export default function TermsPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return (
    <>
      <Navbar />
      <main style={{ background: "#FAF4F0", minHeight: "calc(100vh - 120px)", padding: "0 0 4rem" }}>
        <StaticPageHeader 
          title="Terms of Use" 
          subtitle="Please read these Terms carefully before using Elite Tamil Matrimony. These Terms govern your use of the Platform and protect both you and us." 
        />

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem 1.25rem 0" }}>
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
            <Link href="/privacy-policy" style={{ background: "#6B1A2A", color: "#fff", padding: "0.625rem 1.5rem", borderRadius: "30px", textDecoration: "none", fontWeight: 700, fontSize: "0.875rem" }}>
              Read Privacy Policy →
            </Link>
            <Link href="/" style={{ background: "#fff", border: "1.5px solid #6B1A2A", color: "#6B1A2A", padding: "0.625rem 1.5rem", borderRadius: "30px", textDecoration: "none", fontWeight: 700, fontSize: "0.875rem" }}>
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      <CompactFooter />

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
      `}</style>
    </>
  );
}
