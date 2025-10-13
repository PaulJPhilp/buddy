# Architecture Diagram

This document contains detailed Mermaid diagrams visualizing the buddy application architecture.

## Overall Architecture

```mermaid
graph TB
    subgraph "React Layer"
        UI[UI Components<br/>Pure Presentation]
        Container[Containers<br/>Orchestration & State]
        Hooks[React Hooks<br/>Effect.ts Bridge]
    end

    subgraph "Effect.ts Layer"
        subgraph "Features"
            AppMgr[Application Manager<br/>App State & Lifecycle]
            WorkspaceMgr[Workspace Manager<br/>Workspace State]
            ChatAppsMgr[ChatApps Manager<br/>Command Queue]
            ChatAppMgr[ChatApp Manager<br/>Individual Chat State]
        end

        subgraph "Services"
            ConfigSvc[Config Service<br/>Configuration]
            ChatSvc[Chat Service<br/>Chat Operations]
            BridgeSvc[ChatBridge Service<br/>Inter-App Comm]
            AgentSvc[AgentKit Service<br/>Agent Integration]
        end
    end

    subgraph "Domain Layer"
        Domain[Domain Models<br/>Pure Data Structures]
        UIState[UI State Models<br/>Window, Style, Layout]
    end

    subgraph "External"
        API[Next.js API Routes]
        AI[AI SDKs<br/>Anthropic, OpenAI, etc]
        DB[(Database)]
    end

    UI --> Container
    Container --> Hooks
    Hooks --> AppMgr
    Hooks --> WorkspaceMgr
    Hooks --> ChatAppsMgr

    AppMgr --> WorkspaceMgr
    WorkspaceMgr --> ChatAppsMgr
    ChatAppsMgr --> ChatAppMgr

    ChatAppMgr --> ChatSvc
    ChatAppMgr --> BridgeSvc
    ChatSvc --> AgentSvc

    AppMgr --> ConfigSvc
    WorkspaceMgr --> ConfigSvc

    AppMgr -.-> Domain
    WorkspaceMgr -.-> Domain
    ChatAppsMgr -.-> Domain

    Container -.-> UIState

    ChatSvc --> API
    API --> AI
    ConfigSvc --> DB

    style UI fill:#e1f5fe
    style Container fill:#b3e5fc
    style Hooks fill:#81d4fa
    style AppMgr fill:#fff9c4
    style WorkspaceMgr fill:#fff59d
    style ChatAppsMgr fill:#fff176
    style ChatAppMgr fill:#ffee58
    style ConfigSvc fill:#c8e6c9
    style ChatSvc fill:#a5d6a7
    style BridgeSvc fill:#81c784
    style AgentSvc fill:#66bb6a
```

## Manager Pattern (MDX Structure)

```mermaid
graph LR
    subgraph "Manager Module (MDX Pattern)"
        Index[index.ts<br/>Public Exports]
        API[api.ts<br/>TypeScript Interface<br/>Effect Return Types]
        Service[service.ts<br/>Effect.Service<br/>Implementation]
        Types[types.ts<br/>Domain Types<br/>Validation]
        Errors[errors.ts<br/>Data.TaggedError<br/>Typed Errors]
        Commands[commands.ts<br/>Optional<br/>Command Definitions]
    end

    Index --> API
    Index --> Service
    Index --> Types
    Index --> Errors

    Service --> API
    Service --> Types
    Service --> Errors
    Service --> Commands

    API -.-> Types
    Errors -.-> Types
    Commands -.-> Types

    style Index fill:#90caf9
    style API fill:#64b5f6
    style Service fill:#42a5f5
    style Types fill:#2196f3
    style Errors fill:#1e88e5
    style Commands fill:#1976d2
```

