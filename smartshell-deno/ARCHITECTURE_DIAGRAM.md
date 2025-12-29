# SmartShell Deno - Architecture Diagrams

## Overall System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[UI Components]
        FC[Frontend Controllers]
        FS[Frontend Services]
        FM[Frontend Models]
        FE[Event Bus]
    end

    subgraph "API Gateway"
        MW[Middleware Stack]
        RT[Router]
    end

    subgraph "Backend Application Layer"
        BC[Backend Controllers]
        BS[Backend Services]
        V[Validators]
        DTO[DTOs]
    end

    subgraph "Backend Domain Layer"
        E[Entities]
        VO[Value Objects]
        RI[Repository Interfaces]
        SI[Service Interfaces]
    end

    subgraph "Backend Infrastructure Layer"
        R[Repository Implementations]
        SA[SmartShell Adapter]
        TM[Token Manager]
        SEC[Security Provider]
    end

    subgraph "External Systems"
        SS[SmartShell API]
        DB[(Database)]
    end

    UI --> FC
    FC --> FS
    FC --> FE
    FS --> FM
    FE --> FC

    FS -.->|HTTP Requests| MW
    MW --> RT
    RT --> BC

    BC --> BS
    BC --> V
    BC --> DTO
    BS --> SI
    V --> DTO

    BS --> RI
    RI --> R
    R --> SA
    R --> TM
    R --> SEC

    SA -.->|GraphQL| SS
    TM -.->|Session Data| DB
```

## Backend MVC Architecture

```mermaid
graph TB
    subgraph "Presentation Layer"
        C1[AuthController]
        C2[BookingController]
        C3[HostController]
        C4[PaymentController]
        C5[AchievementController]
    end

    subgraph "Application Layer"
        S1[AuthService]
        S2[BookingService]
        S3[HostService]
        S4[PaymentService]
        S5[AchievementService]
        
        V1[AuthValidator]
        V2[BookingValidator]
        V3[PaymentValidator]
        
        DTO1[Request DTOs]
        DTO2[Response DTOs]
    end

    subgraph "Domain Layer"
        E1[User Entity]
        E2[Host Entity]
        E3[Booking Entity]
        E4[Payment Entity]
        
        VO1[Money Value Object]
        VO2[TimeRange Value Object]
        
        IRepo[IRepository Interface]
        IService[IService Interface]
    end

    subgraph "Infrastructure Layer"
        R1[HostRepository]
        R2[BookingRepository]
        R3[ClientRepository]
        R4[PaymentRepository]
        
        SA[SmartShell Adapter]
        TM[Token Manager]
        SEC[Security Provider]
    end

    C1 --> S1
    C2 --> S2
    C3 --> S3
    C4 --> S4
    C5 --> S5

    S1 --> V1
    S2 --> V2
    S4 --> V3

    S1 --> DTO1
    S1 --> DTO2
    S2 --> DTO1
    S2 --> DTO2

    S1 --> IRepo
    S2 --> IRepo
    S3 --> IRepo
    S4 --> IRepo

    IRepo --> R1
    IRepo --> R2
    IRepo --> R3
    IRepo --> R4

    R1 --> SA
    R2 --> SA
    R3 --> SA
    R4 --> SA

    S1 --> TM
    S1 --> SEC
```

## Frontend MVC Architecture

```mermaid
graph TB
    subgraph "View Layer"
        COMP[Reusable Components]
        PAGES[Page Components]
        PARTIALS[UI Partials]
    end

    subgraph "Controller Layer"
        AC[AuthController]
        BC[BookingController]
        HC[HostController]
        MC[MapController]
        MODC[ModalController]
    end

    subgraph "Service Layer"
        AS[AuthService]
        BS[BookingService]
        HS[HostService]
        APS[ApiService]
        SS[StorageService]
    end

    subgraph "Model Layer"
        M1[User Model]
        M2[Host Model]
        M3[Booking Model]
        M4[Payment Model]
    end

    subgraph "Event System"
        EB[Event Bus]
        EVENTS[Event Types]
    end

    COMP --> AC
    PAGES --> BC
    PAGES --> HC
    PAGES --> MC
    PARTIALS --> MODC

    AC --> AS
    BC --> BS
    HC --> HS
    MC --> HS
    MODC --> BS

    AS --> APS
    BS --> APS
    HS --> APS
    AS --> SS

    AS --> M1
    BS --> M3
    HS --> M2
    APS --> M4

    AC --> EB
    BC --> EB
    HC --> EB
    MC --> EB
    MODC --> EB

    EB --> EVENTS
