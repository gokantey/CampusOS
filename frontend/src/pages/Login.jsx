import React, { useState } from 'react';
import { 
  GraduationCap, Lock, User as UserIcon, AlertCircle, Eye, EyeOff, 
  ShieldCheck, Zap, BarChart3, ArrowRight, CheckCircle2, RefreshCw 
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { db } from '../db/db';
import { syncService } from '../services/syncService';

async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isOnline = syncService.isOnline();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setError('');
    setLoading(true);

    try {
      if (isOnline) {
        // Online login
        const response = await apiRequest('/api/auth/login/', 'POST', { username, password });
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify({
            id: response.user_id,
            email: response.email,
            full_name: response.full_name,
            role: response.role
          }));

          // Cache credentials locally for offline use
          const pwHash = await hashPassword(password);
          await db.users.put({
            id: response.user_id,
            username: username,
            password_hash: pwHash,
            full_name: response.full_name,
            role: response.role
          });

          onLoginSuccess(response);
        }
      } else {
        // Offline login
        const localUser = await db.users.where('username').equals(username).first();
        if (localUser) {
          const pwHash = await hashPassword(password);
          if (localUser.password_hash === pwHash) {
            const userData = {
              id: localUser.id,
              username: localUser.username,
              full_name: localUser.full_name,
              role: localUser.role
            };
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', 'offline-token-session');
            onLoginSuccess(userData);
          } else {
            setError('Invalid username or password.');
          }
        } else {
          setError('No offline user profile found. Please log in online first to cache your profile.');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-page">
      {/* ── Left Hero Panel (Classy Dark Slate Brand Showcase) ── */}
      <div className="login-hero-panel">
        <div className="login-hero-bg-grid"></div>
        <div className="login-hero-glow login-hero-glow-1"></div>
        <div className="login-hero-glow login-hero-glow-2"></div>

        <div className="login-hero-content">
          {/* Top Brand Header */}
          <div className="login-hero-brand">
            <div className="login-hero-logo">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="login-hero-brand-name">CampusOS</span>
              <span className="login-hero-version">Enterprise v2.4</span>
            </div>
          </div>

          {/* Headline & Description */}
          <div className="login-hero-body">
            <h1 className="login-hero-title">
              Unified School Management & Academic Operations
            </h1>
            <p className="login-hero-subtitle">
              Engineered for continuous offline resilience, real-time sync, automated attendance, dynamic analytics, and transparent student ledgers.
            </p>

            {/* Feature Highlights Grid */}
            <div className="login-hero-features">
              <div className="login-feature-card">
                <div className="login-feature-icon-box">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="login-feature-title">Offline-First Engine</h4>
                  <p className="login-feature-desc">Work seamlessly offline with automatic cloud synchronization.</p>
                </div>
              </div>

              <div className="login-feature-card">
                <div className="login-feature-icon-box">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h4 className="login-feature-title">Dynamic Analytics</h4>
                  <p className="login-feature-desc">Interactive SVG charts for student distribution & fee recovery.</p>
                </div>
              </div>

              <div className="login-feature-card">
                <div className="login-feature-icon-box">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="login-feature-title">Role Governance</h4>
                  <p className="login-feature-desc">Strict access scopes for Administrators, Teachers, and Staff.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Status Pill */}
          <div className="login-hero-footer">
            <div className={`login-status-pill ${isOnline ? 'online' : 'offline'}`}>
              <span className={`login-status-dot ${isOnline ? 'online' : 'offline'}`}></span>
              <span>{isOnline ? 'Cloud Sync Online' : 'Offline Authentication Mode'}</span>
            </div>
            <span className="login-hero-copy">© 2026 CampusOS. All rights reserved.</span>
          </div>
        </div>
      </div>

      {/* ── Right Authentication Panel ── */}
      <div className="login-form-panel">
        <div className="login-form-card">
          <div className="login-form-header">
            <div className="login-mobile-brand">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <span>CampusOS</span>
            </div>
            <h2 className="login-form-title">Sign in to your account</h2>
            <p className="login-form-subtitle">Enter your institutional credentials to access your dashboard.</p>
          </div>

          {error && (
            <div className="login-alert">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form-body">
            <div className="login-field-group">
              <label className="login-field-label">Username or Email</label>
              <div className="login-input-container">
                <UserIcon className="login-field-icon" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="login-field-input"
                  placeholder="e.g. admin or teacher_jane"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="login-field-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="login-field-label">Password</label>
              </div>
              <div className="login-input-container">
                <Lock className="login-field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-field-input"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-password-toggle"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-submit-btn"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to CampusOS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="login-form-footer">
            <div className="login-security-notice">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Protected by 256-bit local encryption & outbox database sync.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