## Command-Driven Manager Flow

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant Hook as React Hook
    participant Mgr as Manager
    participant Queue as Command Queue
    participant Handler as Command Handler
    participant State as State Ref

    UI->>Hook: User Action
    Hook->>Mgr: dispatch(command)
    Mgr->>Queue: Queue.offer(command)

    Note over Queue,Handler: Background Fiber Loop

    Queue->>Handler: Queue.take()
    Handler->>Handler: Validate Command<br/>(Effect Schema)
    Handler->>Handler: Match Command Tag
    Handler->>State: Update State<br/>(Ref.updateAndGet)
    Handler->>Handler: Execute Side Effects
    State-->>Hook: Subscribe Update
    Hook-->>UI: Re-render

    Note over UI,State: Command processed asynchronously
```

## Effect.ts Service Lifecycle

```mermaid
graph TD
    Start([Service Definition]) --> Declare[Declare Effect.Service]
    Declare --> Dependencies{Has Dependencies?}

    Dependencies -->|Yes| ListDeps[List in dependencies array]
    Dependencies -->|No| Init

    ListDeps --> Init[Effect.gen Implementation]
    Init --> YieldDeps[yield* DependencyService]
    YieldDeps --> CreateState[Create State<br/>Ref.make]
    CreateState --> DefineAPI[Define API Methods<br/>Return Effect types]
    DefineAPI --> Export[Export Service Class]

    Export --> Runtime([Runtime Provides Dependencies])
    Runtime --> Execute[Execute Effects]
    Execute --> Errors{Error Occurs?}

    Errors -->|Yes| MapError[Effect.mapError<br/>to Domain Error]
    Errors -->|No| Success[Return Success]

    MapError --> Handle[Error Handler<br/>or Propagate]
    Success --> End([Effect Complete])
    Handle --> End

    style Start fill:#c8e6c9
    style Declare fill:#a5d6a7
    style Init fill:#81c784
    style DefineAPI fill:#66bb6a
    style Export fill:#4caf50
    style Runtime fill:#43a047
    style Execute fill:#388e3c
    style Success fill:#2e7d32
    style MapError fill:#f44336
    style Handle fill:#e53935
```

## React Integration Pattern

```mermaid
graph TB
    subgraph "Effect.ts Domain"
        Manager[Manager Service<br/>Business Logic & State]
        ManagerAPI[Manager API<br/>Effect&lt;A,E,R&gt; Methods]
        StateRef[State Ref<br/>Atomic State]
    end

    subgraph "React Bridge"
        Hook[React Hook<br/>useFeatureManager]
        Subscribe[Subscribe Pattern<br/>Effect.runSync]
        ReactState[React State<br/>useState]
        Callbacks[Callbacks<br/>useCallback + runPromise]
    end

    subgraph "React UI"
        Container[Container Component<br/>Loading/Error/Empty]
        UIComp[UI Component<br/>Pure Presentation]
        Props[Props<br/>Primitives Only]
    end

    Manager --> ManagerAPI
    Manager --> StateRef

    Hook --> Subscribe
    Subscribe --> Manager
    StateRef -.->|State Updates| Subscribe
    Subscribe --> ReactState

    Hook --> Callbacks
    Callbacks --> ManagerAPI

    Container --> Hook
    Hook -.->|state & callbacks| Container

    Container --> Props
    Props --> UIComp

    style Manager fill:#fff9c4
    style ManagerAPI fill:#fff59d
    style StateRef fill:#fff176
    style Hook fill:#81d4fa
    style Subscribe fill:#4fc3f7
    style ReactState fill:#29b6f6
    style Callbacks fill:#03a9f4
    style Container fill:#b3e5fc
    style UIComp fill:#e1f5fe
```

## Feature Folder Structure

```mermaid
graph TB
    Feature[features/feature-name/]

    Feature --> Manager[manager/<br/>MDX Pattern]
    Feature --> Components[components/<br/>UI Components]
    Feature --> Container[container/<br/>React Integration]
    Feature --> Hooks[hooks/<br/>React Hooks]
    Feature --> Domain[domain/<br/>Domain Models]
    Feature --> UIState[ui-state/<br/>UI Models]
    Feature --> Utils[utils/<br/>Utilities]
    Feature --> SubFeatures[features/<br/>Nested Features]

    Manager --> MgrService[service.ts]
    Manager --> MgrAPI[api.ts]
    Manager --> MgrTypes[types.ts]
    Manager --> MgrErrors[errors.ts]
    Manager --> MgrIndex[index.ts]

    SubFeatures -.->|Recursive| Feature

    style Feature fill:#e1bee7
    style Manager fill:#ce93d8
    style Components fill:#ba68c8
    style Container fill:#ab47bc
    style Hooks fill:#9c27b0
    style Domain fill:#8e24aa
    style UIState fill:#7b1fa2
    style Utils fill:#6a1b9a
    style SubFeatures fill:#4a148c
