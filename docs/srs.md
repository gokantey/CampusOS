# Software Requirements Specification (SRS)
## Project: CampusOS (Offline-First School Management System)
**Version:** 1.0.0  
**Date:** June 8, 2026  

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for **CampusOS**, a web-based, offline-first School Management System. It outlines functional, non-functional, and interface requirements to guide development and testing.

### 1.2 Scope
CampusOS is designed to manage primary and Junior High School (JHS) operations in areas with intermittent or no internet access. The system supports:
- School structure and term management.
- Complete student enrollment and academic records.
- Teacher login, grading, and report card generation.
- Administrative billing, partial fee payments, and financial auditing.
- Flexible asset tracking.
- Seamless, bidirectional offline synchronization using browser-based IndexedDB (Dexie.js) and a centralized Django REST API.

### 1.3 Definitions, Acronyms, and Abbreviations
- **SBA**: School-Based Assessment. Continuous assessment scores gathered over the term.
- **JHS**: Junior High School.
- **PWA**: Progressive Web App.
- **IndexedDB**: A transactional database system built into modern browsers.
- **LWW**: Last-Write-Wins. A conflict resolution strategy.
- **Outbox**: A database table in IndexedDB holding pending data mutations executed offline.

---

## 2. Overall Description

### 2.1 Product Perspective
CampusOS acts as a standalone application on the local browser client but communicates with a centralized PostgreSQL database via a Django REST API when a network connection is active. 

```
                                +---------------------------+
                                |      React Frontend       |
                                |     (Local IndexDB /      |
                                |      Service Worker)      |
                                +-------------+-------------+
                                              |
                                     (API Sync / HTTPS)
                                              |
                                +-------------v-------------+
                                |      Django Backend       |
                                +-------------+-------------+
                                              |
                                +-------------v-------------+
                                |     PostgreSQL DB         |
                                +---------------------------+
```

### 2.2 Product Functions
- **System Settings**: Academic years, terms, classes, sections, and grading schemas.
- **Student Management**: Profiles, biographical details, and historical enrollments.
- **Grading & Academic Entry**: Subject definition, grading rule creation, and score spreadsheet entry (SBA/Exams).
- **Fees & Billing**: Assigning fee structures to classes, recording partial/full payments, and printing balances on receipts.
- **Inventory/Assets**: Logging and updating school items (desks, computers, etc.).
- **Synchronization**: Automatic connection detection, outbox queue replay, and local state reconciliation.

### 2.3 User Classes and Characteristics
1. **Administrators**: Full system access, configures structures, handles finances, audits inventories, and manages system settings.
2. **Teachers**: Records marks (SBA, Exams), writes remarks, inputs student attendance, and views student academic history.
3. **Staff/Inventory Personnel** (Optional): Manages asset categories, updates condition statuses, and tracks item counts.

### 2.4 Design and Implementation Constraints
- **Offline Reliability**: The app must load and operate without network connectivity after initial activation.
- **Storage Limits**: Browser IndexedDB limits vary; the database must remain optimized (avoiding bloated binary uploads offline).
- **Security**: Local cache must not store plaintext passwords. Client credentials must be verified via secure JWT and salted local PINs/hashes.

---

## 3. Specific Requirements

### 3.1 Functional Requirements

#### 3.1.1 School Structure Management
- **FR-SS-1**: The system shall support defining multiple Class Levels (e.g., Class 1 through JHS 3).
- **FR-SS-2**: The system shall support splitting classes into Sections (e.g., A, B).
- **FR-SS-3**: The system shall support managing Academic Years and Terms (e.g., Term 1, Term 2, Term 3).

#### 3.1.2 Student Profiles & Enrollment
- **FR-SP-1**: The system shall record full student biographies: Full Name, Date of Birth, Gender, Guardian Name, Guardian Contact, Admission Number.
- **FR-SP-2**: The system shall allow enrolling a student in a specific Class Level and Section for a particular Academic Year.
- **FR-SP-3**: The system shall retain historical academic records of students for past academic years.

#### 3.1.3 Grading & Teacher Portal
- **FR-GR-1**: The system shall support flexible Grading System configurations (e.g., SBA and End-of-Term Exams weight allocations). Examples:
  - 30% SBA + 70% Exams
  - 50% SBA + 50% Exams
  - 100% Exams
- **FR-GR-2**: Teachers shall be able to select a Class, Section, and Subject to access a grid-based grading matrix.
- **FR-GR-3**: The grading interface shall compute the total score and corresponding letter grade dynamically based on the configured weights.
- **FR-GR-4**: The grading interface shall autosave scores locally as they are typed.

#### 3.1.4 Fee Tracking & Admin Billing
- **FR-FN-1**: The system shall allow creating Fee Categories (e.g., Tuition, Sports, ICT) and combining them into Fee Structures for specific Class Levels.
- **FR-FN-2**: The system shall automatically compute student ledger accounts (Total Billed - Total Paid = Balance).
- **FR-FN-3**: The system shall allow recording partial or full payments.
- **FR-FN-4**: On recording a payment, the system shall generate a receipt indicating:
  - Student Name and ID
  - Date and Receipt Number
  - Amount Paid
  - Remaining Balance
- **FR-FN-5**: The system shall allow exporting fee status reports (e.g., list of students with outstanding balances).

#### 3.1.5 Asset tracking
- **FR-AS-1**: The system shall track generic assets with properties: Name, Category, Quantity, Location, Serial/Tag Number, Condition/Status, Date Acquired.
- **FR-AS-2**: Users shall be able to update the condition status of assets (e.g., Good, Broken, Needs Repair).

#### 3.1.6 Offline Synchronization
- **FR-SY-1**: The system shall store all user operations performed offline in an outbox queue inside IndexedDB.
- **FR-SY-2**: The system shall monitor network status and automatically push the outbox contents to the server when connection is restored.
- **FR-SY-3**: Sync operations must be executed sequentially to maintain write ordering.
- **FR-SY-4**: When pulling down updates, the system shall fetch incremental modifications using a `last_sync` timestamp.

---

## 4. Non-Functional Requirements

### 4.1 Performance & Latency
- Local UI responses (adding grades, loading student files) must occur in < 100ms since data is read from local IndexedDB.
- Network synchronization must complete background updates in batches to prevent UI blocks.

### 4.2 Reliability & Transaction Safety
- The system must use transactions for IndexedDB operations to prevent database corruption.
- Server-side APIs must validate inputs and handle potential concurrent edits using optimistic lock checking or Last-Write-Wins timestamps.

### 4.3 Security
- **Local Storage**: PII (Personally Identifiable Information) stored locally must be secure. Plaintext session passwords are prohibited.
- **Role-Based Access Control**: API endpoints must restrict actions based on roles (e.g., Teachers cannot post fee payments; Admins cannot override class grades unless permitted).

### 4.4 Availability & Offline Capability
- The system must function entirely offline (offline data entry, page navigation, report generation) using PWA assets cached via Service Workers.
