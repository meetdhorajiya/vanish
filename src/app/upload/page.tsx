'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ExpiryDuration, FileRecord } from '@/types';
import { uploadRealFile, getCurrentUser } from '@/services/storage';

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expiry, setExpiry] = useState<ExpiryDuration>('24h');
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [enableLimit, setEnableLimit] = useState(false);
  const [maxDownloads, setMaxDownloads] = useState<number>(1);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState('');
  const [createdRecord, setCreatedRecord] = useState<FileRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const expiryOptions: { label: string; value: ExpiryDuration; durationMs: number; badge?: string }[] = [
    { label: '30s Demo', value: '30s', durationMs: 1000 * 30, badge: 'Rapid' },
    { label: '1 Hour', value: '1h', durationMs: 1000 * 60 * 60 },
    { label: '6 Hours', value: '6h', durationMs: 1000 * 60 * 60 * 6 },
    { label: '24 Hours', value: '24h', durationMs: 1000 * 60 * 60 * 24 },
    { label: '7 Days', value: '7d', durationMs: 1000 * 60 * 60 * 24 * 7 },
  ];

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setErrorMessage(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const startUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage(null);
    setUploadProgress(20);
    setUploadStep('Validating file integrity and MIME type...');

    try {
      setTimeout(() => {
        setUploadProgress(50);
        setUploadStep('Streaming payload to cloud storage...');
      }, 300);

      setTimeout(() => {
        setUploadProgress(80);
        setUploadStep('Generating cryptographic ID and setting TTL...');
      }, 700);

      const currentUser = getCurrentUser();
      const record = await uploadRealFile(selectedFile, {
        duration: expiry,
        password: enablePassword && password.trim() ? password.trim() : undefined,
        maxDownloads: enableLimit && maxDownloads > 0 ? maxDownloads : null,
        ownerEmail: currentUser?.email || 'user@vanish.dev',
      });

      setUploadProgress(100);
      setUploadStep('Complete!');
      setCreatedRecord(record);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
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
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ maxWidth: '680px', margin: '36px auto 80px' }}>
      
      {/* Page Title */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-blue-tint)',
          border: '1px solid var(--border-blue)',
          marginBottom: '10px'
        }}>
          <span className="pulse-dot"></span>
          <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--blue-700)' }}>
            Ephemeral Upload Studio
          </span>
        </div>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
          Upload and <span className="blue-text">Vanish</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem' }}>
          Secure, temporary cloud file sharing. Files are genuinely deleted from storage once their TTL timer expires.
        </p>
      </div>

      {!createdRecord ? (
        <div className="glass-panel" style={{ padding: '28px', background: '#ffffff' }}>
          
          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '1px dashed #b2ddff',
              borderRadius: 'var(--radius-sm)',
              background: '#f8fbff',
              padding: '36px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: '20px'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-sm)',
              background: '#ffffff',
              border: '1px solid #d1e9ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'var(--blue-600)',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>

            {selectedFile ? (
              <div>
                <span className="badge badge-blue" style={{ marginBottom: '8px' }}>
                  File Selected
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  {selectedFile.name}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {formatFileSize(selectedFile.size)} / {selectedFile.type || 'Binary Format'}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="btn btn-sm btn-outline"
                  style={{ marginTop: '10px' }}
                >
                  Change File
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  Drag and drop file here, or <span style={{ color: 'var(--blue-600)', textDecoration: 'underline' }}>browse</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                  Documents, images, archives up to 100MB
                </div>
              </div>
            )}
          </div>

          {/* Expiry Duration Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '7px' }}>
              Select Self-Destruct Lifetime (TTL Expiry):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '8px' }}>
              {expiryOptions.map((opt) => {
                const isSelected = expiry === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExpiry(opt.value)}
                    style={{
                      padding: '9px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--blue-600)' : '#ffffff',
                      border: `1px solid ${isSelected ? 'var(--blue-600)' : 'var(--border-medium)'}`,
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    {opt.badge && (
                      <span style={{
                        position: 'absolute',
                        top: '-7px',
                        right: '5px',
                        fontSize: '0.58rem',
                        fontWeight: 700,
                        background: isSelected ? '#ffffff' : 'var(--blue-600)',
                        color: isSelected ? 'var(--blue-700)' : '#ffffff',
                        padding: '1px 5px',
                        borderRadius: '999px',
                        textTransform: 'uppercase'
                      }}>
                        {opt.badge}
                      </span>
                    )}
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{opt.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Access Controls Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}>
            
            {/* Password Protection */}
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              background: '#f9fafb',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: enablePassword ? '10px' : '0' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>Password Protection</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Require password to download</div>
                </div>

                <input
                  type="checkbox"
                  checked={enablePassword}
                  onChange={(e) => setEnablePassword(e.target.checked)}
                  style={{ width: '15px', height: '15px', accentColor: 'var(--blue-600)', cursor: 'pointer' }}
                />
              </div>

              {enablePassword && (
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter decryption password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 34px 8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: '#ffffff',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.72rem'
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              )}
            </div>

            {/* Max Download Limit */}
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              background: '#f9fafb',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: enableLimit ? '10px' : '0' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>Download Limit</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Auto-destruct after N downloads</div>
                </div>

                <input
                  type="checkbox"
                  checked={enableLimit}
                  onChange={(e) => setEnableLimit(e.target.checked)}
                  style={{ width: '15px', height: '15px', accentColor: 'var(--blue-600)', cursor: 'pointer' }}
                />
              </div>

              {enableLimit && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setMaxDownloads(Math.max(1, maxDownloads - 1))}
                    className="btn btn-outline btn-sm"
                  >
                    -
                  </button>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', minWidth: '70px', textAlign: 'center' }}>
                    {maxDownloads} {maxDownloads === 1 ? 'download' : 'downloads'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMaxDownloads(maxDownloads + 1)}
                    className="btn btn-outline btn-sm"
                  >
                    +
                  </button>
                </div>
              )}
            </div>

          </div>

          {errorMessage && (
            <div style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: '#fef3f2',
              border: '1px solid #fee4e2',
              color: '#b42318',
              fontSize: '0.84rem',
              marginBottom: '14px'
            }}>
              {errorMessage}
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading ? (
            <div style={{
              background: '#f8fbff',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              border: '1px solid #b2ddff',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--blue-700)', fontWeight: 600 }}>
                  {uploadStep}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {uploadProgress}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                background: '#eaecf0',
                borderRadius: '999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${uploadProgress}%`,
                  background: 'var(--blue-600)',
                  transition: 'width 0.25s ease'
                }}></div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={startUpload}
              disabled={!selectedFile}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.94rem',
                opacity: selectedFile ? 1 : 0.45,
                cursor: selectedFile ? 'pointer' : 'not-allowed'
              }}
            >
              <span>{selectedFile ? 'Upload and Generate Ephemeral Link' : 'Select a File to Begin'}</span>
            </button>
          )}

        </div>
      ) : (
        /* Upload Success View */
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', background: '#ffffff' }}>
          
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'var(--bg-blue-tint)',
            border: '1px solid var(--border-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            color: 'var(--blue-700)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px', color: 'var(--text-primary)' }}>
            File Uploaded and Link Active
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
            <strong>{createdRecord.name}</strong> ({formatFileSize(createdRecord.size)}) is stored and ready to share.
          </p>

          {/* Share Link Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f9fafb',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 10px',
            marginBottom: '16px',
            gap: '8px'
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
                fontSize: '0.86rem',
                flex: 1,
                outline: 'none'
              }}
            />
            <button
              onClick={handleCopyLink}
              className="btn btn-primary btn-sm"
            >
              {copied ? 'Copied' : 'Copy Link'}
            </button>
          </div>

          {/* Badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '24px'
          }}>
            <span className="badge badge-blue">
              TTL: {createdRecord.durationLabel}
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
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Link
              href={`/f/${createdRecord.id}`}
              className="btn btn-primary"
            >
              <span>Test As Recipient (Open Page)</span>
            </Link>

            <Link
              href="/dashboard"
              className="btn btn-outline"
            >
              <span>View in Dashboard</span>
            </Link>

            <button
              onClick={resetUpload}
              className="btn btn-outline"
            >
              <span>Upload Another</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
