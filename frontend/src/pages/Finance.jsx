import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { saveLocal } from '../db/dbHelpers';
import { CreditCard, Plus, Receipt, Printer, X, DollarSign, Search, CheckCircle } from 'lucide-react';

export default function Finance({ user }) {
  const [activeStepTab, setActiveStepTab] = useState('billing_setup'); // 'billing_setup', 'payment', 'ledgers'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payment states
  const [selectedStudent, setSelectedStudent] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [receiptModel, setReceiptModel] = useState(null); // stores receipt to print

  // Setup states
  const [feeCategory, setFeeCategory] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [selectedFeeCategory, setSelectedFeeCategory] = useState('');

  // Database queries
  const students = useLiveQuery(() => db.students.where('is_deleted').equals(0).toArray()) || [];
  const classes = useLiveQuery(() => db.class_levels.where('is_deleted').equals(0).toArray()) || [];
  const terms = useLiveQuery(() => db.academic_terms.where('is_deleted').equals(0).toArray()) || [];
  const enrollments = useLiveQuery(() => db.enrollments.where('is_deleted').equals(0).toArray()) || [];
  const feeCategories = useLiveQuery(() => db.fee_categories.where('is_deleted').equals(0).toArray()) || [];
  const feeStructures = useLiveQuery(() => db.fee_structures.where('is_deleted').equals(0).toArray()) || [];
  const studentAccounts = useLiveQuery(() => db.student_accounts.where('is_deleted').equals(0).toArray()) || [];
  const receipts = useLiveQuery(() => db.payment_receipts.where('is_deleted').equals(0).toArray()) || [];

  // Helper to recalculate ledger values locally (utilizing loose string comparison to handle key robustness)
  const recalculateLocalLedger = async (studentId, incomingPayment = 0) => {
    // 1. Calculate Billed
    let totalBilled = 0;
    const studentEnrollments = enrollments.filter(e => String(e.student_id) === String(studentId));
    
    for (const enrollment of studentEnrollments) {
      const activeTerms = terms.filter(t => String(t.academic_year_id) === String(enrollment.academic_year_id));
      const activeTermIds = activeTerms.map(t => String(t.id));
      
      const fees = feeStructures.filter(f => 
        String(f.class_level_id) === String(enrollment.class_level_id) && 
        activeTermIds.includes(String(f.term_id))
      );
      
      for (const fee of fees) {
        totalBilled += parseFloat(fee.amount || 0);
      }
    }

    // 2. Calculate Paid
    const otherReceipts = receipts.filter(r => String(r.student_id) === String(studentId));
    const totalPaid = otherReceipts.reduce((sum, r) => sum + parseFloat(r.amount_paid || 0), 0) + parseFloat(incomingPayment);
    const balance = totalBilled - totalPaid;

    // Save update locally to update UI instantly
    const existing = studentAccounts.find(acc => String(acc.student_id) === String(studentId));
    await db.student_accounts.put({
      ...(existing || {}),
      student_id: studentId,
      total_billed: parseFloat(totalBilled.toFixed(2)),
      total_paid: parseFloat(totalPaid.toFixed(2)),
      balance: parseFloat(balance.toFixed(2)),
      updated_at: new Date().toISOString(),
      is_deleted: 0
    });

    return balance;
  };

  // Submit fee payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !amountPaid) return;

    try {
      const studentObj = students.find(s => String(s.id) === String(selectedStudent));
      if (!studentObj) return;

      const receiptNum = `REC-${Date.now().toString().slice(-6)}`;
      const paymentDate = new Date().toISOString().split('T')[0];

      // Calculate balance locally
      const remainingBalance = await recalculateLocalLedger(selectedStudent, amountPaid);

      const receiptData = {
        student_id: selectedStudent,
        receipt_number: receiptNum,
        amount_paid: parseFloat(amountPaid),
        balance_remaining: parseFloat(remainingBalance.toFixed(2)),
        payment_date: paymentDate,
        payment_mode: paymentMode,
        recorded_by_id: user.id
      };

      // Write receipt locally & outbox
      const savedReceipt = await saveLocal('payment_receipts', receiptData);

      // Open print overlay
      setReceiptModel({
        ...savedReceipt,
        student_name: `${studentObj.first_name} ${studentObj.last_name}`,
        admission_number: studentObj.admission_number
      });

      // Clear input
      setAmountPaid('');
      setSelectedStudent('');
    } catch (err) {
      console.error(err);
      alert('Error recording payment.');
    }
  };

  // Add Fee Category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!feeCategory) return;
    await saveLocal('fee_categories', { name: feeCategory });
    setFeeCategory('');
    alert('Fee Category created!');
  };

  // Add Fee Structure Rule
  const handleAddFeeStructure = async (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedTerm || !selectedFeeCategory || !feeAmount) return;

    await saveLocal('fee_structures', {
      class_level_id: selectedClass,
      term_id: selectedTerm,
      category_id: selectedFeeCategory,
      amount: parseFloat(feeAmount)
    });

    // Recalculate all student accounts to include the new fee
    for (const student of students) {
      await recalculateLocalLedger(student.id, 0);
    }

    alert('Fee structure created. All student balances recalculated!');
    setSelectedClass('');
    setSelectedTerm('');
    setSelectedFeeCategory('');
    setFeeAmount('');
  };

  const printReceipt = () => {
    window.print();
  };

  // Search filter for Ledgers
  const filteredStudents = students.filter(student => {
    const term = searchQuery.toLowerCase();
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    return fullName.includes(term) || student.admission_number.toLowerCase().includes(term);
  });

  // Fetch billing state for selected payment student
  const activePaymentAccount = selectedStudent ? studentAccounts.find(a => String(a.student_id) === String(selectedStudent)) : null;

  return (
    <div className="space-y-6 animate-fade-in" style={{ color: 'var(--text-dark)' }}>
      {/* Workflow Tabs Navigation */}
      <div className="tabs-header">
        <button
          onClick={() => setActiveStepTab('billing_setup')}
          className={`tab-button ${activeStepTab === 'billing_setup' ? 'active' : ''}`}
        >
          Billing Setup
        </button>
        <button
          onClick={() => setActiveStepTab('payment')}
          className={`tab-button ${activeStepTab === 'payment' ? 'active' : ''}`}
        >
          Collect Payment
        </button>
        <button
          onClick={() => setActiveStepTab('ledgers')}
          className={`tab-button ${activeStepTab === 'ledgers' ? 'active' : ''}`}
        >
          Student Ledgers
        </button>
      </div>

      {/* Step 1: Billing & Fee Setup */}
      {activeStepTab === 'billing_setup' && (
        <div className="grid-2">
          {/* Add Fee Category */}
          <div className="glass-card space-y-4">
            <span className="form-label" style={{ color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>1. Fee Categories</span>
            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={feeCategory}
                onChange={(e) => setFeeCategory(e.target.value)}
                placeholder="e.g. Tuition Fee"
                className="input-field"
                style={{ fontSize: '13px' }}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ fontSize: '13px', padding: '10px 18px', shrink: 0 }}>Add Category</button>
            </form>
            <div className="flex-wrap-gap" style={{ marginTop: '12px' }}>
              {feeCategories.map(cat => (
                <span key={cat.id} style={{ fontSize: '11px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '20px', fontWeight: '600' }}>
                  {cat.name}
                </span>
              ))}
            </div>
          </div>

          {/* Add Fee Structure rule */}
          <div className="glass-card space-y-4">
            <span className="form-label" style={{ color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>2. Class Fee Allocations</span>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Assign standard fee amounts to academic levels and terms. Ledger balances recalculate automatically.</p>
            <form onSubmit={handleAddFeeStructure} className="space-y-4">
              <div className="grid-2" style={{ gap: '12px' }}>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="input-field select-field"
                  style={{ fontSize: '13px' }}
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="input-field select-field"
                  style={{ fontSize: '13px' }}
                  required
                >
                  <option value="">Select Term</option>
                  {terms.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid-2" style={{ gap: '12px' }}>
                <select
                  value={selectedFeeCategory}
                  onChange={(e) => setSelectedFeeCategory(e.target.value)}
                  className="input-field select-field"
                  style={{ fontSize: '13px' }}
                  required
                >
                  <option value="">Select Category</option>
                  {feeCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
                  placeholder="Amount (GH¢)"
                  className="input-field"
                  style={{ fontSize: '13px', fontWeight: 'bold' }}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary w-full" style={{ fontSize: '13px', padding: '10px 16px' }}>Save Fee Allocation</button>
            </form>
          </div>
        </div>
      )}

      {/* Step 2: Collect Payments */}
      {activeStepTab === 'payment' && (
        <div className="grid-3">
          {/* Payment Capture Form */}
          <div className="glass-card" style={{ gridColumn: window.innerWidth > 768 ? 'span 2' : 'span 1' }}>
            <h3 className="glass-card-title flex-row-gap" style={{ marginBottom: '20px' }}>
              <Receipt className="w-5 h-5 text-indigo-500" />
              Collect Student Fee Payment
            </h3>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Select Student</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="input-field select-field"
                  style={{ fontSize: '13px' }}
                  required
                >
                  <option value="">Choose Student Roster Profile</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_number})</option>
                  ))}
                </select>
              </div>

              <div className="grid-2" style={{ gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="input-field select-field"
                    style={{ fontSize: '13px' }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Bank Draft">Bank Draft</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount Paid (GH¢)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '13px', fontWeight: 'bold' }}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" style={{ padding: '12px 24px', marginTop: '12px' }}>
                Process Payment & Print Receipt
              </button>
            </form>
          </div>

          {/* Student Ledger Snapshot Preview (Right Sidebar) */}
          <div className="glass-card space-y-4">
            <h4 className="form-label">Student Account Preview</h4>
            {selectedStudent && activePaymentAccount ? (
              <div className="space-y-4">
                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Billed Fees</p>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-dark)' }}>GH¢ {parseFloat(activePaymentAccount.total_billed).toFixed(2)}</p>
                </div>
                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Paid Fees</p>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--success)' }}>GH¢ {parseFloat(activePaymentAccount.total_paid).toFixed(2)}</p>
                </div>
                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Remaining Balance</p>
                  <p style={{ fontSize: '18px', fontWeight: '800', color: parseFloat(activePaymentAccount.balance) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    GH¢ {parseFloat(activePaymentAccount.balance).toFixed(2)}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 12px', color: 'var(--text-muted)', fontSize: '12px' }}>
                Please select a student on the left to review their active financial ledger snapshot.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Ledger Summary */}
      {activeStepTab === 'ledgers' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex-row-space">
            <div className="header-search" style={{ maxWidth: '320px' }}>
              <Search className="header-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ledgers by student name or ID..."
                className="header-search-input"
              />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
              Showing {filteredStudents.length} of {students.length} accounts
            </span>
          </div>

          <div className="premium-table-wrapper">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Student Account</th>
                  <th>Total Billed</th>
                  <th>Total Paid</th>
                  <th>Outstanding Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => {
                  const account = studentAccounts.find(a => String(a.student_id) === String(student.id)) || {
                    total_billed: 0,
                    total_paid: 0,
                    balance: 0
                  };
                  const balanceVal = parseFloat(account.balance);
                  return (
                    <tr key={student.id}>
                      <td style={{ fontWeight: '700', color: 'var(--text-dark)' }}>
                        <div>{student.first_name} {student.last_name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>ID: {student.admission_number}</div>
                      </td>
                      <td>GH¢ {parseFloat(account.total_billed).toFixed(2)}</td>
                      <td>GH¢ {parseFloat(account.total_paid).toFixed(2)}</td>
                      <td style={{ fontWeight: '800', color: balanceVal > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        GH¢ {balanceVal.toFixed(2)}
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '9px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          backgroundColor: balanceVal > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: balanceVal > 0 ? 'var(--danger)' : 'var(--success)',
                          border: balanceVal > 0 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)'
                        }}>
                          {balanceVal > 0 ? 'Pending' : 'Settled'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '12px' }}>No active student ledger profiles registered.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal Overlay */}
      {receiptModel && (
        <div 
          className="print-overlay" 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            padding: '16px'
          }}
        >
          <div 
            className="glass-card" 
            style={{ 
              width: '100%', 
              maxWidth: '400px', 
              padding: '24px', 
              position: 'relative',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)' 
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setReceiptModel(null)}
              style={{
                position: 'absolute',
                right: '16px',
                top: '16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Print Area */}
            <div id="receipt-print-area" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlignment: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>CAMPUSOS ACADEMY</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Official Fee Payment Receipt</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Receipt No:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--text-dark)' }}>{receiptModel.receipt_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Student Name:</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{receiptModel.student_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Admission ID:</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{receiptModel.admission_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Date Paid:</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{receiptModel.payment_date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Mode:</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{receiptModel.payment_mode}</span>
                </div>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>AMOUNT PAID:</span>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--success)' }}>
                    GH¢ {parseFloat(receiptModel.amount_paid).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>REMAINING BALANCE:</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: parseFloat(receiptModel.balance_remaining) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    GH¢ {parseFloat(receiptModel.balance_remaining).toFixed(2)}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-color)', paddingTop: '16px' }}>
                Thank you for your payment. Keep this receipt safe.
              </div>
            </div>

            {/* Print action buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setReceiptModel(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Close
              </button>
              <button
                onClick={printReceipt}
                className="btn btn-primary"
                style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
