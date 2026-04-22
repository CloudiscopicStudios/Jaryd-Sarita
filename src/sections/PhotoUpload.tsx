import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Upload, X, User, ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { googleDriveService } from '@/services/googleDrive';

gsap.registerPlugin(ScrollTrigger);

interface UploadedPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  guestName: string;
  timestamp: Date;
  name: string;
}

export default function PhotoUpload() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const leavesRef = useRef<HTMLDivElement>(null);
  
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isDriveConfigured, setIsDriveConfigured] = useState(false);

  // Check if Google Drive is configured
  useEffect(() => {
    setIsDriveConfigured(googleDriveService.isConfigured());
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const leaves = leavesRef.current;

    if (!section || !content || !leaves) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        }
      });

      // Entrance animations (0% - 30%)
      const headline = content.querySelector('.headline');
      const subheadline = content.querySelector('.subheadline');
      const ctaButton = content.querySelector('.cta-button');
      const secondaryLink = content.querySelector('.secondary-link');

      if (headline) {
        scrollTl.fromTo(headline,
          { opacity: 0, y: '18vh', rotateX: 18 },
          { opacity: 1, y: 0, rotateX: 0, ease: 'none' },
          0
        );
      }

      if (subheadline) {
        scrollTl.fromTo(subheadline,
          { opacity: 0, y: '10vh' },
          { opacity: 1, y: 0, ease: 'none' },
          0.05
        );
      }

      if (ctaButton) {
        scrollTl.fromTo(ctaButton,
          { opacity: 0, y: '8vh', scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, ease: 'none' },
          0.1
        );
      }

      if (secondaryLink) {
        scrollTl.fromTo(secondaryLink,
          { opacity: 0, y: '6vh' },
          { opacity: 1, y: 0, ease: 'none' },
          0.15
        );
      }

      // Exit animations (70% - 100%)
      scrollTl.to(content.querySelectorAll('.animate-item'), {
        y: '-10vh',
        opacity: 0,
        stagger: 0.02,
        ease: 'power2.in'
      }, 0.7);

      scrollTl.to(leaves, {
        opacity: 0,
        ease: 'power2.in'
      }, 0.75);

    }, section);

    return () => ctx.revert();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Limit to 5 files
      const limitedFiles = files.slice(0, 5);
      setSelectedFiles(limitedFiles);
      const urls = limitedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
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

    if (!isDriveConfigured) {
      setUploadStatus({ 
        type: 'error', 
        message: 'Google Drive is not configured yet. Please ask the couple to set it up in the admin panel.' 
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      const uploadedPhotos: UploadedPhoto[] = [];

      for (const file of selectedFiles) {
        const result = await googleDriveService.uploadFile(file, guestName.trim());
        
        uploadedPhotos.push({
          id: result.id,
          url: googleDriveService.getImageUrl(result.id),
          thumbnailUrl: googleDriveService.getThumbnailUrl(result.id, 200),
          guestName: guestName.trim(),
          timestamp: new Date(),
          name: result.name,
        });
      }

      setPhotos(prev => [...uploadedPhotos, ...prev]);
      setUploadStatus({ 
        type: 'success', 
        message: `Successfully uploaded ${uploadedPhotos.length} photo${uploadedPhotos.length !== 1 ? 's' : ''}!` 
      });
      
      // Reset form after successful upload
      setTimeout(() => {
        setIsDialogOpen(false);
        setGuestName('');
        setSelectedFiles([]);
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        setPreviewUrls([]);
        setUploadStatus({ type: null, message: '' });
      }, 2000);
    } catch (error: any) {
      setUploadStatus({ 
        type: 'error', 
        message: error.message || 'Failed to upload photos. Please try again.' 
      });
    } finally {
      setIsUploading(false);
    }
  }, [guestName, selectedFiles, isDriveConfigured, previewUrls]);

  const clearDialog = useCallback(() => {
    setGuestName('');
    setSelectedFiles([]);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setUploadStatus({ type: null, message: '' });
  }, [previewUrls]);

  return (
    <section 
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden z-30 bg-wedding-bg"
    >
      {/* Floating Leaves */}
      <div ref={leavesRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute top-[10%] left-[5%] w-20 h-20 opacity-30 animate-float" viewBox="0 0 100 100">
          <path d="M50 5 C30 20, 10 40, 10 60 C10 80, 30 95, 50 95 C70 95, 90 80, 90 60 C90 40, 70 20, 50 5 Z" fill="#A8C4A0"/>
        </svg>
        <svg className="absolute top-[20%] right-[8%] w-16 h-16 opacity-25 animate-float" style={{ animationDelay: '1s' }} viewBox="0 0 100 100">
          <path d="M50 5 C30 20, 10 40, 10 60 C10 80, 30 95, 50 95 C70 95, 90 80, 90 60 C90 40, 70 20, 50 5 Z" fill="#D8A7B4"/>
        </svg>
        <svg className="absolute bottom-[25%] left-[10%] w-14 h-14 opacity-20 animate-float" style={{ animationDelay: '2s' }} viewBox="0 0 100 100">
          <path d="M50 5 C30 20, 10 40, 10 60 C10 80, 30 95, 50 95 C70 95, 90 80, 90 60 C90 40, 70 20, 50 5 Z" fill="#D8A7B4"/>
        </svg>
        <svg className="absolute bottom-[15%] right-[12%] w-18 h-18 opacity-25 animate-float" style={{ animationDelay: '1.5s' }} viewBox="0 0 100 100">
          <path d="M50 5 C30 20, 10 40, 10 60 C10 80, 30 95, 50 95 C70 95, 90 80, 90 60 C90 40, 70 20, 50 5 Z" fill="#A8C4A0"/>
        </svg>
        <svg className="absolute top-[50%] left-[3%] w-12 h-12 opacity-20 animate-float" style={{ animationDelay: '0.5s' }} viewBox="0 0 100 100">
          <path d="M50 5 C30 20, 10 40, 10 60 C10 80, 30 95, 50 95 C70 95, 90 80, 90 60 C90 40, 70 20, 50 5 Z" fill="#A8C4A0"/>
        </svg>
        <svg className="absolute top-[60%] right-[5%] w-14 h-14 opacity-20 animate-float" style={{ animationDelay: '2.5s' }} viewBox="0 0 100 100">
          <path d="M50 5 C30 20, 10 40, 10 60 C10 80, 30 95, 50 95 C70 95, 90 80, 90 60 C90 40, 70 20, 50 5 Z" fill="#D8A7B4"/>
        </svg>
      </div>

      {/* Content */}
      <div 
        ref={contentRef}
        className="absolute inset-0 flex flex-col items-center justify-center px-4"
        style={{ perspective: '1000px' }}
      >
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="headline animate-item font-serif text-[clamp(40px,8vw,72px)] text-wedding-text leading-[0.95] mb-6">
            Share Your Moments
          </h2>
          
          <p className="subheadline animate-item font-sans text-wedding-muted text-lg sm:text-xl mb-10 max-w-lg mx-auto">
            Upload photos from the day and help us capture every precious moment!
          </p>

          <div className="cta-button animate-item">
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="btn-wedding text-base px-10 py-4 h-auto"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Photos
            </Button>
          </div>

          {!isDriveConfigured && (
            <div className="animate-item mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200 max-w-md mx-auto">
              <p className="font-sans text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Photo uploads will be available once the couple sets up Google Drive.
              </p>
            </div>
          )}
        </div>

        {/* Recently uploaded preview */}
        {photos.length > 0 && (
          <div className="animate-item mt-12 w-full max-w-3xl">
            <p className="text-center font-sans text-xs tracking-[0.18em] uppercase text-wedding-muted mb-4">
              Recently Shared
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              {photos.slice(0, 5).map((photo) => (
                <div 
                  key={photo.id}
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 border-wedding-accent/20"
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

      {/* Upload Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) clearDialog();
        }}
      >
        <DialogContent className="sm:max-w-md bg-wedding-bg border-wedding-accent/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-wedding-text text-center">
              Share Your Photos
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Status Message */}
            {uploadStatus.type && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                uploadStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {uploadStatus.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="font-sans text-sm">{uploadStatus.message}</span>
              </div>
            )}

            {/* Name Input */}
            <div>
              <label className="block font-sans text-sm text-wedding-muted mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Your Name
              </label>
              <Input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter your name"
                className="input-wedding"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block font-sans text-sm text-wedding-muted mb-2">
                <ImageIcon className="w-4 h-4 inline mr-1" />
                Select Photos (max 5)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="photo-upload"
                  disabled={!isDriveConfigured}
                />
                <label 
                  htmlFor="photo-upload"
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    isDriveConfigured 
                      ? 'border-wedding-accent/30 hover:border-wedding-accent/60 bg-white/50' 
                      : 'border-gray-300 bg-gray-100 cursor-not-allowed'
                  }`}
                >
                  <Upload className={`w-8 h-8 mb-2 ${isDriveConfigured ? 'text-wedding-accent' : 'text-gray-400'}`} />
                  <span className={`font-sans text-sm ${isDriveConfigured ? 'text-wedding-muted' : 'text-gray-400'}`}>
                    {isDriveConfigured ? 'Click to select photos' : 'Uploads not available yet'}
                  </span>
                  {isDriveConfigured && (
                    <span className="font-sans text-xs text-wedding-muted/70 mt-1">
                      You can select up to 5 photos
                    </span>
                  )}
                </label>
              </div>
            </div>

            {/* Preview */}
            {previewUrls.length > 0 && (
              <div>
                <label className="block font-sans text-sm text-wedding-muted mb-2">
                  Selected ({previewUrls.length})
                </label>
                <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative w-16 h-16">
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-wedding-text rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!guestName.trim() || selectedFiles.length === 0 || isUploading || !isDriveConfigured}
              className="w-full btn-wedding disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
