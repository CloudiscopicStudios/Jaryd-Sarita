import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Clock, Wine, UtensilsCrossed, Music, Heart, Sparkles } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface TimelineEvent {
  time: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tamilName?: string;
}

const events: TimelineEvent[] = [
  {
    time: '9:00 AM',
    title: 'Ganesha Pooja',
    description: 'Sacred beginning with prayers to Lord Ganesha for a blessed union',
    icon: <Sparkles className="w-5 h-5" />,
    tamilName: 'கணபதி பூஜை'
  },
  {
    time: '10:30 AM',
    title: 'Mangala Snanam',
    description: 'Holy turmeric bath ceremony for the bride and groom',
    icon: <Heart className="w-5 h-5" />,
    tamilName: 'மங்கள ஸ்நானம்'
  },
  {
    time: '12:00 PM',
    title: 'Kanyadaanam',
    description: 'The sacred giving away of the bride by her parents',
    icon: <Heart className="w-5 h-5" />,
    tamilName: 'கன்யாதானம்'
  },
  {
    time: '1:00 PM',
    title: 'Thali Tying Ceremony',
    description: 'The groom ties the sacred thali around the bride\'s neck',
    icon: <Clock className="w-5 h-5" />,
    tamilName: 'தாலி கட்டுதல்'
  },
  {
    time: '2:00 PM',
    title: 'Saptapadi',
    description: 'The seven sacred steps around the holy fire',
    icon: <Sparkles className="w-5 h-5" />,
    tamilName: 'சப்தபதி'
  },
  {
    time: '4:00 PM',
    title: 'Cocktail Hour',
    description: 'Bubbles, bites, and celebration with loved ones',
    icon: <Wine className="w-5 h-5" />
  },
  {
    time: '6:00 PM',
    title: 'Wedding Dinner',
    description: 'A feast of South Indian delicacies and toasts',
    icon: <UtensilsCrossed className="w-5 h-5" />
  },
  {
    time: '8:00 PM',
    title: 'Dancing & Celebration',
    description: 'Music, dancing, and joy until midnight',
    icon: <Music className="w-5 h-5" />
  }
];

export default function Timeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const timeline = timelineRef.current;
    const line = lineRef.current;

    if (!section || !header || !timeline || !line) return;

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

      // Timeline line draw animation
      gsap.fromTo(line,
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: timeline,
            start: 'top 70%',
            end: 'bottom 50%',
            scrub: true
          }
        }
      );

      // Timeline items animation
      const items = timeline.querySelectorAll('.timeline-item');
      items.forEach((item) => {
        gsap.fromTo(item,
          { opacity: 0, x: -30, rotateZ: -1 },
          {
            opacity: 1,
            x: 0,
            rotateZ: 0,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 85%',
              end: 'top 60%',
              scrub: true
            }
          }
        );
      });

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative w-full py-16 sm:py-24 overflow-hidden z-20 bg-wedding-bg"
    >
      {/* Decorative leaves */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute top-[15%] left-[2%] w-14 h-14 opacity-20" viewBox="0 0 100 100">
          <path d="M50 5 C30 20, 10 40, 10 60 C10 80, 30 95, 50 95 C70 95, 90 80, 90 60 C90 40, 70 20, 50 5 Z" fill="#A8C4A0"/>
        </svg>
        <svg className="absolute bottom-[20%] right-[3%] w-10 h-10 opacity-20" viewBox="0 0 100 100">
          <path d="M50 5 C30 20, 10 40, 10 60 C10 80, 30 95, 50 95 C70 95, 90 80, 90 60 C90 40, 70 20, 50 5 Z" fill="#D8A7B4"/>
        </svg>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 font-sans text-xs tracking-[0.18em] uppercase text-wedding-muted mb-4">
            <Clock className="w-3 h-3 text-wedding-accent" />
            The Day
            <Clock className="w-3 h-3 text-wedding-accent" />
          </span>
          <h2 className="font-serif text-[clamp(34px,5vw,52px)] text-wedding-text leading-[1.05] mb-4">
            Schedule of Events
          </h2>
          <p className="font-sans text-wedding-muted text-base sm:text-lg max-w-xl mx-auto">
            A day filled with sacred traditions, love, and celebration with our cherished family and friends.
          </p>
        </div>

        {/* Timeline */}
        <div ref={timelineRef} className="relative">
          {/* Vertical Line */}
          <div 
            ref={lineRef}
            className="absolute left-[22px] sm:left-[26px] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-wedding-accent/40 to-transparent origin-top"
          />

          {/* Timeline Items */}
          <div className="space-y-6 sm:space-y-8">
            {events.map((event, index) => (
              <div 
                key={index}
                className="timeline-item relative flex items-start gap-4 sm:gap-6 pl-2"
              >
                {/* Icon/Dot */}
                <div className="relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-wedding-bg border-2 border-wedding-accent/30 flex items-center justify-center shadow-sm z-10">
                  <span className="text-wedding-accent">
                    {event.icon}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 pt-1 sm:pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                    <span className="font-sans text-sm font-medium text-wedding-accent tracking-wide">
                      {event.time}
                    </span>
                    {event.tamilName && (
                      <span className="font-sans text-xs text-wedding-muted/70 italic">
                        {event.tamilName}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl text-wedding-text mb-1">
                    {event.title}
                  </h3>
                  <p className="font-sans text-sm sm:text-base text-wedding-muted leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tamil blessing */}
        <div className="mt-12 sm:mt-16 text-center">
          <p className="font-serif text-lg sm:text-xl text-wedding-text/80 italic">
            "இரண்டு உள்ளங்கள், ஒரே இலக்கு"
          </p>
          <p className="font-sans text-sm text-wedding-muted mt-2">
            "Two souls, one destiny"
          </p>
        </div>
      </div>
    </section>
  );
}
