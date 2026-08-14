# Messaging Module Architecture and Security

## 1. Overview
The internal Messaging Module provides a secure communication channel between Administrators, Teachers, Parents, and Students via the School ERP system.

## 2. API Endpoints
- `GET /api/messages/conversations` (Retrieve all visible conversations)
- `GET /api/messages/conversations/:id` (Retrieve single conversation)
- `POST /api/messages/conversations` (Create conversation payload: `participantIds`)
- `POST /api/messages/conversations/:id` (Send message payload: `content`)
- `PATCH /api/messages/:id/read` (Mark read)

## 3. RBAC Matrix
- **ADMIN**: Can communicate with any role.
- **TEACHER**: Can communicate with Admin, plus linked Students and Parents.
- **PARENT**: Can communicate with Admin, plus linked Teachers.
- **STUDENT**: Can communicate with Admin, plus linked Teachers.

## 4. Security
- Identity is derived strictly from `req.user._id`.
- Request body flattening protects against NoSQL injection.
- Message content is sanitized and escaped naturally by React on Frontend.
- Authentication secrets are not exposed.

## 5. UI Integration
- Location: `/messages` (InboxPage.jsx)
- Tech: React + Tailwind CSS
- Protected route integrated cleanly within standard authenticated boundaries.
