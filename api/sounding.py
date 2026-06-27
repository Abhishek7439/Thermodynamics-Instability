"""
Vercel Serverless Function: /api/sounding
Fetches upper-air sounding data from Wyoming and optionally renders tephigrams.
"""
import json
import os
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests as http_requests

# All Wyoming regions
ALL_REGIONS = [
    'seasia', 'naconf', 'europe', 'mideast', 'africa',
    'samer', 'pac', 'np', 'ant', 'nz'
]

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

# In-memory cache (persists for the duration of the serverless function warm instance)
_station_region_cache = {}


def is_valid_response(html_text):
    """Return True if Wyoming response contains actual sounding data."""
    if not html_text:
        return False
    no_data = [
        "sorry, we are unable to process your request",
        "no observations",
        "can't get",
        "do not have any data",
        "no data for",
    ]
    lower = html_text.lower()
    if any(p in lower for p in no_data):
        return False
    return '<pre>' in lower


def try_region(region, year, month, from_time, to_time, stnm):
    """Try fetching sounding from a single region. Returns (region, html) or None."""
    for endpoint in ['sounding.py', 'sounding']:
        url = (
            f"https://weather.uwyo.edu/cgi-bin/{endpoint}"
            f"?region={region}&TYPE=TEXT%3ALIST"
            f"&YEAR={year}&MONTH={month}&FROM={from_time}&TO={to_time}&STNM={stnm}"
        )
        try:
            resp = http_requests.get(url, headers=HEADERS, timeout=15)
            if resp.status_code == 200 and is_valid_response(resp.text):
                return (region, resp.text)
        except Exception:
            pass
    return None


def parse_profile(html_text):
    """Parse temperature, dewpoint, and wind barb profiles from sounding text."""
    lines = html_text.split('\n')
    start_parsing = False
    dew_point = []
    temps = []
    barbs = []

    for line in lines:
        if 'PRES   HGHT   TEMP   DWPT' in line:
            start_parsing = True
            continue

        if start_parsing:
            if '----------------' in line:
                if len(temps) > 0:
                    break
                continue

            try:
                p_str = line[0:7].strip()
                t_str = line[14:21].strip()
                td_str = line[21:28].strip()
                drct_str = line[42:49].strip()
                sknt_str = line[49:56].strip()

                if p_str and t_str and td_str:
                    p = float(p_str)
                    t = float(t_str)
                    td = float(td_str)
                    temps.append((p, t))
                    dew_point.append((p, td))

                    if drct_str and sknt_str:
                        drct = float(drct_str)
                        sknt = float(sknt_str)
                        barbs.append((sknt, drct, p))
            except Exception:
                pass
    return temps, dew_point, barbs


def generate_tephigram(temps, dews, barbs):
    """
    Attempt tephigram rendering. Gracefully returns None if tephi/matplotlib
    are not available (e.g., on Vercel where deps may be too large).
    """
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        import tephi
        import io
        import base64

        # Filter to strictly monotonically decreasing pressure
        valid_temps = []
        valid_dews = []
        last_p = float('inf')
        for i in range(len(temps)):
            p = temps[i][0]
            if p < last_p:
                valid_temps.append(temps[i])
                valid_dews.append(dews[i])
                last_p = p

        valid_barbs = []
        last_p_b = float('inf')
        for b in barbs:
            p = b[2]
            if p < last_p_b:
                valid_barbs.append(b)
                last_p_b = p

        if len(valid_temps) < 2:
            return None, f"Insufficient data: only {len(valid_temps)} valid pressure level(s)"

        fig = plt.figure(figsize=(6, 6))
        ax = tephi.TephiAxes(figure=fig)
        fig.set_dpi(72)
        profile = ax.plot(valid_temps, color='red', label='Temperature')
        if valid_barbs:
            profile.barbs(valid_barbs)
        ax.plot(valid_dews, color='blue', label='Dewpoint')

        buf = io.BytesIO()
        fig.savefig(buf, format='png', dpi=72)
        plt.close(fig)

        buf.seek(0)
        return base64.b64encode(buf.read()).decode('utf-8'), None

    except ImportError:
        return None, "Tephigram rendering unavailable (tephi/matplotlib not installed on server)"
    except Exception as e:
        return None, str(e)


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse query parameters
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        region = params.get('region', ['seasia'])[0]
        year = params.get('YEAR', [None])[0]
        month = params.get('MONTH', [None])[0]
        from_time = params.get('FROM', [None])[0]
        to_time = params.get('TO', [None])[0]
        stnm = params.get('STNM', [None])[0]

        # CORS headers
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

        if not all([year, month, from_time, to_time, stnm]):
            self.send_response(400)
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Missing parameters'}).encode())
            return

        html_text = None
        found_region = None

        try:
            # 1) Check cache
            cached_region = _station_region_cache.get(stnm)

            # 2) Try cached region first
            if cached_region:
                result = try_region(cached_region, year, month, from_time, to_time, stnm)
                if result:
                    found_region, html_text = result

            # 3) Try requested region
            if not html_text and cached_region != region:
                result = try_region(region, year, month, from_time, to_time, stnm)
                if result:
                    found_region, html_text = result

            # 4) Try ALL other regions in parallel
            if not html_text:
                skip = {region, cached_region} if cached_region else {region}
                remaining = [r for r in ALL_REGIONS if r not in skip]

                with ThreadPoolExecutor(max_workers=5) as executor:
                    futures = {
                        executor.submit(try_region, r, year, month, from_time, to_time, stnm): r
                        for r in remaining
                    }
                    for future in as_completed(futures):
                        result = future.result()
                        if result:
                            found_region, html_text = result
                            for f in futures:
                                f.cancel()
                            break

            if not html_text:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': f'No sounding data found for station {stnm}. Check station number and date/time.'
                }).encode())
                return

            # Cache station region
            _station_region_cache[stnm] = found_region

            # Parse and optionally render tephigram
            temps, dews, barbs_data = parse_profile(html_text)

            b64_image = None
            tephigram_error = None
            if len(temps) > 0:
                b64_image, tephigram_error = generate_tephigram(temps, dews, barbs_data)
            else:
                tephigram_error = "No temperature profile data found in the sounding."

            response = {
                'html': html_text,
                'tephigram': b64_image,
                'tephigram_error': tephigram_error,
                'found_region': found_region
            }

            self.end_headers()
            self.wfile.write(json.dumps(response).encode())

        except http_requests.exceptions.HTTPError as e:
            status = e.response.status_code if e.response is not None else 502
            msg = f"Wyoming server returned HTTP {status}"
            if status == 403:
                msg = "Wyoming server rate-limited request (HTTP 403) — wait a few seconds and retry"
            self.send_response(502)
            self.end_headers()
            self.wfile.write(json.dumps({'error': msg}).encode())

        except http_requests.exceptions.RequestException as e:
            self.send_response(502)
            self.end_headers()
            self.wfile.write(json.dumps({'error': f"Network error reaching Wyoming: {e}"}).encode())

        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
