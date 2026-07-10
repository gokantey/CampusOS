import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { saveLocal } from '../db/dbHelpers';
import { Award, Plus, FileSpreadsheet, BookOpen, CheckCircle, Save } from 'lucide-react';

export default function GradesEntry({ user }) {
  const [activeStepTab, setActiveStepTab] = useState('curriculum'); // 'curriculum', 'sheet'
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Subject & Grading Weight helper form state
  const [newSubject, setNewSubject] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [sbaWeight, setSbaWeight] = useState(40);
  const [examWeight, setExamWeight] = useState(60);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Database Queries
  const classes = useLiveQuery(() => db.class_levels.where('is_deleted').equals(0).toArray()) || [];
  const sections = useLiveQuery(() => db.sections.where('is_deleted').equals(0).toArray()) || [];
  const terms = useLiveQuery(() => db.academic_terms.where('is_deleted').equals(0).toArray()) || [];
  const subjects = useLiveQuery(() => db.subjects.where('is_deleted').equals(0).toArray()) || [];
  const gradingSystems = useLiveQuery(() => db.grading_systems.where('is_deleted').equals(0).toArray()) || [];
  const enrollments = useLiveQuery(() => db.enrollments.where('is_deleted').equals(0).toArray()) || [];
  const students = useLiveQuery(() => db.students.where('is_deleted').equals(0).toArray()) || [];
  const academicRecords = useLiveQuery(() => db.academic_records.where('is_deleted').equals(0).toArray()) || [];

  // Filter students based on selected ClassLevel and Section (using string comparison for ID robustness)
  const activeEnrollments = enrollments.filter(e => 
    String(e.class_level_id) === String(selectedClass) && 
    String(e.section_id) === String(selectedSection)
  );
  
  const activeStudents = activeEnrollments.map(e => students.find(s => String(s.id) === String(e.student_id))).filter(Boolean);

  // Find grading weight for the selected class
  const classGrading = gradingSystems.find(g => String(g.class_level_id) === String(selectedClass)) || {
    sba_weight: 40.0,
    exam_weight: 60.0
  };

  const currentSbaWeight = parseFloat(classGrading.sba_weight);
  const currentExamWeight = parseFloat(classGrading.exam_weight);

  // Grade Letter Calculator helper
  const calculateGrade = (finalScore) => {
    if (finalScore >= 80) return 'A1';
    if (finalScore >= 70) return 'B2';
    if (finalScore >= 65) return 'B3';
    if (finalScore >= 60) return 'C4';
    if (finalScore >= 55) return 'C5';
    if (finalScore >= 50) return 'C6';
    if (finalScore >= 45) return 'D7';
    if (finalScore >= 40) return 'E8';
    return 'F9';
  };

  // Local state to store sheet entries before save
  const [marksSheetData, setMarksSheetData] = useState({});

  // Reset local marks sheet data whenever the user switches class/section/term/subject
  useEffect(() => {
    setMarksSheetData({});
    setShowSaveSuccess(false);
  }, [selectedClass, selectedSection, selectedTerm, selectedSubject]);

  // Keep track of input changes locally
  const handleInputChange = (studentId, field, val) => {
    setMarksSheetData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: val
      }
    }));
  };

  // Submit all grades (Save Marksheet)
  const handleSaveMarksheet = async (e) => {
    if (e) e.preventDefault();
    if (!selectedClass || !selectedSection || !selectedTerm || !selectedSubject) return;

    try {
      // Save each student's record
      for (const student of activeStudents) {
        const localInput = marksSheetData[student.id] || {};
        const existing = academicRecords.find(r => 
          String(r.student_id) === String(student.id) && 
          String(r.term_id) === String(selectedTerm) && 
          String(r.subject_id) === String(selectedSubject)
        );

        // Calculate sba and exam scores, falling back to existing data if no local modification
        const sbaVal = localInput.sba_score !== undefined ? localInput.sba_score : (existing ? existing.sba_score.toString() : '');
        const examVal = localInput.exam_score !== undefined ? localInput.exam_score : (existing ? existing.exam_score.toString() : '');
        const remarksVal = localInput.remarks !== undefined ? localInput.remarks : (existing ? existing.remarks : '');

        const sba = parseFloat(sbaVal || 0);
        const exam = parseFloat(examVal || 0);

        const finalScore = (sba * (currentSbaWeight / 100.0)) + (exam * (currentExamWeight / 100.0));
        const gradeLetter = calculateGrade(finalScore);

        const recordData = {
          ...(existing || {}),
          student_id: student.id,
          term_id: selectedTerm,
          subject_id: selectedSubject,
          sba_score: sba,
          exam_score: exam,
          final_score: parseFloat(finalScore.toFixed(2)),
          grade_letter: gradeLetter,
          remarks: remarksVal,
          recorded_by_id: user.id
        };

        await saveLocal('academic_records', recordData);
      }

      setLastSavedTime(new Date().toLocaleTimeString());
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Error saving marksheet grades. Please try again.');
    }
  };

  // Add new Subject
  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject) return;
    await saveLocal('subjects', { name: newSubject, code: newSubCode });
    setNewSubject('');
    setNewSubCode('');
    alert('Subject registered successfully!');
  };

  // Configure weights for class
  const handleSaveGradingWeight = async (e) => {
    e.preventDefault();
    if (!selectedClass) return;
    const existing = gradingSystems.find(g => String(g.class_level_id) === String(selectedClass));
    await saveLocal('grading_systems', {
      ...(existing || {}),
      class_level_id: selectedClass,
      sba_weight: parseFloat(sbaWeight),
      exam_weight: parseFloat(examWeight)
    });
    alert('Grading split weights updated successfully!');
  };

  const applyPresetSplit = (sba, exam) => {
    setSbaWeight(sba);
    setExamWeight(exam);
  };

  return (
    <div className="space-y-6 animate-fade-in" style={{ color: 'var(--text-dark)' }}>
      {/* Workflow Tabs */}
      <div className="tabs-header">
        <button
          onClick={() => setActiveStepTab('curriculum')}
          className={`tab-button ${activeStepTab === 'curriculum' ? 'active' : ''}`}
        >
          Curriculum & Weights
        </button>
        <button
          onClick={() => setActiveStepTab('sheet')}
          className={`tab-button ${activeStepTab === 'sheet' ? 'active' : ''}`}
        >
          Marks Sheet Entry
        </button>
      </div>

      {/* Step 1: Curriculum & Weights */}
      {activeStepTab === 'curriculum' && (
        <div className="grid-2">
          {/* Add Subject */}
          <div className="glass-card space-y-4">
            <div className="glass-card-title-row">
              <h3 className="glass-card-title flex-row-gap">
                <Plus className="w-5 h-5 text-indigo-500" />
                Add Subject/Course
              </h3>
            </div>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div className="grid-2" style={{ gap: '12px' }}>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Mathematics"
                  className="input-field"
                  style={{ fontSize: '13px' }}
                  required
                />
                <input
                  type="text"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  placeholder="e.g. MATH-JHS"
                  className="input-field"
                  style={{ fontSize: '13px' }}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ fontSize: '13px', padding: '10px 16px' }}>Register Subject</button>
            </form>
            <div className="flex-wrap-gap" style={{ maxHeight: '200px', overflowY: 'auto', paddingTop: '10px' }}>
              {subjects.map(s => (
                <span key={s.id} style={{ fontSize: '11px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '20px', fontWeight: '600' }}>
                  {s.name} ({s.code || 'No Code'})
                </span>
              ))}
            </div>
          </div>

          {/* Configure Grading System Split */}
          <div className="glass-card space-y-4">
            <div className="glass-card-title-row">
              <h3 className="glass-card-title flex-row-gap">
                <Award className="w-5 h-5 text-indigo-500" />
                Set Class Grading Weights
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Configure the score composition split between School-Based Assessment (SBA) and Exams for each class level.
            </p>
            
            {/* Presets split button */}
            <div className="space-y-4">
              <label className="form-label" style={{ fontSize: '10px' }}>Quick Presets</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => applyPresetSplit(50, 50)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '11px', flex: 1 }}
                >
                  50/50 Split
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetSplit(40, 60)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '11px', flex: 1 }}
                >
                  40/60 Split
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetSplit(30, 70)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '11px', flex: 1 }}
                >
                  30/70 Split
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveGradingWeight} className="space-y-4" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">Class Level</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="input-field select-field"
                  style={{ fontSize: '13px' }}
                  required
                >
                  <option value="">Select Class Level</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid-2" style={{ gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">SBA Weight (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={sbaWeight}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value || 0);
                      setSbaWeight(e.target.value);
                      setExamWeight(Math.max(0, 100 - val));
                    }}
                    className="input-field"
                    style={{ textAlign: 'center', fontWeight: 'bold' }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Exam Weight (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={examWeight}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value || 0);
                      setExamWeight(e.target.value);
                      setSbaWeight(Math.max(0, 100 - val));
                    }}
                    className="input-field"
                    style={{ textAlign: 'center', fontWeight: 'bold' }}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ fontSize: '13px', padding: '10px 16px' }}>Save Grading Split</button>
            </form>
          </div>
        </div>
      )}

      {/* Step 2: Marks Sheet Entry */}
      {activeStepTab === 'sheet' && (
        <div className="space-y-6">
          {/* Search and Filters panel */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div className="grid-4" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Academic Term</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="input-field select-field"
                  style={{ fontSize: '13px' }}
                >
                  <option value="">Select Term</option>
                  {terms.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Class Level</label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedSection('');
                  }}
                  className="input-field select-field"
                  style={{ fontSize: '13px' }}
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
                  style={{ fontSize: '13px' }}
                  disabled={!selectedClass}
                >
                  <option value="">Select Section</option>
                  {sections.filter(s => String(s.class_level_id) === String(selectedClass)).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="input-field select-field"
                  style={{ fontSize: '13px' }}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedClass && selectedSection && selectedTerm && selectedSubject ? (
            <div className="space-y-4">
              {/* Active Grading Split Display */}
              <div className="flex-row-space" style={{ padding: '16px', backgroundColor: 'var(--primary-glow)', border: '1px solid rgba(79, 70, 229, 0.1)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>
                    Active Weight Rule: <span style={{ color: 'var(--primary)' }}>{currentSbaWeight}% SBA</span> + <span style={{ color: 'var(--primary)' }}>{currentExamWeight}% Exams</span>
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Auto-calculates grades in real time. Remember to click Save before switching subjects.</span>
                </div>
                {activeStudents.length > 0 && (
                  <button 
                    type="button"
                    onClick={handleSaveMarksheet}
                    className="btn btn-primary"
                    style={{ padding: '10px 18px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Save className="w-4 h-4" />
                    Save Marksheet
                  </button>
                )}
              </div>

              {/* Save Confirmation Banner */}
              {showSaveSuccess && (
                <div className="flex-row-gap" style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--success)', fontSize: '12px', fontWeight: '600' }}>
                  <CheckCircle className="w-4 h-4" />
                  <span>Marksheet successfully saved locally and queued in outbox at {lastSavedTime}!</span>
                </div>
              )}

              {/* Grading Spreadsheet Grid */}
              <form onSubmit={handleSaveMarksheet} className="space-y-4">
                <div className="premium-table-wrapper">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th style={{ width: '25%' }}>Student Name</th>
                        <th style={{ width: '18%' }}>SBA Mark (Max 100)</th>
                        <th style={{ width: '18%' }}>Exam Mark (Max 100)</th>
                        <th style={{ width: '15%', textAlign: 'center' }}>Final Score ({currentSbaWeight + currentExamWeight}%)</th>
                        <th style={{ width: '10%', textAlign: 'center' }}>Grade</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeStudents.map(student => {
                        const record = academicRecords.find(r => 
                          String(r.student_id) === String(student.id) && 
                          String(r.term_id) === String(selectedTerm) && 
                          String(r.subject_id) === String(selectedSubject)
                        );

                        // Extract local values if modified, or fallback to record values
                        const localInput = marksSheetData[student.id] || {};
                        const sbaScore = localInput.sba_score !== undefined ? localInput.sba_score : (record ? record.sba_score.toString() : '');
                        const examScore = localInput.exam_score !== undefined ? localInput.exam_score : (record ? record.exam_score.toString() : '');
                        const remarks = localInput.remarks !== undefined ? localInput.remarks : (record ? record.remarks : '');

                        // Calculate live preview final score
                        const sba = parseFloat(sbaScore || 0);
                        const exam = parseFloat(examScore || 0);
                        const liveFinalScore = (sba * (currentSbaWeight / 100.0)) + (exam * (currentExamWeight / 100.0));
                        const hasValues = sbaScore !== '' || examScore !== '';
                        const liveGradeLetter = hasValues ? calculateGrade(liveFinalScore) : (record ? record.grade_letter : '-');

                        return (
                          /* Compound key forcing react to recreate rows on course change */
                          <tr key={`${student.id}-${selectedSubject}-${selectedTerm}`}>
                            <td style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{student.first_name} {student.last_name}</td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={sbaScore}
                                onChange={(e) => handleInputChange(student.id, 'sba_score', e.target.value)}
                                className="input-field"
                                style={{ width: '110px', textAlign: 'center', fontSize: '13px', padding: '8px 12px' }}
                                placeholder="0.0"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={examScore}
                                onChange={(e) => handleInputChange(student.id, 'exam_score', e.target.value)}
                                className="input-field"
                                style={{ width: '110px', textAlign: 'center', fontSize: '13px', padding: '8px 12px' }}
                                placeholder="0.0"
                              />
                            </td>
                            <td style={{ fontWeight: '800', color: 'var(--primary)', textAlign: 'center' }}>
                              {hasValues ? liveFinalScore.toFixed(1) : (record ? parseFloat(record.final_score).toFixed(1) : '-')}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {hasValues || record ? (
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  backgroundColor: liveGradeLetter.startsWith('A') || liveGradeLetter.startsWith('B')
                                    ? 'rgba(16, 185, 129, 0.1)'
                                    : liveGradeLetter.startsWith('F')
                                    ? 'rgba(239, 68, 68, 0.1)'
                                    : 'rgba(245, 158, 11, 0.1)',
                                  color: liveGradeLetter.startsWith('A') || liveGradeLetter.startsWith('B')
                                    ? 'var(--success)'
                                    : liveGradeLetter.startsWith('F')
                                    ? 'var(--danger)'
                                    : 'var(--warning)',
                                  border: liveGradeLetter.startsWith('A') || liveGradeLetter.startsWith('B')
                                    ? '1px solid rgba(16, 185, 129, 0.2)'
                                    : liveGradeLetter.startsWith('F')
                                    ? '1px solid rgba(239, 68, 68, 0.2)'
                                    : '1px solid rgba(245, 158, 11, 0.2)'
                                }}>
                                  {liveGradeLetter}
                                </span>
                              ) : '-'}
                            </td>
                            <td>
                              <input
                                type="text"
                                value={remarks}
                                onChange={(e) => handleInputChange(student.id, 'remarks', e.target.value)}
                                className="input-field"
                                style={{ fontSize: '13px', padding: '8px 12px' }}
                                placeholder="Teacher remarks..."
                              />
                            </td>
                          </tr>
                        );
                      })}
                      {activeStudents.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                            No students are currently enrolled in this class section. Please enroll student profiles.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Save Grades Control Button */}
                {activeStudents.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Save className="w-4 h-4" />
                      Save & Sync Marksheet
                    </button>
                  </div>
                )}
              </form>
            </div>
          ) : (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '64px 24px', borderStyle: 'dashed', borderWidth: '2px' }}>
              <FileSpreadsheet className="w-16 h-16 text-indigo-500/10" style={{ marginBottom: '16px', opacity: 0.2 }} />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '8px' }}>Spreadsheet Ready</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '300px' }}>
                Select the Academic Term, Class Level, Section, and Subject in the filters above to populate the student grades entry sheet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
