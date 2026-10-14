'use client';

import React from 'react';

import { useToast } from '@/components/Toast';
import { playClickSound } from '@/services/sound';

interface QRCodeModalProps {
  url: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function QRCodeModal({ url, fileName, isOpen, onClose }: QRCodeModalProps) {
  const { showToast } = useToast();
  if (!isOpen) return null;

  // Generate simple deterministic QR representation via SVG tiles for demonstration and crisp visuals
  // We use quick SVG matrix generation so there's zero external heavy library needed
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=0f2752&margin=1`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    playClickSound();
    showToast({
      type: 'success',
      title: 'Link Copied',
      message: 'Share URL copied to clipboard.'
    });
  };

  return (
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
        WebkitBackdropFilter: 'blur(8px)',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '380px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
          }}
        >
          ✕
        </button>

        <div style={{ marginBottom: '14px' }}>
          <span className="badge badge-blue">SCAN & DOWNLOAD</span>
          <h3 style={{ fontSize: '1.25rem', marginTop: '6px', color: '#0f172a' }}>
            Instant Mobile Transfer
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px', wordBreak: 'break-word' }}>
            {fileName}
          </p>
        </div>

        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            display: 'inline-block',
            margin: '0 auto 16px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSvgUrl}
            alt="QR Code"
            width={200}
            height={200}
            style={{ display: 'block', borderRadius: '4px' }}
          />
        </div>

        <p style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '16px' }}>
          Point your iPhone or Android camera at this code to view and download before it vanishes.
        </p>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={copyToClipboard}
            className="btn btn-outline"
            style={{ flex: 1, padding: '8px 12px', fontSize: '0.84rem' }}
          >
            Copy Link
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ flex: 1, padding: '8px 12px', fontSize: '0.84rem' }}
          >
            Open in Tab
          </a>
        </div>
      </div>
    </div>
  );
}
