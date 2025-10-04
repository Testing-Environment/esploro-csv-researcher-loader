# Esploro CSV Asset Loader - Architecture Diagrams

This document provides visual reference diagrams for understanding the system architecture, data flow, and component relationships.

## Table of Contents
1. [System Architecture](#1-system-architecture)
2. [Data Flow Diagrams](#2-data-flow-diagrams)
3. [Component Hierarchy](#3-component-hierarchy)
4. [Data Model Relationships](#4-data-model-relationships)
5. [CSV to Asset Mapping](#5-csv-to-asset-mapping)
6. [State Management](#6-state-management)
7. [Validation Flow](#7-validation-flow)
8. [Security Architecture](#8-security-architecture)
9. [Performance Optimization](#9-performance-optimization)
10. [UI Component Tree](#10-ui-component-tree)

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Esploro CSV Asset Loader                      │
│                      Cloud App Architecture                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     Main     │  │   Settings   │  │   Profile    │          │
│  │  Component   │  │  Component   │  │  Component   │          │
│  │              │  │              │  │              │          │
│  │ - CSV Upload │  │ - Profile    │  │ - Field      │          │
│  │ - Processing │  │   Management │  │   Mapping    │          │
│  │ - Results    │  │ - Field      │  │ - Import/    │          │
│  │   Display    │  │   Groups     │  │   Export     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │   Asset Service      │  │   App Service        │            │
│  │                      │  │                      │            │
│  │ - GET /assets/{id}   │  │ - Settings Storage   │            │
│  │ - POST /assets       │  │ - Profile Management │            │
│  │ - PUT /assets/{id}   │  │ - State Management   │            │
│  │ - File Operations    │  │                      │            │
│  └──────────────────────┘  └──────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA/API LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐      │
│  │     Ex Libris Cloud App Angular Library             │      │
│  │                                                       │      │
│  │  - CloudAppRestService (HTTP Wrapper)                │      │
│  │  - CloudAppStoreService (Local Storage)              │      │
│  │  - AlertService (User Notifications)                 │      │
│  │  - Authentication & Authorization                    │      │
│  └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ESPLORO API ENDPOINTS                          │
├─────────────────────────────────────────────────────────────────┤
│  • GET  /esploro/v1/assets/{id}                                 │
│  • POST /esploro/v1/assets                                      │
│  • PUT  /esploro/v1/assets/{id}                                 │
│  • POST /esploro/v1/assets/{id}?op=patch&action=add             │
│  • GET  /conf/code-tables/AssetFileTypes                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow Diagrams

### 2.1 ADD Asset Operation (Create New Asset)

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Upload CSV
     │    with asset data
     ▼
┌─────────────────┐
│ Main Component  │
├─────────────────┤
│ • Parse CSV     │
│ • Validate      │
└────┬────────────┘
     │ 2. For each row
     ▼
┌─────────────────────┐
│ Profile Mapper      │
├─────────────────────┤
│ mapAsset(row,       │
│          profile)   │
│                     │
│ • Map CSV columns   │
│   to asset fields   │
│ • Apply defaults    │
│ • Convert types     │
└────┬────────────────┘
     │ 3. Asset object
     ▼
┌─────────────────────┐
│  Asset Service      │
├─────────────────────┤
│ create(asset)       │
│                     │
│ POST /esploro/v1/   │
│      assets         │
└────┬────────────────┘
     │ 4. HTTP Request
     ▼
┌─────────────────────┐
│  Esploro API        │
├─────────────────────┤
│ • Validate          │
│ • Create record     │
│ • Return asset ID   │
└────┬────────────────┘
     │ 5. Success/Error
     ▼
┌─────────────────────┐
│  Main Component     │
├─────────────────────┤
│ • Log result        │
│ • Update UI         │
│ • Show alert        │
└─────────────────────┘
```

### 2.2 UPDATE Asset Operation (Modify Existing Asset)

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Upload CSV
     │    with asset IDs
     ▼
┌─────────────────┐
│ Main Component  │
├─────────────────┤
│ • Parse CSV     │
│ • Validate ID   │
└────┬────────────┘
     │ 2. For each row
     ▼
┌─────────────────────┐
│  Asset Service      │
├─────────────────────┤
│ get(asset.id)       │
│                     │
│ GET /esploro/v1/    │
│     assets/{id}     │
└────┬────────────────┘
     │ 3. Existing asset
     ▼
┌─────────────────────┐
│ Profile Mapper      │
├─────────────────────┤
│ mapAsset(row,       │
│          profile)   │
│                     │
│ • Map CSV updates   │
│ • Merge with        │
│   existing data     │
└────┬────────────────┘
     │ 4. Updated asset
     ▼
┌─────────────────────┐
│  Asset Service      │
├─────────────────────┤
│ update(asset)       │
│                     │
│ PUT /esploro/v1/    │
│     assets/{id}     │
└────┬────────────────┘
     │ 5. HTTP Request
     ▼
┌─────────────────────┐
│  Esploro API        │
├─────────────────────┤
│ • Validate          │
│ • Update record     │
│ • Return updated    │
└────┬────────────────┘
     │ 6. Success/Error
     ▼
┌─────────────────────┐
│  Main Component     │
├─────────────────────┤
│ • Log result        │
│ • Update UI         │
│ • Show alert        │
└─────────────────────┘
```

### 2.3 File Upload to Asset Operation

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Enter Asset ID
     │    & File details
     ▼
┌─────────────────────┐
│  Main Component     │
├─────────────────────┤
│ Form validation:    │
│ • Asset ID required │
│ • File URL (HTTP/S) │
│ • File type         │
│ • Title/description │
└────┬────────────────┘
     │ 2. Build payload
     ▼
┌─────────────────────┐
│  Asset Service      │
├─────────────────────┤
│ addFilesToAsset(    │
│   assetId,          │
│   files[]           │
│ )                   │
│                     │
│ POST /esploro/v1/   │
│   assets/{id}?      │
│   op=patch&         │
│   action=add        │
└────┬────────────────┘
     │ 3. PATCH request
     │    with temporary.
     │    linksToExtract
     ▼
┌─────────────────────┐
│  Esploro API        │
├─────────────────────┤
│ • Queue files for   │
│   ingestion         │
│ • Validate URLs     │
└────┬────────────────┘
     │ 4. Success/Error
     ▼
┌─────────────────────┐
│  Main Component     │
├─────────────────────┤
│ • Show success msg  │
│ • Reset form        │
│ • Keep Asset ID     │
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  User Action        │
├─────────────────────┤
│ 1. Create itemized  │
│    set with assets  │
│ 2. Run "Load files" │
│    job in Esploro   │
└─────────────────────┘
```

---

## 3. Component Hierarchy

```
AppComponent (Root)
│
├── AppRoutingModule
│   │
│   ├── Route: '' (Main)
│   │   └── MainComponent
│   │       ├── Form: Asset ID + Files
│   │       ├── File Type Selector (Material Select)
│   │       ├── Dynamic File List (FormArray)
│   │       └── Submit Button
│   │
│   └── Route: 'settings'
│       └── SettingsComponent
│           ├── Profile List (Material Table)
│           ├── Profile Actions (Edit/Delete/Clone)
│           └── Profile Dialog
│               └── ProfileComponent
│                   ├── Profile Type Selector
│                   ├── Field Mapping Grid
│                   ├── Import/Export Buttons
│                   └── Save/Cancel Actions
│
└── Shared Services
    ├── AssetService (API calls)
    ├── AppService (Settings & State)
    └── AlertService (Ex Libris library)
```

---

## 4. Data Model Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                        Settings Model                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Profile Model                             │
├─────────────────────────────────────────────────────────────────┤
│ • id: string                                                     │
│ • name: string                                                   │
│ • description: string                                            │
│ • type: 'ADD' | 'UPDATE'                                         │
│ • fields: Field[]                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Field Model                              │
├─────────────────────────────────────────────────────────────────┤
│ • header: string        (CSV column name)                        │
│ • fieldName: string     (Esploro API field path)                 │
│ • group: string         (Field category)                         │
│ • default?: any         (Default value if CSV empty)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Maps to
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Asset Model                              │
├─────────────────────────────────────────────────────────────────┤
│ Required Fields (ADD):                                           │
│ • title: string                                                  │
│ • asset_type: { value: string }                                  │
│ • organization: { value: string }                                │
│                                                                  │
│ Required Fields (UPDATE):                                        │
│ • id: string                                                     │
│                                                                  │
│ Optional Fields:                                                 │
│ • authors: { author: Author[] }                                  │
│ • identifiers: { identifier: Identifier[] }                      │
│ • abstracts: { abstract: Abstract[] }                            │
│ • keywords: { keyword: Keyword[] }                               │
│ • publication_date: string                                       │
│ • journal: Journal                                               │
│ • conference: Conference                                         │
│ • urls: { url: Url[] }                                           │
│ • rights: Rights                                                 │
│ • funding: { funding: Funding[] }                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    AssetFileLink Model                           │
├─────────────────────────────────────────────────────────────────┤
│ • title: string                                                  │
│ • url: string (HTTP/HTTPS)                                       │
│ • description?: string                                           │
│ • type: string (from code table)                                 │
│ • supplemental: boolean                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. CSV to Asset Mapping

```
CSV File                Profile Mapping               Asset API Object
┌─────────────┐        ┌──────────────┐             ┌─────────────────┐
│ Title       │───────▶│ header:      │────────────▶│ title           │
│             │        │  "Title"     │             │                 │
│             │        │ fieldName:   │             │                 │
│             │        │  "title"     │             │                 │
└─────────────┘        └──────────────┘             └─────────────────┘

┌─────────────┐        ┌──────────────┐             ┌─────────────────┐
│ Type        │───────▶│ header:      │────────────▶│ asset_type {    │
│             │        │  "Type"      │             │   value: "..."  │
│             │        │ fieldName:   │             │ }               │
│             │        │  "asset_type.│             │                 │
│             │        │   value"     │             │                 │
└─────────────┘        └──────────────┘             └─────────────────┘

┌─────────────┐        ┌──────────────┐             ┌─────────────────┐
│ Author1_    │───────▶│ header:      │────────────▶│ authors {       │
│ FirstName   │        │  "Author1_   │             │   author: [     │
│             │        │   FirstName" │             │     {           │
│             │        │ fieldName:   │             │       first_    │
│             │        │  "authors.   │             │       name: "…" │
│             │        │   author[].  │             │     }           │
│             │        │   first_name"│             │   ]             │
│             │        │              │             │ }               │
└─────────────┘        └──────────────┘             └─────────────────┘

┌─────────────┐        ┌──────────────┐             ┌─────────────────┐
│ DOI         │───────▶│ header: "DOI"│────────────▶│ identifiers {   │
│             │        │ fieldName:   │             │   identifier: [ │
│             │        │  "identifiers│             │     {           │
│             │        │   .identifier│             │       type: {   │
│             │        │   [].value"  │             │         value:  │
│             │        │ default:     │             │         "DOI"   │
│             │        │  { type.     │             │       },        │
│             │        │    value:    │             │       value:    │
│             │        │    "DOI" }   │             │       "10.xxx"  │
│             │        │              │             │     }           │
│             │        │              │             │   ]             │
│             │        │              │             │ }               │
└─────────────┘        └──────────────┘             └─────────────────┘

Mapping Logic:
1. CSV header matches Profile.field.header
2. CSV value is assigned to Profile.field.fieldName
3. Array fields (e.g., author[]) create multiple entries
4. Dot notation (e.g., "asset_type.value") creates nested objects
5. Default values fill in when CSV cell is empty
6. Type conversion (string "true" → boolean true)
```

---

## 6. State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application State Flow                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Angular Router  │
│                  │
│  Routes:         │
│  • /             │
│  • /settings     │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                   CloudAppStoreService                           │
│                    (Persistent Storage)                          │
├──────────────────────────────────────────────────────────────────┤
│  Key: 'settings'                                                 │
│  Value: Settings {                                               │
│    profiles: Profile[]                                           │
│  }                                                               │
│                                                                  │
│  • get() - Retrieve settings                                     │
│  • set() - Persist settings                                      │
│  • Survives page refresh                                         │
│  • Scoped to Cloud App instance                                  │
└──────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                        AppService                                │
│                   (Business Logic Layer)                         │
├──────────────────────────────────────────────────────────────────┤
│  • getSettings(): Observable<Settings>                           │
│  • setSettings(s: Settings): Observable<void>                    │
│  • getDefaultSettings(): Settings                                │
│  • Profile CRUD operations                                       │
└──────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│              Component State (Local)                             │
├──────────────────────────────────────────────────────────────────┤
│  MainComponent:                                                  │
│  • selectedProfile: Profile                                      │
│  • parsedAssets: any[]                                           │
│  • processingResults: ProcessingResult[]                         │
│  • loadingState: boolean                                         │
│                                                                  │
│  SettingsComponent:                                              │
│  • profiles: Profile[]                                           │
│  • selectedProfile: Profile                                      │
│  • dialogOpen: boolean                                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Validation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    3-Tier Validation Strategy                    │
└─────────────────────────────────────────────────────────────────┘

Level 1: Profile Configuration Validation
┌──────────────────────────────────────────────────────────────────┐
│  When: Profile creation/editing                                  │
│  Where: SettingsComponent, settings-utils.ts                     │
│                                                                  │
│  Validates:                                                      │
│  ✓ Profile has unique name                                       │
│  ✓ Profile type is ADD or UPDATE                                 │
│  ✓ Required fields are mapped:                                   │
│    - ADD: title, asset_type.value, organization.value            │
│    - UPDATE: id                                                  │
│  ✓ No duplicate CSV headers                                      │
│  ✓ Field groups are consistent (identifiers, authors, URLs)      │
│  ✓ Array field indices are sequential                            │
└──────────────────────────────────────────────────────────────────┘
         │
         ▼
Level 2: CSV File Validation
┌──────────────────────────────────────────────────────────────────┐
│  When: CSV upload                                                │
│  Where: MainComponent                                            │
│                                                                  │
│  Validates:                                                      │
│  ✓ File is parseable (Papa Parse)                                │
│  ✓ Headers match profile field mappings                          │
│  ✓ Required columns are present                                  │
│  ✓ No empty required cells                                       │
│  ✓ Data type compatibility (dates, booleans, URLs)               │
│  ✓ Character encoding (UTF-8)                                    │
└──────────────────────────────────────────────────────────────────┘
         │
         ▼
Level 3: Runtime API Validation
┌──────────────────────────────────────────────────────────────────┐
│  When: Asset creation/update                                     │
│  Where: AssetService, Esploro API                                │
│                                                                  │
│  Validates:                                                      │
│  ✓ Asset ID exists (UPDATE operations)                           │
│  ✓ Asset type is valid code table value                          │
│  ✓ Organization code exists in system                            │
│  ✓ Researcher IDs are valid (for author associations)            │
│  ✓ Identifier formats (DOI, ISBN, etc.)                          │
│  ✓ Date formats (ISO 8601)                                       │
│  ✓ User has required permissions                                 │
│  ✓ Field length limits                                           │
│  ✓ Referential integrity                                         │
└──────────────────────────────────────────────────────────────────┘

Error Handling:
┌──────────────────────────────────────────────────────────────────┐
│  • Level 1 errors → Prevent profile save, show inline errors     │
│  • Level 2 errors → Prevent processing, show alert banner        │
│  • Level 3 errors → Log to results, continue with remaining      │
│                     assets, show per-asset error details         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 8. Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Layers                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  Layer 1: Esploro Authentication                                 │
├──────────────────────────────────────────────────────────────────┤
│  • User logs into Esploro with institutional credentials         │
│  • Session managed by Esploro platform                           │
│  • Cloud App inherits authenticated session                      │
└──────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Layer 2: Cloud App Authorization                                │
├──────────────────────────────────────────────────────────────────┤
│  • User must have "Research Asset Manager" role                  │
│  • Cloud App checks permissions via Ex Libris library            │
│  • No API calls allowed without proper role                      │
└──────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Layer 3: API-Level Permissions                                  │
├──────────────────────────────────────────────────────────────────┤
│  Each API call validates:                                        │
│  • User can view/edit the specific asset                         │
│  • User's organization matches asset organization                │
│  • User has permission for the operation (GET/POST/PUT)          │
│  • Rate limiting and quota enforcement                           │
└──────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Layer 4: Data Validation & Sanitization                         │
├──────────────────────────────────────────────────────────────────┤
│  • Input validation on all user-provided data                    │
│  • CSV injection prevention                                      │
│  • XSS prevention in UI display                                  │
│  • No direct SQL queries (API abstraction)                       │
│  • File upload URLs validated (HTTP/HTTPS only)                  │
└──────────────────────────────────────────────────────────────────┘

Data Privacy:
┌──────────────────────────────────────────────────────────────────┐
│  • Settings stored locally in browser (CloudAppStoreService)     │
│  • No data transmitted to third parties                          │
│  • CSV files processed client-side                               │
│  • All API calls go through Esploro (no external endpoints)      │
│  • No sensitive data logged to console in production             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 9. Performance Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                   Performance Bottlenecks                        │
└─────────────────────────────────────────────────────────────────┘

Bottleneck 1: Sequential API Calls
┌──────────────────────────────────────────────────────────────────┐
│  Problem:                                                        │
│  • Processing 1000 assets sequentially takes ~10 minutes         │
│  • Each UPDATE requires GET + PUT (2 API calls)                  │
│  • Network latency compounds                                     │
│                                                                  │
│  Current Implementation:                                         │
│  for (const row of csvRows) {                                    │
│    await processAsset(row);  // Waits for each                   │
│  }                                                               │
│                                                                  │
│  Optimization:                                                   │
│  • Parallel processing with concurrency limit (e.g., 10)         │
│  • RxJS forkJoin or mergeMap with concurrency                    │
│  • Batch API (if Esploro supports bulk operations)               │
│                                                                  │
│  forkJoin(                                                       │
│    csvRows.map(row => processAsset(row))                         │
│  ).subscribe(...)                                                │
└──────────────────────────────────────────────────────────────────┘

Bottleneck 2: Large CSV Parsing
┌──────────────────────────────────────────────────────────────────┐
│  Problem:                                                        │
│  • Parsing 10MB CSV file blocks UI                               │
│  • Memory spikes for large datasets                              │
│                                                                  │
│  Current Implementation:                                         │
│  • Papa Parse loads entire file into memory                      │
│                                                                  │
│  Optimization:                                                   │
│  • Stream parsing (Papa Parse streaming mode)                    │
│  • Web Workers for parsing in background thread                  │
│  • Chunk processing (e.g., 100 rows at a time)                   │
└──────────────────────────────────────────────────────────────────┘

Bottleneck 3: UI Rendering
┌──────────────────────────────────────────────────────────────────┐
│  Problem:                                                        │
│  • Displaying 1000+ processing results slows down UI             │
│  • Angular change detection on every update                      │
│                                                                  │
│  Optimization:                                                   │
│  • Virtual scrolling (Angular CDK)                               │
│  • OnPush change detection strategy                              │
│  • Pagination for results display                                │
│  • Debounced updates (batch UI updates every 500ms)              │
└──────────────────────────────────────────────────────────────────┘

Memory Management:
┌──────────────────────────────────────────────────────────────────┐
│  • Clear parsed CSV data after processing                        │
│  • Unsubscribe from observables (avoid memory leaks)             │
│  • Use trackBy in *ngFor to minimize DOM manipulation            │
│  • Limit in-memory results (e.g., last 500 processed assets)     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 10. UI Component Tree

### Main Page (File Upload Interface)

```
MainComponent
│
├── Header Section
│   └── <h2>Esploro Asset File Loader</h2>
│
├── Form (<form [formGroup]="form">)
│   │
│   ├── Asset ID Field
│   │   └── <mat-form-field>
│   │       └── <input formControlName="assetId">
│   │
│   ├── Files Section (FormArray)
│   │   └── <div *ngFor="let file of files.controls">
│   │       │
│   │       ├── File Title
│   │       │   └── <mat-form-field>
│   │       │       └── <input formControlName="title">
│   │       │
│   │       ├── File URL
│   │       │   └── <mat-form-field>
│   │       │       └── <input formControlName="url">
│   │       │
│   │       ├── Description
│   │       │   └── <mat-form-field>
│   │       │       └── <textarea formControlName="description">
│   │       │
│   │       ├── File Type Selector
│   │       │   └── <mat-form-field>
│   │       │       └── <mat-select formControlName="type">
│   │       │           └── <mat-option *ngFor>
│   │       │
│   │       ├── Supplemental Checkbox
│   │       │   └── <mat-checkbox formControlName="supplemental">
│   │       │
│   │       └── Remove Button
│   │           └── <button (click)="removeFile(i)">
│   │
│   ├── Add File Button
│   │   └── <button (click)="addFile()">
│   │       └── <mat-icon>add</mat-icon>
│   │
│   └── Submit Button
│       └── <button (click)="submit()" [disabled]="form.invalid">
│
└── Result Display Section
    └── <div *ngIf="submissionResult">
        ├── Success Message (mat-card, green)
        └── Error Message (mat-card, red)
```

### Settings Page (Profile Management)

```
SettingsComponent
│
├── Header Section
│   └── <h2>Profile Configuration</h2>
│
├── Toolbar
│   ├── New Profile Button
│   │   └── <button (click)="openProfileDialog()">
│   │       └── <mat-icon>add</mat-icon>
│   │
│   └── Import/Export Buttons
│       ├── <button (click)="importSettings()">
│       └── <button (click)="exportSettings()">
│
├── Profile List (Material Table)
│   └── <mat-table [dataSource]="profiles">
│       │
│       ├── Column: Name
│       │   └── <mat-cell>{{profile.name}}</mat-cell>
│       │
│       ├── Column: Type
│       │   └── <mat-cell>{{profile.type}}</mat-cell>
│       │
│       ├── Column: Description
│       │   └── <mat-cell>{{profile.description}}</mat-cell>
│       │
│       └── Column: Actions
│           └── <mat-cell>
│               ├── Edit Button
│               ├── Clone Button
│               └── Delete Button
│
└── Profile Dialog (Material Dialog)
    └── ProfileComponent
        │
        ├── Dialog Header
        │   └── <h2>{{editing ? 'Edit' : 'New'}} Profile</h2>
        │
        ├── Profile Form
        │   │
        │   ├── Name Field
        │   │   └── <mat-form-field>
        │   │       └── <input [(ngModel)]="profile.name">
        │   │
        │   ├── Description Field
        │   │   └── <mat-form-field>
        │   │       └── <textarea [(ngModel)]="profile.description">
        │   │
        │   ├── Type Selector
        │   │   └── <mat-radio-group [(ngModel)]="profile.type">
        │   │       ├── <mat-radio-button value="ADD">
        │   │       └── <mat-radio-button value="UPDATE">
        │   │
        │   └── Field Mapping Grid
        │       └── <div *ngFor="let field of profile.fields">
        │           │
        │           ├── CSV Header Input
        │           │   └── <input [(ngModel)]="field.header">
        │           │
        │           ├── Field Name Selector
        │           │   └── <mat-select [(ngModel)]="field.fieldName">
        │           │       └── <mat-option *ngFor="let esploroField">
        │           │
        │           ├── Default Value Input
        │           │   └── <input [(ngModel)]="field.default">
        │           │
        │           └── Remove Field Button
        │               └── <button (click)="removeField(i)">
        │
        ├── Add Field Button
        │   └── <button (click)="addField()">
        │
        └── Dialog Actions
            ├── Cancel Button
            └── Save Button
```

---

## 11. Module Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                     Dependency Graph                             │
└─────────────────────────────────────────────────────────────────┘

AppModule (Root)
│
├── @angular/core (~11.2.14)
│   ├── @angular/common
│   ├── @angular/forms (ReactiveFormsModule)
│   ├── @angular/router (AppRoutingModule)
│   └── @angular/platform-browser
│
├── @angular/material (~11.2.12)
│   ├── @angular/cdk
│   ├── Material Components:
│   │   ├── MatFormField
│   │   ├── MatInput
│   │   ├── MatButton
│   │   ├── MatIcon
│   │   ├── MatSelect
│   │   ├── MatCheckbox
│   │   ├── MatTable
│   │   ├── MatDialog
│   │   ├── MatCard
│   │   └── MatRadioButton
│   └── Material Theming
│
├── @exlibris/exl-cloudapp-angular-lib (^1.4.7)
│   ├── CloudAppRestService
│   ├── CloudAppStoreService
│   ├── AlertService
│   ├── MaterialModule
│   └── LazyTranslateLoader
│
├── @ngx-translate/core (~13.0.0)
│   ├── TranslateModule
│   ├── TranslateLoader
│   └── TranslateParser
│
├── ngx-translate-parser-plural-select (^1.1.3)
│   └── TranslateICUParser (i18n support)
│
├── rxjs (~6.5.5)
│   ├── Observable
│   ├── Operators (map, finalize, catchError, etc.)
│   └── forkJoin
│
└── Third-party Libraries
    ├── Papa Parse (CSV parsing) - if used
    └── dot-object (Nested object creation) - if used

External APIs:
├── Esploro REST API
│   ├── /esploro/v1/assets
│   └── /conf/code-tables
│
└── Ex Libris Cloud App Framework
    └── Provides authentication, authorization, UI framework
```

---

## Legend

```
Symbol Key:
│   Vertical connection
├── Branch connection
└── Final branch
▼   Flow direction (top to bottom)
─▶  Flow direction (left to right)
┌─┐ Box/container start
└─┘ Box/container end
```

---

## Revision History

| Version | Date       | Changes                                    |
|---------|------------|--------------------------------------------|
| 1.0     | 2024-01-XX | Initial architecture diagrams created      |

---

**End of Architecture Diagrams Document**
