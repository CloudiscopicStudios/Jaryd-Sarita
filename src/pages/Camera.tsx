import { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCcw, ImageIcon, X, Check } from 'lucide-react';
import { googleDriveService } from '@/services/googleDrive';

const MAX_PHOTOS = 25;

const GRAIN_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E";

interface Photo {
  id: string;
  dataUrl: string;
  status: 'pending' | 'uploading' | 'done' | 'failed';
}

type Phase = 'name' | 'camera' | 'finished';

function GrainOverlay({ opacity = 0.07 }: { opacity?: number }) {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-10 animate-grain"
      style={{
        backgroundImage: `url("${GRAIN_URL}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '256px 256px',
        opacity,
      }}
    />
  );
}

function StatusDot({ status }: { status: Photo['status'] }) {
  if (status === 'uploading')
    return <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />;
  if (status === 'done')
    return (
      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
      </div>
    );
  if (status === 'failed')
    return (
      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
        <span className="text-white text-[8px] font-bold leading-none">!</span>
      </div>
    );
  return null;
}

export default function Camera() {
  const [phase, setPhase] = useState<Phase>('name');
  const [guestName, setGuestName] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flash, setFlash] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [shutterAnim, setShutterAnim] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsIOS(ios);
    setIsStandalone(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  // Start (or restart for flip) the camera stream — iOS/Chrome safe
  const startCameraStream = useCallback(async (mode: 'user' | 'environment'): Promise<boolean> => {
    // Camera requires HTTPS everywhere except localhost
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      setCameraError(
        'Camera requires a secure connection.\n\nOpen this page using your Netlify URL (https://...) instead of the local IP address.'
      );
      return false;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        'Your browser does not support camera access.\n\niPhone users: please open this link in Safari, not Chrome.'
      );
      return false;
    }

    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());

    const attempts: MediaStreamConstraints[] = [
      { video: { facingMode: { ideal: mode } }, audio: false },
      { video: { facingMode: mode }, audio: false },
      { video: true, audio: false },
    ];

    let lastErr: any = null;

    for (const constraints of attempts) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        setCameraError(null);
        if (videoRef.current) videoRef.current.srcObject = stream;
        return true;
      } catch (err: any) {
        lastErr = err;
        const name = err?.name ?? '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setCameraError(
            'Camera access was denied.\n\niPhone + Chrome: Chrome on iOS cannot access the camera — please open this page in Safari instead.\n\niPhone + Safari: go to Settings → Safari → Camera and tap "Allow".'
          );
          return false;
        }
        if (name === 'NotFoundError') {
          setCameraError('No camera found on this device.');
          return false;
        }
        if (name === 'NotReadableError') {
          setCameraError('Camera is in use by another app. Close other camera apps and try again.');
          return false;
        }
        // OverconstrainedError / AbortError → try next constraints
      }
    }

    const errName = lastErr?.name ?? 'Unknown';
    const errMsg = lastErr?.message ?? '';
    setCameraError(
      `Could not start camera (${errName}).\n\n${errMsg}\n\nIf you're on iPhone, try opening this page in Safari.`
    );
    return false;
  }, []);

  // "Load Film" — request camera within the user gesture, then trigger install
  const handleLoadFilm = useCallback(async () => {
    if (!guestName.trim() || isLoading) return;
    setIsLoading(true);

    // getUserMedia must be called inside a user gesture handler
    const ok = await startCameraStream(facingMode);
    if (!ok) {
      setIsLoading(false);
      return;
    }

    // Trigger PWA install
    if (installPrompt) {
      // Android — native install dialog fires; non-blocking, we don't await
      installPrompt.prompt();
    } else if (isIOS && !isStandalone) {
      // iOS — show in-camera banner after entering camera phase
      setShowIOSBanner(true);
    }

    setIsLoading(false);
    setPhase('camera');
  }, [guestName, isLoading, facingMode, startCameraStream, installPrompt, isIOS, isStandalone]);

  // Attach stream to video element when camera phase starts
  useEffect(() => {
    if (phase !== 'camera') return;

    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }

    // Wake lock — keep screen on
    (async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch {}
    })();

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [phase]);

  // Flip camera
  const switchCamera = useCallback(async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    await startCameraStream(newMode);
  }, [facingMode, startCameraStream]);

  // Auto-upload
  const autoUpload = useCallback(async (photo: Photo, name: string) => {
    if (!googleDriveService.isConfigured()) return;
    setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, status: 'uploading' } : p));
    try {
      const res = await fetch(photo.dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `photo_${photo.id}.jpg`, { type: 'image/jpeg' });
      await googleDriveService.uploadFile(file, name || 'Guest');
      setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, status: 'done' } : p));
    } catch {
      setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, status: 'failed' } : p));
    }
  }, []);

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || photos.length >= MAX_PHOTOS) return;

    setFlash(true);
    setTimeout(() => setFlash(false), 120);
    setShutterAnim(true);
    setTimeout(() => setShutterAnim(false), 160);
    if ('vibrate' in navigator) navigator.vibrate(40);
    new Audio('/shutter-sound.mp3').play().catch(() => {});

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    const photo: Photo = { id: Date.now().toString(), dataUrl, status: 'pending' };

    setPhotos(prev => {
      const next = [...prev, photo];
      if (next.length >= MAX_PHOTOS) setTimeout(() => setPhase('finished'), 600);
      return next;
    });

    autoUpload(photo, guestName);
  }, [photos.length, guestName, autoUpload]);

  const remaining = MAX_PHOTOS - photos.length;
  const uploading = photos.filter(p => p.status === 'uploading').length;
  const uploaded = photos.filter(p => p.status === 'done').length;

  // ─── Name screen ─────────────────────────────────────────────────────────
  if (phase === 'name') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <GrainOverlay opacity={0.1} />
        <div className="relative z-20 w-full max-w-xs">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-amber-400/40 mb-5">
              <span className="text-3xl">📷</span>
            </div>
            <p className="text-amber-400/70 text-[10px] tracking-[0.35em] uppercase font-mono mb-1">
              Jaryd &amp; Sarita
            </p>
            <h1 className="text-white text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Wedding Camera
            </h1>
            <p className="text-white/30 text-[11px] font-mono mt-2">
              {MAX_PHOTOS} shots · auto upload
            </p>
          </div>

          <div className="mb-5">
            <label className="block text-white/40 text-[10px] font-mono tracking-widest mb-2 uppercase">
              Your name
            </label>
            <input
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLoadFilm()}
              placeholder="e.g. Sarah"
              autoFocus
              className="w-full bg-white/[0.07] border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder-white/20 font-mono text-sm focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-colors"
            />
          </div>

          {/* Camera error shown on name screen */}
          {cameraError && (
            <div className="mb-4 p-4 rounded-xl bg-red-950/60 border border-red-500/30">
              <p className="text-red-300 text-xs font-mono leading-relaxed whitespace-pre-line">
                {cameraError}
              </p>
            </div>
          )}

          <button
            onClick={handleLoadFilm}
            disabled={!guestName.trim() || isLoading}
            className="w-full py-4 rounded-full bg-amber-400 text-black font-mono font-bold text-sm tracking-[0.2em] disabled:opacity-25 disabled:cursor-not-allowed active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                STARTING…
              </>
            ) : (
              'LOAD FILM'
            )}
          </button>

          <p className="text-white/20 text-[10px] font-mono text-center mt-4">
            Camera permission will be requested
          </p>
        </div>
      </div>
    );
  }

  // ─── Finished screen ──────────────────────────────────────────────────────
  if (phase === 'finished') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <GrainOverlay opacity={0.1} />
        <div className="relative z-20 text-center max-w-xs w-full">
          <div className="text-5xl mb-6">🎞️</div>
          <h2 className="text-white text-2xl mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Film's done!
          </h2>
          <p className="text-white/40 text-xs font-mono mb-8">
            {uploading > 0
              ? `Uploading ${uploading} photo${uploading !== 1 ? 's' : ''}…`
              : `${uploaded} of ${MAX_PHOTOS} shots in the album`}
          </p>

          <div className="flex gap-1 justify-center mb-8 overflow-hidden px-2">
            {photos.slice(0, 9).map(photo => (
              <div
                key={photo.id}
                className="relative flex-shrink-0 rounded overflow-hidden bg-white/10"
                style={{ width: 40, height: 56 }}
              >
                <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-1 right-1">
                  <StatusDot status={photo.status} />
                </div>
              </div>
            ))}
          </div>

          <p className="text-white/20 text-[10px] font-mono mb-8 tracking-wide">
            YOUR SHOTS WILL APPEAR IN THE WEDDING GALLERY
          </p>
          <a href="/" className="text-amber-400/60 text-[11px] font-mono tracking-widest hover:text-amber-400 transition-colors">
            ← BACK TO WEDDING SITE
          </a>
        </div>
      </div>
    );
  }

  // ─── Camera viewfinder ────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none">
      {flash && <div className="absolute inset-0 bg-white z-50 pointer-events-none" />}

      <div
        className="absolute inset-0 pointer-events-none z-10 animate-grain"
        style={{
          backgroundImage: `url("${GRAIN_URL}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
          opacity: 0.07,
        }}
      />

      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera error (rare — shown over viewfinder) */}
      {cameraError && (
        <div className="absolute inset-0 z-30 bg-[#0a0a0a] flex flex-col items-center justify-center p-8 text-center">
          <GrainOverlay opacity={0.1} />
          <span className="text-4xl mb-4">📷</span>
          <p className="text-white/50 font-mono text-sm mb-2 whitespace-pre-line">{cameraError}</p>
          <button onClick={() => { setCameraError(null); setPhase('name'); }} className="text-amber-400 text-xs font-mono mt-4 tracking-widest">
            ← GO BACK
          </button>
        </div>
      )}

      {/* iOS Add-to-Home-Screen banner */}
      {showIOSBanner && (
        <div className="absolute bottom-36 left-4 right-4 z-40 bg-[#1c1c1e]/95 border border-white/15 rounded-2xl p-4 backdrop-blur-md">
          <button onClick={() => setShowIOSBanner(false)} className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/10">
            <X className="w-3.5 h-3.5 text-white/60" />
          </button>
          <p className="text-white text-sm font-semibold mb-1">Add to Home Screen</p>
          <p className="text-white/50 text-xs font-mono leading-relaxed">
            Tap the <span className="text-white/80">⎙ Share</span> button at the bottom of Safari → scroll down → tap <span className="text-white/80">"Add to Home Screen"</span>
          </p>
          <p className="text-white/30 text-[10px] font-mono mt-2">
            Quick access from your lock screen
          </p>
        </div>
      )}

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 px-5 pt-12 pb-6 bg-gradient-to-b from-black/75 to-transparent">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-amber-400/80 text-[9px] font-mono tracking-[0.3em] uppercase mb-1.5">
              {guestName}
            </p>
            <div className="flex flex-wrap gap-1" style={{ maxWidth: 140 }}>
              {Array.from({ length: MAX_PHOTOS }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-colors duration-200 ${i < photos.length ? 'bg-amber-400' : 'bg-white/20'}`}
                  style={{ width: 5, height: 5 }}
                />
              ))}
            </div>
          </div>
          <div className="text-right">
            <span className="text-amber-400 font-mono font-bold text-xl leading-none">{remaining}</span>
            <span className="text-white/30 font-mono text-xs"> left</span>
          </div>
        </div>
      </div>

      {/* Gallery overlay */}
      {showGallery && (
        <div className="absolute inset-0 z-40 bg-black/96 overflow-y-auto overscroll-contain">
          <div className="p-4 pt-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Your shots</h2>
              <button onClick={() => setShowGallery(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            {photos.length === 0 ? (
              <p className="text-white/30 font-mono text-xs text-center py-16">No shots yet</p>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {photos.map(photo => (
                  <div key={photo.id} className="relative bg-white/5 rounded overflow-hidden" style={{ aspectRatio: '1' }}>
                    <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute bottom-1 right-1"><StatusDot status={photo.status} /></div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-white/20 text-[10px] font-mono text-center mt-4">Photos upload automatically</p>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-10 pt-20 px-8 bg-gradient-to-t from-black/80 to-transparent">
        {uploading > 0 && (
          <p className="text-center text-white/30 text-[9px] font-mono tracking-widest mb-3">UPLOADING {uploading}…</p>
        )}
        {remaining <= 3 && remaining > 0 && (
          <p className="text-center text-amber-400/80 text-[10px] font-mono mb-3">
            {remaining} shot{remaining !== 1 ? 's' : ''} left
          </p>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowGallery(true)}
            className="w-12 h-12 rounded-xl bg-white/10 overflow-hidden border border-white/15 flex items-center justify-center"
          >
            {photos.length > 0 ? (
              <img src={photos[photos.length - 1].dataUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-5 h-5 text-white/30" />
            )}
          </button>

          <button
            onClick={takePhoto}
            disabled={remaining <= 0}
            className={`w-20 h-20 rounded-full border-4 border-white/80 flex items-center justify-center transition-transform disabled:opacity-20 ${shutterAnim ? 'scale-90' : 'active:scale-90'}`}
          >
            <div className="w-[60px] h-[60px] rounded-full bg-white" />
          </button>

          <button
            onClick={switchCamera}
            className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center"
          >
            <RotateCcw className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
