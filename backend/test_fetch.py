import requests, re

r = requests.get('http://localhost:5000/api/sounding?region=seasia&YEAR=2026&MONTH=06&FROM=1800&TO=1800&STNM=43041')
data = r.json()
html = data.get('html', '')
blocks = re.findall(r'<pre>([\s\S]*?)</pre>', html, re.IGNORECASE)

# Print the full indices block
for i, b in enumerate(blocks):
    if 'Station number' in b or 'Station identifier' in b:
        print(f'=== INDICES BLOCK (Block {i+1}) ===')
        print(b)
        print('=== END ===')
