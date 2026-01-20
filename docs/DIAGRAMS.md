# System Diagrams

## 1. System Context Diagram

High-level view of how users interact with the NorthStar Works platform and external systems.

```mermaid
graph TB
    User[Job Seeker / Claimant]

    subgraph "NorthStar Works Platform"
        WebApp[Next.js Web Application]
        API[FastAPI Backend Service]
        DB[(Firebase Firestore)]
    end

    subgraph "External Systems"
        Google[Google Jobs (SerpApi)]
        Groq[Groq AI Platform]
        AuthService[Firebase Auth]
    end

    User -->|Uses| WebApp
    WebApp -->|Authenticates| AuthService
    WebApp -->|API Requests| API

    API -->|Fetch Jobs| Google
    API -->|Generate Content| Groq
    API -->|Read/Write| DB
```

## 2. Job Search Sequence

How a user searches for jobs and gets AI-enhanced results.

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend (React)
    participant API as Python API
    participant SERP as SerpApi
    participant LLM as Groq LLM

    U->>FE: Enters "Software Engineer" in MN
    FE->>API: GET /api/v1/search?q=Software&l=MN

    par Fetch Jobs
        API->>SERP: Search Google Jobs
        SERP-->>API: Raw Job Results JSON
    and AI Suggestions
        API->>LLM: "Suggest related roles for Software Engineer"
        LLM-->>API: "DevOps, Full Stack..."
    end

    API->>API: Calculate Freshness Scores
    API->>FE: Return { jobs, suggestions }
    FE->>U: Display Job Cards & Chips
```

## 3. Application Submission Flow

The process of logging a work search activity / application.

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Backend API
    participant DB as Firestore

    U->>FE: Click "Apply" on Job Card
    FE->>U: Redirect to Employer Site

    Note over U, FE: User completes application on external site

    U->>FE: Click "Track Application"
    FE->>API: POST /api/v1/work-log { jobId, details }

    API->>DB: Save Application Record
    DB-->>API: Success

    API->>FE: Return Success
    FE->>FE: Update Points & Weekly Goal (+25pts)
    FE->>U: Show "Application Logged" Toast
```

## 4. Application Status State Machine

The lifecycle of an Unemployment Insurance application within the system.

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Submitted: User Files Claim
    Submitted --> Reviewing: System Auto-Check

    state Reviewing {
        [*] --> IdentityCheck
        IdentityCheck --> IncomeVerification
        IncomeVerification --> [*]
    }

    Reviewing --> DeterminationPending: Manual Review Needed
    Reviewing --> Approved: Auto-Approve

    DeterminationPending --> Approved: Admin Approval
    DeterminationPending --> Denied: Ineligible

    Approved --> PaymentIssued: Weekly Request Filed
    PaymentIssued --> [*]

    Denied --> Appeal
    Appeal --> Reviewing
```

## 5. Component Hierarchy (Simplified)

```mermaid
graph TD
    Root[Layout]
    Root --> NavBar
    Root --> PageContent

    PageContent --> Landing[Home Page]
    PageContent --> Dashboard[Dashboard Page]
    PageContent --> Search[Job Search Page]

    Search --> SearchBar
    Search --> FilterPanel
    Search --> JobCardList
    JobCardList --> JobCard

    Dashboard --> StatusTracker
    Dashboard --> ActionCenter
    Dashboard --> WorkLogList

    NavBar --> AuthWidget
```
