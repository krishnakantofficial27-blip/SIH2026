import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { 
  Play, CheckCircle, ShieldAlert, CloudRain, Cpu, Route, AlertTriangle, 
  X, Pause, ChevronRight, ChevronLeft, Sparkles, UserCheck 
} from 'lucide-react';

interface DemoSimulationModalProps {
  onClose: () => void;
  onSimulationComplete: () => void;
  onNavigateTab?: (tab: string) => void;
}

const JUDGE_STEPS = [
  { 
    id: 1, 
    phase: '1. SENSORS & RAINFALL', 
    title: 'Monsoon Precipitation Surge', 
    desc: 'Simulated cloudburst detected over Mandi Pandoh Gorge. 24h rainfall spikes from 42mm → 155mm; soil volumetric moisture reaches 88%.' 
  },
  { 
    id: 2, 
    phase: '2. GEOTECHNICAL ML INFERENCE', 
    title: 'RandomForest Instability Recalculation', 
    desc: 'Geotechnical model computes excessive shear stress on 38.5° slope. Inverted stability factor drops past critical failure envelope.' 
  },
  { 
    id: 3, 
    phase: '3. RISK SCORE ESCALATION', 
    title: 'Mandi Sector Escalates to CRITICAL (89/100)', 
    desc: 'Risk score dynamically jumps: 48 (Moderate) → 74 (High) → 89 (Critical). Explainable factor contributions update with live saturation bars.' 
  },
  { 
    id: 4, 
    phase: '4. EARLY WARNING DISPATCH', 
    title: 'Automated Multi-Tier Alert Triggered', 
    desc: 'Critical alert issued to HP-SDMA and local residents: "🚨 CRITICAL LANDSLIDE ALERT — Mandi Pandoh Gorge. Avoid NH-21 transit."' 
  },
  { 
    id: 5, 
    phase: '5. CITIZEN OBSERVATION INGESTION', 
    title: 'Ground Tension Cracks Reported by Citizens', 
    desc: 'Local traveler submits report with photos: "6cm tension crack opening along roadway shoulder near Pandoh Dam bypass."' 
  },
  { 
    id: 6, 
    phase: '6. AUTHORITY COMMAND VERIFICATION', 
    title: 'DDMA Mandi Technical Inspection Verifies Report', 
    desc: 'District officer reviews field photo evidence in Authority Console and approves verification (+5 community risk fusion boost).' 
  },
  { 
    id: 7, 
    phase: '7. AI + COMMUNITY RISK FUSION', 
    title: 'Final Calibrated Fusion Score Applied', 
    desc: 'Statistical ML prediction fused with ground truth observations. Final composite risk reaches 89/100 (Maximum Critical Tier).' 
  },
  { 
    id: 8, 
    phase: '8. RISK-AWARE TRANSIT DETOUR', 
    title: 'Dijkstra Penalty Graph Reroutes Highway Traffic', 
    desc: 'Direct NH-21 route blocked due to 74% landslide exposure. System generates alternative lower-risk detour via Kamand-Bajaura.' 
  },
  { 
    id: 9, 
    phase: '9. EMERGENCY RESPONSE DEPLOYMENT', 
    title: 'SDRF & Hospital Resources Placed on Standby', 
    desc: 'Zonal Hospital Mandi and SDRF 3rd Bn notified. Emergency shelters automatically update available bed capacities.' 
  },
  { 
    id: 10, 
    phase: '10. COMPLETE LIFECYCLE CLOSURE', 
    title: 'Platform Workflow Verified: PREDICT → ROUTE → RESPOND', 
    desc: 'Demonstration successfully validates seamless end-to-end hazard mitigation without human communication bottlenecks.' 
  },
];

