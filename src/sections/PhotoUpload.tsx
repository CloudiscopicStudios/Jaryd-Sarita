import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { Upload, X, User, ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { googleDriveService } from '@/services/googleDrive';
import { api } from '@/services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Rose corner — CSS-crops a region from the real hand-drawn roses.svg file.
// Rose bounding box in the 5000×4985.43 SVG canvas: (1673,2274)→(2749,3570)
// ─────────────────────────────────────────────────────────────────────────────
const RoseCorner = ({
  className,
  size = 260,
  flipX = false,
  flipY = false,
}: {
  className?: string;
  size?: number;
  flipX?: boolean;
  flipY?: boolean;
}) => {
  // Natural dimensions of the rose region within the SVG
  const roseNatW = 1076;   // 2749 - 1673
  const roseNatH = 1296;   // 3570 - 2274
  const scale    = size / roseNatW;

  const svgW    = Math.round(5000    * scale);  // rendered width of the full SVG
  const svgH    = Math.round(4985.43 * scale);  // rendered height of the full SVG
  const offsetX = Math.round(1673    * scale);  // how far left to shift img
  const offsetY = Math.round(2274    * scale);  // how far up to shift img
  const roseH   = Math.round(roseNatH * scale); // visible crop height

  const transform = [
    flipX && 'scaleX(-1)',
    flipY && 'scaleY(-1)',
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div
      className={className}
      style={{ width: size, height: roseH, overflow: 'hidden', transform }}
    >
      <img
        src={`${import.meta.env.BASE_URL}images/roses.svg`}
        alt=""
        aria-hidden="true"
        style={{
          width: svgW,
          height: svgH,
          marginLeft: -offsetX,
          marginTop: -offsetY,
          display: 'block',
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Heart divider
// ─────────────────────────────────────────────────────────────────────────────
const HeartDivider = ({ wide = false }: { wide?: boolean }) => (
  <div className={`flex items-center gap-3 ${wide ? 'w-56' : 'w-36'}`}>
    <span className="flex-1 h-px bg-[#8B1520]/30" />
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
      <path
        d="M7 11C7 11 1 7 1 3.5C1 1.5 2.5.5 4 .5 5.5.5 7 2 7 2 7 2 8.5.5 10 .5 11.5.5 13 1.5 13 3.5 13 7 7 11 7 11Z"
        fill="#8B1520" opacity="0.6"
      />
    </svg>
    <span className="flex-1 h-px bg-[#8B1520]/30" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface UploadedPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  guestName: string;
  timestamp: Date;
  name: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function PhotoUpload() {
  const sectionRef   = useRef<HTMLElement>(null);
  const topRef       = useRef<HTMLDivElement>(null);
  const loveRef      = useRef<HTMLHeadingElement>(null);
  const midRef       = useRef<HTMLDivElement>(null);
  const botRef       = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    const els = [topRef.current, loveRef.current, midRef.current, botRef.current].filter(Boolean);
    gsap.set(els, { opacity: 0, y: 20 });
    const tl = gsap.timeline({ delay: 0.2 });
    tl.to(els, { opacity: 1, y: 0, stagger: 0.14, duration: 0.9, ease: 'power2.out' });
    return () => { tl.kill(); };
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 20);
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
      if (!tokenData.folderId) throw new Error('Google Drive is not configured yet.');
      googleDriveService.setConfig({
        accessToken: tokenData.access_token,
        folderId: tokenData.folderId,
        expiresAt: Date.now() + (tokenData.expires_in ?? 3600) * 1000,
      });
      const uploaded: UploadedPhoto[] = [];
      for (const file of selectedFiles) {
        const r = await googleDriveService.uploadFile(file, guestName.trim());
        uploaded.push({
          id: r.id,
          url: googleDriveService.getImageUrl(r.id),
          thumbnailUrl: googleDriveService.getThumbnailUrl(r.id, 200),
          guestName: guestName.trim(),
          timestamp: new Date(),
          name: r.name,
        });
      }
      setPhotos(prev => [...uploaded, ...prev]);
      setUploadStatus({
        type: 'success',
        message: `${uploaded.length} photo${uploaded.length !== 1 ? 's' : ''} uploaded!`,
      });
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

  return (
    <section
      id="photo-upload"
      ref={sectionRef}
      className="relative w-full min-h-screen overflow-hidden flex items-center justify-center"
      style={{ background: '#F5EFE4' }}
    >
      {/* Subtle parchment tint */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 28% 22%, rgba(200,168,107,0.07) 0%, transparent 52%),
            radial-gradient(ellipse at 72% 78%, rgba(139,21,32,0.05) 0%, transparent 48%)
          `,
        }}
      />

      {/* ── Corner roses (cropped from roses.svg) ── */}
      <RoseCorner className="absolute -top-6 -left-8 pointer-events-none" size={260} />
      <RoseCorner className="absolute -top-6 -right-8 pointer-events-none" size={260} flipX />
      <RoseCorner className="absolute -bottom-6 -left-8 pointer-events-none" size={230} flipY />
      <RoseCorner className="absolute -bottom-6 -right-8 pointer-events-none" size={230} flipX flipY />

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 py-16 sm:py-20 max-w-sm sm:max-w-md mx-auto w-full">

        {/* Top: divider + monogram + divider */}
        <div ref={topRef} className="flex flex-col items-center gap-3 mb-6">
          <HeartDivider wide />

          {/* Monogram */}
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className="font-serif italic leading-none select-none"
              style={{ fontSize: 'clamp(44px, 10vw, 60px)', color: '#2D5A3D' }}
            >
              J
            </span>
            {/* intertwined heart motif between initials */}
            <svg width="20" height="26" viewBox="0 0 20 26" className="mx-0.5 mb-1.5" fill="none">
              <path
                d="M3 22C3 22 17 20 17 8C17 4 14 2 12 3C10 4 10 8 10 8C10 8 10 4 8 3C6 2 3 4 3 8C3 12 6 16 10 22Z"
                stroke="#8B1520" strokeWidth="1.2" opacity="0.65"
              />
            </svg>
            <span
              className="font-serif italic leading-none select-none"
              style={{ fontSize: 'clamp(44px, 10vw, 60px)', color: '#2D5A3D' }}
            >
              S
            </span>
          </div>

          <HeartDivider wide />
        </div>

        {/* SHARE THE */}
        <p
          className="font-sans uppercase tracking-[0.34em]"
          style={{ fontSize: 'clamp(11px, 2.2vw, 14px)', color: '#2D5A3D' }}
        >
          Share the
        </p>

        {/* love — large script */}
        <h1
          ref={loveRef}
          className="font-script leading-none"
          style={{
            fontSize: 'clamp(88px, 22vw, 148px)',
            color: '#8B1520',
            textShadow: '1px 3px 10px rgba(139,21,32,0.14)',
          }}
        >
          love
        </h1>

        {/* Subtitle + button */}
        <div ref={midRef} className="flex flex-col items-center gap-5 mt-1">
          <p
            className="font-sans uppercase tracking-[0.18em] leading-relaxed"
            style={{ fontSize: 'clamp(9px, 1.8vw, 11px)', color: '#4A3A30', maxWidth: '230px' }}
          >
            Upload your photos &amp; help us capture every beautiful moment
          </p>

          <button
            onClick={() => setIsDialogOpen(true)}
            className="group inline-flex items-center gap-2.5 rounded-full font-sans font-medium text-white transition-all duration-300 hover:scale-[1.04] hover:shadow-xl active:scale-[0.97]"
            style={{
              padding: '13px 34px',
              fontSize: '13px',
              letterSpacing: '0.06em',
              background: 'linear-gradient(135deg, #9B2030 0%, #7A1420 100%)',
              boxShadow: '0 4px 20px rgba(139,21,32,0.28)',
            }}
          >
            <Upload className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
            Upload Photos
          </button>

          {!isDriveConfigured && (
            <p className="font-sans text-xs" style={{ color: 'rgba(74,58,48,0.42)' }}>
              Photo uploads will be available soon.
            </p>
          )}

          {photos.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <p
                className="font-sans text-[10px] tracking-[0.2em] uppercase"
                style={{ color: 'rgba(74,58,48,0.5)' }}
              >
                Recently Shared
              </p>
              <div className="flex gap-2">
                {photos.slice(0, 5).map(ph => (
                  <div key={ph.id} className="w-11 h-11 rounded-lg overflow-hidden ring-1 ring-[#8B1520]/20 shadow-sm">
                    <img src={ph.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom: divider + signature + rings */}
        <div ref={botRef} className="flex flex-col items-center gap-3 mt-8">
          <HeartDivider wide />
          <p
            className="font-script"
            style={{ fontSize: 'clamp(24px, 5.5vw, 34px)', color: '#8B1520', opacity: 0.85 }}
          >
            Jaryd &amp; Sarita's Love Story
          </p>
          {/* Wedding rings */}
          <svg width="44" height="18" viewBox="0 0 44 18" fill="none" className="opacity-65">
            <circle cx="14" cy="9" r="7.5" stroke="#C8A86B" strokeWidth="1.5"/>
            <circle cx="30" cy="9" r="7.5" stroke="#C8A86B" strokeWidth="1.5"/>
            <path d="M21.5 5.5Q22 9 22.5 12.5" stroke="#C8A86B" strokeWidth="1" opacity="0.5"/>
          </svg>
        </div>
      </div>

      {/* ── Upload Dialog ── */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={open => { setIsDialogOpen(open); if (!open) clearDialog(); }}
      >
        <DialogContent
          className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl"
          style={{
            background: '#FAF6EF',
            border: '1px solid rgba(139,21,32,0.15)',
            boxShadow: '0 30px 80px rgba(74,58,48,0.20)',
          }}
        >
          <DialogHeader>
            <div className="flex flex-col items-center gap-1.5 mb-1">
              <HeartDivider />
              <DialogTitle
                className="font-script text-center"
                style={{ fontSize: '32px', color: '#8B1520', lineHeight: 1.2 }}
              >
                Share Your Photos
              </DialogTitle>
              <HeartDivider />
            </div>
          </DialogHeader>

          <div className="space-y-5 py-3">
            {uploadStatus.type && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-sm font-sans border ${
                uploadStatus.type === 'success'
                  ? 'bg-green-50 text-green-800 border-green-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {uploadStatus.type === 'success'
                  ? <CheckCircle className="w-4 h-4 shrink-0" />
                  : <AlertCircle className="w-4 h-4 shrink-0" />}
                {uploadStatus.message}
              </div>
            )}

            <div>
              <label
                className="flex items-center gap-1.5 font-sans text-xs tracking-wide mb-2"
                style={{ color: 'rgba(74,58,48,0.65)' }}
              >
                <User className="w-3.5 h-3.5" />
                Your Name
              </label>
              <input
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-xl text-sm font-sans outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  border: '1px solid rgba(139,21,32,0.18)',
                  color: '#3A2A22',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,21,32,0.45)'; }}
                onBlur={e =>  { e.currentTarget.style.borderColor = 'rgba(139,21,32,0.18)'; }}
              />
            </div>

            <div>
              <label
                className="flex items-center gap-1.5 font-sans text-xs tracking-wide mb-2"
                style={{ color: 'rgba(74,58,48,0.65)' }}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Select Photos (max 20)
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
                  background: isDriveConfigured ? 'rgba(139,21,32,0.08)' : 'rgba(74,58,48,0.05)',
                  border: `1px solid ${isDriveConfigured ? 'rgba(139,21,32,0.25)' : 'rgba(74,58,48,0.12)'}`,
                  color: isDriveConfigured ? '#8B1520' : 'rgba(74,58,48,0.4)',
                }}
              >
                <Upload className="w-4 h-4" />
                {isDriveConfigured ? 'Choose Photos' : 'Uploads unavailable'}
              </button>
              {isDriveConfigured && (
                <p className="mt-2 text-xs font-sans" style={{ color: 'rgba(74,58,48,0.45)' }}>
                  Up to 5 images from your device.
                </p>
              )}
            </div>

            {previewUrls.length > 0 && (
              <div>
                <p className="font-sans text-xs mb-2" style={{ color: 'rgba(74,58,48,0.5)' }}>
                  Selected ({previewUrls.length})
                </p>
                <div className="flex gap-2 flex-wrap max-h-36 overflow-y-auto">
                  {previewUrls.map((url, i) => (
                    <div key={i} className="relative w-16 h-16">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                      <button
                        onClick={() => removeFile(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white"
                        style={{ background: '#8B1520' }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!guestName.trim() || selectedFiles.length === 0 || isUploading || !isDriveConfigured}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-sans font-medium text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #9B2030 0%, #7A1420 100%)',
                boxShadow: '0 4px 16px rgba(139,21,32,0.20)',
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
