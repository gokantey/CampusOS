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
import { Plus, BookOpen, X, ShieldAlert } from 'lucide-react';

// ─── Staff Panel ─────────────────────────────────────────────────────
const STAFF_CATEGORIES = ['Teacher', 'Caterer', 'Laborer', 'Administrator', 'Security', 'Cleaner', 'Driver'];
const CATEGORY_COLORS = {
  Teacher: { bg: 'rgba(79,70,229,0.08)', color: 'var(--primary)', border: 'rgba(79,70,229,0.2)' },
  Caterer: { bg: 'rgba(245,158,11,0.08)', color: 'var(--warning)', border: 'rgba(245,158,11,0.2)' },
  Laborer: { bg: 'rgba(16,185,129,0.08)', color: 'var(--success)', border: 'rgba(16,185,129,0.2)' },
  Administrator: { bg: 'rgba(99,102,241,0.08)', color: '#6366f1', border: 'rgba(99,102,241,0.2)' },
  Security: { bg: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: 'rgba(239,68,68,0.2)' },
  Cleaner: { bg: 'rgba(20,184,166,0.08)', color: '#14b8a6', border: 'rgba(20,184,166,0.2)' },
  Driver: { bg: 'rgba(168,85,247,0.08)', color: '#a855f7', border: 'rgba(168,85,247,0.2)' },
};

