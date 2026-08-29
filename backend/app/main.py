"""Demo-first Landslide Early Warning API. Synthetic values are explicitly labelled."""
from __future__ import annotations
import math, os, random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Literal
import joblib, numpy as np
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, String, Float, Integer, DateTime, Text, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session, sessionmaker
from sklearn.ensemble import RandomForestRegressor

ROOT=Path(__file__).resolve().parents[2]; DB=os.getenv('DATABASE_URL','sqlite:///'+str(ROOT/'landslide.db'))
engine=create_engine(DB, connect_args={'check_same_thread':False} if DB.startswith('sqlite') else {})
SessionLocal=sessionmaker(bind=engine, autoflush=False)
class Base(DeclarativeBase): pass
class Zone(Base):
    __tablename__='zones'
    id:Mapped[str]=mapped_column(String,primary_key=True)
    name:Mapped[str]=mapped_column(String)
    lat:Mapped[float]=mapped_column(Float)
    lng:Mapped[float]=mapped_column(Float)
    rainfall_24h:Mapped[float]=mapped_column(Float)
    rainfall_72h:Mapped[float]=mapped_column(Float)
    slope:Mapped[float]=mapped_column(Float)
    moisture:Mapped[float]=mapped_column(Float)
    score:Mapped[float]=mapped_column(Float,default=0)
    ml_score:Mapped[float]=mapped_column(Float,default=0)
    community_adjustment:Mapped[float]=mapped_column(Float,default=0)
    updated_at:Mapped[datetime]=mapped_column(DateTime,default=datetime.utcnow)
class Report(Base):
    __tablename__='community_reports'
    id:Mapped[int]=mapped_column(Integer,primary_key=True)
    report_type:Mapped[str]=mapped_column(String)
    description:Mapped[str]=mapped_column(Text)
    severity:Mapped[str]=mapped_column(String)
    latitude:Mapped[float]=mapped_column(Float)
    longitude:Mapped[float]=mapped_column(Float)
    photo_url:Mapped[str|None]=mapped_column(String,nullable=True)
    status:Mapped[str]=mapped_column(String,default='PENDING')
    created_at:Mapped[datetime]=mapped_column(DateTime,default=datetime.utcnow)
class Alert(Base):
    __tablename__='alerts'
    id:Mapped[int]=mapped_column(Integer,primary_key=True)
    zone_id:Mapped[str]=mapped_column(String)
    title:Mapped[str]=mapped_column(String)
    message:Mapped[str]=mapped_column(Text)
    severity:Mapped[str]=mapped_column(String)
    status:Mapped[str]=mapped_column(String,default='ACTIVE')
    created_at:Mapped[datetime]=mapped_column(DateTime,default=datetime.utcnow)
def db():
    s=SessionLocal()
    try: yield s
    finally:s.close()
FEATURES=['rainfall_1h','rainfall_24h','rainfall_72h','slope_deg','elevation','soil_moisture','ndvi','land_cover','historical_landslides','community_report_count']
MODEL_PATH=ROOT/'model.joblib'
def model():
    if MODEL_PATH.exists(): return joblib.load(MODEL_PATH)
    rng=np.random.default_rng(26001); x=np.column_stack([rng.gamma(2,6,1200),rng.gamma(3,18,1200),rng.gamma(4,22,1200),rng.uniform(3,52,1200),rng.uniform(80,2600,1200),rng.uniform(.08,.8,1200),rng.uniform(.1,.9,1200),rng.integers(0,5,1200),rng.integers(0,10,1200),rng.integers(0,7,1200)])
    y=np.clip(2+.18*x[:,1]+.16*x[:,2]+.75*x[:,3]+30*x[:,5]-15*x[:,6]+2.5*x[:,8]+1.8*x[:,9]+np.where(x[:,7]==3,8,0)+rng.normal(0,5,1200),0,100)
    m=RandomForestRegressor(n_estimators=140,min_samples_leaf=3,random_state=26001,n_jobs=-1).fit(x,y); joblib.dump(m,MODEL_PATH); return m
ML=model()
def level(v): return 'CRITICAL' if v>=75 else 'HIGH' if v>=50 else 'MODERATE' if v>=25 else 'LOW'
def predict(payload, reports=0):
    vals=[payload.get(k,0) for k in FEATURES]; raw=float(ML.predict([vals])[0]); boost=min(reports*5,15) if reports>=3 else 0; score=round(min(100,raw+boost),1)
    factors=[]
    if vals[1]>=60:factors.append('High 24-hour rainfall')
    if vals[3]>=30:factors.append('Steep slope')
    if vals[5]>=.5:factors.append('High soil moisture')
    if reports>=3:factors.append(f'{reports} verified community reports')
    return score,round(raw,1),boost,factors or ['Current environmental conditions']
class Prediction(BaseModel):
    zone_id:str; rainfall_1h:float=10; rainfall_24h:float=Field(ge=0); rainfall_72h:float=Field(ge=0); slope_deg:float=Field(ge=0,le=90); elevation:float=800; soil_moisture:float=Field(ge=0,le=1); ndvi:float=Field(ge=0,le=1); land_cover:int=2; historical_landslides:int=Field(ge=0); community_report_count:int=Field(default=0,ge=0)
