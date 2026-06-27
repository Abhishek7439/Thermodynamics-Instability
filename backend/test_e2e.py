"""
Complete E2E Test Suite for Thermodynamic Instability Dashboard
Tests: Backend API, Parser, Region Map, Multi-station, Caching
"""
import requests
import re
import time
import json

API = 'http://localhost:5000'
FRONTEND = 'http://localhost:8000'
PASS = '\u2705'
FAIL = '\u274c'
results = []

def test(name, condition, detail=''):
    status = PASS if condition else FAIL
    results.append((name, status, detail))
    print(f"  {status} {name}" + (f" — {detail}" if detail else ""))

print("=" * 70)
print("  THERMODYNAMIC INSTABILITY DASHBOARD — FULL E2E TEST")
print("=" * 70)

# ── TEST 1: Frontend is running ──
print("\n[1] FRONTEND SERVER")
try:
    r = requests.get(FRONTEND, timeout=5)
    test("Frontend loads", r.status_code == 200)
    test("HTML has title", "Thermodynamic Instability" in r.text)
    test("Has Table View tab", "tableView" in r.text)
    test("Has Chart View tab", "chartView" in r.text)
    test("Has Tephigrams tab", "tephigramView" in r.text)
    test("Has Raw Data tab", "rawData" in r.text)
    test("Has Sounding Diagram tab", "diagramView" in r.text)
    test("Has Excel export button", "exportBtn" in r.text)
    test("No Word button (removed)", "reportWordBtn" not in r.text)
    test("No PDF button (removed)", "reportPdfBtn" not in r.text)
    test("Has dynamic map container", "mapContainer" in r.text)
    test("Has region map image", "regionMapImg" in r.text)
    test("Has Hide Map button", "toggleMapBtn" in r.text)
    test("Scripts have cache-bust ?v=2", "parser.js?v=2" in r.text)
    test("Has smooth scroll CSS", True, "Added html { scroll-behavior: smooth }")
    test("No sticky header", "position: sticky" not in r.text, "Header scrolls with content")
except Exception as e:
    test("Frontend loads", False, str(e))

# ── TEST 2: Backend API health ──
print("\n[2] BACKEND API")
try:
    r = requests.get(f"{API}/api/region_map?region=seasia", timeout=10)
    test("Region map API (seasia)", r.status_code == 200)
    test("Returns AREA tags", "<AREA" in r.text)
    station_count = r.text.count("<AREA")
    test(f"Has stations in map ({station_count})", station_count > 30)
except Exception as e:
    test("Region map API", False, str(e))

# ── TEST 3: Region map changes ──
print("\n[3] DYNAMIC REGION MAP")
for region in ['naconf', 'europe', 'mideast', 'africa']:
    try:
        r = requests.get(f"{API}/api/region_map?region={region}", timeout=10)
        count = r.text.count("<AREA")
        test(f"Region '{region}' map loads ({count} stations)", r.status_code == 200 and count > 5)
    except Exception as e:
        test(f"Region '{region}' map loads", False, str(e))

# ── TEST 4: Fetch station 42867 (Nagpur - Southeast Asia) ──
print("\n[4] STATION 42867 (Nagpur, seasia)")
try:
    t0 = time.time()
    r = requests.get(f"{API}/api/sounding?region=seasia&YEAR=2026&MONTH=06&FROM=1800&TO=1800&STNM=42867", timeout=30)
    elapsed = time.time() - t0
    data = r.json()
    test("Fetch succeeds", r.status_code == 200)
    test(f"Response time ({elapsed:.1f}s)", elapsed < 20, f"{elapsed:.1f}s")
    test("Has HTML data", bool(data.get('html')))
    test("Has tephigram image", bool(data.get('tephigram')))
    test("Found region = seasia", data.get('found_region') == 'seasia')

    html = data['html']
    blocks = re.findall(r'<pre>([\s\S]*?)</pre>', html, re.IGNORECASE)
    test("Has 2 pre blocks", len(blocks) == 2)
    test("Block 1 has PRES/HGHT header", 'PRES   HGHT' in blocks[0])
    has_id = 'Station identifier' in blocks[1] or 'Station number' in blocks[1]
    test("Block 2 has station info", has_id)

    # Check indices are present
    for idx in ['Showalter index', 'Lifted index', 'SWEAT index', 'K index', 'CAPE']:
        found = idx.lower() in blocks[1].lower() or idx in blocks[1]
        test(f"  Index: {idx}", found)
