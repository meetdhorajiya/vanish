'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import InteractiveArchitectureDiagram from '@/components/InteractiveArchitectureDiagram';
import { playClickSound } from '@/services/sound';
import { useToast } from '@/components/Toast';

export default function ArchitecturePage() {
  const { showToast } = useToast();
  const [selectedApiLang, setSelectedApiLang] = useState<'curl' | 'ts' | 'python'>('curl');

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    playClickSound();
    showToast({
      type: 'success',
      title: 'Code Copied',
      message: 'Snippet copied to your clipboard.'
    });
  };

  const apiSnippets = {
    curl: `curl -X POST https://vanish.app/api/v1/upload \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@presentation.pdf" \\
  -F "ttl=24h" \\
  -F "max_downloads=5" \\
  -F "sha256=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"`,

    ts: `import { VanishClient } from '@vanish/sdk';

const client = new VanishClient({
  apiKey: process.env.VANISH_API_KEY
});

// Upload with 6-hour TTL and AES-256 Client Encryption
const upload = await client.files.create({
  file: documentBuffer,
  ttl: '6h',
  maxDownloads: 3,
  encryptClientSide: true
});

console.log('Share URL:', upload.shareUrl); // https://vanish.app/f/x7Yq2P
console.log('Expires At:', upload.expiresAt);`,

    python: `import requests

url = "https://vanish.app/api/v1/upload"
headers = {"Authorization": "Bearer <JWT_TOKEN>"}

payload = {
    "ttl": "24h",
    "max_downloads": "10",
    "password_hash": "$2b$12$K1rZ...BcryptHash"
}
files = [("file", ("confidential.xlsx", open("confidential.xlsx", "rb"), "application/vnd.ms-excel"))]

response = requests.post(url, headers=headers, data=payload, files=files)
print(response.json())`
  };

  const securityChecklist = [
    {
      title: 'Transport Layer Security (TLS 1.3)',
      desc: 'All HTTP connections terminate at the Cloudflare edge using TLS 1.3 with HSTS enabled, completely blocking plaintext packet sniffing.'
    },
    {
      title: 'Zero-Knowledge Client Encryption',
      desc: 'Files can be encrypted locally via Web Crypto API (SubtleCrypto) before upload. The symmetric key is stored in URL hash fragments (#key=...) which are never transmitted in HTTP headers.'
    },
    {
      title: 'Bcrypt Password Salt & Hash',
      desc: 'File access secrets and user accounts are hashed using Bcrypt with a computational work factor of 12. Plaintext passwords never enter persistence.'
    },
    {
      title: 'Magic-Byte MIME Allow-List',
      desc: 'Incoming streams are analyzed by file magic byte headers (e.g. %PDF-, PNG magic), blocking disguised executables (.exe, .sh, .bat) from masquerading as documents.'
    },
    {
      title: 'High-Entropy Non-Guessable IDs',
      desc: 'Identifiers are cryptographically randomized over a 62-character alphabet with 7-8 characters (62^7 = 3.52 trillion combinations), rendering URL brute-forcing mathematically unfeasible.'
    },
    {
      title: 'Atomic Download Quota Counters',
      desc: 'MongoDB atomic $inc and condition filters guarantee that files set to self-destruct after N downloads cannot be concurrently downloaded past the quota.'
    },
    {
      title: 'Automated Janitor TTL Shredding',
      desc: 'A background daemon worker polls MongoDB TTL expiration triggers and issues direct deletion calls to Cloudinary, ensuring zero physical bytes remain.'
    },
    {
      title: 'Anti-Tamper SHA-256 Checksums',
      desc: 'Every file payload is fingerprinted with SHA-256 before upload. The recipient client recalculates the checksum on download to guarantee zero bit-level tampering.'
    }
  ];

  return (
    <div style={{ padding: '36px 0 90px', maxWidth: '880px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 14px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-blue-tint)',
          border: '1px solid var(--border-blue)',
          marginBottom: '12px'
        }}>
          <span className="pulse-dot"></span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--blue-700)', letterSpacing: '0.02em' }}>
            ACADEMIC REPORT SPECIFICATION • DESIGN PROJECT 2026-27
          </span>
        </div>

        <h1 style={{ fontSize: '2.6rem', marginBottom: '10px', color: '#0f172a' }}>
          Inside <span className="blue-text">VANISH</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', maxWidth: '680px', margin: '0 auto', lineHeight: 1.6 }}>
          Comprehensive engineering architecture for ephemeral cloud file sharing. Designed and implemented for the Department of Computer Science & Engineering, IIIT Vadodara.
        </p>
      </div>

      {/* Academic Credits Card */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        marginBottom: '32px',
        background: '#ffffff',
        border: '1px solid var(--border-blue)',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Course & Term</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>Design Project (Autumn 2026-27)</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--blue-700)', fontWeight: 600 }}>Indian Institute of Information Technology Vadodara</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Faculty Supervisor</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>Dr. Rishabh Gupta</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-soft)' }}>Assistant Professor, Dept. of CSE</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Student Engineers</div>
            <div style={{ fontSize: '0.84rem', color: '#0f172a', marginTop: '2px', lineHeight: 1.5, fontWeight: 600 }}>
              • Meet Dhorajiya (202451053)<br/>
              • Dhairya Desai (202451051)<br/>
              • Jatan Bhatt (202451032)
            </div>
          </div>
        </div>
      </div>

      {/* Core Architectural Philosophy */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px', background: '#ffffff', borderRadius: '16px' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '12px', color: '#0f172a' }}>
          1. Architectural Philosophy: Inverting Permanence
        </h2>
        <p style={{ color: 'var(--text-soft)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '14px' }}>
          Mainstream cloud platforms (Google Drive, AWS S3, Dropbox) are designed around <em>infinite retention</em>: links remain valid perpetually unless humans remember to manually revoke access. In enterprise and academic environments, this creates massive security exposure: shared credentials, contracts, exam drafts, and student records linger in unmonitored storage buckets indefinitely.
        </p>
        <p style={{ color: 'var(--text-soft)', fontSize: '0.92rem', lineHeight: 1.7 }}>
          <strong>Vanish</strong> flips this default. Ephemerality is an active, first-class citizen enforced by automated cryptographic and database engines. Physical scrubbing of binary payloads from Cloudinary and metadata from MongoDB Atlas happens reliably at T=0, eliminating human error and digital residue.
        </p>
      </div>

      {/* Interactive Architecture Diagram */}
      <div style={{ marginBottom: '32px' }}>
        <InteractiveArchitectureDiagram />
      </div>

      {/* Developer API Playground */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px', background: '#ffffff', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <span className="badge badge-blue">RESTful API Playground</span>
            <h2 style={{ fontSize: '1.35rem', color: '#0f172a', marginTop: '4px' }}>
              Developer Integration Specs
            </h2>
          </div>

          {/* Lang Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setSelectedApiLang('curl')}
              className={`btn btn-sm ${selectedApiLang === 'curl' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', fontSize: '0.74rem' }}
            >
              cURL
            </button>
            <button
              onClick={() => setSelectedApiLang('ts')}
              className={`btn btn-sm ${selectedApiLang === 'ts' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', fontSize: '0.74rem' }}
            >
              TypeScript
            </button>
            <button
              onClick={() => setSelectedApiLang('python')}
              className={`btn btn-sm ${selectedApiLang === 'python' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', fontSize: '0.74rem' }}
            >
              Python
            </button>
          </div>
        </div>

        {/* Code Snippet Box */}
        <div style={{ position: 'relative' }}>
          <pre style={{
            background: '#081a36',
            color: '#bfdbfe',
            padding: '18px 20px',
            borderRadius: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.82rem',
            overflowX: 'auto',
            lineHeight: 1.6
          }}>
            {apiSnippets[selectedApiLang]}
          </pre>

          <button
            onClick={() => copyCode(apiSnippets[selectedApiLang])}
            className="btn btn-outline btn-sm"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              fontSize: '0.74rem',
              padding: '4px 10px'
            }}
          >
            Copy Snippet
          </button>
        </div>
      </div>

      {/* Applied Cybersecurity Checklist */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '36px', background: '#ffffff', borderRadius: '16px' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '6px', color: '#0f172a' }}>
          Applied Cybersecurity & Defensive Engineering Matrix
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Vanish employs defense-in-depth across the cryptographic, transport, application, and persistence tiers:
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px'
        }}>
          {securityChecklist.map((sec, i) => (
            <div
              key={i}
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{sec.title}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)', lineHeight: 1.5 }}>
                {sec.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Return to Platform Hub */}
      <div style={{ textAlign: 'center' }}>
        <Link
          href="/"
          onClick={() => playClickSound()}
          className="btn btn-primary btn-lg"
        >
          <span>Return to Platform Hub</span>
        </Link>
      </div>

    </div>
  );
}
