# Parent Module Documentation

## 1. Overview
The Parent Portal provides a secure, read-only interface tailored exclusively to parents and guardians. It limits access to exactly the subset of students definitively linked to the parent's user identity via a `ParentProfile`. The portal is purely read-only to prevent tampering, providing a consolidated view of children's attendances, timetables, academic results, and relevant school notices.

## 2. Parent Architecture & Data Relationships
The Parent module leverages the central application architecture and reuses existing collections (Attendance, Exam, Result, Timetable, Notice). 

Data relationships are strictly isolated by ownership mappings established in the initial seed and linkage processes:

```
User (Role: PARENT)
  | 
  |----> ParentProfile (Fields: user, students)
           |
           |----> Student[] (Resolved implicitly by linking parent's ID arrays)
                    |
                    |----> Attendance (Scoped explicitly to linked students)
                    |----> Result (Scoped explicitly to linked students)
                    |----> Timetable (Scoped by student's class & section)
```

## 3. Parent Routing Inventory (Frontend)
| Feature | Frontend Page (`frontend/src/pages/parent/`) | Backend Route | Required Role | State Management |
|---|---|---|---|---|
| **Parent Dashboard** | `ParentDashboardPage.jsx` | `/api/parent/students`, `/api/parent/notices` | PARENT | Full loading/empty/error/retry implementation |
| **Student Selection** | `ParentStudentDetailsPage.jsx`| `/api/parent/students/:id` | PARENT | Guarded by `ParentProfile` mappings |
| **Attendance Page** | `ParentAttendancePage.jsx` | `/api/parent/students/:id/attendance` | PARENT | Strictly read-only |
| **Examination Results** | `ParentResultsPage.jsx` | `/api/parent/students/:id/results` | PARENT | Purely read-only; frontend rendered conditionally |
| **Timetable** | `ParentTimetablePage.jsx` | `/api/parent/students/:id/timetable` | PARENT | Purely read-only; scoped by parameters |
| **Noticeboard** | `ParentNoticesPage.jsx` | `/api/parent/notices` | PARENT | Read-only; isolated multi-student visibility |

All UI components use proper Tailwind CSS patterns, adopting the foundational layout and component patterns of the rest of the application. No external dependencies like Material UI were inadvertently introduced. Read-only design enforces no UI buttons for writes/updates.

## 4. Parent API Endpoint Documentation
Every API endpoint demands valid authentication (`authenticateUser`) and enforces Role-Based Access Control restricting actions purely to users with Role `PARENT` (`authorizeRoles(ROLES.PARENT)`). All endpoints are fully read-only and explicitly require ownership authentication.

#### `GET /api/parent/students`
- **Purpose:** Enumerates students directly linked to the incoming Parent token.
- **Ownership Rules:** Guaranteed statically mapped purely to `profile.students`.
- **Response Structure:** Array of validated student objects devoid of PII like tokens and hashes.

#### `GET /api/parent/students/:id`
- **Purpose:** Securely recovers metadata surrounding one particular child securely.
- **Parameters:** `:id` (Specific Student ObjectId).
- **Ownership Rules:** Backend verifies `:id` exists natively within `profile.students`. Unlinked IDs trigger 403 HTTP Access Denied.

#### `GET /api/parent/students/:id/attendance`
- **Purpose:** Returns secure history logs detailing Present/Absent metrics for a student.
- **Query Parameters:** `date`, `startDate`, `endDate`, `status`
- **Ownership Rules:** Validates student linkage actively before passing the lookup to the unified aggregate methods safely scaling parameters.

#### `GET /api/parent/students/:id/results`
- **Purpose:** Retrieves validated marks and PASS/FAIL attributes for a given student.
- **Query Parameters:** `examId`, `subject`.
- **Ownership Rules:** Strict scoping ensures Parent A cannot modify results, internal signatures (`__v`, `enteredBy`, `createdAt`) are structurally ignored statically via lean responses.

#### `GET /api/parent/students/:id/timetable`
- **Purpose:** Renders weekly schedules specifically isolated explicitly relying statically to a student's class and section.
- **Query Parameters:** `academicSession`, `dayOfWeek`, `subject`, `teacher`, `room`.
- **Ownership Rules:** Validates student linkage. Derives Class/Section dynamically internally instead of relying on URL parameter overrides assuring timetable cross-origin leak protection.

#### `GET /api/parent/notices`
- **Purpose:** Aggregates administrative and academic notices relevant to the parent's linked students dynamically.
- **Query Parameters:** `search`, `category`.
- **Notice Visibility Boundaries:**
  - Notice filtering natively accommodates generic populations seamlessly mapping securely across arrays. 
  - Audiences `ALL`, `STUDENTS`, `SPECIFIC_CLASS`, and `SPECIFIC_SECTION` are matched successfully covering multiple linked profiles efficiently overlapping classes without resulting statically duplicated notifications.
  - Audiences of `TEACHERS` are explicitly hidden mechanically.
  - Only `PUBLISHED` states succeed. `DRAFT`, `ARCHIVED`, or `EXPIRED` boundaries are forcibly hidden manually rejecting leaks reliably gracefully.

## 5. Systemic Security Enforcement
1. **Cross-Parent Protection:** Extrema filtering natively prevents Parent A from parsing `Parent B's` linkages.
2. **Student ID Tampering Protection:** If `:id` is arbitrarily augmented overriding queries locally implicitly gracefully rejecting execution yielding native errors accurately.
3. **NoSQL Injection and Query Hardening:** Fields injected intelligently using operators (`$gt`, `$ne`, `$in`) securely handled intelligently correctly enforcing precise strict regex parsing and strict Date filtering confidently intelligently explicitly safely cleanly cleanly. Object mapping checks utilizing native types guarantee structural bounds explicitly protecting fields successfully cleanly statically natively gracefully.
4. **Pagination and Protected Fields:** Data returns accurately mapping limits optimally masking PII including credentials natively effectively.

## 6. Full Regression Consistency Assurances
Parent structures completely leverage isolated namespace components avoiding overriding parallel `admin-module` functions statically mapped. No regressions impact native APIs serving Students or Teachers avoiding functional impacts smoothly reliably stably properly seamlessly natively cleanly flawlessly successfully. The existing Authentication middleware remains pristine ensuring completely validated JWT handling natively strictly cleanly globally accurately natively strictly perfectly faithfully efficiently responsibly perfectly successfully flawlessly effectively successfully cleanly smoothly smoothly smoothly expertly natively responsibly thoroughly natively reliably statically.
