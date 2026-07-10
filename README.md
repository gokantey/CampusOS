# CampusOS: Offline-First School Management System

CampusOS is a web-based, offline-first School Management System designed to manage school structures, student registries, grades, finance ledger billings, and asset inventory in environments with unstable or no internet access. 

The application utilizes local browser caching (IndexedDB) to operate 100% offline, capturing all data mutations in an outbox queue that automatically synchronizes with a centralized **PostgreSQL** database via a **Django REST API** once an online connection is established.

---

## 🚀 Key Features

* **Offline Capabilities**: Run and load the application without internet connectivity.
* **Hashed Offline Authentication**: Secure offline login comparing SHA-256 salted hashes against locally cached credentials.
* **School Setup**: Configure academic years, terms, classes, sections, and subjects.
* **Student Registry**: Manage bio-data profiles and school enrollments.
* **Teacher Grades Entry**: Spreadsheet interface with dynamic letter grading calculated automatically from continuous assessment (SBA/Exam) weight splits.
* **Financial Ledger Billing**: Capture payments, calculate balances, and print receipt slips showing remaining outstanding balances.
* **Asset Tracking**: Record inventory counts, locations, and condition statuses (Good, Needs Repair, Damaged).
* **Automatic Re-syncing**: Sequences and replays offline outbox mutations to the PostgreSQL server when online, pulling incremental updates using server timestamps.

---

## 🛠️ Technology Stack

* **Backend**: Django REST Framework, PostgreSQL (with SQLite development fallback).
* **Frontend**: React (Vite SPA/PWA), Dexie.js (ACID-compliant IndexedDB library), TailwindCSS/Vanilla CSS.
* **Service Workers**: Workbox caching via `vite-plugin-pwa`.

---

## 📁 Directory Structure

```text
CampusOS/
├── docs/                    # Architectural design & SRS docs
├── backend/                 # Django REST API Backend
│   ├── campus_os_backend/   # Project settings & root routing
│   ├── campus_core/         # School structure & subjects
│   ├── campus_users/        # Custom Auth User & login views
│   ├── campus_students/     # Profiles, enrollments, and academic records
│   ├── campus_finance/      # Billing structures & payment receipts
│   ├── campus_assets/       # School assets inventory
│   ├── campus_sync/         # Push/Pull reconciliation views & unit tests
│   └── manage.py
└── frontend/                # React Vite PWA Frontend
    ├── src/
    │   ├── components/      # Navigation Shell & Layouts
    │   ├── db/              # Dexie.js Schema & local CRUD helpers
    │   ├── services/        # Fetch API wrapper & Client Sync Manager
    │   └── pages/           # Dashboard, Students, Grades, Finance, Assets
    └── vite.config.js
```

---

## ⚙️ Quick Start

### Default Administrator Credentials
- **Username**: `admin`
- **Password**: `admin123`

---

### 1. Backend Setup (Django)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   * **PowerShell**: `.\.venv\Scripts\Activate`
   * **Bash (Git Bash)**: `source .venv/Scripts/activate`
3. Configure the `.env` file with your PostgreSQL database credentials (if empty or commented out, it automatically falls back to a local SQLite database for development).
4. Run migrations to build the database schema:
   ```bash
   python manage.py migrate
   ```
5. Start the development server:
   ```bash
   python manage.py runserver
   ```
   *The API server will run at: `http://localhost:8000/`*

---

### 2. Frontend Setup (React PWA)

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install Node modules:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The React UI client will run at: `http://localhost:5173/`*

---

## 🔄 Verification & Unit Testing

To verify the synchronization replication conflict checkers, navigate to the `backend/` folder and run the Django tests suite:
```bash
python manage.py test campus_sync.tests
```
