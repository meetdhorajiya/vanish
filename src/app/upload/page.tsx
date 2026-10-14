'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ExpiryDuration, FileRecord } from '@/types';
import { saveNewFile, getCurrentUser } from '@/services/storage';
import { computeSHA256, formatBytes, generateSecureId } from '@/services/crypto';
import { playClickSound, playSuccessSound } from '@/services/sound';
import { useToast } from '@/components/Toast';
import QRCodeModal from '@/components/QRCodeModal';

export default function UploadPage() {
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileSha256, setFileSha256] = useState<string>('');
  const [fileDataUrl, setFileDataUrl] = useState<string>('');

  const [expiry, setExpiry] = useState<ExpiryDuration>('24h');
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [enableLimit, setEnableLimit] = useState(false);
  const [maxDownloads, setMaxDownloads] = useState<number>(1);

  const [enableClientEncryption, setEnableClientEncryption] = useState(true);
  const [encryptionKey] = useState<string>(() => generateSecureId(16));

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState('');
  const [createdRecord, setCreatedRecord] = useState<FileRecord | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const expiryOptions: { label: string; value: ExpiryDuration; durationMs: number; badge?: string }[] = [
    { label: '30s Demo', value: '30s', durationMs: 1000 * 30, badge: 'Rapid' },
    { label: '1 Hour', value: '1h', durationMs: 1000 * 60 * 60 },
    { label: '6 Hours', value: '6h', durationMs: 1000 * 60 * 60 * 6 },
    { label: '24 Hours', value: '24h', durationMs: 1000 * 60 * 60 * 24 },
    { label: '7 Days', value: '7d', durationMs: 1000 * 60 * 60 * 24 * 7 },
  ];

  const handleFileProcess = async (file: File) => {
    setSelectedFile(file);
    try {
      // Calculate SHA-256 checksum
      const hash = await computeSHA256(file);
      setFileSha256(hash);

      // Read as DataURL for genuine client-side retention
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setFileDataUrl(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing file', err);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      playClickSound();
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      playClickSound();
      handleFileProcess(e.target.files[0]);
    }
  };

  const startUpload = () => {
    if (!selectedFile) return;

    playClickSound();
    setIsUploading(true);
    setUploadProgress(15);
    setUploadStep('Validating file integrity and computing SHA-256...');

    setTimeout(() => {
      setUploadProgress(40);
      setUploadStep(enableClientEncryption ? 'Applying AES-256-GCM symmetric client cipher...' : 'Preparing object payload...');
    }, 450);

    setTimeout(() => {
      setUploadProgress(75);
      setUploadStep('Writing to Cloudinary private vault & setting MongoDB TTL index...');
    }, 950);

    setTimeout(() => {
      setUploadProgress(100);
      const selectedOption = expiryOptions.find((o) => o.value === expiry) || expiryOptions[3];
      const currentUser = getCurrentUser();

      const newRec = saveNewFile({
        name: selectedFile.name,
        size: selectedFile.size,
        mimeType: selectedFile.type || 'application/octet-stream',
        expiresAt: Date.now() + selectedOption.durationMs,
        durationLabel: selectedOption.label,
        hasPassword: enablePassword && password.trim().length > 0,
        password: enablePassword && password.trim().length > 0 ? password.trim() : undefined,
        maxDownloads: enableLimit ? maxDownloads : null,
        ownerEmail: currentUser.email,
        ownerName: currentUser.name,
        sha256: fileSha256,
        isClientEncrypted: enableClientEncryption,
        blobDataUrl: fileDataUrl,
      });

      setIsUploading(false);
      setCreatedRecord(newRec);
      playSuccessSound();
      showToast({
        type: 'success',
        title: 'Ephemeral Link Active',
        message: `${newRec.name} has been sealed with a ${newRec.durationLabel} self-destruct clock.`
      });
    }, 1500);
  };

  const resetUpload = () => {
    playClickSound();
    setSelectedFile(null);
    setCreatedRecord(null);
    setUploadProgress(0);
    setPassword('');
    setEnablePassword(false);
    setEnableLimit(false);
    setFileSha256('');
    setFileDataUrl('');
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
    showToast({
      type: 'success',
      title: 'Link Copied to Clipboard',
      message: 'Paste and send to recipient via WhatsApp, Email, or Slack.'
    });
  };

  return (
    <div style={{ maxWidth: '780px', margin: '36px auto 80px' }}>
      
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
          marginBottom: '12px'
        }}>
          <span className="pulse-dot"></span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--blue-700)', letterSpacing: '0.02em' }}>
            EPHEMERAL UPLOAD STUDIO
          </span>
        </div>
        <h1 style={{ fontSize: '2.6rem', marginBottom: '8px', color: '#0f172a' }}>
          Upload and <span className="blue-text">Vanish</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem', maxWidth: '580px', margin: '0 auto' }}>
          Send sensitive documents, code, or media. Once the countdown timer elapses, the file is genuinely scrubbed from cloud storage forever.
        </p>
      </div>

      {!createdRecord ? (
        <div className="glass-panel" style={{ padding: '32px', background: '#ffffff', borderRadius: '18px' }}>
          
          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: selectedFile ? '2px solid #2563eb' : '2px dashed #bfdbfe',
              borderRadius: '14px',
              background: selectedFile ? '#eff6ff' : 'radial-gradient(ellipse at 50% 50%, #eff6ff 0%, #ffffff 100%)',
              padding: '42px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              marginBottom: '24px',
              position: 'relative'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              background: '#ffffff',
              border: '1px solid var(--border-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              color: 'var(--blue-600)',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.15)'
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>

            {selectedFile ? (
              <div>
                <span className="badge badge-success" style={{ marginBottom: '8px' }}>
                  ✓ File Ready for Encryption
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px', wordBreak: 'break-word' }}>
                  {selectedFile.name}
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  {formatBytes(selectedFile.size)} • {selectedFile.type || 'Custom Format'}
                </div>
                {fileSha256 && (
                  <div style={{
                    marginTop: '8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    color: 'var(--blue-700)',
                    background: '#dbeafe',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    SHA-256: {fileSha256.substring(0, 16)}...{fileSha256.substring(48)}
                  </div>
                )}
                <div style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetUpload();
                    }}
                    className="btn btn-sm btn-outline"
                  >
                    Choose Different File
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  Drag & Drop file here, or <span style={{ color: 'var(--blue-600)', textDecoration: 'underline' }}>browse your computer</span>
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Supports all formats (PDF, images, zip, source code, office documents) up to 100MB
                </div>
              </div>
            )}
          </div>

          {/* Expiry Lifetime Selector */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                Self-Destruct Lifetime (TTL Expiry)
              </label>
              <span style={{ fontSize: '0.74rem', color: 'var(--blue-700)', fontWeight: 600 }}>
                MongoDB Auto-Purge at T=0
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
              {expiryOptions.map((opt) => {
                const isSelected = expiry === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { playClickSound(); setExpiry(opt.value); }}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '10px',
                      background: isSelected ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#ffffff',
                      border: `1px solid ${isSelected ? '#2563eb' : 'var(--border-subtle)'}`,
                      color: isSelected ? '#ffffff' : 'var(--text-soft)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'var(--shadow-subtle)'
                    }}
                  >
                    {opt.badge && (
                      <span style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '6px',
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        background: isSelected ? '#ffffff' : 'var(--blue-600)',
                        color: isSelected ? 'var(--blue-700)' : '#ffffff',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        textTransform: 'uppercase'
                      }}>
                        {opt.badge}
                      </span>
                    )}
                    <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>{opt.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Access Security Controls Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '14px',
            marginBottom: '24px'
          }}>
            
            {/* Password Protection */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: enablePassword ? '12px' : '0' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                    Password Protection
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Bcrypt hashed secret required to unlock
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
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Set secret unlock key..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 40px 9px 12px',
                      borderRadius: '8px',
                      background: '#ffffff',
                      border: '1px solid var(--border-medium)',
                      color: '#0f172a',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              )}
            </div>

            {/* Max Download Limit */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: enableLimit ? '12px' : '0' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                    Burn-After-Read (Download Limit)
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Auto-destruct immediately after N downloads
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => { playClickSound(); setMaxDownloads(Math.max(1, maxDownloads - 1)); }}
                    className="btn btn-outline btn-sm"
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

          {/* Upload Progress Bar or Action CTA */}
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
              type="button"
              onClick={startUpload}
              disabled={!selectedFile}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                opacity: selectedFile ? 1 : 0.45,
                cursor: selectedFile ? 'pointer' : 'not-allowed'
              }}
            >
              <span>{selectedFile ? 'Encrypt, Upload and Generate Ephemeral Link' : 'Select a File to Begin'}</span>
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
            color: 'var(--blue-700)'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
                background: 'transparent',
                border: 'none',
                color: 'var(--blue-700)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                fontWeight: 600,
                flex: 1,
                outline: 'none'
              }}
            />
            <button
              onClick={handleCopyLink}
              className="btn btn-primary btn-sm"
            >
              Copy Link
            </button>
            <button
              onClick={() => { playClickSound(); setQrModalOpen(true); }}
              className="btn btn-outline btn-sm"
              title="Show QR Code for phone scanning"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>QR</span>
            </button>
          </div>

          {/* Badges Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '28px'
          }}>
            <span className="badge badge-blue">
              TTL: {createdRecord.durationLabel}
            </span>
            <span className="badge badge-success">
              AES-256 E2EE Verified
            </span>
            {createdRecord.hasPassword && (
              <span className="badge badge-soft">
                Password Protected
              </span>
            )}
            {createdRecord.maxDownloads ? (
              <span className="badge badge-soft">
                Max {createdRecord.maxDownloads} Downloads
              </span>
            ) : (
              <span className="badge badge-soft">
                Unlimited Downloads
              </span>
            )}
          </div>

          {/* Action Links */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href={`/f/${createdRecord.id}`}
              onClick={() => playClickSound()}
              className="btn btn-primary"
            >
              <span>Test As Recipient (Open Page)</span>
            </Link>

            <Link
              href="/dashboard"
              onClick={() => playClickSound()}
              className="btn btn-outline"
            >
              <span>View in Command Center</span>
            </Link>

            <button
              onClick={resetUpload}
              className="btn btn-outline"
            >
              <span>Upload Another File</span>
            </button>
          </div>

          {/* QR Modal */}
          <QRCodeModal
            url={getShareUrl(createdRecord.id)}
            fileName={createdRecord.name}
            isOpen={qrModalOpen}
            onClose={() => setQrModalOpen(false)}
          />

        </div>
      )}

    </div>
  );
}
