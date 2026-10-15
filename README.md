# School ERP

Production-oriented School ERP foundation. Built module by module — this release includes only the project scaffold, Express API shell, and React frontend shell.

## Tech stack

**Frontend**
- React.js (Vite)
- JavaScript
- React Router
- Axios
- Tailwind CSS

**Backend**
- Node.js / Express.js
- MongoDB / Mongoose
- dotenv, cors, helmet, morgan

## Folder structure

```
school-erp/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
├── README.md
└── .gitignore
```

## Installation

From the `school-erp` directory:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Environment setup

1. Copy the backend example env file:

```bash
cd backend
cp .env.example .env
```

On Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

2. Update values in `backend/.env` as needed:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/school-erp
CLIENT_URL=http://localhost:5173
NODE_ENV=development
JWT_SECRET=change_this_to_a_long_random_secret_at_least_32_chars
JWT_EXPIRES_IN=1d
ADMIN_PASSWORD=AdminPass123
```

- Never commit `.env`
- Do not hardcode credentials in source files
- Ensure MongoDB is running locally (or point `MONGODB_URI` to your instance)
- `JWT_SECRET` must be at least 32 characters
- `ADMIN_PASSWORD` is used only by `npm run seed:admin`

Optional frontend override (create `frontend/.env` if needed):

```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Run the backend

```bash
cd backend
npm run dev
```

Server starts on `http://localhost:5000` (or the configured `PORT`).

## Run the frontend

```bash
cd frontend
npm run dev
```

App starts on `http://localhost:5173`.

## Health API endpoint

```
GET /api/health
```

Example response:

```json
{
  "success": true,
  "message": "School ERP API is running"
}
```

## Dockerization

You can run the entire application stack (Frontend, Backend, and MongoDB) using Docker Compose.

### Prerequisites

