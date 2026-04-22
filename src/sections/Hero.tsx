import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// Floating Leaf SVG Component
const FloatingLeaf = ({ 
  color, 
  size = 80, 
  className = '',
  delay = 0 
}: { 
  color: string; 
  size?: number; 
  className?: string;
  delay?: number;
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={`absolute opacity-60 ${className}`}
    style={{ animationDelay: `${delay}s` }}
  >
    <path 
      d="M50 5 C30 20, 10 40, 10 60 C10 80, 30 95, 50 95 C70 95, 90 80, 90 60 C90 40, 70 20, 50 5 Z" 
      fill={color}
    />
    <path 
      d="M50 20 L50 80 M35 40 L50 50 M65 40 L50 50 M35 60 L50 70 M65 60 L50 70" 
      stroke="rgba(255,255,255,0.4)" 
      strokeWidth="1.5" 
      fill="none"
    />
  </svg>
);

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const leavesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const image = imageRef.current;
    const headline = headlineRef.current;
    const date = dateRef.current;
    const scrollHint = scrollHintRef.current;
    const leaves = leavesRef.current;

    if (!section || !image || !headline || !date || !scrollHint || !leaves) return;

    const ctx = gsap.context(() => {
      // Initial state
      gsap.set(image, { opacity: 0, scale: 1.06 });
      gsap.set(headline.children, { opacity: 0, y: 26, rotateX: 18 });
      gsap.set(date, { opacity: 0, y: 14 });
      gsap.set(scrollHint, { opacity: 0, y: 10 });

      // Auto-play entrance animation
      const tl = gsap.timeline({ delay: 0.3 });
      
      tl.to(image, {
        opacity: 1,
        scale: 1,
        duration: 1.1,
        ease: 'power2.out'
      })
      .to(headline.children, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.9,
        stagger: 0.06,
        ease: 'power3.out'
      }, '-=0.7')
      .to(date, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out'
      }, '-=0.5')
      .to(scrollHint, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out'
      }, '-=0.3');

      // Scroll-driven exit animation
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
          onLeaveBack: () => {
            // Reset to visible when scrolling back to top
            gsap.to(image, { opacity: 1, y: 0, scale: 1, duration: 0.3 });
            gsap.to(headline, { opacity: 1, y: 0, duration: 0.3 });
            gsap.to(date, { opacity: 1, y: 0, duration: 0.3 });
          }
        }
      });

      // Exit animations (70% - 100%)
      scrollTl.fromTo(image, 
        { y: 0, scale: 1, opacity: 1 },
        { y: '-18vh', scale: 1.05, opacity: 0, ease: 'power2.in' },
        0.7
      )
      .fromTo(headline,
        { y: 0, opacity: 1 },
        { y: '-10vh', opacity: 0, ease: 'power2.in' },
        0.7
      )
      .fromTo(date,
        { y: 0, opacity: 1 },
        { y: '-8vh', opacity: 0, ease: 'power2.in' },
        0.72
      )
      .fromTo(scrollHint,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.7
      )
      .fromTo(leaves,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.75
      );

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden z-10"
    >
      {/* Hero Background Image */}
      <div 
        ref={imageRef}
        className="absolute inset-0 w-full h-full"
      >
        <img 
          src="/images/hero_couple.jpg" 
          alt="Jaryd and Sarita"
          className="w-full h-full object-cover"
        />
        {/* Soft vignette overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(75,63,57,0.25) 100%)'
          }}
        />
        {/* Bottom gradient for text readability */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(75,63,57,0.4) 0%, transparent 40%, transparent 100%)'
          }}
        />
      </div>

      {/* Floating Leaves */}
      <div ref={leavesRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        <FloatingLeaf 
          color="#A8C4A0" 
          size={100} 
          className="top-[15%] left-[5%] animate-float"
          delay={0}
        />
        <FloatingLeaf 
          color="#D8A7B4" 
          size={80} 
          className="top-[25%] right-[8%] animate-float"
          delay={1}
        />
        <FloatingLeaf 
          color="#A8C4A0" 
          size={60} 
          className="bottom-[30%] left-[12%] animate-float"
          delay={2}
        />
        <FloatingLeaf 
          color="#D8A7B4" 
          size={70} 
          className="top-[60%] right-[5%] animate-float"
          delay={1.5}
        />
        <FloatingLeaf 
          color="#A8C4A0" 
          size={50} 
          className="bottom-[20%] right-[15%] animate-float"
          delay={0.5}
        />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        {/* Headline */}
        <div 
          ref={headlineRef}
          className="text-center px-4"
          style={{ perspective: '1000px' }}
        >
          <h1 className="font-serif text-white text-[clamp(44px,10vw,80px)] leading-[0.95] tracking-[-0.01em] drop-shadow-lg">
            <span className="inline-block">Jaryd</span>
            <span className="inline-block mx-2 sm:mx-4 font-light">&</span>
            <span className="inline-block">Sarita</span>
          </h1>
        </div>

        {/* Date */}
        <div 
          ref={dateRef}
          className="mt-6 sm:mt-8 text-center"
        >
          <p className="font-sans text-white/95 text-[clamp(16px,3vw,24px)] tracking-[0.2em] uppercase drop-shadow-md">
            30 May 2026
          </p>
          <p className="font-serif text-white/80 text-[clamp(14px,2vw,18px)] mt-2 italic">
            A Tamil Wedding Celebration
          </p>
        </div>
      </div>

      {/* Scroll Hint */}
      <div 
        ref={scrollHintRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-10"
      >
        <span className="font-sans text-white/80 text-xs tracking-[0.18em] uppercase mb-2 drop-shadow">
          Scroll
        </span>
        <ChevronDown className="w-5 h-5 text-white/80 animate-bounce-subtle drop-shadow" />
      </div>
    </section>
  );
}
