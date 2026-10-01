import BackButton from "./BackButton";
import React from "react";

interface StaticPageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}

export default function StaticPageHeader({ title, subtitle }: StaticPageHeaderProps) {
  return (
    <>
      <style>{`
        .static-page-sticky {
          position: sticky;
          top: 60px; /* Accounts for scrolled mobile navbar height */
          z-index: 40;
          background: #FAF4F0;
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(0,0,0,0.03);
          /* Ensure no content bleeds through above the sticky header */
          margin-top: -5px;
        }
        
        /* This pseudo-element creates an extra block to prevent gaps between navbar and header */
        .static-page-sticky::before {
          content: '';
          position: absolute;
          top: -20px;
          left: 0;
          right: 0;
          height: 20px;
          background: #FAF4F0;
          z-index: -1;
        }

        .static-page-header-row {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .static-page-back {
          flex-shrink: 0;
        }
        .static-page-card {
          flex: 1;
          background: linear-gradient(135deg, #6B1A2A 0%, #8E2B3E 40%, #B8732D 75%, #C58B2B 100%);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          color: #fff;
          box-shadow: 0 4px 20px rgba(107, 26, 42, 0.18);
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        }
        .static-page-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          word-spacing: 0.05em;
          color: #fff;
          font-family: var(--font-serif);
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .static-page-subtitle {
          margin: 0.125rem 0 0 0;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.8125rem;
          line-height: 1.4;
          font-weight: 400;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @media (min-width: 768px) {
          .static-page-sticky {
            top: 70px; /* Desktop navbar height */
            padding-top: 1.5rem;
            padding-bottom: 1.25rem;
            margin-top: 0;
          }
          .static-page-header-row {
            padding: 0 1.25rem;
            align-items: flex-start;
            gap: 1.5rem;
          }
          .static-page-back {
            margin-top: 0.25rem;
          }
          .static-page-card {
            border-radius: 16px;
            padding: 1.25rem 2rem;
          }
          .static-page-title {
            font-size: clamp(1.75rem, 3.5vw, 2.25rem);
            letter-spacing: 0.02em;
            word-spacing: 0.06em;
            white-space: normal;
            overflow: visible;
          }
          .static-page-subtitle {
            font-size: 1rem;
            margin-top: 0.375rem;
            -webkit-line-clamp: unset;
          }
        }
      `}</style>
      <div className="static-page-sticky">
        <div className="static-page-header-row">
          <div className="static-page-back">
            <BackButton style={{ background: "#fff", border: "1px solid #E5D5C5", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
          </div>
          <div className="static-page-card">
            <h1 className="static-page-title">{title}</h1>
            {subtitle && <p className="static-page-subtitle">{subtitle}</p>}
          </div>
        </div>
      </div>
    </>
  );
}
