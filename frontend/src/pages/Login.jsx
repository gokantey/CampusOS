import React, { useState } from 'react';
import { BookOpen, Lock, User as UserIcon, AlertCircle, Wifi, WifiOff } from 'lucide-react';
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
            // Set dummy offline token
            localStorage.setItem('token', 'offline-token-session');
            onLoginSuccess(userData);
          } else {
            setError('Invalid credentials.');
          }
        } else {
          setError('No offline user profile found. Please login online first to sync your profile.');
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
    <div className="login-container">
      {/* Background Decorative Blobs */}
      <div className="login-bg-blob login-bg-blob-1"></div>
      <div className="login-bg-blob login-bg-blob-2"></div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-box">
            <BookOpen className="login-logo-icon" />
          </div>
          <h2 className="login-title">Welcome to CampusOS</h2>
          <p className="login-subtitle">School Management System Login</p>
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {isOnline ? (
              <span className="login-status-badge online">
                <span className="login-badge-dot online"></span>
                Online Sync Enabled
              </span>
            ) : (
              <span className="login-status-badge offline">
                <span className="login-badge-dot offline"></span>
                Offline Authentication Mode
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="login-alert">
            <AlertCircle className="login-alert-icon" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="login-form-group" style={{ margin: 0 }}>
            <label className="login-label">Username / Email</label>
            <div className="login-input-wrapper">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
                placeholder="Enter username"
                required
              />
              <UserIcon className="login-input-icon" />
            </div>
          </div>

          <div className="login-form-group" style={{ margin: 0 }}>
            <label className="login-label">Password</label>
            <div className="login-input-wrapper">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                placeholder="Enter password"
                required
              />
              <Lock className="login-input-icon" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-btn"
            style={{ marginTop: '8px' }}
          >
            {loading ? 'Authenticating...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
