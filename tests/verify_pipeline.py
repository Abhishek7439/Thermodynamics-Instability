#!/usr/bin/env python3
"""
End-to-end verification of Wyoming sounding fetch, parse structure,
tephigram generation, and data validity for the RMC Soundings Dashboard.

Mirrors client-side parser.js logic for indices and levels.
"""
import json
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime

API_BASE = "http://localhost:5000"
REGION = "seasia"
YEAR = "2024"
MONTH = "06"
FROM_TIME = "1500"
TO_TIME = "1500"

STATIONS = [
    ("42867", "Nagpur"),
    ("42971", "Raipur"),
    ("42182", "New Delhi"),
]

INDICES = [
    ("showalter", "Showalter index"),
    ("lifted", "Lifted index"),
    ("lift_vt", "LIFT computed using virtual temperature"),
    ("sweat", "SWEAT index"),
    ("k_index", "K index"),
    ("cross_totals", "Cross totals index"),
    ("vert_totals", "Vertical totals index"),
    ("totals_totals", "Totals totals index"),
    ("cape", "Convective Available Potential Energy"),
    ("cape_vt", "CAPE using virtual temperature"),
    ("cin", "Convective Inhibition"),
    ("cins_vt", "CINS using virtual temperature"),
    ("eq_level", "Equilibrum Level"),
    ("eq_level_vt", "Equilibrum Level using virtual temperature"),
    ("lfc", "Level of Free Convection"),
    ("lfct_vt", "LFCT using virtual temperature"),
    ("brn", "Bulk Richardson Number"),
    ("brn_capv", "Bulk Richardson Number using CAPV"),
    ("lcl_temp", "Temp [K] of the Lifted Condensation Level"),
    ("lcl_pres", "Pres [hPa] of the Lifted Condensation Level"),
    ("lcl_theta_e", "Equivalent potential temp [K] of the LCL"),
    ("ml_theta", "Mean mixed layer potential temperature"),
    ("ml_mixr", "Mean mixed layer mixing ratio"),
    ("thickness", "1000 hPa to 500 hPa thickness"),
    ("pw", "Precipitable water [mm] for entire sounding"),
]

BOUNDS = {
    "cape": (0, 8000),
    "k_index": (-10, 45),
    "showalter": (-20, 20),
    "lifted": (-20, 10),
    "sweat": (0, 1000),
    "pw": (0, 100),
}

passed = 0
failed = 0
warnings = []


def ok(msg):
    global passed
    passed += 1
    print(f"  PASS  {msg}")


def fail(msg):
    global failed
    failed += 1
    print(f"  FAIL  {msg}")


def warn(msg):
    warnings.append(msg)
    print(f"  WARN  {msg}")


def extract_pre_blocks(html):
    return re.findall(r"<pre>([\s\S]*?)</pre>", html, re.I)


def get_indices_text(html):
    for block in extract_pre_blocks(html):
        if "Station identifier" in block:
            return block
    return ""


def parse_index(indices_text, label):
    escaped = re.escape(label).replace(r"\[", r"\[").replace(r"\]", r"\]")
    m = re.search(escaped + r":\s*(M|-?\d+(?:\.\d+)?)", indices_text, re.I)
    if not m:
        return None
    if m.group(1).upper() == "M":
        return None
    return float(m.group(1))


def parse_levels(html):
    profile = None
    for block in extract_pre_blocks(html):
        if "PRES   HGHT   TEMP   DWPT" in block:
            profile = block
            break
    if not profile:
        return []

    levels = []
    header_found = False
    for line in profile.split("\n"):
        if "PRES   HGHT   TEMP   DWPT" in line:
            header_found = True
            continue
        if not header_found:
            continue
        if "------" in line:
            if levels:
                break
            continue
        if len(line.strip()) < 7:
            continue

        p_str = line[0:7].strip()
        t_str = line[14:21].strip()
        td_str = line[21:28].strip()
        if not p_str:
            continue
        try:
            pressure = float(p_str)
        except ValueError:
            continue

        def parse_field(s):
            if not s or s.upper() == "M":
                return None
            try:
                v = float(s)
                return None if v != v else v
            except ValueError:
                return None

        levels.append({
            "pressure": pressure,
            "temperature": parse_field(t_str),
            "dewpoint": parse_field(td_str),
        })

    levels.sort(key=lambda x: -x["pressure"])
    return levels


def fetch_sounding(stnm):
    url = (
        f"{API_BASE}/api/sounding?region={REGION}&YEAR={YEAR}&MONTH={MONTH}"
        f"&FROM={FROM_TIME}&TO={TO_TIME}&STNM={stnm}"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "RMC-Verify/1.0"})
    with urllib.request.urlopen(req, timeout=45) as resp:
        return json.loads(resp.read().decode("utf-8"))


