import urllib.request
import tephi
import matplotlib.pyplot as plt

def fetch_data():
    url = 'https://weather.uwyo.edu/cgi-bin/sounding?region=seasia&TYPE=TEXT%3ALIST&YEAR=2026&MONTH=06&FROM=1400&TO=1400&STNM=42867'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    
    lines = html.split('\n')
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
            
            # Fixed width parsing is safer
            # 0:7 PRES, 7:14 HGHT, 14:21 TEMP, 21:28 DWPT, 28:35 RELH, 35:42 MIXR, 42:49 DRCT, 49:56 SKNT
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
                        barbs.append((sknt, drct, p)) # speed, direction, pressure
            except Exception as e:
                pass
                
    return temps, dew_point, barbs

try:
    temps, dews, barbs = fetch_data()
    print("Barbs count:", len(barbs))
    fig = plt.figure(figsize=(8, 8))
    ax = tephi.TephiAxes(fig=fig)
    profile = ax.plot(temps, color='red', label='Temperature')
    profile.barbs(barbs)
    ax.plot(dews, color='blue', label='Dewpoint')
    
    plt.savefig('test_barbs.png')
    print("SUCCESS: test_barbs.png saved")
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"FAILED: {e}")
