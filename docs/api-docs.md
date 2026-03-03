# NeuroDesk — API Documentation

**Base URL:** `https://your-backend.onrender.com/api`  
**Auth:** JWT Bearer Token (`Authorization: Bearer <token>`)  
**Content-Type:** `application/json` (unless multipart noted)

---

## Authentication Service — `/api/auth`

### `POST /api/auth/signup`

Register a new user account.

**Auth required:** No (respects `allowRegistration` setting)

**Body:**

```json
{
  "fullName": "Sudip Ghara",
  "email": "sudip@example.com",
  "password": "StrongPass123"
}
```

**Response `201`:**

```json
{
  "message": "User registered successfully",
  "token": "<access_token>",
  "user": {
    "_id": "...",
    "fullName": "Sudip Ghara",
    "email": "...",
    "role": "User"
  }
}
```

**Errors:** `400` validation fail, `403` registration disabled, `409` email taken

---

### `POST /api/auth/login`

Authenticate and receive tokens.

**Body:**

```json
{ "email": "sudip@example.com", "password": "StrongPass123" }
```

**Response `200`:**

```json
{
  "token": "<15min access JWT>",
  "user": { "_id": "...", "fullName": "...", "email": "...", "role": "Admin" }
}
```

Sets `httpOnly` cookie: `refreshToken` (7-day expiry)

---

### `POST /api/auth/refresh`

Exchange refresh cookie for a new access token.

**Auth required:** No (uses `httpOnly` cookie)  
**Response `200`:** `{ "token": "<new access JWT>" }`

---

### `POST /api/auth/logout`

Invalidate session and clear refresh cookie.

**Auth required:** Yes  
**Response `200`:** `{ "message": "Logged out successfully" }`

---

## User Service — `/api/users`

### `GET /api/users/profile`

Get own user profile + extended stats.

**Auth:** Any authenticated user  
**Response `200`:** `{ "user": { ...UserData }, "stats": { ... } }`

---

### `PUT /api/users/profile`

Update own profile fields.

**Body:** `{ "fullName"?, "department"?, "bio"?, "phone"?, "address"? }`  
**Response `200`:** `{ "message": "...", "user": { ... } }`

---

### `GET /api/users/all`

List all users with pagination.

**Auth:** Admin or Manager  
**Query:** `?page=1&limit=20`  
**Response `200`:** `{ "users": [...], "pagination": { "page", "limit", "total", "pages" } }`

---

### `PATCH /api/users/:id/role`

Change a user's role.

**Auth:** Admin only  
**Body:** `{ "role": "Manager" }`  
**Response `200`:** `{ "message": "...", "user": { ... } }`

---

### `PATCH /api/users/:id/status`

Activate or deactivate a user account.

**Auth:** Admin or Manager  
**Body:** `{ "isActive": false }`

---

### `PATCH /api/users/:id/ai-restriction`

Enable or disable AI access for a user.

**Auth:** Admin or Manager  
**Body:** `{ "isAiRestricted": true }`

---

### `DELETE /api/users/:id`

Permanently delete a user account.

**Auth:** Admin only  
**Response `200`:** `{ "message": "User deleted successfully." }`

---

## Document Service — `/api/documents`

### `POST /api/documents/upload`

Upload a document and trigger the indexing pipeline.

**Auth:** Any authenticated user  
**Content-Type:** `multipart/form-data`  
**Fields:** `file` (File), `title` (String, optional)  
**Response `202`:**

```json
{
  "message": "Document uploaded. Processing started.",
  "document": { "_id": "...", "title": "...", "status": "processing", ... }
}
```

---

### `POST /api/documents/:id/reindex`

Replace a document's file and re-index it. Bumps `version` counter.

**Auth:** Admin or Manager  
**Content-Type:** `multipart/form-data`  
**Fields:** `file` (File — replacement file)  
**Response `202`:**

```json
{
  "message": "Document re-indexing started (Version 2).",
  "document": { "_id": "...", "version": 2, "status": "processing" }
}
```

---

### `GET /api/documents`

List all documents with pagination.

**Auth:** Any authenticated user  
**Query:** `?page=1&limit=20`  
**Response `200`:** `{ "documents": [...], "pagination": { ... } }`

---

### `GET /api/documents/:id`

Get a single document by ID.

**Auth:** Any authenticated user  
**Response `200`:** `{ "document": { ...fullDoc, "uploadedBy": { fullName, email, role } } }`

---

### `DELETE /api/documents/:id`

Delete a document from MongoDB and purge all vectors from Pinecone.

**Auth:** Admin or Manager  
**Response `200`:** `{ "message": "Document deleted successfully." }`

---

### `POST /api/documents/query`

Run a direct RAG query against the knowledge base.

**Auth:** Any authenticated user  
**Body:**

```json
{
  "query": "What is the refund policy?",
  "topK": 5,
  "documentIds": ["doc1id", "doc2id"]
}
```

**Response `200`:**

```json
{
  "answer": "The refund policy states...",
  "sources": ["policy.pdf", "handbook.md"],
  "confidence": 0.87,
  "tokens_used": 1245,
  "latency_ms": 842,
  "model": "llama-3.1-8b-instant"
}
```

---

## AI Chat Service — `/api/ai-chat`

### `GET /api/ai-chat/models`

List all available LLM models.