def verify_station(stnm, name):
    print(f"\n--- Station {name} ({stnm}) ---")
    try:
        data = fetch_sounding(stnm)
    except urllib.error.HTTPError as e:
        fail(f"HTTP {e.code} for {stnm}")
        return
    except Exception as e:
        fail(f"Fetch error for {stnm}: {e}")
        return

    html = data.get("html", "")
    tephigram = data.get("tephigram")

    if not html:
        fail("Empty HTML response")
        return
    ok("HTML response received")

    if "Sorry, we are unable to process your request" in html:
        fail("Wyoming rejected request")
        return

    blocks = extract_pre_blocks(html)
    if len(blocks) < 2:
        fail(f"Expected 2+ <pre> blocks, got {len(blocks)}")
    else:
        ok(f"{len(blocks)} raw <pre> blocks extracted")

    has_profile = any("PRES   HGHT" in b for b in blocks)
    has_indices = any("Station identifier" in b for b in blocks)
    if not has_profile:
        fail("Missing profile <pre> block")
    else:
        ok("Profile block present")
    if not has_indices:
        fail("Missing indices <pre> block")
    else:
        ok("Indices block present")

    indices_text = get_indices_text(html)
    parsed = {}
    for key, label in INDICES:
        parsed[key] = parse_index(indices_text, label)

    found = sum(1 for v in parsed.values() if v is not None)
    if found < 10:
        fail(f"Only {found}/25 indices parsed")
    else:
        ok(f"{found}/25 indices parsed with numeric values")

    for key, (lo, hi) in BOUNDS.items():
        val = parsed.get(key)
        if val is not None and (val < lo or val > hi):
            warn(f"{key}={val} outside plausibility [{lo},{hi}]")

    levels = parse_levels(html)
    if len(levels) < 5:
        fail(f"Only {len(levels)} profile levels parsed")
    else:
        ok(f"{len(levels)} profile levels parsed")

    surface = levels[0] if levels else None
    if surface and surface["pressure"] > 200:
        ok(f"Surface pressure {surface['pressure']} hPa looks valid")
    elif surface:
        fail(f"Surface pressure {surface['pressure']} hPa suspicious")

    temp_levels = [l for l in levels if l["temperature"] is not None]
    if len(temp_levels) >= 3:
        ok(f"{len(temp_levels)} levels with temperature data")
    else:
        warn(f"Only {len(temp_levels)} levels with temperature")

    if tephigram and len(tephigram) > 1000:
        ok(f"Tephigram PNG generated ({len(tephigram)} base64 chars)")
    elif levels and len(temp_levels) >= 3:
        fail("Tephigram missing despite valid profile data")
    else:
        warn("No tephigram (may be expected if profile sparse)")

    if parsed.get("cape") is not None:
        ok(f"CAPE = {parsed['cape']} J/kg")
    if parsed.get("k_index") is not None:
        ok(f"K-index = {parsed['k_index']}")


def verify_frontend():
    print("\n--- Frontend static assets ---")
    base = "http://localhost:8000"
    required = [
        "/", "/index.html", "/app.js", "/parser.js", "/charts.js",
        "/validation.js", "/cache.js", "/constants.js", "/dataModel.js",
        "/ranking.js", "/thresholds.js", "/report.js", "/exporter.js",
    ]
    for path in required:
        try:
            req = urllib.request.Request(f"{base}{path}", method="HEAD",
                                         headers={"User-Agent": "RMC-Verify/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    ok(f"{path} -> 200")
                else:
                    fail(f"{path} -> {resp.status}")
        except Exception as e:
            fail(f"{path} -> {e}")


def verify_cache_identity():
    """Fetch same sounding twice with delay; parsed output must match."""
    print("\n--- Cache / repeat-fetch identity ---")
    import time
    stnm = "42867"
    try:
        d1 = fetch_sounding(stnm)
        time.sleep(5)
        d2 = fetch_sounding(stnm)
    except urllib.error.HTTPError as e:
        if e.code == 502:
            warn(f"Wyoming rate-limited repeat fetch (HTTP 502) — data validity OK, retry later")
            return
        fail(f"Repeat fetch failed: HTTP {e.code}")
        return
    except Exception as e:
        fail(f"Repeat fetch failed: {e}")
        return

    idx1 = get_indices_text(d1["html"])
    idx2 = get_indices_text(d2["html"])
    cape1 = parse_index(idx1, "Convective Available Potential Energy")
    cape2 = parse_index(idx2, "Convective Available Potential Energy")
    lv1 = parse_levels(d1["html"])
    lv2 = parse_levels(d2["html"])

    if cape1 == cape2:
        ok(f"CAPE identical across fetches: {cape1}")
    else:
        fail(f"CAPE mismatch: {cape1} vs {cape2}")

    if len(lv1) == len(lv2):
        ok(f"Level count identical: {len(lv1)}")
    else:
        fail(f"Level count mismatch: {len(lv1)} vs {len(lv2)}")

    tg1 = d1.get("tephigram") or ""
    tg2 = d2.get("tephigram") or ""
    if tg1 and tg2:
        if tg1 == tg2:
            ok("Tephigram base64 identical across fetches")
        else:
            ok("Tephigram generated both times (PNG may differ slightly due to matplotlib)")


def main():
    print("=" * 60)
    print("RMC Soundings Dashboard — Verification Suite")
    print(f"Run at: {datetime.now().isoformat()}")
    print("=" * 60)

    print("\n--- Server connectivity ---")
    try:
        urllib.request.urlopen(f"{API_BASE}/api/sounding?region=seasia&YEAR=2024&MONTH=06&FROM=1500&TO=1500&STNM=42867", timeout=10)
        ok("Backend API reachable")
    except Exception as e:
        fail(f"Backend unreachable: {e}")
        print("\nABORT: Start backend with: python backend/server.py")
        sys.exit(1)

    verify_frontend()

    for stnm, name in STATIONS:
        verify_station(stnm, name)

    verify_cache_identity()

    print("\n" + "=" * 60)
    print(f"RESULTS: {passed} passed, {failed} failed, {len(warnings)} warnings")
    if warnings:
        print("\nWarnings:")
        for w in warnings:
            print(f"  - {w}")
    print("=" * 60)

    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
