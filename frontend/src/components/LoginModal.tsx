import React, { useState } from 'react';
import { X, ShieldCheck, Lock, Mail, UserCheck, Key, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: { name: string; role: 'Resident' | 'Authority'; email: string }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLoginSuccess }) => {
  const [role, setRole] = useState<'Resident' | 'Authority'>('Authority');
  const [email, setEmail] = useState<string>('officer.ndma@sih2026.gov.in');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccessMsg(`Welcome, ${role === 'Authority' ? 'NDMA Officer' : 'Resident'}! Authentication successful.`);
      
      setTimeout(() => {
        onLoginSuccess({
          name: role === 'Authority' ? 'Dr. A. Sharma (NDMA Officer)' : 'R. Gogoi (Resident)',
          role: role,
          email: email,
        });
        onClose();
      }, 1000);
    }, 800);
  };

  const fillQuickDemo = (targetRole: 'Resident' | 'Authority') => {
    setRole(targetRole);
    if (targetRole === 'Authority') {
      setEmail('officer.ndma@sih2026.gov.in');
      setPassword('sih2026password');
    } else {
      setEmail('resident.aizawl@gmail.com');
      setPassword('resident123');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="login-modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="brand-header">
            <ShieldCheck size={26} className="brand-icon" />
            <div>
              <span className="portal-tag">SIH 2026 PORTAL</span>
              <h2>SlopeSafe Portal Login</h2>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="role-tab-selector">
          <button
            type="button"
            className={`role-tab ${role === 'Authority' ? 'active' : ''}`}
            onClick={() => fillQuickDemo('Authority')}
          >
            <ShieldCheck size={16} /> Authority / Officer
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'Resident' ? 'active' : ''}`}
            onClick={() => fillQuickDemo('Resident')}
          >
            <UserCheck size={16} /> Resident / Community
          </button>
        </div>

        {successMsg ? (
          <div className="login-success-box">
            <CheckCircle2 size={32} className="success-icon" />
            <p>{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="login-form">
            <div className="field-group">
              <label><Mail size={14} /> Official Email / User ID</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="officer@disaster.gov.in"
                required
              />
            </div>

            <div className="field-group">
              <label><Lock size={14} /> Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password..."
                required
              />
            </div>

            <div className="quick-login-presets">
              <small>Quick Demo Login:</small>
              <div className="preset-buttons">
                <button type="button" onClick={() => fillQuickDemo('Authority')}>
                  Authority Demo
                </button>
                <button type="button" onClick={() => fillQuickDemo('Resident')}>
                  Resident Demo
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Authenticating...' : `SIGN IN AS ${role.toUpperCase()}`}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        <div className="login-footer-notice">
          <Key size={13} />
          <span>Secured 256-bit encrypted authentication for Disaster Management Officials & North Eastern Region Residents.</span>
        </div>
      </div>
    </div>
  );
};
