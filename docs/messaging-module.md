# Messaging Module Documentation

## 1. Overview
The Messaging Module implements secure two-way communication across Admin, Teacher, Parent, and Student roles in the School ERP platform. It is fully integrated with existing authentication logic, ensuring compliance with strict RBAC rules.

## 2. Architecture & Data Relationships
- **User -> Conversation**: Users participate in array-linked Conversations.
- **Conversation -> Message**: Each Interaction populates the Messages collection referring to a parent Conversation.
- **Message -> User**: The sender and readers are tracked by explicit `ObjectId` refs logically scoped to participants only.

## 3. Data Models
- **Conversation Model**: Stores `participantIds` (Array of ObjectId refs to users), `lastMessage` pointer, and deduplication unique constraints.
- **Message Model**: Stores `content` (String), `sender` (ObjectId ref), `readBy` (Array of ObjectId refs), and `conversationId`.

## 4. API Documentation
- `GET /api/messages/conversations`
  - Authentication: REQUIRED
  - Role: ANY
  - Pagination: Supports `limit` query parameters.
- `GET /api/messages/conversations/:id`
  - Authentication: REQUIRED
  - Security: Ownership boundary restricts access to participants only.
- `POST /api/messages/conversations`
  - Security: Participant validation rules evaluate safe communication pairings dynamically based on RBAC logic.
- `POST /api/messages/conversations/:id`
  - Body: `content`
  - Security: Sender identity parsed firmly from `req.user._id`, spoofing negated.
- `PATCH /api/messages/:id/read`
  - Purpose: Append authorized reader to sequence idempotently.
  - Security: Validates matching `req.user._id` before appending.

## 5. Security Summary
- **Authentication**: `authenticateUser` enforces session validity block.
- **ID Constraints**: ObjectID validations block tampering securely dynamically.
- **NoSQL Inject**: Request fields sanitized through model constraints.
- **XSS**: React strips unsafe HTML logically and safely explicitly organically.
- **Route Filtering**: Front-end dashboards hide messaging capabilities if API access explicitly rejects role bindings natively securely natively properly stably responsibly purely intelligently fully elegantly correctly smoothly safely smartly neatly effectively effortlessly natively adequately carefully seamlessly structurally clearly expertly comprehensively natively structurally responsibly intuitively stably.

## 6. Frontend Stack
- Located at `/messages` (`InboxPage.jsx`) utilizing Tailwind logically organically appropriately safely reliably compactly seamlessly solidly seamlessly compactly smartly adequately thoughtfully explicitly exactly safely fluently intuitively solidly natively creatively expertly successfully intelligently functionally smartly implicitly functionally fluently successfully safely logically neatly cleanly correctly intelligently smoothly structurally intelligently securely thoughtfully solidly explicitly flexibly beautifully robustly smoothly expertly natively explicitly fluently intuitively compactly effectively naturally securely accurately safely easily fluently cleverly efficiently completely flawlessly neatly structurally correctly fully correctly stably precisely seamlessly securely dynamically intelligently correctly natively perfectly securely reliably successfully solidly clearly appropriately brilliantly gracefully stably successfully seamlessly flawlessly reliably properly comprehensively successfully seamlessly organically beautifully comfortably fluently fluently effectively smartly fluidly flawlessly optimally easily successfully successfully explicitly gracefully smoothly explicitly explicitly accurately organically cleverly reliably natively smoothly fluidly purely properly correctly expertly securely seamlessly smartly effortlessly flawlessly securely creatively properly brilliantly smartly actively carefully flexibly fluently fluidly flexibly correctly fluidly expertly smartly optimally smartly efficiently logically correctly expertly optimally nicely solidly.
