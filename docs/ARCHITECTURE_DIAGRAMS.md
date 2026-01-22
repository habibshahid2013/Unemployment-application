# NorthStar Works - Detailed Architecture Diagrams

This document provides comprehensive visual representations of the system architecture.

---

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        LocalStorage[localStorage]
    end
    
    subgraph "Presentation Layer - Next.js 16"
        Pages[Pages/Routes]
        Components[React Components]
        Hooks[Custom Hooks]
        Context[Context Providers]
    end
    
    subgraph "API Layer - Vercel"
        NextAPI[Next.js API Routes]
        FastAPI[Python FastAPI]
        Middleware[Auth Middleware]
    end
    
    subgraph "External Services"
        SerpApi[SerpApi<br/>Google Jobs]
        Groq[Groq Cloud<br/>Llama 3.3]
        Gmail[Gmail API]
    end
    
    subgraph "Data Layer"
        InMemory[In-Memory Store]
        Firebase[Firebase<br/>Optional]
    end
    
    Browser --> Pages
    Browser <--> LocalStorage
    Pages --> Components
    Components --> Hooks
    Hooks --> Context
    
    Pages --> NextAPI
    Pages --> FastAPI
    
    NextAPI --> Gmail
    NextAPI -.-> Firebase
    
    FastAPI --> SerpApi
    FastAPI --> Groq
    FastAPI <--> InMemory
    FastAPI -.-> Firebase
    
    style Browser fill:#e3f2fd
    style Pages fill:#fff3e0
    style FastAPI fill:#f3e5f5
    style SerpApi fill:#e8f5e9
```

---

## 2. Request Flow - Job Search

```mermaid
sequenceDiagram
    participant User
    participant UI as Next.js UI
    participant API as FastAPI Backend
    participant Serp as SerpApi
    participant Groq as Groq LLM
    
    User->>UI: Enter search query "Software Engineer"
    UI->>UI: Click "Get AI Suggestions"
    UI->>API: GET /api/v1/suggest-jobs?query=software
    API->>Groq: POST chat/completions (job suggestions)
    Groq-->>API: JSON response with job titles
    API-->>UI: { suggestions: [...], alternatives: [...] }
    UI->>UI: Display autocomplete suggestions
    
    User->>UI: Select filters + click "Search"
    UI->>API: GET /api/v1/search?query=engineer&location=MN&date_filter=week
    
    loop Pagination (4 pages max)
        API->>Serp: GET search?engine=google_jobs&q=engineer&location=MN
        Serp-->>API: JSON with 10-15 jobs + next_page_token
        API->>API: Deduplicate, enrich, calculate freshness
    end
    
    API-->>UI: { data: [50 jobs], total: 50 }
    UI->>UI: Render job cards with MUI
    User->>UI: Click "Apply"
    UI->>UI: Save to localStorage
    UI->>UI: Show success toast
```

---

## 3. Request Flow - AI Follow-Up Email

```mermaid
sequenceDiagram
    participant User
    participant UI as My Applications Page
    participant FileInput as File Upload
    participant APIF as FastAPI (/api/v1)
    participant Groq as Groq LLM
    participant NextAPI as Next.js API Route
    participant Gmail as Gmail API
    
    User->>UI: Click "Send Follow-Up" on job application
    UI->>UI: Open follow-up dialog
    User->>FileInput: Upload resume.pdf (optional)
    FileInput->>APIF: POST /api/v1/parse-resume (multipart/form-data)
    APIF->>APIF: Extract text with PyPDF
    APIF-->>UI: { text: "John Doe\nSoftware Engineer..." }
    
    User->>UI: Click "Generate Email"
    UI->>APIF: POST /api/v1/generate-followup<br/>{jobTitle, company, resumeText}
    APIF->>Groq: POST chat/completions<br/>Prompt: "Generate professional follow-up email..."
    Groq-->>APIF: JSON: {email: {subject, body}, linkedinMessage}
    APIF-->>UI: Return generated content
    UI->>UI: Pre-fill email form
    
    User->>UI: Review, edit, click "Send via Gmail"
    UI->>NextAPI: POST /api/gmail/send<br/>{accessToken, to, subject, body}
    NextAPI->>NextAPI: Build MIME message
    NextAPI->>Gmail: POST /gmail/v1/users/me/messages/send
    Gmail-->>NextAPI: {id: "msg123", threadId: "thread456"}
    NextAPI-->>UI: {success: true}
    UI->>UI: Update application status to "Following Up"
    UI->>UI: Show success notification
