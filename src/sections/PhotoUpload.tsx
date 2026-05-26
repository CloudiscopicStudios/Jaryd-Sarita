import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { Upload, X, User, ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { googleDriveService } from '@/services/googleDrive';
import { api } from '@/services/api';

// ── Rose corner decoration ────────────────────────────────────────────────────
const RoseCorner = ({
  className,
  flipX = false,
  flipY = false,
}: {
  className?: string;
  flipX?: boolean;
  flipY?: boolean;
}) => (
  <svg
    viewBox="0 0 220 250"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{
      transform: [flipX && 'scaleX(-1)', flipY && 'scaleY(-1)'].filter(Boolean).join(' ') || undefined,
    }}
    aria-hidden="true"
  >
    {/* ── Large background leaves ── */}
    <path d="M95 148 Q52 130 40 158 Q28 186 68 188 Q98 188 95 148Z" fill="#2D6040" opacity="0.92"/>
    <path d="M93 148 Q75 134 73 150" stroke="#1A4030" strokeWidth="0.9" fill="none"/>
    <path d="M115 146 Q158 128 170 156 Q182 184 142 186 Q112 186 115 146Z" fill="#347848" opacity="0.90"/>
    <path d="M117 146 Q135 132 138 148" stroke="#1A4030" strokeWidth="0.9" fill="none"/>

    {/* ── Berry stems (right side) ── */}
    <path d="M148 95 Q165 78 174 66" stroke="#2D6040" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    <circle cx="174" cy="65" r="6" fill="#8B1520"/>
    <circle cx="172" cy="63" r="2.5" fill="#A82030" opacity="0.6"/>
    <path d="M152 108 Q168 93 178 83" stroke="#2D6040" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <circle cx="178" cy="82" r="5" fill="#9B2030"/>
    <path d="M154 120 Q168 108 176 100" stroke="#2D6040" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    <circle cx="176" cy="99" r="4.5" fill="#8B1520"/>
    <path d="M155 132 Q167 122 173 115" stroke="#2D6040" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
    <circle cx="173" cy="114" r="4" fill="#9B2030"/>

    {/* ── Small rose bud (left) ── */}
    <path d="M42 115 Q33 101 44 94 Q53 88 56 101 Q58 115 44 118Z" fill="#8B1520"/>
    <path d="M39 117 Q31 108 34 98" stroke="#2D6040" strokeWidth="1.2" fill="none"/>
    <path d="M44 118 Q30 133 34 150 Q38 163 50 156 Q60 148 44 118Z" fill="#347848" opacity="0.88"/>
    <path d="M42 124 Q33 136 36 148" stroke="#1A4030" strokeWidth="0.8" fill="none"/>
    {/* small leaf on bud */}
    <path d="M52 105 Q62 96 68 104 Q70 112 58 112Z" fill="#2D6040" opacity="0.85"/>

    {/* ── Main rose ── */}
    {/* Outermost 5 petals */}
    <path d="M105 110 Q86 76 106 64 Q122 54 126 78 Q128 96 105 110Z" fill="#8B1520" opacity="0.88"/>
    <path d="M105 110 Q132 85 152 95 Q168 106 155 126 Q142 142 122 126Z" fill="#8B1520" opacity="0.86"/>
    <path d="M105 110 Q136 130 130 154 Q124 172 106 168 Q88 164 90 142Z" fill="#911822" opacity="0.88"/>
    <path d="M105 110 Q78 138 64 130 Q50 120 58 100 Q66 82 88 92Z" fill="#8B1520" opacity="0.86"/>
    <path d="M105 110 Q74 88 80 66 Q86 48 104 54 Q118 60 114 84Z" fill="#911822" opacity="0.85"/>

    {/* Middle 5 petals */}
    <path d="M105 110 Q92 84 108 76 Q122 70 124 88 Q125 102 105 110Z" fill="#A82030" opacity="0.93"/>
    <path d="M105 110 Q124 90 140 102 Q150 115 138 128 Q126 138 116 122Z" fill="#A82030" opacity="0.92"/>
    <path d="M105 110 Q124 128 118 146 Q112 160 98 156 Q84 152 88 136Z" fill="#AA2232" opacity="0.93"/>
    <path d="M105 110 Q88 132 75 122 Q64 112 72 97 Q80 83 96 94Z" fill="#A82030" opacity="0.92"/>
    <path d="M105 110 Q82 94 88 77 Q94 62 108 66 Q120 72 116 90Z" fill="#AA2232" opacity="0.90"/>

    {/* Inner 3 petals */}
    <path d="M105 110 Q100 90 112 86 Q122 84 122 97 Q122 108 105 110Z" fill="#C02840" opacity="0.97"/>
    <path d="M105 110 Q120 102 126 114 Q130 125 118 131 Q107 137 105 123Z" fill="#C02840" opacity="0.97"/>
    <path d="M105 110 Q98 126 87 122 Q78 116 82 104 Q86 93 98 100Z" fill="#C02840" opacity="0.97"/>

    {/* Centre */}
    <ellipse cx="105" cy="110" rx="13" ry="12" fill="#D03050"/>
    <ellipse cx="105" cy="109" rx="7" ry="6.5" fill="#E04060"/>
    <circle cx="104" cy="108" r="3" fill="#EE5070" opacity="0.75"/>
  </svg>
);

