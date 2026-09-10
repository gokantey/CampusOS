import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import {
  Users, CreditCard, ShieldAlert, Award, Package, PlusCircle,
  PieChart, TrendingUp, BookOpen, CheckCircle, UserCheck, AlertCircle
} from 'lucide-react';

// ─── Admin Dashboard ──────────────────────────────────────────────────
function AdminDashboard({ user, setActiveTab }) {
  const studentCount = useLiveQuery(() => db.students.where('is_deleted').equals(0).count());
  const assetCount = useLiveQuery(() => db.assets.where('is_deleted').equals(0).count());
  const brokenAssetCount = useLiveQuery(() => db.assets.filter(a => a.is_deleted === 0 && a.condition !== 'Good').count());

  const maleCount = useLiveQuery(() => db.students.filter(s => s.is_deleted === 0 && s.gender === 'Male').count()) || 0;
  const femaleCount = useLiveQuery(() => db.students.filter(s => s.is_deleted === 0 && s.gender === 'Female').count()) || 0;
  const totalGender = maleCount + femaleCount;
  const malePct = totalGender > 0 ? Math.round((maleCount / totalGender) * 100) : 50;
  const femalePct = totalGender > 0 ? 100 - malePct : 50;

  const totalBilled = useLiveQuery(async () => {
    const accs = await db.student_accounts.toArray();
    return accs.reduce((sum, acc) => sum + parseFloat(acc.total_billed || 0), 0);
  }) || 0;

  const totalPaid = useLiveQuery(async () => {
    const accs = await db.student_accounts.toArray();
    return accs.reduce((sum, acc) => sum + parseFloat(acc.total_paid || 0), 0);
  }) || 0;

  const outstandingBalance = Math.max(0, totalBilled - totalPaid);
  const collectionRate = totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(1) : 0;
  const recentStudents = useLiveQuery(() => db.students.where('is_deleted').equals(0).reverse().limit(5).toArray());
  const recentReceipts = useLiveQuery(() => db.payment_receipts.where('is_deleted').equals(0).reverse().limit(5).toArray());

  return (
    <div className="space-y-6">
      <div className="grid-4">
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(79,70,229,0.08)', color: 'var(--primary)', border: '1px solid rgba(79,70,229,0.12)' }}>
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="form-label" style={{ fontSize: '9px', marginBottom: '2px' }}>Total Enrolled</p>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-dark)' }}>{studentCount ?? 0}</h3>
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(16,185,129,0.08)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.12)' }}>
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="form-label" style={{ fontSize: '9px', marginBottom: '2px' }}>Fee Collection Rate</p>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-dark)' }}>{collectionRate}%</h3>
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(16,185,129,0.08)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.12)' }}>
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="form-label" style={{ fontSize: '9px', marginBottom: '2px' }}>School Assets</p>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-dark)' }}>{assetCount ?? 0}</h3>
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.12)' }}>
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="form-label" style={{ fontSize: '9px', marginBottom: '2px' }}>Damaged Assets</p>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-dark)' }}>{brokenAssetCount ?? 0}</h3>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="glass-card space-y-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              <h2 className="glass-card-title" style={{ margin: 0 }}>Student Gender Distribution</h2>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Total: {totalGender}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '12px 0' }}>
            <div style={{ position: 'relative', width: '130px', height: '130px' }}>
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3.6" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--primary)" strokeWidth="3.6" strokeDasharray={`${malePct}, 100`} style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ec4899" strokeWidth="3.6" strokeDasharray={`${femalePct}, 100`} strokeDashoffset={`-${malePct}`} style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
                <text x="18" y="15.5" fill="var(--text-dark)" fontSize="7.5" fontWeight="800" textAnchor="middle" dominantBaseline="middle">{totalGender}</text>
                <text x="18" y="22" fill="var(--text-muted)" fontSize="3" fontWeight="600" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.2px">Students</text>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: 'var(--primary)', display: 'inline-block' }}></span>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>Male ({malePct}%)</p>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>{maleCount} students</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#ec4899', display: 'inline-block' }}></span>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>Female ({femalePct}%)</p>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>{femaleCount} students</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card space-y-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--success)' }} />
              <h2 className="glass-card-title" style={{ margin: 0 }}>Revenue & Fee Recovery</h2>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700', backgroundColor: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '12px' }}>
              {collectionRate}% Recovered
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>
                <span style={{ color: 'var(--success)' }}>Paid: GH¢ {totalPaid.toFixed(2)}</span>
                <span style={{ color: 'var(--danger)' }}>Balance: GH¢ {outstandingBalance.toFixed(2)}</span>
              </div>
              <div style={{ height: '12px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ height: '100%', width: `${Math.min(100, collectionRate)}%`, backgroundColor: 'var(--success)', transition: 'width 0.5s ease' }}></div>
                <div style={{ height: '100%', width: `${100 - Math.min(100, collectionRate)}%`, backgroundColor: '#ef4444', opacity: 0.3 }}></div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', margin: 0 }}>Total Billed</p>
                <p style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-dark)', margin: '2px 0 0 0' }}>GH¢ {totalBilled.toFixed(2)}</p>
              </div>
              <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', margin: 0 }}>Outstanding</p>
                <p style={{ fontSize: '14px', fontWeight: '800', color: 'var(--danger)', margin: '2px 0 0 0' }}>GH¢ {outstandingBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="glass-card space-y-4">
          <h2 className="glass-card-title">Recent Enrolled Students</h2>
          {recentStudents && recentStudents.length > 0 ? (
            <div className="space-y-4">
              {recentStudents.map(student => (
                <div key={student.id} className="flex-row-space" style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>{student.first_name} {student.last_name}</p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>ID: {student.admission_number}</p>
                  </div>
                  <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', backgroundColor: 'rgba(79,70,229,0.08)', color: 'var(--primary)', fontWeight: '600' }}>{student.gender}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '24px 0' }}>No student profiles found.</p>
          )}
        </div>
        <div className="glass-card space-y-4">
          <h2 className="glass-card-title">Recent Fee Payments</h2>
          {recentReceipts && recentReceipts.length > 0 ? (
            <div className="space-y-4">
              {recentReceipts.map(receipt => (
                <div key={receipt.id} className="flex-row-space" style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', fontFamily: 'monospace' }}>Receipt: {receipt.receipt_number}</p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Date: {receipt.payment_date}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--success)' }}>GH¢ {parseFloat(receipt.amount_paid).toFixed(2)}</p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{receipt.payment_mode}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '24px 0' }}>No payment transactions recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Teacher Dashboard ────────────────────────────────────────────────
function TeacherDashboard({ user, setActiveTab }) {
  const assignedClassId = user?.assigned_class_id;

  const classInfo = useLiveQuery(() =>
    assignedClassId ? db.class_levels.get(Number(assignedClassId)) : Promise.resolve(null)
  , [assignedClassId]);

  const allEnrollments = useLiveQuery(() =>
    assignedClassId
      ? db.enrollments.filter(e => e.is_deleted === 0 && String(e.class_level_id) === String(assignedClassId)).toArray()
      : Promise.resolve([])
  , [assignedClassId]) || [];

  const studentIds = allEnrollments.map(e => e.student_id);

  const classStudents = useLiveQuery(async () => {
    if (!studentIds.length) return [];
    const all = await db.students.where('is_deleted').equals(0).toArray();
    return all.filter(s => studentIds.includes(s.id));
  }, [studentIds.join(',')]) || [];

  const attendanceRecords = useLiveQuery(() =>
    assignedClassId
      ? db.attendance.filter(a => a.is_deleted === 0 && String(a.class_level_id) === String(assignedClassId)).toArray()
      : Promise.resolve([])
  , [assignedClassId]) || [];

  const totalAttendance = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(a => a.status === 'Present').length;
  const attendanceRate = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : 0;

  const classMale = classStudents.filter(s => s.gender === 'Male').length;
  const classFemale = classStudents.filter(s => s.gender === 'Female').length;
  const classTotal = classMale + classFemale;
  const classMalePct = classTotal > 0 ? Math.round((classMale / classTotal) * 100) : 50;
  const classFemalePct = classTotal > 0 ? 100 - classMalePct : 50;

  if (!assignedClassId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'rgba(245,158,11,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(245,158,11,0.3)' }}>
          <AlertCircle style={{ width: '32px', height: '32px', color: 'var(--warning)' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '8px' }}>No Class Currently Assigned</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '360px', lineHeight: '1.6' }}>
            You have not yet been assigned to a class. Please contact the school administrator to have a class allocated to your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div style={{ padding: '16px 20px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(99,102,241,0.04) 100%)', border: '1px solid rgba(79,70,229,0.15)', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(79,70,229,0.12)', color: 'var(--primary)' }}>
          <BookOpen style={{ width: '22px', height: '22px' }} />
        </div>
        <div>
          <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Assigned Class</p>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', margin: '2px 0 0 0' }}>{classInfo?.name || 'Loading...'}</h2>
        </div>
      </div>

      <div className="grid-4">
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(79,70,229,0.08)', color: 'var(--primary)', border: '1px solid rgba(79,70,229,0.12)' }}>
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="form-label" style={{ fontSize: '9px', marginBottom: '2px' }}>Class Students</p>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-dark)' }}>{classStudents.length}</h3>
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(16,185,129,0.08)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.12)' }}>
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="form-label" style={{ fontSize: '9px', marginBottom: '2px' }}>Attendance Rate</p>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-dark)' }}>{attendanceRate}%</h3>
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(124,58,237,0.08)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.12)' }}>
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="form-label" style={{ fontSize: '9px', marginBottom: '2px' }}>Male Students</p>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-dark)' }}>{classMale}</h3>
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(236,72,153,0.08)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.12)' }}>
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="form-label" style={{ fontSize: '9px', marginBottom: '2px' }}>Female Students</p>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-dark)' }}>{classFemale}</h3>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="glass-card space-y-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              <h2 className="glass-card-title" style={{ margin: 0 }}>Class Gender Distribution</h2>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Total: {classTotal}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '12px 0' }}>
            <div style={{ position: 'relative', width: '130px', height: '130px' }}>
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3.6" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--primary)" strokeWidth="3.6" strokeDasharray={`${classMalePct}, 100`} style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ec4899" strokeWidth="3.6" strokeDasharray={`${classFemalePct}, 100`} strokeDashoffset={`-${classMalePct}`} style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
                <text x="18" y="15.5" fill="var(--text-dark)" fontSize="7.5" fontWeight="800" textAnchor="middle" dominantBaseline="middle">{classTotal}</text>
                <text x="18" y="22" fill="var(--text-muted)" fontSize="3" fontWeight="600" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.2px">Students</text>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: 'var(--primary)', display: 'inline-block' }}></span>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>Male ({classMalePct}%)</p>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>{classMale} students</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#ec4899', display: 'inline-block' }}></span>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>Female ({classFemalePct}%)</p>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>{classFemale} students</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card space-y-4">
          <h2 className="glass-card-title">Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => setActiveTab('attendance')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', gap: '10px', padding: '12px 16px', fontSize: '13px' }}>
              <CheckCircle style={{ width: '16px', height: '16px' }} />
              Mark Class Attendance
            </button>
            <button onClick={() => setActiveTab('grades')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', gap: '10px', padding: '12px 16px', fontSize: '13px' }}>
              <Award style={{ width: '16px', height: '16px' }} />
              Enter Grades / Marksheet
            </button>
            <button onClick={() => setActiveTab('students')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', gap: '10px', padding: '12px 16px', fontSize: '13px' }}>
              <Users style={{ width: '16px', height: '16px' }} />
              View Class Roster
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card space-y-4">
        <h2 className="glass-card-title">Class Student Roster — {classInfo?.name}</h2>
        {classStudents.length > 0 ? (
          <div className="premium-table-wrapper">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Admission ID</th>
                  <th>Gender</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{i + 1}</td>
                    <td style={{ fontWeight: '600' }}>{s.first_name} {s.last_name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>{s.admission_number}</td>
                    <td>
                      <span style={{
                        fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600',
                        backgroundColor: s.gender === 'Male' ? 'rgba(79,70,229,0.08)' : 'rgba(236,72,153,0.08)',
                        color: s.gender === 'Male' ? 'var(--primary)' : '#ec4899'
                      }}>{s.gender}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '24px 0' }}>No students enrolled in this class yet.</p>
        )}
      </div>
    </div>
  );
}

