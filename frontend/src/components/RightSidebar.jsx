import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

const miscLinks = [
  { label: 'Press Release', path: '#' },
  { label: 'Tenders/ RFI/ EOI', path: '#' },
  { label: 'Monthly Progress Report', path: '#' },
  { label: 'RTI', path: '#' },
  { label: 'Meteorological Data Supply', path: '#' },
];

const androidApps = [
  { name: 'Meghdoot Agro App', icon: '/images/app1.png', url: 'https://play.google.com/store/apps/details?id=com.aas.meghdoot' },
  { name: 'Damini : Lightning Alert', icon: '/images/app2.jpg', url: 'https://play.google.com/store/apps/details?id=com.lightening.live.damini' },
];

const iphoneApps = [
  { name: 'Meghdoot Agro App', icon: '/images/app1.png', url: 'https://apps.apple.com/in/app/meghdoot/id1474048155' },
  { name: 'Damini : Lightning Alert', icon: '/images/app2.jpg', url: 'https://apps.apple.com/app/id1502385645' },
];

const moesSlides = [
  { img: '/images/MOES.jpg', url: 'http://www.moes.gov.in', label: 'Ministry of Earth Sciences' },
  { img: '/images/NCMRWF.jpg', url: 'http://www.ncmrwf.gov.in', label: 'NCMRWF' },
  { img: '/images/IITM.jpg', url: 'http://www.tropmet.res.in', label: 'IITM' },
  { img: '/images/NCAOR.jpg', url: 'http://www.ncaor.gov.in', label: 'NCAOR' },
  { img: '/images/NIOT.jpg', url: 'http://niot.res.in', label: 'NIOT' },
];

function SectionHeader({ title, hindi }) {
  return (
    <div className="right-section-header">
      <span>{hindi || title}</span>
    </div>
  );
}

function AppRow({ app }) {
  return (
    <a href={app.url} target="_blank" rel="noopener noreferrer" className="app-row">
      <img src={app.icon} alt={app.name} className="app-icon" />
      <span className="app-name">{app.name}</span>
    </a>
  );
}

export default function RightSidebar() {
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx(prev => (prev + 1) % moesSlides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <aside className="right-sidebar">
      {/* Miscellaneous */}
      <SectionHeader title="Miscellaneous" />
      <div className="right-section-content">
        {miscLinks.map((link, i) => (
          <a key={i} href={link.path} className="right-sidebar-link">
            {link.label}
          </a>
        ))}
      </div>

      {/* Other Related Links */}
      <SectionHeader title="Other Related Links" />
      <div className="right-section-content right-related-links">
        <a href="http://metnet.imd.gov.in" target="_blank" rel="noopener noreferrer" className="related-link-row">
          <img src="/images/metnet_logo.png" alt="METNET" className="related-icon" />
          <span>METNET : Intra-IMD<br />E-Governance Portal</span>
        </a>
        <a href="http://india.gov.in/" target="_blank" rel="noopener noreferrer" className="related-link-row" style={{ justifyContent: 'center' }}>
          <img src="/images/indiagovin.gif" alt="National Portal of India" className="india-gov-icon" />
        </a>
      </div>

      {/* Hindi Word of the Day */}
      <SectionHeader title="आज का हिंदी शब्द" hindi="आज का हिंदी शब्द" />
      <div className="right-section-content hindi-word-section">
        <p className="hindi-word">प्रेक्षण</p>
        <p className="hindi-meaning">Observation</p>
      </div>

      {/* Applications Download Links */}
      <SectionHeader title="Applications Download Links" />
      <div className="right-section-content app-section">
        <p className="app-platform-label">For Android :</p>
        {androidApps.map((app, i) => (
          <AppRow key={`a-${i}`} app={app} />
        ))}
        <p className="app-platform-label" style={{ marginTop: '8px' }}>For iPhone/iPad :</p>
        {iphoneApps.map((app, i) => (
          <AppRow key={`i-${i}`} app={app} />
        ))}
      </div>

      {/* Other MoES Sites */}
      <SectionHeader title="Other MoES Sites" />
      <div className="right-section-content moes-slideshow">
        <a href={moesSlides[slideIdx].url} target="_blank" rel="noopener noreferrer" className="moes-slide">
          <img src={moesSlides[slideIdx].img} alt={moesSlides[slideIdx].label} className="moes-slide-img" />
          <p className="moes-slide-label">{moesSlides[slideIdx].label}</p>
        </a>
      </div>
    </aside>
  );
}
