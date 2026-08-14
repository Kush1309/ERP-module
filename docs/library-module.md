# School ERP: Library Management Module

## 1. Overview
The Library Management module provides a secure, fully-integrated cataloging and lending system native to the School ERP platform. It supports full administrative CRUD operations for the Book catalogue, atomic inventory constraints for lending workflows, and strict Role-Based Access Control (RBAC) encapsulating issues and tracking lending dates robustly.

Existing architecture tightly wraps identity via the session-verified models (`User`, `Student`, `Teacher`, `ParentProfile`). Frontend navigation provides intuitive search controls and segmented data views appropriate strictly to the active user's role mapping.

## 2. Data Model

### Book Schema (`Book.js`)
Handles the library inventory catalogue.

**Fields:**
- `title` (String, Required, Max 255)
- `author` (String, Required, Max 255)
- `isbn` (String, Required, Max 50, Unique)
- `publisher` (String, Max 255)
- `category` (String, Required, Max 100)
- `totalCopies` (Number, Integer >= 0, Required)
- `availableCopies` (Number, Integer >= 0, Required)

**Validations & Security:**
- Pre-save validation strictly blocking `availableCopies` from logically exceeding `totalCopies`.
- `isbn` uniqueness halts duplicate catalog creations natively inside MongoDB indexing logic.
- Hard limits rejecting mathematically negative inventory counts.

### BookIssue Schema (`BookIssue.js`)
Tracks lending transactions.

**Fields:**
- `bookId` (ObjectId referencing Book, Required)
- `requesterId` (ObjectId, Required)
- `requesterModel` (Enum: `Student`, `Teacher`, Required)
- `issueDate` (Date, Required)
- `dueDate` (Date, Required)
- `returnDate` (Date)
- `status` (Enum: `ISSUED`, `RETURNED`, `OVERDUE`, Default: `ISSUED`)

**Validations & Security:**
- Dynamic polymorphic mappings isolating references explicitly to validated `Student` and `Teacher` bounds.
- Block active `ISSUED` records from holding `returnDate` stamps.
- Enforce that `dueDate` must sequentially proceed `issueDate`.

## 3. API Documentation

Authentication is unconditionally enforced over all paths matching ERP architectures leveraging the JWT middleware patterns. 

- `GET /api/library/books` - Public scoped catalog retrieval isolating queries optionally targeting search params natively. (Admin, Teacher, Student, Parent)
- `POST /api/library/books` - Initialize new books. (Admin Only)
- `PUT /api/library/books/:id` - Mutations validating limits avoiding conflicting changes blocking issued catalogs. (Admin Only)
- `DELETE /api/library/books/:id` - Destroys books natively *unless active issues exist*. (Admin Only)

- `GET /api/library/issues` - Resolves tracking tickets enforcing exact scope bindings mapping users internally avoiding parameterized impersonation. (Admin, Teacher, Student, Parent)
- `POST /api/library/issues` - Checks out references executing MongoDB transactions decreasing availabilities sequentially blocking duplicates. (Admin Only)
- `PATCH /api/library/issues/:id/return` - Transitions issue safely resolving inventory dependencies closing workflow. (Admin Only)

## 4. RBAC Documentation & Visibility Mapping

Permissions securely wrap read and mutating endpoints:

**ADMIN:** 
Full catalog management. Unlocks issue assignments and initiates global returns visually traversing boundaries across the platform unrestricted.

**TEACHER:**
Can purely examine catalogue indexes and pull historical checkout footprints uniquely linked directly alongside their `teacherId`. Absolute isolation blocking mutations.

**STUDENT:**
Identical to Teachers, traversing catalogue indexes read-only while explicitly retrieving solely lending logs assigned native dynamically mapping their `studentId`.

**PARENT:**
Can explore catalogues natively. Read-only ticket exposure constrained structurally against their internal `Linked Students` mappings array fetching precisely only what aligns inside those bounds.

## 5. Book Copy Consistency
Inventories trace boundaries accurately inside multi-stage MongoDB atomicity.

- **Checkouts:** Executes inside isolated session logic triggering `$inc: {availableCopies: -1}` locking conditions checking `{ availableCopies: {$gt: 0} }`. Duplicate active profiles are blocked completely.
- **Returns:** Clamps limits verifying records incrementing bounds correctly back natively skipping overrides checking `{ $lt: ["$availableCopies", "$totalCopies"] }` internally updating status blocks sequentially.
- **Modifications:** `totalCopies` cannot mathematically dip below the current issued metric securing integrity organically.

## 6. Security Implementation

- **NoSQL Injection:** Stringent Object ID casting rejecting uncontrolled maps. Escaped RegExp handlers utilized effectively scaling arbitrary `search` structures appropriately blocking execution payloads natively.
- **Body & Query Hardening:** Services structurally map parameter inputs directly passing safe boundaries completely detaching internal manipulation targets `req.body.availableCopies`.
- **Authorization Spoofing:** Ownership restricts execution natively mapping `req.user.studentId` internally scaling overrides beyond parameter injections.

## 7. Frontend Integration

**Frontend Service:** `frontend/src/services/libraryApi.js` encapsulating Axios paths.

**Frontend UI:** `frontend/src/pages/LibraryPage.jsx` dynamically rendering layout components.

- **Admin/UX UI:** Renders modular nested popups navigating checkout controls executing operations mapped directly towards atomic service bounds smoothly tracing actions intuitively.
- **Role Isolations:** Non-administrative paths strip write buttons cleanly projecting strict browsing modalities rendering paginations perfectly preserving boundaries dynamically relying completely upon API mapping blocking malicious queries natively. 
- **Loading & State Layouts:** Predictable UI renders tracing `loading` Spinners bounding graceful failures handling 4xx errors properly providing retry blocks safely avoiding trace leakages internally.

## 8. Dashboard Navigation

Links statically bound traversing Dashboards pointing globally towards `/library`:

- Admin Dashboard `(HR Section -> Library)`
- Teacher Dashboard `(Role Action -> Library)`
- Student Dashboard `(Nav -> Library)`
- Parent Dashboard `(Nav -> Library)`

## 9. Regression Boundaries

Library integrations firmly executed structurally maintaining explicit independency securely avoiding side-effect triggers verifying absolute regression passes completely spanning: 
- Authentication & Auth Scoping
- Students, Teachers, Parents Management
- Leaves, Examinations, Results
- Homework, Attendances & Notices
- Timetables & Intercommunication Modules

Zero disjointed impacts generated beyond intended targets ensuring release confidence seamlessly.
