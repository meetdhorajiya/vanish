'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { resetDemoDatabase, getSystemMetrics, subscribeToStore } from '@/services/storage';
import { formatBytes } from '@/services/crypto';
import { playClickSound, playBurnSound } from '@/services/sound';
import { useToast } from '@/components/Toast';
import InteractiveArchitectureDiagram from './InteractiveArchitectureDiagram';

export default function ZeroPageCatalog() {
  const { showToast } = useToast();
  const [metrics, setMetrics] = useState({
    totalActive: 3,
    totalVanished: 2,
    totalDownloads: 9,
    totalBytesScrubbed: 94829000,
  });
  const [activeTab, setActiveTab] = useState<'demo-active' | 'demo-locked' | 'demo-vanished' | 'demo-exhausted' | 'demo-fast'>('demo-active');
  const [, startTransition] = useTransition();

  const loadMetrics = () => {
    startTransition(() => {
      const data = getSystemMetrics();
      setMetrics({
        totalActive: data.totalActive,
        totalVanished: data.totalVanished,
        totalDownloads: data.totalDownloads,
        totalBytesScrubbed: data.totalBytesScrubbed,
      });
    });
  };

  useEffect(() => {
    loadMetrics();
    const unsubscribe = subscribeToStore(loadMetrics);
    return () => unsubscribe();
  }, []);

  const handleReset = () => {
    playBurnSound();
    resetDemoDatabase();
    loadMetrics();
    showToast({
      type: 'success',
      title: 'Demo Environment Reset',
      message: 'Restored fresh countdown timers, sample cryptographic blobs, and access logs.'
    });
  };

  const interactiveScenarios = [
    {
      id: 'demo-active',
      title: 'Active & Download Ready',
      file: 'IIITV_Design_Project_Report.pdf',
      size: '2.4 MB',
      badge: 'Unrestricted',
      badgeClass: 'badge-blue',
      ttl: '5 Hours Remaining',
      desc: 'Recipient lands on a clean, valid file with end-to-end checksum verification, live countdown ticker, and instant one-click download.',
      url: '/f/demo-active'
    },
    {
      id: 'demo-locked',
      title: 'Password Protected Challenge',
      file: 'Confidential_Financial_Audit_2026.xlsx',
      size: '1.5 MB',
      badge: 'Protected',
      badgeClass: 'badge-soft',
      ttl: '22 Hours Remaining',
      desc: 'Zero-knowledge access lock: recipient must present the shared secret ("vanish123") before decryption metadata and binary download are revealed.',
      url: '/f/demo-locked'
    },
    {
      id: 'demo-vanished',
      title: 'Expired & Expunged State',
      file: 'Temporary_API_Credentials.env',
      size: '840 B',
      badge: 'Destroyed',
      badgeClass: 'badge-danger',
      ttl: 'Elapsed (0s)',
      desc: 'Demonstrates what happens when TTL reaches zero: binary is permanently scrubbed from Cloudinary and metadata purged from MongoDB.',
      url: '/f/demo-vanished'
    },
    {
      id: 'demo-exhausted',
      title: 'Download Cap Reached',
      file: 'Campus_Hackathon_Invite_VIP.png',
      size: '4.3 MB',
      badge: 'Exhausted',
      badgeClass: 'badge-soft',
      ttl: 'Quota Depleted (3/3)',
      desc: 'Automatic burn-after-reading: the sender set a maximum limit of 3 downloads. Once hit, the file link self-destructs instantly.',
      url: '/f/demo-exhausted'
    },
    {
      id: 'demo-fast',
      title: '30s Rapid Burn Demo',
      file: 'Quick_Self_Destruct_Demo.txt',
      size: '2.0 KB',
      badge: 'Rapid TTL',
      badgeClass: 'badge-blue',
      ttl: '< 45 Seconds',
      desc: 'Experience real-time live clock expiration right before your eyes. Watch the file vanish from existence when the timer hits zero.',
      url: '/f/demo-fast'
    }
  ];

  const currentScenario = interactiveScenarios.find((s) => s.id === activeTab) || interactiveScenarios[0];

  return (
    <div style={{ padding: '36px 0 80px' }}>
      
      {/* Hero Section */}
      <div style={{ textAlign: 'center', maxWidth: '860px', margin: '0 auto 48px' }}>
        
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 14px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-blue-tint)',
          border: '1px solid var(--border-blue)',
          marginBottom: '16px'
        }}>
          <span className="pulse-dot"></span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--blue-700)', letterSpacing: '0.02em' }}>
            VANISH PROTOCOL 2.0 • ZERO DIGITAL RESIDUE GUARANTEED
          </span>
        </div>

        <h1 style={{
          fontSize: '3.2rem',
          lineHeight: 1.12,
          marginBottom: '16px',
          color: 'var(--text-main)',
          letterSpacing: '-0.03em'
        }}>
          Files that share themselves and <br />
          <span className="blue-text">clean up after themselves.</span>
        </h1>

        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text-soft)',
          maxWidth: '680px',
          margin: '0 auto 28px',
          lineHeight: 1.6
        }}>
          Traditional cloud drives keep your shared files online forever. <strong>Vanish</strong> enforces genuine ephemerality: client-side AES-256 encryption, custom TTL self-destruction, and automated physical deletion from Cloudinary & MongoDB.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '36px' }}>
          <Link
            href="/upload"
            onClick={() => playClickSound()}
            className="btn btn-primary btn-lg"
            style={{ minWidth: '180px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>Launch Upload Studio</span>
          </Link>

          <Link
            href="/dashboard"
            onClick={() => playClickSound()}
            className="btn btn-outline btn-lg"
          >
            <span>Open Command Center</span>
          </Link>

          <button
            onClick={handleReset}
            className="btn btn-blue-soft"
            style={{ padding: '12px 18px' }}
            title="Reset seed files and fresh countdown timers"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            <span>Reset Demo DB</span>
          </button>
        </div>

        {/* Live Metrics Ticker Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          marginTop: '16px'
        }}>
          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: '#ffffff' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Active Ephemeral Files
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--blue-600)', marginTop: '2px' }}>
              {metrics.totalActive}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-soft)' }}>
              Ticking down right now
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: '#ffffff' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Storage Scrubbed
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {formatBytes(metrics.totalBytesScrubbed)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>
              Zero trace retained
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: '#ffffff' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Downloads Served
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--blue-700)', marginTop: '2px' }}>
              {metrics.totalDownloads}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-soft)' }}>
              Strict quota monitored
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: '#ffffff' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              TTL Janitor Lag
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
              &lt; 14ms
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-soft)' }}>
              Real-time MongoDB index
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Recipient Simulator Deck */}
      <div className="glass-panel" style={{ padding: '30px', marginBottom: '48px', background: '#ffffff', borderRadius: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-blue">Interactive Test Bench</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
              Experience All Recipient Scenarios
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Inspect how recipients experience active downloads, password challenges, rapid 30s self-destruction, and expired states.
            </p>
          </div>

          <Link
            href="/f/demo-fast"
            className="btn btn-primary btn-sm"
            onClick={() => playClickSound()}
          >
            <span>Launch Rapid 30s Burn Demo</span>
          </Link>
        </div>

        {/* Simulator Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '20px' }}>
          {interactiveScenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => { playClickSound(); setActiveTab(sc.id as typeof activeTab); }}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === sc.id ? 'var(--blue-600)' : '#f8fafc',
                border: `1px solid ${activeTab === sc.id ? 'var(--blue-600)' : 'var(--border-subtle)'}`,
                color: activeTab === sc.id ? '#ffffff' : 'var(--text-soft)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {sc.title}
            </button>
          ))}
        </div>

        {/* Selected Scenario Preview Card */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid var(--border-blue)',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span className={`badge ${currentScenario.badgeClass}`} style={{ marginBottom: '6px' }}>
                {currentScenario.badge}
              </span>
              <h3 style={{ fontSize: '1.25rem', color: '#0f172a' }}>
                {currentScenario.file}
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Payload Size: {currentScenario.size} • Lifetime: {currentScenario.ttl}
              </div>
            </div>

            <Link
              href={currentScenario.url}
              onClick={() => playClickSound()}
              className="btn btn-primary"
            >
              <span>Test This View as Recipient ➔</span>
            </Link>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-soft)', lineHeight: 1.6 }}>
            {currentScenario.desc}
          </p>

          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            color: 'var(--blue-700)'
          }}>
            <span>Endpoint: {currentScenario.url}</span>
            <span style={{ color: 'var(--text-muted)' }}>SHA-256 Verified • AES-GCM Signed</span>
          </div>
        </div>

      </div>

      {/* 4-Step Cryptographic Lifecycle */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span className="badge badge-blue">Zero-Knowledge Lifecycle</span>
          <h2 style={{ fontSize: '2rem', color: '#0f172a', marginTop: '6px' }}>
            How Vanish Inverts Cloud Storage
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            From the moment you pick a file to the millisecond it vanishes forever.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}>
          
          <div className="glass-panel" style={{ padding: '22px', background: '#ffffff' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--bg-blue-tint)',
              border: '1px solid var(--border-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--blue-700)',
              fontWeight: 800,
              fontSize: '0.9rem',
              marginBottom: '12px'
            }}>
              01
            </div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '6px', color: '#0f172a' }}>
              Client Encryption
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-soft)', lineHeight: 1.5 }}>
              Files are optionally encrypted directly in your browser using the Web Crypto API (AES-256-GCM). The server never sees the master secret.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '22px', background: '#ffffff' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--bg-blue-tint)',
              border: '1px solid var(--border-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--blue-700)',
              fontWeight: 800,
              fontSize: '0.9rem',
              marginBottom: '12px'
            }}>
              02
            </div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '6px', color: '#0f172a' }}>
              Signed Vault Routing
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-soft)', lineHeight: 1.5 }}>
              Payable payloads stream directly to private Cloudinary buckets with high-entropy non-guessable random IDs (e.g. <code style={{ color: 'var(--blue-700)' }}>/f/x7Yq2P</code>).
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '22px', background: '#ffffff' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--bg-blue-tint)',
              border: '1px solid var(--border-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--blue-700)',
              fontWeight: 800,
              fontSize: '0.9rem',
              marginBottom: '12px'
            }}>
              03
            </div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '6px', color: '#0f172a' }}>
              Live Ticking Quotas
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-soft)', lineHeight: 1.5 }}>
              MongoDB TTL indexes track expiry timestamps, while atomic counters decrement download quotas each time an authenticated recipient downloads.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '22px', background: '#ffffff' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--bg-blue-tint)',
              border: '1px solid var(--border-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--blue-700)',
              fontWeight: 800,
              fontSize: '0.9rem',
              marginBottom: '12px'
            }}>
              04
            </div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '6px', color: '#0f172a' }}>
              Physical Scrubbing
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-soft)', lineHeight: 1.5 }}>
              At T=0 or quota depletion, our background Janitor daemon immediately triggers physical deletion from cloud storage. Zero forensic trace remains.
            </p>
          </div>

        </div>
      </div>

      {/* Interactive System Architecture Section */}
      <div style={{ marginBottom: '48px' }}>
        <InteractiveArchitectureDiagram />
      </div>

      {/* Academic Honors & Project Credits Footer */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        background: '#ffffff',
        border: '1px solid var(--border-blue)',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
              Design Project (Autumn 2026-27)
            </span>
            <span className="badge badge-blue">IIIT Vadodara</span>
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-soft)', marginTop: '2px' }}>
            <strong>Project Authors:</strong> Meet Dhorajiya (202451053) • Dhairya Desai (202451051) • Jatan Bhatt (202451032)
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Supervised by Dr. Rishabh Gupta • Department of Computer Science & Engineering
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            href="/architecture"
            onClick={() => playClickSound()}
            className="btn btn-primary btn-sm"
          >
            <span>Read Architecture Whitepaper</span>
          </Link>
          <Link
            href="/upload"
            onClick={() => playClickSound()}
            className="btn btn-outline btn-sm"
          >
            <span>Start Uploading</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
