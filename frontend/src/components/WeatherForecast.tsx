import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, CloudSun, CloudLightning, Umbrella, TrendingUp, ThermometerSun, Loader2 } from 'lucide-react';
import axios from 'axios';

interface ForecastDay {
  day: string;
  date: string;
  icon: string;
  condition: string;
  temp_high: number;
  temp_low: number;
  rainfall_mm: number;
  humidity: number;
  wind_kmh: number;
  risk_projection: number;
  risk_level: string;
}

interface WeatherForecastProps {
  userLocation?: { lat: number; lng: number } | null;
}

const getRiskColor = (level: string) => {
  const map: Record<string, string> = { LOW: '#22c55e', MODERATE: '#eab308', HIGH: '#f97316', CRITICAL: '#ef4444' };
  return map[level] || '#94a3b8';
};

const parseWMOCode = (code: number): { icon: string, condition: string } => {
  if (code === 0) return { icon: '☀️', condition: 'Clear' };
  if (code === 1 || code === 2) return { icon: '⛅', condition: 'Partly Cloudy' };
  if (code === 3) return { icon: '☁️', condition: 'Overcast' };
  if (code >= 45 && code <= 48) return { icon: '🌫️', condition: 'Fog' };
  if (code >= 51 && code <= 55) return { icon: '🌦️', condition: 'Drizzle' };
  if (code >= 61 && code <= 65) return { icon: '🌧️', condition: 'Rain' };
  if (code >= 71 && code <= 77) return { icon: '❄️', condition: 'Snow' };
  if (code >= 80 && code <= 82) return { icon: '🌧️', condition: 'Heavy Rain' };
  if (code >= 95 && code <= 99) return { icon: '⛈️', condition: 'Thunderstorm' };
  return { icon: '🌤️', condition: 'Unknown' };
};

export const WeatherForecast: React.FC<WeatherForecastProps> = ({ userLocation }) => {
  const [forecastData, setForecastData] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        const lat = userLocation ? userLocation.lat : 25.58;
        const lng = userLocation ? userLocation.lng : 91.89;
        
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=auto`;
        const res = await axios.get(url);
        
        const daily = res.data.daily;
        const days: ForecastDay[] = [];
        
        for (let i = 0; i < 7; i++) {
          const dateObj = new Date(daily.time[i]);
          const dayName = i === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          const wmo = parseWMOCode(daily.weathercode[i]);
          const rain = daily.precipitation_sum[i] || 0;
          
          // Compute Risk based strictly on real forecasted rain
          let newRisk = 10; // Baseline
          if (rain > 10) newRisk += rain * 1.5;
          if (rain > 50) newRisk += 20; // Critical threshold jump
          newRisk = Math.min(100, Math.round(newRisk));
          
          let newLevel = 'LOW';
          if (newRisk > 75) newLevel = 'CRITICAL';
          else if (newRisk > 50) newLevel = 'HIGH';
          else if (newRisk > 25) newLevel = 'MODERATE';
          
          days.push({
            day: dayName,
            date: dateStr,
            icon: wmo.icon,
            condition: wmo.condition,
            temp_high: Math.round(daily.temperature_2m_max[i]),
            temp_low: Math.round(daily.temperature_2m_min[i]),
            rainfall_mm: rain,
            humidity: 70 + Math.round(Math.random() * 20), // Placeholder as open-meteo daily lacks relative humidity without hourly aggregation
            wind_kmh: Math.round(daily.windspeed_10m_max[i] || 10),
            risk_projection: newRisk,
            risk_level: newLevel
          });
        }
        setForecastData(days);
      } catch (err) {
        setError('Failed to fetch live meteorological data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeather();
  }, [userLocation]);

  if (loading) {
    return (
      <div className="weather-forecast" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-primary)' }} />
        <span style={{ marginLeft: '12px' }}>Connecting to Open-Meteo Satellite API...</span>
      </div>
    );
  }

  if (error || forecastData.length === 0) {
    return (
      <div className="weather-forecast" style={{ padding: '24px', color: 'var(--risk-crit)' }}>
        ⚠️ {error || 'No forecast data available.'}
      </div>
    );
  }

  const peakDay = forecastData.reduce((max, d) => d.risk_projection > max.risk_projection ? d : max, forecastData[0]);
  const totalRainfall = Math.round(forecastData.reduce((sum, d) => sum + d.rainfall_mm, 0) * 10) / 10;

  return (
    <div className="weather-forecast">
      <div className="weather-header">
        <CloudRain size={24} className="brand-icon" />
        <div>
          <h2>Live Meteorological Forecast & Risk Model</h2>
          <p>
            {userLocation 
              ? `Real-time Open-Meteo forecast targeting coordinates [${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}]` 
              : 'Real-time Open-Meteo forecast targeting default region [25.58, 91.89]'}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="weather-summary-row">
        <div className="weather-summary-card">
          <Umbrella size={18} />
          <div>
            <small>Total 7-Day Rainfall</small>
            <strong>{totalRainfall} mm</strong>
          </div>
        </div>
        <div className="weather-summary-card" style={{ borderColor: getRiskColor(peakDay.risk_level) }}>
          <TrendingUp size={18} style={{ color: getRiskColor(peakDay.risk_level) }} />
          <div>
            <small>Peak Risk Day</small>
            <strong style={{ color: getRiskColor(peakDay.risk_level) }}>{peakDay.day} ({peakDay.date}) — {peakDay.risk_level}</strong>
          </div>
        </div>
        <div className="weather-summary-card">
          <ThermometerSun size={18} />
          <div>
            <small>Temperature Range</small>
            <strong>{Math.min(...forecastData.map(d => d.temp_low))}° — {Math.max(...forecastData.map(d => d.temp_high))}°C</strong>
          </div>
        </div>
      </div>

      {/* Forecast Cards Grid */}
      <div className="forecast-grid">
        {forecastData.map(d => (
          <div key={d.day} className={`forecast-card ${d.day === 'Today' ? 'today' : ''}`}>
            <div className="forecast-day-label">{d.day}</div>
            <div className="forecast-date">{d.date}</div>
            <div className="forecast-icon">{d.icon}</div>
            <div className="forecast-condition">{d.condition}</div>
            <div className="forecast-temps">
              <span className="temp-high">{d.temp_high}°</span>
              <span className="temp-low">{d.temp_low}°</span>
            </div>
            <div className="forecast-detail">
              <span>🌧️ {d.rainfall_mm} mm</span>
              <span>💨 {d.wind_kmh} km/h</span>
            </div>
            <div className="forecast-risk-bar">
              <div className="risk-bar-track">
                <div className="risk-bar-fill" style={{ width: `${d.risk_projection}%`, background: getRiskColor(d.risk_level) }}></div>
              </div>
              <span className="risk-label" style={{ color: getRiskColor(d.risk_level) }}>
                Risk: {d.risk_projection}/100
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Rainfall Chart Preview */}
      <div className="rainfall-bar-chart">
        <h3>Rainfall Accumulation (mm)</h3>
        <div className="rain-bars">
          {forecastData.map(d => (
            <div key={d.day} className="rain-bar-col">
              <div className="rain-bar-value">{d.rainfall_mm}</div>
              <div className="rain-bar" style={{ height: `${Math.max(4, (d.rainfall_mm / 80) * 100)}%`, background: getRiskColor(d.risk_level) }}></div>
              <div className="rain-bar-label">{d.day}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="weather-footer">
        <span>⚠️ Powered by live Open-Meteo API. Risk projection dynamically computed from live precipitation payload.</span>
      </div>
    </div>
  );
};
