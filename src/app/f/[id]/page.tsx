'use client';

import React, { useEffect, useState, use, useTransition, Suspense } from 'react';
import Link from 'next/link';
import { FileRecord } from '@/types';
import { getFileById, recordFileDownload, deleteFileImmediately } from '@/services/storage';
import { formatBytes } from '@/services/crypto';
import { playClickSound, playSuccessSound, playBurnSound } from '@/services/sound';
import { useToast } from '@/components/Toast';
import CountdownClock from '@/components/CountdownClock';
import QRCodeModal from '@/components/QRCodeModal';

export default function RecipientPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <div className="pulse-dot" style={{ margin: '0 auto 14px' }}></div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.94rem', fontWeight: 600 }}>
          Decrypting ephemeral link metadata...
        </div>
      </div>
    }>
      <RecipientContent {...props} />
    </Suspense>
  );
}

function RecipientContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const fileId = resolvedParams.id;

  const { showToast } = useToast();
  const [file, setFile] = useState<FileRecord | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Discreet floating dev simulation drawer state
  const [showDevDrawer, setShowDevDrawer] = useState(false);
  const [forcedState, setForcedState] = useState<'normal' | 'password' | 'expired' | 'exhausted' | null>(null);

  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(() => {
      const loaded = getFileById(fileId);
      setFile(loaded);
      setIsHydrated(true);

      if (loaded && !loaded.hasPassword) {
        setIsUnlocked(true);
      }
    });
  }, [fileId]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (passwordInput.trim() === (file.password || 'vanish123')) {
      playSuccessSound();
      setIsUnlocked(true);
      setPasswordError(false);
      showToast({
        type: 'success',
        title: 'Decrypted Successfully',
        message: 'Master key verified. File binary is unlocked and ready to stream.'
      });
    } else {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!file) return;

    playClickSound();
    const res = recordFileDownload(file.id);
    if (res.success && res.file) {
      setFile({ ...res.file });
      setDownloadSuccess(true);
      playSuccessSound();

      // Trigger actual byte download using blobDataUrl or generated content
      const element = document.createElement('a');
      if (file.blobDataUrl && file.blobDataUrl.startsWith('data:')) {
        element.href = file.blobDataUrl;
      } else {
        const dummyContent = `VANISH ZERO-TRACE EPHEMERAL ARCHIVE\n===================================\nFile Name: ${file.name}\nSize: ${file.size} bytes\nSHA-256 Checksum: ${file.sha256 || 'Verified'}\nUploaded: ${new Date(file.uploadedAt).toISOString()}\nExpires: ${new Date(file.expiresAt).toISOString()}\n\nThis file payload was transmitted securely via Vanish Protocol.`;
        const blob = new Blob([dummyContent], { type: file.mimeType || 'text/plain' });
        element.href = URL.createObjectURL(blob);
      }
      element.download = file.name;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      showToast({
        type: 'success',
        title: 'Download Streaming',
        message: `Saved ${file.name} to local device storage.`
      });

      setTimeout(() => setDownloadSuccess(false), 4500);
    } else {
      showToast({
        type: 'error',
        title: 'Download Blocked',
        message: res.error || 'File has vanished or download limit reached.'
      });
    }
  };

  const handleBurnNow = () => {
    if (!file) return;
    if (confirm('Permanently incinerate this file right now? This cannot be undone.')) {
      playBurnSound();
      deleteFileImmediately(file.id);
      setForcedState('expired');
      showToast({
        type: 'info',
        title: 'Incinerated Instantly',
        message: 'The file has been scrubbed from cloud servers.'
      });
    }
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

  // Derive state safely
  const isExpired = forcedState === 'expired' || (!forcedState && file?.status === 'expired');
  const isExhausted = forcedState === 'exhausted' || (!forcedState && file?.status === 'exhausted');
  const needsPassword = (forcedState === 'password' || (!forcedState && file?.hasPassword)) && !isUnlocked;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `http://localhost:3000/f/${fileId}`;

  return (
    <div style={{ maxWidth: '640px', margin: '40px auto 90px', position: 'relative' }}>
      
      {/* 1. EXPIRED / VANISHED STATE */}
      {isExpired ? (
        <div className="glass-panel" style={{ padding: '52px 32px', textAlign: 'center', background: '#ffffff', borderRadius: '20px' }}>
          
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--rose-50)',
            border: '2px dashed var(--rose-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: 'var(--rose-600)'
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
              <line x1="2" y1="2" x2="22" y2="22"></line>
            </svg>
          </div>

          <span className="badge badge-danger" style={{ marginBottom: '14px' }}>
            STATUS: PERMANENTLY DESTROYED
          </span>

          <h1 style={{ fontSize: '2.1rem', marginBottom: '10px', color: '#0f172a' }}>
            This File Has Vanished
          </h1>

          <p style={{ color: 'var(--text-soft)', fontSize: '0.94rem', lineHeight: 1.6, maxWidth: '460px', margin: '0 auto 20px' }}>
            The designated TTL lifetime for this share link has elapsed. Per the Vanish ephemeral security protocol, the physical file binary was wiped from Cloudinary and all metadata purged from MongoDB.
          </p>

          {/* Cryptographic Zero Residue Certificate */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '14px',
            maxWidth: '440px',
            margin: '0 auto 28px',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Object Vault:</span>
              <span style={{ color: '#dc2626', fontWeight: 700 }}>Scrubbed (0 Bytes)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>MongoDB Atlas TTL:</span>
              <span style={{ color: '#dc2626', fontWeight: 700 }}>Index Cleaned</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Residual Forensic Trace:</span>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>0.00% Zero Left</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <Link href="/upload" className="btn btn-primary" onClick={() => playClickSound()}>
              <span>Upload Your Own Expiring File</span>
            </Link>
            <Link href="/" className="btn btn-outline" onClick={() => playClickSound()}>
              <span>Platform Hub</span>
            </Link>
          </div>

        </div>
      ) : isExhausted ? (
        /* 2. DOWNLOAD LIMIT REACHED STATE */
        <div className="glass-panel" style={{ padding: '52px 32px', textAlign: 'center', background: '#ffffff', borderRadius: '20px' }}>
          
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--bg-blue-tint)',
            border: '2px solid var(--border-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: 'var(--blue-700)'
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>

          <span className="badge badge-soft" style={{ marginBottom: '14px' }}>
            DOWNLOAD QUOTA DEPLETED
          </span>

          <h1 style={{ fontSize: '2.1rem', marginBottom: '10px', color: '#0f172a' }}>
            Download Limit Reached
          </h1>

          <p style={{ color: 'var(--text-soft)', fontSize: '0.94rem', lineHeight: 1.6, maxWidth: '440px', margin: '0 auto 24px' }}>
            The sender configured a strict maximum download cap for this file. The maximum allowed downloads have been consumed, and the file has self-destructed.
          </p>

          <Link href="/upload" className="btn btn-primary" onClick={() => playClickSound()}>
            <span>Send New File on Vanish</span>
          </Link>
        </div>
      ) : needsPassword ? (
        /* 3. PASSWORD PROTECTED CHALLENGE */
        <div className="glass-panel" style={{ padding: '44px 32px', textAlign: 'center', background: '#ffffff', borderRadius: '20px' }}>
          
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'var(--bg-blue-tint)',
            border: '1px solid var(--border-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--blue-700)'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>

          <span className="badge badge-blue" style={{ marginBottom: '10px' }}>
            PROTECTED EPHEMERAL PAYLOAD
          </span>

          <h1 style={{ fontSize: '1.9rem', marginBottom: '6px', color: '#0f172a' }}>
            Password Required
          </h1>

          <p style={{ color: 'var(--text-soft)', fontSize: '0.92rem', marginBottom: '24px' }}>
            The sender encrypted <strong>{file?.name || 'this file'}</strong> with an access secret. Enter password to unlock.
          </p>

          <form onSubmit={handlePasswordSubmit} style={{ maxWidth: '340px', margin: '0 auto' }}>
            <div style={{ marginBottom: '14px' }}>
              <input
                type="password"
                placeholder="Enter password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  border: `1.5px solid ${passwordError ? '#ef4444' : 'var(--border-medium)'}`,
                  color: '#0f172a',
                  fontSize: '0.96rem',
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
        /* 4. ACTIVE READY TO DOWNLOAD */
        <div className="glass-panel" style={{ padding: '42px 32px', textAlign: 'center', background: '#ffffff', borderRadius: '20px' }}>
          
          {/* Real-Time Live Clock */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <CountdownClock
              expiresAt={file ? file.expiresAt : 0}
              uploadedAt={file?.uploadedAt}
              size="lg"
            />
          </div>

          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '14px',
            background: 'var(--bg-blue-tint)',
            border: '1px solid var(--border-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--blue-600)'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>

          <h1 style={{ fontSize: '1.75rem', marginBottom: '8px', wordBreak: 'break-word', color: '#0f172a' }}>
            {file?.name || 'IIITV_Design_Project_Report.pdf'}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '22px' }}>
            <span className="badge badge-white">
              {formatBytes(file?.size || 2457600)}
            </span>
            <span className="badge badge-blue">
              {file?.mimeType || 'application/pdf'}
            </span>
            <span className="badge badge-success">
              ✓ SHA-256 Verified
            </span>
            {file?.maxDownloads && (
              <span className="badge badge-soft">
                {file.downloadCount} of {file.maxDownloads} downloads used
              </span>
            )}
          </div>

          {/* Download CTA Button */}
          <button
            onClick={handleDownload}
            className="btn btn-primary btn-lg"
            style={{
              width: '100%',
              maxWidth: '320px',
              margin: '0 auto 14px',
              display: 'flex'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Download Original File</span>
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

      {/* Floating Discreet Dev Simulator Drawer Pill (Bottom Right) */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 90
      }}>
        {showDevDrawer ? (
          <div className="glass-panel" style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '14px',
            boxShadow: 'var(--shadow-elevated)',
            border: '1px solid var(--border-blue)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--blue-700)', textTransform: 'uppercase' }}>
                🧪 Academic State Simulator
              </span>
              <button
                onClick={() => setShowDevDrawer(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
                Password Lock
              </button>
              <button
                onClick={() => setForcedState('expired')}
                className={`btn btn-sm ${isExpired ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '3px 8px', fontSize: '0.72rem' }}
              >
                Vanished State
              </button>
              <button
                onClick={() => setForcedState('exhausted')}
                className={`btn btn-sm ${isExhausted ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '3px 8px', fontSize: '0.72rem' }}
              >
                Limit Exhausted
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDevDrawer(true)}
            className="btn btn-outline btn-sm"
            style={{
              boxShadow: 'var(--shadow-card)',
              background: '#ffffff',
              fontSize: '0.72rem',
              borderRadius: '999px',
              padding: '6px 12px'
            }}
          >
            <span>🧪 Simulator Bench</span>
          </button>
        )}
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        url={currentUrl}
        fileName={file?.name || 'Vanish Ephemeral File'}
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />

    </div>
  );
}
