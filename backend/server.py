from flask import Flask, request, jsonify
from flask_cors import CORS
import requests as http_requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import os
import tephi
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64
import threading
import queue

app = Flask(__name__)
CORS(app)

# All Wyoming regions
ALL_REGIONS = ['seasia', 'naconf', 'europe', 'mideast', 'africa', 'samer', 'pac', 'np', 'ant', 'nz']

# Cache: station number -> region (persists for server lifetime)
_station_region_cache = {}
_cache_lock = threading.Lock()

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

# ── Single-thread renderer for matplotlib/tephi (not thread-safe) ─────────────
# All tephigram generation is serialized through this dedicated thread.
_render_queue = queue.Queue()

def _renderer_worker():
    """Daemon thread: pulls rendering jobs from the queue and executes them."""
    while True:
        job = _render_queue.get()
        if job is None:
            break
        fn, args, result_holder = job
        try:
            result_holder['result'] = fn(*args)
        except Exception as e:
            result_holder['error'] = e
        finally:
            result_holder['done'].set()
            _render_queue.task_done()

_renderer_thread = threading.Thread(target=_renderer_worker, daemon=True)
_renderer_thread.start()


def _run_on_renderer(fn, *args):
    """Submit a function to run on the single renderer thread; block until done."""
    holder = {'result': None, 'error': None, 'done': threading.Event()}
    _render_queue.put((fn, args, holder))
    holder['done'].wait()
    if holder['error']:
        raise holder['error']
    return holder['result']


def parse_profile(html_text):
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
                p_str    = line[0:7].strip()
                t_str    = line[14:21].strip()
                td_str   = line[21:28].strip()
                drct_str = line[42:49].strip()
                sknt_str = line[49:56].strip()

                if p_str and t_str and td_str:
                    p  = float(p_str)
                    t  = float(t_str)
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
            resp = http_requests.get(url, headers=HEADERS, timeout=12)
            if resp.status_code == 200 and is_valid_response(resp.text):
                return (region, resp.text)
        except Exception:
            pass
    return None


def _render_tephigram(temps, dews, barbs):
    """
    Internal: must be called only on the renderer thread.
    Returns base64_string or raises on failure.
    """
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
        raise ValueError(
            f"Insufficient data: only {len(valid_temps)} valid pressure level(s) found "
            f"(need at least 2 with strictly decreasing pressure)."
        )

    fig = plt.figure(figsize=(6, 6))
    ax = tephi.TephiAxes(figure=fig)
    # Force 72 DPI AFTER tephi (tephi may reset the DPI internally)
    fig.set_dpi(72)
    profile = ax.plot(valid_temps, color='red', label='Temperature')
    if valid_barbs:
        profile.barbs(valid_barbs)
    ax.plot(valid_dews, color='blue', label='Dewpoint')

    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=72)
    plt.close(fig)

    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')


def generate_tephigram(temps, dews, barbs):
    """Public wrapper: submits rendering to the single safe renderer thread."""
    try:
        b64 = _run_on_renderer(_render_tephigram, temps, dews, barbs)
        return b64, None
    except Exception as e:
        import traceback
        print(f"Tephigram generation failed: {e}")
        traceback.print_exc()
        return None, str(e)


@app.route('/api/region_map', methods=['GET'])
def fetch_region_map():
    region = request.args.get('region', 'seasia')
    url = f"https://weather.uwyo.edu/upperair/{region}.html"
    try:
        resp = http_requests.get(url, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        return resp.text, 200, {'Content-Type': 'text/html; charset=utf-8'}
    except Exception as e:
        return str(e), 502


@app.route('/api/sounding', methods=['GET'])
def fetch_sounding():
    region    = request.args.get('region', 'seasia')
    year      = request.args.get('YEAR')
    month     = request.args.get('MONTH')
    from_time = request.args.get('FROM')
    to_time   = request.args.get('TO')
    stnm      = request.args.get('STNM')

    if not all([year, month, from_time, to_time, stnm]):
        return jsonify({'error': 'Missing parameters'}), 400

    html_text    = None
    found_region = None

    try:
        # 1) Check if we already know this station's region
        with _cache_lock:
            cached_region = _station_region_cache.get(stnm)

        # 2) If cached, try that region first (fastest path)
        if cached_region:
            result = try_region(cached_region, year, month, from_time, to_time, stnm)
            if result:
                found_region, html_text = result

        # 3) If not cached or cached region failed, try requested region
        if not html_text and cached_region != region:
            result = try_region(region, year, month, from_time, to_time, stnm)
            if result:
                found_region, html_text = result

        # 4) If still nothing, try ALL other regions in PARALLEL
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
            return jsonify({'error': f'No sounding data found for station {stnm}. Check station number and date/time.'}), 404

        # Cache this station's region for future speed
        with _cache_lock:
            _station_region_cache[stnm] = found_region

        # Parse profile and generate tephigram (rendered safely on single thread)
        temps, dews, barbs = parse_profile(html_text)

        b64_image = None
        tephigram_error = None
        if len(temps) > 0:
            b64_image, tephigram_error = generate_tephigram(temps, dews, barbs)
        else:
            tephigram_error = "No temperature profile data found in the sounding."

        return jsonify({
            'html':            html_text,
            'tephigram':       b64_image,
            'tephigram_error': tephigram_error,
            'found_region':    found_region
        })

    except http_requests.exceptions.HTTPError as e:
        status = e.response.status_code if e.response is not None else 502
        msg = f"Wyoming server returned HTTP {status}"
        if status == 403:
            msg = "Wyoming server rate-limited request (HTTP 403) — wait a few seconds and retry"
        return jsonify({'error': msg}), 502

    except http_requests.exceptions.RequestException as e:
        return jsonify({'error': f"Network error reaching Wyoming: {e}"}), 502

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 5000))
    app.run(port=port, debug=False, threaded=True)
