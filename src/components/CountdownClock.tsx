'use client';

import React, { useEffect, useState } from 'react';

interface CountdownClockProps {
  expiresAt: number;
  uploadedAt?: number;
  onExpire?: () => void;
  showBar?: boolean;
}

export default function CountdownClock({
  expiresAt,
  uploadedAt,
  onExpire,
  showBar = true
}: CountdownClockProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
    isExpired: boolean;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
    isExpired: false
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, totalMs: 0, isExpired: true });
        if (onExpire) onExpire();
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ hours, minutes, seconds, totalMs: diff, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 10px',
        borderRadius: 'var(--radius-sm)',
        background: '#f1f5f9',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-muted)',
        fontWeight: 600,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem'
      }}>
        <span>EXPIRED / VANISHED</span>
      </div>
    );
  }

  let percentRemaining = 100;
  if (uploadedAt && expiresAt > uploadedAt) {
    const totalLifetime = expiresAt - uploadedAt;
    percentRemaining = Math.max(0, Math.min(100, (timeLeft.totalMs / totalLifetime) * 100));
  }

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '5px 12px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--white)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-subtle)',
        fontFamily: 'var(--font-mono)'
      }}>
        <span className="pulse-dot"></span>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '2px',
          fontSize: '0.94rem',
          fontWeight: 700,
          color: 'var(--text-main)'
        }}>
          <span>{pad(timeLeft.hours)}</span>
          <span style={{ opacity: 0.4 }}>:</span>
          <span>{pad(timeLeft.minutes)}</span>
          <span style={{ opacity: 0.4 }}>:</span>
          <span>{pad(timeLeft.seconds)}</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          left
        </span>
      </div>

      {showBar && (
        <div style={{
          width: '100%',
          height: '3px',
          background: 'var(--border-subtle)',
          borderRadius: '999px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${percentRemaining}%`,
            background: 'var(--blue-600)',
            transition: 'width 1s linear'
          }}></div>
        </div>
      )}
    </div>
  );
}
