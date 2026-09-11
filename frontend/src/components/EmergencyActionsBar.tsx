import React from 'react';
import { Route, Send, Phone, AlertCircle } from 'lucide-react';

interface EmergencyActionsBarProps {
  onFindRoute: () => void;
  onReportHazard: () => void;
  onEmergencyHelp: () => void;
}

export const EmergencyActionsBar: React.FC<EmergencyActionsBarProps> = ({
  onFindRoute,
  onReportHazard,
  onEmergencyHelp,
}) => {
  return (
    <div className="command-panel emergency-actions-panel">
      <div className="action-panel-header">
        <div className="action-panel-title-wrap">
          <AlertCircle size={18} className="text-cyan" />
          <div>
            <h3>EMERGENCY ACTIONS</h3>
            <p className="panel-subtitle">Quick access to essential tools and services.</p>
          </div>
        </div>
      </div>

      <div className="action-buttons-group">
        <button 
          onClick={onFindRoute} 
          className="cmd-btn cmd-btn-primary"
          title="Plan detour bypassing landslide corridors"
        >
          <Route size={16} />
          <span>Find Safest Corridor</span>
        </button>

        <button 
          onClick={onReportHazard} 
          className="cmd-btn cmd-btn-secondary"
          title="Submit ground truth photograph or slope crack alert"
        >
          <Send size={16} />
          <span>Report Hazard</span>
        </button>

        <button 
          onClick={onEmergencyHelp} 
          className="cmd-btn cmd-btn-danger"
          title="Direct emergency dispatch to ERSS 112 & SDEOC 1070"
        >
          <Phone size={16} />
          <span>Emergency Helpline (112)</span>
        </button>
      </div>
    </div>
  );
};
