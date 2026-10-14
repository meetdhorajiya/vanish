'use client';

import React from 'react';
import Link from 'next/link';

export default function ArchitecturePage() {
  const systemLayers = [
    {
      layer: 'Frontend Presentation',
      tech: 'Next.js + TypeScript',
      role: 'User interface: Drag-and-drop upload studio, live ticking TTL countdowns, password challenges, recipient download view, and management dashboard.'
    },
    {
      layer: 'Backend API',
      tech: 'Node.js / Express',
      role: 'RESTful API endpoints handling file validation, random ID generation, JWT verification, and download streaming requests.'
    },
    {
      layer: 'Object File Storage',
      tech: 'Cloudinary',
      role: 'Stores actual binary payloads outside the database with private, time-limited signed URLs.'
    },
    {
      layer: 'Persistent Database',
      tech: 'MongoDB',
      role: 'Indexes lightweight queryable metadata: non-guessable IDs, expiry timestamps, download counters, bcrypt password hashes.'
    },
    {
      layer: 'Asynchronous Daemon',
      tech: 'Background Cleanup Worker',
      role: 'Continuously monitors TTL expiry timestamps. Permanently expunges files from Cloudinary and clears metadata from MongoDB when expired.'
    }
  ];

  const securityChecklist = [
    { title: 'Transport Security', desc: 'All traffic served over HTTPS/TLS, preventing plaintext interception.' },
    { title: 'JWT Authentication', desc: 'Token-based auth verifies dashboard users and locks file revocation rights to owners.' },
    { title: 'Bcrypt Password Hashing', desc: 'Per-file access passwords and account credentials hashed before storage; zero plaintext passwords.' },
    { title: 'MIME Type Allow-List', desc: 'Validates file magic numbers against approved MIME signatures, blocking disguised executables.' },
    { title: 'Non-Guessable File IDs', desc: 'Uses long, high-entropy random identifiers (e.g. vanish.app/f/x7Yq2P) preventing enumeration attacks.' },
    { title: 'Download Counter Quotas', desc: 'Enforces maximum download limits to auto-destruct links once reached.' },
    { title: 'Signed Private URLs', desc: 'Direct Cloudinary assets are private by default; backend serves time-limited signed links.' },
    { title: 'Rate Limiting Protection', desc: 'Guards upload and password-guess endpoints against brute-force attacks.' }
  ];

  return (
    <div style={{ padding: '36px 0 80px', maxWidth: '840px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-blue-tint)',
          border: '1px solid var(--border-blue)',
          marginBottom: '10px'
        }}>
          <span className="pulse-dot"></span>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--blue-700)' }}>
            System Architecture & Academic Report Specification
          </span>
        </div>

        <h1 style={{ fontSize: '2.3rem', marginBottom: '8px', color: 'var(--text-main)' }}>
          Inside <span className="blue-text">VANISH</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', maxWidth: '640px', margin: '0 auto' }}>
          Ephemeral Cloud File Sharing: Designed to demonstrate full-stack software engineering, distributed systems TTL expiry, and modern cybersecurity practices.
        </p>
      </div>

      {/* Project Meta Card */}
      <div className="glass-panel" style={{
        padding: '22px 26px',
        marginBottom: '28px',
        background: 'var(--white)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Course & Term</div>
            <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>Design Project (Autumn 2026-27)</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--blue-700)' }}>Indian Institute of Information Technology, Vadodara</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Supervisor</div>
            <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>Dr. Rishabh Gupta</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>Department of Computer Science</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Project Authors</div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-main)', marginTop: '2px', lineHeight: 1.5 }}>
              • Meet Dhorajiya (202451053)<br/>
              • Dhairya Desai (202451051)<br/>
              • Jatan Bhatt (202451032)
            </div>
          </div>
        </div>
      </div>

      {/* Core Principle */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px', background: 'var(--white)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--text-main)' }}>
          1. Core Philosophy: Genuine Ephemerality
        </h2>
        <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '12px' }}>
          General-purpose cloud storage platforms (Google Drive, Dropbox, OneDrive) are architected for permanent storage: links stay valid indefinitely unless the user remembers to manually revoke access, leaving private files exposed indefinitely.
        </p>
        <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          <strong>Vanish</strong> inverts this model by making expiry a first-class feature. Every uploaded file is tied to an explicit lifetime (1 hour, 6 hours, 24 hours, or 7 days). The system, not the human user, takes responsibility for physically scrubbing the file and invalidating the link permanently.
        </p>
      </div>

      {/* Technology Stack Layer Diagram */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px', background: 'var(--white)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '14px', color: 'var(--text-main)' }}>
          2. Multi-Tier Technology Stack
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {systemLayers.map((l, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: '#f8fafc',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ minWidth: '140px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  {l.layer}
                </span>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--blue-700)' }}>
                  {l.tech}
                </div>
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-soft)', lineHeight: 1.5 }}>
                {l.role}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cybersecurity Measures Grid */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px', background: 'var(--white)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '6px', color: 'var(--text-main)' }}>
          3. Applied Cybersecurity Measures
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
          Because Vanish accepts arbitrary file uploads and exposes public links, defensive engineering is woven throughout every layer:
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '10px'
        }}>
          {securityChecklist.map((sec, i) => (
            <div
              key={i}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: '#f8fafc',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                <span style={{ color: 'var(--blue-600)', fontWeight: 700 }}>•</span>
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>{sec.title}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-soft)', lineHeight: 1.5 }}>
                {sec.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Back to Zero Page Navigation */}
      <div style={{ textAlign: 'center' }}>
        <Link href="/" className="btn btn-primary">
          <span>Back to Zero Page Navigation Hub</span>
        </Link>
      </div>

    </div>
  );
}
