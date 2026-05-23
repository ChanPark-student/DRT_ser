import sqlite3
import math

conn = sqlite3.connect('drt.db')
c = conn.cursor()
c.execute("SELECT name, lat, lon FROM bus_stops WHERE address LIKE '%광산구%'")
stops = c.fetchall()

stops.sort(key=lambda x: (x[1]-35.195)**2 + (x[2]-126.815)**2, reverse=True)
with open('out_utf8.txt', 'w', encoding='utf-8') as f:
    f.write("FAR:\n")
    for s in stops[:5]:
        f.write(s[0] + "\n")

    f.write("\nCLOSE:\n")
    for s in stops[-5:]:
        f.write(s[0] + "\n")
