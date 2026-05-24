import pandas as pd
import os
import glob
import random
from database import engine, Base, SessionLocal
import models

# Recreate the database
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

data_dir = r"c:\Users\USER\Desktop\DRT_ser\data"
session = SessionLocal()

def get_random_coord():
    # Base coords for Gwangsan-gu
    base_lat = 35.19
    base_lon = 126.81
    return base_lat + random.uniform(-0.03, 0.03), base_lon + random.uniform(-0.03, 0.03)

# 1. Load Bus Stops (Prefer Final_Data.csv for actual coords and priorities)
final_data_file = r"c:\Users\USER\Desktop\DRT_ser\Final_Data.csv"
stops_file = final_data_file if os.path.exists(final_data_file) else os.path.join(data_dir, "광주광역시_정류소_20241231.csv")

if os.path.exists(stops_file):
    try:
        df_stops = pd.read_csv(stops_file, encoding='utf-8')
    except:
        df_stops = pd.read_csv(stops_file, encoding='cp949')
    
    priority_ids = {'5800', '5158', '5159', '5316', '5315', '5309', '5310', '5314'}
    
    for _, row in df_stops.iterrows():
        addr = str(row.get('주소', ''))
        dong = ''
        parts = addr.split()
        for part in parts:
            if part.endswith('동') or part.endswith('가') or part.endswith('읍') or part.endswith('면'):
                dong = part
                break
        
        lat = row.get('위도', None)
        lon = row.get('경도', None)
        if pd.isna(lat) or pd.isna(lon):
            # Fallback to random if not found
            lat, lon = get_random_coord()
        else:
            lat = float(lat)
            lon = float(lon)
            
        # ID can be float in pandas, so convert to int first if numeric
        raw_id = row.get('ID', '')
        try:
            stop_id = str(int(float(raw_id)))
        except:
            stop_id = str(raw_id)
            
        stop = models.BusStop(
            ars_id=stop_id,
            name=str(row.get('정류소명', '')),
            address=addr,
            dong=dong,
            lat=lat,
            lon=lon,
            is_priority=(stop_id in priority_ids)
        )
        session.add(stop)
    print(f"Loaded {len(df_stops)} bus stops from {stops_file}.")

# 2. Load Logistics Nodes (Manufacturers)
manu_file = os.path.join(data_dir, "광주광역시 광산구_제조업체 현황_20250910.csv")
if os.path.exists(manu_file):
    try:
        df_manu = pd.read_csv(manu_file, encoding='cp949')
    except Exception:
        try:
            df_manu = pd.read_csv(manu_file, encoding='cp949', encoding_errors='replace')
        except Exception:
            with open(manu_file, 'r', encoding='cp949', errors='replace') as f:
                from io import StringIO
                df_manu = pd.read_csv(StringIO(f.read()))
        
    for _, row in df_manu.iterrows():
        lat, lon = get_random_coord()
        node = models.LogisticsNode(
            node_type="manufacturer",
            name=str(row.get('업체명', '')),
            address=str(row.get('소재지', '')),
            lat=lat,
            lon=lon
        )
        session.add(node)
    print(f"Loaded {len(df_manu)} manufacturers.")

# 3. Load Logistics Nodes (Freight Companies)
freight_file = os.path.join(data_dir, "광주광역시 광산구_일반화물자동차운송사업자 업체 현황_20250620.csv")
if os.path.exists(freight_file):
    try:
        df_freight = pd.read_csv(freight_file, encoding='cp949')
    except Exception:
        try:
            df_freight = pd.read_csv(freight_file, encoding='cp949', encoding_errors='replace')
        except Exception:
            with open(freight_file, 'r', encoding='cp949', errors='replace') as f:
                from io import StringIO
                df_freight = pd.read_csv(StringIO(f.read()))
        
    for _, row in df_freight.iterrows():
        lat, lon = get_random_coord()
        node = models.LogisticsNode(
            node_type="freight",
            name=str(row.get('업체명', '')),
            address=str(row.get('주소', '')),
            lat=lat,
            lon=lon
        )
        session.add(node)
    print(f"Loaded {len(df_freight)} freight companies.")

# 4. Load Traffic Speed
speed_file = os.path.join(data_dir, "광주광역시_주요 구간 차량 속도 정보_20250617.csv")
if os.path.exists(speed_file):
    try:
        df_speed = pd.read_csv(speed_file, encoding='cp949')
    except:
        df_speed = pd.read_csv(speed_file, encoding='utf-8')
        
    for _, row in df_speed.iterrows():
        speed_obj = models.TrafficSpeed(
            section_name=str(row.get('구간명', '')),
            road_name=str(row.get('도로명', '')),
            speed_07_09=pd.to_numeric(row.get('07시-09시 시간대 속도'), errors='coerce'),
            speed_13_15=pd.to_numeric(row.get('13시-15시 시간대 속도'), errors='coerce'),
            speed_17_19=pd.to_numeric(row.get('17시30분-19시30분 시간대 속도'), errors='coerce'),
            avg_speed=pd.to_numeric(row.get('일평균속도'), errors='coerce')
        )
        session.add(speed_obj)
    print(f"Loaded {len(df_speed)} traffic speed records.")

session.commit()
session.close()
print("Data loading complete.")
