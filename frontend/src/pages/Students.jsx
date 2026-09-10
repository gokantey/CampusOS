import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { saveLocal, deleteLocal } from '../db/dbHelpers';
import { 
  Users, UserPlus, Settings, Plus, GraduationCap, Search, 
  MapPin, Phone, User, Calendar, Mail, BookOpen, Award, 
  CreditCard, ShieldAlert, CheckCircle, ChevronRight, ArrowLeft, Pencil, Trash2, X, Check
} from 'lucide-react';

export default function Students({ user }) {
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1: Setup, 2: Register Profile, 3: Class Enrollment
  const [activeProfileTab, setActiveProfileTab] = useState('progress'); // 'progress', 'fees'
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for Step 2: Register Profile
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [admNum, setAdmNum] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [guardianName, setGuardianName] = useState('');
  const [guardianContact, setGuardianContact] = useState('');

  // Extra biodata fields matching Behance mockup
  const [religion, setReligion] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [address, setAddress] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [fatherContact, setFatherContact] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherContact, setMotherContact] = useState('');

  // Form states for Step 3: Class Enrollment
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Form states for Step 1: School Structure Setup
  const [newYear, setNewYear] = useState('');
  const [newTerm, setNewTerm] = useState('');
  const [newClass, setNewClass] = useState('');
  const [newSection, setNewSection] = useState('');

  // Edit Profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [editLastName, setEditLastName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editGuardianName, setEditGuardianName] = useState('');
  const [editGuardianContact, setEditGuardianContact] = useState('');
  const [editReligion, setEditReligion] = useState('');
  const [editBloodGroup, setEditBloodGroup] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editFatherName, setEditFatherName] = useState('');
  const [editFatherContact, setEditFatherContact] = useState('');
  const [editMotherName, setEditMotherName] = useState('');
  const [editMotherContact, setEditMotherContact] = useState('');

  // Auto-redirect to setup if DB is empty
  useEffect(() => {
    Promise.all([
      db.class_levels.count(),
      db.students.count()
    ]).then(([classCount, studentCount]) => {
      if (classCount === 0 || studentCount === 0) {
        setIsAddingStudent(true);
        setWizardStep(1);
      }
    }).catch(() => {});
  }, []);

  // Database Live Queries
  const students = useLiveQuery(() => db.students.where('is_deleted').equals(0).toArray()) || [];
  const enrollments = useLiveQuery(() => db.enrollments.where('is_deleted').equals(0).toArray()) || [];
  const classes = useLiveQuery(() => db.class_levels.where('is_deleted').equals(0).toArray()) || [];
  const sections = useLiveQuery(() => db.sections.where('is_deleted').equals(0).toArray()) || [];
  const years = useLiveQuery(() => db.academic_years.where('is_deleted').equals(0).toArray()) || [];
  const terms = useLiveQuery(() => db.academic_terms.where('is_deleted').equals(0).toArray()) || [];
  
  // Extra queries for profile details tabs
  const academicRecords = useLiveQuery(() => db.academic_records.where('is_deleted').equals(0).toArray()) || [];
  const studentAccounts = useLiveQuery(() => db.student_accounts.where('is_deleted').equals(0).toArray()) || [];
  const paymentReceipts = useLiveQuery(() => db.payment_receipts.where('is_deleted').equals(0).toArray()) || [];
  const subjects = useLiveQuery(() => db.subjects.where('is_deleted').equals(0).toArray()) || [];

  // Auto-generate Admission ID based on pattern COS-YYYY-XXXX
  useEffect(() => {
    if (wizardStep === 2 && !admNum) {
      const year = new Date().getFullYear();
      let maxSeq = 0;
      students.forEach(s => {
        if (s.admission_number && s.admission_number.startsWith(`COS-${year}-`)) {
          const parts = s.admission_number.split('-');
          if (parts.length === 3) {
            const seq = parseInt(parts[2], 10);
            if (!isNaN(seq) && seq > maxSeq) {
              maxSeq = seq;
            }
          }
        }
      });
      const nextId = `COS-${year}-${(maxSeq + 1).toString().padStart(4, '0')}`;
      setAdmNum(nextId);
    }
  }, [wizardStep, students, admNum]);
  
  // Submit new Student Profile (Step 2)
  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !admNum) return;

    try {
      const saved = await saveLocal('students', {
        first_name: firstName,
        last_name: lastName,
        admission_number: admNum,
        date_of_birth: dob,
        gender: gender,
        guardian_name: guardianName,
        guardian_contact: guardianContact,
        religion,
        blood_group: bloodGroup,
        address,
        father_name: fatherName,
        father_contact: fatherContact,
        mother_name: motherName,
        mother_contact: motherContact
      });

      // Clear input fields
      setFirstName('');
      setLastName('');
      setAdmNum('');
      setDob('');
      setGender('Male');
      setGuardianName('');
      setGuardianContact('');
      setReligion('');
      setBloodGroup('');
      setAddress('');
      setFatherName('');
      setFatherContact('');
      setMotherName('');
      setMotherContact('');
      
      // Select the student in form and advance wizard step to Enrollment
      setSelectedStudent(saved.id);
      setWizardStep(3);
    } catch (err) {
      console.error(err);
      alert('Error registering student. Admission ID must be unique.');
    }
  };

  // Submit student enrollment (Step 3)
  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedClass || !selectedSection || !selectedYear) return;

    try {
      await saveLocal('enrollments', {
        student_id: selectedStudent,
        class_level_id: selectedClass,
        section_id: selectedSection,
        academic_year_id: selectedYear
      });

      // Precreate default Student Account ledger for Billing
      const existingAccount = await db.student_accounts.where('student_id').equals(selectedStudent).first();
      if (!existingAccount) {
        await saveLocal('student_accounts', {
          student_id: selectedStudent,
          total_billed: 0.00,
          total_paid: 0.00,
          balance: 0.00
        });
      }

      const completedStudentId = selectedStudent;

      // Clear form inputs
      setSelectedStudent('');
      setSelectedClass('');
      setSelectedSection('');
      setSelectedYear('');
      
      // Close wizard, show new student's profile card
      setIsAddingStudent(false);
      setSelectedStudentId(completedStudentId);
    } catch (err) {
      console.error(err);
      alert('Error enrolling student.');
    }
  };

  // Setup form submit handlers (Step 1)
  const handleAddYear = async (e) => {
    e.preventDefault();
    if (!newYear) return;
    await saveLocal('academic_years', { display_name: newYear, start_date: '2026-01-01', end_date: '2026-12-31', is_current: true });
    setNewYear('');
  };

  const handleAddTerm = async (e) => {
    e.preventDefault();
    if (!newTerm || !selectedYear) return;
    await saveLocal('academic_terms', { academic_year_id: selectedYear, name: newTerm, start_date: '2026-01-01', end_date: '2026-04-30', is_current: true });
    setNewTerm('');
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClass) return;
    await saveLocal('class_levels', { name: newClass, order_index: classes.length + 1 });
    setNewClass('');
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!newSection || !selectedClass) return;
    await saveLocal('sections', { class_level_id: selectedClass, name: newSection });
    setNewSection('');
  };

  // Delete setup items (soft delete)
  const handleDeleteSetupItem = async (table, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    await deleteLocal(table, id);
  };

  // Update student profile
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!currentStudent) return;
    await saveLocal('students', {
      ...currentStudent,
      first_name: editFirstName,
      last_name: editLastName,
      date_of_birth: editDob,
      gender: editGender,
      guardian_name: editGuardianName,
      guardian_contact: editGuardianContact,
      religion: editReligion,
      blood_group: editBloodGroup,
      address: editAddress,
      father_name: editFatherName,
      father_contact: editFatherContact,
      mother_name: editMotherName,
      mother_contact: editMotherContact,
    });
    setIsEditing(false);
  };

  // Delete student profile and their enrollments
  const handleDeleteStudent = async () => {
    if (!currentStudent) return;
    if (!window.confirm(`Delete ${currentStudent.first_name} ${currentStudent.last_name}'s profile? This cannot be undone.`)) return;
    // Soft-delete student
    await deleteLocal('students', currentStudent.id);
    // Soft-delete all their enrollments
    const studentEnrollments = enrollments.filter(e => String(e.student_id) === String(currentStudent.id));
    for (const enr of studentEnrollments) {
      await deleteLocal('enrollments', enr.id);
    }
    setSelectedStudentId(null);
  };

  // Populate edit form when selected student changes
  useEffect(() => {
    const student = students.find(s => String(s.id) === String(selectedStudentId || students[0]?.id));
    if (student) {
      setEditFirstName(student.first_name || '');
      setEditLastName(student.last_name || '');
      setEditDob(student.date_of_birth || '');
      setEditGender(student.gender || 'Male');
      setEditGuardianName(student.guardian_name || '');
      setEditGuardianContact(student.guardian_contact || '');
      setEditReligion(student.religion || '');
      setEditBloodGroup(student.blood_group || '');
      setEditAddress(student.address || '');
      setEditFatherName(student.father_name || '');
      setEditFatherContact(student.father_contact || '');
      setEditMotherName(student.mother_name || '');
      setEditMotherContact(student.mother_contact || '');
      setIsEditing(false);
    }
  }, [selectedStudentId, students]);

  // Teacher scoping: restrict student list if logged in as teacher with assigned class
  const isTeacher = user?.role === 'TEACHER';
  const hasAssignedClass = !!user?.assigned_class_id;

  const scopedStudents = isTeacher
    ? (hasAssignedClass
        ? students.filter(s => enrollments.some(e => String(e.student_id) === String(s.id) && String(e.class_level_id) === String(user.assigned_class_id)))
        : [])
    : students;

  // Robust Search filter for Roster (matches name, ID, parent/guardian, and class)
  const filteredStudents = scopedStudents.filter(student => {
    const term = (searchQuery || '').trim().toLowerCase();
    if (!term) return true;
    const fn = (student.first_name || '').toLowerCase();
    const ln = (student.last_name || '').toLowerCase();
    const fullName = `${fn} ${ln}`;
    const adm = (student.admission_number || '').toLowerCase();
    const gName = (student.guardian_name || '').toLowerCase();
    const fName = (student.father_name || '').toLowerCase();
    const mName = (student.mother_name || '').toLowerCase();

    const enr = enrollments.find(e => String(e.student_id) === String(student.id));
    const cName = enr ? (classes.find(c => String(c.id) === String(enr.class_level_id))?.name || '').toLowerCase() : '';

    return fullName.includes(term) ||
      fn.includes(term) ||
      ln.includes(term) ||
      adm.includes(term) ||
      gName.includes(term) ||
      fName.includes(term) ||
      mName.includes(term) ||
      cName.includes(term);
  });

  // Selected Student computed details (utilizes loose type coercion string comparison for robust key lookups)
  const currentStudent = students.find(s => String(s.id) === String(selectedStudentId || filteredStudents[0]?.id));
  const studentEnrollment = currentStudent ? enrollments.find(e => String(e.student_id) === String(currentStudent.id)) : null;
  const studentClass = studentEnrollment ? classes.find(c => String(c.id) === String(studentEnrollment.class_level_id))?.name : 'N/A';
  const studentSection = studentEnrollment ? sections.find(s => String(s.id) === String(studentEnrollment.section_id))?.name : '';
  const studentYear = studentEnrollment ? years.find(y => String(y.id) === String(studentEnrollment.academic_year_id))?.display_name : 'N/A';

  // Details tab details
  const studentGrades = currentStudent ? academicRecords.filter(r => String(r.student_id) === String(currentStudent.id)) : [];
  const studentLedger = currentStudent ? studentAccounts.find(a => String(a.student_id) === String(currentStudent.id)) : null;
  const studentReceipts = currentStudent ? paymentReceipts.filter(r => String(r.student_id) === String(currentStudent.id)) : [];

  // Initials generator
  const studentInitials = currentStudent 
    ? `${currentStudent.first_name[0]}${currentStudent.last_name[0]}`.toUpperCase()
    : 'ST';

  return (
    <div className="students-layout animate-fade-in">
      
      {/* Left Panel: Student Roster Card */}
      <div className="roster-card">
        <div className="roster-header">
          <div className="roster-title-wrapper">
            <h2 className="roster-title">Students</h2>
            <p className="roster-subtitle">{filteredStudents.length} profiles</p>
          </div>
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => {
                setIsAddingStudent(true);
                setWizardStep(1);
              }}
              className="btn btn-primary"
              style={{ padding: '8px 12px', fontSize: '11px', borderRadius: '8px' }}
            >
              <Plus className="w-4 h-4" />
              Add Student
            </button>
          )}
        </div>

        <div className="roster-search-wrapper">
          <Search className="roster-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students or ID..."
            className="roster-search-input"
          />
        </div>

        {/* Mockup list table headers */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 12px 8px 12px', borderBottom: '1px solid var(--border-color)', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
          <span style={{ flex: '1', display: 'flex', gap: '12px' }}>
            <span style={{ width: '38px', textAlign: 'center' }}>Photo</span>
            <span>Name</span>
          </span>
          <span style={{ width: '80px', textAlign: 'right' }}>Student ID</span>
          <span style={{ width: '40px', textAlign: 'right' }}>Year</span>
        </div>

        {/* Scrollable list */}
        <div className="roster-scroll">
          {filteredStudents.map(student => {
            const enrollment = enrollments.find(e => String(e.student_id) === String(student.id));
            const classLvl = enrollment ? classes.find(c => String(c.id) === String(enrollment.class_level_id))?.name : null;
            const sect = enrollment ? sections.find(s => String(s.id) === String(enrollment.section_id))?.name : null;
            const isSelected = currentStudent && String(currentStudent.id) === String(student.id) && !isAddingStudent;
            
            return (
              <div
                key={student.id}
                onClick={() => {
                  setSelectedStudentId(student.id);
                  setIsAddingStudent(false);
                }}
                className={`roster-item ${isSelected ? 'active' : ''}`}
              >
                <div className="roster-item-details">
                  <div className="roster-item-avatar">
                    {student.first_name[0]}{student.last_name[0]}
                  </div>
                  <div className="roster-item-info">
                    <p className="roster-item-name">{student.first_name} {student.last_name}</p>
                    <p className="roster-item-class">
                      {classLvl ? `${classLvl} ${sect || ''}` : 'Unenrolled'}
                    </p>
                  </div>
                </div>
                <div className="roster-item-right">
                  <p className="roster-item-id">{student.admission_number}</p>
                  <p className="roster-item-year">
                    {enrollment ? (years.find(y => String(y.id) === String(enrollment.academic_year_id))?.display_name || '2026').split('/')[0] : '2026'}
                  </p>
                </div>
              </div>
            );
          })}
          {filteredStudents.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              {isTeacher && !hasAssignedClass ? (
                <>
                  <ShieldAlert className="w-8 h-8 text-amber-500" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '4px' }}>No Class Assigned</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>You have not been assigned to a class level yet. Please contact your school administrator.</p>
                </>
              ) : (
                <p style={{ margin: 0 }}>No matching students found.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Details or Guided Wizard */}
      <div className="details-panel-container">
        {isTeacher && !hasAssignedClass ? (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '400px', padding: '32px' }}>
            <ShieldAlert className="w-16 h-16 text-amber-500" style={{ marginBottom: '16px', opacity: 0.7 }} />
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '8px' }}>Class Assignment Required</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: '1.6', margin: 0 }}>
              As a teacher, student records are strictly scoped to your assigned class. You currently have no class assigned to your account.
            </p>
            <div style={{ marginTop: '20px', padding: '12px 20px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '12px', color: '#b45309', fontWeight: '600' }}>
              Please ask an Admin to assign a class to you in Staff Management.
            </div>
          </div>
        ) : isAddingStudent ? (
          /* Guided Chronological Registration Wizard */
          <div className="wizard-container">
            <div className="wizard-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className="wizard-title">Guided Student Setup</h2>
                  <p className="wizard-subtitle">Follow the numbered steps chronologically to enroll a new student.</p>
                </div>
                <button 
                  onClick={() => setIsAddingStudent(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  Cancel Wizard
                </button>
              </div>
            </div>

            {/* Steps Tracker */}
            <div className="wizard-steps-tracker">
              <div className="wizard-steps-line"></div>
              <div 
                className={`wizard-step-node ${wizardStep === 1 ? 'active' : ''} ${wizardStep > 1 ? 'completed' : ''}`}
                onClick={() => wizardStep > 1 && setWizardStep(1)}
              >
                <div className="wizard-step-circle">1</div>
                <span className="wizard-step-label">School Setup</span>
              </div>
              <div 
                className={`wizard-step-node ${wizardStep === 2 ? 'active' : ''} ${wizardStep > 2 ? 'completed' : ''}`}
                onClick={() => wizardStep > 2 && setWizardStep(2)}
              >
                <div className="wizard-step-circle">2</div>
                <span className="wizard-step-label">Student Profile</span>
              </div>
              <div className={`wizard-step-node ${wizardStep === 3 ? 'active' : ''}`}>
                <div className="wizard-step-circle">3</div>
                <span className="wizard-step-label">Enroll Class</span>
              </div>
            </div>

            {/* Step 1: School Setup */}
            {wizardStep === 1 && (
              <div className="space-y-6">
                <div style={{ padding: '16px', backgroundColor: 'var(--primary-glow)', borderRadius: '12px', border: '1px solid rgba(79, 70, 229, 0.1)' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '4px' }}>1. Establish School Structure</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Establish the academic base structure in order: Academic Years, Terms, Class Levels, and Section levels.</p>
                </div>

                <div className="form-grid-2">
                  {/* Academic Year */}
                  <div className="glass-card" style={{ padding: '16px' }}>
                    <span className="form-label" style={{ color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>1. Academic Years</span>
                    <form onSubmit={handleAddYear} style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={newYear}
                        onChange={(e) => setNewYear(e.target.value)}
                        placeholder="e.g. 2026/2027"
                        className="input-field"
                        style={{ padding: '8px 12px', fontSize: '13px' }}
                        required
                      />
                      <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>Add</button>
                    </form>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                      {years.map(y => (
                        <span key={y.id} style={{ fontSize: '11px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {y.display_name}
                          <button type="button" onClick={() => handleDeleteSetupItem('academic_years', y.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', padding: 0 }}><X style={{ width: '12px', height: '12px' }} /></button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="glass-card" style={{ padding: '16px' }}>
                    <span className="form-label" style={{ color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>2. Terms</span>
                    <form onSubmit={handleAddTerm} className="space-y-2">
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="input-field select-field"
                        style={{ padding: '8px 12px', fontSize: '13px' }}
                        required
                      >
                        <option value="">Select Academic Year</option>
                        {years.map(y => (
                          <option key={y.id} value={y.id}>{y.display_name}</option>
                        ))}
                      </select>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={newTerm}
                          onChange={(e) => setNewTerm(e.target.value)}
                          placeholder="e.g. Term 1"
                          className="input-field"
                          style={{ padding: '8px 12px', fontSize: '13px' }}
                          required
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>Add</button>
                      </div>
                    </form>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                      {terms.map(t => {
                        const yr = years.find(y => String(y.id) === String(t.academic_year_id))?.display_name;
                        return (
                          <span key={t.id} style={{ fontSize: '11px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {yr} - {t.name}
                            <button type="button" onClick={() => handleDeleteSetupItem('academic_terms', t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', padding: 0 }}><X style={{ width: '12px', height: '12px' }} /></button>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Class Level */}
                  <div className="glass-card" style={{ padding: '16px' }}>
                    <span className="form-label" style={{ color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>3. Class Levels</span>
                    <form onSubmit={handleAddClass} style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={newClass}
                        onChange={(e) => setNewClass(e.target.value)}
                        placeholder="e.g. JHS 1"
                        className="input-field"
                        style={{ padding: '8px 12px', fontSize: '13px' }}
                        required
                      />
                      <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>Add</button>
                    </form>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                      {classes.map(c => (
                        <span key={c.id} style={{ fontSize: '11px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {c.name}
                          <button type="button" onClick={() => handleDeleteSetupItem('class_levels', c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', padding: 0 }}><X style={{ width: '12px', height: '12px' }} /></button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Section */}
                  <div className="glass-card" style={{ padding: '16px' }}>
                    <span className="form-label" style={{ color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>4. Class Sections</span>
                    <form onSubmit={handleAddSection} className="space-y-2">
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="input-field select-field"
                        style={{ padding: '8px 12px', fontSize: '13px' }}
                        required
                      >
                        <option value="">Select Class Level</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={newSection}
                          onChange={(e) => setNewSection(e.target.value)}
                          placeholder="e.g. Section A"
                          className="input-field"
                          style={{ padding: '8px 12px', fontSize: '13px' }}
                          required
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>Add</button>
                      </div>
                    </form>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                      {sections.map(s => {
                        const cls = classes.find(c => String(c.id) === String(s.class_level_id))?.name;
                        return (
                          <span key={s.id} style={{ fontSize: '11px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {cls} - {s.name}
                            <button type="button" onClick={() => handleDeleteSetupItem('sections', s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', padding: 0 }}><X style={{ width: '12px', height: '12px' }} /></button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="form-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  <button 
                    type="button" 
                    onClick={() => setWizardStep(2)}
                    className="btn btn-primary"
                    style={{ padding: '12px 28px' }}
                  >
                    Proceed to Step 2: Add Profile
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Register Profile Form */}
            {wizardStep === 2 && (
              <form onSubmit={handleRegisterStudent} className="space-y-6">
                <div style={{ padding: '16px', backgroundColor: 'var(--primary-glow)', borderRadius: '12px', border: '1px solid rgba(79, 70, 229, 0.1)' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '4px' }}>2. Enter Student Biodata</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Input the demographic, basic identification, and parent guardian details of the student profile.</p>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="input-field"
                      placeholder="e.g. Trisha"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="input-field"
                      placeholder="e.g. Essilfie"
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Admission ID</label>
                    <input
                      type="text"
                      value={admNum}
                      onChange={(e) => setAdmNum(e.target.value)}
                      className="input-field"
                      style={{ fontFamily: 'monospace', fontWeight: '600' }}
                      placeholder="e.g. F-6522"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="input-field select-field"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="form-divider"></div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Religion</label>
                    <input
                      type="text"
                      value={religion}
                      onChange={(e) => setReligion(e.target.value)}
                      className="input-field"
                      placeholder="e.g. Christian"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <input
                      type="text"
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="input-field"
                      placeholder="e.g. B+"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input-field"
                    placeholder="419 Essilfie Street, Mankessim, Central Region"
                  />
                </div>

                <div className="form-divider"></div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Father's Name</label>
                    <input
                      type="text"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className="input-field"
                      placeholder="David Essilfie"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Father's Contact</label>
                    <input
                      type="text"
                      value={fatherContact}
                      onChange={(e) => setFatherContact(e.target.value)}
                      className="input-field"
                      placeholder="+233542524855"
                    />
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Mother's Name</label>
                    <input
                      type="text"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      className="input-field"
                      placeholder="Maud Essilfie"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mother's Contact</label>
                    <input
                      type="text"
                      value={motherContact}
                      onChange={(e) => setMotherContact(e.target.value)}
                      className="input-field"
                      placeholder="+233531897319"
                    />
                  </div>
                </div>

                <div className="form-divider"></div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Guardian Name (optional)</label>
                    <input
                      type="text"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      className="input-field"
                      placeholder="Mary Mensah"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Guardian Contact (optional)</label>
                    <input
                      type="text"
                      value={guardianContact}
                      onChange={(e) => setGuardianContact(e.target.value)}
                      className="input-field"
                      placeholder="+233241234567"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => setWizardStep(1)}
                    className="btn btn-secondary"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                  >
                    Save & Proceed to Step 3
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Class Enrollment */}
            {wizardStep === 3 && (
              <form onSubmit={handleEnrollStudent} className="space-y-6">
                <div style={{ padding: '16px', backgroundColor: 'var(--primary-glow)', borderRadius: '12px', border: '1px solid rgba(79, 70, 229, 0.1)' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '4px' }}>3. Enroll Student in Class</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Select the registered profile, assign them to a Class level, Section, and Academic Year to activate enrollment.</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Student Profile</label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="input-field select-field"
                    required
                  >
                    <option value="">Select Student Profile</option>
                    {students.map(s => {
                      const enrolled = enrollments.some(e => String(e.student_id) === String(s.id));
                      return (
                        <option key={s.id} value={s.id}>
                          {s.first_name} {s.last_name} ({s.admission_number}) {enrolled ? ' [Enrolled]' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Academic Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="input-field select-field"
                    required
                  >
                    <option value="">Select Academic Year</option>
                    {years.map(y => (
                      <option key={y.id} value={y.id}>{y.display_name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Class Level</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => {
                        setSelectedClass(e.target.value);
                        setSelectedSection('');
                      }}
                      className="input-field select-field"
                      required
                    >
                      <option value="">Select Class</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Section</label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="input-field select-field"
                      required
                      disabled={!selectedClass}
                    >
                      <option value="">Select Section</option>
                      {sections.filter(s => String(s.class_level_id) === String(selectedClass)).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => setWizardStep(2)}
                    className="btn btn-secondary"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }}>
                    Confirm Class Enrollment
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* Student Detailed Profile Presentation */
          <div className="details-panel">
            {currentStudent ? (
              <>
                {/* 1. Header Profile Banner */}
                <div className="profile-banner">
                  {/* Concentric Golden SVG arcs matching mockup */}
                  <div className="profile-banner-svg">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <circle cx="200" cy="100" r="80" fill="none" stroke="#fbbf24" strokeWidth="12" strokeOpacity="0.4" />
                      <circle cx="200" cy="100" r="50" fill="none" stroke="#38bdf8" strokeWidth="8" strokeOpacity="0.4" />
                      <circle cx="200" cy="100" r="20" fill="none" stroke="#fbbf24" strokeWidth="4" strokeOpacity="0.4" />
                    </svg>
                  </div>
                  
                  {/* Profile Initial Avatar */}
                  <div className="profile-banner-avatar">
                    {studentInitials}
                  </div>

                  <div className="profile-banner-info">
                    <h1 className="profile-banner-name">{currentStudent.first_name} {currentStudent.last_name}</h1>
                    <div className="profile-banner-meta">
                      <span className="profile-banner-meta-item">
                        <BookOpen className="profile-banner-meta-icon" />
                        Class: {studentClass} {studentSection}
                      </span>
                      <span className="profile-banner-meta-item">
                        <User className="profile-banner-meta-icon" />
                        Students ID : {currentStudent.admission_number}
                      </span>
                      <span className="profile-banner-meta-item">
                        <Calendar className="profile-banner-meta-icon" />
                        Year: {studentYear}
                      </span>
                    </div>
                  </div>

                  {/* Profile Actions: Edit, Enroll, Delete */}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'flex-start', flexShrink: 0 }}>
                    {/* Enroll button — only if not yet enrolled */}
                    {!studentEnrollment && (
                      <button
                        onClick={() => {
                          setSelectedStudent(currentStudent.id);
                          setIsAddingStudent(true);
                          setWizardStep(3);
                        }}
                        style={{
                          background: 'rgba(16,185,129,0.15)',
                          border: '1px solid rgba(16,185,129,0.3)',
                          borderRadius: '10px',
                          padding: '8px 16px',
                          color: '#6ee7b7',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <GraduationCap style={{ width: '14px', height: '14px' }} />
                        Enroll
                      </button>
                    )}

                    {/* Edit Profile toggle */}
                    <button
                      onClick={() => setIsEditing(e => !e)}
                      style={{
                        background: isEditing ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '10px',
                        padding: '8px 16px',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {isEditing ? <X style={{ width: '14px', height: '14px' }} /> : <Pencil style={{ width: '14px', height: '14px' }} />}
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>

                    {/* Delete Student */}
                    <button
                      onClick={handleDeleteStudent}
                      style={{
                        background: 'rgba(239,68,68,0.12)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        borderRadius: '10px',
                        padding: '8px 16px',
                        color: '#fca5a5',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Unenrolled notice — shown when student has no class enrollment */}
                {!studentEnrollment && !isEditing && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '14px 20px',
                    backgroundColor: 'rgba(245,158,11,0.06)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: '12px',
                    marginBottom: '4px'
                  }}>
                    <GraduationCap style={{ width: '20px', height: '20px', color: 'var(--warning)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>Not Enrolled in a Class</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>This student has not been assigned to any class yet.</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStudent(currentStudent.id);
                        setIsAddingStudent(true);
                        setWizardStep(3);
                      }}
                      className="btn btn-primary"
                      style={{ padding: '8px 18px', fontSize: '12px', flexShrink: 0 }}
                    >
                      Enroll Now
                    </button>
                  </div>
                )}

                {/* 2. Edit Form or Basic Details Card */}
                {isEditing ? (
                  <form onSubmit={handleUpdateStudent} className="details-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h3 className="details-card-title" style={{ marginBottom: 0 }}>Edit Student Profile</h3>
                      <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check style={{ width: '14px', height: '14px' }} /> Save Changes
                      </button>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} className="input-field" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)} className="input-field" required />
                      </div>
                    </div>
                    <div className="form-grid-3">
                      <div className="form-group">
                        <label className="form-label">Date of Birth</label>
                        <input type="date" value={editDob} onChange={e => setEditDob(e.target.value)} className="input-field" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Gender</label>
                        <select value={editGender} onChange={e => setEditGender(e.target.value)} className="input-field select-field">
                          <option>Male</option><option>Female</option><option>Other</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Blood Group</label>
                        <input type="text" value={editBloodGroup} onChange={e => setEditBloodGroup(e.target.value)} className="input-field" placeholder="e.g. B+" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Religion</label>
                      <input type="text" value={editReligion} onChange={e => setEditReligion(e.target.value)} className="input-field" placeholder="e.g. Christian" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Address</label>
                      <input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} className="input-field" />
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Father's Name</label>
                        <input type="text" value={editFatherName} onChange={e => setEditFatherName(e.target.value)} className="input-field" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Father's Contact</label>
                        <input type="text" value={editFatherContact} onChange={e => setEditFatherContact(e.target.value)} className="input-field" />
                      </div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Mother's Name</label>
                        <input type="text" value={editMotherName} onChange={e => setEditMotherName(e.target.value)} className="input-field" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Mother's Contact</label>
                        <input type="text" value={editMotherContact} onChange={e => setEditMotherContact(e.target.value)} className="input-field" />
                      </div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Guardian Name</label>
                        <input type="text" value={editGuardianName} onChange={e => setEditGuardianName(e.target.value)} className="input-field" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Guardian Contact</label>
                        <input type="text" value={editGuardianContact} onChange={e => setEditGuardianContact(e.target.value)} className="input-field" />
                      </div>
                    </div>
                  </form>
                ) : (
                <div className="details-card">
                  <h3 className="details-card-title">Basic Details</h3>
                  <div className="details-grid-4">
                    <div className="detail-field">
                      <span className="detail-field-label">Gender</span>
                      <span className="detail-field-value">{currentStudent.gender}</span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-field-label">Date of Birth</span>
                      <span className="detail-field-value">{currentStudent.date_of_birth}</span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-field-label">Religion</span>
                      <span className="detail-field-value">{currentStudent.religion || 'Christian'}</span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-field-label">Blood Group</span>
                      <span className="detail-field-value">{currentStudent.blood_group || 'B+'}</span>
                    </div>
                  </div>

                  <div className="details-grid-3">
                    <div className="detail-field">
                      <span className="detail-field-label">Address</span>
                      <span className="detail-field-value">{currentStudent.address || '1962 Harrison Street, San Francisco, CA 94103'}</span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-field-label">Father</span>
                      <span className="detail-field-value" style={{ display: 'block' }}>{currentStudent.father_name || 'Richard Essilfie'}</span>
                      <a href={`tel:${currentStudent.father_contact || '+1660-965-4668'}`} className="detail-phone-link">
                        <Phone className="w-3.5 h-3.5" />
                        {currentStudent.father_contact || '+1660-965-4668'}
                      </a>
                    </div>
                    <div className="detail-field">
                      <span className="detail-field-label">Mother</span>
                      <span className="detail-field-value" style={{ display: 'block' }}>{currentStudent.mother_name || 'Maren Essilfie'}</span>
                      <a href={`tel:${currentStudent.mother_contact || '+1660-687-7027'}`} className="detail-phone-link">
                        <Phone className="w-3.5 h-3.5" />
                        {currentStudent.mother_contact || '+1660-687-7027'}
                      </a>
                    </div>
                  </div>
                </div>
                )} {/* end isEditing */}

                {/* 3. Detailed Tabs Navigation Card */}
                <div className="tabs-card">
                  <div className="tabs-header">
                    <button
                      onClick={() => setActiveProfileTab('progress')}
                      className={`tab-button ${activeProfileTab === 'progress' ? 'active' : ''}`}
                    >
                      Academic Progress
                    </button>
                    <button
                      onClick={() => setActiveProfileTab('fees')}
                      className={`tab-button ${activeProfileTab === 'fees' ? 'active' : ''}`}
                    >
                      Fees History
                    </button>
                  </div>

                  {/* Tab A: Academic Progress with custom SVG Line Graph */}
                  {activeProfileTab === 'progress' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        {/* Dynamic Subject Pills Row */}
                        <div className="pills-container" style={{ margin: 0 }}>
                          <button 
                            onClick={() => setSelectedSubjectFilter('ALL')}
                            className={`pill-button ${selectedSubjectFilter === 'ALL' ? 'active' : ''}`}
                          >
                            All Subjects
                          </button>
                          {subjects.map(s => (
                            <button 
                              key={s.id}
                              onClick={() => setSelectedSubjectFilter(String(s.id))}
                              className={`pill-button ${String(selectedSubjectFilter) === String(s.id) ? 'active' : ''}`}
                            >
                              {s.name}
                            </button>
                          ))}
                        </div>
                        {studentGrades.length > 0 && (
                          <span style={{ fontSize: '11px', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', padding: '5px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
                            Average Final Score: {(studentGrades.reduce((sum, g) => sum + parseFloat(g.final_score || 0), 0) / studentGrades.length).toFixed(1)}%
                          </span>
                        )}
                      </div>

                      {/* Dynamic SVG Line Chart Component */}
                      <div className="chart-wrapper" style={{ height: '240px', width: '100%', position: 'relative' }}>
                        {(() => {
                          const filteredGrades = selectedSubjectFilter === 'ALL'
                            ? studentGrades
                            : studentGrades.filter(g => String(g.subject_id) === String(selectedSubjectFilter));

                          if (filteredGrades.length === 0) {
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
                                <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)' }}>No Grade Records Available</p>
                                <p style={{ fontSize: '11px', marginTop: '4px' }}>Record SBA marks & exam scores in the Grades Entry tab to view graph trends.</p>
                              </div>
                            );
                          }

                          const graphWidth = 400;
                          const graphStartX = 60;
                          const startY = 180;
                          const topY = 30;
                          const heightRange = startY - topY;

                          const pts = filteredGrades.map((g, idx) => {
                            const subObj = subjects.find(s => String(s.id) === String(g.subject_id));
                            const label = subObj ? subObj.name : `Subject ${idx + 1}`;
                            const score = Math.min(100, Math.max(0, parseFloat(g.final_score || 0)));
                            const x = filteredGrades.length === 1 
                              ? 250 
                              : graphStartX + (idx * (graphWidth / (filteredGrades.length - 1)));
                            const y = startY - (score / 100) * heightRange;
                            return { x, y, score, label, record: g };
                          });

                          const lineD = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
                          const areaD = `${lineD} L ${pts[pts.length - 1].x} 180 L ${pts[0].x} 180 Z`;

                          return (
                            <svg viewBox="0 0 500 220" className="w-full h-full" style={{ overflow: 'visible' }}>
                              {/* Grid Lines */}
                              <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="40" y1="60" x2="480" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="40" y1="100" x2="480" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="40" y1="140" x2="480" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="40" y1="180" x2="480" y2="180" stroke="#f1f5f9" strokeWidth="1" />

                              {/* Y Axis Labels */}
                              <text x="30" y="24" fill="#a0aec0" fontSize="9" fontWeight="bold" textAnchor="end">100%</text>
                              <text x="30" y="64" fill="#a0aec0" fontSize="9" fontWeight="bold" textAnchor="end">75%</text>
                              <text x="30" y="104" fill="#a0aec0" fontSize="9" fontWeight="bold" textAnchor="end">50%</text>
                              <text x="30" y="144" fill="#a0aec0" fontSize="9" fontWeight="bold" textAnchor="end">25%</text>
                              <text x="30" y="184" fill="#a0aec0" fontSize="9" fontWeight="bold" textAnchor="end">0%</text>

                              {/* Area Gradient Fill */}
                              <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>
                              <path d={areaD} fill="url(#chartGradient)" />

                              {/* Dynamic Line Path */}
                              <path 
                                d={lineD} 
                                fill="none" 
                                stroke="var(--primary)" 
                                strokeWidth="3" 
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />

                              {/* Data Points & Interactive Tooltips */}
                              {pts.map((pt, idx) => {
                                const isHovered = hoveredPoint === idx;
                                return (
                                  <g key={idx} onMouseEnter={() => setHoveredPoint(idx)} onMouseLeave={() => setHoveredPoint(null)} style={{ cursor: 'pointer' }}>
                                    <circle 
                                      cx={pt.x} 
                                      cy={pt.y} 
                                      r={isHovered ? 7 : 5} 
                                      fill={isHovered ? 'var(--primary)' : '#ffffff'} 
                                      stroke="var(--primary)" 
                                      strokeWidth="2.5" 
                                    />
                                    {/* Tooltip Bubble */}
                                    {isHovered && (
                                      <g transform={`translate(${pt.x}, ${pt.y - 12})`}>
                                        <rect x="-35" y="-30" width="70" height="24" rx="6" fill="#1e293b" />
                                        <text x="0" y="-14" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                                          {pt.score}%
                                        </text>
                                      </g>
                                    )}
                                    {/* X Axis Label */}
                                    <text x={pt.x} y="202" fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle">
                                      {pt.label.length > 8 ? pt.label.substring(0, 8) + '..' : pt.label}
                                    </text>
                                  </g>
                                );
                              })}
                            </svg>
                          );
                        })()}
                      </div>

                      {/* Grades Table Sheet */}
                      <div className="premium-table-wrapper" style={{ marginTop: '12px' }}>
                        <table className="premium-table">
                          <thead>
                            <tr>
                              <th>Subject</th>
                              <th>SBA Score</th>
                              <th>Exam Score</th>
                              <th>Final Mark</th>
                              <th>Grade</th>
                              <th>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentGrades.map(record => {
                              const subName = subjects.find(s => String(s.id) === String(record.subject_id))?.name || 'Subject';
                              return (
                                <tr key={record.id}>
                                  <td className="font-semibold" style={{ color: 'var(--text-dark)' }}>{subName}</td>
                                  <td>{parseFloat(record.sba_score).toFixed(1)}</td>
                                  <td>{parseFloat(record.exam_score).toFixed(1)}</td>
                                  <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{parseFloat(record.final_score).toFixed(1)}%</td>
                                  <td>
                                    <span style={{
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontSize: '10px',
                                      fontWeight: '700',
                                      backgroundColor: record.grade_letter.startsWith('A') || record.grade_letter.startsWith('B') 
                                        ? 'rgba(16, 185, 129, 0.1)' 
                                        : record.grade_letter.startsWith('F') 
                                        ? 'rgba(239, 68, 68, 0.1)' 
                                        : 'rgba(245, 158, 11, 0.1)',
                                      color: record.grade_letter.startsWith('A') || record.grade_letter.startsWith('B') 
                                        ? 'var(--success)' 
                                        : record.grade_letter.startsWith('F') 
                                        ? 'var(--danger)' 
                                        : 'var(--warning)',
                                      border: record.grade_letter.startsWith('A') || record.grade_letter.startsWith('B') 
                                        ? '1px solid rgba(16, 185, 129, 0.2)' 
                                        : record.grade_letter.startsWith('F') 
                                        ? '1px solid rgba(239, 68, 68, 0.2)' 
                                        : '1px solid rgba(245, 158, 11, 0.2)'
                                    }}>
                                      {record.grade_letter}
                                    </span>
                                  </td>
                                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{record.remarks || '-'}</td>
                                </tr>
                              );
                            })}
                            {studentGrades.length === 0 && (
                              <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '12px' }}>No academic records on file for this student profile.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Tab B: Fees History */}
                  {activeProfileTab === 'fees' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Financial Balances Card */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Total Billed</p>
                          <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)' }}>GH¢ {parseFloat(studentLedger?.total_billed || 0).toFixed(2)}</p>
                        </div>
                        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Total Paid</p>
                          <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--success)' }}>GH¢ {parseFloat(studentLedger?.total_paid || 0).toFixed(2)}</p>
                        </div>
                        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Balance</p>
                          <p style={{ fontSize: '15px', fontWeight: '800', color: parseFloat(studentLedger?.balance || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                            GH¢ {parseFloat(studentLedger?.balance || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Payment Transactions List */}
                      <div>
                        <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '12px' }}>Payment Receipts Ledger</h4>
                        <div className="premium-table-wrapper">
                          <table className="premium-table">
                            <thead>
                              <tr>
                                <th>Receipt No.</th>
                                <th>Date</th>
                                <th>Mode</th>
                                <th>Amount Paid</th>
                                <th>Remaining Bal.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentReceipts.map(receipt => (
                                <tr key={receipt.id}>
                                  <td style={{ fontFamily: 'monospace', fontWeight: '700' }}>{receipt.receipt_number}</td>
                                  <td>{receipt.payment_date}</td>
                                  <td>{receipt.payment_mode}</td>
                                  <td style={{ fontWeight: '700', color: 'var(--success)' }}>GH¢ {parseFloat(receipt.amount_paid).toFixed(2)}</td>
                                  <td style={{ fontWeight: '600', color: 'var(--text-dark)' }}>GH¢ {parseFloat(receipt.balance_remaining).toFixed(2)}</td>
                                </tr>
                              ))}
                              {studentReceipts.length === 0 && (
                                <tr>
                                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '12px' }}>No payments captured for this student.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '64px 24px', height: '100%', minHeight: '400px', borderStyle: 'dashed', borderWidth: '2px' }}>
                <Users className="w-16 h-16 text-indigo-500/10" style={{ marginBottom: '16px', opacity: 0.2 }} />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '8px' }}>No Student Profile Selected</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '300px' }}>
                  Please select an active student profile from the roster list on the left side, or setup/register a new profile using the wizard.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