```

---

## 4. Data Flow - Hybrid Storage Architecture

```mermaid
graph LR
    subgraph "Frontend State"
        Component[React Component]
        AppState[applications.ts Module]
    end
    
    subgraph "Browser Storage"
        LS[localStorage<br/>job_applications key]
    end
    
    subgraph "Backend Storage"
        Memory[In-Memory Store<br/>Python dict]
        FirestoreOpt[Firebase Firestore<br/>Optional]
    end
    
    Component -->|getApplications| AppState
    Component -->|saveApplication| AppState
    Component -->|updateApplication| AppState
    
    AppState <-->|JSON.parse/stringify| LS
    
    Component -->|POST /api/v1/apply| Memory
    Component -->|GET /api/v1/status| Memory
    
    Component -.->|Optional sync| FirestoreOpt
    Memory -.->|Optional persist| FirestoreOpt
    
    style Component fill:#e3f2fd
    style AppState fill:#fff3e0
    style LS fill:#c8e6c9
    style Memory fill:#ffccbc
    style FirestoreOpt fill:#f0f0f0,stroke-dasharray: 5 5
```

---

## 5. Component Hierarchy - Frontend Architecture

```mermaid
graph TD
    RootLayout[layout.tsx<br/>Root Layout]
    
    RootLayout --> ThemeReg[ThemeRegistry<br/>MUI Theme Provider]
    RootLayout --> NextAuthProv[NextAuth SessionProvider]
    RootLayout --> AuthProv[Custom AuthProvider<br/>Firebase Context]
    RootLayout --> NavBar[NavBar Component]
    
    RootLayout --> Pages[Page Routes]
    
    Pages --> Home[/ - Landing Page]
    Pages --> Dashboard[/dashboard]
    Pages --> JobSearch[/work-search]
    Pages --> MyApps[/my-applications]
    Pages --> Apply[/apply]
    Pages --> Eligibility[/eligibility]
    Pages --> Admin[/admin]
    Pages --> Weekly[/weekly-request]
    Pages --> Community[/community]
    
    JobSearch --> JobCard[JobCard Component]
    JobSearch --> SearchFilters[Filter Chips]
    JobSearch --> Autocomplete[MUI Autocomplete]
    
    MyApps --> AppCard[ApplicationCard]
    MyApps --> StatusChip[Status Chip]
    MyApps --> FollowUpDialog[Follow-Up Dialog]
    
    Dashboard --> StatusTracker[Progress Tracker]
    Dashboard --> NotificationList[Notification List]
    Dashboard --> WorkLog[Work Log]
    
    NavBar --> AuthBtn[Login/Logout Button]
    NavBar --> NavLinks[Navigation Links]
    
    Community --> ChatRoom[ChatRoom Component<br/>Real-time chat]
    
    style RootLayout fill:#3f51b5,color:#fff
    style Pages fill:#ff9800,color:#fff
    style JobSearch fill:#4caf50,color:#fff
    style MyApps fill:#e91e63,color:#fff
```

---

## 6. API Endpoint Map

```mermaid
graph TB
    Client[Client Requests]
    
    subgraph "Next.js API Routes (/api)"
        AuthRoute[/api/auth/[...nextauth]<br/>NextAuth.js OAuth]
        GmailRoute[/api/gmail/send<br/>Email Sending]
    end
    
    subgraph "FastAPI Routes (/api/v1)"
        SearchEP[GET /search<br/>Job Search]
        SuggestEP[GET /suggest-jobs<br/>AI Suggestions]
        FollowupEP[POST /generate-followup<br/>Email Generation]
        ParseEP[POST /parse-resume<br/>PDF Parsing]
        ContactEP[GET /find-contact<br/>LinkedIn Search]
        ApplyEP[POST /apply<br/>Submit Application]
        StatusEP[GET /status<br/>Get Status]
        WorkLogEP[POST /work-log<br/>Log Job Activity]
        AdminGET[GET /admin<br/>List Apps]
        AdminPATCH[PATCH /admin<br/>Update Status]
        ChatEP[POST /ai/chat-assist<br/>AI Chat]
    end
    
    Client --> AuthRoute
    Client --> GmailRoute
    Client --> SearchEP
    Client --> SuggestEP
    Client --> FollowupEP
    Client --> ParseEP
    Client --> ContactEP
    Client --> ApplyEP
    Client --> StatusEP
    Client --> WorkLogEP
    Client --> AdminGET
    Client --> AdminPATCH
    Client --> ChatEP
    
    SearchEP -.->|SerpApi| ExtAPI[External APIs]
    SuggestEP -.->|Groq| ExtAPI
    FollowupEP -.->|Groq| ExtAPI
    ContactEP -.->|SerpApi| ExtAPI
    GmailRoute -.->|Gmail API| ExtAPI
    
    style AuthRoute fill:#4caf50
    style GmailRoute fill:#4caf50
    style SearchEP fill:#2196f3
    style SuggestEP fill:#9c27b0
    style FollowupEP fill:#9c27b0
    style ChatEP fill:#9c27b0
