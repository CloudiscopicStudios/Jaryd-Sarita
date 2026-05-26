import { Routes, Route } from 'react-router-dom';

import Navigation from './sections/Navigation';
import PhotoUpload from './sections/PhotoUpload';
import Admin from './pages/Admin';

import './App.css';

function MainContent() {

  return (
    <div className="relative min-h-screen bg-wedding-bg">
      {/* Watercolor Background — fixed so it shows through all sections */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
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
      <main className="relative z-10">
        <PhotoUpload />
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
    </Routes>
  );
}

export default App;
