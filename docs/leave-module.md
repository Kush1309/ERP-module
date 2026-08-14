# Leave Management Module Documentation

## 1. Overview
The Leave Management Module allows internal stakeholders (Students and Teachers) to submit leave requests while providing administrative staff with the ability to review, approve, or reject these requests. It ties into the core Attendance workflow and integrates seamlessly with the existing Role-Based Access Control (RBAC) architecture, supporting complete life-cycle status transitions while maintaining strict permission guardrails. Parent Profiles have read-only visibility into leaves applied by linked students.

## 2. Data Model (`LeaveRequest`)
The primary entity, `LeaveRequest`, maps a requester to an absence period.

**Fields & Validations:**
- `requesterId`: (ObjectId, RefPath: `requesterModel`, Required) Represents either a Student or Teacher.
- `requesterModel`: (String, Required) Enum: `['Student', 'Teacher']`.
- `startDate`: (Date, Required) Start of the leave duration.
- `endDate`: (Date, Required) Must be greater than or equal to `startDate` (enforced via schema-level custom validation).
- `type`: (String, Required) Enum: `['SICK', 'CASUAL', 'OTHER']`.
- `reason`: (String, Required, Trimmed) Maximum length 5000 chars, Minimum length 1 char.
- `status`: (String, Required) Enum: `['PENDING', 'APPROVED', 'REJECTED']`. Default is `PENDING`.
- `approverId`: (ObjectId, Ref: `User`, Optional) Admin who executed the approval/rejection.
- `adminComment`: (String, Optional, Trimmed) Maximum length 5000 chars. Justification supplied by the admin.
- `timestamps`: Native Mongoose `createdAt` and `updatedAt`.

**Indexes:**
- `{ requesterId: 1, requesterModel: 1 }`: Rapid scoping for personal retrieval (Teacher/Student) or Linked Student lookups (Parent).
- `{ status: 1 }`: Fast Admin filtering.
- `{ startDate: 1 }`: Temporal chronological arrangements.

## 3. API Documentation
All endpoints require authentication using existing bearer token middleware (`authenticateUser`). RBAC limits are applied at the router via `authorizeRoles`.

1. **`POST /api/leaves`**
   - **Access**: `STUDENT`, `TEACHER`, `ADMIN`
   - **Body**: `{ startDate, endDate, type, reason }`
   - **Behavior**: Contextual identity derivation (determines `requesterId` from session).
2. **`GET /api/leaves`**
   - **Access**: `STUDENT`, `TEACHER`, `ADMIN`, `PARENT`
   - **Query**: Optional `page`, `limit`, `status`, `requesterModel`.
   - **Behavior**: Returns paginated, scoped requests (e.g. `$in` parent arrays, own identity enforcement).
3. **`GET /api/leaves/:id`**
   - **Access**: `STUDENT`, `TEACHER`, `ADMIN`, `PARENT`
   - **Behavior**: Retrieves detailed specific leave data protecting invalid ID/owner scope.
4. **`PUT /api/leaves/:id`**
   - **Access**: `STUDENT`, `TEACHER`, `ADMIN`
   - **Body**: Updates to `{ startDate, endDate, type, reason }`
   - **Behavior**: Updatable **only** if status is `PENDING` (for non-admin).
5. **`DELETE /api/leaves/:id`**
   - **Access**: `STUDENT`, `TEACHER`, `ADMIN`
   - **Behavior**: Cancellable **only** if status is `PENDING` (for non-admin).
6. **`PATCH /api/leaves/:id/status`**
   - **Access**: `ADMIN` exclusively
   - **Body**: `{ status: 'APPROVED' | 'REJECTED', adminComment }`
   - **Behavior**: Stamps the approving Admin identity (`approverId`). Blocks modifying something that is no longer `PENDING`.