```

---

## 7. Authentication Flow - Google OAuth

```mermaid
sequenceDiagram
    participant User
    participant App as Next.js App
    participant NextAuth as NextAuth.js
    participant Google as Google OAuth
    participant Gmail as Gmail API
    
    User->>App: Click "Connect Gmail"
    App->>NextAuth: signIn('google')
    NextAuth->>Google: Redirect to OAuth consent screen
    Google->>User: Show permissions request<br/>(email, profile, gmail.send)
    User->>Google: Click "Allow"
    Google->>NextAuth: Redirect with authorization code
    NextAuth->>Google: Exchange code for access token
    Google-->>NextAuth: Return access_token + refresh_token
    NextAuth->>NextAuth: Store tokens in encrypted session
    NextAuth-->>App: Return session object
    App->>App: Update UI to show "Connected"
    
    Note over App,Gmail: Later - sending email
    User->>App: Click "Send Follow-Up Email"
    App->>NextAuth: getSession()
    NextAuth-->>App: Return session with access_token
    App->>Gmail: POST /api/gmail/send<br/>{accessToken, to, subject, body}
    Gmail->>Gmail: Send email via Gmail API
    Gmail-->>App: {success: true, messageId}
    App->>User: Show "Email sent!" notification
```

---

## 8. Deployment Architecture - Vercel

```mermaid
graph TB
    subgraph "Developer Workstation"
        Code[Git Repository<br/>GitHub]
    end
    
    subgraph "Vercel Platform"
        Build[Build Process]
        NextDeploy[Next.js Deployment<br/>Node.js Runtime]
        PyDeploy[Python API Deployment<br/>Python Runtime]
        Edge[Vercel Edge Network<br/>100+ Locations]
    end
    
    subgraph "External Services"
        Serp[SerpApi]
        Groq[Groq Cloud]
        Gmail[Gmail API]
        Firebase[Firebase<br/>Optional]
    end
    
    subgraph "End Users"
        Browser1[User in Minnesota]
        Browser2[User in California]
        Browser3[User in New York]
    end
    
    Code -->|git push| Build
    Build -->|Compile TypeScript| NextDeploy
    Build -->|Package Python| PyDeploy
    
    NextDeploy --> Edge
    PyDeploy --> Edge
    
    Edge --> Browser1
    Edge --> Browser2
    Edge --> Browser3
    
    PyDeploy --> Serp
    PyDeploy --> Groq
    NextDeploy --> Gmail
    NextDeploy -.-> Firebase
    PyDeploy -.-> Firebase
    
    style Code fill:#333,color:#fff
    style Build fill:#ff9800
    style Edge fill:#4caf50
    style Browser1 fill:#2196f3,color:#fff
    style Browser2 fill:#2196f3,color:#fff
    style Browser3 fill:#2196f3,color:#fff
```

---

## 9. State Management Flow

```mermaid
stateDiagram-v2
    [*] --> PageLoad: User navigates to /work-search
    
    PageLoad --> CheckCache: Check localStorage
    CheckCache --> ShowCached: Found previous search
    CheckCache --> EmptyState: No cache
    
    ShowCached --> UserInput
    EmptyState --> UserInput
    
    UserInput --> FetchSuggestions: User types query
    FetchSuggestions --> DisplaySuggestions: Groq API response
    DisplaySuggestions --> UserInput: User continues typing
    
    UserInput --> SearchJobs: User clicks "Search"
    SearchJobs --> LoadingState: Show skeleton
    LoadingState --> FetchAPI: Call /api/v1/search
    FetchAPI --> ProcessResults: SerpApi returns data
    ProcessResults --> DisplayJobs: Render 30-50 job cards
    
    DisplayJobs --> ApplyClick: User clicks "Apply"
    ApplyClick --> SaveLocal: Save to localStorage
    SaveLocal --> UpdateUI: Show checkmark
    UpdateUI --> DisplayJobs
    
    DisplayJobs --> FilterChange: User changes filters
    FilterChange --> SearchJobs
    
    DisplayJobs --> [*]: User navigates away
