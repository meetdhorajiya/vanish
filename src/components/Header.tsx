'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { fetchFiles, getCurrentUser, logoutUser } from '@/services/storage';
import { UserSession } from '@/types';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeCount, setActiveCount] = useState(0);
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    let isMounted = true;
    const updateStats = async () => {
      try {
        const currentUser = getCurrentUser();
        if (isMounted) {
          setUser(currentUser.isLoggedIn ? currentUser : null);
        }

        if (currentUser.isLoggedIn) {
          const files = await fetchFiles();
          if (isMounted) {
            const active = files.filter((f) => f.status === 'active').length;
            setActiveCount(active);
          }
        } else {
          if (isMounted) {
            setActiveCount(0);
          }
        }
      } catch {
        // Safe fallback
      }
    };

    updateStats();
    // No interval — refresh only on route change. Dashboard handles realtime data.
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      background: 'rgba(255, 255, 255, 0.95)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 0',
      boxShadow: 'var(--shadow-xs)'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        
        {/* Brand Logo */}
        <Link href={user ? "/dashboard" : "/"} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--blue-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.22rem',
                letterSpacing: '-0.025em',
                color: 'var(--text-primary)'
              }}>
                VANISH
              </span>
              <span className="badge badge-blue" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                EPHEMERAL
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', lineHeight: 1 }}>
              Secure Ephemeral Storage
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {user ? (
            <>
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
                    padding: '1px 6px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    marginLeft: '4px'
                  }}>
                    {activeCount}
                  </span>
                )}
              </Link>
            </>
          ) : (
            <Link
              href="/"
              className={`btn btn-sm ${pathname === '/' ? 'btn-primary' : 'btn-outline'}`}
            >
              <span>Sign In</span>
            </Link>
          )}
        </nav>

        {/* User Pill / Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 11px',
                borderRadius: 'var(--radius-full)',
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                boxShadow: 'var(--shadow-xs)'
              }}>
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
                  color: '#ffffff'
                }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {user.name || user.email.split('@')[0]}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
                title="Sign out of session"
                style={{ fontSize: '0.76rem', padding: '5px 10px' }}
              >
                <span>Log out</span>
              </button>
            </div>
          ) : (
            <Link href="/" className="btn btn-primary btn-sm">
              <span>Get Started</span>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