export const DemoSimulationModal: React.FC<DemoSimulationModalProps> = ({
  onClose,
  onSimulationComplete,
  onNavigateTab,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);
  const [finished, setFinished] = useState<boolean>(false);

  useEffect(() => {
    let timer: any;
    if (running && currentStep > 0 && currentStep <= JUDGE_STEPS.length) {
      timer = setTimeout(() => {
        if (currentStep < JUDGE_STEPS.length) {
          setCurrentStep(prev => prev + 1);
        } else {
          setFinished(true);
          setRunning(false);
          onSimulationComplete();
        }
      }, 2500);
    }
    return () => clearTimeout(timer);
  }, [running, currentStep, onSimulationComplete]);

  const startAutomatedSimulation = async () => {
    setRunning(true);
    setFinished(false);
    setCurrentStep(1);

    try {
      await apiService.runEmergencyScenario();
    } catch {
      console.warn('Simulation running in client sandbox mode');
    }
  };

  const handleNext = () => {
    if (currentStep < JUDGE_STEPS.length) {
      setCurrentStep(prev => prev + 1);
      if (currentStep + 1 === JUDGE_STEPS.length) {
        setFinished(true);
        onSimulationComplete();
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="simulation-modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="sim-title-wrap">
            <span className="sim-badge">SIH 2026 JUDGING DEMO · PAN-INDIA MULTI-HAZARD</span>
            <h2>Emergency Landslide Scenario Simulation (3–5 Min Flow)</h2>
          </div>
          <button className="close-btn" onClick={onClose} title="Close"><X size={20} /></button>
        </div>

        <div className="sim-intro">
          <p>
            Experience the complete SlopeSafe disaster-mitigation lifecycle in action:
            <strong> PREDICT → EXPLAIN → WARN → RESPOND → REPORT → LEARN</strong>
          </p>
        </div>

        {!running && currentStep === 0 && (
          <div className="sim-start-box">
            <Sparkles size={32} className="sim-sparkle-icon" />
            <h3>Interactive Judge Evaluation Sequence</h3>
            <p>
              Simulates a sudden cloudburst scenario over <strong>Mandi — Pandoh Gorge (NH-21)</strong>, demonstrating automated risk escalation, citizen ground verification, and safe transit rerouting.
            </p>
            <div className="sim-btn-row">
              <button className="launch-sim-btn" onClick={startAutomatedSimulation}>
                <Play size={18} /> START AUTOMATED 25-SECOND SIMULATION
              </button>
              <button className="btn-step-manual" onClick={() => { setCurrentStep(1); }}>
                Step-by-Step Manual Walkthrough →
              </button>
            </div>
          </div>
        )}

        {currentStep > 0 && (
          <div className="sim-active-container">
            {/* Playback Controls */}
            <div className="sim-controls-bar">
              <button className="ctrl-btn" onClick={handlePrev} disabled={currentStep <= 1}>
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="step-counter">
                Step <strong>{currentStep}</strong> of {JUDGE_STEPS.length}
              </span>
              <button 
                className="ctrl-btn play-pause" 
                onClick={() => setRunning(!running)}
              >
                {running ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Auto-Play</>}
              </button>
              <button className="ctrl-btn" onClick={handleNext} disabled={currentStep >= JUDGE_STEPS.length}>
                Next <ChevronRight size={16} />
              </button>
            </div>

            {/* Current Step Spotlight Card */}
            <div className="current-step-spotlight">
              <span className="spotlight-phase">{JUDGE_STEPS[currentStep - 1].phase}</span>
              <h3>{JUDGE_STEPS[currentStep - 1].title}</h3>
              <p>{JUDGE_STEPS[currentStep - 1].desc}</p>
            </div>

            {/* Steps Timeline Track */}
            <div className="sim-timeline">
              {JUDGE_STEPS.map(s => {
                const isCompleted = s.id < currentStep || finished;
                const isCurrent = s.id === currentStep && !finished;

                return (
                  <div
                    key={s.id}
                    className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
                    onClick={() => setCurrentStep(s.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="step-icon">
                      {isCompleted ? <CheckCircle size={16} /> : <span>{s.id}</span>}
                    </div>
                    <div className="step-content">
                      <strong>{s.title}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {finished && (
          <div className="sim-complete-box">
            <CheckCircle size={28} className="success-icon" />
            <div>
              <strong>Emergency Simulation Completed!</strong>
              <p>
                Mandi Pandoh Gorge risk escalated to 89/100, official warning dispatched, citizen tension crack report verified, and alternative detour generated on the Live Risk Map.
              </p>
            </div>
            <button className="done-btn" onClick={onClose}>
              View Updated Dashboard & Risk Map →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
