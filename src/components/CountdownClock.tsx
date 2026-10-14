'use client';

import React, { useEffect, useState, useRef } from 'react';

interface CountdownClockProps {
  expiresAt: number;
  uploadedAt?: number;
  onExpire?: () => void;
  showBar?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function CountdownClock({
  expiresAt,
  uploadedAt,
  onExpire,
  showBar = true,
  size = 'md'
}: CountdownClockProps) {
  // Store remaining milliseconds in state so render is 100% pure (no Date.now() in render)
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const diff = expiresAt - now;
      if (diff <= 0) {
        setRemainingMs(0);
        setIsExpired(true);
        if (onExpireRef.current) {
          onExpireRef.current();
        }
      } else {
        setRemainingMs(diff);
        setIsExpired(false);
      }
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (remainingMs === null) {
    // Initial server or pre-mount render: render stable skeleton
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: size === 'sm' ? '3px 8px' : '6px 12px',
        borderRadius: '8px',
        background: '#f1f5f9',
        fontFamily: 'var(--font-mono)',
        fontSize: size === 'sm' ? '0.74rem' : '0.86rem',
        color: '#94a3b8'
      }}>
        <span className="pulse-dot"></span>
        <span>Calculating TTL...</span>
      </div>
    );
  }

  if (isExpired || remainingMs <= 0) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: size === 'sm' ? '3px 8px' : '6px 12px',
        borderRadius: '8px',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#dc2626',
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        fontSize: size === 'sm' ? '0.74rem' : '0.86rem'
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <span>VANISHED FROM CLOUD</span>
      </div>
    );
  }

  const totalSecs = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Percentage calculation
  let percentRemaining = 100;
  if (uploadedAt && expiresAt > uploadedAt) {
    const totalLifetime = expiresAt - uploadedAt;
    percentRemaining = Math.max(0, Math.min(100, (remainingMs / totalLifetime) * 100));
  }

  const isUrgent = remainingMs < 1000 * 60 * 5; // Under 5 minutes

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '5px' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: size === 'sm' ? '6px' : '8px',
          padding: size === 'sm' ? '4px 8px' : size === 'lg' ? '10px 18px' : '6px 12px',
          borderRadius: '8px',
          background: isUrgent ? '#fff1f2' : '#ffffff',
          border: `1px solid ${isUrgent ? '#fda4af' : '#bfdbfe'}`,
          boxShadow: isUrgent ? '0 0 10px rgba(239, 68, 68, 0.15)' : 'var(--shadow-subtle)',
          fontFamily: 'var(--font-mono)'
        }}
      >
        <span
          className="pulse-dot"
          style={{
            backgroundColor: isUrgent ? '#e11d48' : '#2563eb',
            animation: isUrgent ? 'pulse 0.8s infinite' : undefined
          }}
        ></span>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '2px',
            fontSize: size === 'sm' ? '0.78rem' : size === 'lg' ? '1.3rem' : '0.94rem',
            fontWeight: 700,
            color: isUrgent ? '#e11d48' : '#0f172a'
          }}
        >
          {days > 0 && (
            <>
              <span>{days}d</span>
              <span style={{ opacity: 0.4, margin: '0 1px' }}>:</span>
            </>
          )}
          <span>{pad(hours)}</span>
          <span style={{ opacity: 0.4, margin: '0 1px' }}>:</span>
          <span>{pad(minutes)}</span>
          <span style={{ opacity: 0.4, margin: '0 1px' }}>:</span>
          <span>{pad(seconds)}</span>
        </div>

        <span style={{
          fontSize: size === 'sm' ? '0.62rem' : '0.7rem',
          color: isUrgent ? '#e11d48' : '#64748b',
          fontWeight: 600,
          textTransform: 'uppercase'
        }}>
          {isUrgent ? 'expiring soon' : 'remaining'}
        </span>
      </div>

      {showBar && (
        <div style={{
          width: '100%',
          height: size === 'sm' ? '2px' : '3px',
          background: '#e2e8f0',
          borderRadius: '999px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${percentRemaining}%`,
            background: isUrgent ? '#e11d48' : '#2563eb',
            transition: 'width 1s linear'
          }}></div>
        </div>
      )}
    </div>
  );
}
