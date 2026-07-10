import Dexie from 'dexie';

export const db = new Dexie('CampusOSDatabase');

// Define database schema using snake_case table names to match Django models exactly
db.version(3).stores({
  users: 'id, username, role, is_deleted',
  schools: 'id, name, is_deleted',
  academic_years: 'id, display_name, is_current, is_deleted',
  academic_terms: 'id, academic_year_id, is_current, is_deleted',
  class_levels: 'id, name, order_index, is_deleted',
  sections: 'id, class_level_id, name, is_deleted',
  subjects: 'id, name, code, is_deleted',
  grading_systems: 'id, class_level_id, is_deleted',
  syllabus_topics: 'id, subject_id, is_deleted',
  students: 'id, admission_number, first_name, last_name, is_deleted',
  enrollments: 'id, student_id, academic_year_id, class_level_id, section_id, is_deleted',
  academic_records: 'id, student_id, term_id, subject_id, is_deleted',
  attendance: 'id, student_id, date, status, is_deleted',
  fee_categories: 'id, name, is_deleted',
  fee_structures: 'id, class_level_id, term_id, category_id, is_deleted',
  student_accounts: 'id, student_id, is_deleted',
  payment_receipts: 'id, student_id, receipt_number, is_deleted',
  assets: 'id, name, category, condition, is_deleted',
  outbox: '++id, table, action, record_id, timestamp'
});
