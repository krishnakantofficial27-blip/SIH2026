import React from 'react';
import { CloudRain, Sun, CloudSun, CloudLightning, Umbrella, TrendingUp, ThermometerSun } from 'lucide-react';

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

const FORECAST_DATA: ForecastDay[] = [
  { day: 'Today', date: 'Sep 1', icon: '🌧️', condition: 'Heavy Rain', temp_high: 24, temp_low: 18, rainfall_mm: 42, humidity: 88, wind_kmh: 22, risk_projection: 72, risk_level: 'HIGH' },
  { day: 'Tue', date: 'Sep 2', icon: '⛈️', condition: 'Thunderstorm', temp_high: 22, temp_low: 17, rainfall_mm: 68, humidity: 92, wind_kmh: 35, risk_projection: 85, risk_level: 'CRITICAL' },
  { day: 'Wed', date: 'Sep 3', icon: '🌧️', condition: 'Moderate Rain', temp_high: 23, temp_low: 18, rainfall_mm: 35, humidity: 82, wind_kmh: 18, risk_projection: 68, risk_level: 'HIGH' },
  { day: 'Thu', date: 'Sep 4', icon: '🌦️', condition: 'Light Showers', temp_high: 25, temp_low: 19, rainfall_mm: 12, humidity: 72, wind_kmh: 14, risk_projection: 48, risk_level: 'MODERATE' },
  { day: 'Fri', date: 'Sep 5', icon: '⛅', condition: 'Partly Cloudy', temp_high: 27, temp_low: 20, rainfall_mm: 4, humidity: 60, wind_kmh: 10, risk_projection: 32, risk_level: 'MODERATE' },
  { day: 'Sat', date: 'Sep 6', icon: '☀️', condition: 'Clear', temp_high: 29, temp_low: 21, rainfall_mm: 0, humidity: 48, wind_kmh: 8, risk_projection: 22, risk_level: 'LOW' },
  { day: 'Sun', date: 'Sep 7', icon: '🌤️', condition: 'Sunny', temp_high: 30, temp_low: 22, rainfall_mm: 1, humidity: 45, wind_kmh: 6, risk_projection: 18, risk_level: 'LOW' },
];

const getRiskColor = (level: string) => {
  const map: Record<string, string> = { LOW: '#22c55e', MODERATE: '#eab308', HIGH: '#f97316', CRITICAL: '#ef4444' };
  return map[level] || '#94a3b8';
};

export const WeatherForecast: React.FC = () => {
  const peakDay = FORECAST_DATA.reduce((max, d) => d.risk_projection > max.risk_projection ? d : max, FORECAST_DATA[0]);
  const totalRainfall = FORECAST_DATA.reduce((sum, d) => sum + d.rainfall_mm, 0);

  return (
    <div className="weather-forecast">
      <div className="weather-header">
        <CloudRain size={24} className="brand-icon" />
        <div>
          <h2>7-Day Weather Forecast & Risk Projection</h2>
          <p>IMD-correlated rainfall forecast with ML-driven landslide risk projection for the NE Region</p>
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
            <strong>{Math.min(...FORECAST_DATA.map(d => d.temp_low))}° — {Math.max(...FORECAST_DATA.map(d => d.temp_high))}°C</strong>
          </div>
        </div>
      </div>

      {/* Forecast Cards Grid */}
      <div className="forecast-grid">
        {FORECAST_DATA.map(d => (
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
              <span>💧 {d.humidity}%</span>
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
          {FORECAST_DATA.map(d => (
            <div key={d.day} className="rain-bar-col">
              <div className="rain-bar-value">{d.rainfall_mm}</div>
              <div className="rain-bar" style={{ height: `${Math.max(4, (d.rainfall_mm / 80) * 100)}%`, background: getRiskColor(d.risk_level) }}></div>
              <div className="rain-bar-label">{d.day}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="weather-footer">
        <span>⚠️ Forecast data simulated for prototype demonstration. Production system integrates with IMD, ECMWF, and GPM satellite APIs.</span>
      </div>
    </div>
  );
};