// ─── Other Staff Dashboard ────────────────────────────────────────────
function StaffDashboard({ user }) {
  const CATEGORY_COLORS = {
    Teacher: { bg: 'rgba(79,70,229,0.08)', color: 'var(--primary)' },
    Caterer: { bg: 'rgba(245,158,11,0.08)', color: 'var(--warning)' },
    Laborer: { bg: 'rgba(16,185,129,0.08)', color: 'var(--success)' },
    Administrator: { bg: 'rgba(99,102,241,0.08)', color: '#6366f1' },
    Security: { bg: 'rgba(239,68,68,0.08)', color: 'var(--danger)' },
    Cleaner: { bg: 'rgba(20,184,166,0.08)', color: '#14b8a6' },
    Driver: { bg: 'rgba(168,85,247,0.08)', color: '#a855f7' },
  };
  const cat = user.staff_category || user.role;
  const colors = CATEGORY_COLORS[cat] || { bg: 'rgba(79,70,229,0.08)', color: 'var(--primary)' };
  const initials = (user.full_name || user.username || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div style={{ padding: '28px', borderRadius: '16px', background: colors.bg, border: `1px solid ${colors.color}33`, display: 'flex', gap: '24px', alignItems: 'center' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: colors.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${colors.color}44`, flexShrink: 0 }}>
          <span style={{ fontSize: '28px', fontWeight: '800', color: colors.color }}>{initials}</span>
        </div>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>{user.full_name || user.username}</h2>
          <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', backgroundColor: colors.bg, color: colors.color, border: `1px solid ${colors.color}33` }}>
            {cat}
          </span>
        </div>
      </div>
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', gap: '16px' }}>
        <UserCheck style={{ width: '48px', height: '48px', color: colors.color, opacity: 0.6 }} />
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '8px' }}>Logged In as {cat}</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: '1.7' }}>
            Your portal is scoped to your role. Contact the school administrator if you need access to additional features or information.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard (Role Router) ─────────────────────────────────────
export default function Dashboard({ user, setActiveTab }) {
  return (
    <div className="space-y-6 animate-fade-in" style={{ color: 'var(--text-dark)' }}>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-banner-svg">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="200" cy="100" r="100" fill="none" stroke="#ffffff" strokeWidth="20" />
            <circle cx="200" cy="100" r="60" fill="none" stroke="#ffffff" strokeWidth="10" />
          </svg>
        </div>
        <div className="welcome-banner-info">
          <h1 className="welcome-banner-title">Akwaaba, {user.full_name || user.username}!</h1>
          <p className="welcome-banner-text">
            {user.role === 'ADMIN'
              ? 'School-wide overview for CampusOS. All metrics update in real time.'
              : user.role === 'TEACHER'
                ? 'Your class portal. Manage attendance, grades, and student records.'
                : 'Welcome to your CampusOS staff portal. Your access is scoped to your role.'}
          </p>
        </div>
        <div className="welcome-banner-actions">
          {user.role === 'ADMIN' && (
            <button onClick={() => setActiveTab('students')} className="btn btn-secondary-dark" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
              <PlusCircle className="w-4 h-4" />
              Add Student
            </button>
          )}
        </div>
      </div>

      {/* Role-Specific Content */}
      {user.role === 'ADMIN' && <AdminDashboard user={user} setActiveTab={setActiveTab} />}
      {user.role === 'TEACHER' && <TeacherDashboard user={user} setActiveTab={setActiveTab} />}
      {user.role !== 'ADMIN' && user.role !== 'TEACHER' && <StaffDashboard user={user} />}
    </div>
  );
}

