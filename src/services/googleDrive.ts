// Google Drive Service for Wedding Website
// This service handles file uploads to Google Drive

const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const GOOGLE_DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

export interface GoogleDriveConfig {
  accessToken: string;
  folderId: string | null;
}

export interface UploadResult {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
  thumbnailLink?: string;
}

class GoogleDriveService {
  private config: GoogleDriveConfig | null = null;

  setConfig(config: GoogleDriveConfig) {
    this.config = config;
    localStorage.setItem('wedding_drive_config', JSON.stringify(config));
  }

  getConfig(): GoogleDriveConfig | null {
    if (this.config) return this.config;
    const stored = localStorage.getItem('wedding_drive_config');
    if (stored) {
      this.config = JSON.parse(stored);
      return this.config;
    }
    return null;
  }

  clearConfig() {
    this.config = null;
    localStorage.removeItem('wedding_drive_config');
  }

  isConfigured(): boolean {
    const config = this.getConfig();
    return !!(config?.accessToken && config?.folderId);
  }

  // Create a folder for wedding photos
  async createFolder(folderName: string = 'Jaryd & Sarita Wedding Photos'): Promise<string> {
    const config = this.getConfig();
    if (!config?.accessToken) {
      throw new Error('Not authenticated');
    }

    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const response = await fetch(`${GOOGLE_DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create folder');
    }

    const data = await response.json();
    
    // Make folder publicly viewable
    await this.setFilePermissions(data.id, 'reader', 'anyone');
    
    // Update config with new folder ID
    this.setConfig({ ...config, folderId: data.id });
    
    return data.id;
  }

  // Set file permissions
  async setFilePermissions(fileId: string, role: string, type: string): Promise<void> {
    const config = this.getConfig();
    if (!config?.accessToken) return;

    await fetch(`${GOOGLE_DRIVE_API_BASE}/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role, type }),
    });
  }

  // Upload a file to Google Drive
  async uploadFile(file: File, guestName: string): Promise<UploadResult> {
    const config = this.getConfig();
    if (!config?.accessToken) {
      throw new Error('Not authenticated. Please set up Google Drive first.');
    }

    if (!config.folderId) {
      throw new Error('No folder configured. Please create a folder first.');
    }

    // Create file metadata with guest name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${guestName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}_${file.name}`;
    
    const metadata = {
      name: fileName,
      parents: [config.folderId],
      description: `Uploaded by ${guestName} on ${new Date().toLocaleString()}`,
    };

    // Create multipart request
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${file.type}\r\n\r\n`;

    const blob = new Blob([multipartRequestBody, file, closeDelimiter]);

    const response = await fetch(
      `${GOOGLE_DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,thumbnailLink`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': `multipart/related; boundary="${boundary}"`,
        },
        body: blob,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to upload file');
    }

    const data = await response.json();
    
    // Make file publicly viewable
    await this.setFilePermissions(data.id, 'reader', 'anyone');
    
    return data;
  }

  // List files in the wedding folder
  async listFiles(pageSize: number = 50): Promise<UploadResult[]> {
    const config = this.getConfig();
    if (!config?.accessToken || !config?.folderId) {
      throw new Error('Not configured');
    }

    const response = await fetch(
      `${GOOGLE_DRIVE_API_BASE}/files?q='${config.folderId}'+in+parents&pageSize=${pageSize}&fields=files(id,name,webViewLink,webContentLink,thumbnailLink)&orderBy=createdTime desc`,
      {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to list files');
    }

    const data = await response.json();
    return data.files || [];
  }

  // Get direct image URL for displaying
  getImageUrl(fileId: string): string {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // Get thumbnail URL
  getThumbnailUrl(fileId: string, size: number = 400): string {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
  }
}

export const googleDriveService = new GoogleDriveService();
export default googleDriveService;
