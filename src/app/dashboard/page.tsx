'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileRecord, UserSession } from '@/types';
import { fetchFiles, getStoredFiles, deleteFileImmediately, resetDemoDatabase, getCurrentUser, subscribeToStore } from '@/services/storage';
import { playClickSound, playIncinerateSound } from '@/services/sound';
import CountdownClock from '@/components/CountdownClock';
import QRCodeModal from '@/components/QRCodeModal';
import Toast, { ToastNotification } from '@/components/Toast';

export default function DashboardPage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrModalFile, setQrModalFile] = useState<FileRecord | null>(null);
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [, startTransition] = useTransition();

  const loadData = async () => {
    try {
      const user = getCurrentUser();
      setCurrentUser(user);

      // Load from local store immediately for instant rendering
      const local = getStoredFiles();
      if (local.length > 0) {
        startTransition(() => {
          setFiles(local);
        });
      }

      // Then fetch latest from server
      const remote = await fetchFiles();
      if (remote) {
        startTransition(() => {
          setFiles(remote);
          setLoading(false);
        });
      }
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsubscribe = subscribeToStore(() => {
      loadData();
    });

    const interval = setInterval(loadData, 4000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const showToast = (t: ToastNotification) => setToast(t);

  const handleDelete = async (id: string, name: string) => {
    playIncinerateSound();
    deleteFileImmediately(id);
    await loadData();
    showToast({
      type: 'info',
      title: 'Forensically Vanished',
      message: `${name} and all cryptographic access keys were scrubbed from storage.`
    });
  };

  const handleResetData = async () => {
    playClickSound();
    resetDemoDatabase();
    await loadData();
    showToast({
      type: 'success',
      title: 'Database Reset',
      message: 'Initial demo files and access logs have been restored.'
    });
  };

  const handleCopyLink = (id: string) => {
    playClickSound();
    const url = typeof window !== 'undefined' ? `${window.location.origin}/f/${id}` : `http://localhost:3000/f/${id}`;
    navigator.clipboard.writeText(url);
    showToast({
      type: 'success',
      title: 'Link Copied',
      message: 'Share URL copied to clipboard.'
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Metrics
  const activeFiles = files.filter((f) => f.status === 'active');
  const expiredFiles = files.filter((f) => f.status !== 'active');
  const totalDownloads = files.reduce((acc, f) => acc + f.downloadCount, 0);
  const totalSizeBytes = activeFiles.reduce((acc, f) => acc + f.size, 0);

  // Filtered files
  const filteredFiles = files.filter((file) => {
    if (filter === 'active' && file.status !== 'active') return false;
    if (filter === 'expired' && file.status === 'active') return false;
    if (searchQuery.trim() && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1040px', margin: '36px auto 80px', padding: '0 20px' }}>
      
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '2.1rem', color: '#0f172a' }}>
              Command Center
            </h1>
            <span className="badge badge-blue">TTL ENGINE LIVE</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>
            Active ephemeral payloads, automated cryptographic revocations, and forensic scrub records.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleResetData}
            className="btn btn-outline btn-sm"
            title="Reset to default demo files"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
            <span>Reset Demo DB</span>
          </button>

          <Link
            href="/upload"
            onClick={() => playClickSound()}
            className="btn btn-primary btn-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Transmit New File</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '28px'
      }}>
        
        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Active Files
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--blue-700)', marginTop: '2px' }}>
            {activeFiles.length}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-soft)' }}>
            Counting down in memory
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Scrubbed / Expired
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#64748b', marginTop: '2px' }}>
            {expiredFiles.length}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-soft)' }}>
            Zero forensic residue
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Lifetime Downloads
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--blue-700)', marginTop: '2px' }}>
            {totalDownloads}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-soft)' }}>
            Tracked in ledger
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Temporary Storage Footprint
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
            {formatBytes(totalSizeBytes)}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-soft)' }}>
            Expires with TTL
          </div>
        </div>

      </div>

      {/* Files Command Panel */}
      <div className="glass-panel" style={{ padding: '26px', background: '#ffffff', borderRadius: '18px' }}>
        
        {/* Search & Filter Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px'
        }}>
          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => { playClickSound(); setFilter('all'); }}
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            >
              All Records ({files.length})
            </button>
            <button
              onClick={() => { playClickSound(); setFilter('active'); }}
              className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-outline'}`}
            >
              Active ({activeFiles.length})
            </button>
            <button
              onClick={() => { playClickSound(); setFilter('expired'); }}
              className={`btn btn-sm ${filter === 'expired' ? 'btn-primary' : 'btn-outline'}`}
            >
              Expired ({expiredFiles.length})
            </button>
          </div>

          {/* Search Box */}
          <div style={{ minWidth: '220px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search file name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                background: '#ffffff',
                fontSize: '0.84rem',
                outline: 'none',
                color: '#0f172a'
              }}
            />
          </div>

        </div>

        {/* Files List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
            Loading files from server...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            No matching files found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredFiles.map((file) => {
              const isActive = file.status === 'active';
              const fileShareUrl = typeof window !== 'undefined' ? `${window.location.origin}/f/${file.id}` : `http://localhost:3000/f/${file.id}`;

              return (
                <div
                  key={file.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* File Metadata */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '240px', flex: 1 }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--blue-600)',
                      boxShadow: 'var(--shadow-subtle)',
                      flexShrink: 0
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#0f172a', wordBreak: 'break-word' }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '3px' }}>
                        <span>{formatBytes(file.size)}</span>
                        <span>•</span>
                        <span>{file.downloadCount} {file.maxDownloads ? `of ${file.maxDownloads}` : ''} downloads</span>
                        {file.hasPassword && (
                          <>
                            <span>•</span>
                            <span style={{ color: 'var(--blue-700)', fontWeight: 600 }}>Password Protected</span>
                          </>
                        )}
                        {file.isClientEncrypted && (
                          <>
                            <span>•</span>
                            <span style={{ color: '#047857', fontWeight: 600 }}>AES-256 E2EE</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Countdown Clock / Expiry Status */}
                  <div style={{ minWidth: '150px', textAlign: 'center' }}>
                    {isActive ? (
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>
                          Vanishes In:
                        </div>
                        <CountdownClock
                          expiresAt={file.expiresAt}
                          uploadedAt={file.uploadedAt}
                          size="sm"
                        />
                      </div>
                    ) : (
                      <span className="badge badge-soft" style={{ color: '#dc2626' }}>
                        Forensically Scrubbed
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {isActive && (
                      <>
                        <button
                          onClick={() => handleCopyLink(file.id)}
                          className="btn btn-outline btn-sm"
                          title="Copy Shareable Link"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                          <span>Copy</span>
                        </button>

                        <button
                          onClick={() => { playClickSound(); setQrModalFile(file); }}
                          className="btn btn-outline btn-sm"
                          title="Generate QR Code"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                          </svg>
                        </button>

                        <Link
                          href={`/f/${file.id}`}
                          onClick={() => playClickSound()}
                          className="btn btn-outline btn-sm"
                          title="Open Download Portal"
                        >
                          <span>Open</span>
                        </Link>
                      </>
                    )}

                    <button
                      onClick={() => handleDelete(file.id, file.name)}
                      className="btn btn-danger btn-sm"
                      title="Manual Instant Incineration"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      <span>Vanish Now</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* QR Code Modal */}
      {qrModalFile && (
        <QRCodeModal
          isOpen={Boolean(qrModalFile)}
          onClose={() => setQrModalFile(null)}
          url={typeof window !== 'undefined' ? `${window.location.origin}/f/${qrModalFile.id}` : `http://localhost:3000/f/${qrModalFile.id}`}
          fileName={qrModalFile.name}
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
