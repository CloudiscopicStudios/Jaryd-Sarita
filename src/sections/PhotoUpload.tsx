import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { Upload, X, User, ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { googleDriveService } from '@/services/googleDrive';
import { api } from '@/services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Rose corner SVG — multi-layer petals, realistic leaves, berries, secondary bud
// Each corner gets a unique ID suffix so SVG defs don't clash.
// ─────────────────────────────────────────────────────────────────────────────
const RoseCorner = ({
  className,
  flipX = false,
  flipY = false,
}: {
  className?: string;
  flipX?: boolean;
  flipY?: boolean;
}) => {
  // Unique ID prefix so gradients/filters don't bleed between the 4 instances
  const p = `${flipX ? 'r' : 'l'}${flipY ? 'b' : 't'}`;

  return (
    <svg
      viewBox="0 0 300 330"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        transform: [flipX && 'scaleX(-1)', flipY && 'scaleY(-1)']
          .filter(Boolean)
          .join(' ') || undefined,
      }}
      aria-hidden="true"
    >
      <defs>
        {/* ── Petal gradients ── */}
        {/* Back petals — very dark */}
        <radialGradient id={`pa-${p}`} cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#7A0E18" />
          <stop offset="100%" stopColor="#4A0810" />
        </radialGradient>
        {/* Outer petals — rich crimson */}
        <radialGradient id={`pb-${p}`} cx="45%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#C82030" />
          <stop offset="55%" stopColor="#9A1520" />
          <stop offset="100%" stopColor="#660C14" />
        </radialGradient>
        {/* Middle petals — brighter */}
        <radialGradient id={`pc-${p}`} cx="42%" cy="25%" r="68%">
          <stop offset="0%" stopColor="#E03050" />
          <stop offset="50%" stopColor="#B81E30" />
          <stop offset="100%" stopColor="#7E1020" />
        </radialGradient>
        {/* Inner petals — lightest */}
        <radialGradient id={`pd-${p}`} cx="38%" cy="22%" r="64%">
          <stop offset="0%" stopColor="#F84060" />
          <stop offset="55%" stopColor="#CC2840" />
          <stop offset="100%" stopColor="#8C1828" />
        </radialGradient>
        {/* ── Leaf gradients ── */}
        <linearGradient id={`la-${p}`} x1="8%" y1="5%" x2="88%" y2="95%">
          <stop offset="0%" stopColor="#508855" />
          <stop offset="100%" stopColor="#1A3E1E" />
        </linearGradient>
        <linearGradient id={`lb-${p}`} x1="92%" y1="5%" x2="12%" y2="95%">
          <stop offset="0%" stopColor="#468050" />
          <stop offset="100%" stopColor="#163418" />
        </linearGradient>
        <linearGradient id={`lc-${p}`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#3E7848" />
          <stop offset="100%" stopColor="#1C3E20" />
        </linearGradient>
        {/* ── Watercolour displacement filter ── */}
        <filter id={`wc-${p}`} x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.032 0.028"
            numOctaves="4"
            seed={flipX ? 11 : 3}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="2.8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        {/* Softer blur for leaves */}
        <filter id={`sf-${p}`} x="-4%" y="-4%" width="108%" height="108%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
      </defs>

      {/* ══════════════════════════════════════════
          LEAVES (drawn first — behind everything)
         ══════════════════════════════════════════ */}

      {/* ── Left large leaf ── */}
      <g filter={`url(#sf-${p})`}>
        <path
          fill={`url(#la-${p})`}
          opacity="0.95"
          d="M 116,202
             C 92,210 60,222 38,238
             C 18,252 12,268 22,278
             C 32,287 50,280 68,268
             C 88,254 108,228 116,202 Z"
        />
        {/* Central vein */}
        <path
          d="M 116,202 Q 66,242 24,276"
          stroke="#1A3E1E" strokeWidth="1.2" fill="none" opacity="0.45"
        />
        {/* Lateral veins */}
        <path d="M 94,215 Q 80,226 76,240" stroke="#1A3E1E" strokeWidth="0.7" fill="none" opacity="0.35"/>
        <path d="M 70,228 Q 56,238 52,250" stroke="#1A3E1E" strokeWidth="0.6" fill="none" opacity="0.30"/>
        <path d="M 50,244 Q 38,252 36,263" stroke="#1A3E1E" strokeWidth="0.55" fill="none" opacity="0.28"/>
      </g>

      {/* ── Right large leaf ── */}
      <g filter={`url(#sf-${p})`}>
        <path
          fill={`url(#lb-${p})`}
          opacity="0.95"
          d="M 148,202
             C 172,210 204,222 226,238
             C 246,252 252,268 242,278
             C 232,287 214,280 196,268
             C 176,254 156,228 148,202 Z"
        />
        <path
          d="M 148,202 Q 198,242 240,276"
          stroke="#163418" strokeWidth="1.2" fill="none" opacity="0.45"
        />
        <path d="M 170,215 Q 184,226 188,240" stroke="#163418" strokeWidth="0.7" fill="none" opacity="0.35"/>
        <path d="M 194,228 Q 208,238 212,250" stroke="#163418" strokeWidth="0.6" fill="none" opacity="0.30"/>
        <path d="M 214,244 Q 226,252 228,263" stroke="#163418" strokeWidth="0.55" fill="none" opacity="0.28"/>
      </g>

      {/* ── Third smaller leaflet (centre-bottom) ── */}
      <g filter={`url(#sf-${p})`}>
        <path
          fill={`url(#lc-${p})`}
          opacity="0.88"
          d="M 132,218
             C 118,228 106,244 108,258
             C 110,270 122,274 132,268
             C 142,274 154,270 156,258
             C 158,244 146,228 132,218 Z"
        />
        <path
          d="M 132,218 Q 132,248 132,268"
          stroke="#1C3E20" strokeWidth="1" fill="none" opacity="0.35"
        />
      </g>

      {/* ══════════════════════════════════════════
          BERRY STEMS (right side)
         ══════════════════════════════════════════ */}
      <g>
        {/* Stem 1 */}
        <path d="M 196,128 Q 222,110 244,96"
          stroke="#2D6438" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
        <circle cx="244" cy="95" r="8" fill="#8C1422"/>
        <circle cx="242" cy="93" r="3.5" fill="#C83448" opacity="0.55"/>
        {/* Stem 2 */}
        <path d="M 200,144 Q 224,128 246,116"
          stroke="#327040" strokeWidth="2.1" fill="none" strokeLinecap="round"/>
        <circle cx="247" cy="115" r="7" fill="#9A1828"/>
        <circle cx="245" cy="113" r="3" fill="#C03045" opacity="0.50"/>
        {/* Stem 3 */}
        <path d="M 202,160 Q 224,148 242,138"
          stroke="#2D6438" strokeWidth="1.9" fill="none" strokeLinecap="round"/>
        <circle cx="243" cy="137" r="6.5" fill="#8C1422"/>
        <circle cx="241" cy="135" r="2.8" fill="#BE2E42" opacity="0.48"/>
        {/* Stem 4 */}
        <path d="M 202,175 Q 220,165 236,156"
          stroke="#327040" strokeWidth="1.7" fill="none" strokeLinecap="round"/>
        <circle cx="237" cy="155" r="6" fill="#9A1828"/>
        {/* Small leaf near berries */}
        <path fill="#2D6438" opacity="0.82"
          d="M 204,148 Q 218,138 222,150 Q 226,162 210,162 Z"/>
        <path fill="#327040" opacity="0.78"
          d="M 208,162 Q 222,155 226,167 Q 228,178 212,176 Z"/>
      </g>

      {/* ══════════════════════════════════════════
          SECONDARY BUD (left)
         ══════════════════════════════════════════ */}
      <g filter={`url(#wc-${p})`}>
        {/* Bud leaf */}
        <path fill="#2D6438" opacity="0.90"
          d="M 56,172
             Q 38,158 32,138
             Q 26,118 40,106
             Q 54,96 66,108
             Q 76,120 70,148
             Q 64,162 56,172 Z"/>
        <path d="M 56,172 Q 46,148 38,118" stroke="#1A3E1E" strokeWidth="1" fill="none" opacity="0.4"/>
        {/* Bud sepal */}
        <path fill="#2D6438" opacity="0.80"
          d="M 54,170 Q 44,180 48,192 Q 52,200 62,196 Q 70,190 60,170 Z"/>
        <path fill="#1E5028" opacity="0.65"
          d="M 64,170 Q 74,182 70,194 Q 64,202 56,198 Q 50,192 60,170 Z"/>
        {/* Bud back petal */}
        <path fill="#7A0E18" opacity="0.88"
          d="M 60,168
             Q 46,150 46,130
             Q 46,110 60,104
             Q 74,100 80,116
             Q 84,132 74,154
             Q 68,164 60,168 Z"/>
        {/* Bud front petal */}
        <path fill="#B81E30" opacity="0.86"
          d="M 60,168
             Q 74,158 80,140
             Q 84,122 76,110
             Q 66,100 58,108
             Q 52,118 56,144
             Q 58,158 60,168 Z"/>
        {/* Bud highlight */}
        <path fill="#D83050" opacity="0.70"
          d="M 61,122 Q 68,116 74,122 Q 76,130 68,134 Q 60,136 61,122 Z"/>
      </g>

      {/* ══════════════════════════════════════════
          MAIN ROSE  (centre ≈ 132, 142)
         ══════════════════════════════════════════ */}

      {/* ── Back guard petals (darkest, outermost layer) ── */}
      <g filter={`url(#wc-${p})`} fill={`url(#pa-${p})`} opacity="0.85">
        {/* Back upper-left */}
        <path d="M 132,142 C 100,128 84,106 90,78 C 96,54 118,50 132,64 C 138,72 136,110 132,142 Z"/>
        {/* Back upper-right */}
        <path d="M 132,142 C 164,128 180,106 174,78 C 168,54 146,50 132,64 C 126,72 128,110 132,142 Z"/>
        {/* Back lower */}
        <path d="M 132,142 C 152,178 158,204 142,218 C 126,230 106,222 104,202 C 102,184 118,162 132,142 Z"/>
        {/* Back left */}
        <path d="M 132,142 C 98,152 74,142 66,120 C 58,96 70,76 90,74 C 106,72 122,90 128,114 Z"/>
        {/* Back right */}
        <path d="M 132,142 C 166,152 190,142 198,120 C 206,96 194,76 174,74 C 158,72 142,90 136,114 Z"/>
      </g>

      {/* ── Outer petals (5) ── */}
      <g filter={`url(#wc-${p})`} opacity="0.93">
        {/* Top outer */}
        <path fill={`url(#pb-${p})`}
          d="M 132,142 C 108,122 104,94 132,78 C 160,94 156,122 132,142 Z"/>
        {/* Upper-right outer */}
        <path fill="#9A1520"
          d="M 132,142 C 158,130 172,108 164,84 C 156,64 136,64 126,80 C 120,94 126,122 132,142 Z"/>
        {/* Lower-right outer */}
        <path fill="#921822"
          d="M 132,142 C 158,158 166,182 154,198 C 142,212 122,208 118,190 C 114,172 122,156 132,142 Z"/>
        {/* Lower-left outer */}
        <path fill="#9A1520"
          d="M 132,142 C 106,158 98,182 110,198 C 122,212 142,208 146,190 C 150,172 142,156 132,142 Z"/>
        {/* Upper-left outer */}
        <path fill="#921822"
          d="M 132,142 C 106,130 92,108 100,84 C 108,64 128,64 138,80 C 144,94 138,122 132,142 Z"/>
      </g>

      {/* ── Middle petals (5) ── */}
      <g filter={`url(#wc-${p})`} opacity="0.95">
        {/* Top middle */}
        <path fill={`url(#pc-${p})`}
          d="M 132,142 C 114,128 112,108 132,100 C 152,108 150,128 132,142 Z"/>
        {/* Upper-right middle */}
        <path fill="#AC2032"
          d="M 132,142 C 152,132 164,114 156,98 C 148,84 132,86 126,100 C 120,112 126,130 132,142 Z"/>
        {/* Lower-right middle */}
        <path fill="#A81E30"
          d="M 132,142 C 150,154 156,174 146,186 C 136,196 120,192 116,178 C 112,164 122,150 132,142 Z"/>
        {/* Lower-left middle */}
        <path fill="#AC2032"
          d="M 132,142 C 114,154 108,174 118,186 C 128,196 144,192 148,178 C 152,164 142,150 132,142 Z"/>
        {/* Upper-left middle */}
        <path fill="#A81E30"
          d="M 132,142 C 112,132 100,114 108,98 C 116,84 132,86 138,100 C 144,112 138,130 132,142 Z"/>
      </g>

      {/* ── Inner petals (3) ── */}
      <g filter={`url(#wc-${p})`} opacity="0.97">
        {/* Top inner */}
        <path fill={`url(#pd-${p})`}
          d="M 132,142 C 120,134 118,120 132,114 C 146,120 144,134 132,142 Z"/>
        {/* Inner right */}
        <path fill="#CC2842"
          d="M 132,142 C 146,136 152,122 144,112 C 136,104 122,108 120,120 C 118,130 126,140 132,142 Z"/>
        {/* Inner left */}
        <path fill="#CC2842"
          d="M 132,142 C 118,136 112,122 120,112 C 128,104 142,108 144,120 C 146,130 138,140 132,142 Z"/>
      </g>

      {/* ── Rose centre ── */}
      <ellipse cx="132" cy="136" rx="13" ry="12" fill="#DC3858"/>
      <ellipse cx="131" cy="135" rx="7.5" ry="7" fill="#EE4C70"/>
      <circle cx="130" cy="134" r="4.2" fill="#FF5E78" opacity="0.85"/>
      <circle cx="133" cy="133" r="2.6" fill="#FF7090" opacity="0.72"/>
      <circle cx="130" cy="131" r="1.6" fill="#FF88A0" opacity="0.60"/>
    </svg>
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

      {/* ── Corner roses ── */}
      <RoseCorner className="absolute -top-6 -left-8 w-[200px] sm:w-[260px] md:w-[300px] pointer-events-none" />
      <RoseCorner className="absolute -top-6 -right-8 w-[200px] sm:w-[260px] md:w-[300px] pointer-events-none" flipX />
      <RoseCorner className="absolute -bottom-6 -left-8 w-[180px] sm:w-[230px] md:w-[270px] pointer-events-none" flipY />
      <RoseCorner className="absolute -bottom-6 -right-8 w-[180px] sm:w-[230px] md:w-[270px] pointer-events-none" flipX flipY />

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