```

## Error Handling Flow

```mermaid
graph TB
    Start([Operation Start]) --> Effect[Effect Operation]
    Effect --> Try{Try Operation}

    Try -->|Success| Map[Effect.map<br/>Transform Result]
    Try -->|Exception| Catch[Effect.try<br/>Catches Exception]

    Catch --> MapError[Effect.mapError<br/>to Domain Error]

    Map --> Return([Return Success])

    MapError --> Tagged[Data.TaggedError<br/>with Context]
    Tagged --> Handler{Error Handler?}

    Handler -->|Yes| Recover[Effect.catchAll<br/>Recovery Logic]
    Handler -->|No| Propagate[Propagate Error<br/>Up the Chain]

    Recover --> Retry{Retry Logic?}
    Retry -->|Yes| Effect
    Retry -->|No| Fallback[Return Fallback]

    Fallback --> Return
    Propagate --> End([Effect Fails])

    style Start fill:#c8e6c9
    style Effect fill:#a5d6a7
    style Try fill:#81c784
    style Map fill:#66bb6a
    style Return fill:#4caf50
    style Catch fill:#ffb74d
    style MapError fill:#ffa726
    style Tagged fill:#ff9800
    style Handler fill:#fb8c00
    style Recover fill:#f57c00
    style Propagate fill:#e65100
    style End fill:#d84315
```

## Data Flow: User Action to UI Update

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Component
    participant Container
    participant Hook as useManager Hook
    participant Manager as Manager Service
    participant Ref as State Ref
    participant Effect as Effect Runtime

    User->>UI: Click/Input
    UI->>Container: Event Handler
    Container->>Hook: Call Callback
    Hook->>Effect: runPromise(operation)
    Effect->>Manager: Execute Effect
    Manager->>Manager: Business Logic
    Manager->>Ref: Ref.updateAndGet
    Ref->>Ref: Atomic Update
    Ref-->>Manager: New State
    Manager-->>Hook: Subscribe Notification
    Hook->>Hook: setState(newState)
    Hook-->>Container: Re-render
    Container-->>UI: Updated Props
    UI-->>User: Visual Update

    Note over User,User: Complete Flow:<br/>User → Effect → State → UI
```

## Service vs Manager Decision Tree

```mermaid
graph TD
    Start{New Functionality<br/>Needed}

    Start --> Question1{Feature-Specific<br/>or Cross-Cutting?}

    Question1 -->|Feature-Specific| Question2{Owns Domain State?}
    Question1 -->|Cross-Cutting| Service[Create Service]

    Question2 -->|Yes| Manager[Create Manager]
    Question2 -->|No| Question3{Reusable Utility?}

    Question3 -->|Yes| Service
    Question3 -->|No| Utils[Create Utility Function]

    Manager --> MgrLocation[Location:<br/>features/*/manager/]
    Service --> SvcLocation[Location:<br/>services/*/]
    Utils --> UtilsLocation[Location:<br/>utils/]

    Manager --> MgrProps[Properties:<br/>- Owns state via Ref<br/>- Feature business logic<br/>- Subscribe pattern<br/>- Command queue optional]

    Service --> SvcProps[Properties:<br/>- Stateless or minimal state<br/>- Cross-cutting concerns<br/>- Reusable operations<br/>- External integrations]

    Utils --> UtilsProps[Properties:<br/>- Pure functions<br/>- No Effect types<br/>- Simple transforms<br/>- Type utilities]

    style Start fill:#e1f5fe
    style Question1 fill:#b3e5fc
    style Question2 fill:#81d4fa
    style Question3 fill:#4fc3f7
    style Manager fill:#fff9c4
    style Service fill:#c8e6c9
    style Utils fill:#f8bbd0
    style MgrProps fill:#fff176
    style SvcProps fill:#81c784
    style UtilsProps fill:#f48fb1
```