Ensure you have [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.

### Steps to Run

1. Open your terminal at the root of the project (`school-erp`).
2. Build and start the containers in detached mode:

```bash
docker-compose up --build -d
```

3. Your services will now be accessible at:
   - **Frontend**: http://localhost:5173
   - **Backend**: http://localhost:5000
   - **MongoDB**: exposed on localhost:27017

4. To stop the containers, use:

```bash
docker-compose down
```

## Current scope

Implemented modules: authentication & RBAC, students (incl. CSV import/export), teachers, parents, attendance (teacher marking, admin reports/analytics/audit), subjects, examinations & results, timetable, notices, messaging, homework, leave, library, fees, transport and role dashboards for Admin, Teacher, Student and Parent.

Additional modules (all backed by MongoDB collections and real API endpoints):

| Module | Frontend route | Who |
|--------|----------------|-----|
| Admissions: enquiries, follow-ups, applications, document verification, approval, enrollment into a student record | `/admin/admissions` | ADMIN |
| Academic setup: academic years and terms, classes and sections (capacity, class teacher), promotion, graduation, transfer and withdrawal | `/admin/academic` | ADMIN |
| Staff accounts (accountant, librarian) | `/admin/staff` | ADMIN |
| Staff attendance (daily marking, monthly summary) | `/admin/staff-attendance`, `/my-attendance` | ADMIN marks; staff see their own records |
| Hostel: rooms, beds, allocations, occupancy report | `/admin/hostel` | ADMIN (students and parents see their allocation on the profile) |
| Inventory and assets: items, stock received and issued, stock-take, low-stock alerts, ledger | `/admin/inventory` | ADMIN |
| Reports: strength, attendance and low attendance, exam performance, fees, admissions, staff, with CSV export and print | `/admin/reports` | ADMIN |
| Settings (school profile, library, attendance and fee policies) and the audit log | `/admin/settings` | ADMIN |
| Events and school calendar | `/events` | ADMIN manages; other roles see published events for their audience |
| In-app notifications (bell and notification centre) | `/notifications` | All |
| Exam analytics and printable report cards (grade, rank, attendance) | `/admin/examinations/:id/analytics`, `/teacher/examinations/:id/analytics`, `/report-card/:examId/:studentId` | Admin; teacher for their own class; student and parent only for published exams |
| Fees: payment method and reference, receipt numbers, printable receipts, concessions (admin approval), automatic overdue status, collections and dues summary | `/fees` | ADMIN, ACCOUNTANT |
| Library: borrowing limit, late-return fines from settings, fine settlement or waiver, report | `/library` | ADMIN, LIBRARIAN |
| Homework submissions (text and/or link), late flag, grading and feedback, class completion tracking | `/homework` | Students submit, teachers grade, parents view |

Roles: `ADMIN`, `TEACHER`, `STUDENT`, `PARENT`, `ACCOUNTANT` (fees only) and `LIBRARIAN` (library only). Every permission is enforced by the API and not only by hiding menu items.

Not included, because they need external services or credentials:

- Online fee payment. Payments are recorded by staff; no gateway is integrated and no card data is stored.
- Email, SMS, WhatsApp and push notifications. Only in-app notifications are implemented; adding them needs a provider such as SMTP, Twilio or FCM, plus credentials.
- Live GPS tracking for transport.
- File storage for uploads. Homework attachments are submitted as http(s) links.

The original foundation included:

- Express app with CORS, Helmet, Morgan, JSON parsing
- MongoDB connection via Mongoose
- Centralized error handling and 404 middleware
- React app layout, Home page, 404 page
- Reusable Button and Card components
- Central Axios client
- **Module 2:** JWT authentication, role-based access (ADMIN / TEACHER / STUDENT / PARENT), login ID generation, password change, protected frontend routes


## Authentication (Module 2)

### Seed the initial admin

```bash
cd backend
# Ensure ADMIN_PASSWORD is set in .env (never commit real passwords)
npm run seed:admin
```

The seed prints the generated login ID (for example `ADM2026000001`) and never prints the password.

### Auth API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Login with loginId + password |
| GET | `/api/auth/me` | Bearer JWT | Current user (safe fields) |
| POST | `/api/auth/change-password` | Bearer JWT | Change password |
| POST | `/api/auth/logout` | Bearer JWT | Client-side token discard acknowledgement |

### Password policy

- Minimum 8 characters
- At least one letter and one number
- Reject empty / whitespace-only passwords

### JWT strategy

Access-token-only (stateless). Tokens are stored in the browser and sent as `Authorization: Bearer <token>`. Logout clears the client token; already-issued tokens remain valid until expiry. Refresh tokens are not used in Module 2.

## Parent accounts

Parents are created by an administrator from **Admin → Parent Portal** (`/admin/parents`). Each parent gets a `PAR…` login ID and a one-time temporary password, and is linked to one or more students. Parents only ever see data for their linked students.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/parents` | ADMIN | List/search parent accounts |
| POST | `/api/parents` | ADMIN | Create parent (`firstName`, `lastName`, `phone`, `email?`, `studentIds[]`) |
| GET/PUT | `/api/parents/:id` | ADMIN | View / update parent and linked students |
| PATCH | `/api/parents/:id/activate` \| `deactivate` | ADMIN | Enable / disable the parent login |

## Other API additions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/messages/contacts` | Any | People the current user may message |
| GET | `/api/teacher/exams/subjects` | TEACHER | Subjects for marks entry |
| GET | `/api/teacher/exams/:id/students` | TEACHER | Own class roster for an exam |
| GET | `/api/teacher/exams/:id/results` | TEACHER | Results of own students for an exam |
| GET | `/api/student/exams` | STUDENT | Exam schedule for the student's class |
| PATCH | `/api/fees/records/:id/pay` | ADMIN, ACCOUNTANT | Record a payment `{ paymentAmount, method, reference, note }` (POST is still accepted). Returns the record with a `RCPT-YYYY-NNNNNN` receipt |
| PATCH | `/api/fees/records/:id/discount` | ADMIN | Approve a concession `{ discount, reason }` |
| GET | `/api/fees/records/:id/receipts/:receiptNumber` | Record owner / finance | Receipt data |
| GET | `/api/fees/summary` | ADMIN, ACCOUNTANT | Collections and outstanding dues |
| GET/POST/PUT/PATCH/DELETE | `/api/academic-years`, `/api/class-sections` | ADMIN (read: any) | Academic configuration |
| GET/PUT | `/api/settings` | ADMIN (read: any) | School profile and policies |
| GET | `/api/audit-logs` | ADMIN | Administrative change log |
| GET/POST/PUT/PATCH | `/api/staff` | ADMIN | Accountant and librarian accounts |
| GET/POST | `/api/staff-attendance/roster`, `/api/staff-attendance`, `/summary`, `/me` | ADMIN; `/me` for staff | Staff attendance |
| GET/PATCH | `/api/notifications`, `/:id/read`, `/read-all` | Any | Own notifications |
| * | `/api/admissions/enquiries…`, `/api/admissions/applications…` | ADMIN | Admissions workflow (`POST /applications/:id/enroll` creates the student) |
| * | `/api/hostel/rooms…`, `/api/hostel/allocations…`, `/api/hostel/report`, `/api/hostel/my` | ADMIN; `/my` for students and parents | Hostel |
| * | `/api/inventory/items…`, `/api/inventory/transactions` | ADMIN | Inventory |
| GET | `/api/reports/overview?startDate&endDate` | ADMIN | School-wide report data |
| GET | `/api/exam-analytics/:examId` | ADMIN, TEACHER (own class) | Exam analytics |
| GET | `/api/report-cards/:examId/:studentId` | Role-scoped | Report card data |
| POST | `/api/students/promote`, PATCH `/api/students/:id/status` | ADMIN | Promotion and graduation, lifecycle status |
| GET/POST | `/api/homework/:id/submissions`, `/api/homework/:id/my-submission`, PATCH `/api/homework/submissions/:id/grade` | Role-scoped | Homework submissions |
| PATCH | `/api/library/issues/:id/fine`, GET `/api/library/report` | ADMIN, LIBRARIAN | Fines and library report |

Students and parents only see marks for exams whose status is **PUBLISHED**.

## MongoDB transactions

Account creation, CSV import and library issue/return use multi-document transactions **when the database is a replica set**. On a standalone `mongod` (the default local and docker-compose setup) the same operations run without a transaction and clean up after themselves on failure, so no extra MongoDB configuration is required.

## Tests

```bash
cd backend
npm test            # model/auth tests (needs MONGODB_URI)
```

### End-to-end API tests

`npm run test:e2e` exercises every module through the HTTP API (auth, RBAC, CRUD, scoping between roles, dashboards). It **creates data**, so run it only against an empty test database:

```bash
# terminal 1 – API pointed at a throwaway database
MONGODB_URI=mongodb://localhost:27017/school-erp-e2e npm run seed:admin
MONGODB_URI=mongodb://localhost:27017/school-erp-e2e npm run dev

# terminal 2
E2E_CONFIRM_EMPTY_TEST_DB=yes E2E_API_URL=http://localhost:5000/api ADMIN_PASSWORD=<seeded admin password> npm run test:e2e
```

## Security notes

- Login attempts are rate limited per IP + login ID and only failed attempts count (a whole school behind one NAT address is not locked out).
- Request bodies, query strings and params are stripped of MongoDB operator keys (`$…`) before reaching any handler.
- In production the server refuses to start with the example `JWT_SECRET`. Override `JWT_SECRET` / `ADMIN_PASSWORD` for docker-compose via your shell or a root `.env` file.