function StaffPanel({ user }) {
  const allStaff = useLiveQuery(() => db.users.filter(u => u.role === 'TEACHER' || u.staff_category).toArray()) || [];
  const classLevels = useLiveQuery(() => db.class_levels.where('is_deleted').equals(0).toArray()) || [];
  const subjects = useLiveQuery(() => db.subjects.where('is_deleted').equals(0).toArray()) || [];
  
  const [showForm, setShowForm] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dept, setDept] = useState('');
  const [staffCategory, setStaffCategory] = useState('Teacher');
  const [assignedClassId, setAssignedClassId] = useState('');
  const [assignedSubjectIds, setAssignedSubjectIds] = useState([]);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [loading, setLoading] = useState(false);

  async function hashPassword(pw) {
    const buf = new TextEncoder().encode(pw);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const handleEditClick = (staffMember) => {
    setEditingStaffId(staffMember.id);
    setFullName(staffMember.full_name || '');
    setUsername(staffMember.username || '');
    setEmail(staffMember.email || '');
    setPassword(''); // leave blank if unchanged
    setDept(staffMember.department || '');
    setStaffCategory(staffMember.staff_category || (staffMember.role === 'TEACHER' ? 'Teacher' : 'Staff'));
    setAssignedClassId(staffMember.assigned_class_id || '');
    setAssignedSubjectIds(staffMember.assigned_subject_ids || []);
    setShowForm(true);
  };

  const handleToggleSubject = (subId) => {
    setAssignedSubjectIds(prev =>
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
  };

  const resetForm = () => {
    setEditingStaffId(null);
    setFullName(''); setUsername(''); setEmail(''); setPassword(''); setDept('');
    setStaffCategory('Teacher'); setAssignedClassId(''); setAssignedSubjectIds([]);
    setShowForm(false);
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    if (!fullName || !username) return;
    if (!editingStaffId && !password) {
      alert('Please provide a initial password.');
      return;
    }
    setLoading(true);
    try {
      const existing = editingStaffId ? allStaff.find(s => String(s.id) === String(editingStaffId)) : null;
      let pwHash = existing ? existing.password_hash : '';
      let plainPw = existing ? existing.password : '';
      if (password) {
        pwHash = await hashPassword(password);
        plainPw = password;
      }

      await saveLocal('users', {
        ...(existing || {}),
        full_name: fullName,
        username,
        email,
        department: dept,
        role: staffCategory === 'Teacher' ? 'TEACHER' : 'STAFF',
        staff_category: staffCategory,
        assigned_class_id: staffCategory === 'Teacher' ? assignedClassId : null,
        assigned_subject_ids: staffCategory === 'Teacher' ? assignedSubjectIds : [],
        password_hash: pwHash,
        password: plainPw,
      });

      resetForm();
    } catch (err) {
      alert('Error saving staff account. Username must be unique.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = filterCategory === 'ALL' ? allStaff : allStaff.filter(s => (s.staff_category || 'Teacher') === filterCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)' }}>Staff Management</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{allStaff.length} staff members registered</p>
          </div>
          {user.role === 'ADMIN' && (
            <button onClick={() => { if (showForm) { resetForm(); } else { setShowForm(true); } }} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus style={{ width: '16px', height: '16px' }} /> {showForm ? 'Close Form' : 'Add Staff'}
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {['ALL', ...STAFF_CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setFilterCategory(cat)} style={{
              padding: '5px 12px', borderRadius: '20px', border: '1px solid', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
              backgroundColor: filterCategory === cat ? 'var(--primary)' : 'transparent',
              color: filterCategory === cat ? '#fff' : 'var(--text-muted)',
              borderColor: filterCategory === cat ? 'var(--primary)' : 'var(--border-color)',
              transition: 'all 0.2s',
            }}>{cat === 'ALL' ? 'All Staff' : cat === 'Security' ? 'Security' : cat + 's'}</button>
          ))}
        </div>

        {showForm && user.role === 'ADMIN' && (
          <form onSubmit={handleAddOrUpdate} style={{ padding: '20px', backgroundColor: 'var(--primary-glow)', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid rgba(79,70,229,0.15)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)' }}>{editingStaffId ? 'Edit Staff & Class Reassignment' : 'New Staff Member'}</h4>
            <div className="form-grid-2">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} className="input-field" placeholder="e.g. Abena Asante" required />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Staff Category</label>
                <select value={staffCategory} onChange={e => setStaffCategory(e.target.value)} className="input-field select-field">
                  {STAFF_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)} className="input-field" placeholder="e.g. aasante" required />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="staff@school.com" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Department / Section</label>
                <input value={dept} onChange={e => setDept(e.target.value)} className="input-field" placeholder="e.g. Kitchen, Science Dept" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Password {editingStaffId ? '(Leave blank to keep current)' : ''}</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder={editingStaffId ? '••••••••' : 'Temporary password'} required={!editingStaffId} />
              </div>
            </div>

            {/* Teacher Specific Class and Courses Assignment */}
            {staffCategory === 'Teacher' && (
              <div style={{ padding: '14px', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h5 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Teacher Class & Courses Allocation</h5>
                <div className="form-grid-2" style={{ marginBottom: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Assigned Class Level</label>
                    <select value={assignedClassId} onChange={e => setAssignedClassId(e.target.value)} className="input-field select-field">
                      <option value="">Select Assigned Class</option>
                      {classLevels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>Assigned Courses / Subjects</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {subjects.map(sub => {
                      const selected = assignedSubjectIds.includes(sub.id);
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleToggleSubject(sub.id)}
                          style={{
                            padding: '4px 10px', borderRadius: '16px', border: '1px solid', cursor: 'pointer', fontSize: '11px', fontWeight: '600',
                            backgroundColor: selected ? 'var(--primary)' : '#f1f5f9',
                            color: selected ? '#fff' : 'var(--text-dark)',
                            borderColor: selected ? 'var(--primary)' : '#cbd5e1'
                          }}
                        >
                          {selected ? '✓ ' : '+ '}{sub.name}
                        </button>
                      );
                    })}
                    {subjects.length === 0 && <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No courses registered yet. Add courses under Courses tab.</p>}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
                {loading ? 'Saving...' : editingStaffId ? 'Update & Reassign Teacher' : 'Create Staff Account'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>Cancel</button>
            </div>
          </form>
        )}

        <div className="premium-table-wrapper">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Full Name</th>
                <th>Category</th>
                <th>Class / Subjects Assigned</th>
                <th>Username</th>
                <th>Email</th>
                {user.role === 'ADMIN' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map(s => {
                const initials = s.full_name ? s.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'ST';
                const cat = s.staff_category || (s.role === 'TEACHER' ? 'Teacher' : 'Staff');
                const catStyle = CATEGORY_COLORS[cat] || CATEGORY_COLORS.Teacher;
                const assignedClassObj = classLevels.find(c => String(c.id) === String(s.assigned_class_id));
                const assignedSubjs = (s.assigned_subject_ids || []).map(id => subjects.find(sub => String(sub.id) === String(id))?.name).filter(Boolean);

                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '11px' }}>{initials}</div>
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{s.full_name}</td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', backgroundColor: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}` }}>{cat}</span>
                    </td>
                    <td>
                      {cat === 'Teacher' ? (
                        <div style={{ fontSize: '12px' }}>
                          <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{assignedClassObj ? assignedClassObj.name : 'No Class Assigned'}</span>
                          {assignedSubjs.length > 0 && (
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Courses: {assignedSubjs.join(', ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{s.department || '—'}</span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{s.username}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.email || '—'}</td>
                    {user.role === 'ADMIN' && (
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button onClick={() => handleEditClick(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '4px' }} title="Edit & Reassign">
                            Edit
                          </button>
                          <button onClick={() => { if (window.confirm(`Remove ${s.full_name} from staff?`)) deleteLocal('users', s.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}>
                            <X style={{ width: '14px', height: '14px' }} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredStaff.length === 0 && (
                <tr><td colSpan={user.role === 'ADMIN' ? '7' : '6'} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '13px' }}>No staff found in this category.</td></tr>
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
  const allStaff = useLiveQuery(() => db.users.filter(u => u.role === 'TEACHER' || u.role === 'STAFF').toArray()) || [];
  const attendance = useLiveQuery(() => db.attendance.where('is_deleted').equals(0).toArray()) || [];

  // Admin: toggle between staff attendance and student attendance views
  const [attendanceMode, setAttendanceMode] = useState('students'); // 'students' | 'staff'
  const [selectedClass, setSelectedClass] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [statusMap, setStatusMap] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Teacher scoping
  const isTeacher = user.role === 'TEACHER';
  const hasAssignedClass = !!user.assigned_class_id;

  const availableClasses = isTeacher
    ? (hasAssignedClass ? classes.filter(c => String(c.id) === String(user.assigned_class_id)) : [])
    : classes;

  // Auto-select and lock assigned class for teachers
  useEffect(() => {
    if (isTeacher && hasAssignedClass) {
      setSelectedClass(user.assigned_class_id);
    }
  }, [user, isTeacher, hasAssignedClass]);

  const classStudents = selectedClass
    ? students.filter(s => enrollments.some(e => String(e.student_id) === String(s.id) && String(e.class_level_id) === String(selectedClass)))
    : [];

  const handleStatusChange = (personId, status) => {
    setStatusMap(prev => ({ ...prev, [personId]: status }));
  };

  const handleSubmitStudents = async () => {
    if (!selectedClass || !attendanceDate || classStudents.length === 0) return;
    setSubmitting(true);
    try {
      for (const student of classStudents) {
        const status = statusMap[student.id] || 'PRESENT';
        const existing = attendance.find(a => String(a.student_id) === String(student.id) && a.date === attendanceDate && String(a.class_level_id) === String(selectedClass));
        await saveLocal('attendance', { ...(existing || {}), student_id: student.id, date: attendanceDate, class_level_id: selectedClass, status, record_type: 'STUDENT' });
      }
      alert('Student attendance submitted!');
      setStatusMap({});
    } catch { alert('Error submitting attendance.'); }
    finally { setSubmitting(false); }
  };

  const handleSubmitStaff = async () => {
    if (!attendanceDate || allStaff.length === 0) return;
    setSubmitting(true);
    try {
      for (const staff of allStaff) {
        const status = statusMap[staff.id] || 'PRESENT';
        const existing = attendance.find(a => String(a.student_id) === String(staff.id) && a.date === attendanceDate && a.record_type === 'STAFF');
        await saveLocal('attendance', { ...(existing || {}), student_id: staff.id, date: attendanceDate, class_level_id: null, status, record_type: 'STAFF' });
      }
      alert('Staff attendance submitted!');
      setStatusMap({});
    } catch { alert('Error submitting attendance.'); }
    finally { setSubmitting(false); }
  };

  // Attendance summary rows for the history table scoped to teacher class if teacher
  const filteredStudentAttendance = attendance.filter(a => {
    if (a.record_type === 'STAFF') return false;
    if (isTeacher) {
      if (!hasAssignedClass) return false;
      return String(a.class_level_id) === String(user.assigned_class_id);
    }
    return true;
  });

  const studentHistory = [...new Map(
    filteredStudentAttendance.map(a => [`${a.date}-${a.class_level_id}`, a])
  ).values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  const staffHistory = [...new Map(
    attendance.filter(a => a.record_type === 'STAFF').map(a => [a.date, a])
  ).values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  const renderStatusButtons = (personId) => {
    const status = statusMap[personId] || 'PRESENT';
    return (
      <div style={{ display: 'flex', gap: '6px' }}>
        {['PRESENT', 'ABSENT'].map(opt => (
          <button key={opt} onClick={() => handleStatusChange(personId, opt)} style={{
            padding: '4px 12px', borderRadius: '20px', border: '1px solid', cursor: 'pointer', fontSize: '11px', fontWeight: '700',
            backgroundColor: status === opt ? (opt === 'PRESENT' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)') : 'transparent',
            color: status === opt ? (opt === 'PRESENT' ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)',
            borderColor: status === opt ? (opt === 'PRESENT' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)') : 'var(--border-color)',
          }}>{opt[0] + opt.slice(1).toLowerCase()}</button>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)' }}>Attendance Register</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {user.role === 'ADMIN' ? 'Mark attendance for staff or monitor student attendance across all classes.' : 'Mark attendance for students in your assigned class.'}
            </p>
          </div>
          {/* Admin mode toggle */}
          {user.role === 'ADMIN' && (
            <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '4px' }}>
              {[['students', 'Student Attendance'], ['staff', 'Staff Attendance']].map(([mode, label]) => (
                <button key={mode} onClick={() => { setAttendanceMode(mode); setStatusMap({}); }} style={{
                  padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                  backgroundColor: attendanceMode === mode ? '#fff' : 'transparent',
                  color: attendanceMode === mode ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: attendanceMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s',
                }}>{label}</button>
              ))}
            </div>
          )}
        </div>

        {/* Date picker */}
        <div style={{ marginBottom: '20px', maxWidth: '260px' }}>
          <label className="form-label">Attendance Date</label>
          <input type="date" value={attendanceDate} onChange={e => { setAttendanceDate(e.target.value); setStatusMap({}); }} className="input-field" />
        </div>

        {/* ── STAFF ATTENDANCE (Admin only) ── */}
        {user.role === 'ADMIN' && attendanceMode === 'staff' && (
          <>
            {/* Summary counts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '16px' }}>
              {[['Total Staff', allStaff.length, 'var(--primary)'], ['Present', allStaff.filter(s => (statusMap[s.id] || 'PRESENT') === 'PRESENT').length, 'var(--success)'], ['Absent', allStaff.filter(s => statusMap[s.id] === 'ABSENT').length, 'var(--danger)']].map(([label, val, col]) => (
                <div key={label} style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>{label}</p>
                  <p style={{ fontSize: '20px', fontWeight: '800', color: col, margin: '4px 0 0' }}>{val}</p>
                </div>
              ))}
            </div>
            <div className="premium-table-wrapper">
              <table className="premium-table">
                <thead><tr><th>Staff Member</th><th>Category</th><th>Status</th></tr></thead>
                <tbody>
                  {allStaff.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{s.full_name}</td>
                      <td><span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>{s.staff_category || (s.role === 'TEACHER' ? 'Teacher' : 'Staff')}</span></td>
                      <td>{renderStatusButtons(s.id)}</td>
                    </tr>
                  ))}
                  {allStaff.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>No staff registered yet.</td></tr>}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleSubmitStaff} disabled={submitting} className="btn btn-primary" style={{ padding: '10px 28px' }}>{submitting ? 'Submitting...' : 'Submit Staff Attendance'}</button>
            </div>
          </>
        )}

        {/* ── STUDENT ATTENDANCE (Teacher + Admin student mode) ── */}
        {(user.role === 'TEACHER' || (user.role === 'ADMIN' && attendanceMode === 'students')) && (
          isTeacher && !hasAssignedClass ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', backgroundColor: 'rgba(245, 158, 11, 0.08)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <ShieldAlert className="w-10 h-10 text-amber-500" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '4px' }}>No Class Assigned</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                You have not been assigned to a class level by the administrator. Contact your school administrator to assign you a class before taking attendance.
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '16px', maxWidth: '320px' }}>
                <label className="form-label">Class Level</label>
                <select
                  value={selectedClass}
                  onChange={e => { setSelectedClass(e.target.value); setStatusMap({}); }}
                  className="input-field select-field"
                  disabled={user.role === 'TEACHER' && !!user.assigned_class_id}
                >
                  <option value="">Select Class</option>
                  {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {selectedClass && classStudents.length > 0 && (
                <>
                  {/* Summary counts */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '16px' }}>
                    {[['Total Students', classStudents.length, 'var(--primary)'], ['Present', classStudents.filter(s => (statusMap[s.id] || 'PRESENT') === 'PRESENT').length, 'var(--success)'], ['Absent', classStudents.filter(s => statusMap[s.id] === 'ABSENT').length, 'var(--danger)']].map(([label, val, col]) => (
                      <div key={label} style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>{label}</p>
                        <p style={{ fontSize: '20px', fontWeight: '800', color: col, margin: '4px 0 0' }}>{val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="premium-table-wrapper">
                    <table className="premium-table">
                      <thead><tr><th>Student Name</th><th>Admission ID</th><th>Status</th></tr></thead>
                      <tbody>
                        {classStudents.map(s => (
                          <tr key={s.id}>
                            <td style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{s.first_name} {s.last_name}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{s.admission_number}</td>
                            <td>{renderStatusButtons(s.id)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSubmitStudents} disabled={submitting} className="btn btn-primary" style={{ padding: '10px 28px' }}>{submitting ? 'Submitting...' : 'Submit Attendance'}</button>
                  </div>
                </>
              )}
              {selectedClass && classStudents.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center' }}>No students enrolled in this class yet.</p>}
            </>
          )
        )}
      </div>

      {/* History Tables */}
      <div className="glass-card">
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '16px' }}>
          {user.role === 'ADMIN' && attendanceMode === 'staff' ? 'Recent Staff Attendance History' : 'Recent Student Attendance History'}
        </h3>
        <div className="premium-table-wrapper">
          {user.role === 'ADMIN' && attendanceMode === 'staff' ? (
            <table className="premium-table">
              <thead><tr><th>Date</th><th>Total Staff</th><th>Present</th><th>Absent</th></tr></thead>
              <tbody>
                {staffHistory.map((entry, idx) => {
                  const dayRecs = attendance.filter(a => a.date === entry.date && a.record_type === 'STAFF');
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{entry.date}</td>
                      <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{dayRecs.length}</td>
                      <td style={{ color: 'var(--success)', fontWeight: '700' }}>{dayRecs.filter(a => a.status === 'PRESENT').length}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: '700' }}>{dayRecs.filter(a => a.status === 'ABSENT').length}</td>
                    </tr>
                  );
                })}
                {staffHistory.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>No staff attendance records yet.</td></tr>}
              </tbody>
            </table>
          ) : (
            <table className="premium-table">
              <thead><tr><th>Date</th><th>Class</th><th>Total Students</th><th>Present</th><th>Absent</th></tr></thead>
              <tbody>
                {studentHistory.map((entry, idx) => {
                  const cls = classes.find(c => String(c.id) === String(entry.class_level_id))?.name || 'Unknown';
                  const dayRecs = attendance.filter(a => a.date === entry.date && String(a.class_level_id) === String(entry.class_level_id) && a.record_type !== 'STAFF');
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{entry.date}</td>
                      <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{cls}</td>
                      <td style={{ fontWeight: '700' }}>{dayRecs.length}</td>
                      <td style={{ color: 'var(--success)', fontWeight: '700' }}>{dayRecs.filter(a => a.status === 'PRESENT').length}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: '700' }}>{dayRecs.filter(a => a.status === 'ABSENT').length}</td>
                    </tr>
                  );
                })}
                {studentHistory.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>No attendance records yet.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Courses Panel ─────────────────────────────────────────────────
const STANDARD_SUBJECTS = [
  { name: 'Mathematics', code: 'MATH' },
  { name: 'English Language', code: 'ENG' },
  { name: 'Integrated Science', code: 'SCI' },
  { name: 'Social Studies', code: 'SOC' },
  { name: 'Information & Comm. Technology', code: 'ICT' },
  { name: 'Religious & Moral Education', code: 'RME' },
  { name: 'Creative Arts & Design', code: 'CAD' },
  { name: 'Ghanaian Language & Culture', code: 'GLC' },
  { name: 'Career Technology', code: 'CRT' },
  { name: 'French Language', code: 'FRN' },
  { name: 'Physical Education', code: 'PE' },
  { name: 'History', code: 'HIST' },
];

function CoursesPanel({ user }) {
  const subjects = useLiveQuery(() => db.subjects.where('is_deleted').equals(0).toArray()) || [];
  const topics = useLiveQuery(() => db.syllabus_topics.where('is_deleted').equals(0).toArray()) || [];
  const [activeSubject, setActiveSubject] = useState(null);
  const [newTopic, setNewTopic] = useState('');
  const [showAddPicker, setShowAddPicker] = useState(false);

  // Admin manages master subjects/courses
  const canEdit = user.role === 'ADMIN';

  const handleAddStandardSubject = async (subj) => {
    // Check if already exists (case-insensitive)
    const alreadyExists = subjects.some(s => s.name.toLowerCase() === subj.name.toLowerCase());
    if (alreadyExists) { alert(`"${subj.name}" is already in the subject list.`); return; }
    const saved = await saveLocal('subjects', { name: subj.name, code: subj.code });
    setShowAddPicker(false);
    setActiveSubject(saved.id);
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopic || !activeSubject) return;
    await saveLocal('syllabus_topics', { subject_id: activeSubject, title: newTopic, order_index: topics.filter(t => String(t.subject_id) === String(activeSubject)).length + 1 });
    setNewTopic('');
  };

  const subjectTopics = activeSubject ? topics.filter(t => String(t.subject_id) === String(activeSubject)) : [];
  const activeSubjectObj = subjects.find(s => String(s.id) === String(activeSubject));
  const unusedStandardSubjects = STANDARD_SUBJECTS.filter(ss => !subjects.some(s => s.name.toLowerCase() === ss.name.toLowerCase()));

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
      {/* Subject List */}
      <div className="glass-card" style={{ width: '280px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)' }}>Subjects</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Standardized school courses</p>
          </div>
          {canEdit && (
            <button onClick={() => setShowAddPicker(s => !s)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus style={{ width: '14px', height: '14px' }} />
            </button>
          )}
        </div>

        {/* Standard Subject Picker — Teacher Only */}
        {showAddPicker && canEdit && (
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--primary-glow)', borderRadius: '10px', border: '1px solid rgba(79,70,229,0.15)' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px', textTransform: 'uppercase' }}>Add Standard Subject</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
              {unusedStandardSubjects.map(ss => (
                <button key={ss.code} onClick={() => handleAddStandardSubject(ss)} style={{
                  textAlign: 'left', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(79,70,229,0.15)',
                  backgroundColor: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--text-dark)'
                }}>{ss.name} <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>({ss.code})</span></button>
              ))}
              {unusedStandardSubjects.length === 0 && <p style={{ fontSize: '12px', color: 'var(--success)', textAlign: 'center', padding: '8px 0' }}>✓ All standard subjects added!</p>}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {subjects.map(s => (
            <div key={s.id} onClick={() => setActiveSubject(s.id)} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
              backgroundColor: String(s.id) === String(activeSubject) ? 'var(--primary-glow)' : 'transparent',
              border: String(s.id) === String(activeSubject) ? '1px solid rgba(79,70,229,0.2)' : '1px solid transparent',
              transition: 'all 0.2s'
            }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>{s.name}</p>
                {s.code && <p style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{s.code}</p>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '20px' }}>
                  {topics.filter(t => String(t.subject_id) === String(s.id)).length}
                </span>
                {canEdit && (
                  <button onClick={(e) => { e.stopPropagation(); if (window.confirm(`Remove subject "${s.name}"?`)) deleteLocal('subjects', s.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}>
                    <X style={{ width: '12px', height: '12px' }} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {subjects.length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No subjects yet.{canEdit ? ' Use the + button to add from the standard list.' : ''}</p>}
        </div>
      </div>

      {/* Topic Manager */}
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
                  {canEdit && (
                    <button onClick={() => deleteLocal('syllabus_topics', t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}>
                      <X style={{ width: '14px', height: '14px' }} />
                    </button>
                  )}
                </div>
              ))}
              {subjectTopics.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '16px 0', textAlign: 'center' }}>No topics added yet.</p>}
            </div>
            {canEdit && (
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
      {activeTab === 'students' && <Students user={user} />}
      {activeTab === 'teachers' && <StaffPanel user={user} />}
      {activeTab === 'attendance' && <AttendancePanel user={user} />}
      {activeTab === 'courses' && <CoursesPanel user={user} />}
      {activeTab === 'grades' && <GradesEntry user={user} />}
      {activeTab === 'finance' && <Finance user={user} />}
      {activeTab === 'assets' && <Assets />}
      {activeTab === 'settings' && user.role === 'ADMIN' && <SettingsPanel user={user} onLogout={handleLogout} />}
    </AppLayout>
  );
}
