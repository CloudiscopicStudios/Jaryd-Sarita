import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleOAuthProvider, useGoogleLogin, googleLogout } from '@react-oauth/google';
import {
  Folder, CheckCircle, AlertCircle, LogOut, Image,
  RefreshCw, ExternalLink, Trash2, Copy, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { googleDriveService, type UploadResult } from '@/services/googleDrive';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

// ─── Inner content (needs to be inside GoogleOAuthProvider) ──────────────────
function AdminContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [folderId, setFolderId] = useState<string>('');
  const [folderName, setFolderName] = useState('Jaryd & Sarita Wedding Photos');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [files, setFiles] = useState<UploadResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<'ok' | 'refreshing' | 'expired'>('ok');
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  };

  const saveToken = useCallback((tokenResponse: any, existingFolderId?: string) => {
    const token = tokenResponse.access_token;
    const expiresIn = tokenResponse.expires_in ?? 3600; // seconds
    const expiresAt = Date.now() + expiresIn * 1000;
    const config = googleDriveService.getConfig();
    googleDriveService.setConfig({
      accessToken: token,
      folderId: existingFolderId ?? config?.folderId ?? null,
      expiresAt,
      userEmail: tokenResponse.email,
    });
    setIsAuthenticated(true);
    setTokenStatus('ok');

    // Schedule a silent refresh 5 min before expiry
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const delay = Math.max((expiresIn - 300) * 1000, 0);
    refreshTimerRef.current = setTimeout(() => silentLogin(), delay);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Silent re-auth — no popup, uses existing Google session
  const silentLogin = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.file',
    prompt: 'none',
    onSuccess: (tokenResponse) => {
      saveToken(tokenResponse);
      setTokenStatus('ok');
    },
    onError: () => {
      // Silent failed — user's Google session expired, need manual login
      setTokenStatus('expired');
      setIsAuthenticated(false);
    },
  });

  // Full login with consent popup
  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.file',
    onSuccess: (tokenResponse) => {
      saveToken(tokenResponse, folderId || undefined);
      showMessage('success', 'Connected to Google Drive!');
      const config = googleDriveService.getConfig();
      if (config?.folderId) { setFolderId(config.folderId); loadFiles(); }
    },
    onError: () => showMessage('error', 'Login failed. Please try again.'),
  });

  // On mount: restore session or attempt silent re-auth
  useEffect(() => {
    const config = googleDriveService.getConfig();
    if (!config?.accessToken) return;

    if (config.folderId) setFolderId(config.folderId);

    if (googleDriveService.needsRefresh()) {
      // Token expired or expiring — try silent refresh
      setTokenStatus('refreshing');
      silentLogin();
    } else {
      setIsAuthenticated(true);
      if (config.folderId) loadFiles();

      // Schedule refresh for when it will expire
      if (config.expiresAt) {
        const delay = Math.max(config.expiresAt - Date.now() - 5 * 60 * 1000, 0);
        refreshTimerRef.current = setTimeout(() => silentLogin(), delay);
      }
    }

    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    googleLogout();
    googleDriveService.clearConfig();
    setIsAuthenticated(false);
    setFolderId('');
    setFiles([]);
  };

  const createFolder = async () => {
    setIsCreatingFolder(true);
    try {
      const id = await googleDriveService.createFolder(folderName);
      setFolderId(id);
      showMessage('success', `Folder "${folderName}" created! Guests can now upload photos.`);
      loadFiles();
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to create folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const loadFiles = async () => {
    if (!googleDriveService.isConfigured()) return;
    setIsLoading(true);
    try {
      const list = await googleDriveService.listFiles();
      setFiles(list);
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('Delete this photo permanently?')) return;
    try {
      const config = googleDriveService.getConfig();
      if (!config?.accessToken) return;
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${config.accessToken}` },
      });
      setFiles(prev => prev.filter(f => f.id !== fileId));
      showMessage('success', 'Photo deleted');
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to delete');
    }
  };

  if (!CLIENT_ID) {
    return (
      <div className="min-h-screen bg-wedding-bg flex items-center justify-center p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-lg text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-red-800 mb-3">Google Client ID Missing</h2>
          <p className="font-sans text-sm text-red-700 mb-4">
            Add <code className="bg-red-100 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> to your GitHub repository secrets, then redeploy.
          </p>
          <p className="font-sans text-xs text-red-600">
            See setup instructions below or ask your developer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wedding-bg">
      <header className="bg-wedding-text text-white py-6 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl">Wedding Admin</h1>
            <p className="font-sans text-sm text-white/60 mt-1">Google Drive photo management</p>
          </div>
          {isAuthenticated && (
            <Button onClick={handleLogout} variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="font-sans text-sm">{message.text}</span>
          </div>
        )}

        {!isAuthenticated ? (
          <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-wedding-accent/10 text-center">
            <div className="w-16 h-16 bg-wedding-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Folder className="w-8 h-8 text-wedding-accent" />
            </div>
            <h2 className="font-serif text-2xl text-wedding-text mb-3">Connect Google Drive</h2>
            <p className="font-sans text-wedding-muted mb-8 max-w-md mx-auto text-sm">
              Sign in with your Google account to create a wedding photo folder. All guest camera uploads will save here automatically.
            </p>
            <Button onClick={() => login()} className="btn-wedding px-8">
              Sign in with Google
            </Button>
            <p className="font-sans text-xs text-wedding-muted mt-4">
              Only requests access to files this app creates — not your entire Drive.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-wedding-accent/10 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tokenStatus === 'refreshing' ? 'bg-amber-100' : 'bg-green-100'}`}>
                  {tokenStatus === 'refreshing'
                    ? <RefreshCw className="w-5 h-5 text-amber-600 animate-spin" />
                    : <CheckCircle className="w-5 h-5 text-green-600" />}
                </div>
                <div>
                  <p className="font-sans text-xs text-wedding-muted">Google Account</p>
                  <p className="font-sans font-medium text-wedding-text text-sm">
                    {tokenStatus === 'refreshing' ? 'Refreshing…' : 'Connected ✓'}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-wedding-accent/10 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${folderId ? 'bg-green-100' : 'bg-amber-100'}`}>
                  {folderId ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Folder className="w-5 h-5 text-amber-600" />}
                </div>
                <div>
                  <p className="font-sans text-xs text-wedding-muted">Photo Folder</p>
                  <p className="font-sans font-medium text-wedding-text text-sm">{folderId ? 'Ready' : 'Not created'}</p>
                </div>
              </div>
            </div>

            {/* Folder creation */}
            {!folderId && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-wedding-accent/10">
                <h3 className="font-serif text-xl text-wedding-text mb-4">Create Photo Folder</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    value={folderName}
                    onChange={e => setFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="input-wedding flex-1"
                  />
                  <Button onClick={createFolder} disabled={isCreatingFolder} className="btn-wedding whitespace-nowrap">
                    {isCreatingFolder ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Creating…</> : <><Folder className="w-4 h-4 mr-2" />Create Folder</>}
                  </Button>
                </div>
                <p className="font-sans text-xs text-wedding-muted mt-3">
                  This creates a shared Google Drive folder. Guest photos upload here automatically.
                </p>
              </div>
            )}

            {/* Token status — only show if there's a problem */}
            {tokenStatus === 'expired' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
                <p className="font-sans text-sm text-amber-800">
                  Session expired — sign in again to keep uploads working.
                </p>
                <Button onClick={() => login()} size="sm" className="btn-wedding whitespace-nowrap">
                  Sign in again
                </Button>
              </div>
            )}

            {/* Files */}
            {folderId && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-wedding-accent/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-xl text-wedding-text">
                    Guest Photos <span className="text-wedding-muted font-sans text-sm font-normal">({files.length})</span>
                  </h3>
                  <Button onClick={loadFiles} variant="outline" size="sm" disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                {files.length === 0 ? (
                  <div className="text-center py-12 text-wedding-muted">
                    <Image className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-sans text-sm">No photos yet — share the QR code with guests!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {files.map(file => (
                      <div key={file.id} className="relative group rounded-lg overflow-hidden bg-wedding-bg aspect-square">
                        {file.thumbnailLink ? (
                          <img src={file.thumbnailLink} alt={file.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-8 h-8 text-wedding-muted" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button onClick={() => window.open(file.webViewLink, '_blank')} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/40">
                            <ExternalLink className="w-4 h-4 text-white" />
                          </button>
                          <button onClick={() => copyLink(file.webViewLink, file.id)} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/40">
                            {copiedId === file.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
                          </button>
                          <button onClick={() => deleteFile(file.id)} className="w-8 h-8 bg-red-500/70 rounded-full flex items-center justify-center hover:bg-red-500">
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] font-mono px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                          {file.name.split('_')[0]}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Admin() {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID || 'placeholder'}>
      <AdminContent />
    </GoogleOAuthProvider>
  );
}
