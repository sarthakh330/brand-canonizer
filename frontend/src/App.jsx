/**
 * Main App Component
 * Router setup and navigation
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Processing from './pages/Processing';
import ReportViewer from './pages/ReportViewer';
import Inspirations from './pages/Inspirations';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/processing/:sessionId" element={<Processing />} />
        <Route path="/brand/:brandId" element={<ReportViewer />} />
        <Route path="/inspirations" element={<Inspirations />} />
      </Routes>
    </Router>
  );
}
