# Database Schema & API Sync Protocol Design
**Version:** 1.0.0  
**Date:** June 8, 2026  

---

## 1. System Database Architecture

CampusOS employs a dual-database design to support offline operations:
- **Server DB (PostgreSQL)**: The single source of truth.
- **Client DB (IndexedDB via Dexie.js)**: A local replica of required records, including an `outbox` table to record mutation queue.

```
+------------------------------------+             +------------------------------------+
|        Dexie.js (IndexedDB)        |             |       PostgreSQL (Django DB)       |
+------------------------------------+             +------------------------------------+
| - users                            |             | - auth_user (Custom User)          |
| - schools                          |             | - core_school                      |
| - academic_years                   |             | - core_academic_year               |
| - academic_terms                   |   SYNC      | - core_academic_term               |
| - class_levels                     |<----------->| - core_class_level                 |
| - sections                         |  PUSH/PULL  | - core_section                     |
| - students                         |             | - students_student                 |
| - enrollments                      |             | - students_enrollment              |
| - academic_records                 |             | - grades_academic_record           |
| - finance_fee_categories           |             | - finance_fee_category             |
| - finance_fee_structures           |             | - finance_fee_structure            |
| - finance_receipts                 |             | - finance_payment_receipt          |
| - assets                           |             | - assets_asset                     |
| - outbox                           |             | - sync_log                         |
+------------------------------------+             +------------------------------------+
```

---

## 2. Entity Specifications

All tables share standard metadata fields for synchronization:
- `id`: UUID (Primary Key, generated client-side for offline creation).
- `created_at`: DateTime.
- `updated_at`: DateTime.
- `is_deleted`: Boolean (soft delete support to sync deletions).

### 2.1 Core App (School Structure)

#### `School`
- `id`: UUID
- `name`: VarChar(150)
- `address`: Text
- `phone`: VarChar(30)

#### `AcademicYear`
- `id`: UUID
- `display_name`: VarChar(20) (e.g., "2025/2026")
- `start_date`: Date
- `end_date`: Date
- `is_current`: Boolean

#### `AcademicTerm`
- `id`: UUID
- `academic_year_id`: FK -> `AcademicYear`
- `name`: VarChar(50) (e.g., "Term 1", "Term 2")
- `start_date`: Date
- `end_date`: Date
- `is_current`: Boolean

#### `ClassLevel`
- `id`: UUID
- `name`: VarChar(50) (e.g., "Class 1", "JHS 1")
- `order_index`: Integer (for logical sorting)

#### `Section`
- `id`: UUID
- `class_level_id`: FK -> `ClassLevel`
- `name`: VarChar(10) (e.g., "A", "B", "Gold")

#### `Subject`
- `id`: UUID
- `name`: VarChar(100) (e.g., "Mathematics", "Integrated Science")
- `code`: VarChar(20)

#### `GradingSystem` (Grading Configuration Rules)
- `id`: UUID
- `class_level_id`: FK -> `ClassLevel` (or null if school-wide default)
- `sba_weight`: Decimal (e.g., 0.40 for 40%)
- `exam_weight`: Decimal (e.g., 0.60 for 60%)

---

### 2.2 Users & Permissions

#### `User` (Custom Django Auth User)
- `id`: UUID
- `email`: VarChar(254) (Unique)
- `full_name`: VarChar(150)
- `role`: VarChar(20) (e.g., `ADMIN`, `TEACHER`, `INVENTORY`)
- `is_active`: Boolean
- `is_staff`: Boolean

#### `TeacherClassMapping`
- `id`: UUID
- `teacher_id`: FK -> `User`
- `class_level_id`: FK -> `ClassLevel`
- `section_id`: FK -> `Section`
- `subject_id`: FK -> `Subject`

---

### 2.3 Students & Grading

#### `Student`
- `id`: UUID
- `admission_number`: VarChar(50) (Unique)
- `first_name`: VarChar(100)
- `last_name`: VarChar(100)
- `date_of_birth`: Date
- `gender`: VarChar(10)
- `guardian_name`: VarChar(150)
- `guardian_contact`: VarChar(30)

#### `Enrollment`
- `id`: UUID
- `student_id`: FK -> `Student`
- `academic_year_id`: FK -> `AcademicYear`
- `class_level_id`: FK -> `ClassLevel`
- `section_id`: FK -> `Section`

#### `AcademicRecord` (Termly Marks)
- `id`: UUID
- `student_id`: FK -> `Student`
- `term_id`: FK -> `AcademicTerm`
- `subject_id`: FK -> `Subject`
- `sba_score`: Decimal (Raw class score out of 100 or specific max)
- `exam_score`: Decimal (Raw exam score out of 100 or specific max)
- `final_score`: Decimal (Weighted score calculated client-side and verified server-side)
- `grade_letter`: VarChar(2) (Computed grade, e.g. "A1", "B2", "C4", "E8", "F9")
- `remarks`: Text
- `recorded_by`: FK -> `User` (Teacher)

---

### 2.4 Finance App (Billing & Ledgers)

#### `FeeCategory`
- `id`: UUID
- `name`: VarChar(100) (e.g., "Tuition Fee", "Library Levy", "Sports Fee")

