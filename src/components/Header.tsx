'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getStoredFiles, getCurrentUser, setMockUser, subscribeToStore, logoutUser, fetchFiles } from '@/services/storage';
import { toggleMute, getMuteState, playClickSound } from '@/services/sound';
import { UserSession } from '@/types';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeCount, setActiveCount] = useState<number>(0);
  const [user, setUser] = useState<UserSession | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [, startTransition] = useTransition();

  const syncData = async () => {
    try {
      const currentUser = getCurrentUser();
      const stored = getStoredFiles();
      startTransition(() => {
        setUser(currentUser.isLoggedIn ? currentUser : null);
        setActiveCount(stored.filter((f) => f.status === 'active').length);
        setIsAudioMuted(getMuteState());
      });

      // Background fetch to sync from backend if user is logged in
      if (currentUser.isLoggedIn) {
        const remoteFiles = await fetchFiles();
        if (remoteFiles && remoteFiles.length > 0) {
          startTransition(() => {
            setActiveCount(remoteFiles.filter((f) => f.status === 'active').length);
          });
        }
      }
    } catch {
      // Safe fallback
    }
  };

  useEffect(() => {
    syncData();

    // Subscribe to store updates
    const unsubscribe = subscribeToStore(() => {
      syncData();
    });

    const interval = setInterval(syncData, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [pathname]);

  const teamPresets = [
    { name: 'Meet Dhorajiya', email: 'meet@iiitv.ac.in', id: '202451053' },
    { name: 'Dhairya Desai', email: 'dhairya@iiitv.ac.in', id: '202451051' },
    { name: 'Jatan Bhatt', email: 'jatan@iiitv.ac.in', id: '202451032' },
  ];

  const handleSwitchUser = (preset: typeof teamPresets[0]) => {
    playClickSound();
    const newUser: UserSession = {
      isLoggedIn: true,
      name: preset.name,
      email: preset.email,
      studentId: preset.id,
      token: `mock-jwt-token-${preset.id}`
    };
    setMockUser(newUser);
    setUser(newUser);
    setUserMenuOpen(false);
  };

  const handleToggleSound = () => {
    const muted = toggleMute();
    setIsAudioMuted(muted);
    if (!muted) {
      playClickSound();
    }
  };

  const handleLogout = async () => {
    playClickSound();
    await logoutUser();
    setUser(null);
    setUserMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="header-wrapper">
      <div className="container header-inner" style={{ padding: '10px 20px' }}>
        
        {/* Brand Logo */}
        <Link
          href={user ? "/dashboard" : "/"}
          className="brand-link"
          onClick={() => playClickSound()}
          aria-label="Vanish — Zero-Trace Ephemeral Cloud File Sharing"
        >
          <div className="brand-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="brand-icon-svg"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="vArmGradLeft" x1="3" y1="6" x2="14" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ffffff" />
                  <stop offset="0.65" stopColor="#bfdbfe" />
                  <stop offset="1" stopColor="#60a5fa" />
                </linearGradient>
                <linearGradient id="vArmGradRight" x1="25" y1="6" x2="14" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#e0f2fe" />
                  <stop offset="0.65" stopColor="#93c5fd" />
                  <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="beamGrad" x1="14" y1="6" x2="14" y2="18" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38bdf8" />
                  <stop offset="1" stopColor="#2563eb" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              <path d="M4 6.5L14 23.5H11.5L2 6.5H4Z" fill="url(#vArmGradLeft)" />
              <path d="M24 6.5L14 23.5H16.5L26 6.5H24Z" fill="url(#vArmGradRight)" />
              <path d="M14 8.5V18" stroke="url(#beamGrad)" strokeWidth="2.2" strokeLinecap="round" />

              <circle cx="14" cy="4.5" r="1.6" fill="#38bdf8" />
              <circle cx="19.5" cy="5" r="1.1" fill="#7dd3fc" opacity="0.9" />
              <circle cx="8.5" cy="5" r="1.1" fill="#7dd3fc" opacity="0.9" />
              <circle cx="23" cy="7.5" r="0.8" fill="#bae6fd" opacity="0.75" />
              <circle cx="5" cy="7.5" r="0.8" fill="#bae6fd" opacity="0.75" />
            </svg>
          </div>

          <div className="brand-content">
            <div className="brand-title-wrap">
              <span className="brand-title">VANISH</span>
              <span className="brand-security-pill" title="Zero Digital Residue Protocol">
                <span className="pulse-dot-cyan"></span>
                <span>ZERO-TRACE</span>
              </span>
            </div>
            <div className="brand-subtitle">
              <span className="institute-name">IIIT Vadodara</span>
              <span className="subtitle-divider">•</span>
              <span className="project-tag">Design Project</span>
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="header-nav">
          <Link
            href="/upload"
            onClick={() => playClickSound()}
            className={`nav-link ${pathname === '/upload' ? 'active' : ''}`}
          >
            <span>Upload Studio</span>
          </Link>

          <Link
            href="/dashboard"
            onClick={() => playClickSound()}
            className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
          >
            <span>Dashboard</span>
            {activeCount > 0 && (
              <span className="active-count-bubble">
                {activeCount}
              </span>
            )}
          </Link>

          <Link
            href="/architecture"
            onClick={() => playClickSound()}
            className={`nav-link ${pathname === '/architecture' ? 'active' : ''}`}
          >
            <span>Architecture & Specs</span>
          </Link>
        </nav>

        {/* Action Bar */}
        <div className="header-actions">
          
          {/* Live Cluster Health Badge */}
          <div className="cluster-health-pill" title="Live Distributed TTL Engine Status">
            <span className="pulse-dot"></span>
            <span className="health-text">TTL Engine Nominal</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="sound-toggle-btn"
            title={isAudioMuted ? 'Unmute UI Sound FX' : 'Mute UI Sound FX'}
          >
            {isAudioMuted ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
            )}
          </button>

          {/* User Account Dropdown */}
          {user ? (
            <div className="user-menu-wrapper">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="user-pill-btn"
              >
                <div className="user-avatar-circle">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="user-name-label">
                  {user.name || user.email.split('@')[0]}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="user-dropdown-panel glass-panel">
                  <div className="dropdown-user-info">
                    <div className="dropdown-user-name">{user.name}</div>
                    <div className="dropdown-user-email">{user.email}</div>
                    {user.studentId && (
                      <div className="dropdown-student-id">ID: {user.studentId} (IIITV)</div>
                    )}
                  </div>

                  <div className="dropdown-divider" />

                  <div className="dropdown-label">Switch Active Member:</div>
                  {teamPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSwitchUser(preset)}
                      className={`dropdown-team-btn ${user.email === preset.email ? 'selected' : ''}`}
                    >
                      <span>{preset.name}</span>
                      <span className="preset-id">#{preset.id}</span>
                    </button>
                  ))}

                  <div className="dropdown-divider" />

                  <Link
                    href="/auth"
                    onClick={() => setUserMenuOpen(false)}
                    className="dropdown-auth-link"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <span>JWT Auth Inspector</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="dropdown-team-btn"
                    style={{ color: 'var(--rose-600)', marginTop: '4px' }}
                  >
                    <span>Log Out</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/"
              onClick={() => playClickSound()}
              className="btn btn-outline btn-sm"
            >
              <span>Sign In</span>
            </Link>
          )}

          {/* Quick Upload Action */}
          <Link
            href="/upload"
            onClick={() => playClickSound()}
            className="btn btn-primary btn-sm quick-upload-cta"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Share File</span>
          </Link>

        </div>

      </div>
    </header>
  );
}
