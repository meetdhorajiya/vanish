'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { FileRecord } from '@/types';
import { fetchFileById, unlockFilePassword } from '@/services/storage';
import CountdownClock from '@/components/CountdownClock';

export default function RecipientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const fileId = resolvedParams.id;

  const [file, setFile] = useState<FileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockToken, setUnlockToken] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Testing override
  const [forcedState, setForcedState] = useState<'normal' | 'password' | 'expired' | 'exhausted' | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      const loaded = await fetchFileById(fileId);
      if (isMounted) {
        setFile(loaded);
        setLoading(false);
        if (loaded && !loaded.hasPassword) {
          setIsUnlocked(true);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [fileId]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;

    const res = await unlockFilePassword(fileId, passwordInput.trim());
    if (res.success) {
      setIsUnlocked(true);
      setUnlockToken(res.token || null);
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 2500);
    }
  };

  const handleDownload = async () => {
    if (!file) return;

    setIsDownloading(true);
    try {
      const url = `/api/file/${file.id}/download${unlockToken ? `?token=${encodeURIComponent(unlockToken)}` : ''}`;
      const res = await fetch(url);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Failed to download file');
        // Refresh metadata in case it expired or hit quota
        const refreshed = await fetchFileById(file.id);
        if (refreshed) setFile(refreshed);
        return;
      }

      // Real binary download blob trigger
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      setDownloadSuccess(true);

      // Refresh file state to show updated download count or exhausted status
      const refreshed = await fetchFileById(file.id);
      if (refreshed) {
        setFile(refreshed);
      } else {
        setFile({ ...file, downloadCount: file.downloadCount + 1 });
      }

      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (e) {
      console.error('Download error:', e);
      alert('Network error initiating download');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div className="pulse-dot" style={{ margin: '0 auto 12px' }}></div>
        <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Verifying link signature and TTL...</div>
      </div>
    );
  }

  const isExpired = forcedState === 'expired' || (!forcedState && file?.status === 'expired') || (file && Date.now() >= file.expiresAt);
  const isExhausted = forcedState === 'exhausted' || (!forcedState && file?.status === 'exhausted');
  const needsPassword = (forcedState === 'password' || (!forcedState && file?.hasPassword)) && !isUnlocked;

  return (
    <div style={{ maxWidth: '620px', margin: '36px auto 80px' }}>
      
      {/* State Navigator Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: 'var(--radius-sm)',
        background: '#ffffff',
        border: '1px solid var(--border-subtle)',
        marginBottom: '20px',
        fontSize: '0.76rem',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <span style={{ color: 'var(--text-light)' }}>
          State Navigator:
        </span>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setForcedState('normal'); setIsUnlocked(true); }}
            className={`btn btn-sm ${forcedState === 'normal' || (!forcedState && !isExpired && !isExhausted && isUnlocked) ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
          >
            Active Ready
          </button>
          <button
            onClick={() => { setForcedState('password'); setIsUnlocked(false); }}
            className={`btn btn-sm ${forcedState === 'password' || (!forcedState && needsPassword) ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
          >
            Password Challenge
          </button>
          <button
            onClick={() => setForcedState('expired')}
            className={`btn btn-sm ${isExpired ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
          >
            Vanished / Expired
          </button>
          <button
            onClick={() => setForcedState('exhausted')}
            className={`btn btn-sm ${isExhausted ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
          >
            Limit Reached
          </button>
        </div>
      </div>

      {/* 1. EXPIRED / VANISHED STATE */}
      {isExpired ? (
        <div className="glass-panel" style={{ padding: '44px 28px', textAlign: 'center', background: '#ffffff' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--bg-blue-tint)',
            border: '1px dashed var(--border-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--blue-600)'
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
              <line x1="2" y1="2" x2="22" y2="22"></line>
            </svg>
          </div>

          <span className="badge badge-soft" style={{ marginBottom: '10px' }}>
            STATUS: PERMANENTLY DESTROYED
          </span>

          <h1 style={{ fontSize: '1.9rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
            This File Has Vanished
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 16px' }}>
            The designated lifetime for this share link has elapsed. Per the ephemeral security protocol, the file binary has been deleted from cloud storage and metadata purged.
          </p>

          <div style={{
            background: '#f9fafb',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px',
            maxWidth: '380px',
            margin: '0 auto 24px',
            fontSize: '0.78rem',
            color: 'var(--text-light)'
          }}>
            Zero digital trace remains. No backups or cached copies are preserved.
          </div>

          <Link href="/upload" className="btn btn-primary">
            <span>Upload Your Own Expiring File</span>
          </Link>
        </div>
      ) : isExhausted ? (
        /* 2. DOWNLOAD LIMIT REACHED STATE */
        <div className="glass-panel" style={{ padding: '44px 28px', textAlign: 'center', background: '#ffffff' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--bg-blue-tint)',
            border: '1px solid var(--border-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--blue-600)'
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>

          <span className="badge badge-soft" style={{ marginBottom: '10px' }}>
            DOWNLOAD LIMIT EXHAUSTED
          </span>

          <h1 style={{ fontSize: '1.9rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Quota Reached
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 24px' }}>
            The sender configured a strict maximum download cap for this file. The maximum allowed downloads have been reached, and this link has auto-destructed.
          </p>

          <Link href="/upload" className="btn btn-outline">
            <span>Send New File on Vanish</span>
          </Link>
        </div>
      ) : needsPassword ? (
        /* 3. PASSWORD PROTECTED CHALLENGE */
        <div className="glass-panel" style={{ padding: '40px 28px', textAlign: 'center', background: '#ffffff' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-blue-tint)',
            border: '1px solid var(--border-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            color: 'var(--blue-600)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>

          <span className="badge badge-blue" style={{ marginBottom: '8px' }}>
            PROTECTED FILE
          </span>

          <h1 style={{ fontSize: '1.75rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
            Password Required
          </h1>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
            The sender protected <strong>{file?.name || 'this file'}</strong> with an access key.
          </p>

          <form onSubmit={handlePasswordSubmit} style={{ maxWidth: '320px', margin: '0 auto' }}>
            <div style={{ marginBottom: '12px' }}>
              <input
                type="password"
                placeholder="Enter password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: '#ffffff',
                  border: `1px solid ${passwordError ? '#d92d20' : 'var(--border-medium)'}`,
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  textAlign: 'center',
                  letterSpacing: '0.1em'
                }}
              />
              {passwordError && (
                <div style={{ color: '#d92d20', fontSize: '0.75rem', marginTop: '5px' }}>
                  Incorrect password. Please try again.
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}
            >
              <span>Unlock and Decrypt</span>
            </button>

            <div style={{ marginTop: '12px', fontSize: '0.72rem', color: 'var(--text-light)' }}>
              Demo test hint: Password is <code style={{ color: 'var(--blue-700)' }}>vanish123</code>
            </div>
          </form>
        </div>
      ) : (
        /* 4. ACTIVE READY STATE */
        <div className="glass-panel" style={{ padding: '36px 28px', textAlign: 'center', background: '#ffffff' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
            <CountdownClock
              expiresAt={file ? file.expiresAt : Date.now() + 1000 * 60 * 60 * 5}
              uploadedAt={file?.uploadedAt}
            />
          </div>

          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-blue-tint)',
            border: '1px solid var(--border-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            color: 'var(--blue-600)'
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>

          <h1 style={{ fontSize: '1.6rem', marginBottom: '6px', wordBreak: 'break-word', color: 'var(--text-primary)' }}>
            {file?.name || 'Confidential_Project_Document.pdf'}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <span className="badge badge-white">
              {formatFileSize(file?.size || 2457600)}
            </span>
            <span className="badge badge-blue">
              {file?.mimeType || 'application/pdf'}
            </span>
            {file?.maxDownloads && (
              <span className="badge badge-soft">
                {file.downloadCount} of {file.maxDownloads} downloads used
              </span>
            )}
          </div>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn btn-primary"
            style={{
              padding: '12px 24px',
              fontSize: '0.95rem',
              width: '100%',
              maxWidth: '300px',
              margin: '0 auto 14px',
              display: 'flex',
              opacity: isDownloading ? 0.7 : 1
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>{isDownloading ? 'Streaming from Storage...' : 'Download File Now'}</span>
          </button>

          {downloadSuccess && (
            <div style={{
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-blue-tint)',
              border: '1px solid var(--border-blue)',
              color: 'var(--blue-700)',
              fontSize: '0.82rem',
              fontWeight: 600,
              maxWidth: '300px',
              margin: '0 auto 12px'
            }}>
              Download completed!
            </div>
          )}

          <div style={{ fontSize: '0.74rem', color: 'var(--text-light)' }}>
            Served directly from Vanish Ephemeral Storage: Zero-trace cleanup guaranteed
          </div>
        </div>
      )}

      {/* Return to Navigator */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link href="/" className="btn btn-outline btn-sm">
          <span>Back to Zero Page Navigator</span>
        </Link>
      </div>

    </div>
  );
}
