from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gwangju DRT Logistics API")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/stops")
def get_stops(db: Session = Depends(get_db), limit: int = 100000):
    return db.query(models.BusStop).filter(models.BusStop.address.like('%광산구%')).limit(limit).all()

@app.get("/api/logistics_nodes")
def get_logistics_nodes(db: Session = Depends(get_db), limit: int = 100):
    return db.query(models.LogisticsNode).limit(limit).all()

@app.get("/api/speeds")
def get_traffic_speeds(db: Session = Depends(get_db), limit: int = 100):
    return db.query(models.TrafficSpeed).limit(limit).all()

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
