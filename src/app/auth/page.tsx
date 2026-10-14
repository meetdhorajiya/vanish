'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCurrentUser, setMockUser } from '@/services/storage';
import { UserSession } from '@/types';

export default function AuthPage() {
  const [currentUser, setCurrentUserState] = useState<UserSession | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [authSuccess, setAuthSuccess] = useState(false);

  useEffect(() => {
    setCurrentUserState(getCurrentUser());
  }, []);

  const teamPresets = [
    {
      name: 'Meet Dhorajiya',
      email: 'meet@iiitv.ac.in',
      id: '202451053',
      role: 'Project Contributor'
    },
    {
      name: 'Dhairya Desai',
      email: 'dhairya@iiitv.ac.in',
      id: '202451051',
      role: 'Project Contributor'
    },
    {
      name: 'Jatan Bhatt',
      email: 'jatan@iiitv.ac.in',
      id: '202451032',
      role: 'Project Contributor'
    }
  ];

  const handleSelectPreset = (preset: typeof teamPresets[0]) => {
    const userSession: UserSession = {
      isLoggedIn: true,
      name: preset.name,
      email: preset.email,
      token: `mock-jwt-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ sub: preset.id, name: preset.name, email: preset.email, iat: Date.now() }))}.signature`
    };
    setMockUser(userSession);
    setCurrentUserState(userSession);
    setAuthSuccess(true);
    setTimeout(() => setAuthSuccess(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const userSession: UserSession = {
      isLoggedIn: true,
      name: email.split('@')[0],
      email: email,
      token: `mock-jwt-user-${Date.now()}`
    };
    setMockUser(userSession);
    setCurrentUserState(userSession);
    setAuthSuccess(true);
    setTimeout(() => setAuthSuccess(false), 2500);
  };

  return (
    <div style={{ maxWidth: '540px', margin: '36px auto 80px' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '3px 10px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-blue-tint)',
          border: '1px solid var(--border-blue)',
          marginBottom: '8px'
        }}>
          <span className="pulse-dot"></span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--blue-700)' }}>
            JWT Authentication Layer
          </span>
        </div>

        <h1 style={{ fontSize: '2.1rem', marginBottom: '4px', color: 'var(--text-main)' }}>
          Secure <span className="blue-text">Account Portal</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Ties uploads to your personal identity, unlocks download analytics, and enables file management.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '28px', background: 'var(--white)' }}>
        
        {/* Quick Team Switcher Presets */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--blue-700)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
            Quick 1-Click Login (IIIT Vadodara Team):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px' }}>
            {teamPresets.map((preset) => {
              const isSelected = currentUser?.email === preset.email;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    padding: '7px 9px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'var(--blue-600)' : '#f8fafc',
                    border: `1px solid ${isSelected ? 'var(--blue-600)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    boxShadow: 'var(--shadow-subtle)'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: isSelected ? '#ffffff' : 'var(--text-main)' }}>
                    {preset.name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)' }}>
                    ID: {preset.id}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab switch */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '18px'
        }}>
          <button
            onClick={() => setIsLoginTab(true)}
            style={{
              padding: '7px 14px',
              background: 'none',
              border: 'none',
              borderBottom: isLoginTab ? '2px solid var(--blue-600)' : '2px solid transparent',
              color: isLoginTab ? 'var(--blue-700)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            Sign In (JWT)
          </button>
          <button
            onClick={() => setIsLoginTab(false)}
            style={{
              padding: '7px 14px',
              background: 'none',
              border: 'none',
              borderBottom: !isLoginTab ? '2px solid var(--blue-600)' : '2px solid transparent',
              color: !isLoginTab ? 'var(--blue-700)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-soft)', marginBottom: '4px' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. 202451053@iiitv.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 11px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--white)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-main)',
                fontSize: '0.86rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-soft)', marginBottom: '4px' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 11px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--white)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-main)',
                fontSize: '0.86rem',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: '0.92rem' }}
          >
            <span>{isLoginTab ? 'Authenticate Session' : 'Register and Generate JWT'}</span>
          </button>
        </form>

        {authSuccess && (
          <div style={{
            marginTop: '12px',
            padding: '7px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-blue-tint)',
            border: '1px solid var(--border-blue)',
            color: 'var(--blue-700)',
            fontSize: '0.78rem',
            textAlign: 'center',
            fontWeight: 600
          }}>
            Session updated for {currentUser?.name}! Token active.
          </div>
        )}

        {currentUser && (
          <div style={{
            marginTop: '18px',
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            background: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)'
          }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '3px' }}>
              Simulated JWT Token Decoded Payload:
            </div>
            <pre style={{ fontSize: '0.72rem', color: 'var(--blue-800)', overflowX: 'auto', margin: 0 }}>
{JSON.stringify({
  sub: currentUser.email,
  name: currentUser.name,
  role: 'authenticated_user',
  iss: 'vanish.app/auth',
  status: 'active_session'
}, null, 2)}
            </pre>
          </div>
        )}

      </div>

      <div style={{ textAlign: 'center', marginTop: '18px' }}>
        <Link href="/" className="btn btn-outline btn-sm">
          <span>Back to Zero Page Navigator</span>
        </Link>
      </div>

    </div>
  );
}
