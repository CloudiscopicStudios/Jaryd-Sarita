import { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import { 
  Folder, 
  CheckCircle, 
  AlertCircle, 
  LogOut, 
  Image,
  RefreshCw,
  ExternalLink,
  Trash2,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { googleDriveService, type UploadResult } from '@/services/googleDrive';

const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // User will need to replace this

function AdminContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [folderId, setFolderId] = useState<string>('');
  const [folderName, setFolderName] = useState('Jaryd & Sarita Wedding Photos');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [files, setFiles] = useState<UploadResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Check for existing config on mount
  useEffect(() => {
    const config = googleDriveService.getConfig();
    if (config) {
      setAccessToken(config.accessToken);
      setFolderId(config.folderId || '');
      if (config.accessToken) {
        setIsAuthenticated(true);
        loadFiles();
      }
    }
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleLoginSuccess = (credentialResponse: any) => {
    const token = credentialResponse.access_token || credentialResponse.credential;
    if (token) {
      setAccessToken(token);
      setIsAuthenticated(true);
      googleDriveService.setConfig({ accessToken: token, folderId: folderId || null });
      showMessage('success', 'Successfully connected to Google!');
      loadFiles();
    }
  };

  const handleLogout = () => {
    googleLogout();
    googleDriveService.clearConfig();
    setIsAuthenticated(false);
    setAccessToken('');
    setFolderId('');
    setFiles([]);
    showMessage('success', 'Logged out successfully');
  };

  const createFolder = async () => {
    if (!accessToken) {
      showMessage('error', 'Please authenticate first');
      return;
    }

    setIsCreatingFolder(true);
    try {
      const newFolderId = await googleDriveService.createFolder(folderName);
      setFolderId(newFolderId);
      showMessage('success', `Folder "${folderName}" created successfully!`);
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to create folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const loadFiles = async () => {
    if (!googleDriveService.isConfigured()) return;
    
    setIsLoading(true);
    try {
      const fileList = await googleDriveService.listFiles();
      setFiles(fileList);
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to load files');
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
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      const config = googleDriveService.getConfig();
      if (!config?.accessToken) return;

      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
      });

      setFiles(files.filter(f => f.id !== fileId));
      showMessage('success', 'File deleted successfully');
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to delete file');
    }
  };

  return (
    <div className="min-h-screen bg-wedding-bg">
      {/* Header */}
      <header className="bg-wedding-text text-white py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl">Wedding Admin</h1>
            <p className="font-sans text-sm text-white/70 mt-1">
              Google Drive Integration for Jaryd & Sarita's Wedding
            </p>
          </div>
          {isAuthenticated && (
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-sans text-sm">{message.text}</span>
          </div>
        )}

        {!isAuthenticated ? (
          /* Login Section */
          <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-lg border border-wedding-accent/10 text-center">
            <div className="w-16 h-16 bg-wedding-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Folder className="w-8 h-8 text-wedding-accent" />
            </div>
            <h2 className="font-serif text-2xl text-wedding-text mb-4">
              Connect Google Drive
            </h2>
            <p className="font-sans text-wedding-muted mb-8 max-w-md mx-auto">
              Connect your Google account to store all wedding photos and guest uploads in one place. 
              Guests will be able to upload directly to your Drive folder.
            </p>
            
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={() => showMessage('error', 'Login failed. Please try again.')}
                useOneTap
              />
            </div>

            <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="font-sans text-sm text-amber-800">
                <strong>Note:</strong> To use this feature, you need to:
              </p>
              <ol className="font-sans text-sm text-amber-700 mt-2 ml-4 list-decimal text-left">
                <li>Create a Google Cloud Project</li>
                <li>Enable Google Drive API</li>
                <li>Create OAuth 2.0 credentials</li>
                <li>Add your Client ID to this admin page</li>
              </ol>
              <p className="font-sans text-xs text-amber-600 mt-3">
                Need help? Contact your developer or follow the 
                <a 
                  href="https://developers.google.com/drive/api/quickstart/js" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline ml-1"
                >
                  Google Drive API Quickstart
                </a>
              </p>
            </div>
          </div>
        ) : (
          /* Admin Dashboard */
          <div className="space-y-8">
            {/* Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-wedding-accent/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-sans text-sm text-wedding-muted">Google Account</p>
                    <p className="font-sans font-medium text-wedding-text">Connected</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-wedding-accent/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    folderId ? 'bg-green-100' : 'bg-amber-100'
                  }`}>
                    {folderId ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Folder className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-sans text-sm text-wedding-muted">Drive Folder</p>
                    <p className="font-sans font-medium text-wedding-text">
                      {folderId ? 'Created' : 'Not Created'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Folder Setup */}
            {!folderId && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-wedding-accent/10">
                <h3 className="font-serif text-xl text-wedding-text mb-4">
                  Create Wedding Photo Folder
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="flex-1"
                  />
                  <Button
                    onClick={createFolder}
                    disabled={isCreatingFolder || !folderName}
                    className="btn-wedding"
                  >
                    {isCreatingFolder ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Folder className="w-4 h-4 mr-2" />
                        Create Folder
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Folder Info */}
            {folderId && (
              <div className="bg-wedding-sage/30 rounded-xl p-6 border border-wedding-sage/50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-lg text-wedding-text mb-2">
                      {folderName}
                    </h3>
                    <p className="font-sans text-sm text-wedding-muted">
                      Folder ID: <code className="bg-white/50 px-2 py-1 rounded">{folderId}</code>
                    </p>
                  </div>
                  <a
                    href={`https://drive.google.com/drive/folders/${folderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-wedding-accent hover:text-wedding-text transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
            )}

            {/* Uploaded Files */}
            {folderId && (
              <div className="bg-white rounded-xl shadow-sm border border-wedding-accent/10 overflow-hidden">
                <div className="p-6 border-b border-wedding-accent/10 flex items-center justify-between">
                  <h3 className="font-serif text-xl text-wedding-text">
                    Uploaded Photos
                  </h3>
                  <Button
                    onClick={loadFiles}
                    disabled={isLoading}
                    variant="outline"
                    className="text-wedding-accent border-wedding-accent/30"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                {files.length === 0 ? (
                  <div className="p-12 text-center">
                    <Image className="w-12 h-12 text-wedding-accent/30 mx-auto mb-4" />
                    <p className="font-sans text-wedding-muted">
                      No photos uploaded yet. Guest uploads will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-wedding-accent/10">
                    {files.map((file) => (
                      <div key={file.id} className="p-4 flex items-center gap-4 hover:bg-wedding-bg/50">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 bg-wedding-bg rounded-lg overflow-hidden flex-shrink-0">
                          {file.thumbnailLink ? (
                            <img
                              src={file.thumbnailLink}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="w-6 h-6 text-wedding-muted" />
                            </div>
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-sans font-medium text-wedding-text truncate">
                            {file.name}
                          </p>
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-sans text-xs text-wedding-accent hover:underline"
                          >
                            View in Google Drive
                          </a>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyLink(file.webViewLink, file.id)}
                            className="p-2 text-wedding-muted hover:text-wedding-accent transition-colors"
                            title="Copy link"
                          >
                            {copiedId === file.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteFile(file.id)}
                            className="p-2 text-wedding-muted hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {files.length > 0 && (
                  <div className="p-4 bg-wedding-bg border-t border-wedding-accent/10">
                    <p className="font-sans text-sm text-wedding-muted text-center">
                      {files.length} photo{files.length !== 1 ? 's' : ''} uploaded
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h4 className="font-serif text-lg text-blue-900 mb-3">
                How Guest Uploads Work
              </h4>
              <ol className="font-sans text-sm text-blue-800 space-y-2 ml-4 list-decimal">
                <li>Guests visit your wedding website on their phone</li>
                <li>They click "Upload Photos" and enter their name</li>
                <li>Photos are automatically saved to your Google Drive folder</li>
                <li>All uploads are organized with guest names and timestamps</li>
                <li>Photos are set to be publicly viewable (anyone with the link)</li>
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Admin() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AdminContent />
    </GoogleOAuthProvider>
  );
}
