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

## Current scope

This foundation includes:

- Express app with CORS, Helmet, Morgan, JSON parsing
- MongoDB connection via Mongoose
- Centralized error handling and 404 middleware
- React app layout, Home page, 404 page
- Reusable Button and Card components
- Central Axios client
- **Module 2:** JWT authentication, role-based access (ADMIN / TEACHER / STUDENT / PARENT), login ID generation, password change, protected frontend routes

Not included yet: students, teachers, fees, attendance, exams, or parent portal business modules.

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
