import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Heart } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function Story() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const leavesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const image = imageRef.current;
    const content = contentRef.current;
    const leaves = leavesRef.current;

    if (!section || !image || !content || !leaves) return;

    const ctx = gsap.context(() => {
      // Image reveal animation
      gsap.fromTo(image,
        { opacity: 0, x: '-10vw', rotateZ: -2, scale: 0.98 },
        {
          opacity: 1,
          x: 0,
          rotateZ: 0,
          scale: 1,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'top 30%',
            scrub: true
          }
        }
      );

      // Content reveal animation
      const contentElements = content.querySelectorAll('.reveal-item');
      gsap.fromTo(contentElements,
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            end: 'top 30%',
            scrub: true
          }
        }
      );

      // Leaves parallax
      gsap.to(leaves.querySelectorAll('.leaf'), {
        y: -50,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative w-full min-h-screen py-16 sm:py-24 overflow-hidden z-20 bg-wedding-bg"
    >
      {/* Floating Leaves Background */}
      <div ref={leavesRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="leaf absolute top-[10%] right-[5%] w-16 h-16 opacity-30" viewBox="0 0 100 100">
          <path d="M50 5 C30 20, 10 40, 10 60 C10 80, 30 95, 50 95 C70 95, 90 80, 90 60 C90 40, 70 20, 50 5 Z" fill="#A8C4A0"/>
        </svg>
        <svg className="leaf absolute bottom-[20%] left-[3%] w-12 h-12 opacity-25" viewBox="0 0 100 100">
          <path d="M50 5 C30 20, 10 40, 10 60 C10 80, 30 95, 50 95 C70 95, 90 80, 90 60 C90 40, 70 20, 50 5 Z" fill="#D8A7B4"/>
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Image Card */}
          <div 
            ref={imageRef}
            className="relative mx-auto lg:mx-0 w-full max-w-md lg:max-w-none"
          >
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-[var(--wedding-text)]/10">
              <img 
                src="/images/story_portrait.jpg" 
                alt="Jaryd and Sarita's Story"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative elements */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-wedding-accent/20 rounded-full blur-2xl" />
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-wedding-sage/20 rounded-full blur-xl" />
          </div>

          {/* Content */}
          <div ref={contentRef} className="text-center lg:text-left px-2 sm:px-0">
            <div className="reveal-item">
              <span className="inline-flex items-center gap-2 font-sans text-xs tracking-[0.18em] uppercase text-wedding-muted mb-4">
                <Heart className="w-3 h-3 text-wedding-accent" />
                Our Story
                <Heart className="w-3 h-3 text-wedding-accent" />
              </span>
            </div>
            
            <h2 className="reveal-item font-serif text-[clamp(34px,5vw,52px)] text-wedding-text leading-[1.05] mb-6">
              It started with a hello
            </h2>
            
            <div className="reveal-item space-y-4 text-wedding-muted leading-relaxed">
              <p>
                We met on a rainy Tuesday that neither of us expected to change our lives. 
                What began as a simple coffee date turned into endless conversations, 
                road trips to places we'd never been, and a shared love for sundowners 
                by the ocean.
              </p>
              <p>
                Our journey has been a beautiful blend of cultures — Jaryd's adventurous spirit 
                meeting Sarita's Tamil heritage, creating moments that are uniquely ours. 
                From learning to make perfect masala chai together to dancing the night away 
                at family celebrations, every day has been an adventure.
              </p>
              <p>
                This chapter, our wedding, is our favorite so far. We can't wait to celebrate 
                with the people who have supported us every step of the way.
              </p>
            </div>

            <div className="reveal-item mt-8">
              <button className="group inline-flex items-center gap-2 font-sans text-sm text-wedding-accent hover:text-wedding-text transition-colors duration-300">
                <span className="relative">
                  Read a little more
                  <span className="absolute bottom-0 left-0 w-full h-px bg-current transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </span>
                <svg 
                  className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
