import React, { useState, useEffect } from 'react';
import {
  BookOpen, Users, Award, CreditCard, Package, LogOut, Menu, X,
  Wifi, WifiOff, RefreshCw, Layers, Bell, Search, Settings
} from 'lucide-react';
import { syncService } from '../services/syncService';

export default function AppLayout({ children, activeTab, setActiveTab, user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [online, setOnline] = useState(syncService.isOnline());
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // 1. Update online state
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. Listen to custom sync status events
    const handleSyncStatus = (e) => setSyncing(e.detail.syncing);
    window.addEventListener('sync-status-changed', handleSyncStatus);

    // 3. Keep track of pending local changes in IndexedDB outbox
    const updatePendingCount = async () => {
      const count = await syncService.getPendingCount();
      setPendingCount(count);
    };
    updatePendingCount();

    // Re-check count on database writes
    window.addEventListener('local-db-changed', updatePendingCount);

    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync-status-changed', handleSyncStatus);
      window.removeEventListener('local-db-changed', updatePendingCount);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = () => {
    if (online) {
      syncService.syncAll();
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers, roles: ['ADMIN', 'TEACHER', 'INVENTORY'] },
    { id: 'students', label: 'Students', icon: Users, roles: ['ADMIN', 'TEACHER'] },
    { id: 'teachers', label: 'Teachers', icon: Users, roles: ['ADMIN', 'TEACHER'] },
    { id: 'attendance', label: 'Attendance', icon: BookOpen, roles: ['ADMIN', 'TEACHER'] },
    { id: 'courses', label: 'Courses', icon: BookOpen, roles: ['ADMIN', 'TEACHER'] },
    { id: 'grades', label: 'Exam', icon: Award, roles: ['ADMIN', 'TEACHER'] },
    { id: 'finance', label: 'Payment', icon: CreditCard, roles: ['ADMIN'] },
    { id: 'assets', label: 'Assets Log', icon: Package, roles: ['ADMIN', 'INVENTORY'] }
  ];

  // Filter items by user role
  const visibleMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  // Dynamic user initials
  const initials = user.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user.username ? user.username.slice(0, 2).toUpperCase() : 'US';

  return (
    <div className="app-container">
      {/* Sidebar - Desktop */}
      <aside className="app-sidebar hidden-mobile">
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Logo Style */}
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <BookOpen />
            </div>
            <h1 className="sidebar-logo-text">CampusOS</h1>
          </div>

          {/* Nav Items */}
          <nav className="sidebar-nav">
            {visibleMenuItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`sidebar-item ${active ? 'active' : ''}`}
                >
                  <Icon className="sidebar-item-icon" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {/* Settings option - only for admins */}
          {user.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
              style={{ padding: '10px 16px' }}
            >
              <Settings className="sidebar-item-icon" />
              Settings
            </button>
          )}

          {/* User profile details info */}
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {initials}
              <span className={`sidebar-user-avatar-status ${online ? 'online' : 'offline'}`}></span>
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{user.full_name}</p>
              <p className="sidebar-user-role">{user.role}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="sidebar-item"
            style={{ color: '#f87171', padding: '10px 16px' }}
          >
            <LogOut className="sidebar-item-icon" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="content-wrapper">
        {/* Top Navbar */}
        <header className="app-header">
          <div className="header-left">
            <button
              onClick={() => setSidebarOpen(true)}
              className="header-btn lg-hidden"
              style={{ display: window.innerWidth <= 1024 ? 'flex' : 'none' }}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="header-title">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>

            {/* Header Search input */}
            <div className="header-search hidden-mobile">
              <Search className="header-search-icon" />
              <input
                type="text"
                placeholder="Search for students/teachers/documents..."
                className="header-search-input"
              />
            </div>
          </div>

          {/* Right Header Options */}
          <div className="header-right">
            {/* Sync Status Info */}
            {pendingCount > 0 && (
              <span className="header-badge badge-warning badge-pulse">
                {pendingCount} offline update{pendingCount > 1 ? 's' : ''}
              </span>
            )}

            <button
              onClick={handleManualSync}
              disabled={!online || syncing}
              className="header-btn header-btn-labeled"
              style={{ opacity: !online || syncing ? 0.6 : 1 }}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'spin-sync' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync'}</span>
            </button>

            {/* Notification Bell Badge */}
            <div className="header-notification-wrapper hidden-mobile">
              <button className="header-btn">
                <Bell className="w-4 h-4" />
              </button>
              <span className="notification-badge">4</span>
            </div>

            {/* Connection Status Badge */}
            {online ? (
              <span className="header-badge badge-success">
                <Wifi className="w-4 h-4" />
                Online
              </span>
            ) : (
              <span className="header-badge badge-warning">
                <WifiOff className="w-4 h-4" />
                Offline
              </span>
            )}

            {/* Profile Avatar Initials on Right Header for mobile header */}
            <div className="sidebar-user-avatar lg-hidden" style={{ display: window.innerWidth <= 1024 ? 'flex' : 'none', width: '32px', height: '32px', fontSize: '11px' }}>
              {initials}
            </div>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="main-content">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Navigation */}
      {sidebarOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <aside
            className="app-sidebar"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '260px', height: '100%' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="sidebar-logo" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="sidebar-logo-icon">
                    <BookOpen />
                  </div>
                  <h1 className="sidebar-logo-text">CampusOS</h1>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#a0aec0', cursor: 'pointer' }}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="sidebar-nav">
                {visibleMenuItems.map(item => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`sidebar-item ${active ? 'active' : ''}`}
                    >
                      <Icon className="sidebar-item-icon" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="sidebar-footer">
              {user.role === 'ADMIN' && (
                <button
                  onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
                  className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
                  style={{ padding: '10px 16px' }}
                >
                  <Settings className="sidebar-item-icon" />
                  Settings
                </button>
              )}
              <div className="sidebar-user">
                <div className="sidebar-user-avatar">
                  {initials}
                </div>
                <div className="sidebar-user-info">
                  <p className="sidebar-user-name">{user.full_name}</p>
                  <p className="sidebar-user-role">{user.role}</p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="sidebar-item"
                style={{ color: '#f87171' }}
              >
                <LogOut className="sidebar-item-icon" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