```

## Dependency Injection Flow

```mermaid
graph LR
    subgraph "Container Setup"
        DC[DI Container]
        ST[Service Tokens]
        REG[Registrations]
    end

    subgraph "Service Resolution"
        CTRL[Controllers]
        SVC[Services]
        REPO[Repositories]
        INFRA[Infrastructure]
    end

    ST --> DC
    REG --> DC

    DC --> CTRL
    DC --> SVC
    DC --> REPO
    DC --> INFRA

    CTRL --> SVC
    SVC --> REPO
    REPO --> INFRA
```

## Request Flow Diagram

```mermaid
sequenceDiagram
    participant Client
    participant MW as Middleware Stack
    participant CTRL as Controller
    participant SVC as Service
    participant REPO as Repository
    participant API as SmartShell API

    Client->>MW: HTTP Request
    MW->>MW: CORS Check
    MW->>MW: Rate Limiting
    MW->>MW: Authentication
    MW->>CTRL: Forward Request

    CTRL->>CTRL: Validate Input
    CTRL->>SVC: Call Service Method

    SVC->>REPO: Get Data
    REPO->>API: GraphQL Query
    API-->>REPO: Response Data
    REPO-->>SVC: Domain Objects
    SVC->>SVC: Apply Business Logic
    SVC-->>CTRL: Result

    CTRL->>CTRL: Format Response
    CTRL-->>MW: HTTP Response
    MW-->>Client: HTTP Response
```

## Frontend Component Interaction

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Component
    participant CTRL as Controller
    participant SVC as Service
    participant API as API Service
    participant EB as Event Bus

    User->>UI: User Action
    UI->>CTRL: Trigger Event
    CTRL->>SVC: Call Service Method
    SVC->>API: HTTP Request
    API-->>SVC: Response
    SVC->>CTRL: Processed Data
    CTRL->>EB: Emit Event
    EB->>UI: Update UI
    UI->>User: Display Result

    Note over UI,EB: Event-driven communication between components
```

## Data Flow Architecture

```mermaid
graph TD
    subgraph "Frontend"
        UI_STATE[UI State]
        LOCAL_STORE[Local Storage]
        CACHE[Frontend Cache]
    end

    subgraph "API Layer"
        HTTP[HTTP Requests]
        AUTH[Authentication Headers]
    end

    subgraph "Backend"
        SESSION[Session Management]
        VALIDATION[Input Validation]
        BUSINESS_LOGIC[Business Logic]
    end

    subgraph "Data Layer"
        API_CACHE[API Cache]
        SMARTSHELL[SmartShell API]
        SESSION_STORE[Session Store]
    end

    UI_STATE --> LOCAL_STORE
    LOCAL_STORE --> CACHE
    CACHE --> HTTP

    HTTP --> AUTH
    AUTH --> SESSION
    SESSION --> VALIDATION
    VALIDATION --> BUSINESS_LOGIC

    BUSINESS_LOGIC --> API_CACHE
    API_CACHE --> SMARTSHELL
    BUSINESS_LOGIC --> SESSION_STORE

    SMARTSHELL --> API_CACHE
    SESSION_STORE --> SESSION
```

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        AUTH_L[Authentication Layer]
        AUTHZ[Authorization Layer]
        VALID[Input Validation]
        RATE[Rate Limiting]
        CORS[CORS Protection]
        SAN[Data Sanitization]
    end

    subgraph "Security Components"
        TM[Token Manager]
        SEC_UTILS[Security Utils]
        MIDDLEWARE[Security Middleware]
    end

    subgraph "Security Features"
        SESSION[Session Management]
        IP_CHECK[IP Verification]
        UA_CHECK[User Agent Check]
        XSS[XSS Protection]
        SQL[SQL Injection Protection]
        CSRF[CSRF Protection]
    end

    AUTH_L --> TM
    AUTHZ --> TM
    VALID --> SEC_UTILS
    RATE --> SEC_UTILS
    CORS --> MIDDLEWARE
    SAN --> SEC_UTILS

    TM --> SESSION
    TM --> IP_CHECK
    TM --> UA_CHECK
    SEC_UTILS --> XSS
    SEC_UTILS --> SQL
    SEC_UTILS --> CSRF
