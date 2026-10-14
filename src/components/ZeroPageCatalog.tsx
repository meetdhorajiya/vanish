'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { resetDemoDatabase } from '@/services/storage';

export default function ZeroPageCatalog() {
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleReset = () => {
    resetDemoDatabase();
    setResetMessage('Database reset with fresh countdown timers and sample files!');
    setTimeout(() => setResetMessage(null), 3500);
  };

  const pages = [
    {
      title: 'Upload Studio (Primary Entrypoint)',
      path: '/upload',
      badge: 'Core Workflow',
      badgeColor: 'badge-blue',
      description: 'The primary user interface for uploading files with drag-and-drop, custom TTL expiry (1h, 6h, 24h, 7d, or 30s demo), optional password protection, and download count limits.',
      features: [
        'Drag & Drop zone with file preview and size validation',
        'TTL Expiry selector buttons (1h, 6h, 24h, 7d, 30s)',
        'Password toggle with secure input mask',
        'Download limit counter toggle (e.g., self-destruct after 1 download)',
        'Live upload progress simulation'
      ]
    },
    {
      title: 'Recipient: Active & Ready to Download',
      path: '/f/demo-active',
      badge: 'Recipient State 1/4',
      badgeColor: 'badge-blue',
      description: 'The download screen for a valid, unexpired file ("IIITV_Design_Project_Report.pdf"). Displays real-time live ticking countdown clock, download count remaining, and download button.',
      features: [
        'Real-time live countdown timer ticking each second',
        'Download limit meter: 3 of 10 downloads used',
        'Instant browser download trigger with simulated blob',
        'Sender verified badge & file size indicator'
      ]
    },
    {
      title: 'Recipient: Password-Protected Challenge',
      path: '/f/demo-locked',
      badge: 'Recipient State 2/4',
      badgeColor: 'badge-soft',
      description: 'The access gate for password-protected files ("Confidential_Financial_Audit_2026.xlsx"). Requires entering password (pass: "vanish123") before showing file download details.',
      features: [
        'Secure password challenge screen with lock graphic',
        'Password shake animation on incorrect guess',
        'Sample password hint provided for quick testing ("vanish123")',
        'Seamless unlock transition to full download view'
      ]
    },
    {
      title: 'Recipient: Expired & Vanished State',
      path: '/f/demo-vanished',
      badge: 'Recipient State 3/4',
      badgeColor: 'badge-soft',
      description: 'The ephemeral climax: what a recipient sees when a file has expired past its TTL. Demonstrates that the file has been expunged with zero trace.',
      features: [
        'Minimalist expired notice with zero-trace privacy confirmation',
        'Cloudinary and MongoDB automatic TTL cleanup explanation',
        'Upload your own file CTA button'
      ]
    },
    {
      title: 'Recipient: Download Limit Reached',
      path: '/f/demo-exhausted',
      badge: 'Recipient State 4/4',
      badgeColor: 'badge-soft',
      description: 'The auto-destruct trigger when a file hits its maximum downloads ("Campus_Hackathon_Invite_VIP.png", max 3 downloads exhausted).',
      features: [
        'Quota exhausted status badge',
        'Explanation of download-cap self-destruction mechanism',
        'Link revocation status summary'
      ]
    },
    {
      title: 'Personal Management Dashboard',
      path: '/dashboard',
      badge: 'Account Management',
      badgeColor: 'badge-blue',
      description: 'The user file management command center. Lists all uploaded files with real-time countdown clocks ticking concurrently, download stats, and instant manual revocation ("Vanish Now").',
      features: [
        'Live ticking countdown clocks on every row simultaneously',
        '"Vanish Now" one-click immediate deletion with instant UI refresh',
        'Quick Copy Share Link with clipboard toast',
        'Key metrics: Active files, storage used, cumulative downloads',
        'Filter by status: Active, Expiring Soon, Expired'
      ]
    },
    {
      title: 'Authentication & JWT Mock',
      path: '/auth',
      badge: 'Security / JWT',
      badgeColor: 'badge-soft',
      description: 'Sign In and Sign Up screens with JWT token generation simulation and one-click quick switchers between project team members.',
      features: [
        'JWT token simulation and decoded payload viewer',
        '1-click account switchers: Meet Dhorajiya, Dhairya Desai, Jatan Bhatt',
        'Secure password masking & session persistence in localStorage'
      ]
    },
    {
      title: 'System Architecture & Report Showcase',
      path: '/architecture',
      badge: 'Academic Report',
      badgeColor: 'badge-blue',
      description: 'Comprehensive interactive presentation of the Design Project report for IIIT Vadodara under Dr. Rishabh Gupta. Includes interactive architecture flows and cybersecurity checklists.',
      features: [
        'Interactive diagram: Next.js Client / REST API / Cloudinary + MongoDB TTL / Cleanup Worker',
        'Cybersecurity measures: Bcrypt hashing, MIME allow-list, signed URLs, non-guessable IDs',
        'System design principles: Stateless API, horizontal scaling, TTL expiry',
        'Project team credits and supervisor acknowledgment'
      ]
    }
  ];

  return (
    <div style={{ padding: '36px 0 70px' }}>
      
      {/* Banner & Intro */}
      <div style={{
        textAlign: 'center',
        marginBottom: '36px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-blue-tint)',
          border: '1px solid var(--border-blue)',
          marginBottom: '14px'
        }}>
          <span className="pulse-dot"></span>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--blue-700)' }}>
            Zero Page : Dev Navigator & Sitemaps
          </span>
        </div>

        <h1 style={{
          fontSize: '2.5rem',
          lineHeight: 1.15,
          marginBottom: '10px',
          color: 'var(--text-main)'
        }}>
          Explore Every View in <span className="blue-text">VANISH</span>
        </h1>

        <p style={{
          fontSize: '0.98rem',
          color: 'var(--text-muted)',
          maxWidth: '640px',
          margin: '0 auto 20px'
        }}>
          Temporary hub indexing all frontend views, interactive mock states, and academic architecture flows. Jump directly to any page below.
        </p>

        {/* Quick Demo Utilities Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <button
            onClick={handleReset}
            className="btn btn-outline"
            style={{ fontSize: '0.84rem' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            <span>Reset Demo DB & Fresh Timers</span>
          </button>

          <Link
            href="/f/demo-fast"
            className="btn btn-blue-soft"
            style={{ fontSize: '0.84rem' }}
          >
            <span>Test 30s Rapid Vanish Demo</span>
          </Link>

          <Link
            href="/upload"
            className="btn btn-primary"
            style={{ fontSize: '0.84rem' }}
          >
            <span>Open Upload Studio</span>
          </Link>
        </div>

        {resetMessage && (
          <div style={{
            marginTop: '14px',
            display: 'inline-block',
            padding: '5px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-blue-tint)',
            border: '1px solid var(--border-blue)',
            color: 'var(--blue-700)',
            fontSize: '0.82rem',
            fontWeight: 600
          }}>
            {resetMessage}
          </div>
        )}
      </div>

      {/* Grid of Pages */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {pages.map((p, idx) => (
          <div
            key={idx}
            className="glass-panel"
            style={{
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'var(--white)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-blue-tint)',
                  border: '1px solid var(--border-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--blue-700)'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
                <span className={`badge ${p.badgeColor}`}>
                  {p.badge}
                </span>
              </div>

              <h2 style={{ fontSize: '1.15rem', marginBottom: '4px', color: 'var(--text-main)' }}>
                {p.title}
              </h2>

              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.74rem',
                color: 'var(--blue-700)',
                marginBottom: '10px',
                background: 'var(--bg-blue-tint)',
                border: '1px solid var(--border-blue)',
                padding: '2px 8px',
                borderRadius: '4px',
                display: 'inline-block'
              }}>
                {p.path}
              </div>

              <p style={{
                fontSize: '0.88rem',
                color: 'var(--text-soft)',
                lineHeight: 1.5,
                marginBottom: '14px'
              }}>
                {p.description}
              </p>

              {/* Feature bullets */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>
                  Features:
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {p.features.map((feat, fIdx) => (
                    <li key={fIdx} style={{ fontSize: '0.8rem', color: 'var(--text-soft)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ color: 'var(--blue-600)', fontSize: '0.75rem', lineHeight: 1.4 }}>•</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Launch button */}
            <Link
              href={p.path}
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'space-between' }}
            >
              <span>Launch This View</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
          </div>
        ))}
      </div>

      {/* Academic Credits Footer Card */}
      <div className="glass-panel" style={{
        marginTop: '32px',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        background: 'var(--white)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-main)' }}>
              Design Project (Autumn 2026-27)
            </span>
            <span className="badge badge-blue">IIIT Vadodara</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-soft)' }}>
            <strong>Team:</strong> Dhairya Desai (202451051) / Jatan Bhatt (202451032) / Meet Dhorajiya (202451053)
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Supervised by Dr. Rishabh Gupta
          </div>
        </div>

        <Link href="/architecture" className="btn btn-outline btn-sm">
          <span>Read Full Architecture & Security Spec</span>
        </Link>
      </div>

    </div>
  );
}
