import { Routes, Route } from 'react-router-dom';

import Navigation from './sections/Navigation';
import PhotoUpload from './sections/PhotoUpload';
import Admin from './pages/Admin';

import './App.css';

function MainContent() {

  return (
    <div className="relative min-h-screen" style={{ background: '#F5EFE4' }}>

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
