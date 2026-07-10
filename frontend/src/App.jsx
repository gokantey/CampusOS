import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Login from './pages/Login';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import GradesEntry from './pages/GradesEntry';
import Finance from './pages/Finance';
import Assets from './pages/Assets';
import { syncService } from './services/syncService';
import { db } from './db/db';
import { saveLocal, deleteLocal } from './db/dbHelpers';
import { Plus, BookOpen, X } from 'lucide-react';

// ─── Teachers Panel ────────────────────────────────────────────────
function TeachersPanel({ user }) {
  const teachers = useLiveQuery(() => db.users.where('role').equals('TEACHER').toArray()) || [];
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dept, setDept] = useState('');
  const [loading, setLoading] = useState(false);

  async function hashPassword(pw) {
    const buf = new TextEncoder().encode(pw);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!fullName || !username || !password) return;
    setLoading(true);
    try {
      const pwHash = await hashPassword(password);
      await saveLocal('users', {
        full_name: fullName,
        username,
        email,
        department: dept,
        role: 'TEACHER',
        password_hash: pwHash,
        password: password,
      });
      setFullName(''); setUsername(''); setEmail(''); setPassword(''); setDept('');
      setShowForm(false);
    } catch (err) {
      alert('Error creating teacher. Username must be unique.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)' }}>School Teachers</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{teachers.length} registered staff</p>
          </div>
          {user.role === 'ADMIN' && (
            <button onClick={() => setShowForm(s => !s)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              <Plus style={{ width: '16px', height: '16px' }} />
              Add Teacher
            </button>
          )}
        </div>

        {showForm && user.role === 'ADMIN' && (
          <form onSubmit={handleAdd} style={{ padding: '20px', backgroundColor: 'var(--primary-glow)', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid rgba(79,70,229,0.15)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)' }}>New Teacher Account</h4>
            <div className="form-grid-2">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} className="input-field" placeholder="e.g. Dr. Jane Smith" required />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)} className="input-field" placeholder="e.g. jsmith" required />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="teacher@school.com" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Department</label>
                <input value={dept} onChange={e => setDept(e.target.value)} className="input-field" placeholder="e.g. Science & Maths" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Temporary password" required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
                {loading ? 'Saving...' : 'Create Account'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>Cancel</button>
            </div>
          </form>
        )}

        <div className="premium-table-wrapper">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Full Name</th>
                <th>Department</th>
                <th>Username</th>
                <th>Email</th>
                {user.role === 'ADMIN' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => {
                const initials = t.full_name
                  ? t.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : 'TC';
                return (
                  <tr key={t.id}>
                    <td>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '11px' }}>
                        {initials}
                      </div>
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{t.full_name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{t.department || '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{t.username}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.email || '—'}</td>
                    {user.role === 'ADMIN' && (
                      <td>
                        <button
                          onClick={() => { if (window.confirm(`Delete teacher ${t.full_name}?`)) deleteLocal('users', t.id); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px', borderRadius: '6px' }}
                        >
                          <X style={{ width: '14px', height: '14px' }} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {teachers.length === 0 && (
                <tr>
                  <td colSpan={user.role === 'ADMIN' ? '6' : '5'} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No teachers registered yet. {user.role === 'ADMIN' && 'Add one above.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Attendance Panel ──────────────────────────────────────────────
function AttendancePanel({ user }) {
  const classes = useLiveQuery(() => db.class_levels.where('is_deleted').equals(0).toArray()) || [];
  const students = useLiveQuery(() => db.students.where('is_deleted').equals(0).toArray()) || [];
  const enrollments = useLiveQuery(() => db.enrollments.where('is_deleted').equals(0).toArray()) || [];
  const attendance = useLiveQuery(() => db.attendance.where('is_deleted').equals(0).toArray()) || [];

  const [selectedClass, setSelectedClass] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [statusMap, setStatusMap] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const classStudents = selectedClass
    ? students.filter(s => enrollments.some(e => String(e.student_id) === String(s.id) && String(e.class_level_id) === String(selectedClass)))
    : [];

  const handleStatusChange = (studentId, status) => {
    setStatusMap(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!selectedClass || !attendanceDate || classStudents.length === 0) return;
    setSubmitting(true);
    try {
      for (const student of classStudents) {
        const status = statusMap[student.id] || 'PRESENT';
        const existing = attendance.find(a =>
          String(a.student_id) === String(student.id) && a.date === attendanceDate
        );
        await saveLocal('attendance', {
          ...(existing || {}),
          student_id: student.id,
          date: attendanceDate,
          class_level_id: selectedClass,
          status,
        });
      }
      alert('Attendance submitted successfully!');
      setStatusMap({});
    } catch (err) {
      alert('Error submitting attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  const history = [...new Map(
    attendance.map(a => [`${a.date}-${a.class_level_id}`, a])
  ).values()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-card">
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '4px' }}>Mark Attendance</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Select a class and date, then mark each student.</p>

        <div className="form-grid-2" style={{ marginBottom: '20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Class Level</label>
            <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setStatusMap({}); }} className="input-field select-field">
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Attendance Date</label>
            <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="input-field" />
          </div>
        </div>

        {selectedClass && classStudents.length > 0 ? (
          <>
            <div className="premium-table-wrapper">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Admission ID</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map(s => {
                    const status = statusMap[s.id] || 'PRESENT';
                    return (
                      <tr key={s.id}>
                        <td style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{s.first_name} {s.last_name}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{s.admission_number}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {['PRESENT', 'ABSENT', 'LATE'].map(opt => (
                              <button
                                key={opt}
                                onClick={() => handleStatusChange(s.id, opt)}
                                style={{
                                  padding: '4px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                                  fontSize: '11px', fontWeight: '700',
                                  backgroundColor: status === opt
                                    ? opt === 'PRESENT' ? 'rgba(16,185,129,0.12)' : opt === 'ABSENT' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)'
                                    : '#f1f5f9',
                                  color: status === opt
                                    ? opt === 'PRESENT' ? 'var(--success)' : opt === 'ABSENT' ? 'var(--danger)' : 'var(--warning)'
                                    : 'var(--text-muted)',
                                  border: status === opt
                                    ? opt === 'PRESENT' ? '1px solid rgba(16,185,129,0.25)' : opt === 'ABSENT' ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(245,158,11,0.25)'
                                    : '1px solid transparent'
                                }}
                              >{opt[0] + opt.slice(1).toLowerCase()}</button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary" style={{ padding: '10px 28px' }}>
                {submitting ? 'Submitting...' : 'Submit Attendance'}
              </button>
            </div>
          </>
        ) : selectedClass ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center' }}>No students enrolled in this class yet.</p>
        ) : null}
      </div>

      <div className="glass-card">
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '16px' }}>Recent Attendance Records</h3>
        <div className="premium-table-wrapper">
          <table className="premium-table">
            <thead>
              <tr><th>Date</th><th>Class</th><th>Present</th><th>Absent</th><th>Late</th></tr>
            </thead>
            <tbody>
              {history.map((entry, idx) => {
                const cls = classes.find(c => String(c.id) === String(entry.class_level_id))?.name || 'Unknown';
                const dayRecords = attendance.filter(a => a.date === entry.date && String(a.class_level_id) === String(entry.class_level_id));
                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{entry.date}</td>
                    <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{cls}</td>
                    <td style={{ color: 'var(--success)', fontWeight: '700' }}>{dayRecords.filter(a => a.status === 'PRESENT').length}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: '700' }}>{dayRecords.filter(a => a.status === 'ABSENT').length}</td>
                    <td style={{ color: 'var(--warning)', fontWeight: '700' }}>{dayRecords.filter(a => a.status === 'LATE').length}</td>
                  </tr>
                );
              })}
              {history.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>No attendance records yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Courses Panel ─────────────────────────────────────────────────
function CoursesPanel({ user }) {
  const subjects = useLiveQuery(() => db.subjects.where('is_deleted').equals(0).toArray()) || [];
  const topics = useLiveQuery(() => db.syllabus_topics.where('is_deleted').equals(0).toArray()) || [];
  const [activeSubject, setActiveSubject] = useState(null);
  const [newSubject, setNewSubject] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [showSubjectForm, setShowSubjectForm] = useState(false);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject) return;
    const saved = await saveLocal('subjects', { name: newSubject, code: newSubjectCode });
    setNewSubject(''); setNewSubjectCode('');
    setShowSubjectForm(false);
    setActiveSubject(saved.id);
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopic || !activeSubject) return;
    await saveLocal('syllabus_topics', {
      subject_id: activeSubject,
      title: newTopic,
      order_index: topics.filter(t => String(t.subject_id) === String(activeSubject)).length + 1
    });
    setNewTopic('');
  };

  const subjectTopics = activeSubject ? topics.filter(t => String(t.subject_id) === String(activeSubject)) : [];
  const activeSubjectObj = subjects.find(s => String(s.id) === String(activeSubject));

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
      <div className="glass-card" style={{ width: '280px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)' }}>Subjects</h3>
          {(user.role === 'ADMIN' || user.role === 'TEACHER') && (
            <button onClick={() => setShowSubjectForm(s => !s)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              <Plus style={{ width: '14px', height: '14px' }} />
            </button>
          )}
        </div>

        {showSubjectForm && (
          <form onSubmit={handleAddSubject} style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input value={newSubject} onChange={e => setNewSubject(e.target.value)} className="input-field" placeholder="Subject name" required style={{ padding: '8px 12px', fontSize: '13px' }} />
            <input value={newSubjectCode} onChange={e => setNewSubjectCode(e.target.value)} className="input-field" placeholder="Code (e.g. MATH-JHS)" style={{ padding: '8px 12px', fontSize: '13px' }} />
            <button type="submit" className="btn btn-primary" style={{ padding: '8px', fontSize: '13px' }}>Add Subject</button>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {subjects.map(s => (
            <div
              key={s.id}
              onClick={() => setActiveSubject(s.id)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                backgroundColor: String(s.id) === String(activeSubject) ? 'var(--primary-glow)' : 'transparent',
                border: String(s.id) === String(activeSubject) ? '1px solid rgba(79,70,229,0.2)' : '1px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>{s.name}</p>
                {s.code && <p style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{s.code}</p>}
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '20px' }}>
                {topics.filter(t => String(t.subject_id) === String(s.id)).length}
              </span>
            </div>
          ))}
          {subjects.length === 0 && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No subjects yet. Add one above.</p>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ flex: 1 }}>
        {activeSubjectObj ? (
          <>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-dark)' }}>{activeSubjectObj.name}</h3>
              {activeSubjectObj.code && <p style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: '2px' }}>{activeSubjectObj.code}</p>}
            </div>
            <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '12px' }}>Syllabus Topics</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {subjectTopics.map((t, idx) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', flexShrink: 0 }}>{idx + 1}</span>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)' }}>{t.title}</p>
                  </div>
                  {(user.role === 'ADMIN' || user.role === 'TEACHER') && (
                    <button onClick={() => deleteLocal('syllabus_topics', t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}>
                      <X style={{ width: '14px', height: '14px' }} />
                    </button>
                  )}
                </div>
              ))}
              {subjectTopics.length === 0 && (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '16px 0', textAlign: 'center' }}>No topics added yet.</p>
              )}
            </div>
            {(user.role === 'ADMIN' || user.role === 'TEACHER') && (
              <form onSubmit={handleAddTopic} style={{ display: 'flex', gap: '8px' }}>
                <input value={newTopic} onChange={e => setNewTopic(e.target.value)} className="input-field" placeholder="New syllabus topic..." required style={{ flex: 1, padding: '10px 14px', fontSize: '13px' }} />
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px', flexShrink: 0 }}>Add Topic</button>
              </form>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
            <BookOpen style={{ width: '48px', height: '48px', color: 'var(--primary)', opacity: 0.2, marginBottom: '16px' }} />
            <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '4px' }}>Select a Subject</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Click a subject from the list to view and manage its syllabus topics.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Settings Panel ────────────────────────────────────────────────
function SettingsPanel({ user, onLogout }) {
  return (
    <div className="glass-card" style={{ maxWidth: '640px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '8px' }}>System Settings</h2>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '28px' }}>Manage school configuration and administrative options.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '8px' }}>Logged in as</p>
          <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)' }}>{user.full_name || user.username}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.role}{user.email ? ' · ' + user.email : ''}</p>
        </div>
        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '4px' }}>Danger Zone</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Actions below are irreversible. Proceed with caution.</p>
          <button onClick={onLogout} style={{ padding: '8px 20px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.06)', color: '#ef4444', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Log Out of System
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Root App ──────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    syncService.initialize();

    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      const parsedUser = JSON.parse(cachedUser);
      setUser(parsedUser);

      if (navigator.onLine) {
        import('./services/api').then(({ apiRequest }) => {
          apiRequest('/api/auth/me/')
            .then(userData => {
              if (userData && userData.role) {
                const updatedUser = {
                  id: userData.user_id,
                  email: userData.email,
                  full_name: userData.full_name,
                  role: userData.role
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
              }
            })
            .catch(err => console.error('Could not sync user profile', err));
        });
      }
    }

    const handleAuthChange = () => {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    };
    window.addEventListener('auth-changed', handleAuthChange);
    setInitialized(true);

    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  if (!initialized) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0f19' }}>
        <div style={{ width: '32px', height: '32px', border: '4px solid #4f46e5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <AppLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      user={user}
      onLogout={handleLogout}
    >
      {activeTab === 'dashboard' && <Dashboard user={user} setActiveTab={setActiveTab} />}
      {activeTab === 'students' && <Students />}
      {activeTab === 'teachers' && <TeachersPanel user={user} />}
      {activeTab === 'attendance' && <AttendancePanel user={user} />}
      {activeTab === 'courses' && <CoursesPanel user={user} />}
      {activeTab === 'grades' && <GradesEntry user={user} />}
      {activeTab === 'finance' && <Finance user={user} />}
      {activeTab === 'assets' && <Assets />}
      {activeTab === 'settings' && user.role === 'ADMIN' && <SettingsPanel user={user} onLogout={handleLogout} />}
    </AppLayout>
  );
}
