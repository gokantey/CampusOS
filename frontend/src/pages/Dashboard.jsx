import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Users, CreditCard, ShieldAlert, Award, Package, PlusCircle } from 'lucide-react';

export default function Dashboard({ user, setActiveTab }) {
  // Query statistics from local database
  const studentCount = useLiveQuery(() => db.students.where('is_deleted').equals(0).count());
  const assetCount = useLiveQuery(() => db.assets.where('is_deleted').equals(0).count());
  const brokenAssetCount = useLiveQuery(() => db.assets.filter(a => a.is_deleted === 0 && a.condition !== 'Good').count());
  
  const totalBilled = useLiveQuery(async () => {
    const accs = await db.student_accounts.toArray();
    return accs.reduce((sum, acc) => sum + parseFloat(acc.total_billed || 0), 0);
  });

  const totalPaid = useLiveQuery(async () => {
    const accs = await db.student_accounts.toArray();
    return accs.reduce((sum, acc) => sum + parseFloat(acc.total_paid || 0), 0);
  });

  const collectionRate = totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(1) : 0;

  const recentStudents = useLiveQuery(() => 
    db.students.where('is_deleted').equals(0).reverse().limit(5).toArray()
  );

  const recentReceipts = useLiveQuery(() => 
    db.payment_receipts.where('is_deleted').equals(0).reverse().limit(5).toArray()
  );

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
          <h1 className="welcome-banner-title">Akwaaba, {user.full_name}!</h1>
          <p className="welcome-banner-text">
            This is the school management dashboard for CampusOS. All updates persist instantly in the local browser database and replicate automatically to the cloud server when online.
          </p>
        </div>
        <div className="welcome-banner-actions">
          {user.role === 'ADMIN' && (
            <button 
              onClick={() => setActiveTab('students')}
              className="btn btn-secondary-dark"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}
            >
              <PlusCircle className="w-4 h-4" />
              Add Student
            </button>
          )}
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid-4">
        {/* Stat 1: Student Count */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)', border: '1px solid rgba(79, 70, 229, 0.12)' }}>
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="form-label" style={{ fontSize: '9px', marginBottom: '2px' }}>Enrolled Students</p>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-dark)' }}>{studentCount ?? 0}</h3>
          </div>
        </div>

        {/* Stat 2: Fees Collected (Admins only) */}
        {user.role === 'ADMIN' ? (
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.08)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.12)' }}>
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="form-label" style={{ fontSize: '9px', marginBottom: '2px' }}>Fee Collection Rate</p>
              <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-dark)' }}>{collectionRate}%</h3>
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(124, 58, 237, 0.08)', color: '#7c3aed', border: '1px solid rgba(124, 58, 237, 0.12)' }}>
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="form-label" style={{ fontSize: '9px', marginBottom: '2px' }}>Grading Progress</p>
              <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-dark)' }}>Active</h3>
            </div>
          </div>
        )}

        {/* Stat 3: Asset Count */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.08)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.12)' }}>
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="form-label" style={{ fontSize: '9px', marginBottom: '2px' }}>School Assets</p>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-dark)' }}>{assetCount ?? 0}</h3>
          </div>
        </div>

        {/* Stat 4: Broken Assets */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.12)' }}>
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="form-label" style={{ fontSize: '9px', marginBottom: '2px' }}>Damaged Assets</p>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-dark)' }}>{brokenAssetCount ?? 0}</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Details List */}
      <div className="grid-2">
        {/* Left Card: Recent Admissions */}
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
                  <span style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(79, 70, 229, 0.08)',
                    color: 'var(--primary)',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {student.gender}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '24px 0' }}>No student profiles found.</p>
          )}
        </div>

        {/* Right Card: Recent Financial Payments */}
        {user.role === 'ADMIN' ? (
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
        ) : (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '32px' }}>
            <Award className="w-16 h-16 text-indigo-500/10" style={{ marginBottom: '16px', opacity: 0.2 }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '8px' }}>Teacher Quick Entry</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '300px', marginBottom: '20px' }}>
              Access the Grades Entry tab to record SBA marks, exam scores, and write end-of-term remarks.
            </p>
            <button 
              onClick={() => setActiveTab('grades')}
              className="btn btn-secondary"
              style={{ fontWeight: '600', padding: '8px 20px', fontSize: '13px' }}
            >
              Go to Grades Grid
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