```

## Error Handling Flow

```mermaid
graph TB
    subgraph "Error Sources"
        CLIENT[Client Errors]
        NETWORK[Network Errors]
        VALIDATION[Validation Errors]
        BUSINESS[Business Logic Errors]
        SYSTEM[System Errors]
    end

    subgraph "Error Handling"
        CATCH[Error Catchers]
        LOG[Error Logging]
        FORMAT[Error Formatting]
        NOTIFY[Error Notifications]
    end

    subgraph "Error Responses"
        CLIENT_RESP[Client Response]
        LOG_RESP[Log Response]
        MONITOR[Monitoring System]
    end

    CLIENT --> CATCH
    NETWORK --> CATCH
    VALIDATION --> CATCH
    BUSINESS --> CATCH
    SYSTEM --> CATCH

    CATCH --> LOG
    CATCH --> FORMAT
    CATCH --> NOTIFY

    LOG --> LOG_RESP
    FORMAT --> CLIENT_RESP
    NOTIFY --> MONITOR
```

## Testing Architecture

```mermaid
graph TB
    subgraph "Test Types"
        UNIT[Unit Tests]
        INTEG[Integration Tests]
        E2E[End-to-End Tests]
        PERF[Performance Tests]
    end

    subgraph "Test Components"
        MOCK[Mock Objects]
        STUB[Stub Implementations]
        FIXTURES[Test Fixtures]
        UTILS[Test Utilities]
    end

    subgraph "Test Infrastructure"
        RUNNER[Test Runner]
        COVERAGE[Coverage Reports]
        CI[CI/CD Pipeline]
    end

    UNIT --> MOCK
    INTEG --> STUB
    E2E --> FIXTURES
    PERF --> UTILS

    MOCK --> RUNNER
    STUB --> RUNNER
    FIXTURES --> RUNNER
    UTILS --> RUNNER

    RUNNER --> COVERAGE
    RUNNER --> CI
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        DEV_LOCAL[Local Development]
        DEV_DB[Local Database]
        DEV_ENV[Dev Environment]
    end

    subgraph "Staging"
        STAGE_SERVER[Staging Server]
        STAGE_DB[Staging Database]
        STAGE_ENV[Staging Environment]
    end

    subgraph "Production"
        PROD_SERVER[Production Server]
        PROD_DB[Production Database]
        PROD_ENV[Production Environment]
    end

    subgraph "Infrastructure"
        LOAD_BAL[Load Balancer]
        MONITOR[Monitoring]
        BACKUP[Backup System]
    end

    DEV_LOCAL --> DEV_ENV
    DEV_ENV --> STAGE_ENV
    STAGE_ENV --> PROD_ENV

    PROD_SERVER --> LOAD_BAL
    LOAD_BAL --> MONITOR
    PROD_DB --> BACKUP
```

## Migration Strategy

```mermaid
graph LR
    subgraph "Phase 1: Foundation"
        DI[Dependency Injection]
        INTERFACES[Domain Interfaces]
        BASE[Base Classes]
    end

    subgraph "Phase 2: Backend"
        REPOS[Repositories]
        SERVICES[Services]
        CONTROLLERS[Controllers]
    end

    subgraph "Phase 3: Frontend"
        COMPONENTS[UI Components]
        SERVICES_F[Frontend Services]
        CONTROLLERS_F[Frontend Controllers]
    end

    subgraph "Phase 4: Integration"
        TESTING[Comprehensive Testing]
        MIGRATION[Data Migration]
        MONITORING[Monitoring Setup]
    end

    DI --> REPOS
    INTERFACES --> SERVICES
    BASE --> CONTROLLERS

    REPOS --> COMPONENTS
    SERVICES --> SERVICES_F
    CONTROLLERS --> CONTROLLERS_F

    COMPONENTS --> TESTING
    SERVICES_F --> MIGRATION
    CONTROLLERS_F --> MONITORING