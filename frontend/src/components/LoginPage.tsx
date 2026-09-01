import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, UserCheck, Key, ArrowRight, CheckCircle2, Building2, User } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: { name: string; role: 'Resident' | 'Authority'; email: string }) => void;
  onCancel: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onCancel }) => {
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
      const name = role === 'Authority' ? 'Dr. A. Sharma (NDMA Officer)' : 'R. Gogoi (Resident)';
      setSuccessMsg(`Authentication Successful! Welcome, ${name}.`);

      setTimeout(() => {
        onLoginSuccess({
          name: name,
          role: role,
          email: email,
        });
      }, 900);
    }, 600);
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
    <div className="login-page-container">
      <div className="login-page-card">
        <div className="login-card-header">
          <div className="brand-badge">
            <ShieldCheck size={32} className="brand-icon" />
            <div>
              <span className="eyebrow-tag">SIH 2026 OFFICIAL PORTAL</span>
              <h2>SlopeSafe Disaster Management Portal</h2>
            </div>
          </div>
          <p className="login-subtitle">
            Secure multi-role authentication for North Eastern Region Disaster Management Officers, Field Inspectors, and Local Residents.
          </p>
        </div>

        <div className="role-tab-selector">
          <button
            type="button"
            className={`role-tab ${role === 'Authority' ? 'active' : ''}`}
            onClick={() => fillQuickDemo('Authority')}
          >
            <Building2 size={18} /> Authority / Officer Login
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'Resident' ? 'active' : ''}`}
            onClick={() => fillQuickDemo('Resident')}
          >
            <User size={18} /> Resident / Community Login
          </button>
        </div>

        {successMsg ? (
          <div className="login-success-box">
            <CheckCircle2 size={36} className="success-icon" />
            <h3>{successMsg}</h3>
            <p>Redirecting to dashboard...</p>
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
                placeholder="Enter account password..."
                required
              />
            </div>

            <div className="quick-login-presets">
              <span>Quick Demo Fill:</span>
              <div className="preset-buttons">
                <button type="button" onClick={() => fillQuickDemo('Authority')}>
                  🔐 NDMA Officer Credentials
                </button>
                <button type="button" onClick={() => fillQuickDemo('Resident')}>
                  👤 Resident Credentials
                </button>
              </div>
            </div>

            <div className="form-actions-row">
              <button type="button" className="cancel-btn" onClick={onCancel}>
                Cancel & Return
              </button>
              <button type="submit" className="login-submit-btn" disabled={loading}>
                {loading ? 'Authenticating...' : `SIGN IN AS ${role.toUpperCase()}`}
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        )}

        <div className="login-footer-notice">
          <Key size={14} />
          <span>Secured 256-bit encrypted portal access. Authorized access only.</span>
        </div>
      </div>
    </div>
  );
};
