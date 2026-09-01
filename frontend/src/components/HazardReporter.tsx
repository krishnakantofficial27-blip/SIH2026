import React, { useState } from 'react';
import { ReportType, Severity } from '../types';
import { apiService } from '../services/api';
import { Send, MapPin, Camera, AlertCircle, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';

interface HazardReporterProps {
  onReportSubmitted: () => void;
  userLocation?: { lat: number; lng: number } | null;
  onFetchLocation?: () => void;
}

const REPORT_TYPES: { type: ReportType; label: string; icon: string }[] = [
  { type: 'CRACK', label: 'Ground Cracks', icon: '⚡' },
  { type: 'WATER_SEEPAGE', label: 'Water Seepage', icon: '💧' },
  { type: 'SLOPE_MOVEMENT', label: 'Slope Movement', icon: '⛰️' },
  { type: 'FALLING_DEBRIS', label: 'Falling Debris', icon: '🪨' },
  { type: 'OTHER', label: 'Unusual Movement', icon: '⚠️' },
];

export const HazardReporter: React.FC<HazardReporterProps> = ({
  onReportSubmitted,
  userLocation,
  onFetchLocation,
}) => {
  const [selectedType, setSelectedType] = useState<ReportType>('CRACK');
  const [severity, setSeverity] = useState<Severity>('HIGH');
  const [description, setDescription] = useState<string>('');
  const [lat, setLat] = useState<number>(userLocation?.lat || 25.58);
  const [lng, setLng] = useState<number>(userLocation?.lng || 91.89);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatusMsg({ text: 'Photo file size exceeds 5MB limit.', isError: true });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUseMyLocation = () => {
    if (userLocation) {
      setLat(userLocation.lat);
      setLng(userLocation.lng);
      setStatusMsg({ text: 'GPS location applied.', isError: false });
    } else if (onFetchLocation) {
      onFetchLocation();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setStatusMsg({ text: 'Please provide a brief description.', isError: true });
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);

    try {
      await apiService.submitReport({
        report_type: selectedType,
        description: description.trim(),
        severity: severity,
        latitude: lat,
        longitude: lng,
        photo_url: photoUrl || undefined,
      });

      setStatusMsg({ text: '✅ Hazard report submitted successfully for authority verification!', isError: false });
      setDescription('');
      setPhotoUrl('');
      onReportSubmitted();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit report. Check network connection.';
      setStatusMsg({ text: msg, isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="hazard-reporter-card">
      <div className="form-header">
        <ShieldAlert size={24} className="header-icon" />
        <div>
          <h2>Report Ground Hazard</h2>
          <p>Help local authorities & early warning models verify real-time slope movement</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="hazard-form">
        {/* Type Selection Grid */}
        <label className="field-label">SELECT HAZARD TYPE</label>
        <div className="hazard-type-grid">
          {REPORT_TYPES.map(item => (
            <button
              type="button"
              key={item.type}
              className={`type-chip ${selectedType === item.type ? 'active' : ''}`}
              onClick={() => setSelectedType(item.type)}
            >
              <span className="type-icon">{item.icon}</span>
              <span className="type-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Severity Picker */}
        <div className="form-row">
          <div className="field-group">
            <label className="field-label">SEVERITY LEVEL</label>
            <div className="severity-selector">
              {(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as Severity[]).map(sev => (
                <button
                  type="button"
                  key={sev}
                  className={`sev-btn ${sev} ${severity === sev ? 'selected' : ''}`}
                  onClick={() => setSeverity(sev)}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location Picker */}
        <div className="field-group">
          <div className="location-header-row">
            <label className="field-label">GPS LOCATION</label>
            <button type="button" className="gps-btn" onClick={handleUseMyLocation}>
              <MapPin size={14} /> Use My GPS Location
            </button>
          </div>
          <div className="coords-inputs">
            <input
              type="number"
              step="0.0001"
              placeholder="Latitude"
              value={lat}
              onChange={e => setLat(parseFloat(e.target.value))}
              required
            />
            <input
              type="number"
              step="0.0001"
              placeholder="Longitude"
              value={lng}
              onChange={e => setLng(parseFloat(e.target.value))}
              required
            />
          </div>
        </div>

        {/* Description */}
        <div className="field-group">
          <label className="field-label">DESCRIPTION OF HAZARD</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe cracks, water seepage, rockfall, or road obstruction..."
            required
          />
        </div>

        {/* Photo Upload */}
        <div className="field-group">
          <label className="field-label">EVIDENCE PHOTO (OPTIONAL)</label>
          <div className="file-upload-box">
            <Camera size={20} />
            <input type="file" accept="image/*" onChange={handlePhotoUpload} />
            <span>{photoUrl ? 'Photo Uploaded ✓' : 'Click to Upload Photo (Max 5MB)'}</span>
          </div>
          {photoUrl && (
            <div className="photo-preview">
              <img src={photoUrl} alt="Hazard Evidence Preview" />
            </div>
          )}
        </div>

        {/* Submit Status Message */}
        {statusMsg && (
          <div className={`notice ${statusMsg.isError ? 'error-banner' : 'connecting'}`}>
            {statusMsg.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <button type="submit" className="submit-report-btn" disabled={submitting}>
          {submitting ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          {submitting ? 'Submitting Report...' : 'SUBMIT HAZARD REPORT'}
        </button>
      </form>
    </div>
  );
};