## Dependency Injection & Layer Composition

```mermaid
graph TB
    subgraph "Application Layer"
        App[Application Entry]
        Runtime[Effect Runtime]
    end

    subgraph "Manager Layer"
        AppMgr[Application Manager]
        WorkspaceMgr[Workspace Manager]
        ChatAppsMgr[ChatApps Manager]
    end

    subgraph "Service Layer"
        ConfigSvc[Config Service]
        ChatSvc[Chat Service]
        AgentSvc[AgentKit Service]
    end

    subgraph "Infrastructure Layer"
        DB[Database Layer]
        HTTP[HTTP Client Layer]
        FileSystem[FileSystem Layer]
    end

    App --> Runtime
    Runtime -->|Provides| AppMgr

    AppMgr -.->|depends on| ConfigSvc
    AppMgr -.->|depends on| WorkspaceMgr

    WorkspaceMgr -.->|depends on| ConfigSvc
    WorkspaceMgr -.->|depends on| ChatAppsMgr

    ChatAppsMgr -.->|depends on| ChatSvc

    ChatSvc -.->|depends on| AgentSvc
    ChatSvc -.->|depends on| HTTP

    ConfigSvc -.->|depends on| DB
    AgentSvc -.->|depends on| HTTP

    style App fill:#1a237e
    style Runtime fill:#283593
    style AppMgr fill:#3949ab
    style WorkspaceMgr fill:#3f51b5
    style ChatAppsMgr fill:#5c6bc0
    style ConfigSvc fill:#7986cb
    style ChatSvc fill:#9fa8da
    style AgentSvc fill:#c5cae9
    style DB fill:#ef5350
    style HTTP fill:#ec407a
    style FileSystem fill:#ab47bc
```

## Testing Architecture

```mermaid
graph TB
    subgraph "Test Types"
        Unit[Unit Tests<br/>*.test.ts]
        Integration[Integration Tests<br/>__tests__/integration/]
        E2E[E2E Tests<br/>*.spec.ts]
    end

    subgraph "Test Infrastructure"
        Vitest[Vitest Runner]
        Playwright[Playwright Runner]
        TestClock[TestClock<br/>Deterministic Time]
        TestLayers[Test Layers<br/>Mock Services]
    end

    subgraph "Testing Patterns"
        EffectRun[Effect.runPromise<br/>in tests]
        LayerProvide[Layer.provide<br/>Test Dependencies]
        MockState[Mock State Ref]
        AssertError[Assert Typed Errors]
    end

    Unit --> Vitest
    Integration --> Vitest
    E2E --> Playwright

    Vitest --> EffectRun
    Vitest --> LayerProvide
    Vitest --> TestClock
    Vitest --> TestLayers

    EffectRun --> MockState
    LayerProvide --> MockState
    TestClock --> EffectRun
    TestLayers --> LayerProvide

    MockState --> AssertError

    style Unit fill:#a5d6a7
    style Integration fill:#81c784
    style E2E fill:#66bb6a
    style Vitest fill:#4fc3f7
    style Playwright fill:#29b6f6
    style TestClock fill:#03a9f4
    style TestLayers fill:#039be5
    style EffectRun fill:#fff59d
    style LayerProvide fill:#fff176
    style MockState fill:#ffee58
    style AssertError fill:#ffd54f
```

---

## Architecture Principles Summary

1. **Separation of Concerns**: React UI, Effect.ts business logic, pure domain models
2. **Unidirectional Data Flow**: User → Effect → State → UI
3. **Type Safety**: TypeScript + Effect types + Schema validation
4. **Dependency Injection**: Services declare dependencies, runtime provides
5. **Error Handling**: Typed errors throughout, no exceptions
6. **Testability**: Pure functions, mock layers, deterministic time
7. **Composability**: Effects compose, managers compose, services compose
8. **State Management**: Atomic updates via Ref, subscribe pattern for React