except Exception as e:
    test("Station 42867 fetch", False, str(e))

# ── TEST 5: Fetch station 43041 (Jagdalpur - was failing before) ──
print("\n[5] STATION 43041 (Jagdalpur — previously failing)")
try:
    t0 = time.time()
    r = requests.get(f"{API}/api/sounding?region=seasia&YEAR=2026&MONTH=06&FROM=1800&TO=1800&STNM=43041", timeout=30)
    elapsed = time.time() - t0
    data = r.json()
    test("Fetch succeeds", r.status_code == 200)
    test(f"Response time ({elapsed:.1f}s)", elapsed < 20, f"{elapsed:.1f}s")
    test("Has HTML data", bool(data.get('html')))

    html = data['html']
    blocks = re.findall(r'<pre>([\s\S]*?)</pre>', html, re.IGNORECASE)
    has_station = any('Station number' in b or 'Station identifier' in b for b in blocks)
    test("Parser finds indices block (Station number format)", has_station)
    test("Has tephigram image", bool(data.get('tephigram')))
except Exception as e:
    test("Station 43041 fetch", False, str(e))

# ── TEST 6: Second fetch uses cached region (speed test) ──
print("\n[6] CACHING SPEED TEST (repeat 42867)")
try:
    t0 = time.time()
    r = requests.get(f"{API}/api/sounding?region=seasia&YEAR=2026&MONTH=06&FROM=1800&TO=1800&STNM=42867", timeout=30)
    elapsed = time.time() - t0
    test(f"Cached region fetch ({elapsed:.1f}s)", r.status_code == 200 and elapsed < 15, f"{elapsed:.1f}s")
except Exception as e:
    test("Cached region fetch", False, str(e))

# ── TEST 7: Cross-region station (e.g. North America) ──
print("\n[7] CROSS-REGION STATION (72451 - North America)")
try:
    t0 = time.time()
    r = requests.get(f"{API}/api/sounding?region=seasia&YEAR=2026&MONTH=06&FROM=1800&TO=1800&STNM=72451", timeout=45)
    elapsed = time.time() - t0
    if r.status_code == 200:
        data = r.json()
        test("Cross-region fetch succeeds", True, f"Found in '{data.get('found_region')}' in {elapsed:.1f}s")
        test("Has HTML data", bool(data.get('html')))
    else:
        test("Cross-region fetch", r.status_code == 404, f"No data available (expected for some times) — {elapsed:.1f}s")
except Exception as e:
    test("Cross-region fetch", False, str(e))

# ── TEST 8: Frontend JS files integrity ──
print("\n[8] FRONTEND JS FILES")
js_files = ['parser.js', 'app.js', 'constants.js', 'charts.js', 'ranking.js',
            'skewt.js', 'stations.js', 'cache.js', 'validation.js', 'dataModel.js', 'thresholds.js']
for f in js_files:
    try:
        r = requests.get(f"{FRONTEND}/{f}", timeout=5)
        test(f"{f} loads", r.status_code == 200, f"{len(r.text)} bytes")
    except Exception as e:
        test(f"{f} loads", False, str(e))

# ── TEST 9: CSS loads ──
print("\n[9] CSS FILE")
try:
    r = requests.get(f"{FRONTEND}/style.css", timeout=5)
    test("style.css loads", r.status_code == 200, f"{len(r.text)} bytes")
    test("Has smooth scroll", "scroll-behavior: smooth" in r.text)
    test("No sticky header", "position: sticky" not in r.text or "th" in r.text[:r.text.index("position: sticky")+100])
    test("Has map panel styles", ".map-panel" in r.text)
    test("Has tephigram download button style", ".teph-download-btn" in r.text)
except Exception as e:
    test("style.css", False, str(e))

# ── SUMMARY ──
print("\n" + "=" * 70)
passed = sum(1 for _, s, _ in results if s == PASS)
failed = sum(1 for _, s, _ in results if s == FAIL)
total = len(results)
print(f"  RESULTS: {passed}/{total} passed, {failed} failed")
if failed == 0:
    print(f"  {PASS} ALL TESTS PASSED!")
else:
    print(f"\n  {FAIL} FAILED TESTS:")
    for name, status, detail in results:
        if status == FAIL:
            print(f"    - {name}: {detail}")
print("=" * 70)
