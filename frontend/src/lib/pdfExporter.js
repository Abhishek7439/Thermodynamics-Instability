// ============================================================
// PDF EXPORTER — RMC Nagpur FMS
// Uses html2canvas + jsPDF to render hidden print-layout divs
// into publication-ready A4 PDFs.
// ============================================================

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Export a DOM element to PDF.
 *
 * @param {string} elementId  - ID of the hidden print-layout div
 * @param {string} filename   - e.g. 'RDWR_11-06-2026.pdf'
 * @param {object} [options]
 * @param {string} [options.orientation] - 'portrait' | 'landscape' (default: 'portrait')
 */
export async function exportToPDF(elementId, filename, options = {}) {
  const el = document.getElementById(elementId);
  if (!el) {
    console.error(`PDF export: element #${elementId} not found`);
    return;
  }

  const { orientation = 'portrait' } = options;

  // Temporarily make visible for capture
  const prevDisplay = el.style.display;
  const prevPosition = el.style.position;
  el.style.display = 'block';
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  el.style.top = '0';

  try {
    const canvas = await html2canvas(el, {
      scale: 2,           // High DPI for crisp text
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

    const pdfW = orientation === 'portrait' ? 210 : 297;
    const pdfH = orientation === 'portrait' ? 297 : 210;

    const canvasW = canvas.width;
    const canvasH = canvas.height;
    const ratio   = pdfW / (canvasW / 2); // account for scale:2
    const imgH    = (canvasH / 2) * ratio;

    // Multi-page handling
    let yPos = 0;
    while (yPos < imgH) {
      if (yPos > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, -yPos, pdfW, imgH);
      yPos += pdfH;
    }

    pdf.save(filename);
  } finally {
    // Restore original visibility
    el.style.display = prevDisplay;
    el.style.position = prevPosition;
    el.style.left = '';
    el.style.top = '';
  }
}

/**
 * Open a print-layout element in a new browser tab as HTML.
 *
 * @param {string} elementId  - ID of the hidden print-layout div
 * @param {string} title      - Page title
 */
export function openAsHTML(elementId, title = 'Report') {
  const el = document.getElementById(elementId);
  if (!el) return;

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, sans-serif; }
    @media print { body { margin: 0; } }
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
  </style>
</head>
<body>${el.innerHTML}</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
