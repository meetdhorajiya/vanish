'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, setMockUser } from '@/services/storage';
import { UserSession } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  useEffect(() => {
    const existing = getCurrentUser();
    if (existing && existing.isLoggedIn && existing.token) {
      router.replace(redirectTarget);
    }
  }, [router, redirectTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setAuthError('Please provide both email and password');
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLoginTab ? 'login' : 'signup',
          email: email.trim(),
          password: password.trim(),
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        const session: UserSession = {
          isLoggedIn: true,
          name: data.user.name || email.split('@')[0],
          email: data.user.email,
          token: data.token,
        };

        setMockUser(session);
        setAuthSuccess(true);

        setTimeout(() => {
          router.push(redirectTarget);
          router.refresh();
        }, 400);
      } else {
        setAuthError(data.error || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      setAuthError('Network communication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: '48px auto 80px', padding: '0 16px' }}>
      
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'var(--blue-600)',
          color: '#ffffff',
          marginBottom: '16px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 10px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-blue-tint)',
          border: '1px solid var(--border-blue)',
          marginBottom: '12px',
          fontSize: '0.74rem',
          fontWeight: 600,
          color: 'var(--blue-700)'
        }}>
          <span className="pulse-dot"></span>
          Zero Digital Residue Cloud
        </div>

        <h1 style={{ fontSize: '2.1rem', marginBottom: '6px', color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
          {isLoginTab ? 'Sign in to ' : 'Get started with '}<span className="blue-text">VANISH</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.45 }}>
          Secure, ephemeral file transfers with automated cryptographic deletion upon TTL expiry.
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="glass-panel" style={{ padding: '32px', background: '#ffffff', boxShadow: 'var(--shadow-sm)' }}>
        
        {/* Tab switch */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '22px'
        }}>
          <button
            type="button"
            onClick={() => { setIsLoginTab(true); setAuthError(null); }}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'none',
              border: 'none',
              borderBottom: isLoginTab ? '2px solid var(--blue-600)' : '2px solid transparent',
              color: isLoginTab ? 'var(--blue-700)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLoginTab(false); setAuthError(null); }}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'none',
              border: 'none',
              borderBottom: !isLoginTab ? '2px solid var(--blue-600)' : '2px solid transparent',
              color: !isLoginTab ? 'var(--blue-700)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLoginTab && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.88rem'
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.88rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.88rem'
              }}
            />
          </div>

          {authError && (
            <div style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: '#fef3f2',
              border: '1px solid #fee4e2',
              color: '#b42318',
              fontSize: '0.82rem',
              marginBottom: '16px',
              lineHeight: 1.4
            }}>
              {authError}
            </div>
          )}

          {authSuccess && (
            <div style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-blue-tint)',
              border: '1px solid var(--border-blue)',
              color: 'var(--blue-700)',
              fontSize: '0.82rem',
              marginBottom: '16px',
              textAlign: 'center',
              fontWeight: 600
            }}>
              Authentication confirmed. Redirecting...
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || authSuccess}
            className="btn btn-primary"
            style={{ width: '100%', padding: '11px', fontSize: '0.94rem' }}
          >
            <span>
              {isLoading
                ? 'Validating Credentials...'
                : isLoginTab
                ? 'Sign In to Workspace'
                : 'Create Account & Generate Token'}
            </span>
          </button>
        </form>

      </div>

      {/* Trust & Privacy Security Guarantees */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        borderRadius: 'var(--radius-md)',
        background: '#ffffff',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue-600)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Automated physical file unlinking on time expiry</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue-600)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Self-destruct upon reaching download quota limits</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue-600)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Encrypted token generation with HMAC-SHA256</span>
        </div>
      </div>

    </div>
  );
}
