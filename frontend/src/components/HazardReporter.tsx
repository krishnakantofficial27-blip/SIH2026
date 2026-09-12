import React, { useState } from 'react';
import { ReportType, Severity } from '../types';
import { apiService } from '../services/api';
import { 
  Send, MapPin, Camera, AlertCircle, CheckCircle2, Loader2, 
  ShieldAlert, Info, FileCheck, Compass, AlertTriangle 
} from 'lucide-react';

interface HazardReporterProps {
  onReportSubmitted: () => void;
  userLocation?: { lat: number; lng: number } | null;
  onFetchLocation?: () => void;
  initialLocation?: { lat: number; lng: number } | null;
}

const REPORT_TYPES: { type: ReportType; label: string; icon: string; desc: string }[] = [
  { type: 'CRACK', label: 'Ground Tension Cracks', icon: '⚡', desc: 'Fissures or cracks opening on roadway/soil' },
  { type: 'WATER_SEEPAGE', label: 'Muddy Water Seepage', icon: '💧', desc: 'Springs or muddy outflow through retaining walls' },
  { type: 'SLOPE_MOVEMENT', label: 'Active Slope Movement', icon: '⛰️', desc: 'Creep, tilting trees, or bulging ground' },
  { type: 'FALLING_DEBRIS', label: 'Rockfall / Shooting Stones', icon: '🪨', desc: 'Boulders or gravel falling onto roads' },
  { type: 'ROAD_BLOCKAGE', label: 'Highway Road Blockage', icon: '🚧', desc: 'Debris preventing vehicle transit' },
  { type: 'OTHER', label: 'Other Hazard', icon: '⚠️', desc: 'Unusual geological observations' },
];

const NATIONAL_DISTRICTS = [
  'Wayanad (Kerala)', 'Idukki (Kerala)', 'Kozhikode (Kerala)', 'Malappuram (Kerala)',
  'Mandi (Himachal Pradesh)', 'Shimla (Himachal Pradesh)', 'Kullu (Himachal Pradesh)', 
  'Kangra (Himachal Pradesh)', 'Kinnaur (Himachal Pradesh)', 'Chamba (Himachal Pradesh)', 
  'Solan (Himachal Pradesh)', 'Lahaul & Spiti (Himachal Pradesh)',
  'Rudraprayag (Uttarakhand)', 'Chamoli (Uttarakhand)', 'Nainital (Uttarakhand)', 
  'Uttarkashi (Uttarakhand)', 'Pithoragarh (Uttarakhand)',
  'Raigad (Maharashtra)', 'Pune (Maharashtra)', 'Ratnagiri (Maharashtra)', 'Satara (Maharashtra)',
  'Nilgiris (Tamil Nadu)', 'Kodagu (Karnataka)', 'Chikkamagaluru (Karnataka)',
  'North Sikkim (Sikkim)', 'Darjeeling (West Bengal)', 'Dima Hasao (Assam)', 'East Khasi Hills (Meghalaya)',
  'Ramban (Jammu & Kashmir)', 'Doda (Jammu & Kashmir)'
];

