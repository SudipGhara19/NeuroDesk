# NeuroDesk — System Architecture & Data Flow Diagrams

## 1. System Architecture

```mermaid
graph TB
    subgraph CLIENT["🖥️ Client Layer — Next.js / React"]
        UI["Pages\n(Login / Dashboard / AI Chat\nKnowledge Base / Admin / Analytics)"]
        REDUX["Redux Toolkit\n(Auth + Settings State)"]
        SOCKET_CLIENT["Socket.IO Client\n(Real-time events)"]
    end

    subgraph GATEWAY["🔀 API Gateway Layer"]
        NGINX["Nginx Reverse Proxy\n(Port 80 → 3000 / 5868)"]
    end

    subgraph BACKEND["⚙️ Backend Services — Node.js / Express 5"]
        AUTH["Auth Service\n/api/auth/*\n(JWT + Refresh Tokens)"]
        DOC["Document Service\n/api/documents/*\n(Upload + Parse + Index)"]
        RAG["AI/RAG Service\n/api/ai-chat/*\n(Query + Stream)"]
        USER["User Service\n/api/users/*\n(Profile + RBAC)"]
        SETTINGS["Settings Service\n/api/settings/*\n(Admin Config)"]
        ANALYTICS["Analytics Service\n/api/analytics/*\n(Usage Metrics)"]
        SOCKET_SRV["Realtime Service\nSocket.IO\n(Chat + Presence)"]
    end

    subgraph MIDDLEWARE["🛡️ Middleware Stack"]
        HELMET["Helmet\n(HTTP Headers)"]
        RATE["Rate Limiter\n(100 req/15min)"]
        SANITIZE["Mongo Sanitize\n(NoSQL Injection)"]
        VALIDATOR["Express Validator\n(Input Validation)"]
        MORGAN["Morgan Logger"]
    end

    subgraph AI_LAYER["🤖 AI Layer"]
        EMBED["Local Embedding Engine\nMiniLM-L6-v2\n(384-dim, free, offline)"]
        GROQ["Groq Cloud API\nLlama 3.1 / 3.3 / 4\n(LLM Inference)"]
    end

    subgraph DATABASES["🗄️ Data Layer"]
        MONGO["MongoDB\n(Users, Sessions,\nDocuments, Analytics)"]
        PINECONE["Pinecone\nVector DB\n(384-dim embeddings)"]
        REDIS["Redis Cloud\n(RAG Query Cache\n5-min TTL)"]
    end

    UI --> NGINX
    SOCKET_CLIENT --> SOCKET_SRV
    NGINX --> AUTH & DOC & RAG & USER & SETTINGS & ANALYTICS
    AUTH & DOC & RAG & USER & SETTINGS & ANALYTICS --> MIDDLEWARE
    RAG --> EMBED --> PINECONE
    RAG --> GROQ
    RAG --> REDIS
    AUTH & USER --> MONGO
    DOC --> MONGO & PINECONE
    ANALYTICS --> MONGO
    SOCKET_SRV --> MONGO
```

---

## 2. Data Flow Diagram — User Query Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Next.js Frontend
    participant Backend as Express Backend
    participant Redis as Redis Cache
    participant Embed as Local Embedder (MiniLM)
    participant Pinecone as Pinecone Vector DB
    participant Groq as Groq LLM API
    participant MongoDB as MongoDB

    User->>Frontend: Types question, hits Send
    Frontend->>Backend: POST /api/ai-chat/sessions/:id/stream\n{query, model}
    Backend->>Backend: Verify JWT, check AI restriction
    Backend->>Redis: GET cache key (base64 query hash)

    alt Cache HIT
        Redis-->>Backend: Cached {answer, sources, confidence}
        Backend-->>Frontend: SSE: meta event (sources, confidence)
        Backend-->>Frontend: SSE: token events (word-by-word simulation)
        Backend-->>Frontend: SSE: done event
    else Cache MISS
        Redis-->>Backend: null
        Backend->>Embed: embedText(query)
        Embed-->>Backend: Float32Array[384]
        Backend->>Pinecone: query(embedding, topK=N, namespaces)
        Pinecone-->>Backend: matches[] (scored chunks)
        Backend->>Backend: Filter by confidence threshold\nBuild context string
        Backend->>Groq: createChatCompletion(stream=true)\n[system + context + query]
        Groq-->>Backend: Stream of token deltas
        Backend-->>Frontend: SSE: meta event
        loop For each token
            Backend-->>Frontend: SSE: data {token}
            Frontend->>Frontend: Append token to message bubble
        end
        Backend->>Redis: SETEX cache key (300s TTL)
        Backend-->>Frontend: SSE: done event
    end

    Backend->>MongoDB: Save user + assistant messages async
    Backend->>MongoDB: Update analytics (query count, latency, tokens)
