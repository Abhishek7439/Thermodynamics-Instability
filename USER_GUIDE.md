# Thermodynamic Instability Dashboard – User Guide

Welcome to the Thermodynamic Instability Dashboard! This guide will walk you through how to fetch, view, analyze, and export atmospheric sounding data for Indian meteorological stations.

---

## 1. Accessing the Dashboard
Since you are already running the local server (`python -m http.server 8000`), simply open your web browser and go to:
**[http://localhost:8000](http://localhost:8000)**

---

## 2. Step-by-Step Usage

### Step 1: Select Date Range
At the top left of the dashboard, you will see a **Date Range** selector.
- Click the first date box to select your **Start Date**.
- Click the second date box to select your **End Date**.
- *Note: You can select the same date for both boxes if you only want to look at a single day.*

### Step 2: Select Observation Time
Next to the dates, you can choose the observation times (UTC):
- **00Z (05:30 IST):** Morning sounding.
- **12Z (17:30 IST):** Evening sounding.
- You can select either one or both checkboxes. If you select both, the dashboard will fetch two datasets per station per day.

### Step 3: Select Stations
Click on the **Stations Dropdown**:
- **Pre-defined Stations:** Check the boxes next to the cities you want to monitor (e.g., Nagpur, Raipur, New Delhi).
- **Add Custom Station:** If a station you need is not on the list, type its WMO Number (e.g., `42867`) into the text box at the bottom of the dropdown menu and click the **`+`** button. It will be added to your list so you can select it.

### Step 4: Fetch Data
Once your parameters are set, click the blue **Fetch Data** button on the top right.
- You will see the status cards appear on the screen with a "Loading" animation. 
- The dashboard is currently connecting to the University of Wyoming database to parse the soundings. Wait for the cards to display **Success** or **No Data**.

---

## 3. Viewing the Results

### The Status Cards
At the top of the main window, you will see a row of cards for each selected station.
- **Green Border:** Data was successfully fetched and parsed.
- **Red Border:** The data for that specific time/date was missing on the Wyoming server or encountered an error.

### Table View (Default)
The **Table View** tab provides a detailed breakdown of all 25 thermodynamic indices. 
- **Columns:** Represent the Station name alongside the Date and Time (e.g., `Nagpur (2026-06-15 00Z)`).
- **Rows:** Represent the specific index (e.g., Showalter index, CAPE, K index).
- **Color Coding:** The table cells automatically change color based on the severity of the index to help forecasters quickly identify instability:
  - 🟢 **Green (Stable):** Safe/Stable atmospheric conditions.
  - 🟡 **Amber (Moderate):** Moderate instability / potential for weather development.
  - 🔴 **Red (Unstable):** High instability / severe weather likely.
  - *Grey ("—"):* Indicates the data was not recorded for that sounding.

### Chart View
Click the **Chart View** tab to visually analyze the data.
1. **Station Comparison (Bar Chart):** 
   - Use the dropdown to select a specific index (like `Convective Available Potential Energy`).
   - The bar chart will compare that specific index across all your selected stations for easy visual contrast. The bars share the same severity color coding as the table.
2. **Time Series (Line Chart):**
   - If you selected a multi-day date range, use this chart to track how an index has changed over time. Each station is represented by a different colored line.

---

## 4. Exporting to Excel

Once your data has been fetched, the green **Export to Excel** button at the top right becomes active. Click it to generate an Excel report.

**What's inside the `.xlsx` file?**
- **Summary Sheet:** A master list containing every single sounding you pulled, with 25 columns representing the indices.
- **Station Sheets:** You will find an individual tab (sheet) at the bottom for every selected station. 
- **Color Formatting:** The Excel sheets retain the exact Green/Amber/Red severity background fills from the dashboard, making it immediately ready for reporting and presentations!

---

## Troubleshooting
- **"No Data" Error:** This usually means the University of Wyoming website did not have a sounding recorded for that specific station at that exact date and time.
- **Stuck on "Fetching...":** Ensure you are connected to the internet. The dashboard relies on a proxy (`corsproxy.io`) to fetch cross-domain data, which occasionally experiences slight delays if traffic is heavy. Just give it a few extra seconds.
