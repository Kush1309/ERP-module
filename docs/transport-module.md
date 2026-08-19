# School ERP: Transport Management Module

## 1. Overview
The Transport Management module provides a secure, fully-integrated system native to the School ERP platform for managing school bus routes and student transport allocations. It supports full administrative CRUD operations for transport routes and allocating students to these routes, and strict Role-Based Access Control (RBAC) to ensure precise visibility of transport information.

Transport is an isolated module that interacts securely with the `Student` and `ParentProfile` models but does not modify their schemas. It operates independently, ensuring zero regression impact on identity and standard student operations.

## 2. Data Model

### TransportRoute Schema (`TransportRoute.js`)
Handles the cataloging of available transport routes and bus capacities.

**Fields:**
- `name` (String, Required, Trimmed, Unique, MinLength: 1) - The designated name for the route (e.g. Route A).
- `vehicleNumber` (String, Required, Trimmed, MinLength: 1) - The license plate or identifier for the assigned transport vehicle.
- `driverName` (String, Required, Trimmed, MinLength: 1) - The name of the driver operating the assigned vehicle.
- `capacity` (Number, Integer >= 0, Required) - Maximum number of students that can be accommodated.
- `stops` (Array of Strings, Required, MinLength: 1) - Collection of allowed pickup and drop locations.
- `timestamps` - Standard Mongoose createdAt and updatedAt fields.

**Validations & Security:**
- Pre-save validation strictly blocks `capacity` from being a negative integer.
- `stops` must contain at least one valid string.
- `name` uniqueness is enforced through a MongoDB exact string index (`name: 1`).
- Routes with active allocations are blocked natively at the service level from being deleted.

### TransportAllocation Schema (`TransportAllocation.js`)
Tracks assigned student transportation for designated routes.

**Fields:**
- `studentId` (ObjectId referencing Student, Required) - The assigned student.
- `routeId` (ObjectId referencing TransportRoute, Required) - The allocated route.
- `pickupStop` (String, Required, Trimmed, MinLength: 1) - Approved boarding stop.
- `dropStop` (String, Required, Trimmed, MinLength: 1) - Approved destination stop.
- `status` (String, Enum: `ACTIVE`, `INACTIVE`, Default: `ACTIVE`, Required) - Denotes whether the allocation is currently in effect.
- `timestamps` - Standard Mongoose createdAt and updatedAt fields.

**Validations & Security:**
- Foreign references strictly enforce valid ObjectIds pointing to existing elements.
- A Partial Unique Index (`{ studentId: 1 }` where `status: 'ACTIVE'`) prevents complex race conditions natively, guaranteeing a student cannot possess multiple duplicate `ACTIVE` allocations simultaneously.
- Cross-relational checks verify `pickupStop` and `dropStop` are physically registered within the mapped `TransportRoute.stops` array boundaries prior to allocation.

## 3. Backend Architecture
The backend strictly adheres to a robust, layered MVC architectural pattern emphasizing modular security.

```text
Route (/routes/transportRoutes.js, /routes/index.js)
  ↓
Controller (/controllers/transportController.js)
  ↓
Service (/services/transportService.js)
  ↓
Model (/models/TransportRoute.js, /models/TransportAllocation.js)
  ↓
MongoDB
```

- **Routes:** Enforce standard JWT authentication and RBAC limits, directing requests deterministically.
- **Controllers:** Statically whitelist request entities stripping undocumented fields guarding against query manipulation attacks.
- **Services:** Execute relational validations, execute multi-document ownership algorithms, and manage business-level exceptions cleanly abstracting logic from HTTP interfaces.
- **Models:** Describe strict logical boundaries, applying database indexing natively rejecting anomalous mutations.

## 4. API Documentation

All endpoints strictly require global JWT authentication.

### Routes

- `GET /api/transport/routes`
  - **Auth Roles:** Admin, Teacher, Student, Parent
  - **Purpose:** Public scoped route catalog retrieval isolating queries optionally targeting search params (`page`, `limit`, `search`).
  - **Request Body:** None
  - **Response:** Paginated routes array.
- `POST /api/transport/routes`
  - **Auth Roles:** Admin Only
  - **Purpose:** Initialize a new TransportRoute.
  - **Request Body:** `{ name, vehicleNumber, driverName, capacity, stops }`
  - **Response:** Emits new route or throws `400` if identical name detected.
- `PUT /api/transport/routes/:id`
  - **Auth Roles:** Admin Only
  - **Purpose:** Mutate an existing route parameters.
  - **Request Body:** Fields permitted: `name`, `vehicleNumber`, `driverName`, `capacity`, `stops`
  - **Response:** Emits updated route.
- `DELETE /api/transport/routes/:id`
  - **Auth Roles:** Admin Only
  - **Purpose:** Removes specific route unconditionally unless mapped to active allocations.
  - **Response:** Success confirmation mapping null arrays.

