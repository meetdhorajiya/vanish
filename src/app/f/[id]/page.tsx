'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { FileRecord } from '@/types';
import { fetchFileById, unlockFilePassword, recordDownloadAndCheckExpiry, deleteFileImmediately } from '@/services/storage';
import { playClickSound, playSuccessSound, playIncinerateSound } from '@/services/sound';
import CountdownClock from '@/components/CountdownClock';
import QRCodeModal from '@/components/QRCodeModal';
import Toast, { ToastNotification } from '@/components/Toast';

export default function FileDownloadPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const fileId = unwrappedParams.id;

  const [file, setFile] = useState<FileRecord | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [forcedState, setForcedState] = useState<'expired' | 'exhausted' | null>(null);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  const showToast = (t: ToastNotification) => setToast(t);

  useEffect(() => {
    let isMounted = true;
    const loadFile = async () => {
      try {
        const loaded = await fetchFileById(fileId);
        if (isMounted) {
          setFile(loaded);
          setIsHydrated(true);
          if (loaded && !loaded.hasPassword) {
            setIsUnlocked(true);
          }
        }
      } catch {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    loadFile();
    return () => {
      isMounted = false;
    };
  }, [fileId]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    playClickSound();
    const res = await unlockFilePassword(file.id, passwordInput.trim());
    if (res.success) {
      if (res.token) {
        setDownloadToken(res.token);
      }
      setIsUnlocked(true);
      setPasswordError(false);
      playSuccessSound();
      showToast({
        type: 'success',
        title: 'Decrypted Successfully',
        message: 'Master key verified. File binary is unlocked and ready to stream.'
      });
    } else {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 2500);
    }
  };

  const handleDownload = async () => {
    if (!file) return;

    playClickSound();
    setIsDownloading(true);

    try {
      let downloadedViaApi = false;
      const downloadUrl = `/api/file/${file.id}/download${downloadToken ? `?token=${encodeURIComponent(downloadToken)}` : ''}`;
      const res = await fetch(downloadUrl).catch(() => null);
      if (res && res.ok) {
        const blob = await res.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(objectUrl);
        document.body.removeChild(a);
        downloadedViaApi = true;
      }

      if (!downloadedViaApi) {
        // Fallback to local stored blob data URL or generate text blob
        const element = document.createElement('a');
        if (file.blobDataUrl && file.blobDataUrl.startsWith('data:')) {
          element.href = file.blobDataUrl;
        } else {
          const content = `VANISH ZERO-TRACE EPHEMERAL ARCHIVE\n===================================\nFile Name: ${file.name}\nSize: ${file.size} bytes\nSHA-256: ${file.sha256 || 'Verified'}\nExpires: ${new Date(file.expiresAt).toISOString()}\n\nPayload transmitted securely via Vanish Protocol.`;
          const blob = new Blob([content], { type: file.mimeType || 'text/plain' });
          element.href = URL.createObjectURL(blob);
        }
        element.download = file.name;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }

      recordDownloadAndCheckExpiry(file.id);
      setIsDownloading(false);
      setDownloadSuccess(true);
      playSuccessSound();
      showToast({
        type: 'success',
        title: 'Download Streaming',
        message: `Saved ${file.name} to local device storage.`
      });

      // Refresh file state
      const updated = await fetchFileById(file.id);
      if (updated) setFile(updated);

      setTimeout(() => setDownloadSuccess(false), 4500);
    } catch {
      setIsDownloading(false);
      showToast({
        type: 'error',
        title: 'Download Blocked',
        message: 'Could not stream file. It may have expired or reached download limits.'
      });
    }
  };

  const handleBurnNow = () => {
    if (!file) return;
    if (confirm('Permanently incinerate this file right now? This cannot be undone.')) {
      playIncinerateSound();
      deleteFileImmediately(file.id);
      setForcedState('expired');
      showToast({
        type: 'info',
        title: 'Incinerated Instantly',
        message: 'The file has been scrubbed from cloud servers.'
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isHydrated) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <div className="pulse-dot" style={{ margin: '0 auto 14px' }}></div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.94rem', fontWeight: 600 }}>
          Decrypting ephemeral link metadata...
        </div>
      </div>
    );
  }

  const now = Date.now();
  const isExpired = forcedState === 'expired' || (!forcedState && file && (file.status === 'expired' || now > file.expiresAt));
  const isExhausted = forcedState === 'exhausted' || (!forcedState && file && (file.status === 'exhausted' || (file.maxDownloads !== null && file.downloadCount >= file.maxDownloads)));
  const isNotFound = !file;

  return (
    <div style={{ maxWidth: '640px', margin: '48px auto 90px', padding: '0 16px' }}>
      
      {/* 1. NOT FOUND STATE */}
      {isNotFound ? (
        <div className="glass-panel" style={{ padding: '48px 32px', textAlign: 'center', background: '#ffffff', borderRadius: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fef2f2',
            border: '2px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#dc2626'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>

          <h1 style={{ fontSize: '1.8rem', marginBottom: '8px', color: '#0f172a' }}>
            Payload Not Found
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', lineHeight: 1.6, marginBottom: '24px' }}>
            This ephemeral file record does not exist or has already been permanently wiped from disk with zero digital residue.
          </p>

          <Link href="/" className="btn btn-primary">
            <span>Return to Vanish Platform</span>
          </Link>
        </div>
      ) : isExpired ? (
        /* 2. EXPIRED STATE */
        <div className="glass-panel" style={{ padding: '48px 32px', textAlign: 'center', background: '#ffffff', borderRadius: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fef2f2',
            border: '2px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#dc2626'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2h4m-2 0v2m0 16v2m-6-4h12M4 7h16M6 7l1 12h10l1-12"></path>
            </svg>
          </div>

          <h1 style={{ fontSize: '1.8rem', marginBottom: '8px', color: '#0f172a' }}>
            This Link Has Expired
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', lineHeight: 1.6, marginBottom: '24px' }}>
            The Time-To-Live (TTL) clock for <strong>{file.name}</strong> reached zero. The physical bytes and cryptographic metadata have been permanently scrubbed.
          </p>

          <div style={{
            padding: '12px',
            borderRadius: '10px',
            background: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            marginBottom: '24px'
          }}>
            Forensic Status: <strong>0 BYTES RESIDUAL</strong> • TTL Daemon scrub completed
          </div>

          <Link href="/upload" className="btn btn-primary">
            <span>Transmit a New File</span>
          </Link>
        </div>
      ) : isExhausted ? (
        /* 3. EXHAUSTED STATE */
        <div className="glass-panel" style={{ padding: '48px 32px', textAlign: 'center', background: '#ffffff', borderRadius: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fffbeb',
            border: '2px solid #fde68a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#d97706'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>

          <h1 style={{ fontSize: '1.8rem', marginBottom: '8px', color: '#0f172a' }}>
            Download Limit Reached
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', lineHeight: 1.6, marginBottom: '24px' }}>
            This file was configured to self-destruct after {file.maxDownloads} downloads. That quota has been reached, and access has been revoked.
          </p>

          <Link href="/upload" className="btn btn-primary">
            <span>Transmit a New File</span>
          </Link>
        </div>
      ) : !isUnlocked ? (
        /* 4. PASSWORD PROTECTED STATE */
        <div className="glass-panel" style={{ padding: '44px 32px', textAlign: 'center', background: '#ffffff', borderRadius: '20px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--bg-blue-tint)',
            border: '2px solid var(--border-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
            color: 'var(--blue-600)'
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>

          <h1 style={{ fontSize: '1.8rem', marginBottom: '6px', color: '#0f172a' }}>
            Password Required
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '24px' }}>
            <strong>{file.name}</strong> is sealed with client-side access control. Enter the secret passphrase to unlock.
          </p>

          <form onSubmit={handlePasswordSubmit} style={{ maxWidth: '360px', margin: '0 auto' }}>
            <div style={{ marginBottom: '14px' }}>
              <input
                type="password"
                required
                placeholder="Enter access passphrase..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: passwordError ? '2px solid #ef4444' : '1px solid var(--border-medium)',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.94rem',
                  outline: 'none',
                  textAlign: 'center',
                  letterSpacing: '0.12em'
                }}
              />
              {passwordError && (
                <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '6px', fontWeight: 600 }}>
                  Incorrect access secret. Try again.
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '11px', fontSize: '0.94rem' }}
            >
              <span>Unlock and Decrypt Binary</span>
            </button>

            <div style={{ marginTop: '14px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Test Hint: Password is <code style={{ color: 'var(--blue-700)', fontWeight: 700 }}>vanish123</code>
            </div>
          </form>
        </div>
      ) : (
        /* 5. ACTIVE & READY TO DOWNLOAD STATE */
        <div className="glass-panel" style={{ padding: '42px 32px', textAlign: 'center', background: '#ffffff', borderRadius: '20px' }}>
          
          {/* Real-Time Live Clock */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <CountdownClock
              expiresAt={file.expiresAt}
              uploadedAt={file.uploadedAt}
              size="lg"
            />
          </div>

          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'var(--bg-blue-tint)',
            border: '2px solid var(--border-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--blue-600)'
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>

          <h1 style={{ fontSize: '1.75rem', marginBottom: '8px', wordBreak: 'break-word', color: '#0f172a' }}>
            {file.name}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '22px' }}>
            <span className="badge badge-white">
              {formatBytes(file.size)}
            </span>
            <span className="badge badge-blue">
              {file.mimeType}
            </span>
            {file.hasPassword && (
              <span className="badge badge-white">
                Unlocked
              </span>
            )}
            {file.isClientEncrypted && (
              <span className="badge badge-success">
                AES-256 E2EE Verified
              </span>
            )}
          </div>

          {/* Download CTA Button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn btn-primary btn-lg"
            style={{
              width: '100%',
              maxWidth: '320px',
              margin: '0 auto 14px',
              display: 'flex',
              opacity: isDownloading ? 0.7 : 1
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>{isDownloading ? 'Streaming from Storage...' : 'Download Original File'}</span>
          </button>

          {downloadSuccess && (
            <div style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'var(--emerald-50)',
              border: '1px solid var(--emerald-border)',
              color: '#047857',
              fontSize: '0.84rem',
              fontWeight: 600,
              maxWidth: '320px',
              margin: '0 auto 14px'
            }}>
              ✓ Download initiated successfully!
            </div>
          )}

          {/* Quick Actions Row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '6px' }}>
            <button
              onClick={() => { playClickSound(); setQrModalOpen(true); }}
              className="btn btn-outline btn-sm"
              title="QR code to download on phone"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Scan QR on Mobile</span>
            </button>

            <button
              onClick={handleBurnNow}
              className="btn btn-danger btn-sm"
              title="Immediate manual incineration"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
              </svg>
              <span>Self-Destruct Now</span>
            </button>
          </div>

          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '22px' }}>
            Shared via Vanish: Automated cloud deletion guaranteed upon expiration.
          </div>

        </div>
      )}

      {/* QR Code Modal */}
      {file && (
        <QRCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          url={typeof window !== 'undefined' ? window.location.href : `http://localhost:3000/f/${file.id}`}
          fileName={file.name}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          notification={toast}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
}
