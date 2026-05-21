import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import {
  LayoutDashboard, CloudRain, BarChart3, FileText, MessageSquare,
  Settings, Menu, X, Sun, Moon, Bell, Wifi, ChevronRight, Globe,
  Thermometer, Wind, Droplets, Eye, AlertTriangle, TrendingUp, Map, Download, Share2
} from 'lucide-react';
import { format } from 'date-fns';

import Dashboard from './pages/Dashboard';
import Observations from './pages/Observations';
import Forecast from './pages/Forecast';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Chatbot from './pages/Chatbot';
import Admin from './pages/Admin';
import { alertTicker } from './data/weatherData';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', badge: null },
  { path: '/observations', icon: CloudRain, label: 'Observations', badge: '12' },
  { path: '/forecast', icon: TrendingUp, label: 'Forecast', badge: null },
  { path: '/analytics', icon: BarChart3, label: 'Analytics', badge: null },
  { path: '/reports', icon: FileText, label: 'Reports', badge: '3' },
  { path: '/chatbot', icon: MessageSquare, label: 'AI Assistant', badge: 'NEW' },
  { path: '/admin', icon: Settings, label: 'Admin Panel', badge: null },
];

function Sidebar({ isOpen, onClose, darkMode }) {
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-full w-64 z-50 lg:relative lg:translate-x-0 sidebar-gradient border-r border-blue-900/30 flex flex-col"
        style={{ minHeight: '100vh' }}
      >
        {/* Logo area */}
        <div className="p-4 border-b border-blue-900/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 flex items-center justify-center flex-shrink-0 bg-white rounded-lg p-1 shadow-md">
              <img src="/images/combined_logo.png" alt="IMD Logo" className="w-auto h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm leading-tight">WeatherDesk</h1>
              <p className="text-blue-400 text-[10px] leading-tight">RMC Nagpur • v2.5.1</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-400 pulse-dot"></div>
            <span className="text-green-400 font-medium">System Online</span>
            <span className="ml-auto text-blue-500">LIVE</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest">Main Menu</span>
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 mb-1 rounded-lg transition-all duration-200 text-sm ${
                  isActive
                    ? 'nav-active font-semibold'
                    : 'text-blue-300 hover:bg-blue-900/30 hover:text-white'
                }`
              }
              onClick={() => window.innerWidth < 1024 && onClose()}
            >
              <item.icon size={17} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  item.badge === 'NEW'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-blue-600/30 text-blue-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}

          {/* Quick Links */}
          <div className="px-3 mt-6 mb-2">
            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest">Quick Links</span>
          </div>
          {[
            { label: 'IMD Nagpur Website', url: 'https://www.imdnagpur.gov.in' },
            { label: 'Observations Page', url: 'https://www.imdnagpur.gov.in/pages/observations.php' },
            { label: 'India Met Dept', url: 'https://mausam.imd.gov.in' },
          ].map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-xs text-blue-400 hover:text-blue-200 hover:bg-blue-900/20 transition-all"
            >
              <Globe size={13} />
              <span className="truncate">{link.label}</span>
              <ChevronRight size={11} className="ml-auto flex-shrink-0" />
            </a>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-blue-900/30">
          <div className="glass-light rounded-lg p-3">
            <p className="text-[10px] text-blue-400 font-medium mb-1">Data as of</p>
            <p className="text-xs text-white font-semibold">{format(new Date(), 'dd MMM yyyy, HH:mm')} IST</p>
            <p className="text-[10px] text-blue-400 mt-1">Source: RMC Nagpur / IMD</p>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function Header({ onMenuClick, darkMode, setDarkMode }) {
  const [time, setTime] = useState(new Date());
  const [tickerIdx, setTickerIdx] = useState(0);
  const [notifications, setNotifications] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const ticker = setInterval(() => {
      setTickerIdx(i => (i + 1) % alertTicker.length);
    }, 8000);
    return () => clearInterval(ticker);
  }, []);

  return (
    <div className="sticky top-0 z-30">
      {/* ═══ OFFICIAL RMC NAGPUR BANNER (Exact Replica) ═══ */}
      <div
        className="w-full relative"
        style={{
          backgroundImage: 'url(/images/bg3.jpg)',
          backgroundSize: 'cover',
          borderBottom: 'none'
        }}
      >
        <div className="flex items-center justify-between min-h-[70px] w-full px-2">
          {/* LEFT: Combined Emblem & Logo */}
          <div className="flex-shrink-0 flex items-center justify-end" style={{ width: '100px', padding: '3px' }}>
            <img src="/images/combined_logo.png" alt="Government of India / IMD Logo"
              className="h-[80px] border-0" style={{ padding: '7px' }}
              onError={e => { e.target.style.display = 'none'; }} />
          </div>

          {/* CENTER: Title */}
          <div className="flex-1 text-center py-2 flex flex-col items-center justify-center">
            <h1 style={{
              fontSize: '34px', color: '#99FF0', fontWeight: 'bold',
              textShadow: '2px 2px #FF6633', letterSpacing: '2px',
              fontFamily: 'courier'
            }}>
              Regional Meteorological Centre, Nagpur
            </h1>
            <h2 style={{
              fontSize: '18px', color: '#003399', fontWeight: 'bold',
              fontFamily: 'courier', marginTop: '2px'
            }}>
              India Meteorological Department, Ministry of Earth Sciences
            </h2>
            <h3 style={{
              fontSize: '18px', color: '#330000', fontWeight: 'bold',
              fontFamily: 'courier', marginTop: '2px'
            }}>
              Government of India
            </h3>
          </div>

          {/* RIGHT: 150 Years IMD */}
          <div className="flex items-center flex-shrink-0">
             <div style={{ width: '100px', padding: '3px' }} className="flex items-center justify-center">
                <img src="/images/imd150t.png" alt="150 Years IMD"
                  className="h-[75px] border-0" style={{ padding: '7px' }}
                  onError={e => { e.target.style.display = 'none'; }} />
             </div>
          </div>
        </div>
      </div>

      {/* ═══ DARK BLUE NAV BAR ═══ */}
      <div style={{
        backgroundColor: '#0a2a5e', // Attempting to match the dark blue from the screenshot
        borderBottom: '1px solid #1a3a6e',
      }}>
        <div className="flex items-center justify-between px-3 py-1">
          <button onClick={onMenuClick}
            className="lg:hidden p-1.5 rounded text-blue-300 hover:bg-blue-900/40 hover:text-white transition-all">
            <Menu size={16} />
          </button>

          <div className="hidden lg:flex items-center gap-0 text-[11px] font-semibold flex-1">
            {[
              { label: 'HOME', path: '/' },
              { label: 'OBSERVATIONS', path: '/observations' },
              { label: 'FORECAST', path: '/forecast' },
              { label: 'ANALYTICS', path: '/analytics' },
              { label: 'REPORTS', path: '/reports' },
              { label: 'AI ASSISTANT', path: '/chatbot' },
              { label: 'ADMIN', path: '/admin' },
            ].map(item => (
              <NavLink key={item.path} to={item.path} end={item.path === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 transition-all border-r border-blue-800/40 tracking-wide ${
                    isActive ? 'bg-blue-600/30 text-cyan-300' : 'text-blue-200 hover:bg-blue-800/40 hover:text-white'
                  }`
                }>
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button className="relative p-1.5 rounded text-blue-300 hover:bg-blue-900/40 transition-all"
              onClick={() => toast.success('3 new weather alerts.', {
                icon: '🔔', style: { background: '#0f2847', color: '#e2e8f0', border: '1px solid #3b82c4' }
              })}>
              <Bell size={14} />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                  {notifications}
                </span>
              )}
            </button>
            <button onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded text-blue-300 hover:bg-blue-900/40 transition-all">
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded text-[10px]"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
              <span className="text-green-400 font-semibold">LIVE</span>
            </div>
            <div className="hidden md:flex items-center gap-1 px-2 py-1 text-[10px] text-blue-400">
              <span className="text-blue-500">हिंदी</span>
              <span className="text-blue-700">|</span>
              <span className="text-blue-300">Hindi</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ALERT TICKER ═══ */}
      <div className="bg-gradient-to-r from-red-900/80 via-orange-900/60 to-red-900/80 border-b border-red-700/30 py-1 px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <AlertTriangle size={12} className="text-red-400 animate-pulse" />
            <span className="text-red-300 text-[11px] font-bold tracking-wider uppercase">Alert</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p key={tickerIdx}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4 }}
                className="text-orange-200 text-[11px] font-medium truncate">
                {alertTicker[tickerIdx]}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
            <Wifi size={11} className="text-green-400" />
            <span className="text-green-400 text-[10px] font-semibold">LIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageBreadcrumb() {
  const location = useLocation();
  const item = navItems.find(n => {
    if (n.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(n.path);
  });
  return <span className="text-white font-semibold text-sm">{item?.label || 'Dashboard'}</span>;
}

function Footer() {
  return (
    <footer className="border-t border-blue-900/30 mt-auto">
      <div className="bg-gradient-to-r from-[#050d1a] via-[#0c1b33] to-[#050d1a] py-6 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div>
            <h4 className="text-amber-400 font-semibold mb-3">Regional Meteorological Centre</h4>
            <p className="text-blue-400 leading-relaxed">
              Regional Meteorological Centre, Nagpur<br />
              India Meteorological Department<br />
              Ministry of Earth Sciences<br />
              Government of India
            </p>
          </div>
          <div>
            <h4 className="text-blue-300 font-semibold mb-3">Official Links</h4>
            <div className="space-y-1.5">
              {[
                ['IMD Nagpur', 'https://www.imdnagpur.gov.in'],
                ['Observations', 'https://www.imdnagpur.gov.in/pages/observations.php'],
                ['India Met Dept', 'https://mausam.imd.gov.in'],
                ['Ministry of Earth Sciences', 'https://www.moes.gov.in'],
              ].map(([label, url]) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-blue-400 hover:text-cyan-300 transition-colors">
                  <ChevronRight size={10} />
                  {label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-blue-300 font-semibold mb-3">Internship Project</h4>
            <p className="text-blue-400 leading-relaxed">
              Developed as part of Internship Project at<br />
              <strong className="text-amber-300">Regional Meteorological Centre, Nagpur</strong><br />
              <span className="text-cyan-400">25 May 2026 – 30 June 2026</span>
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 pulse-dot"></div>
              <span className="text-green-400 font-medium">WeatherDesk v2.5.1 • MVP Prototype</span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-blue-900/30 text-center text-[10px] text-blue-600">
          © 2026 Regional Meteorological Centre, Nagpur | India Meteorological Department | Ministry of Earth Sciences | Government of India
        </div>
      </div>
    </footer>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    toast.success('WeatherDesk connected to RMC Nagpur data feed', {
      duration: 4000,
      icon: '🛰️',
      style: { background: '#0f2847', color: '#e2e8f0', border: '1px solid #3b82c4' }
    });
  }, []);

  return (
    <Router>
      <div className={`min-h-screen ${darkMode ? '' : 'light-mode'}`}
        style={{ background: darkMode ? '#050d1a' : '#f0f4f8' }}>
        <Toaster position="top-right" />
        <div className="flex" style={{ minHeight: '100vh' }}>
          {/* Sidebar */}
          <div className="hidden lg:block flex-shrink-0">
            <Sidebar isOpen={true} onClose={() => {}} darkMode={darkMode} />
          </div>
          {/* Mobile sidebar */}
          <div className="lg:hidden">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} darkMode={darkMode} />
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0">
            <Header
              onMenuClick={() => setSidebarOpen(true)}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
            />
            <main className="flex-1 overflow-auto">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/observations" element={<Observations />} />
                  <Route path="/forecast" element={<Forecast />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/chatbot" element={<Chatbot />} />
                  <Route path="/admin" element={<Admin />} />
                </Routes>
              </AnimatePresence>
            </main>
            <Footer />
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
