import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Heart, Mail, MapPin, Instagram } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function Closing() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const footer = footerRef.current;

    if (!section || !content || !footer) return;

    const ctx = gsap.context(() => {
      // Content animation
      gsap.fromTo(content,
        { opacity: 0, y: 18 },
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

      // Footer columns animation
      const columns = footer.querySelectorAll('.footer-column');
      gsap.fromTo(columns,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footer,
            start: 'top 90%',
            end: 'top 60%',
            scrub: true
          }
        }
      );

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative w-full py-16 sm:py-24 overflow-hidden z-50 bg-wedding-bg"
    >
      {/* Decorative leaf */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute top-[20%] left-[50%] -translate-x-1/2 w-24 h-24 opacity-10" viewBox="0 0 100 100">
          <path d="M50 5 C30 20, 10 40, 10 60 C10 80, 30 95, 50 95 C70 95, 90 80, 90 60 C90 40, 70 20, 50 5 Z" fill="#D8A7B4"/>
        </svg>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content */}
        <div ref={contentRef} className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Heart className="w-5 h-5 text-wedding-accent" />
            <Heart className="w-6 h-6 text-wedding-accent fill-wedding-accent" />
            <Heart className="w-5 h-5 text-wedding-accent" />
          </div>
          
          <h2 className="font-serif text-[clamp(32px,6vw,56px)] text-wedding-text leading-[1.05] mb-4">
            Can't Wait to Celebrate with You
          </h2>
          
          <p className="font-sans text-wedding-muted text-base sm:text-lg max-w-lg mx-auto">
            If you have any questions, reach out anytime. We're so grateful to have you in our lives.
          </p>

          {/* Tamil blessing */}
          <div className="mt-8">
            <p className="font-serif text-xl sm:text-2xl text-wedding-text/80">
              "நன்றி மற்றும் அன்பு"
            </p>
            <p className="font-sans text-sm text-wedding-muted mt-2">
              With gratitude and love
            </p>
          </div>
        </div>

        {/* Footer */}
        <div 
          ref={footerRef}
          className="border-t border-wedding-accent/20 pt-10"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            {/* Date & Location */}
            <div className="footer-column text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                <MapPin className="w-4 h-4 text-wedding-accent" />
                <span className="font-sans text-xs tracking-[0.18em] uppercase text-wedding-muted">
                  When & Where
                </span>
              </div>
              <p className="font-serif text-lg text-wedding-text">
                30 May 2026
              </p>
              <p className="font-sans text-sm text-wedding-muted mt-1">
                Cape Town, South Africa
              </p>
            </div>

            {/* Contact */}
            <div className="footer-column text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-wedding-accent" />
                <span className="font-sans text-xs tracking-[0.18em] uppercase text-wedding-muted">
                  Contact
                </span>
              </div>
              <a 
                href="mailto:hello@jarydsarita.wedding"
                className="font-sans text-sm text-wedding-text hover:text-wedding-accent transition-colors"
              >
                hello@jarydsarita.wedding
              </a>
            </div>

            {/* Social */}
            <div className="footer-column text-center sm:text-right">
              <div className="flex items-center justify-center sm:justify-end gap-2 mb-3">
                <Instagram className="w-4 h-4 text-wedding-accent" />
                <span className="font-sans text-xs tracking-[0.18em] uppercase text-wedding-muted">
                  Share the Love
                </span>
              </div>
              <p className="font-sans text-sm text-wedding-text">
                #JarydAndSarita2026
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-10 pt-6 border-t border-wedding-accent/10 text-center">
            <p className="font-serif text-2xl sm:text-3xl text-wedding-text mb-2">
              Jaryd <span className="text-wedding-accent">&</span> Sarita
            </p>
            <p className="font-sans text-xs text-wedding-muted">
              Made with love for our wedding day
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
