import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Camera, X, ChevronLeft, ChevronRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface GalleryImage {
  src: string;
  alt: string;
  aspectRatio: 'square' | 'portrait' | 'landscape';
}

const galleryImages: GalleryImage[] = [
  { src: '/images/gallery_01.jpg', alt: 'Jaryd and Sarita walking together', aspectRatio: 'landscape' },
  { src: '/images/gallery_02.jpg', alt: 'Wedding floral arrangement', aspectRatio: 'square' },
  { src: '/images/gallery_03.jpg', alt: 'Sunset silhouette', aspectRatio: 'portrait' },
  { src: '/images/gallery_04.jpg', alt: 'Tender moment', aspectRatio: 'landscape' },
  { src: '/images/gallery_05.jpg', alt: 'Traditional decor', aspectRatio: 'square' },
  { src: '/images/gallery_06.jpg', alt: 'Joyful celebration', aspectRatio: 'portrait' },
];

export default function Gallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const grid = gridRef.current;

    if (!section || !header || !grid) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(header,
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'top 50%',
            scrub: true
          }
        }
      );

      // Grid cards animation
      const cards = grid.querySelectorAll('.gallery-card');
      cards.forEach((card) => {
        gsap.fromTo(card,
          { opacity: 0, y: 60, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 90%',
              end: 'top 60%',
              scrub: true
            }
          }
        );
      });

    }, section);

    return () => ctx.revert();
  }, []);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = '';
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case 'square':
        return 'aspect-square';
      case 'portrait':
        return 'aspect-[3/4]';
      case 'landscape':
        return 'aspect-[4/3]';
      default:
        return 'aspect-square';
    }
  };

  return (
    <section 
      ref={sectionRef}
      className="relative w-full py-16 sm:py-24 overflow-hidden z-20 bg-wedding-bg"
    >
      {/* Decorative leaves */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute top-[10%] right-[5%] w-12 h-12 opacity-20" viewBox="0 0 100 100">
          <path d="M50 5 C30 20, 10 40, 10 60 C10 80, 30 95, 50 95 C70 95, 90 80, 90 60 C90 40, 70 20, 50 5 Z" fill="#D8A7B4"/>
        </svg>
        <svg className="absolute bottom-[15%] left-[3%] w-14 h-14 opacity-20" viewBox="0 0 100 100">
          <path d="M50 5 C30 20, 10 40, 10 60 C10 80, 30 95, 50 95 C70 95, 90 80, 90 60 C90 40, 70 20, 50 5 Z" fill="#A8C4A0"/>
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 font-sans text-xs tracking-[0.18em] uppercase text-wedding-muted mb-4">
            <Camera className="w-3 h-3 text-wedding-accent" />
            Gallery
            <Camera className="w-3 h-3 text-wedding-accent" />
          </span>
          <h2 className="font-serif text-[clamp(34px,5vw,52px)] text-wedding-text leading-[1.05] mb-4">
            Moments We've Shared
          </h2>
          <p className="font-sans text-wedding-muted text-base sm:text-lg max-w-xl mx-auto">
            A few favorites from the journey that brought us here.
          </p>
        </div>

        {/* Grid */}
        <div 
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className={`gallery-card group relative overflow-hidden rounded-xl cursor-pointer card-wedding ${getAspectRatioClass(image.aspectRatio)}`}
              onClick={() => openLightbox(index)}
            >
              <img 
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-wedding-text/0 group-hover:bg-wedding-text/20 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-wedding-text" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-wedding-text/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button 
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={closeLightbox}
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Navigation */}
          <button 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button 
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Image */}
          <div 
            className="max-w-[90vw] max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={galleryImages[currentImageIndex].src}
              alt={galleryImages[currentImageIndex].alt}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>

          {/* Image counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-sans text-white/80 text-sm">
            {currentImageIndex + 1} / {galleryImages.length}
          </div>
        </div>
      )}
    </section>
  );
}