## 4. RBAC
- **Admin**: Has global retrieval overriding specific ID scopes. Can exclusively approve/reject (write to status). Can delete arbitrary leaves if strictly required.
- **Teacher**: Can create, fetch, edit, or cancel leaves belonging exclusively to their intrinsic Teacher profile identity.
- **Student**: Operates analogously to Teachers, strictly confined to their own intrinsic Student identity footprint. 
- **Parent**: Wholly `READ-ONLY`. Access restricts to intersecting leaves owned by `ParentProfile.students`. 

## 5. Ownership & Visibility
- **Student Ownership**: Derived implicitly on the server via `resolveRequesterContext`.
- **Teacher Ownership**: Derived implicitly on the server via `resolveRequesterContext`.
- **Parent Linked-Student Protection**: Evaluated dynamically using `$in` look-up checks intersecting the parent array against `requesterId` of populated models.
- **Cross-Protection**: The service forcibly evaluates token identity against data model ownership fields. Route parameters (`requesterId` payloads) are ignored for internal API writes, blocking ID tampering vulnerabilities. 
- **ID Tampering Protection**: Protected strictly using safe Mongoose ObjectId checks mapping strictly to bearer identities structure, not untrusted request body parameters.

## 6. Status Lifecycle
Transitions are strictly `PENDING` -> `APPROVED` or `PENDING` -> `REJECTED`. 
- **Mutation Limits:** Once left `PENDING`, neither `APPROVED` nor `REJECTED` states can be edited or cancelled by Students and Teachers. Admins can no longer transition them to alternate states avoiding inconsistent dual-stamp events.
- Transitioning logic exclusively operates on `PATCH /api/leaves/:id/status`.

## 7. Security Architecture Components
- **Request Body Hardening:** Endpoint functions selectively whitelist parameters `{ startDate, endDate, type, reason }` discarding unauthorized manipulations over `status`, `approverId`, or `requesterId`.
- **ObjectId Validation:** Validated dynamically preventing generic BSON casting exceptions.
- **NoSQL Injection / Query Hardening:** Queries cast values locally before passing to database `.find()`.
- **Regex Security:** Implemented where partial searches are relevant, escaping user input safely.
- **Pagination Safety:** Limit bounds (e.g. 10 to 100) are securely enforced capping server exhaustion vectors.
- **Error Handlers:** Reuses system-wide `AppError` blocking stack traces or Mongo metrics dumping.
- **Data Protection:** No sensitive internal references (hash arrays/sessions) leaked inside response structures.

## 8. Frontend Integration
Built entirely on existing infrastructure utilizing:
- Tailwind CSS exclusively without external dependency injections.
- Layout Integration: Navigation mapped efficiently into the role-segregated `/leaves` component dynamically bound inside `App.jsx`.
- **Role-based Modalities:** Admin views `Action buttons`, Parent views passive details layout, Student/Teacher leverage `Create / Edit forms`. Wait cycles present robust Loading schemas. Errors expose controlled feedback mechanisms preventing unsafe DOM mutations (XSS/HTML string manipulation). Form fields apply client-side date boundary synchronizations `min={form.startDate}` mimicking robust backend capabilities.

## 9. Regression Boundaries
Leave Management operates structurally isolated, maintaining a rigid dependency barrier alongside existing systems. The following modules remain completely frozen:
- Authentication, Admin, Student, Teacher, Attendance, Examination, Results, Timetable, Noticeboard, Parent Portal, Messaging, Homework.

## 10. Data Relationships
- **LeaveRequest <-> User**: `approverId` tracks the modifying identity.
- **LeaveRequest <-> Student/Teacher**: Uses polymorphic structure mapping context logic across both user identities dynamically based on `requesterModel`.
- **LeaveRequest <-> ParentProfile**: Connected implicitly during runtime via Parent `students` array relationships.

## 11. Validation Rules Implemented
- `Leave Type` enum stringencies (`SICK`, `CASUAL`, `OTHER`).
- Date correlation (`endDate >= startDate`).
- Enforced required reason lengths minimizing whitespace abuse patterns (using `trim: true`).
- Status constraints restricted entirely via rigid API limits.
