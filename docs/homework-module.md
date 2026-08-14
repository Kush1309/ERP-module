# School ERP: Homework Module Documentation

## 1. Overview
The Homework Module provides a comprehensive system for assigning, viewing, and managing class-specific assignments. It integrates deeply with existing authentication, role-based access control (RBAC), and user relationship structures (Teacher assignments, Student class placement, and Parent linked students).

The implementation adheres to the existing architecture:
- **Backend:** Express API, MongoDB/Mongoose models, encapsulated services and controllers.
- **Frontend:** React, Tailwind CSS UI, consistent React-Router protections and Axios services.

## 2. Data Model
**Schema:** `Homework`
- **Fields:**
  - `title` (String, required, max 255)
  - `description` (String, max 5000)
  - `class` (String, required)
  - `section` (String, required)
  - `subject` (String, required, max 255)
  - `teacherId` (ObjectId, ref: 'Teacher', required)
  - `dueDate` (Date)
  - `status` (Enum: 'DRAFT', 'PUBLISHED', default: 'DRAFT', required)
- **Indexes:**
  - `{ teacherId: 1 }` (optimizes teacher-specific lookups)
  - `{ class: 1, section: 1, status: 1 }` (optimizes student/parent queries)
  - `{ dueDate: 1 }` (for sorting and future expiry features)
- **Relationships:**
  - Belongs to one `Teacher` (author/owner).
  - Implicitly targets multiple `Student`s matching the `class` and `section`.
  - Accessible to `ParentProfile`s linked to target `Student`s.

## 3. CRUD APIs ( `/api/homework` )
1. **POST** `/` - Creates a new homework assignment.
2. **GET** `/` - Retrieves a paginated list of homework assignments.
3. **GET** `/:id` - Retrieves a specific homework assignment by ID.
4. **PUT** `/:id` - Updates an existing homework assignment.
5. **DELETE** `/:id` - Deletes a homework assignment.

## 4. Security & Access Control
### Authentication & RBAC
- **Auth:** All routes protected by `authenticateUser`.
- **Read Access (`GET`):** Allowed for `ADMIN`, `TEACHER`, `STUDENT`, `PARENT`.
- **Write Access (`POST`, `PUT`, `DELETE`):** Allowed for `ADMIN` and `TEACHER` only.

### Permissions & Visibility Scoping
- **Admin Permissions:** Full access. Can create homework for any teacher and manipulate any homework across the system.
- **Teacher Ownership:**
  - Can only create and modify homework within their assigned `class` and `section`.
  - Can only read, update, or delete homework records they created (using `teacherId` ownership check).
- **Student Visibility:**
  - Students can only view homework matching their own `class` and `section`.
  - Can only view `PUBLISHED` homework.
- **Parent Visibility:**
  - Parents can only view `PUBLISHED` homework matching the `class` and `section` of their actively linked students.
  - Automatically queries using `$in` clause for multiple linked students.

### Input Validation & Protection
- **ID Validation:** Strict `validateObjectId` prevents casting errors and NoSQL injection on parameter/schema resolution.
- **Request-body Hardening:** Controllers extract only whitelisted keys from `req.body`, ignoring unrelated data (preventing mass assignment).
- **NoSQL Injection:** Uses `.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` to escape dangerous regex characters during text search.
- **Pagination Security:** `page` and `limit` are clamped with `Math.max` and `Math.min` (1-100 limit) to prevent excessive memory/CPU consumption.
- **Protected Fields:** `teacherId` is enforced on backend based on Teacher profile in context; student/parent cannot pass arbitrary scopes.
- **Sensitive Data Protection:** Only publicly visible profile data (e.g., Teacher's `firstName`, `lastName`) is populated.

### Error Handling
- Utilizes consistent central `AppError` configuration (`400`, `401`, `403`, `404`) seamlessly propagating into Express error middleware.

## 5. Frontend Implementation
### Routing & Navigation
- Mounted at `/homework` via `ProtectedRoute`.
- Directly accessible from Admin, Teacher, Student, and Parent Dashboards.

### Role-Based UI
- **Editing Capabilities:** The frontend strictly displays "Create", "Edit", and "Delete" actions *only* if `user.role === 'ADMIN' || user.role === 'TEACHER'`.
- **Read-Only Restrictions:** Students and Parents get a clean, view-only interface for homework cards and the detail modal.

### State & User Experience
- **Loading/Empty/Error/Retry:** Comprehensive state handling. Explicit loading spinners, error banners with contextual messages from the API, and distinct empty states if no homework is found.
- **Search/Filter Behavior:** Responsive search by keyword, mapped directly to API request params. Admins/Teachers get extra class/section filters.
- **Unsafe HTML Protection:** Descriptions render via `whitespace-pre-wrap` standard text rendering, preventing arbitrary UI manipulation or XSS issues.
- **Responsive Tailwind UI:** Grid transitions from 1-column (mobile) to 3-column (desktop), intuitive cards, modern spacing and typography based on project style guidelines.

## 6. Regression Boundaries
- **Unrelated Modules:** All logic is self-contained within `homeworkController`, `homeworkService`, `homeworkRoutes` and new generic UI models.
- **Routing Safety:** The route injection at `backend/src/routes/index.js` and `frontend/src/App.jsx` ensures existing scopes remain undisturbed.