class ReportIn(BaseModel): report_type:str; description:str=Field(min_length=3,max_length=1000); severity:Literal['LOW','MODERATE','HIGH','CRITICAL']; latitude:float=Field(ge=20,le=30); longitude:float=Field(ge=88,le=98)
app=FastAPI(title='Landslide Early Warning System',version='1.0.0',description='Prototype decision-support API; uses documented synthetic demo data.')
app.add_middleware(CORSMiddleware,allow_origins=['http://localhost:5173'],allow_credentials=True,allow_methods=['*'],allow_headers=['*'])
@app.on_event('startup')
def seed():
 Base.metadata.create_all(engine)
 with SessionLocal() as s:
  if not s.scalar(select(Zone.id).limit(1)):
   for z in [('NER-001','Aizawl Hills',23.73,92.72,68,130,36,.61),('NER-002','Kohima Ridge',25.67,94.11,43,95,28,.42),('NER-003','Shillong Plateau',25.58,91.89,79,158,32,.58),('NER-004','Gangtok Valley',27.33,88.61,27,70,22,.31),('NER-005','Imphal Hills',24.82,93.94,54,110,31,.49)]:
    zone=Zone(id=z[0],name=z[1],lat=z[2],lng=z[3],rainfall_24h=z[4],rainfall_72h=z[5],slope=z[6],moisture=z[7]); p={'rainfall_1h':z[4]/10,'rainfall_24h':z[4],'rainfall_72h':z[5],'slope_deg':z[6],'elevation':900,'soil_moisture':z[7],'ndvi':.55,'land_cover':2,'historical_landslides':3,'community_report_count':0}; zone.score,zone.ml_score,zone.community_adjustment,_=predict(p);s.add(zone)
   s.commit()
def zone_out(z): return {'id':z.id,'name':z.name,'lat':z.lat,'lng':z.lng,'risk_score':z.score,'risk_level':level(z.score),'rainfall_24h':z.rainfall_24h,'rainfall_72h':z.rainfall_72h,'slope_deg':z.slope,'soil_moisture':z.moisture,'ml_score':z.ml_score,'community_adjustment':z.community_adjustment,'data_source':'SYNTHETIC DEMO DATA','updated_at':z.updated_at}
@app.get('/api/health')
def health(): return {'status':'healthy','mode':'demo','model_loaded':True,'data_notice':'Synthetic data; not official guidance.'}
@app.get('/api/zones')
def zones(s:Session=Depends(db)): return [zone_out(x) for x in s.scalars(select(Zone)).all()]
@app.get('/api/zones/{zone_id}')
def one_zone(zone_id:str,s:Session=Depends(db)):
 z=s.get(Zone,zone_id)
 if not z:raise HTTPException(404,'Zone not found')
 return zone_out(z)
@app.post('/api/predict')
def prediction(p:Prediction,s:Session=Depends(db)):
 z=s.get(Zone,p.zone_id); verified=p.community_report_count
 if z: verified=max(verified, sum(1 for r in s.scalars(select(Report)).all() if r.status=='VERIFIED' and math.dist((r.latitude,r.longitude),(z.lat,z.lng))<.25))
 score,ml,boost,factors=predict(p.model_dump(),verified)
 if z:z.score,z.ml_score,z.community_adjustment,z.updated_at=score,ml,boost,datetime.utcnow();s.commit(); trigger_alert(s,z)
 return {'zone_id':p.zone_id,'risk_score':score,'risk_level':level(score),'confidence':round(.72+min(score,80)/400,2),'ml_score':ml,'community_adjustment':boost,'contributing_factors':factors}
def trigger_alert(s,z):
 if z.score>=75 and not s.scalar(select(Alert).where(Alert.zone_id==z.id,Alert.status=='ACTIVE')):s.add(Alert(zone_id=z.id,title=f'Critical risk in {z.name}',message='Avoid unstable slopes and follow local authority advice.',severity='CRITICAL'));s.commit()
@app.get('/api/risk-summary')
def summary(s:Session=Depends(db)):
 zs=s.scalars(select(Zone)).all(); return {'overall_score':round(sum(z.score for z in zs)/len(zs),1),'overall_level':level(sum(z.score for z in zs)/len(zs)),'total_zones':len(zs),'high_risk_zones':sum(z.score>=50 for z in zs),'critical_zones':sum(z.score>=75 for z in zs),'active_reports':sum(1 for _ in s.scalars(select(Report).where(Report.status!='REJECTED'))),'active_alerts':sum(1 for _ in s.scalars(select(Alert).where(Alert.status=='ACTIVE'))),'demo_mode':True}
