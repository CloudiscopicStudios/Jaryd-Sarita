import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Camera, QrCode, Smartphone, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

export default function DisposableCamera() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    // Generate QR code URL
    const baseUrl = window.location.origin;
    setQrUrl(`${baseUrl}/camera`);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;

    if (!section || !content) return;

    const ctx = gsap.context(() => {
      const elements = content.querySelectorAll('.reveal-item');
      gsap.fromTo(elements,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'top 40%',
            scrub: true
          }
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  // Generate QR code using QR Server API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;

  return (
    <section 
      ref={sectionRef}
      className="relative w-full py-16 sm:py-24 overflow-hidden z-20 bg-wedding-sage"
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute top-[10%] left-[5%] w-16 h-16 opacity-15" viewBox="0 0 100 100">
          <path d="M50 5 C30 20, 10 40, 10 60 C10 80, 30 95, 50 95 C70 95, 90 80, 90 60 C90 40, 70 20, 50 5 Z" fill="#D8A7B4"/>
        </svg>
        <svg className="absolute bottom-[15%] right-[8%] w-14 h-14 opacity-15" viewBox="0 0 100 100">
          <path d="M50 5 C30 20, 10 40, 10 60 C10 80, 30 95, 50 95 C70 95, 90 80, 90 60 C90 40, 70 20, 50 5 Z" fill="#A8C4A0"/>
        </svg>
      </div>

      <div ref={contentRef} className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="reveal-item inline-flex items-center gap-2 font-sans text-xs tracking-[0.18em] uppercase text-wedding-muted mb-4">
            <Camera className="w-3 h-3 text-wedding-accent" />
            Disposable Camera
            <Camera className="w-3 h-3 text-wedding-accent" />
          </span>
          <h2 className="reveal-item font-serif text-[clamp(34px,5vw,52px)] text-wedding-text leading-[1.05] mb-4">
            Capture the Day Like a Disposable Camera
          </h2>
          <p className="reveal-item font-sans text-wedding-muted text-base sm:text-lg max-w-xl mx-auto">
            Give your guests a nostalgic disposable camera experience! Each guest gets 15 shots to capture candid moments.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* QR Code */}
          <div className="reveal-item flex flex-col items-center">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-wedding-accent/10">
              <div className="w-48 h-48 mx-auto mb-4 bg-wedding-bg rounded-lg overflow-hidden">
                {qrUrl && (
                  <img 
                    src={qrCodeUrl}
                    alt="QR Code to access disposable camera"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <p className="font-sans text-sm text-wedding-muted text-center">
                Scan to open the wedding camera
              </p>
              <p className="font-sans text-xs text-wedding-accent text-center mt-1">
                {qrUrl}
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div className="reveal-item flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-wedding-accent/10 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6 text-wedding-accent" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-wedding-text mb-1">No App Download</h3>
                <p className="font-sans text-sm text-wedding-muted">
                  Guests simply scan the QR code and their phone becomes a disposable camera. Works on any smartphone!
                </p>
              </div>
            </div>

            <div className="reveal-item flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-wedding-accent/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-wedding-accent" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-wedding-text mb-1">15 Shots Per Guest</h3>
                <p className="font-sans text-sm text-wedding-muted">
                  Just like a real disposable camera, each guest gets a limited number of shots. Make them count!
                </p>
              </div>
            </div>

            <div className="reveal-item flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-wedding-accent/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-wedding-accent" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-wedding-text mb-1">Everyone's Perspective</h3>
                <p className="font-sans text-sm text-wedding-muted">
                  Collect photos from every angle - the dance floor, the ceremony, the candid laughs. All the moments you'd otherwise miss.
                </p>
              </div>
            </div>

            <div className="reveal-item flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-wedding-accent/10 flex items-center justify-center flex-shrink-0">
                <QrCode className="w-6 h-6 text-wedding-accent" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-wedding-text mb-1">Easy to Share</h3>
                <p className="font-sans text-sm text-wedding-muted">
                  Print the QR code and place it on tables, in the program, or on signs around the venue.
                </p>
              </div>
            </div>

            <div className="reveal-item pt-4">
              <a 
                href="/camera" 
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="btn-wedding w-full sm:w-auto">
                  <Camera className="w-5 h-5 mr-2" />
                  Try the Camera Now
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Tamil blessing */}
        <div className="reveal-item mt-12 text-center">
          <p className="font-serif text-lg text-wedding-text/80 italic">
            "ஒவ்வொரு கணமும் ஒரு புகைப்படம்"
          </p>
          <p className="font-sans text-sm text-wedding-muted mt-2">
            "Every moment is a photograph"
          </p>
        </div>
      </div>
    </section>
  );
}
