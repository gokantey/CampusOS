import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BookOpen, Users, Award, CreditCard, Package, LogOut, Menu, X,
  Wifi, WifiOff, RefreshCw, Layers, Bell, Search, Settings, ChevronRight
} from 'lucide-react';
import { syncService } from '../services/syncService';
import { db } from '../db/db';

export default function AppLayout({ children, activeTab, setActiveTab, user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [online, setOnline] = useState(syncService.isOnline());
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Global Header Search State
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // Query database for global search matches
  const allStudents = useLiveQuery(() => db.students.where('is_deleted').equals(0).toArray()) || [];
  const allStaff = useLiveQuery(() => db.users.where('is_deleted').equals(0).toArray()) || [];
  const allSubjects = useLiveQuery(() => db.subjects.where('is_deleted').equals(0).toArray()) || [];

  const term = headerSearchQuery.trim().toLowerCase();
  const matchedStudents = term ? allStudents.filter(s => 
    `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase().includes(term) ||
    (s.admission_number || '').toLowerCase().includes(term)
  ).slice(0, 4) : [];

  const matchedStaff = (term && user.role === 'ADMIN') ? allStaff.filter(u => 
    (u.full_name || '').toLowerCase().includes(term) ||
    (u.username || '').toLowerCase().includes(term) ||
    (u.department || '').toLowerCase().includes(term)
  ).slice(0, 4) : [];

  const matchedSubjects = term ? allSubjects.filter(sub => 
    (sub.name || '').toLowerCase().includes(term) ||
    (sub.code || '').toLowerCase().includes(term)
  ).slice(0, 4) : [];

  const hasSearchResults = matchedStudents.length > 0 || matchedStaff.length > 0 || matchedSubjects.length > 0;

  // Live User Activity Notifications from real database actions
  const recentStudents = useLiveQuery(() => db.students.where('is_deleted').equals(0).reverse().limit(3).toArray()) || [];
  const recentReceipts = useLiveQuery(() => db.payment_receipts.where('is_deleted').equals(0).reverse().limit(3).toArray()) || [];
  const recentAttendance = useLiveQuery(() => db.attendance.where('is_deleted').equals(0).reverse().limit(3).toArray()) || [];
  const recentAssets = useLiveQuery(() => db.assets.where('is_deleted').equals(0).reverse().limit(3).toArray()) || [];

  const [readIds, setReadIds] = useState(new Set());
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Combine real user actions into readable activity notifications
  const userNotifications = [];

  recentStudents.forEach(s => {
    userNotifications.push({
      id: `student-${s.id}`,
      text: `New student enrolled: ${s.first_name} ${s.last_name} (${s.admission_number || 'ID Pending'})`,
      time: 'Recent Action'
    });
  });

  recentReceipts.forEach(r => {
    userNotifications.push({
      id: `receipt-${r.id}`,
      text: `Fee payment received: GH¢ ${parseFloat(r.amount_paid || 0).toFixed(2)} (Receipt #${r.receipt_number || r.id})`,
      time: r.payment_date || 'Recent Action'
    });
  });

  recentAttendance.forEach(a => {
    userNotifications.push({
      id: `attendance-${a.id}`,
      text: `Attendance recorded for ${a.date} (${a.status})`,
      time: a.date || 'Recent Action'
    });
  });

  recentAssets.forEach(ast => {
    userNotifications.push({
      id: `asset-${ast.id}`,
      text: `Asset logged: ${ast.name} (${ast.condition})`,
      time: 'Recent Action'
    });
  });

  const notifications = userNotifications.map(n => ({
    ...n,
    read: readIds.has(n.id)
  }));

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)));
  };

  const toggleRead = (id) => {
    setReadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Close notifications and search dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notificationsOpen && !e.target.closest('.header-notification-wrapper')) {
        setNotificationsOpen(false);
      }
      if (searchOpen && !e.target.closest('.header-search-wrapper')) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [notificationsOpen, searchOpen]);

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
    { id: 'dashboard', label: 'Dashboard', icon: Layers, roles: ['ADMIN', 'TEACHER', 'INVENTORY', 'STAFF'] },
    { id: 'students', label: 'Students', icon: Users, roles: ['ADMIN', 'TEACHER'] },
    { id: 'teachers', label: 'Staff', icon: Users, roles: ['ADMIN'] }, // Restrict Staff to ADMIN only
    { id: 'attendance', label: 'Attendance', icon: BookOpen, roles: ['ADMIN', 'TEACHER'] },
    { id: 'courses', label: 'Courses', icon: BookOpen, roles: ['ADMIN'] },
    { id: 'grades', label: 'Academics', icon: Award, roles: ['ADMIN', 'TEACHER'] },
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
              {menuItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h2>

            {/* Functional Header Global Search input & Dropdown */}
            <div className="header-search-wrapper hidden-mobile" style={{ position: 'relative' }}>
              <div className="header-search">
                <Search className="header-search-icon" />
                <input
                  type="text"
                  value={headerSearchQuery}
                  onChange={(e) => {
                    setHeaderSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search students, staff, courses..."
                  className="header-search-input"
                />
                {headerSearchQuery && (
                  <button onClick={() => setHeaderSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}>
                    <X style={{ width: '14px', height: '14px' }} />
                  </button>
                )}
              </div>

              {/* Live Search Results Dropdown */}
              {searchOpen && term && (
                <div className="global-search-dropdown" style={{
                  position: 'absolute', top: '44px', left: 0, width: '340px',
                  backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '12px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.12)', zIndex: 120, padding: '12px'
                }}>
                  {hasSearchResults ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '320px', overflowY: 'auto' }}>
                      {/* Students Group */}
                      {matchedStudents.length > 0 && (
                        <div>
                          <p style={{ fontSize: '10px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Students</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {matchedStudents.map(s => (
                              <div
                                key={s.id}
                                onClick={() => {
                                  setActiveTab('students');
                                  setHeaderSearchQuery('');
                                  setSearchOpen(false);
                                }}
                                style={{
                                  padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#f8fafc',
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                              >
                                <div>
                                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>{s.first_name} {s.last_name}</p>
                                  <p style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-muted)', margin: 0 }}>ID: {s.admission_number}</p>
                                </div>
                                <ChevronRight style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Staff Group */}
                      {matchedStaff.length > 0 && (
                        <div>
                          <p style={{ fontSize: '10px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Staff</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {matchedStaff.map(st => (
                              <div
                                key={st.id}
                                onClick={() => {
                                  setActiveTab('teachers');
                                  setHeaderSearchQuery('');
                                  setSearchOpen(false);
                                }}
                                style={{
                                  padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#f8fafc',
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                              >
                                <div>
                                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>{st.full_name}</p>
                                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>{st.staff_category || st.role}</p>
                                </div>
                                <ChevronRight style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Subjects Group */}
                      {matchedSubjects.length > 0 && (
                        <div>
                          <p style={{ fontSize: '10px', fontWeight: '800', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Courses / Subjects</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {matchedSubjects.map(sub => (
                              <div
                                key={sub.id}
                                onClick={() => {
                                  setActiveTab(user.role === 'ADMIN' ? 'courses' : 'grades');
                                  setHeaderSearchQuery('');
                                  setSearchOpen(false);
                                }}
                                style={{
                                  padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#f8fafc',
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                              >
                                <div>
                                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>{sub.name}</p>
                                  {sub.code && <p style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-muted)', margin: 0 }}>{sub.code}</p>}
                                </div>
                                <ChevronRight style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', padding: '16px 0', margin: 0 }}>No matching results found.</p>
                  )}
                </div>
              )}
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
            <div className="header-notification-wrapper hidden-mobile" style={{ position: 'relative' }}>
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="header-btn"
                style={{ position: 'relative' }}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="notifications-dropdown" style={{
                  position: 'absolute',
                  right: 0,
                  top: '42px',
                  width: '320px',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                  zIndex: 100,
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-dark)' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
                    {notifications.map(n => (
                      <div key={n.id} onClick={() => toggleRead(n.id)} style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        backgroundColor: n.read ? 'transparent' : 'rgba(79, 70, 229, 0.04)',
                        cursor: 'pointer',
                        border: '1px solid transparent',
                        transition: 'all 0.2s',
                        fontSize: '12px'
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.15)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px' }}>
                          <p style={{ color: n.read ? 'var(--text-muted)' : 'var(--text-dark)', fontWeight: n.read ? '500' : '600', margin: 0, lineHeight: '1.4', textAlign: 'left' }}>
                            {n.text}
                          </p>
                          {!n.read && <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--primary)', borderRadius: '50%', flexShrink: 0, marginTop: '5px' }}></span>}
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px', textAlign: 'left' }}>{n.time}</span>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', padding: '16px 0', margin: 0 }}>No notifications</p>
                    )}
                  </div>
                </div>
              )}
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
