import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

const sidebarSections = [
  {
    title: 'Weather Analysis',
    defaultOpen: true,
    items: [
      { label: 'Weather Dashboard', path: '/dashboard' },
      { label: "Today's Observations", path: '/observations' },
      { label: 'All India Weather Bulletin', href: 'https://mausam.imd.gov.in/imd_latest/contents/all_india_forcast_bulletin.php' },
    ],
  },
  {
    title: 'Forecasts & Warnings',
    defaultOpen: true,
    items: [
      { label: 'Regional Weather Forecast', path: '/forecast/regional' },
      { label: 'Precipitation Forecast For Districts of Vidarbha Region (Maharashtra)', path: '/forecast/precipitation' },
      { label: 'Warning Forecast For Districts of Vidarbha Region (Maharashtra)', path: '/forecast/warning' },
      { label: 'Districtwise Forecast and Warnings', path: '/forecast/districtwise' },
      { label: 'Local (City) Weather Forecast', path: '/forecast/local' },
      { label: 'City Weather Forecast', path: '/forecast/city' },
      { label: 'Agromet Advisories', path: '/forecast/agromet' },
      { label: 'Highway Forecast', href: 'http://imdmumbai.gov.in/english/pdf/highwayFC.pdf' },
      { label: 'Block Level Forecast', path: '/forecast/block' },
      { label: 'Extended Range Forecast', path: '/forecast/extended' },
      { label: 'Impact Based Forecast', path: '/forecast/impact' },
    ],
  },
  {
    title: 'Reports',
    defaultOpen: true,
    items: [
      { label: 'DRMS Rainfall Report', path: '/reports/drms' },
      { label: 'Rainfall Activity', path: '/reports/rainfall' },
      { label: 'Regional Daily Weather Report', path: '/reports/daily' },
      { label: 'Weekly Weather Report', path: '/reports/weekly' },
      { label: 'Seasonal Data (Graphical)', path: '/reports/seasonal' },
      { label: 'Climatic Features', path: '/reports/climatic' },
    ],
  },
  {
    title: 'Forecasting Officer',
    defaultOpen: false,
    items: [
      { label: 'Internal DSS', path: '/dss' },
    ],
  },
  {
    title: "Do's & Dont's",
    defaultOpen: false,
    items: [
      { label: 'Cyclone', href: '#', doc: true },
      { label: 'Drought', href: '#', doc: true },
      { label: 'Flood', href: '#', doc: true },
      { label: 'Thunderstorm & Lightning', href: '#', doc: true },
      { label: 'Cold wave', href: '#', doc: true },
      { label: 'Heat wave', href: '#', doc: true },
    ],
  },
  {
    title: 'FAQs',
    defaultOpen: false,
    items: [
      { label: 'Thunderstorm & Lightning (English)', href: '#', doc: true },
      { label: 'Thunderstorm & Lightning (Marathi)', href: '#', doc: true },
    ],
  },
  {
    title: 'Departmental Website',
    defaultOpen: false,
    href: 'https://mausam.imd.gov.in',
    items: [],
  },
];

function AccordionSection({ section }) {
  const [isOpen, setIsOpen] = useState(section.defaultOpen);

  // If this section is just a link (Departmental Website)
  if (section.href && section.items.length === 0) {
    return (
      <a
        href={section.href}
        target="_blank"
        rel="noopener noreferrer"
        className="sidebar-section-header flex items-center justify-between"
      >
        <span>{section.title}</span>
        <ExternalLink size={12} className="opacity-60" />
      </a>
    );
  }

  return (
    <div className="sidebar-section">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sidebar-section-header w-full text-left flex items-center justify-between"
      >
        <span>{section.title}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="sidebar-items overflow-hidden"
          >
            {section.items.map((item, idx) => (
              <li key={idx} className="sidebar-item">
                {item.path ? (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                    }
                  >
                    {item.label}
                  </NavLink>
                ) : (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-link sidebar-link-external"
                  >
                    {item.label}
                    {item.doc && <ExternalLink size={10} className="inline ml-1 opacity-50" />}
                  </a>
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LeftSidebar() {
  const [visitorCount] = useState(963388);

  return (
    <aside className="left-sidebar">
      {sidebarSections.map((section, idx) => (
        <AccordionSection key={idx} section={section} />
      ))}

      {/* Visitor Counter */}
      <div className="sidebar-visitor-counter">
        <p className="visitor-label">Visitors since 01 December 2016</p>
        <div className="visitor-count">
          <span className="visitor-icon">👥</span>
          <span className="visitor-number">{visitorCount.toLocaleString()}</span>
        </div>
      </div>
    </aside>
  );
}