#### `FeeStructure` (Standard Bill Set)
- `id`: UUID
- `class_level_id`: FK -> `ClassLevel`
- `term_id`: FK -> `AcademicTerm`
- `category_id`: FK -> `FeeCategory`
- `amount`: Decimal

#### `StudentAccount` (Derived Balance Sheet)
- `student_id`: FK -> `Student` (Primary Key)
- `total_billed`: Decimal
- `total_paid`: Decimal
- `balance`: Decimal (Computed: Billed - Paid)

#### `PaymentReceipt`
- `id`: UUID
- `student_id`: FK -> `Student`
- `receipt_number`: VarChar(50) (Unique)
- `amount_paid`: Decimal
- `balance_remaining`: Decimal (Snapshot of student's outstanding balance after this payment)
- `payment_date`: Date
- `payment_mode`: VarChar(30) (e.g., "Cash", "Mobile Money", "Bank Draft")
- `recorded_by`: FK -> `User` (Admin)

---

### 2.5 Assets App (Inventory)

#### `Asset`
- `id`: UUID
- `name`: VarChar(150)
- `category`: VarChar(100) (e.g., "Furniture", "ICT Equipment", "Textbooks")
- `description`: Text
- `quantity`: Integer
- `location`: VarChar(150) (e.g., "Science Lab", "Classroom 4A")
- `serial_number`: VarChar(100) (Null if bulk inventory)
- `condition`: VarChar(30) (e.g., "Good", "Needs Repair", "Damaged")
- `date_acquired`: Date

---

### 2.6 Sync Queue Table (Client Only)

#### `Outbox`
- `id`: Integer (Auto-Increment)
- `table_name`: VarChar(50) (e.g., "students")
- `action`: VarChar(10) (e.g., "CREATE", "UPDATE", "DELETE")
- `record_id`: UUID
- `data`: Text (JSON string containing the serialized record payload)
- `timestamp`: DateTime

---

## 3. Synchronization API Payloads

### 3.1 PUSH Sync Endpoint: `/api/sync/push/`
The client submits the list of mutations queued in the IndexedDB `outbox`.

**HTTP Method**: `POST`  
**Request Body**:
```json
{
  "mutations": [
    {
      "table": "students",
      "action": "CREATE",
      "record_id": "8f8ed391-4bc3-46cd-b53e-7e5af859dbef",
      "data": {
        "id": "8f8ed391-4bc3-46cd-b53e-7e5af859dbef",
        "admission_number": "STUD-2026-0045",
        "first_name": "Kofi",
        "last_name": "Mensah",
        "date_of_birth": "2015-04-12",
        "gender": "Male",
        "guardian_name": "Ama Mensah",
        "guardian_contact": "+233240000000",
        "updated_at": "2026-06-08T15:40:00Z"
      }
    },
    {
      "table": "academic_records",
      "action": "UPDATE",
      "record_id": "cc07a4a9-de8c-4573-bf08-16c8f4208a0d",
      "data": {
        "id": "cc07a4a9-de8c-4573-bf08-16c8f4208a0d",
        "sba_score": 28.5,
        "exam_score": 62.0,
        "final_score": 90.5,
        "grade_letter": "A1",
        "updated_at": "2026-06-08T15:41:00Z"
      }
    }
  ]
}
```

**Response Body**:
```json
{
  "status": "success",
  "processed": 2,
  "results": [
    {
      "record_id": "8f8ed391-4bc3-46cd-b53e-7e5af859dbef",
      "status": "applied",
      "updated_at": "2026-06-08T15:42:01.234Z"
    },
    {
      "record_id": "cc07a4a9-de8c-4573-bf08-16c8f4208a0d",
      "status": "applied",
      "updated_at": "2026-06-08T15:42:01.352Z"
    }
  ]
}
```

---

### 3.2 PULL Sync Endpoint: `/api/sync/pull/`
The client requests all data modified since its last sync execution timestamp.

**HTTP Method**: `GET`  
**Parameters**: `?last_sync=2026-06-08T14:00:00Z`  
**Response Body**:
```json
{
  "server_timestamp": "2026-06-08T15:42:15.892Z",
  "changes": {
    "schools": [],
    "academic_years": [],
    "academic_terms": [],
    "class_levels": [],
    "sections": [],
    "students": [],
    "enrollments": [],
    "academic_records": [
      {
        "id": "cc07a4a9-de8c-4573-bf08-16c8f4208a0d",
        "student_id": "8f8ed391-4bc3-46cd-b53e-7e5af859dbef",
        "term_id": "11111111-2222-3333-4444-555555555555",
        "subject_id": "22222222-3333-4444-5555-666666666666",
        "sba_score": 28.5,
        "exam_score": 62.0,
        "final_score": 90.5,
        "grade_letter": "A1",
        "remarks": "Excellent performance",
        "is_deleted": false,
        "updated_at": "2026-06-08T15:42:01.352Z"
      }
    ],
    "assets": []
  }
}
```
If a record has `is_deleted = true`, the client frontend deletes it from IndexedDB. Otherwise, it upserts the record.