**Auth:** Any authenticated user  
**Response `200`:** `{ "models": [{ "id", "name", "description", "speed", "quality", "contextWindow" }] }`

---

### `POST /api/ai-chat/sessions`

Create a new chat session.

**Auth:** Any authenticated user (AI restriction check)  
**Body:** `{ "model"?: "llama-3.3-70b-versatile" }`  
**Response `201`:** `{ "session": { "_id", "title", "model", "messages": [], "stats": {} } }`

---

### `GET /api/ai-chat/sessions`

List user's own sessions.

**Auth:** Any authenticated user  
**Query:** `?page=1&limit=30`  
**Response `200`:** `{ "sessions": [...], "pagination": { ... } }`

---

### `GET /api/ai-chat/sessions/:id`

Get a full session with all messages.

**Auth:** Owner only  
**Response `200`:** `{ "session": { ...fullSession, "messages": [...] } }`

---

### `DELETE /api/ai-chat/sessions/:id`

Delete a chat session.

**Auth:** Owner only  
**Response `200`:** `{ "message": "Session deleted." }`

---

### `POST /api/ai-chat/sessions/:id/messages`

Send a message and receive a buffered response.

**Auth:** Owner (AI restriction check)  
**Body:** `{ "query": "Explain chunking", "model"?: "llama-3.1-8b-instant" }`  
**Response `200`:**

```json
{
  "message": {
    "role": "assistant",
    "content": "Chunking is...",
    "sources": ["doc1.pdf"],
    "confidence": 0.82,
    "tokensUsed": 312,
    "latencyMs": 1240,
    "model": "llama-3.1-8b-instant",
    "timestamp": "..."
  },
  "sessionTitle": "Explain Chunking",
  "model": "llama-3.1-8b-instant"
}
```

---

### `POST /api/ai-chat/sessions/:id/stream`

Send a message and receive a **streaming SSE response**.

**Auth:** Owner (AI restriction check)  
**Body:** `{ "query": "...", "model"?: "..." }`  
**Response:** `Content-Type: text/event-stream`

**Events:**

```
event: meta
data: {"sources":["doc.pdf"],"confidence":0.87,"model":"llama-3.1-8b-instant"}

data: {"token":"The "}

data: {"token":"answer "}

data: {"token":"is..."}

event: done
data: {"latency_ms":843}
```

---

### `PATCH /api/ai-chat/sessions/:id/model`

Switch a session's active model.

**Auth:** Owner  
**Body:** `{ "model": "llama-3.3-70b-versatile" }`  
**Response `200`:** `{ "message": "Model updated.", "model": "llama-3.3-70b-versatile" }`

---

## Settings Service — `/api/settings`

### `GET /api/settings`

Get global system settings. Public (used on login page for `allowRegistration`).

**Response `200`:**

```json
{
  "allowRegistration": true,
  "defaultAiModel": "llama-3.1-8b-instant",
  "customSystemPrompt": "...",
  "ragTopK": 5,
  "ragConfidenceThreshold": 0.15,
  "chunkSize": 500,
  "chunkOverlap": 50
}
```

---

### `PUT /api/settings`

Update global system settings.

**Auth:** Admin only  
**Body:** Any subset of: `allowRegistration`, `defaultAiModel`, `customSystemPrompt`, `ragTopK`, `ragConfidenceThreshold`, `chunkSize`, `chunkOverlap`  
**Response `200`:** `{ "message": "...", "settings": { ...updatedSettings } }`

---

## Analytics Service — `/api/analytics`

### `GET /api/analytics/summary`

Get platform-wide analytics summary.

**Auth:** Admin or Manager  
**Response `200`:**

```json
{
  "totalUsers": 42,
  "totalDocuments": 18,
  "totalQueries": 1523,
  "avgLatencyMs": 873,
  "totalSessions": 312,
  "vectorDbChunks": 8420,
  "totalTokensUsed": 2140000,
  "estimatedCostUSD": "2.14",
  "roleDistribution": { "Admin": 2, "Manager": 5, "User": 35 },
  "documentTypeDistribution": { "pdf": 10, "txt": 5, "md": 3 },
  "queryVolume": { "daily": [...], "weekly": [...], "monthly": [...] }
}
```

---

### `POST /api/analytics/ai-health`

Generate an AI-powered health analysis report of the platform.

**Auth:** Admin only  
**Response `200`:** `{ "report": "...(markdown analysis)..." }`

---

## WebSocket Events — Socket.IO

**Connection:** `io(BACKEND_URL, { withCredentials: true, auth: { token } })`

| Event             | Direction     | Payload                                      | Description                     |
| ----------------- | ------------- | -------------------------------------------- | ------------------------------- |
| `join-user`       | Client→Server | `{ userId }`                                 | Register user presence          |
| `users-online`    | Server→Client | `string[]`                                   | Updated list of online user IDs |
| `send-message`    | Client→Server | `{ roomId, content, senderName }`            | Send team chat message          |
| `receive-message` | Server→Client | `{ roomId, content, senderName, timestamp }` | Receive team chat message       |
| `join-room`       | Client→Server | `{ roomId }`                                 | Join a team chat room           |
| `typing`          | Client→Server | `{ roomId, userName }`                       | Typing indicator                |
| `typing`          | Server→Client | `{ userName }`                               | Broadcast typing indicator      |
| `disconnect`      | —             | —                                            | Auto-removes from online list   |
