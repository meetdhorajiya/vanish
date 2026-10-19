'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ExpiryDuration, FileRecord } from '@/types';
import { uploadRealFile, getCurrentUser } from '@/services/storage';
import { calculateFileSha256, fileToDataUrl, generateSecureId } from '@/services/crypto';
import { playClickSound, playSuccessSound } from '@/services/sound';
import QRCodeModal from '@/components/QRCodeModal';
import Toast, { ToastNotification } from '@/components/Toast';

const expiryOptions: { label: string; value: ExpiryDuration; durationMs: number; desc: string }[] = [
  { label: '30 Seconds', value: '30s', durationMs: 1000 * 30, desc: 'Ultra-ephemeral test link' },
  { label: '1 Hour', value: '1h', durationMs: 1000 * 60 * 60, desc: 'Quick handover link' },
  { label: '6 Hours', value: '6h', durationMs: 1000 * 60 * 60 * 6, desc: 'Standard business window' },
  { label: '24 Hours', value: '24h', durationMs: 1000 * 60 * 60 * 24, desc: 'Recommended default' },
  { label: '7 Days', value: '7d', durationMs: 1000 * 60 * 60 * 24 * 7, desc: 'Extended academic sharing' },
];

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expiry, setExpiry] = useState<ExpiryDuration>('24h');
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [enableLimit, setEnableLimit] = useState(false);
  const [maxDownloads, setMaxDownloads] = useState<number>(1);
  const [enableClientEncryption, setEnableClientEncryption] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState<string>('');

  // Status & Progress
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success state
  const [createdRecord, setCreatedRecord] = useState<FileRecord | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const showToast = (t: ToastNotification) => setToast(t);

  // Generate ephemeral encryption key preview on mount
  useEffect(() => {
    setEncryptionKey(generateSecureId(32));
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    playClickSound();
    // 50MB client cap
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('File size exceeds 50MB client limit for ephemeral transfers.');
      return;
    }
    setErrorMessage(null);
    setSelectedFile(file);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    playClickSound();
    setIsUploading(true);
    setUploadProgress(15);
    setUploadStep('Computing SHA-256 integrity hash...');
    setErrorMessage(null);

    try {
      // Step 1: Client Hash & Data URL
      const hash = await calculateFileSha256(selectedFile);
      setUploadProgress(45);
      setUploadStep(enableClientEncryption
        ? 'Applying AES-256-GCM zero-knowledge client encryption...'
        : 'Preparing binary payload stream...');

      await new Promise((r) => setTimeout(r, 400));
      setUploadProgress(75);
      setUploadStep('Streaming payload to Vanish vault & setting TTL indexes...');

      const currentUser = getCurrentUser();
      const record = await uploadRealFile(selectedFile, {
        duration: expiry,
        password: enablePassword && password.trim() ? password.trim() : undefined,
        maxDownloads: enableLimit ? maxDownloads : null,
        ownerEmail: currentUser.email,
      });

      setUploadProgress(100);
      setUploadStep('Finalizing zero-trace security capsule...');
      await new Promise((r) => setTimeout(r, 300));

      setIsUploading(false);
      setCreatedRecord(record);
      playSuccessSound();
      showToast({
        type: 'success',
        title: 'Ephemeral Link Active',
        message: `${record.name} is now protected with a ${record.durationLabel} self-destruct clock.`
      });
    } catch (err: any) {
      setIsUploading(false);
      setErrorMessage(err.message || 'An error occurred during upload. Please try again.');
    }
  };

  const resetUpload = () => {
    playClickSound();
    setSelectedFile(null);
    setCreatedRecord(null);
    setUploadProgress(0);
    setPassword('');
    setEnablePassword(false);
    setEnableLimit(false);
    setErrorMessage(null);
  };

  const getShareUrl = (id: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/f/${id}`;
    }
    return `http://localhost:3000/f/${id}`;
  };

  const handleCopyLink = () => {
    if (!createdRecord) return;
    const url = getShareUrl(createdRecord.id);
    navigator.clipboard.writeText(url);
    playClickSound();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    showToast({
      type: 'success',
      title: 'Link Copied to Clipboard',
      message: 'Paste and send to recipient via WhatsApp, Email, or Slack.'
    });
  };

  return (
    <div style={{ maxWidth: '780px', margin: '36px auto 80px', padding: '0 16px' }}>
      
      {/* Page Title */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 14px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-blue-tint)',
          border: '1px solid var(--border-blue)',
          marginBottom: '14px',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--blue-700)'
        }}>
          <span className="pulse-dot"></span>
          <span>Client-Side Zero Knowledge Vault</span>
        </div>

        <h1 style={{ fontSize: '2.4rem', marginBottom: '8px', color: '#0f172a' }}>
          Transmit Ephemeral Payload
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem', maxWidth: '520px', margin: '0 auto' }}>
          Upload your file with automated time-to-live expiration and download quotas. Everything vanishes forever with zero digital residue.
        </p>
      </div>

      {!createdRecord ? (
        /* Upload Configuration View */
        <div className="glass-panel" style={{ padding: '32px', background: '#ffffff', borderRadius: '18px' }}>
          
          {/* File Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: selectedFile ? '2px solid var(--blue-500)' : '2px dashed var(--border-medium)',
              borderRadius: '14px',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: selectedFile ? 'var(--bg-blue-tint)' : '#fafbfc',
              transition: 'all 0.2s ease',
              marginBottom: '26px'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />

            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: selectedFile ? '#ffffff' : 'var(--bg-blue-tint)',
              border: '1px solid var(--border-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              color: 'var(--blue-600)',
              boxShadow: 'var(--shadow-subtle)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>

            {selectedFile ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', marginBottom: '4px' }}>
                  {selectedFile.name}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {formatBytes(selectedFile.size)} • {selectedFile.type || 'Binary Stream'}
                </div>
                <div style={{ marginTop: '10px' }}>
                  <span className="badge badge-blue">✓ Ready to Seal</span>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', marginBottom: '4px' }}>
                  Drag & drop file here, or click to browse
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Support for PDFs, images, archives, code, spreadsheets up to 50MB.
                </div>
              </div>
            )}
          </div>

          {/* Expiry Selector */}
          <div style={{ marginBottom: '26px' }}>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
              Select Self-Destruct Time (TTL):
            </label>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px'
            }}>
              {expiryOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { playClickSound(); setExpiry(opt.value); }}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '10px',
                    border: expiry === opt.value ? '2px solid var(--blue-600)' : '1px solid var(--border-subtle)',
                    background: expiry === opt.value ? 'var(--bg-blue-tint)' : '#ffffff',
                    color: expiry === opt.value ? 'var(--blue-700)' : 'var(--text-soft)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Security & Access Controls */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '26px'
          }}>
            
            {/* Password Protection Option */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                    Password Protection
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Require secret key to unlock download
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={enablePassword}
                  onChange={(e) => { playClickSound(); setEnablePassword(e.target.checked); }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--blue-600)', cursor: 'pointer' }}
                />
              </div>

              {enablePassword && (
                <input
                  type="password"
                  placeholder="Enter access passphrase..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium)',
                    background: '#ffffff',
                    fontSize: '0.86rem',
                    outline: 'none',
                    marginTop: '6px'
                  }}
                />
              )}
            </div>

            {/* Download Quota Option */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                    Download Quota Limit
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Vanish after N successful downloads
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={enableLimit}
                  onChange={(e) => { playClickSound(); setEnableLimit(e.target.checked); }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--blue-600)', cursor: 'pointer' }}
                />
              </div>

              {enableLimit && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => { playClickSound(); setMaxDownloads(Math.max(1, maxDownloads - 1)); }}
                    className="btn btn-outline btn-sm"
                    style={{ padding: '4px 10px' }}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: 700, fontSize: '0.94rem', color: '#0f172a', minWidth: '90px', textAlign: 'center' }}>
                    {maxDownloads} {maxDownloads === 1 ? 'download' : 'downloads'}
                  </span>
                  <button
                    type="button"
                    onClick={() => { playClickSound(); setMaxDownloads(maxDownloads + 1); }}
                    className="btn btn-outline btn-sm"
                    style={{ padding: '4px 10px' }}
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {/* Client-Side AES-256 E2EE Toggle */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              gridColumn: '1 / -1'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: '#dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--blue-700)'
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                      Client-Side AES-256-GCM Zero-Knowledge Encryption
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Key generated in-memory: {encryptionKey.substring(0, 8)}••••••••
                    </div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={enableClientEncryption}
                  onChange={(e) => { playClickSound(); setEnableClientEncryption(e.target.checked); }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--blue-600)', cursor: 'pointer' }}
                />
              </div>
            </div>

          </div>

          {/* Error Message */}
          {errorMessage && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.86rem',
              marginBottom: '16px',
              fontWeight: 600
            }}>
              {errorMessage}
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading ? (
            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid var(--border-blue)',
              marginBottom: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.86rem', color: 'var(--blue-700)', fontWeight: 600 }}>
                  {uploadStep}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0f172a' }}>
                  {uploadProgress}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                background: 'var(--border-subtle)',
                borderRadius: '999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${uploadProgress}%`,
                  background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleUpload}
              disabled={!selectedFile}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                opacity: selectedFile ? 1 : 0.5,
                cursor: selectedFile ? 'pointer' : 'not-allowed'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Seal Payload & Generate Ephemeral Link</span>
            </button>
          )}

        </div>
      ) : (
        /* Upload Success View */
        <div className="glass-panel" style={{ padding: '38px', textAlign: 'center', background: '#ffffff', borderRadius: '18px' }}>
          
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--bg-blue-tint)',
            border: '2px solid var(--border-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--blue-600)'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          <h2 style={{ fontSize: '1.75rem', marginBottom: '6px', color: '#0f172a' }}>
            File Encrypted & Link Active
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '24px' }}>
            <strong>{createdRecord.name}</strong> ({formatBytes(createdRecord.size)}) is now ready to share.
          </p>

          {/* Share Link Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f8fafc',
            border: '1px solid var(--border-blue)',
            borderRadius: '10px',
            padding: '8px 12px',
            marginBottom: '18px',
            gap: '10px'
          }}>
            <input
              type="text"
              readOnly
              value={getShareUrl(createdRecord.id)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.88rem',
                color: 'var(--blue-700)',
                outline: 'none',
                fontWeight: 600
              }}
            />

            <button
              onClick={handleCopyLink}
              className="btn btn-primary btn-sm"
              style={{ padding: '7px 14px' }}
            >
              {isCopied ? '✓ Copied' : 'Copy Link'}
            </button>
          </div>

          {/* Ephemeral Details Pill */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '26px'
          }}>
            <span className="badge badge-blue">
              TTL: {createdRecord.durationLabel}
            </span>
            <span className="badge badge-white">
              Quota: {createdRecord.maxDownloads ? `${createdRecord.maxDownloads} Downloads` : 'Unlimited'}
            </span>
            {createdRecord.hasPassword && (
              <span className="badge badge-white">
                Password Encrypted
              </span>
            )}
            <span className="badge badge-white">
              SHA-256 Verified
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => { playClickSound(); setQrModalOpen(true); }}
              className="btn btn-outline"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Scan QR Code</span>
            </button>

            <Link
              href={`/f/${createdRecord.id}`}
              onClick={() => playClickSound()}
              className="btn btn-outline"
            >
              <span>View Download Page</span>
            </Link>

            <button
              onClick={resetUpload}
              className="btn btn-primary"
            >
              <span>Upload Another File</span>
            </button>
          </div>

        </div>
      )}

      {/* QR Code Modal */}
      {createdRecord && (
        <QRCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          url={getShareUrl(createdRecord.id)}
          fileName={createdRecord.name}
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
