'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { getCurrentUser, setMockUser, subscribeToStore } from '@/services/storage';
import { generateSecureId } from '@/services/crypto';
import { playClickSound, playSuccessSound } from '@/services/sound';
import { useToast } from '@/components/Toast';
import { UserSession } from '@/types';

export default function AuthPage() {
  const { showToast } = useToast();
  const [currentUser, setCurrentUserState] = useState<UserSession | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'apikeys'>('signin');
  const [apiKeys, setApiKeys] = useState<{ id: string; key: string; label: string; created: string }[]>([
    { id: 'key-1', key: 'vanish_live_9a4f8b2c1d0e4f7a', label: 'Production Webhook Sync', created: '2026-10-12' }
  ]);

  const [, startTransition] = useTransition();

  const loadUser = () => {
    startTransition(() => {
      setCurrentUserState(getCurrentUser());
    });
  };

  useEffect(() => {
    loadUser();
    const unsubscribe = subscribeToStore(loadUser);
    return () => unsubscribe();
  }, []);

  const teamPresets = [
    {
      name: 'Meet Dhorajiya',
      email: 'meet@iiitv.ac.in',
      id: '202451053',
      role: 'Student Engineer'
    },
    {
      name: 'Dhairya Desai',
      email: 'dhairya@iiitv.ac.in',
      id: '202451051',
      role: 'Student Engineer'
    },
    {
      name: 'Jatan Bhatt',
      email: 'jatan@iiitv.ac.in',
      id: '202451032',
      role: 'Student Engineer'
    }
  ];

  const handleSelectPreset = (preset: typeof teamPresets[0]) => {
    playSuccessSound();
    const userSession: UserSession = {
      isLoggedIn: true,
      name: preset.name,
      email: preset.email,
      studentId: preset.id,
      token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIke3ByZXNldC5pZH0iLCJuYW1lIjoiJHtwcmVzZXQubmFtZX0iLCJlbWFpbCI6IiR7cHJlc2V0LmVtYWlsfSIsImlzcyI6InZhbmlzaC5hcHAifQ.signature`
    };
    setMockUser(userSession);
    setCurrentUserState(userSession);
    showToast({
      type: 'success',
      title: 'Authenticated as ' + preset.name,
      message: 'Active session loaded with IIIT Vadodara student credentials.'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    playSuccessSound();
    const namePart = email.split('@')[0];
    const userSession: UserSession = {
      isLoggedIn: true,
      name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
      email: email,
      token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(email)}.signature`
    };
    setMockUser(userSession);
    setCurrentUserState(userSession);
    showToast({
      type: 'success',
      title: 'Session Authenticated',
      message: `Welcome, ${userSession.name}!`
    });
  };

  const handleCreateApiKey = () => {
    playClickSound();
    const newKey = {
      id: `key-${Date.now()}`,
      key: `vanish_live_${generateSecureId(24)}`,
      label: 'Automated Upload Script',
      created: 'Just now'
    };
    setApiKeys((prev) => [newKey, ...prev]);
    showToast({
      type: 'success',
      title: 'API Secret Created',
      message: 'New key generated with full storage write privileges.'
    });
  };

  const handleDeleteApiKey = (id: string) => {
    playClickSound();
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
    showToast({
      type: 'info',
      title: 'Key Revoked',
      message: 'API token deactivated and blocked from authentication.'
    });
  };

  return (
    <div style={{ maxWidth: '640px', margin: '36px auto 90px' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 14px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-blue-tint)',
          border: '1px solid var(--border-blue)',
          marginBottom: '10px'
        }}>
          <span className="pulse-dot"></span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--blue-700)', letterSpacing: '0.02em' }}>
            JWT AUTHENTICATION & IDENTITY PORTAL
          </span>
        </div>

        <h1 style={{ fontSize: '2.4rem', marginBottom: '6px', color: '#0f172a' }}>
          Identity & <span className="blue-text">API Tokens</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Ties uploads to your verified credentials, unlocks personal audit trails, and provides programmatic API access.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '32px', background: '#ffffff', borderRadius: '18px' }}>
        
        {/* Quick Team Switcher Presets */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--blue-700)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            Instant 1-Click Login (IIIT Vadodara Project Authors):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
            {teamPresets.map((preset) => {
              const isSelected = currentUser?.email === preset.email;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: isSelected ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#f8fafc',
                    border: `1px solid ${isSelected ? '#2563eb' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'var(--shadow-subtle)'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isSelected ? '#ffffff' : '#0f172a' }}>
                    {preset.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)' }}>
                    ID: {preset.id}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '22px',
          gap: '12px'
        }}>
          <button
            onClick={() => { playClickSound(); setActiveTab('signin'); }}
            style={{
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'signin' ? '2.5px solid var(--blue-600)' : '2.5px solid transparent',
              color: activeTab === 'signin' ? 'var(--blue-700)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            Sign In (JWT)
          </button>
          <button
            onClick={() => { playClickSound(); setActiveTab('register'); }}
            style={{
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'register' ? '2.5px solid var(--blue-600)' : '2.5px solid transparent',
              color: activeTab === 'register' ? 'var(--blue-700)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            Create Account
          </button>
          <button
            onClick={() => { playClickSound(); setActiveTab('apikeys'); }}
            style={{
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'apikeys' ? '2.5px solid var(--blue-600)' : '2.5px solid transparent',
              color: activeTab === 'apikeys' ? 'var(--blue-700)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            Developer API Keys ({apiKeys.length})
          </button>
        </div>

        {/* Form or API Keys Tab */}
        {activeTab !== 'apikeys' ? (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-soft)', marginBottom: '5px' }}>
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
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1px solid var(--border-medium)',
                  color: '#0f172a',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-soft)', marginBottom: '5px' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1px solid var(--border-medium)',
                  color: '#0f172a',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
            >
              <span>{activeTab === 'signin' ? 'Authenticate Session' : 'Register and Issue JWT'}</span>
            </button>
          </form>
        ) : (
          /* Developer API Keys Tab */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Programmatic API keys for CLI scripts & CI/CD uploads.
              </div>
              <button
                onClick={handleCreateApiKey}
                className="btn btn-primary btn-sm"
              >
                + New Secret Key
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0f172a' }}>
                      {key.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--blue-700)', marginTop: '2px' }}>
                      {key.key.substring(0, 16)}••••••••••••••••
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteApiKey(key.id)}
                    className="btn btn-sm btn-outline"
                    style={{ color: 'var(--rose-600)' }}
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* JWT Inspector Panel */}
        {currentUser && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            borderRadius: '10px',
            background: '#081a36',
            color: '#bfdbfe',
            fontFamily: 'var(--font-mono)'
          }}>
            <div style={{ fontSize: '0.72rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
              Decoded JWT Token Payload:
            </div>
            <pre style={{ fontSize: '0.76rem', color: '#e0f2fe', overflowX: 'auto', margin: 0, lineHeight: 1.5 }}>
{JSON.stringify({
  sub: currentUser.studentId || currentUser.email,
  name: currentUser.name,
  email: currentUser.email,
  role: 'authenticated_engineer',
  institute: 'Indian Institute of Information Technology Vadodara',
  iss: 'vanish.app/auth/v2',
  status: 'active_session'
}, null, 2)}
            </pre>
          </div>
        )}

      </div>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <Link
          href="/"
          onClick={() => playClickSound()}
          className="btn btn-outline btn-sm"
        >
          <span>Back to Platform Hub</span>
        </Link>
      </div>

    </div>
  );
}
