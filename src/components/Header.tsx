'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getStoredFiles, getCurrentUser } from '@/services/storage';

export default function Header() {
  const pathname = usePathname();
  const [activeCount, setActiveCount] = useState(0);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const updateStats = () => {
      const files = getStoredFiles();
      const active = files.filter((f) => f.status === 'active').length;
      setActiveCount(active);
      setUser(getCurrentUser());
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      background: 'rgba(255, 255, 255, 0.95)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 0',
      boxShadow: 'var(--shadow-subtle)'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        
        {/* Brand Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--blue-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--white)'
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.2rem',
                letterSpacing: '-0.02em',
                color: 'var(--text-main)'
              }}>
                VANISH
              </span>
              <span className="badge badge-blue" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                EPHEMERAL
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1 }}>
              IIIT Vadodara Design Project
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Link
            href="/"
            className={`btn btn-sm ${pathname === '/' ? 'btn-primary' : 'btn-outline'}`}
          >
            <span>Zero Page (Hub)</span>
          </Link>

          <Link
            href="/upload"
            className={`btn btn-sm ${pathname === '/upload' ? 'btn-primary' : 'btn-outline'}`}
          >
            <span>Upload</span>
          </Link>

          <Link
            href="/dashboard"
            className={`btn btn-sm ${pathname === '/dashboard' ? 'btn-primary' : 'btn-outline'}`}
          >
            <span>Dashboard</span>
            {activeCount > 0 && (
              <span style={{
                background: pathname === '/dashboard' ? 'rgba(255, 255, 255, 0.25)' : 'var(--blue-100)',
                color: pathname === '/dashboard' ? '#ffffff' : 'var(--blue-700)',
                borderRadius: '999px',
                padding: '0 5px',
                fontSize: '0.68rem',
                fontWeight: 700,
                marginLeft: '3px'
              }}>
                {activeCount}
              </span>
            )}
          </Link>

          <Link
            href="/architecture"
            className={`btn btn-sm ${pathname === '/architecture' ? 'btn-primary' : 'btn-outline'}`}
          >
            <span>Architecture</span>
          </Link>
        </nav>

        {/* User Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            href="/auth"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--white)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              boxShadow: 'var(--shadow-subtle)'
            }}
          >
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: 'var(--blue-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'var(--white)'
            }}>
              {user?.name ? user.name.charAt(0) : 'M'}
            </div>
            <span style={{ color: 'var(--text-soft)', fontWeight: 500 }}>
              {user?.name || 'Meet Dhorajiya'}
            </span>
          </Link>
        </div>

      </div>
    </header>
  );
}
