'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Upload, Trash2, Film, Loader2, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';

interface VideoProofProps {
  habitId: string;
  entryDate: string;
  userId: string | null;
  videoPath: string | null;
  onUploadSuccess: (path: string) => void;
  onDeleteSuccess: () => void;
  accentColor?: string;
}

export default function VideoProof({
  habitId,
  entryDate,
  userId,
  videoPath,
  onUploadSuccess,
  onDeleteSuccess,
  accentColor = 'var(--accent-primary)',
}: VideoProofProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Generate signed URL when videoPath changes
  useEffect(() => {
    setVideoError(false);
    if (!videoPath) {
      setSignedUrl(null);
      setDownloadUrl(null);
      return;
    }

    let active = true;
    const loadUrl = async () => {
      setLoadingUrl(true);
      try {
        const supabase = createClient();
        const [normalRes, dlRes] = await Promise.all([
          supabase.storage.from('habit-videos').createSignedUrl(videoPath, 3600),
          supabase.storage.from('habit-videos').createSignedUrl(videoPath, 3600, { download: 'habit-proof.mp4' })
        ]);

        if (active) {
          if (normalRes.error) {
            console.error('Error creating signed URL:', normalRes.error);
            setSignedUrl(null);
            setDownloadUrl(null);
          } else {
            setSignedUrl(normalRes.data?.signedUrl || null);
            setDownloadUrl(dlRes.data?.signedUrl || null);
          }
        }
      } catch (err) {
        console.error('Error fetching signed URL:', err);
      } finally {
        if (active) setLoadingUrl(false);
      }
    };

    void loadUrl();

    return () => {
      active = false;
    };
  }, [videoPath]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Basic file validation
    if (!file.type.startsWith('video/')) {
      toast('Please select a valid video file.', 'error');
      return;
    }

    // Limit to 50MB for general uploads
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast('Video size must be less than 50MB.', 'error');
      return;
    }

    // Sanitize filename to avoid Next.js request.formData() parser bugs with spaces / non-ASCII/special characters
    const fileExtension = file.name.split('.').pop() || 'mp4';
    const rawBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'video';
    const cleanBaseName = rawBaseName
      .replace(/[^\w\-]+/g, '_')
      .replace(/_+/g, '_');
    const safeFileName = `${cleanBaseName}.${fileExtension}`;
    const sanitizedFile = new File([file], safeFileName, { type: file.type });

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('habit_id', habitId);
      formData.append('entry_date', entryDate);
      formData.append('file', sanitizedFile);

      const res = await fetch('/api/entries/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Failed to upload and transcode video proof');
      }

      const json = await res.json();
      const entry = json.data;

      toast('Video proof converted and uploaded successfully!', 'success');
      onUploadSuccess(entry.video_path);
    } catch (err: any) {
      console.error('[VideoProof upload]', err);
      toast(err.message || 'Failed to upload video proof.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!videoPath) return;

    setUploading(true);
    const supabase = createClient();
    try {
      // 1. Delete from Storage
      const { error: dlErr } = await supabase.storage
        .from('habit-videos')
        .remove([videoPath]);

      // Ignore if file doesn't exist anymore, just proceed to update DB
      if (dlErr) {
        console.warn('Storage file deletion warning:', dlErr);
      }

      // 2. Clear from entry in Database (keep is_completed but clear video_path)
      const res = await fetch('/api/entries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habit_id: habitId,
          entry_date: entryDate,
          video_path: null,
          is_completed: true, // keep it completed even if video is removed
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Failed to clear video path from entry');
      }

      toast('Video proof removed.', 'success');
      onDeleteSuccess();
    } catch (err: any) {
      console.error('[VideoProof delete]', err);
      if (typeof window !== 'undefined') {
        window.alert(`Deletion failed: ${err.message || err}`);
      }
      toast(err.message || 'Failed to delete video proof.', 'error');
    } finally {
      setUploading(false);
    }
  };

  if (!userId) {
    return (
      <div style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Loading session details...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
        Video Proof
      </p>

      {videoPath ? (
        <div
          style={{
            position: 'relative',
            borderRadius: 16,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 10,
          }}
        >
          {loadingUrl ? (
            <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Loader2 size={24} className="animate-spin" style={{ color: accentColor }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading video...</span>
            </div>
          ) : signedUrl ? (
            <>
              {videoError ? (
                <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border-default)', width: '100%' }}>
                  <Film size={24} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', textAlign: 'center', fontWeight: 600 }}>
                    Codec/Format not playable in this browser
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', maxWidth: '90%', lineHeight: 1.4 }}>
                    QuickTime (.mov) videos are not natively supported by Chrome/Edge on Windows. You can download the file to view it, or install FFmpeg on the server for automatic .mp4 conversion.
                  </span>
                </div>
              ) : (
                <video
                  controls
                  playsInline
                  src={signedUrl}
                  onError={() => setVideoError(true)}
                  style={{
                    width: '100%',
                    maxHeight: 240,
                    borderRadius: 12,
                    background: '#000',
                    outline: 'none',
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </>
          ) : (
            <div style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Film size={20} style={{ color: 'var(--danger)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '0 12px' }}>
                Signed URL expired or failed to load.
              </span>
              <button
                type="button"
                onClick={() => setSignedUrl(null)} // Triggers refetch
                style={{
                  background: 'none',
                  border: 'none',
                  color: accentColor,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Retry loading
              </button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '50%' }}>
              {videoPath.split('/').pop()?.replace(/^\d+-/, '')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    textDecoration: 'none',
                    color: accentColor,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: 6,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Download size={13} />
                  Download
                </a>
              )}
              <button
                type="button"
                disabled={uploading}
                onClick={handleDelete}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'transparent',
                border: 'none',
                color: 'var(--danger)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: 6,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Delete
            </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = accentColor;
            e.currentTarget.style.background = 'var(--accent-glow)';
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.background = 'var(--bg-tertiary)';
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.background = 'var(--bg-tertiary)';
            const file = e.dataTransfer?.files?.[0];
            if (file) {
              // Trigger upload
              const inputEl = fileInputRef.current;
              if (inputEl) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                inputEl.files = dataTransfer.files;
                const changeEvent = new Event('change', { bubbles: true });
                inputEl.dispatchEvent(changeEvent);
              }
            }
          }}
          style={{
            border: '1.5px dashed color-mix(in srgb, var(--text-muted) 35%, transparent)',
            borderRadius: 18,
            background: 'var(--bg-tertiary)',
            padding: '22px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: uploading ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!uploading) {
              e.currentTarget.style.borderColor = accentColor;
              e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${accentColor} 6%, var(--bg-tertiary))`;
            }
          }}
          onMouseLeave={(e) => {
            if (!uploading) {
              e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--text-muted) 35%, transparent)';
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            disabled={uploading}
          />

          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Loader2 size={24} className="animate-spin" style={{ color: accentColor }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                Uploading video proof...
              </span>
            </div>
          ) : (
            <>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 9999,
                  background: `color-mix(in srgb, ${accentColor} 14%, transparent)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: accentColor,
                  transition: 'transform 0.2s ease',
                }}
              >
                <Film size={20} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 700 }}>
                  Upload Video Proof
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500 }}>
                  Drag & drop or tap to select (MP4/MOV/WEBM, max 50MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