// ── Decorative divider ────────────────────────────────────────────────────────
const HeartDivider = ({ wide = false }: { wide?: boolean }) => (
  <div className={`flex items-center gap-3 ${wide ? 'w-52' : 'w-36'}`}>
    <span className="flex-1 h-px bg-[#8B1520]/30" />
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
      <path d="M7 11 C7 11 1 7 1 3.5 C1 1.5 2.5 0.5 4 0.5 C5.5 0.5 7 2 7 2 C7 2 8.5 0.5 10 0.5 C11.5 0.5 13 1.5 13 3.5 C13 7 7 11 7 11Z" fill="#8B1520" opacity="0.6"/>
    </svg>
    <span className="flex-1 h-px bg-[#8B1520]/30" />
  </div>
);

// ── Types ────────────────────────────────────────────────────────────────────
interface UploadedPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  guestName: string;
  timestamp: Date;
  name: string;
}

// ── Component ────────────────────────────────────────────────────────────────
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

  // Drive check
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
    const els = [topRef.current, loveRef.current, midRef.current, botRef.current].filter(Boolean);
    gsap.set(els, { opacity: 0, y: 22 });
    const tl = gsap.timeline({ delay: 0.2 });
    tl.to(els, { opacity: 1, y: 0, stagger: 0.15, duration: 0.9, ease: 'power2.out' });
    return () => { tl.kill(); };
  }, []);

  // Upload handlers
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

  return (
    <section
      id="photo-upload"
      ref={sectionRef}
      className="relative w-full min-h-screen overflow-hidden flex items-center justify-center"
      style={{ background: '#F5EFE4' }}
    >
      {/* Subtle parchment texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse at 30% 20%, rgba(200,168,107,0.08) 0%, transparent 55%),
                            radial-gradient(ellipse at 70% 80%, rgba(139,21,32,0.05) 0%, transparent 50%)`,
        }}
      />

      {/* ── Corner roses ── */}
      <RoseCorner className="absolute -top-4 -left-6 w-[200px] sm:w-[240px] opacity-95 pointer-events-none" />
      <RoseCorner className="absolute -top-4 -right-6 w-[200px] sm:w-[240px] opacity-95 pointer-events-none" flipX />
      <RoseCorner className="absolute -bottom-4 -left-6 w-[180px] sm:w-[220px] opacity-90 pointer-events-none" flipY />
      <RoseCorner className="absolute -bottom-4 -right-6 w-[180px] sm:w-[220px] opacity-90 pointer-events-none" flipX flipY />

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 py-16 sm:py-20 max-w-sm sm:max-w-md mx-auto w-full">

        {/* Top block: divider + monogram + divider */}
        <div ref={topRef} className="flex flex-col items-center gap-3 mb-6">
          <HeartDivider wide />

          {/* Monogram */}
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className="font-serif italic leading-none"
              style={{ fontSize: 'clamp(42px, 10vw, 58px)', color: '#2D5A3D' }}
            >
              J
            </span>
            <svg width="18" height="22" viewBox="0 0 18 22" className="mx-0.5 mb-1">
              <path d="M2 20 C2 20 16 18 16 6 C16 2 13 1 11 2 C9 3 9 6 9 6 C9 6 9 3 7 2 C5 1 2 2 2 6 C2 10 5 14 9 20Z" fill="none" stroke="#8B1520" strokeWidth="1.2" opacity="0.7"/>
            </svg>
            <span
              className="font-serif italic leading-none"
              style={{ fontSize: 'clamp(42px, 10vw, 58px)', color: '#2D5A3D' }}
            >
              S
            </span>
          </div>

          <HeartDivider wide />
        </div>

        {/* "SHARE THE" */}
        <p
          className="font-sans tracking-[0.32em] uppercase mb-1"
          style={{ fontSize: 'clamp(11px, 2.2vw, 15px)', color: '#2D5A3D', letterSpacing: '0.32em' }}
        >
          Share the
        </p>

        {/* "love" — large script */}
        <h1
          ref={loveRef}
          className="font-script leading-none"
          style={{
            fontSize: 'clamp(90px, 22vw, 150px)',
            color: '#8B1520',
            textShadow: '1px 2px 8px rgba(139,21,32,0.12)',
          }}
        >
          love
        </h1>

        {/* Middle block: subtitle + button */}
        <div ref={midRef} className="flex flex-col items-center gap-6 mt-2">
          <p
            className="font-sans tracking-[0.18em] uppercase leading-relaxed"
            style={{ fontSize: 'clamp(9px, 1.8vw, 12px)', color: '#4A3A30', maxWidth: '240px' }}
          >
            Upload your photos &amp; help us capture every beautiful moment
          </p>

          {/* Upload button */}
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
            <p className="font-sans text-xs" style={{ color: 'rgba(74,58,48,0.45)' }}>
              Photo uploads will be available soon.
            </p>
          )}

          {/* Recently uploaded */}
          {photos.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase" style={{ color: 'rgba(74,58,48,0.5)' }}>
                Recently Shared
              </p>
              <div className="flex gap-2">
                {photos.slice(0, 5).map(p => (
                  <div key={p.id} className="w-11 h-11 rounded-lg overflow-hidden ring-1 ring-[#8B1520]/20 shadow-sm">
                    <img src={p.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom block: divider + signature */}
        <div ref={botRef} className="flex flex-col items-center gap-3 mt-8">
          <HeartDivider wide />
          <p
            className="font-script"
            style={{ fontSize: 'clamp(24px, 5.5vw, 34px)', color: '#8B1520', opacity: 0.85 }}
          >
            Jaryd &amp; Sarita's Love Story
          </p>
          {/* Gold rings decoration */}
          <svg width="44" height="18" viewBox="0 0 44 18" fill="none" className="opacity-70">
            <circle cx="14" cy="9" r="7.5" stroke="#C8A86B" strokeWidth="1.5"/>
            <circle cx="30" cy="9" r="7.5" stroke="#C8A86B" strokeWidth="1.5"/>
            <path d="M21.5 5.5 Q22 9 22.5 12.5" stroke="#C8A86B" strokeWidth="1" opacity="0.5"/>
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
            <div className="flex flex-col items-center gap-1 mb-1">
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
            {/* Status */}
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

            {/* Name */}
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
                  background: 'rgba(255,255,255,0.8)',
                  border: '1px solid rgba(139,21,32,0.18)',
                  color: '#3A2A22',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,21,32,0.45)'; }}
                onBlur={e =>  { e.currentTarget.style.borderColor = 'rgba(139,21,32,0.18)'; }}
              />
            </div>

            {/* File select */}
            <div>
              <label
                className="flex items-center gap-1.5 font-sans text-xs tracking-wide mb-2"
                style={{ color: 'rgba(74,58,48,0.65)' }}
              >
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

            {/* Preview */}
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

            {/* Upload button */}
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
