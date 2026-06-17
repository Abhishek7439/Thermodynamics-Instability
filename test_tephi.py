import urllib.request
import os
import tephi
import matplotlib.pyplot as plt
import io

def fetch_data():
    url = 'https://weather.uwyo.edu/cgi-bin/sounding?region=seasia&TYPE=TEXT%3ALIST&YEAR=2026&MONTH=06&FROM=1400&TO=1400&STNM=42867'
    try:
        html = urllib.request.urlopen(url).read().decode('utf-8')
    except Exception as e:
        print("URL fetch failed:", e)
        return [], []
    
    lines = html.split('\n')
    start_parsing = False
    
    dew_point = []
    temps = []
    
    for line in lines:
        if 'PRES   HGHT   TEMP   DWPT' in line:
            start_parsing = True
            continue
            
        if start_parsing:
            if '----------------' in line:
                if len(temps) > 0:
                    break # Reached the end of the table
                continue # Skip the separator line after headers
            
            parts = line.split()
            # Usually 11 columns, but sometimes less. We need at least 4 (PRES, HGHT, TEMP, DWPT)
            if len(parts) >= 4:
                try:
                    p = float(parts[0])
                    t = float(parts[2])
                    td = float(parts[3])
                    temps.append((p, t))
                    dew_point.append((p, td))
                except ValueError:
                    pass
                    
    return temps, dew_point

try:
    temps, dews = fetch_data()
    print(f"Parsed {len(temps)} data points.")
    if len(temps) == 0:
        print("No data parsed!")
    else:
        fig = plt.figure(figsize=(8, 8))
        ax = tephi.TephiAxes(fig=fig) # Try with fig argument
        ax.plot(temps, color='red', label='Temperature')
        ax.plot(dews, color='blue', label='Dewpoint')
        
        # Save to file
        plt.savefig('test_tephi.png')
        print("SUCCESS: test_tephi.png saved")
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"FAILED: {e}")
