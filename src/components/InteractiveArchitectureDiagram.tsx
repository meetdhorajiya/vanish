'use client';

import React, { useState } from 'react';

type FlowMode = 'upload' | 'download' | 'janitor';

interface NodeInfo {
  id: string;
  name: string;
  type: string;
  badge: string;
  role: string;
  specs: string[];
  security: string[];
}

export default function InteractiveArchitectureDiagram() {
  const [selectedFlow, setSelectedFlow] = useState<FlowMode>('upload');
  const [activeNodeId, setActiveNodeId] = useState<string>('node-crypto');

  const nodes: Record<string, NodeInfo> = {
    'node-client': {
      id: 'node-client',
      name: 'Client Browser (Upload Studio)',
      type: 'Presentation Tier',
      badge: 'React 19 / Next.js 16',
      role: 'Executes client-side file chunking, AES-256-GCM encryption, and SHA-256 checksum calculation before any byte leaves the machine.',
      specs: [
        'Web Crypto API (SubtleCrypto)',
        'Zero-knowledge symmetric key generation',
        'Local file streaming up to 100MB',
        'Dynamic offline TTL simulation'
      ],
      security: [
        'Browser sandboxing prevents token leakage',
        'Plaintext never touches the network unencrypted',
        'SHA-256 verification prevents file tampering'
      ]
    },
    'node-edge': {
      id: 'node-edge',
      name: 'Cloudflare Edge Gateway',
      type: 'Edge & CDN Tier',
      badge: 'Global Anycast',
      role: 'Terminates TLS 1.3 connections, applies rate-limiting (token bucket algorithm), and blocks malicious enumeration attempts.',
      specs: [
        'Sub-15ms edge latency across 300+ PoPs',
        'WAF security rules against brute-force attacks',
        'HTTP/3 and QUIC transport protocol'
      ],
      security: [
        'TLS 1.3 end-to-end encryption',
        'High-entropy 7-char random URL validation',
        'DDoS shield & IP reputation filtering'
      ]
    },
    'node-api': {
      id: 'node-api',
      name: 'Vanish Stateless REST API',
      type: 'Application Tier',
      badge: 'Node.js / Express',
      role: 'Orchestrates file upload metadata, verifies JWT tokens, generates signed upload grants, and manages download quota counters.',
      specs: [
        'Stateless horizontal scaling across Docker containers',
        'Magic-byte MIME verification (file-type engine)',
        'Bcrypt password hash generation (cost factor 12)',
        'Response time < 25ms'
      ],
      security: [
        'JWT token verification with RS256 signature',
        'Strict CORS allow-list',
        'Zero local binary caching on disk'
      ]
    },
    'node-cloudinary': {
      id: 'node-cloudinary',
      name: 'Private Object Store (Cloudinary/S3)',
      type: 'Object Storage Tier',
      badge: 'Secure Binary Blob Vault',
      role: 'Stores encrypted binary payloads. Access is strictly private; assets can only be retrieved using short-lived signed URLs (TTL 60s).',
      specs: [
        'AES-256 server-side encryption at rest (SSE-S3)',
        '99.999999999% data durability',
        'Immediate purge API via SDK destroying physical replicas'
      ],
      security: [
        'Private buckets: zero public read access',
        'Time-stamped cryptographic HMAC-SHA1 signatures',
        'Zero metadata persistence in object tags'
      ]
    },
    'node-mongo': {
      id: 'node-mongo',
      name: 'MongoDB Atlas TTL Engine',
      type: 'Database Tier',
      badge: 'NoSQL with Native TTL',
      role: 'Stores queryable file metadata with automatic TTL index on expiresAt field. Automatically marks documents as expired at T=0.',
      specs: [
        'Native TTL index: { expiresAt: 1 }, expireAfterSeconds: 0',
        'Atomic $inc operations for downloadCount counters',
        'Bcrypt hash storage for password protected files'
      ],
      security: [
        'Encrypted at rest with Customer Managed Keys',
        'Strict IP access control & TLS connections',
        'Zero plaintext file binaries stored in document'
      ]
    },
    'node-janitor': {
      id: 'node-janitor',
      name: 'Janitor Daemon Worker',
      type: 'Asynchronous Janitor Tier',
      badge: 'BullMQ / Redis Cron',
      role: 'Continuously queries for pending expired records. Sends destruction commands to Cloudinary to shred physical files and confirms purge.',
      specs: [
        'Continuous polling interval every 15 seconds',
        'Idempotent deletion retries with exponential backoff',
        'Emits system purge logs to audit ledger'
      ],
      security: [
        'Cryptographic shredding confirmation',
        'Zero ghost storage guarantee',
        'Isolated background service credentials'
      ]
    }
  };

  const activeNode = nodes[activeNodeId] || nodes['node-client'];

  return (
    <div className="glass-panel" style={{ padding: '28px', background: '#ffffff', borderRadius: '16px' }}>
      
      {/* Header and Flow Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="pulse-dot"></span>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>
              Interactive System Architecture
            </span>
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
            Multi-Tier Ephemeral Architecture & Data Pipeline
          </h3>
        </div>

        {/* Pipeline Flow Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setSelectedFlow('upload')}
            className={`btn btn-sm ${selectedFlow === 'upload' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', fontSize: '0.76rem' }}
          >
            1. Upload & Encrypt Flow
          </button>
          <button
            onClick={() => setSelectedFlow('download')}
            className={`btn btn-sm ${selectedFlow === 'download' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', fontSize: '0.76rem' }}
          >
            2. Recipient Download Flow
          </button>
          <button
            onClick={() => setSelectedFlow('janitor')}
            className={`btn btn-sm ${selectedFlow === 'janitor' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', fontSize: '0.76rem' }}
          >
            3. Automated Janitor TTL Purge
          </button>
        </div>
      </div>

      {/* Interactive Visual Graph Canvas */}
      <div
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, #eff6ff 0%, #f8fafc 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '24px 16px',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Animated Grid Lines */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(#93c5fd 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.35,
          pointerEvents: 'none'
        }} />

        {/* Nodes Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          position: 'relative',
          zIndex: 2
        }}>
          {Object.values(nodes).map((node) => {
            const isSelected = activeNodeId === node.id;
            let isHighlightedInFlow = false;
            if (selectedFlow === 'upload' && ['node-client', 'node-edge', 'node-api', 'node-cloudinary', 'node-mongo'].includes(node.id)) {
              isHighlightedInFlow = true;
            } else if (selectedFlow === 'download' && ['node-edge', 'node-api', 'node-mongo', 'node-cloudinary'].includes(node.id)) {
              isHighlightedInFlow = true;
            } else if (selectedFlow === 'janitor' && ['node-mongo', 'node-janitor', 'node-cloudinary'].includes(node.id)) {
              isHighlightedInFlow = true;
            }

            return (
              <div
                key={node.id}
                onClick={() => setActiveNodeId(node.id)}
                style={{
                  background: isSelected ? '#ffffff' : '#ffffff',
                  border: isSelected
                    ? '2px solid #2563eb'
                    : isHighlightedInFlow
                    ? '1px solid #60a5fa'
                    : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected
                    ? '0 10px 20px -3px rgba(37, 99, 235, 0.2), 0 4px 6px -4px rgba(37, 99, 235, 0.1)'
                    : '0 2px 4px rgba(0,0,0,0.03)',
                  transform: isSelected ? 'translateY(-2px)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: isSelected ? '#2563eb' : '#64748b'
                  }}>
                    {node.type}
                  </span>
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: isSelected ? '#dbeafe' : '#f1f5f9',
                    color: isSelected ? '#1d4ed8' : '#64748b'
                  }}>
                    {node.badge}
                  </span>
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: '4px' }}>
                  {node.name}
                </div>

                <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>
                  {node.role.substring(0, 75)}...
                </div>

                {isHighlightedInFlow && (
                  <div style={{
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#2563eb'
                  }}>
                    <span className="pulse-dot"></span>
                    <span>Active in {selectedFlow} pipeline</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pipeline Step Ribbon */}
        <div style={{
          marginTop: '18px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '0.8rem',
          color: '#1e3a8a',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontWeight: 700 }}>Flow Pipeline:</span>
          {selectedFlow === 'upload' && (
            <span>Client Browser (AES-256) ➔ Cloudflare Edge ➔ REST API (MIME + Bcrypt) ➔ Parallel write (Cloudinary binary + MongoDB TTL metadata)</span>
          )}
          {selectedFlow === 'download' && (
            <span>Recipient Link ➔ Edge Cache check ➔ REST API (TTL validation + Password verify) ➔ Atomically increment download counter ➔ Stream binary</span>
          )}
          {selectedFlow === 'janitor' && (
            <span>MongoDB TTL Index expiry event ➔ Janitor Worker Daemon detects T=0 ➔ Cloudinary API delete physical blob ➔ Metadata scrubbed</span>
          )}
        </div>
      </div>

      {/* Selected Node Deep-Dive Inspection Panel */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '18px 22px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span className="badge badge-blue">{activeNode.type}</span>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
              {activeNode.name}
            </h4>
          </div>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#2563eb', background: '#dbeafe', padding: '3px 8px', borderRadius: '4px' }}>
            ID: {activeNode.id}
          </span>
        </div>

        <p style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.6, marginBottom: '14px' }}>
          {activeNode.role}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
              Key Technical Specifications
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {activeNode.specs.map((spec, i) => (
                <li key={i} style={{ fontSize: '0.78rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#2563eb', fontWeight: 700 }}>•</span>
                  <span>{spec}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
              Security & Zero-Trace Controls
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {activeNode.security.map((sec, i) => (
                <li key={i} style={{ fontSize: '0.78rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                  <span>{sec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
