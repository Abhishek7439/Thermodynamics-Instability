# Thermodynamic Instability Dashboard

A pure frontend web dashboard designed to fetch, parse, and visualize real atmospheric sounding data from the University of Wyoming Upper Air Sounding website. It targets multiple meteorological stations (specifically Indian Subcontinent stations by default), extracting 25 key thermodynamic instability indices, and presenting them in a beautiful, premium glassmorphism interface.

## Features

- **No Backend Required:** Runs entirely in the browser using HTML5, Vanilla JS, and CSS3. Uses `corsproxy.io` to bypass CORS restrictions when fetching data.
- **Data Parsing:** Automatically parses HTML `<pre>` tags using regular expressions to extract exactly 25 indices.
- **Severity Color Coding:** Automatically evaluates index values against severe weather thresholds (Stable = Green, Moderate = Amber, Unstable = Red).
- **Comparison & Time Series Charts:** Built-in `Chart.js` integration for comparing indices across stations or visualizing them over a date range.
- **1-Click Excel Export:** Leverages `xlsx-js-style` to generate native `.xlsx` files entirely client-side. The exported Excel file includes:
  - A consolidated Summary Sheet.
  - Dedicated sheets per station.
  - Native Excel cell background colors corresponding to the severity color coding.

## How to Run

1. Open `index.html` in any modern web browser. 
2. No server installation is required. However, for the best experience (and to prevent local file CORS issues in some browsers), you can serve the directory using a simple HTTP server.
   
```bash
# Using Python 3
python -m http.server 8000
```
Then visit `http://localhost:8000`

## Tech Stack
- Vanilla HTML / CSS / JS
- [Chart.js](https://www.chartjs.org/) for data visualization
- [xlsx-js-style](https://git.sheetjs.com/SheetJS/sheetjs) for styled Excel exports
- [FontAwesome](https://fontawesome.com/) for icons

## Project Structure
- `index.html` - The main dashboard UI
- `style.css` - Premium design system (dark mode, glassmorphism)
- `app.js` - Main orchestration (event listeners, state, fetching)
- `parser.js` - Sounding data text parsing and index extraction logic
- `stations.js` - Predefined target stations and custom station logic
- `charts.js` - Chart rendering logic
- `exporter.js` - SheetJS export logic (workbooks, colors, styling)