```

---

## 3. RAG Pipeline Diagram — Document Ingestion

```mermaid
flowchart TD
    A([📎 File Upload\nPDF / DOCX / TXT / MD]) --> B[Multer Middleware\nBuffer in Memory]
    B --> C{File Type?}
    C -->|PDF| D[pdf-parse\nExtract raw text]
    C -->|DOCX| E[mammoth\nExtract raw text]
    C -->|TXT / MD| F[Buffer.toString\nUTF-8 decode]

    D & E & F --> G[Text Validation\nEmpty check]
    G --> H[Fetch Admin Settings\nchunkSize, chunkOverlap]

    H --> I[Sliding Window Chunker\nchunkText function\nDefault: 500 words / 50 overlap]
    I --> J[N chunks array]
    J --> K[Local MiniLM-L6-v2\nembedTexts batch call\n→ Float32Array384 per chunk]

    K --> L[Float32Array → number\nType conversion\nFinite value guard]
    L --> M{Valid vectors?}
    M -->|None valid| N[❌ Throw Error\nUpdate doc status=failed]
    M -->|Has valid| O[Pinecone Upsert\nBatch of 100\nns.upsert record]

    O --> P[(Pinecone Namespace\n= Document _id)]
    P --> Q[✅ MongoDB Update\nstatus=ready\nchunkCount=N\npineconeNamespace]

    subgraph META["📦 Vector Metadata per chunk"]
        R["id: namespace_chunk_i_uuid\nvalues: Float32Array384\nmetadata:\n  docId, fileName, fileType\n  chunkIndex, text slice 0-1000"]
    end
    O -.->|Each record| META

    style N fill:#ff4444,color:#fff
    style Q fill:#22c55e,color:#fff
```

---

## 4. RAG Pipeline — Query Retrieval

```mermaid
flowchart TD
    A([🔍 User Query]) --> B{Casual greeting?}
    B -->|Yes - hi/hello/etc| C[Skip RAG\nDirect LLM call\nTemperature 0.7]
    B -->|No| D{Redis Cache Hit?}

    D -->|HIT| E[Return cached result\ncache_hit=true\nHigh speed response]
    D -->|MISS| F[embedText query\nLocal MiniLM-L6-v2]

    F --> G[retrieveChunks\nQuery all Pinecone namespaces\ntopK = settings.ragTopK]
    G --> H{Score check\n> settings.ragConfidenceThreshold?}

    H -->|No matches above threshold| I[Fallback response:\nNot enough information\nconfidence=0]
    H -->|Has relevant chunks| J[buildContext\nSort by score\nExtract text + sources]

    J --> K[buildPrompt\nSystem prompt + Context + Query\nGroup conversation history]
    K --> L[Groq API\nchat.completions.create\nstream=true or false]

    L --> M[Parse response\nExtract answer + token usage]
    M --> N[setCache\nRedis SETEX 300s TTL]
    N --> O([📤 Return\nanswer, sources\nconfidence, tokens_used\nlatency_ms, model])

    style E fill:#22c55e,color:#fff
    style I fill:#f59e0b,color:#fff
    style O fill:#6366f1,color:#fff
```
