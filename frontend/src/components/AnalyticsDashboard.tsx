import React, { useEffect, useState } from 'react';
import { AnalyticsData, RiskTrend } from '../types';
import { apiService } from '../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { BarChart3, TrendingUp, CloudRain, Users, ShieldAlert, Cpu } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [trends, setTrends] = useState<RiskTrend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([apiService.getAnalytics(), apiService.getRiskTrends()])
      .then(([aData, tData]) => {
        setAnalytics(aData);
        setTrends(tData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !analytics) {
    return <div className="loading-state"><p>Loading analytics data from backend API...</p></div>;
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <BarChart3 size={24} className="header-icon" />
        <div>
          <h2>Disaster Analytics & Risk Intelligence</h2>
          <p>Real-time telemetry, model metrics, and community ground report distributions</p>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Chart 1: 72h Risk Trend */}
        <div className="analytics-card">
          <div className="chart-title">
            <TrendingUp size={18} />
            <h3>72-Hour Regional Risk Trend</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="hour" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="risk" name="Risk Score (/100)" stroke="#ef4444" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Rainfall vs Risk Correlation */}
        <div className="analytics-card">
          <div className="chart-title">
            <CloudRain size={18} />
            <h3>Rainfall vs Risk Correlation</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="rainfall" name="Rainfall (mm)" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="risk" name="Risk Index" stroke="#f97316" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Risk Score by Monitored Zone */}
        <div className="analytics-card">
          <div className="chart-title">
            <ShieldAlert size={18} />
            <h3>Current Risk Index by Zone</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={analytics.zone_scores}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" name="Risk Score" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Community Ground Reports by Type */}
        <div className="analytics-card">
          <div className="chart-title">
            <Users size={18} />
            <h3>Community Reports by Type</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={analytics.reports_by_type}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="Reports Count" fill="#9333ea" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
