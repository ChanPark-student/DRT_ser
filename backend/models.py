from sqlalchemy import Column, Integer, String, Float
from database import Base

class BusStop(Base):
    __tablename__ = "bus_stops"
    id = Column(Integer, primary_key=True, index=True)
    ars_id = Column(String, index=True)
    name = Column(String)
    address = Column(String)
    dong = Column(String)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)

class LogisticsNode(Base):
    __tablename__ = "logistics_nodes"
    id = Column(Integer, primary_key=True, index=True)
    node_type = Column(String) # 'manufacturer', 'freight', 'warehouse'
    name = Column(String)
    address = Column(String)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    
class TrafficSpeed(Base):
    __tablename__ = "traffic_speed"
    id = Column(Integer, primary_key=True, index=True)
    section_name = Column(String)
    road_name = Column(String)
    speed_07_09 = Column(Float, nullable=True)
    speed_13_15 = Column(Float, nullable=True)
    speed_17_19 = Column(Float, nullable=True)
    avg_speed = Column(Float, nullable=True)