export const HazardReporter: React.FC<HazardReporterProps> = ({
  onReportSubmitted,
  userLocation,
  onFetchLocation,
  initialLocation,
}) => {
  const [selectedType, setSelectedType] = useState<ReportType>('CRACK');
  const [severity, setSeverity] = useState<Severity>('HIGH');
  const [district, setDistrict] = useState<string>('Wayanad (Kerala)');
  const [description, setDescription] = useState<string>('');
  const [lat, setLat] = useState<number>(initialLocation?.lat || userLocation?.lat || 11.53);
  const [lng, setLng] = useState<number>(initialLocation?.lng || userLocation?.lng || 76.13);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedReportCode, setSubmittedReportCode] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  React.useEffect(() => {
    if (initialLocation) {
      setLat(initialLocation.lat);
      setLng(initialLocation.lng);
    }
  }, [initialLocation]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMsg({ text: 'Invalid file format. Please upload an image file (JPEG, PNG, WEBP).', isError: true });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMsg({ text: 'Photo file size exceeds 5MB limit. Please select a smaller photo.', isError: true });
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result as string);
      setStatusMsg({ text: 'Evidence photo attached successfully.', isError: false });
    };
    reader.readAsDataURL(file);
  };

  const handleUseMyLocation = () => {
    if (userLocation) {
      setLat(parseFloat(userLocation.lat.toFixed(4)));
      setLng(parseFloat(userLocation.lng.toFixed(4)));
      setStatusMsg({ text: 'Live GPS coordinates applied.', isError: false });
    } else if (onFetchLocation) {
      onFetchLocation();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      setStatusMsg({ text: 'Please provide a more descriptive summary (at least 10 characters).', isError: true });
      return;
    }

    // Coordinate validation for Pan-India landslide zones (Lat 6–38, Lng 68–98)
    if (lat < 6.0 || lat > 38.0 || lng < 68.0 || lng > 98.0) {
      setStatusMsg({ text: 'Coordinates must fall within India geographic monitoring boundaries (Lat 6–38° N, Lng 68–98° E).', isError: true });
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);

    try {
      const rep = await apiService.submitReport({
        report_type: selectedType,
        description: description.trim(),
        severity: severity,
        latitude: lat,
        longitude: lng,
        district: district,
        photo_url: photoUrl || undefined,
      });

      const code = rep.report_code || `#NAT-2026-${rep.id}`;
      setSubmittedReportCode(code);
      setStatusMsg({ 
        text: `Report ${code} submitted successfully! It has been routed to the District Disaster Management Authority for verification.`, 
        isError: false 
      });
      setDescription('');
      setPhotoUrl('');
      setFileName('');
      onReportSubmitted();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit report. Please check your network connection.';
      setStatusMsg({ text: msg, isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="hazard-reporter-container">
      <div className="reporter-header">
        <Send size={26} className="header-icon" />
        <div>
          <h2>Citizen Hazard Observation Dispatch</h2>
          <p>Verified crowd reports fuse directly with satellite ML risk assessments to adjust localized threat scores</p>
        </div>
      </div>

      {submittedReportCode && (
        <div className="report-success-banner">
          <FileCheck size={28} />
          <div>
            <strong>Report Successfully Registered: {submittedReportCode}</strong>
            <p>Status: <code>SUBMITTED (Pending Field Verification)</code></p>
            <small>Once verified by local SDMA authorities, this observation will dynamically recalibrate the zone risk score.</small>
          </div>
          <button className="dismiss-btn" onClick={() => setSubmittedReportCode(null)}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="report-form-card">
        {/* Type Selection Grid */}
        <div className="field-group">
          <label className="field-label">1. SELECT HAZARD PHENOMENON TYPE</label>
          <div className="hazard-type-grid">
            {REPORT_TYPES.map(item => (
              <button
                type="button"
                key={item.type}
                className={`type-chip ${selectedType === item.type ? 'active' : ''}`}
                onClick={() => setSelectedType(item.type)}
              >
                <span className="type-icon">{item.icon}</span>
                <div className="type-text">
                  <span className="type-label">{item.label}</span>
                  <small className="type-sub">{item.desc}</small>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Severity & District Row */}
        <div className="form-row-two">
          <div className="field-group">
            <label className="field-label">2. OBSERVED SEVERITY / RISK</label>
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

          <div className="field-group">
            <label className="field-label">3. STATE & DISTRICT JURISDICTION</label>
            <select
              value={district}
              onChange={e => setDistrict(e.target.value)}
              className="district-select-input"
            >
              {NATIONAL_DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Location Picker */}
        <div className="field-group">
          <div className="location-header-row">
            <label className="field-label">4. INCIDENT COORDINATES</label>
            <button type="button" className="gps-btn" onClick={handleUseMyLocation}>
              <MapPin size={14} /> Auto-Fill GPS Position
            </button>
          </div>
          <div className="coords-inputs">
            <input
              type="number"
              step="0.0001"
              placeholder="Latitude (e.g. 31.6700)"
              value={lat}
              onChange={e => setLat(parseFloat(e.target.value))}
              required
            />
            <input
              type="number"
              step="0.0001"
              placeholder="Longitude (e.g. 77.0500)"
              value={lng}
              onChange={e => setLng(parseFloat(e.target.value))}
              required
            />
          </div>
          <small className="field-hint">Tip: You can also tap directly on the Live Risk Map to acquire coordinates.</small>
        </div>

        {/* Description */}
        <div className="field-group">
          <label className="field-label">5. FIELD OBSERVATION DETAILS</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe what you see: crack width, water turbidity, boulder size, exact highway milestone or landmark..."
            required
            minLength={10}
          />
        </div>

        {/* Photo Upload with Preview */}
        <div className="field-group">
          <label className="field-label">6. FIELD EVIDENCE PHOTO (OPTIONAL, MAX 5MB)</label>
          <div className="file-upload-box">
            <Camera size={22} />
            <input type="file" accept="image/*" onChange={handlePhotoUpload} />
            <span>{fileName ? `Attached: ${fileName}` : 'Click to Upload Ground Photo (JPG, PNG, WEBP)'}</span>
          </div>
          {photoUrl && (
            <div className="photo-preview-wrap">
              <img src={photoUrl} alt="Citizen Evidence" className="photo-preview-img" />
              <button type="button" className="remove-photo-btn" onClick={() => { setPhotoUrl(''); setFileName(''); }}>
                Remove Photo
              </button>
            </div>
          )}
        </div>

        {/* Status notice */}
        {statusMsg && (
          <div className={`notice ${statusMsg.isError ? 'error-banner' : 'success-banner'}`}>
            {statusMsg.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <button type="submit" className="submit-report-btn" disabled={submitting}>
          {submitting ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          {submitting ? 'Submitting & Verifying...' : 'SUBMIT CITIZEN HAZARD REPORT'}
        </button>
      </form>
    </div>
  );
};
