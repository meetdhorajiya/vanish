'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { FileRecord, UserSession, AccessLog } from '@/types';
import { getStoredFiles, deleteFileImmediately, getCurrentUser, resetDemoDatabase, subscribeToStore } from '@/services/storage';
import { formatBytes } from '@/services/crypto';
import { playClickSound, playBurnSound } from '@/services/sound';
import { useToast } from '@/components/Toast';
import CountdownClock from '@/components/CountdownClock';
import QRCodeModal from '@/components/QRCodeModal';

export default function DashboardPage() {
  const { showToast } = useToast();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<UserSession | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Modals
  const [qrTarget, setQrTarget] = useState<{ url: string; name: string } | null>(null);
  const [auditTarget, setAuditTarget] = useState<FileRecord | null>(null);

  const [, startTransition] = useTransition();

  const loadData = () => {
    startTransition(() => {
      setFiles(getStoredFiles());
      setUser(getCurrentUser());
    });
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToStore(loadData);
    const interval = setInterval(loadData, 4000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleVanishNow = (id: string, name: string) => {
    playBurnSound();
    deleteFileImmediately(id);
    setDeleteConfirmId(null);
    loadData();
    showToast({
      type: 'info',
      title: 'File Incinerated',
      message: `${name} has been scrubbed from cloud servers.`
    });
  };

  const handleCopy = (id: string) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/f/${id}` : `http://localhost:3000/f/${id}`;
    navigator.clipboard.writeText(url);
    playClickSound();
    showToast({
      type: 'success',
      title: 'Link Copied',
      message: 'Share link copied to clipboard.'
    });
  };

  const handleReset = () => {
    playBurnSound();
    resetDemoDatabase();
    loadData();
    showToast({
      type: 'success',
      title: 'Database Reset',
      message: 'Demo seed files and countdown timers refreshed.'
    });
  };

  const activeFiles = files.filter((f) => f.status === 'active');
  const expiredFiles = files.filter((f) => f.status !== 'active');
  const totalDownloads = files.reduce((acc, f) => acc + f.downloadCount, 0);
  const totalSizeBytes = files.reduce((acc, f) => acc + f.size, 0);

  const filteredFiles = files.filter((f) => {
    if (filter === 'active' && f.status !== 'active') return false;
    if (filter === 'expired' && f.status === 'active') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.id.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ padding: '36px 0 90px' }}>
      
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div>
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
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--blue-700)' }}>
              PERSONAL CLOUD COMMAND CENTER
            </span>
          </div>

          <h1 style={{ fontSize: '2.5rem', lineHeight: 1.15, color: '#0f172a' }}>
            Control Center & <span className="blue-text">Audit Ledger</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem' }}>
            Active session: <strong>{user?.name || 'Meet Dhorajiya'}</strong> ({user?.email || 'meet@iiitv.ac.in'}) • IIIT Vadodara
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleReset}
            className="btn btn-outline btn-sm"
          >
            <span>Reset Demo Data</span>
          </button>
          <Link
            href="/upload"
            onClick={() => playClickSound()}
            className="btn btn-primary btn-sm"
          >
            <span>+ Upload & Vanish</span>
          </Link>
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '32px'
      }}>
        
        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Active Ephemeral Files
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--blue-600)', marginTop: '2px' }}>
            {activeFiles.length}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-soft)' }}>
            Currently ticking down
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Vanished / Expunged
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
            {expiredFiles.length}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#16a34a', fontWeight: 600 }}>
            Physically scrubbed
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Cumulative Downloads
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
          gap: '12px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '16px'
        }}>
          
          {/* Status Filters */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => { playClickSound(); setFilter('all'); }}
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            >
              All Files ({files.length})
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
              Vanished ({expiredFiles.length})
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
        {filteredFiles.length === 0 ? (
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
                        {file.sha256 && (
                          <>
                            <span>•</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                              SHA: {file.sha256.substring(0, 8)}...
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live Countdown Clock */}
                  <div style={{ minWidth: '160px' }}>
                    {isActive ? (
                      <CountdownClock
                        expiresAt={file.expiresAt}
                        uploadedAt={file.uploadedAt}
                        showBar={false}
                        onExpire={loadData}
                      />
                    ) : (
                      <span className="badge badge-soft">
                        Vanished from Cloud
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    
                    <Link
                      href={`/f/${file.id}`}
                      onClick={() => playClickSound()}
                      className="btn btn-outline btn-sm"
                      title="Open recipient download page"
                    >
                      <span>Preview</span>
                    </Link>

                    <button
                      onClick={() => handleCopy(file.id)}
                      className="btn btn-outline btn-sm"
                      title="Copy share link"
                    >
                      <span>Link</span>
                    </button>

                    <button
                      onClick={() => { playClickSound(); setQrTarget({ url: fileShareUrl, name: file.name }); }}
                      className="btn btn-outline btn-sm"
                      title="Scan QR Code on mobile"
                    >
                      <span>QR</span>
                    </button>

                    <button
                      onClick={() => { playClickSound(); setAuditTarget(file); }}
                      className="btn btn-outline btn-sm"
                      title="View Access Audit Logs"
                    >
                      <span>Logs ({file.accessLogs.length})</span>
                    </button>

                    {deleteConfirmId === file.id ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleVanishNow(file.id, file.name)}
                          className="btn btn-sm btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="btn btn-sm btn-outline"
                          style={{ padding: '4px 6px', fontSize: '0.72rem' }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { playClickSound(); setDeleteConfirmId(file.id); }}
                        className="btn btn-sm btn-outline"
                        style={{ color: 'var(--rose-600)' }}
                        title="Immediately incinerate from cloud"
                      >
                        Vanish Now
                      </button>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* QR Code Modal */}
      {qrTarget && (
        <QRCodeModal
          url={qrTarget.url}
          fileName={qrTarget.name}
          isOpen={true}
          onClose={() => setQrTarget(null)}
        />
      )}

      {/* Audit Log Modal */}
      {auditTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(8, 26, 54, 0.75)',
            backdropFilter: 'blur(8px)',
            padding: '20px'
          }}
          onClick={() => setAuditTarget(null)}
        >
          <div
            className="glass-panel"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-elevated)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <span className="badge badge-blue">Security Ledger</span>
                <h3 style={{ fontSize: '1.25rem', marginTop: '4px', color: '#0f172a' }}>
                  Access Audit Trail
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {auditTarget.name} ({auditTarget.id})
                </div>
              </div>
              <button
                onClick={() => setAuditTarget(null)}
                className="btn btn-outline btn-sm"
              >
                ✕ Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {auditTarget.accessLogs.map((log: AccessLog) => (
                <div
                  key={log.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: log.action === 'downloaded' ? '#2563eb' : log.action === 'expired' ? '#dc2626' : '#16a34a'
                    }}>
                      {log.action}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div style={{ color: '#334155', fontSize: '0.76rem' }}>
                    {log.clientSnippet}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    <span>{log.location}</span>
                    <span>{log.ipHash}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
