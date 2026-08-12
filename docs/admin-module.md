# Admin Module Documentation

## 1. Overview
The Admin Module provides institutional control over all operational entities: Students, Teachers, and Attendance. It enforces strict RBAC, data integrity validation, and secure export/import processes. 

## 2. Admin Routing Inventory
| Feature | Frontend Page (`frontend/src/pages/admin/`) | Backend Route | Controller | Service | Required Role | Limit |
|---|---|---|---|---|---|---|
| Dashboard | AdminDashboardPage | `/api/admin` | N/A | N/A | ADMIN | None |
| Students List | StudentManagementPage | `/api/students` | `getStudents` | `getStudentsList` | ADMIN | Paginated |
| Teachers List | TeacherManagementPage | `/api/teachers` | `getTeachers` | `getTeachersList` | ADMIN | Paginated |
| Attendance Overview | AttendanceManagementPage | `/api/attendance` | `getAttendances` | `getAttendancesList` | ADMIN | Paginated |
| Attendance Report | AttendanceReportPage | `/api/attendance/admin/report` | `getAdminAttendanceReport` | `getAdminAttendanceReport` | ADMIN | Filtered |
| Attendance Analytics | AttendanceAnalyticsPage | `/api/attendance/admin/analytics` | `getAdminAttendanceAnalytics` | `getAdminAttendanceAnalytics` | ADMIN | Filtered |
| Attendance Audit | AttendanceAuditPage | `/api/attendance/admin/audit` | `getAttendanceAuditLogs` | `getAttendanceAuditLogs` | ADMIN | Paginated |

## 3. Student API Documentation
- **List:** `GET /api/students` (Admin Auth) - Supports `search`, `class`, `section`, `status`, `page`, `limit`.
- **Search & Filters:** User inputs safely escaped using replacing logic preventing ReDoS arrays against $regex expressions.
- **Details:** `GET /api/students/:id`
- **Create:** `POST /api/students`
- **Edit:** `PUT /api/students/:id` - Enforces Immutable schema (cannot set `studentId`, `admissionNumber` etc.)
- **Single Status Updates:** 
  - `PATCH /api/students/:id/activate`
  - `PATCH /api/students/:id/deactivate`
- **Bulk Operations:** Atomic transaction wrappers used to securely update counts safely protecting memory limits.
  - `PATCH /api/students/bulk/activate`
  - `PATCH /api/students/bulk/deactivate`
- **Import Students:** `POST /api/students/admin/import`
  - Requires: `multipart/form-data`, `.csv` extension, enforced sizing limits up to internal `req` threshold.
  - Transactions securely fall back to serial queries without replica sets. Errors safely bubble up row indications.
- **Export Students:** `GET /api/students/admin/export`
  - Returns `text/csv` escaping literal formula fields (`+`, `=`, `@`, `-`). Fully ignores pagination constraints.

## 4. Teacher API Documentation
- **List:** `GET /api/teachers` (Admin Auth)
- **Details:** `GET /api/teachers/:id`
- **Create:** `POST /api/teachers`
- **Edit:** `PUT /api/teachers/:id` - Cannot modify immutable user credentials.
- **Single Status Updates:**
  - `PATCH /api/teachers/:id/activate`
  - `PATCH /api/teachers/:id/deactivate`

## 5. Attendance API Documentation
- **Admin Specific Records CRUD:** 
  - `GET /api/attendance/admin/records`
  - `GET /api/attendance/admin/records/:id`
  - `PATCH /api/attendance/admin/records/:id`
  - `DELETE /api/attendance/admin/records/:id`
- **Report & Analytics:** `GET /api/attendance/admin/report` & `GET /api/attendance/admin/analytics` -> Safely enforces bounds to numeric returns stopping arithmetic NaN calculations and Zero-division.
- **Export:** `GET /api/attendance/admin/export`
- **Audit Logs:** `GET /api/attendance/admin/audit` -> Fully immutable; reads only.

## 6. Admin Role Matrix
| Feature | ADMIN | TEACHER | STUDENT | UNAUTHENICATED |
|---|---|---|---|---|
| Admin Dashboard | YES | NO (403) | NO (403) | NO (401) |
| Manage Profiles | YES | NO (403) | NO (403) | NO (401) |
| Admin Attendance | YES | NO (403) | NO (403) | NO (401) |
| Export / Import | YES | NO (403) | NO (403) | NO (401) |

## 7. Security Implementations Overview
1.  **RBAC Enforced Serverside:** Middleware exclusively executes `authorizeRoles([ROLES.ADMIN])` for critical pipelines.
2.  **ID Validation:** Inputs parsed internally forcing `ObjectId.isValid()` constraints where appropriate preventing malformed `500` timeouts.
3.  **NoSQL ReDoS Escape:** `studentService` protects all wildcard searches: `safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.
4.  **Transaction Blocks:** Handled using `mongoose.startSession()` and falling back carefully to procedural loop without locking database states.
5.  **Sensitive Projections:** `.populate('user', 'loginId isActive')` shields password hashes completely across network surfaces.
6.  **Formula Hijack Safe Constraints:** Strings evaluated on exports (`strVal = "'" + strVal;`) securing spreadsheet clients.

## 8. Data Model Synchronicity 
Database relationships structurally link elements universally:

```
User
  | 
  |----> Student -> { status: "ACTIVE" } -> user: { isActive: true } 
  |
  |----> Teacher
 
Attendance  -> Student (Ref)
AttendanceAudit -> performedBy (Ref Users)
```
Status toggles strictly align database records synchronously between Users & Students ensuring Auth layers disable properly.

## 9. Error Mapping Guide
Responses wrap securely without stack-traces or pipeline variables exposed:
- **401**: Missing/Expired Token Payload
- **403**: Invalid Access Context Permissions
- **404**: Identity Null Mapping
- **409**: Database Constraint Clash
- **500**: Generic Application Safe-Stop

## 10. External Validations
No outstanding known limitations reside inside the Admin structure constraints. Tested completely scalable under bulk loads matching current memory/pipeline limits.

_All dependencies successfully operate without experimental injections._
