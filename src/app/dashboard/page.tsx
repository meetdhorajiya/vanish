'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileRecord, UserSession } from '@/types';
import { fetchFiles, deleteFileApi, resetDatabaseApi, getCurrentUser } from '@/services/storage';
import CountdownClock from '@/components/CountdownClock';

export default function DashboardPage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [user, setUser] = useState<UserSession | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await fetchFiles();
      setFiles(data);
      setUser(getCurrentUser());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleVanishNow = async (id: string) => {
    await deleteFileApi(id);
    setDeleteConfirmId(null);
    await loadData();
  };

  const handleReset = async () => {
    await resetDatabaseApi();
    await loadData();
  };

  const handleCopy = (id: string) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/f/${id}` : `http://localhost:3000/f/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const activeFiles = files.filter((f) => f.status === 'active');
  const expiredFiles = files.filter((f) => f.status === 'expired' || f.status === 'exhausted');
  const totalDownloads = files.reduce((acc, f) => acc + f.downloadCount, 0);
  const totalSizeBytes = files.reduce((acc, f) => acc + f.size, 0);

  const filteredFiles = files.filter((f) => {
    if (filter === 'active') return f.status === 'active';
    if (filter === 'expired') return f.status !== 'active';
    return true;
  });

  return (
    <div style={{ padding: '36px 0 80px' }}>
      
      {/* Header section */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '28px'
      }}>
        <div>
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
              Personal File Management
            </span>
          </div>

          <h1 style={{ fontSize: '2.3rem', lineHeight: 1.2, color: 'var(--text-primary)' }}>
            Control Center and <span className="blue-text">Analytics</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Logged in as <strong>{user?.name || 'Vanish User'}</strong> ({user?.email || 'user@vanish.dev'})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleReset}
            className="btn btn-outline btn-sm"
          >
            <span>Restore Sample Files</span>
          </button>
          <Link href="/upload" className="btn btn-primary btn-sm">
            <span>+ Upload New File</span>
          </Link>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
        marginBottom: '28px'
      }}>
        
        <div className="glass-panel" style={{ padding: '18px', background: '#ffffff' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600 }}>
            Active Ephemeral Files
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--blue-600)', marginTop: '2px' }}>
            {activeFiles.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            Currently ticking down
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', background: '#ffffff' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600 }}>
            Vanished / Expunged
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-secondary)', marginTop: '2px' }}>
            {expiredFiles.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-light)' }}>
            Deleted from storage
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', background: '#ffffff' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Downloads Served
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--blue-700)', marginTop: '2px' }}>
            {totalDownloads}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            Across all active files
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', background: '#ffffff' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600 }}>
            Storage Stored
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            {formatFileSize(totalSizeBytes)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            Temporary footprint
          </div>
        </div>

      </div>

      {/* Files Table / List */}
      <div className="glass-panel" style={{ padding: '22px', background: '#ffffff' }}>
        
        {/* Filter bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '14px'
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setFilter('all')}
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            >
              All Files ({files.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-outline'}`}
            >
              Active ({activeFiles.length})
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`btn btn-sm ${filter === 'expired' ? 'btn-primary' : 'btn-outline'}`}
            >
              Expired / Vanished ({expiredFiles.length})
            </button>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
            TTL auto-cleanup running in background
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-light)' }}>
            Loading files from server...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-light)' }}>
            No files found in this view.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredFiles.map((file) => {
              const isActive = file.status === 'active';
              return (
                <div
                  key={file.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#fcfcfd',
                    border: '1px solid var(--border-subtle)',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  {/* File Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px', flex: 1 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-blue-tint)',
                      border: '1px solid var(--border-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--blue-600)',
                      boxShadow: 'var(--shadow-xs)'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                    </div>

                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                        <span>{formatFileSize(file.size)}</span>
                        <span>/</span>
                        <span>{file.downloadCount} {file.maxDownloads ? `of ${file.maxDownloads}` : ''} downloads</span>
                        {file.hasPassword && (
                          <>
                            <span>/</span>
                            <span style={{ color: 'var(--blue-700)', fontWeight: 600 }}>Password Protected</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Countdown Ticker */}
                  <div style={{ minWidth: '150px' }}>
                    {isActive ? (
                      <CountdownClock
                        expiresAt={file.expiresAt}
                        uploadedAt={file.uploadedAt}
                        showBar={false}
                        onExpire={loadData}
                      />
                    ) : (
                      <span className="badge badge-soft">
                        Vanished From Cloud
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Link
                      href={`/f/${file.id}`}
                      className="btn btn-outline btn-sm"
                      title="Open recipient view"
                    >
                      <span>Preview</span>
                    </Link>

                    <button
                      onClick={() => handleCopy(file.id)}
                      className="btn btn-outline btn-sm"
                      title="Copy share link"
                    >
                      {copiedId === file.id ? 'Copied' : 'Link'}
                    </button>

                    {deleteConfirmId === file.id ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleVanishNow(file.id)}
                          className="btn btn-sm btn-primary"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="btn btn-sm btn-outline"
                          style={{ padding: '4px 6px', fontSize: '0.7rem' }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(file.id)}
                        className="btn btn-sm btn-outline"
                        style={{ color: 'var(--text-muted)' }}
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

    </div>
  );
}
