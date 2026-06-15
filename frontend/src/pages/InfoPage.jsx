import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { FileText, ExternalLink } from 'lucide-react';

const pageInfo = {
  '/forecast/regional': {
    title: 'Regional Weather Forecast',
    description: 'Weather forecast for Vidarbha, Marathwada, and other regions under RMC Nagpur jurisdiction.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/rwf.php',
  },
  '/forecast/precipitation': {
    title: 'Precipitation Forecast For Districts of Vidarbha Region (Maharashtra)',
    description: 'District-wise precipitation forecast including expected rainfall intensity for all districts of Vidarbha region.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/drf_forecast.php',
  },
  '/forecast/warning': {
    title: 'Warning Forecast For Districts of Vidarbha Region (Maharashtra)',
    description: 'Weather warnings issued for districts of Vidarbha region including thunderstorm, heavy rainfall, and heatwave warnings.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/drf.php',
  },
  '/forecast/districtwise': {
    title: 'Districtwise Forecast and Warnings',
    description: 'Detailed forecast and warnings for each district under RMC Nagpur.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/dfw.php',
  },
  '/forecast/local': {
    title: 'Local (City) Weather Forecast',
    description: 'Local weather forecast for cities in the Vidarbha region.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/localweatherfc.php',
  },
  '/forecast/city': {
    title: 'City Weather Forecast',
    description: 'Detailed weather forecast for major cities.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/cwf.php',
  },
  '/forecast/agromet': {
    title: 'Agromet Advisories',
    description: 'Weather-based agricultural advisories for the Vidarbha region.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/agromet_main.php',
  },
  '/forecast/block': {
    title: 'Block Level Forecast',
    description: 'Block-level weather forecast for granular local predictions.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/blf.php',
  },
  '/forecast/extended': {
    title: 'Extended Range Forecast',
    description: 'Extended range weather forecast for medium to long-term planning.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/erf.php',
  },
  '/forecast/impact': {
    title: 'Impact Based Forecast',
    description: 'Impact-based weather forecasting for disaster preparedness.',
    externalLink: 'https://mausam.imd.gov.in/nagpur/mcdata/ibf.pdf',
  },
  '/reports/drms': {
    title: 'DRMS Rainfall Report',
    description: 'District Rainfall Monitoring System (DRMS) rainfall reports for Vidarbha region.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/rainfall_drms.php',
  },
  '/reports/rainfall': {
    title: 'Rainfall Activity',
    description: 'Rainfall activity monitoring and reports across the region.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/rainfall_activity.php',
  },
  '/reports/daily': {
    title: 'Regional Daily Weather Report',
    description: 'Daily weather report for the region with comprehensive observations.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/rdwr.php',
  },
  '/reports/weekly': {
    title: 'Weekly Weather Report',
    description: 'Weekly weather summary and analysis report.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/wwr.php',
  },
  '/reports/seasonal': {
    title: 'Seasonal Data (Graphical)',
    description: 'Graphical representation of seasonal weather data including temperature and rainfall trends.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/seasonal_data.php',
  },
  '/reports/climatic': {
    title: 'Climatic Features',
    description: 'Climatic features and climatological data for the region.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/climatic_features.php',
  },
  '/dss': {
    title: 'Internal DSS',
    description: 'Decision Support System for Forecasting Officers.',
    externalLink: null,
  },
  '/about/history': {
    title: 'History',
    description: 'History of Regional Meteorological Centre, Nagpur.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/about_history.php',
  },
  '/about/organisation': {
    title: 'Organisation Structure',
    description: 'Organisational structure of RMC Nagpur.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/about_organisation.php',
  },
  '/about/network': {
    title: 'Network of Observatories',
    description: 'Network of meteorological observatories under RMC Nagpur.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/obs_network.php',
  },
  '/about/exddgms': {
    title: 'Ex-DDGMs of RMC Nagpur',
    description: 'Former Deputy Director General of Meteorology at RMC Nagpur.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/about_ex_ddgms.php',
  },
  '/about/mandate': {
    title: 'IMD Mandate',
    description: 'Mandate of India Meteorological Department.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/about_mandate.php',
  },
  '/about/services': {
    title: 'IMD Weather Services',
    description: 'Weather services provided by India Meteorological Department.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/about_services.php',
  },
  '/contact': {
    title: 'Contact Us',
    description: 'Contact information for Regional Meteorological Centre, Nagpur.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/contactus.php',
  },
  '/rti': {
    title: 'Right to Information',
    description: 'Right to Information (RTI) details for RMC Nagpur.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/rti.php',
  },
  '/grievance': {
    title: 'Grievance Redressal',
    description: 'Grievance redressal mechanism.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/grievance.php',
  },
  '/disclaimer': {
    title: 'Disclaimer',
    description: 'Disclaimer for the website.',
    externalLink: 'https://www.imdnagpur.gov.in/pages/disclaimer.php',
  },
};

export default function InfoPage() {
  const location = useLocation();
  const info = pageInfo[location.pathname] || {
    title: 'Page',
    description: 'This page is under development.',
    externalLink: null,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="info-page"
    >
      <div className="info-page-card">
        <div className="info-page-icon">
          <FileText size={32} />
        </div>
        <h2 className="info-page-title">{info.title}</h2>
        <p className="info-page-desc">{info.description}</p>
        {info.externalLink && (
          <a
            href={info.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="info-page-link"
          >
            <ExternalLink size={14} />
            <span>View on Official IMD Nagpur Website</span>
          </a>
        )}
      </div>
    </motion.div>
  );
}