```

---

## 10. Error Handling & Fallback Strategy

```mermaid
graph TD
    Request[API Request]
    
    Request --> TrySerpApi{SerpApi Available?}
    TrySerpApi -->|Yes| CallSerpApi[Fetch Google Jobs]
    TrySerpApi -->|No/Error| Fallback1[Return empty array + error msg]
    
    CallSerpApi --> CheckResponse{Status 200?}
    CheckResponse -->|Yes| ParseJobs[Parse & enrich results]
    CheckResponse -->|No| Fallback1
    
    ParseJobs --> ReturnData[Return jobs to client]
    Fallback1 --> ShowError[Display error toast to user]
    
    Request2[AI Generation Request] --> TryGroq{Groq Available?}
    TryGroq -->|Yes| CallGroq[Generate personalized email]
    TryGroq -->|No/Error| TemplateEmail[Use generic template]
    
    CallGroq --> ParseJSON{Valid JSON?}
    ParseJSON -->|Yes| ReturnAI[Return AI-generated content]
    ParseJSON -->|No| TemplateEmail
    
    TemplateEmail --> ReturnTemplate[Return template email]
    
    ReturnAI --> SetFlag[ai_powered: true]
    ReturnTemplate --> SetFlag2[ai_powered: false]
    
    style Fallback1 fill:#ff9800
    style TemplateEmail fill:#ff9800
    style ShowError fill:#f44336,color:#fff
```

---

## 11. Job Application Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Searching: User searches jobs
    Searching --> ViewDetails: Click job card
    ViewDetails --> Applied: Click "Mark as Applied"
    
    Applied --> FollowingUp: Send follow-up email (7 days)
    FollowingUp --> Interviewing: Schedule interview
    
    Interviewing --> Offer: Receive offer
    Interviewing --> Rejected: Rejection email
    
    Offer --> [*]: Accept offer (end journey)
    Rejected --> Searching: Continue searching
    
    Applied --> Withdrawn: Withdraw application
    FollowingUp --> Withdrawn: Withdraw application
    Interviewing --> Withdrawn: Withdraw application
    
    Withdrawn --> [*]
    
    note right of Applied
        Status: "applied"
        Points: +25
        Reminder: 7 days
    end note
    
    note right of FollowingUp
        Status: "following_up"
        Email sent via Gmail API
        LinkedIn message drafted
    end note
    
    note right of Interviewing
        Status: "interviewing"
        Add interview notes
        Track recruiter contact
    end note
```

---

## 12. Firebase Integration (Optional)

```mermaid
graph TB
    subgraph "Client Application"
        UI[React Components]
        FirebaseSDK[Firebase SDK]
    end
    
    subgraph "Firebase Services"
        Auth[Firebase Authentication]
        Firestore[Cloud Firestore]
        Storage[Cloud Storage<br/>Resume PDFs]
    end
    
    subgraph "Backend"
        FastAPI[FastAPI]
        FirebaseAdmin[Firebase Admin SDK]
    end
    
    UI -->|signInWithPopup| FirebaseSDK
    FirebaseSDK --> Auth
    Auth -->|ID Token| UI
    
    UI -->|Save Application| FirebaseSDK
    FirebaseSDK --> Firestore
    
    UI -->|Upload Resume| FirebaseSDK
    FirebaseSDK --> Storage
    
    FastAPI --> FirebaseAdmin
    FirebaseAdmin --> Firestore
    FirebaseAdmin --> Auth
    
    style FirebaseSDK fill:#ffca28
    style Auth fill:#ff6f00
    style Firestore fill:#039be5
    style Storage fill:#0288d1
```

---

## 13. Performance Optimization Strategy

