import pandas as pd
import os
import glob
import json

data_dir = r"c:\Users\USER\Desktop\DRT_ser\data"
csv_files = glob.glob(os.path.join(data_dir, "*.csv"))

output = {}

for file in csv_files:
    try:
        df = pd.read_csv(file, encoding='cp949', nrows=1)
        output[os.path.basename(file)] = df.columns.tolist()
    except Exception as e:
        try:
            df = pd.read_csv(file, encoding='utf-8', nrows=1)
            output[os.path.basename(file)] = df.columns.tolist()
        except Exception as e2:
            output[os.path.basename(file)] = str(e2)

with open(r"c:\Users\USER\Desktop\DRT_ser\headers.json", "w", encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=4)