@app.get('/api/risk-trends')
def trends(s:Session=Depends(db)): return [{'hour':f'-{h}h','risk':round(38+18*math.sin(h/14)+h*.12,1)} for h in [72,60,48,36,24,12,6,0]]
@app.post('/api/reports')
def create_report(r:ReportIn,s:Session=Depends(db)):
 recent=s.scalars(select(Report).where(Report.created_at>datetime.utcnow()-timedelta(minutes=10))).all()
 if any(math.dist((x.latitude,x.longitude),(r.latitude,r.longitude))<.001 and x.report_type==r.report_type for x in recent):raise HTTPException(429,'Similar report was submitted recently.')
 x=Report(**r.model_dump());s.add(x);s.commit();s.refresh(x);return report_out(x)
def report_out(x):return {'id':x.id,'report_type':x.report_type,'description':x.description,'severity':x.severity,'latitude':x.latitude,'longitude':x.longitude,'photo_url':x.photo_url,'status':x.status,'created_at':x.created_at}
@app.get('/api/reports')
def reports(s:Session=Depends(db)):return [report_out(x) for x in s.scalars(select(Report).order_by(Report.created_at.desc())).all()]
@app.get('/api/reports/{id}')
def report(id:int,s:Session=Depends(db)): 
 x=s.get(Report,id)
 if not x:raise HTTPException(404,'Report not found')
 return report_out(x)
@app.patch('/api/reports/{id}/moderate')
def moderate(id:int,status:Literal['VERIFIED','REJECTED'],s:Session=Depends(db)):
 x=s.get(Report,id)
 if not x:raise HTTPException(404,'Report not found')
 x.status=status;s.commit();return report_out(x)
@app.get('/api/alerts')
def alerts(s:Session=Depends(db)):return [{'id':x.id,'zone_id':x.zone_id,'title':x.title,'message':x.message,'severity':x.severity,'status':x.status,'created_at':x.created_at} for x in s.scalars(select(Alert).order_by(Alert.created_at.desc())).all()]
@app.patch('/api/alerts/{id}/status')
def alert_status(id:int,status:Literal['ACTIVE','ACKNOWLEDGED','RESOLVED'],s:Session=Depends(db)):
 x=s.get(Alert,id)
 if not x:raise HTTPException(404,'Alert not found')
 x.status=status;s.commit();return {'id':id,'status':status}
@app.get('/api/safe-route')
def route(start_lat:float,start_lng:float,end_lat:float,end_lng:float,s:Session=Depends(db)):
 if not (20<=start_lat<=30 and 20<=end_lat<=30 and 88<=start_lng<=98 and 88<=end_lng<=98):raise HTTPException(422,'Coordinates must be within the NER demo region.')
 direct=math.dist((start_lat,start_lng),(end_lat,end_lng))*111; zs=s.scalars(select(Zone)).all(); crossed=[z for z in zs if min(math.dist((start_lat,start_lng),(z.lat,z.lng)),math.dist((end_lat,end_lng),(z.lat,z.lng)))<.55]; exposure=round(sum(z.score for z in crossed)/(len(crossed) or 1),1)
 mid_lat=(start_lat+end_lat)/2+(0.25 if exposure>=50 else 0); mid_lng=(start_lng+end_lng)/2-(0.25 if exposure>=50 else 0); safe_exp=round(exposure*.48,1)
 return {'route':[[start_lat,start_lng],[mid_lat,mid_lng],[end_lat,end_lng]],'distance_km':round(direct*(1.16 if exposure>=50 else 1.05),1),'duration_minutes':round(direct*(1.16 if exposure>=50 else 1.05)/28*60),'risk_exposure':safe_exp,'risk_level':level(safe_exp),'high_risk_zones':sum(z.score>=50 for z in crossed),'alternative_route':{'distance_km':round(direct,1),'risk_exposure':exposure},'recommendation':'No completely low-risk route is available; this synthetic graph route has the lowest calculated exposure.' if exposure>=50 else 'Route is suitable under current demo risk conditions.','source':'DEMO ROAD GRAPH FALLBACK'}
@app.get('/api/analytics')
def analytics(s:Session=Depends(db)):return {'feature_importance':[{'feature':f,'importance':round(float(v),3)} for f,v in zip(FEATURES,ML.feature_importances_)],'disclaimer':'Prototype decision-support tool; not scientifically validated or an official warning.'}
@app.get('/api/model/feature-importance')
def fi():return [{'feature':f,'importance':round(float(v),3)} for f,v in zip(FEATURES,ML.feature_importances_)]
@app.post('/api/demo/emergency')
def emergency(s:Session=Depends(db)):
 z=s.get(Zone,'NER-003');p=Prediction(zone_id=z.id,rainfall_24h=130,rainfall_72h=230,slope_deg=z.slope,elevation=1100,soil_moisture=.75,ndvi=.5,land_cover=2,historical_landslides=6,community_report_count=3);result=prediction(p,s)
 for kind in ['CRACK','WATER_SEEPAGE','SLOPE_MOVEMENT']:
  s.add(Report(report_type=kind,description='Emergency scenario verified field observation',severity='HIGH',latitude=z.lat,longitude=z.lng,status='VERIFIED'))
 s.commit();return result
