# Teacher Module Documentation

## 1. Overview
The Teacher Module provides limited, secure access tailored exclusively to teaching staff, avoiding unnecessary visibility into the wider institution. It grants capabilities to view rosters, history, and analytics strictly tied to the teacher’s designated Class and Section assignments.

## 2. Teacher Routing Inventory
| Feature | Frontend Page (`frontend/src/pages/teacher/`) | Backend Route | Required Role | Limit |
|---|---|---|---|---|
| Dashboard | TeacherDashboardPage | `/api/attendance/teacher/report` (metrics snippet) | TEACHER | Authorized scope only |
| Attendance Entry (Roster) | TeacherAttendancePage | `/api/attendance/roster` & `/api/attendance/bulk` | TEACHER | Authorized scope only |
| Attendance History | TeacherAttendanceHistoryPage | `/api/attendance/teacher/history` | TEACHER | Paginated |
| Attendance Report | TeacherAttendanceReportPage | `/api/attendance/teacher/report` | TEACHER | Filtered |

## 3. Teacher API Documentation
- **Roster:** `GET /api/attendance/roster`
  - Fetches the active students mapped to the Teacher's exact `class` and `section` mapping. Validated internally.
- **Bulk Entry:** `POST /api/attendance/bulk`
  - Leverages MongoDB atomic `insertMany` limits. Ensures no parallel overrides of existing dual-date attendance items can succeed.
- **Single Update:** `PATCH /api/attendance/teacher/:id`
  - Verifies the requested modification bounds within the instructor's boundaries.
- **History Logs:** `GET /api/attendance/teacher/history`
  - Safe paginated querying limited from 1 to 100 rows. Filters for date constraints and specific student identifiers are strictly escaped securing against NoSQL operators.
- **Report & Analytics:** `GET /api/attendance/teacher/report`
  - Evaluates aggregated structures strictly returning values filtered safely against NaN arithmetic logic when rosters or views are completely empty.

## 4. Teacher Role Matrix
| Feature | ADMIN | TEACHER | STUDENT | UNAUTHENTICATED |
|---|---|---|---|---|
| Teacher Attendance | Existing behavior | YES | NO (403) | NO (401) |
| Teacher History | Existing behavior | YES | NO (403) | NO (401) |
| Teacher Report | Existing behavior | YES | NO (403) | NO (401) |
| Teacher Bulk Attendance | Existing behavior | YES | NO (403) | NO (401) |

## 5. Security Implementations Overview
1.  **RBAC Enforced Serverside:** Middlewares restrict execution specifically targeting `authorizeRoles([ROLES.TEACHER])` explicitly preventing arbitrary ID fetch logic from returning parallel scopes.
2.  **NoSQL Injection Limits:** Variables like `search` strictly replace regex injections natively mapping input text uniformly.
3.  **Data Isolation Boundaries:** Using the identity derived purely off of JWT parameters `req.user.id`, the server inherently binds subsequent relational searches avoiding external body modifications scaling permissions incorrectly.

## 6. Data Model Synchronicity 
Database relationships structurally link elements safely ensuring no PII flows outbound unless intended:

```
User (Role: TEACHER)
  | 
  |----> Teacher (Fields: assignedClass, assignedSection)
           |
           |----> Student (Filtered by matching class/section bounds)
           |
           |----> Attendance (Inserted strictly mapping teacher's subset)
```

## 7. Known External Limitations
- Profile edits are restricted globally to just Password modifications preserving institutional constraints. 
- All date mapping is bounded to native client localized logic natively avoiding excessive arbitrary bounds offsets.

_All dependencies successfully operate without exposing structural API signatures._
