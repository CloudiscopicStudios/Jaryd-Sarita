import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { Upload, X, User, ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { googleDriveService } from '@/services/googleDrive';
import { api } from '@/services/api';

interface UploadedPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  guestName: string;
  timestamp: Date;
  name: string;
}

export default function PhotoUpload() {
  const sectionRef    = useRef<HTMLElement>(null);
  const cardRef       = useRef<HTMLDivElement>(null);
  const eyebrowRef    = useRef<HTMLSpanElement>(null);
  const headlineRef   = useRef<HTMLHeadingElement>(null);
  const bodyRef       = useRef<HTMLParagraphElement>(null);
  const btnWrapRef    = useRef<HTMLDivElement>(null);
  const fileInputRef  = useRef<HTMLInputElement | null>(null);

  const [photos, setPhotos]               = useState<UploadedPhoto[]>([]);
  const [isDialogOpen, setIsDialogOpen]   = useState(false);
  const [guestName, setGuestName]         = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls]     = useState<string[]>([]);
  const [isUploading, setIsUploading]     = useState(false);
  const [isDriveConfigured, setIsDriveConfigured] = useState(false);
  const [uploadStatus, setUploadStatus]   = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Check if Drive is configured
  useEffect(() => {
    api.getToken()
      .then(data => {
        if (data.folderId) {
          googleDriveService.setConfig({
            accessToken: data.access_token,
            folderId: data.folderId,
            expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
          });
          setIsDriveConfigured(true);
        }
      })
      .catch(() => setIsDriveConfigured(false));
  }, []);

  // Entrance animation
  useEffect(() => {
    const card     = cardRef.current;
    const eyebrow  = eyebrowRef.current;
    const headline = headlineRef.current;
    const body     = bodyRef.current;
    const btn      = btnWrapRef.current;
    if (!card) return;

    gsap.set(card,     { opacity: 0, y: 40, scale: 0.96 });
    gsap.set([eyebrow, headline, body, btn].filter(Boolean), { opacity: 0, y: 18 });

    const tl = gsap.timeline({ delay: 0.25 });
    tl.to(card, { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'power3.out' })
      .to([eyebrow, headline, body, btn].filter(Boolean), {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power2.out',
      }, '-=0.7');

    return () => { tl.kill(); };
  }, []);

  // ── Upload logic ──────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    if (!files.length) return;
    setSelectedFiles(files);
    setPreviewUrls(files.map(f => URL.createObjectURL(f)));
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleUpload = useCallback(async () => {
    if (!guestName.trim() || selectedFiles.length === 0) return;
    setIsUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      const tokenData = await api.getToken();
      if (!tokenData.folderId) throw new Error('Google Drive is not configured yet. Please ask the couple to set it up.');
      googleDriveService.setConfig({
        accessToken: tokenData.access_token,
        folderId: tokenData.folderId,
        expiresAt: Date.now() + (tokenData.expires_in ?? 3600) * 1000,
      });

      const uploaded: UploadedPhoto[] = [];
      for (const file of selectedFiles) {
        const result = await googleDriveService.uploadFile(file, guestName.trim());
        uploaded.push({
          id: result.id,
          url: googleDriveService.getImageUrl(result.id),
          thumbnailUrl: googleDriveService.getThumbnailUrl(result.id, 200),
          guestName: guestName.trim(),
          timestamp: new Date(),
          name: result.name,
        });
      }

      setPhotos(prev => [...uploaded, ...prev]);
      setUploadStatus({ type: 'success', message: `${uploaded.length} photo${uploaded.length !== 1 ? 's' : ''} uploaded!` });

      setTimeout(() => {
        setIsDialogOpen(false);
        setGuestName('');
        setSelectedFiles([]);
        previewUrls.forEach(u => URL.revokeObjectURL(u));
        setPreviewUrls([]);
        setUploadStatus({ type: null, message: '' });
      }, 2000);
    } catch (err: any) {
      setUploadStatus({ type: 'error', message: err.message || 'Upload failed. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  }, [guestName, selectedFiles, previewUrls]);

  const clearDialog = useCallback(() => {
    setGuestName('');
    setSelectedFiles([]);
    previewUrls.forEach(u => URL.revokeObjectURL(u));
    setPreviewUrls([]);
    setUploadStatus({ type: null, message: '' });
  }, [previewUrls]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section
      id="photo-upload"
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden"
    >
      {/* ── Background photo + overlay ──────────────────────────────────── */}
      <div className="absolute inset-0">
        <img
          src="/images/hero_couple.jpg"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
        />
        {/* Deep warm-dark gradient over the photo */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, rgba(20,13,10,0.78) 0%, rgba(40,22,14,0.72) 50%, rgba(20,13,10,0.82) 100%)',
          }}
        />
      </div>

      {/* ── Ambient glow orbs ───────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[15%] left-[10%] w-[480px] h-[480px] rounded-full opacity-[0.12] animate-breathe"
          style={{ background: 'radial-gradient(circle, #D8A7B4 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
        <div
          className="absolute bottom-[10%] right-[8%] w-[420px] h-[420px] rounded-full opacity-[0.10] animate-breathe"
          style={{ background: 'radial-gradient(circle, #A8C4A0 0%, transparent 70%)', filter: 'blur(40px)', animationDelay: '4s' }}
        />
        <div
          className="absolute top-[55%] left-[55%] w-[300px] h-[300px] rounded-full opacity-[0.08] animate-breathe"
          style={{ background: 'radial-gradient(circle, #D8A7B4 0%, transparent 70%)', filter: 'blur(30px)', animationDelay: '8s' }}
        />
      </div>

      {/* ── Floating leaf motifs ─────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* top-left cluster */}
        <svg className="absolute top-[12%] left-[6%] w-14 h-14 opacity-20 animate-float" style={{ animationDelay: '0s' }} viewBox="0 0 100 100">
          <path d="M50 5 C30 20,10 40,10 60 C10 80,30 95,50 95 C70 95,90 80,90 60 C90 40,70 20,50 5Z" fill="#D8A7B4"/>
        </svg>
        <svg className="absolute top-[20%] left-[3%] w-8 h-8 opacity-15 animate-float" style={{ animationDelay: '1.5s' }} viewBox="0 0 100 100">
          <path d="M50 5 C30 20,10 40,10 60 C10 80,30 95,50 95 C70 95,90 80,90 60 C90 40,70 20,50 5Z" fill="#A8C4A0"/>
        </svg>
        {/* top-right cluster */}
        <svg className="absolute top-[8%] right-[7%] w-12 h-12 opacity-20 animate-float" style={{ animationDelay: '2s' }} viewBox="0 0 100 100">
          <path d="M50 5 C30 20,10 40,10 60 C10 80,30 95,50 95 C70 95,90 80,90 60 C90 40,70 20,50 5Z" fill="#A8C4A0"/>
        </svg>
        <svg className="absolute top-[18%] right-[3%] w-7 h-7 opacity-15 animate-float" style={{ animationDelay: '0.8s' }} viewBox="0 0 100 100">
          <path d="M50 5 C30 20,10 40,10 60 C10 80,30 95,50 95 C70 95,90 80,90 60 C90 40,70 20,50 5Z" fill="#D8A7B4"/>
        </svg>
        {/* bottom clusters */}
        <svg className="absolute bottom-[18%] left-[8%] w-10 h-10 opacity-20 animate-float" style={{ animationDelay: '3s' }} viewBox="0 0 100 100">
          <path d="M50 5 C30 20,10 40,10 60 C10 80,30 95,50 95 C70 95,90 80,90 60 C90 40,70 20,50 5Z" fill="#D8A7B4"/>
        </svg>
        <svg className="absolute bottom-[10%] right-[10%] w-12 h-12 opacity-15 animate-float" style={{ animationDelay: '1.2s' }} viewBox="0 0 100 100">
          <path d="M50 5 C30 20,10 40,10 60 C10 80,30 95,50 95 C70 95,90 80,90 60 C90 40,70 20,50 5Z" fill="#A8C4A0"/>
        </svg>
      </div>

      {/* ── Central glass card ───────────────────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div
          ref={cardRef}
          className="relative w-full max-w-md rounded-[2rem] px-8 py-10 sm:px-12 sm:py-12 text-center"
          style={{
            background: 'rgba(255, 255, 255, 0.07)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255, 255, 255, 0.13)',
            boxShadow: '0 40px 90px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          {/* Eyebrow */}
          <span
            ref={eyebrowRef}
            className="inline-flex items-center gap-3 font-sans text-[10px] tracking-[0.28em] uppercase mb-7"
            style={{ color: 'rgba(216,167,180,0.85)' }}
          >
            <span className="block w-8 h-px" style={{ background: 'rgba(216,167,180,0.5)' }} />
            30 May 2026
            <span className="block w-8 h-px" style={{ background: 'rgba(216,167,180,0.5)' }} />
          </span>

          {/* Headline */}
          <h1
            ref={headlineRef}
            className="font-serif text-white leading-[1.0] mb-5"
            style={{ fontSize: 'clamp(38px, 7vw, 62px)' }}
          >
            Share Your<br />Moments
          </h1>

          {/* Body */}
          <p
            ref={bodyRef}
            className="font-sans text-sm sm:text-base leading-relaxed mb-9 mx-auto max-w-[280px]"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Upload your favourite photos from the day and help us remember every beautiful moment.
          </p>

          {/* CTA button */}
          <div ref={btnWrapRef}>
            <button
              onClick={() => setIsDialogOpen(true)}
              className="group inline-flex items-center gap-3 rounded-full font-sans text-sm font-medium text-white transition-all duration-300 hover:scale-[1.04] hover:shadow-2xl active:scale-[0.98]"
              style={{
                padding: '14px 36px',
                background: 'linear-gradient(135deg, rgba(216,167,180,0.95) 0%, rgba(196,140,158,0.90) 100%)',
                boxShadow: '0 6px 28px rgba(216,167,180,0.35)',
              }}
            >
              <Upload className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
              Upload Photos
            </button>

            {!isDriveConfigured && (
              <p className="mt-5 font-sans text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
                Photo uploads will be available soon.
              </p>
            )}
          </div>

          {/* Recently uploaded strip */}
          {photos.length > 0 && (
            <div className="mt-9 pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
              <p className="font-sans text-[10px] tracking-[0.22em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Recently Shared
              </p>
              <div className="flex justify-center gap-2">
                {photos.slice(0, 5).map(photo => (
                  <div
                    key={photo.id}
                    className="w-12 h-12 rounded-xl overflow-hidden"
                    style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.15)' }}
                  >
                    <img
                      src={photo.thumbnailUrl}
                      alt={`Photo by ${photo.guestName}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom signature ─────────────────────────────────────────────── */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2">
        <p className="font-serif text-sm italic" style={{ color: 'rgba(255,255,255,0.22)' }}>
          Jaryd <span style={{ color: 'rgba(216,167,180,0.5)' }}>&</span> Sarita
        </p>
      </div>

      {/* ── Upload Dialog ────────────────────────────────────────────────── */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={open => { setIsDialogOpen(open); if (!open) clearDialog(); }}
      >
        <DialogContent
          className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border-0"
          style={{
            background: 'rgba(20, 13, 10, 0.97)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(216,167,180,0.18)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-center" style={{ color: 'rgba(255,255,255,0.92)' }}>
              Share Your Photos
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Status */}
            {uploadStatus.type && (
              <div className={`p-3 rounded-2xl flex items-center gap-2 text-sm font-sans ${
                uploadStatus.type === 'success'
                  ? 'bg-green-900/40 text-green-300 border border-green-700/40'
                  : 'bg-red-900/40 text-red-300 border border-red-700/40'
              }`}>
                {uploadStatus.type === 'success'
                  ? <CheckCircle className="w-4 h-4 shrink-0" />
                  : <AlertCircle className="w-4 h-4 shrink-0" />}
                {uploadStatus.message}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="flex items-center gap-1.5 font-sans text-xs tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.50)' }}>
                <User className="w-3.5 h-3.5" />
                Your Name
              </label>
              <input
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-xl text-sm font-sans outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.90)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(216,167,180,0.50)'; e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
                onBlur={e =>  { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              />
            </div>

            {/* File select */}
            <div>
              <label className="flex items-center gap-1.5 font-sans text-xs tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.50)' }}>
                <ImageIcon className="w-3.5 h-3.5" />
                Select Photos (max 5)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={!isDriveConfigured}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isDriveConfigured}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-sans font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: isDriveConfigured ? 'rgba(216,167,180,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isDriveConfigured ? 'rgba(216,167,180,0.35)' : 'rgba(255,255,255,0.10)'}`,
                  color: isDriveConfigured ? 'rgba(216,167,180,0.95)' : 'rgba(255,255,255,0.35)',
                }}
              >
                <Upload className="w-4 h-4" />
                {isDriveConfigured ? 'Choose Photos' : 'Uploads unavailable'}
              </button>
              {isDriveConfigured && (
                <p className="mt-2 text-xs font-sans" style={{ color: 'rgba(255,255,255,0.30)' }}>
                  Up to 5 images from your device.
                </p>
              )}
            </div>

            {/* Preview */}
            {previewUrls.length > 0 && (
              <div>
                <p className="font-sans text-xs mb-2" style={{ color: 'rgba(255,255,255,0.40)' }}>
                  Selected ({previewUrls.length})
                </p>
                <div className="flex gap-2 flex-wrap max-h-36 overflow-y-auto">
                  {previewUrls.map((url, i) => (
                    <div key={i} className="relative w-16 h-16">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                      <button
                        onClick={() => removeFile(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white transition-colors"
                        style={{ background: 'rgba(216,167,180,0.9)' }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={!guestName.trim() || selectedFiles.length === 0 || isUploading || !isDriveConfigured}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-sans font-medium text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, rgba(216,167,180,0.95) 0%, rgba(196,140,158,0.90) 100%)',
                boxShadow: '0 4px 20px rgba(216,167,180,0.25)',
              }}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