### Allocations

- `GET /api/transport/allocations`
  - **Auth Roles:** Admin, Student, Parent
  - **Purpose:** Resolves assigned allocations enforcing exact scope bindings mapping users internally avoiding parameterized impersonation.
  - **Request Parameters:** `page`, `limit`, `studentId`, `routeId`, `status`
  - **Response:** Isolated array bound directly to user permissions.
- `POST /api/transport/allocations`
  - **Auth Roles:** Admin Only
  - **Purpose:** Creates and activates a student route assignment seamlessly verifying drop boundaries.
  - **Request Body:** `{ studentId, routeId, pickupStop, dropStop }`
  - **Response:** Activated Allocation payload.
- `PUT /api/transport/allocations/:id`
  - **Auth Roles:** Admin Only
  - **Purpose:** Mutates target assignments maintaining consistent bounds for stops/statuses safely.
  - **Request Body:** Fields permitted: `routeId`, `pickupStop`, `dropStop`, `status`
  - **Response:** Refreshed allocation footprint.
- `DELETE /api/transport/allocations/:id`
  - **Auth Roles:** Admin Only
  - **Purpose:** Safely deactivates target allocation gracefully altering status to `INACTIVE` rather than executing irreversible deletions allowing historical tracking.
  - **Response:** Success confirmation mapping null arrays.

## 5. RBAC & Ownership Security

Frontend role checks manipulate UX behavior ONLY. Identity, scope constraints, and endpoint security execute natively alongside backend mappings providing authoritative authorization bound dynamically scaling rules independently.

**ADMIN:**
Full catalog management. Unlocks global routes and allocations manipulation, initiating CRUD actions unrestricted across the environment.

**TEACHER:**
Granted access purely exposing global `TransportRoutes`. Allocations endpoints block teachers structurally issuing 403 blocks.

**STUDENT:**
Capable of inspecting global routes globally. `Allocations` endpoints firmly anchor ownership internally via tokenized execution limits mapping dynamic data tightly to exact authenticated users matching `req.user.studentId`. A Student structurally cannot parameterize spoof IDs matching unauthorized peers.

**PARENT:**
Can explore standard routes. Read-only ticket exposure mapped definitively tracing internal `Linked Students` mappings array fetching accurately restricted targets.

## 6. Input Validation & Security Implementation

Confirmed during integration module:

- **Authentication:** Native session JWT bindings on `/api/transport`.
- **Protected Fields Security & Body Hardening:** Parameter inputs explicitly structurally whitelisted via exact array enumerators isolating manipulation targets protecting `__v` or `createdAt` fields from external alterations.
- **NoSQL Injection & Query Hardening:** Query payloads natively filtered scaling escaped regular expression matches avoiding unexpected execution boundaries effectively blocking logic structures like `$ne` payloads seamlessly. Object ID strings conditionally wrapped explicitly blocking unvalidated queries.
- **Route / Allocation Deletions:** Business level restrictions definitively block Active Route removals bypassing data corruption organically executing fallback updates preserving exact status states dynamically.
- **Sensitive Data Protections:** Emits normalized error streams universally filtering debug properties preserving secrets consistently avoiding DB stack trace exposures cleanly.

## 7. Frontend Integration

**Frontend UI:** `frontend/src/pages/TransportPage.jsx` dynamically rendering layout components.
**Frontend Service:** `frontend/src/services/transportApi.js` encapsulating API path parameters logically binding validations handling Axios parameters effectively.

- **Dynamic Selectors:** Renders smart dependency dropdown mapping dynamic arrays limiting `pickupStop`/`dropStop` elements sequentially updating exactly what routes possess securely bounding erroneous UI payloads globally.
- **Loading & State Layouts:** Clean `loading` Spinners bound displaying graceful missing boundaries intercepting 4xx/5xx boundaries securely filtering retry configurations transparently.
- **Role Isolations:** Non-administrative paths seamlessly strip create/edit button interactions accurately projecting exact modal data without enabling interaction components natively mitigating visual confusions explicitly.
- **Routing:** Component seamlessly wired traversing primary `/transport` routing patterns projecting consistent layouts.

## 8. Dashboard Navigation
The frontend route `/transport` effectively unifies navigation interfaces for Transport Management.

## 9. Regression Status
Transport integrations firmly executed independently validating boundaries mitigating any modifications outside exact definitions avoiding triggers preserving perfect functional integrity tracing zero negative execution side-effects across:
- Authentication Module (PASS)
- Library & Admin Modules (PASS)
- Leave & Fee Modules (PASS)
- Homework, Attendances & Notices Modules (PASS)
- Timetables & Intercommunication (PASS)
- Student & Parent Portals (PASS)
- Teacher Portal (PASS)