```mermaid
graph LR
    subgraph "Client Optimizations"
        LazyLoad[Lazy Loading<br/>Route-based code splitting]
        Memoization[React.memo<br/>useMemo, useCallback]
        LocalCache[localStorage Cache<br/>Reduce API calls]
    end
    
    subgraph "Network Optimizations"
        CDN[Vercel Edge CDN<br/>Static asset caching]
        HTTP2[HTTP/2 Push<br/>Critical resources]
        Compression[Brotli Compression<br/>Text assets]
    end
    
    subgraph "API Optimizations"
        Async[Async/Await<br/>Concurrent API calls]
        Pagination[SerpApi Pagination<br/>Fetch 4 pages parallel]
        Timeout[12s Timeout<br/>Fail fast on errors]
    end
    
    subgraph "Future Optimizations"
        Redis[Redis Cache<br/>Popular searches 1hr TTL]
        ISR[Incremental Static Regen<br/>Revalidate every 5min]
        WebWorker[Web Workers<br/>Heavy parsing off main thread]
    end
    
    LazyLoad --> FastPageLoad[Sub-2s Page Load]
    Memoization --> FastPageLoad
    CDN --> FastPageLoad
    
    Async --> FastAPIResponse[Sub-3s API Response]
    Pagination --> FastAPIResponse
    
    Redis -.-> FuturePerf[Future: Sub-1s Response]
    ISR -.-> FuturePerf
    WebWorker -.-> FuturePerf
    
    style FastPageLoad fill:#4caf50,color:#fff
    style FastAPIResponse fill:#4caf50,color:#fff
    style FuturePerf fill:#9c27b0,color:#fff,stroke-dasharray: 5 5
```

---

## 14. Security Layers

```mermaid
graph TB
    User[End User]
    
    subgraph "Transport Security"
        HTTPS[HTTPS/TLS 1.3<br/>Vercel Auto-SSL]
    end
    
    subgraph "Application Security"
        CORS[CORS Middleware<br/>Origin validation]
        Auth[NextAuth.js<br/>OAuth 2.0 + JWT]
        Validate[Pydantic Validation<br/>Type checking]
    end
    
    subgraph "Data Security"
        EnvVars[Environment Variables<br/>API keys never in code]
        SessionEncrypt[Encrypted Sessions<br/>httpOnly cookies]
        NoStorage[No PII Storage<br/>localStorage only]
    end
    
    subgraph "External Security"
        APIKeys[API Key Rotation<br/>SerpApi, Groq]
        OAuthScopes[Minimal OAuth Scopes<br/>gmail.send only]
    end
    
    User --> HTTPS
    HTTPS --> CORS
    CORS --> Auth
    Auth --> Validate
    
    Validate --> EnvVars
    Auth --> SessionEncrypt
    Validate --> NoStorage
    
    EnvVars --> APIKeys
    Auth --> OAuthScopes
    
    style HTTPS fill:#4caf50,color:#fff
    style Auth fill:#2196f3,color:#fff
    style EnvVars fill:#ff9800
```

---

## 15. Scalability Roadmap

```mermaid
timeline
    title Scalability Evolution
    
    section MVP (Current)
        localStorage + In-Memory Store : 0-100 users
        Vercel Free Tier : $0/month
        No database setup : 0 infrastructure complexity
    
    section Phase 1 (1-3 months)
        Firebase Firestore : 100-1,000 users
        Vercel Hobby Tier : $20/month
        SerpApi Starter Plan : $50/month
        Add rate limiting : Prevent abuse
    
    section Phase 2 (3-6 months)
        Supabase PostgreSQL : 1,000-10,000 users
        Redis Caching : Reduce API costs
        Vercel Pro Tier : $100/month
        Real-time notifications : WebSockets
    
    section Phase 3 (6-12 months)
        Microservices Architecture : 10,000+ users
        AWS/GCP Multi-region : High availability
        Dedicated Search Service : Elasticsearch
        ML Recommendations : TensorFlow model
```

---

## Legend

**Diagram Symbols**:
- Solid lines (→): Active data flow
- Dashed lines (⇢): Optional/future feature
- Subgraphs: Logical grouping of components
- Colors:
  - 🔵 Blue: Frontend/Client
  - 🟠 Orange: Build/Process
  - 🟣 Purple: AI/ML Services
  - 🟢 Green: External APIs
  - 🔴 Red: Error states

**Mermaid Rendering**:
These diagrams are written in Mermaid syntax and can be rendered in:
- GitHub (native support)
- VS Code (Mermaid Preview extension)
- Mermaid Live Editor (https://mermaid.live)
- Documentation sites (Docusaurus, MkDocs)

---

**Last Updated**: January 22, 2026

