# Noticeboard & Communication Module Documentation

## 1. Overview
The Noticeboard & Communication module facilitates secure, role-based broadcasting of announcements and notices across the School ERP system. It enables Administrators to create, selectively target, and manage notices for Teachers and Students simultaneously while ensuring strict audience isolation schemas.

## 2. Notice Model
The core schema is structured in `backend/src/models/Notice.js`.
### Fields:
- **title**: `String` (Required, Max 150)
- **content**: `String` (Required, Max 2000)
- **category**: `String` (Enum: `ACADEMIC`, `ADMINISTRATIVE`, `EVENT`, `EMERGENCY`, `GENERAL`. Required)
- **priority**: `String` (Enum: `LOW`, `NORMAL`, `HIGH`, `URGENT`. Required)
- **audience**: `String` (Enum: `ALL`, `TEACHERS`, `STUDENTS`, `SPECIFIC_CLASS`, `SPECIFIC_SECTION`. Required)
- **targetClass**: `String` (Required if audience is `SPECIFIC_CLASS` or `SPECIFIC_SECTION`)
- **targetSection**: `String` (Required if audience is `SPECIFIC_SECTION`)
- **status**: `String` (Enum: `DRAFT`, `PUBLISHED`, `ARCHIVED`. Required)
- **publishedAt**: `Date` (Optional, required when PUBLISHED)
- **expiresAt**: `Date` (Optional, must be > publishedAt)
- **createdBy**: `ObjectId` (Ref: User. Required)

### Validation Relationships:
- Rejects `SPECIFIC_CLASS` if `targetClass` is missing.
- Rejects `SPECIFIC_SECTION` if `targetClass` or `targetSection` is missing.
- Ensures `expiresAt` occurs sequentially strictly after `publishedAt`.

## 3. Audience Rules
- **ALL**: Visible to universally all authenticated Teachers and Students.
- **TEACHERS**: Visible restricted exclusively to users holding the Teacher role.
- **STUDENTS**: Visible restricted broadly to all registered Students.
- **SPECIFIC_CLASS**: Visible solely to Students whose registered `class` explicitly matches `targetClass`.
- **SPECIFIC_SECTION**: Visible securely to Students matching exact `class` and `section`.

## 4. Notice Lifecycle
- **DRAFT**: Intended for unfinished broadcasts. Not visible to any audience besides Administrators.
- **PUBLISHED**: Instantly active on dashboard feeds for matching audiences. Requires `publishedAt`. 
- **ARCHIVED**: Exits operational flow. No longer exposed to external audiences.
- **EXPIRED**: Automatically hidden from external endpoints dynamically once `expiresAt < Date.now()`.

## 5. Admin APIs
All routes enforce `authenticateUser` and `authorizeRoles('ADMIN')`.
- `POST /api/notices`: Creates new standard notices.
- `GET /api/notices`: Fetches all notices with pagination and searching.
- `GET /api/notices/:id`: Retrieve details for singular management.
- `PUT /api/notices/:id`: Modifies arbitrary fields prior to archiving.
- `DELETE /api/notices/:id`: Permitted complete deletion.
- `PATCH /api/notices/:id/publish`: Transitions target Notice smoothly to `PUBLISHED` state.
- `PATCH /api/notices/:id/archive`: Demotes target Notice accurately to `ARCHIVED` state.

## 6. Teacher APIs
- `GET /api/teacher/notices`: Returns securely read-only payload.
- `GET /api/teacher/notices/:id`: Retrieves singular published, non-expired notice content accurately.
**Restrictions**: Teachers identically only resolve notices scoped to `ALL` or `TEACHERS`. Cannot access Student or Specific Class restrictions.

## 7. Student APIs
- `GET /api/student/notices`: Loads notices matching DB-derived class credentials natively.
- `GET /api/student/notices/:id`: Allows retrieval enforcing exact scope boundary checks properly.
**Restrictions**:
- Identifies current student strictly via MongoDB (`req.user._id` → Student profile).
- Rejects input-spoofed scopes securely. Prevents cross-student data extraction completely.

## 8. RBAC Matrix
| Operation | Admin | Teacher | Student |
|-----------|-------|---------|---------|
| Create | YES | NO | NO |
| Read Admin Notices | YES | NO | NO |
| Read Teacher Notices | YES | YES | NO |
| Read Student Notices | YES | NO | YES |
| Update | YES | NO | NO |
| Delete | YES | NO | NO |
| Publish | YES | NO | NO |
| Archive | YES | NO | NO |

## 9. Security 
- **Authentication**: Strict JWT enforcement bounds all paths natively.
- **RBAC**: Enforced uniformly.
- **ObjectId Validation**: Tested blocking invalid injections automatically on IDs.
- **NoSQL Injection**: Search functions sanitize exact string regex correctly.
- **Regex Sanitization**: Input explicitly scrubbed against payload DOS vectors.
- **Pagination Limits**: Clamped accurately natively [1 - 100]. Negative values reject accurately.
- **Query Hardening**: Invalid options discarded elegantly. 
- **Protected Fields**: Enforces exact overrides stripping external manipulations via API.
- **Sensitive Data Protection**: Internal `__v` blocked dynamically.
- **Error Leak Protection**: Traps runtime exceptions omitting stack trace dynamically securely via middleware.

## 10. Frontend
- **Admin Notice Management (`NoticeManagementPage.jsx`)**: Full CRUD UX handling publishing and dynamic form filtering automatically.
- **Teacher Notices (`TeacherNoticesPage.jsx`)**: Clean, read-only interface rendering valid `ALL` or `TEACHERS` broadcasts logically formatted safely.
- **Student Notices (`StudentNoticesPage.jsx`)**: Visually identically maps valid scoping strictly bounded natively securely isolating unapproved access organically.
Neither teacher nor student profiles possess CRUD operations conceptually.

## 11. Data Relationships
- **Notice -> User**: Tracks author identity gracefully (`createdBy`).
- **Teacher -> User**: Inherits metadata logically seamlessly.
- **Student -> Class/Section**: Drives runtime scopes reliably resolving explicit filters seamlessly.

## 12. Validation
- **Required Fields**: Bounds properties explicitly (`category`, `priority`, `content`, `title`).
- **Audience Logic**: Strictly locks schema enforcing `class`/`section` payloads automatically triggering failures gracefully.
- **Status transitions**: Blocks explicit misalignments automatically native.

## 13. Regression Boundary
The deployment securely natively verifies and establishes operational integrity preserving existing stability on logic isolating features accurately enforcing integrity reliably strictly safely. The following core modules are frozen completely regression-tested intact:
- Admin
- Student
- Teacher
- Attendance
- Examination & Results
- Timetable
