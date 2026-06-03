import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import headerBg from './assets/bg3.jpg';
import emblemLogo from './assets/emblem.gif';
import imd150tLogo from './assets/imd150t.png';
import imdLogoc from './assets/imd_logoc.gif';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { Menu, X, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import Home from './pages/Home';
import Observations from './pages/Observations';
import Forecast from './pages/Forecast';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import InfoPage from './pages/InfoPage';

/* ═══════════════════════════════════════════════════
   TOP NAVIGATION DROPDOWN DATA
   Matches official www.imdnagpur.gov.in exactly
   ═══════════════════════════════════════════════════ */
const topNavItems = [
  { label: 'H O M E', path: '/' },
  { label: 'IMD Website for General Public', href: 'https://mausam.imd.gov.in' },
  {
    label: 'About RMC Nagpur',
    children: [
      { label: 'History', path: '/about/history' },
      { label: 'Organisation Structure', path: '/about/organisation' },
      { label: 'Network of Observatories', path: '/about/network' },
      { label: 'Ex-DDGMs of RMC Nagpur', path: '/about/exddgms' },
    ],
  },
  {
    label: 'About MoES & IMD',
    children: [
      { label: "Hon'ble Ministers", href: 'https://mausam.imd.gov.in/imd_latest/contents/honable_minister.php' },
      { label: 'Secretary, MOES', href: 'https://mausam.imd.gov.in/imd_latest/contents/secretory_moes.php' },
      { label: 'Director General, IMD', href: 'https://mausam.imd.gov.in/imd_latest/contents/dgm.php' },
      { label: 'IMD Mandate', path: '/about/mandate' },
      { label: 'IMD Weather Services', path: '/about/services' },
      { label: 'IMD Directory', href: 'http://metnet.imd.gov.in/imddir/' },
      { label: 'Ex-DGMs of IMD', href: 'http://metnet.imd.gov.in/imdpis/imdweb_list_of_dgms.php' },
    ],
  },
  {
    label: 'Publications',
    children: [
      { label: 'IMD News', href: 'http://metnet.imd.gov.in/phps/imdweb_imdnews.php' },
      { label: 'MAUSAM Journal', path: '/info' },
      { label: 'ऋतुरंग', path: '/info' },
      { label: 'Climatology', path: '/info' },
    ],
  },
  {
    label: 'Miscellaneous',
    children: [
      { label: 'Right to Information', path: '/rti' },
      { label: "Citizen's/Client's Charter", href: 'https://mausam.imd.gov.in/imd_latest/contents/citizen_charter.php' },
      { label: 'Grievance Redressal', path: '/grievance' },
      { label: 'Sexual Harassment Complaint', path: '/info' },
    ],
  },
  {
    label: "Do's & Dont's",
    children: [
      { label: 'Cyclone', href: '#' },
      { label: 'Drought', href: '#' },
      { label: 'Flood', href: '#' },
      { label: 'Thunderstorm & Lightning', href: '#' },
      { label: 'Cold wave', href: '#' },
      { label: 'Heat wave', href: '#' },
    ],
  },
  {
    label: 'FAQs',
    children: [
      { label: 'Thunderstorm & Lightning (English)', href: '#' },
      { label: 'Thunderstorm & Lightning (Marathi)', href: '#' },
    ],
  },
  { label: 'Contact Us', path: '/contact' },
];

/* ═══════════════════════════════════════════════════
   DROPDOWN NAV ITEM COMPONENT
   ═══════════════════════════════════════════════════ */
function NavDropdown({ item }) {
  const [open, setOpen] = useState(false);

  if (item.path) {
    return (
      <NavLink
        to={item.path}
        end={item.path === '/'}
        className={({ isActive }) =>
          `topnav-item ${isActive ? 'topnav-active' : ''}`
        }
      >
        {item.label}
      </NavLink>
    );
  }

  if (item.href) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className="topnav-item">
        {item.label}
      </a>
    );
  }

  if (item.children) {
    return (
      <div
        className="topnav-dropdown-wrapper"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <button className="topnav-item topnav-has-children">
          {item.label}
          <ChevronDown size={10} className="ml-1 inline" />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="topnav-dropdown"
            >
              {item.children.map((child, i) =>
                child.path ? (
                  <NavLink
                    key={i}
                    to={child.path}
                    className="topnav-dropdown-item"
                    onClick={() => setOpen(false)}
                  >
                    {child.label}
                  </NavLink>
                ) : (
                  <a
                    key={i}
                    href={child.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="topnav-dropdown-item"
                    onClick={() => setOpen(false)}
                  >
                    {child.label}
                  </a>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}

/* ═══════════════════════════════════════════════════
   OFFICIAL HEADER BANNER
   ═══════════════════════════════════════════════════ */
function OfficialHeader() {
  return (
    <div
      className="official-header"
      style={{ backgroundImage: `url(${headerBg})`, backgroundSize: 'cover' }}
    >
      <div className="official-header-inner">
        <img src={emblemLogo} alt="Emblem" className="header-logo header-emblem" />
        <div className="header-text-center">
          <div className="header-title">Regional Meteorological Centre, Nagpur</div>
          <div className="header-subtitle">India Meteorological Department, Ministry of Earth Sciences</div>
          <div className="header-subtitle-2">Government of India</div>
        </div>
        <img src={imd150tLogo} alt="150 Years IMD" className="header-logo header-imd150" />
        <img src={imdLogoc} alt="IMD Logo" className="header-logo header-imdlogo" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TOP NAVIGATION BAR
   ═══════════════════════════════════════════════════ */
function TopNavBar({ onMenuClick }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="topnav-bar">
      {/* Date/Time */}
      <div className="topnav-datetime">
        <b>{format(time, 'EEEE, dd MMMM yyyy')}</b>
        <br />
        <b>{format(time, 'hh:mm:ss a')} IST</b>
      </div>

      {/* Nav Items */}
      <div className="topnav-items">
        <button className="topnav-mobile-toggle" onClick={onMenuClick}>
          <Menu size={18} />
        </button>
        <div className="topnav-items-inner">
          {topNavItems.map((item, i) => (
            <NavDropdown key={i} item={item} />
          ))}
        </div>
      </div>

      {/* Hindi Switch */}
      <div className="topnav-hindi">
        <span className="hindi-text">हिन्दी</span> / <span>Hindi</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="official-footer">
      <div className="footer-inner">
        <a href="#/disclaimer" className="footer-link">Disclaimer</a>
        <span className="footer-sep">|</span>
        <a href="#/info" className="footer-link">Website Details</a>
      </div>
      <div className="footer-copyright">
        © {new Date().getFullYear()} Regional Meteorological Centre, Nagpur | India Meteorological Department | Ministry of Earth Sciences | Government of India
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════
   ANIMATED PAGE WRAPPER
   ═══════════════════════════════════════════════════ */
function AnimatedPage({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN APP COMPONENT
   ═══════════════════════════════════════════════════ */
function AppContent() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="app-root">
      <Toaster position="top-right" />

      {/* Official Header Banner */}
      <OfficialHeader />

      {/* Top Navigation Bar */}
      <TopNavBar onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mobile-overlay"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Three-column layout */}
      <div className="three-col-layout">
        {/* Left Sidebar */}
        <div className={`left-sidebar-wrapper ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
          <button
            className="mobile-close-btn"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X size={18} />
          </button>
          <LeftSidebar />
        </div>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/observations" element={<Observations />} />
            <Route path="/forecast/regional" element={<Forecast />} />
            <Route path="/reports/seasonal" element={<Analytics />} />
            <Route path="/reports/daily" element={<Reports />} />
            <Route path="/reports/weekly" element={<Reports />} />
            {/* All other routes use InfoPage */}
            <Route path="/forecast/*" element={<InfoPage />} />
            <Route path="/reports/*" element={<InfoPage />} />
            <Route path="/dss" element={<InfoPage />} />
            <Route path="/about/*" element={<InfoPage />} />
            <Route path="/contact" element={<InfoPage />} />
            <Route path="/rti" element={<InfoPage />} />
            <Route path="/grievance" element={<InfoPage />} />
            <Route path="/disclaimer" element={<InfoPage />} />
            <Route path="/info" element={<InfoPage />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>

        {/* Right Sidebar */}
        <div className="right-sidebar-wrapper">
          <RightSidebar />
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
