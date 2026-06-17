from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import tephi
import matplotlib
matplotlib.use('Agg') # Faster non-interactive backend
import matplotlib.pyplot as plt
import io
import base64

app = Flask(__name__)
CORS(app)

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
            
            # Fixed width parsing: 0:7 PRES, 14:21 TEMP, 21:28 DWPT, 42:49 DRCT, 49:56 SKNT
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

@app.route('/api/sounding', methods=['GET'])
def fetch_sounding():
    region = request.args.get('region', 'seasia')
    year = request.args.get('YEAR')
    month = request.args.get('MONTH')
    from_time = request.args.get('FROM')
    to_time = request.args.get('TO')
    stnm = request.args.get('STNM')
    
    if not all([year, month, from_time, to_time, stnm]):
        return jsonify({'error': 'Missing parameters'}), 400
        
    wyoming_url = f"https://weather.uwyo.edu/cgi-bin/sounding?region={region}&TYPE=TEXT%3ALIST&YEAR={year}&MONTH={month}&FROM={from_time}&TO={to_time}&STNM={stnm}"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
    
    try:
        resp = requests.get(wyoming_url, headers=headers, timeout=15)
        resp.raise_for_status()
        html_text = resp.text
        
        if "Sorry, we are unable to process your request" in html_text or "No observations" in html_text or "Can't get" in html_text:
            return jsonify({'error': 'No data available', 'html': html_text}), 404
            
        temps, dews, barbs = parse_profile(html_text)
        
        b64_image = None
        if len(temps) > 0:
            fig = plt.figure(figsize=(8, 8))
            ax = tephi.TephiAxes()
            profile = ax.plot(temps, color='red', label='Temperature')
            if len(barbs) > 0:
                profile.barbs(barbs)
            ax.plot(dews, color='blue', label='Dewpoint')
            
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight')
            buf.seek(0)
            b64_image = base64.b64encode(buf.read()).decode('utf-8')
            plt.close(fig) # free memory
            
        return jsonify({
            'html': html_text,
            'tephigram': b64_image
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
