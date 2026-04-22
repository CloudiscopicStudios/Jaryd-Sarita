import { useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Navigation from './sections/Navigation';
import Hero from './sections/Hero';
import Story from './sections/Story';
import Timeline from './sections/Timeline';
import PhotoUpload from './sections/PhotoUpload';
import Guestbook from './sections/Guestbook';
import Closing from './sections/Closing';
import DisposableCamera from './sections/DisposableCamera';
import Admin from './pages/Admin';
import Camera from './pages/Camera';

import './App.css';

gsap.registerPlugin(ScrollTrigger);

function MainContent() {
  const mainRef = useRef<HTMLElement>(null);
  const snapTriggerRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    // Wait for all sections to mount and create their ScrollTriggers
    const timer = setTimeout(() => {
      const pinned = ScrollTrigger.getAll()
        .filter(st => st.vars.pin)
        .sort((a, b) => a.start - b.start);
      
      const maxScroll = ScrollTrigger.maxScroll(window);
      
      if (!maxScroll || pinned.length === 0) return;

      // Build ranges and snap targets from pinned sections
      const pinnedRanges = pinned.map(st => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      // Create global snap
      snapTriggerRef.current = ScrollTrigger.create({
        snap: {
          snapTo: (value: number) => {
            // Check if within any pinned range (with small buffer)
            const inPinned = pinnedRanges.some(
              r => value >= r.start - 0.02 && value <= r.end + 0.02
            );
            
            // If not in a pinned section, allow free scroll
            if (!inPinned) return value;

            // Find nearest pinned center
            const target = pinnedRanges.reduce((closest, r) =>
              Math.abs(r.center - value) < Math.abs(closest - value) ? r.center : closest,
              pinnedRanges[0]?.center ?? 0
            );

            return target;
          },
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out',
        }
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      if (snapTriggerRef.current) {
        snapTriggerRef.current.kill();
      }
    };
  }, []);

  // Cleanup all ScrollTriggers on unmount
  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-wedding-bg">
      {/* Watercolor Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {/* Base watercolor washes */}
        <div 
          className="absolute inset-0 animate-breathe"
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(168, 196, 160, 0.25) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(216, 167, 180, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(233, 240, 236, 0.4) 0%, transparent 70%)
            `,
          }}
        />
        
        {/* Additional soft washes */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 70% 20%, rgba(216, 167, 180, 0.15) 0%, transparent 40%),
              radial-gradient(ellipse at 30% 80%, rgba(168, 196, 160, 0.2) 0%, transparent 45%)
            `,
          }}
        />
      </div>

      {/* Grain Overlay */}
      <div className="grain-overlay" />

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main ref={mainRef} className="relative z-10">
        {/* Section 1: Hero - pin: true */}
        <Hero />

        {/* Section 2: Story - pin: false */}
        <div id="story">
          <Story />
        </div>

        {/* Section 3: Timeline - pin: false */}
        <div id="details">
          <Timeline />
        </div>

        {/* Section 4: Disposable Camera - pin: false */}
        <div id="camera">
          <DisposableCamera />
        </div>

        {/* Section 5: Photo Upload - pin: true */}
        <PhotoUpload />

        {/* Section 6: Guestbook - pin: false */}
        <div id="guestbook">
          <Guestbook />
        </div>

        {/* Section 6: Closing - pin: false */}
        <Closing />
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainContent />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin.html" element={<Admin />} />
      <Route path="/camera" element={<Camera />} />
      <Route path="/camera.html" element={<Camera />} />
    </Routes>
  );
}

export default App;
