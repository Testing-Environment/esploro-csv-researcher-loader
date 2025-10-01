# Esploro CSV Asset Loader - Comprehensive Codebase Analysis

## Project Overview

The **Esploro CSV Asset Loader** is an Angular-based cloud application designed to bulk create and update research asset data in ExLibris Esploro research management systems. It provides a user-friendly interface for uploading CSV files and applying asset data changes through configurable profiles.

### Key Purpose
- **Bulk Create Assets**: Create new research assets in Esploro via CSV uploads
- **Bulk Update Assets**: Update existing research asset information with CSV data
- **Flexible Field Mapping**: Support configurable field mapping through customizable profiles
- **Profile Management**: Handle both ADD (create new assets) and UPDATE (modify existing assets) operations
- **Comprehensive Validation**: Provide multi-layer validation and detailed error reporting
- **Multi-Format Support**: Handle various asset types including articles, books, datasets, theses, patents, etc.

### Historical Context
This application was originally developed as a **Researcher Loader** and was later transformed into an **Asset Loader**. The codebase still contains some references to the original researcher functionality (see `ResearcherService`, `researcher.ts` models), though the primary focus is now on asset management.

## Project Structure

```
esploro-csv-researcher-loader/  (repository name - historical)
├── .github/
│   └── copilot-instructions.md        # GitHub Copilot configuration
├── .vscode/
│   └── settings.json                   # VS Code editor configuration
├── cloudapp/                           # Angular application root
│   ├── jsconfig.json                   # JavaScript/TypeScript project config
│   └── src/
│       ├── app/
│       │   ├── main/                   # Main upload/processing component
│       │   │   ├── main.component.ts
│       │   │   ├── main.component.html
│       │   │   └── main.component.scss
│       │   ├── settings/               # Profile configuration management
│       │   │   ├── settings.component.ts
│       │   │   ├── settings.component.html
│       │   │   ├── settings-utils.ts   # Validation logic
│       │   │   ├── esploro-fields.ts   # Field definitions
│       │   │   └── profile/            # Individual profile editor
│       │   │       ├── profile.component.ts
│       │   │       └── profile.component.html
│       │   ├── models/                 # TypeScript interfaces
│       │   │   ├── asset.ts            # Asset data model
│       │   │   ├── researcher.ts       # Researcher model (legacy)
│       │   │   └── settings.ts         # Profile configuration model
│       │   ├── services/               # Business logic services
│       │   │   ├── asset.service.ts    # Asset API interactions
│       │   │   └── researcher.service.ts # Researcher APIs (legacy)
│       │   ├── utilities.ts            # Helper functions
│       │   ├── app.component.ts        # Root component
│       │   ├── app.module.ts           # Angular module configuration
│       │   ├── app-routing.module.ts   # Route definitions
│       │   └── app.service.ts          # Application-level service
│       ├── assets/                     # Static assets (images, icons)
│       ├── i18n/                       # Internationalization files
│       │   └── en.json                 # English translations
│       └── main.scss                   # Global styles
├── documentation/                      # External documentation
│   ├── example-csv/                    # Sample CSV files
│   │   ├── New asset template.csv
│   │   └── RESEARCH_ASSETS_EXPORT_*.csv
│   └── *.pdf, *.docx                  # API schemas and usage guides
├── Esploro_Asset_API_Usage_Report.md  # Detailed API documentation
├── TRANSFORMATION_SUMMARY.md          # Researcher-to-Asset transformation notes
├── explaination.md                    # This file
├── README.md                          # User-facing documentation
├── package.json                       # NPM dependencies and scripts
├── package-lock.json                  # Locked dependency versions
├── manifest.json                      # Cloud app metadata
├── settings.json                      # Default settings
└── LICENSE                            # BSD-3-Clause license
```

**Key Directories:**
- **cloudapp/src/app/**: Core Angular application code
- **documentation/**: External documentation and examples
- **Root level**: Configuration and metadata files

## Core Technologies & Dependencies

### Framework Stack
- **Angular 11.2.14** - Primary frontend framework for SPA development
- **Angular Material 11.2.12** - Material Design UI component library
- **Angular CDK** - Component Dev Kit for advanced UI patterns
- **RxJS 6.5.5** - Reactive programming library for async operations and event handling
- **TypeScript 4.1.5** - Strongly-typed JavaScript superset
- **Zone.js 0.10.3** - Execution context for Angular change detection

### Key Libraries

#### ExLibris Cloud App Framework
- **@exlibris/exl-cloudapp-angular-lib ^1.4.7** - Core library for building ExLibris Cloud Apps
  - `CloudAppRestService` - Authenticated REST API calls to Esploro
  - `CloudAppSettingsService` - Persistent configuration storage
  - `CloudAppStoreService` - Session/local data storage
  - `AlertService` - User notification system
  - `InitService` - Application initialization
- **@exlibris/exl-cloudapp-base ^1.4.7** - Base utilities
- **eca-components ^1.4.4** - ExLibris component library (dialogs, UI elements)

#### Data Processing
- **ngx-papaparse ^5.0.0** - Robust CSV parsing library
  - Handles header row parsing
  - Skips empty lines
  - Provides async parsing capabilities
- **dot-object ^2.1.5** - Nested object property manipulation
  - Converts dot notation to nested objects (e.g., "asset_type.value" → {asset_type: {value: "..."}})
- **lodash ~4.17.21** - Utility functions for data manipulation

#### UI Components
- **ngx-dropzone ~2.2.2** - Drag-and-drop file upload component
  - User-friendly CSV file upload interface

#### Internationalization
- **@ngx-translate/core ~13.0.0** - Translation framework
- **ngx-translate-parser-plural-select ^1.1.3** - ICU message format support for pluralization
  - Enables complex translations like "{count} {count, plural, =1 {asset} other {assets}}"

### Development Dependencies
- **@angular/cli ~11.2.13** - Angular command-line interface
- **@angular-devkit/build-angular ~0.1102.14** - Build system
- **Karma ~6.3.2** + Jasmine - Testing framework (configured but tests not currently implemented)
- **PostCSS ~8.3.0** - CSS processing

## Architecture Overview

### Component Architecture
The application follows Angular's component-based architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────┐
│          AppComponent (Root)                     │
│  Template: <cloudapp-alert> + <router-outlet>   │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┴──────────────┐
        │                            │
┌───────▼────────┐          ┌────────▼──────────┐
│ MainComponent  │          │ SettingsComponent │
│ (Route: '/')   │          │ (Route: settings) │
│                │          │                   │
│ • File upload  │          │ • Profile CRUD    │
│ • CSV parsing  │          │ • Validation      │
│ • Processing   │          │ • Import/Export   │
│ • Results log  │          │                   │
└────────────────┘          └───────┬───────────┘
                                    │
                            ┌───────▼──────────┐
                            │ ProfileComponent │
                            │                  │
                            │ • Field mapping  │
                            │ • Esploro fields │
                            │ • Table UI       │
                            └──────────────────┘
```

### Service Layer

#### Core Services
- **AssetService** (`asset.service.ts`) - Primary service for asset operations
  - `createAsset(asset)` → POST to `/esploro/v1/assets`
  - `updateAsset(asset)` → PUT to `/esploro/v1/assets/{id}`
  - `getAssetById(id)` → GET from `/esploro/v1/assets/{id}`
  - `mapAsset(csvRow, profile)` → Transforms CSV data to Asset object

- **ResearcherService** (`researcher.service.ts`) - Legacy service (retained for potential dual functionality)
  - Similar pattern for researcher operations
  - Uses `/esploro/v1/researchers` endpoints

- **AppService** (`app.service.ts`) - Application initialization
  - Wraps `InitService` from ExLibris framework

#### Framework Services (Provided by ExLibris)
- **CloudAppRestService** - Authenticated HTTP client for Esploro API
- **CloudAppSettingsService** - Persistent settings storage (profiles, configuration)
- **CloudAppStoreService** - Session storage (UI state, selected profile)
- **AlertService** - User notification system
- **DialogService** - Modal dialog management

### Route Guards
- **MainGuard** - Ensures settings/profiles are configured before allowing access to main component
  - Redirects to settings if no profiles exist

### Routing Structure
```
/                → MainComponent (with MainGuard)
/settings        → SettingsComponent
/**              → Redirect to /
```

## Core Components Deep Dive

### 1. MainComponent (`main/main.component.ts`)

**Primary Responsibilities:**
- CSV file upload and validation
- Profile selection and configuration
- Batch asset creation/update processing
- Progress tracking and error reporting
- Results logging and summary generation

**Key Features:**

#### File Upload System
- **Drag-and-drop interface** using `ngx-dropzone`
- **Single file processing** (replaces file on new selection)
- **CSV format validation** before processing

#### Profile Management
- **Dynamic profile selection** from dropdown
- **Stored preferences** using `CloudAppStoreService`
- **Profile type support**: ADD (create) and UPDATE (modify)

#### Batch Processing Engine
- **Parallel processing** with configurable limits (`MAX_PARALLEL_CALLS = 5`)
- **CSV size limit** (`MAX_ASSETS_IN_CSV = 500` assets per file)
- **Thread-safety consideration**: Asset ID generation not thread-safe, so parallel processing only when asset IDs are pre-supplied
- **RxJS streams** for reactive processing pipeline

#### Error Handling & Logging
- **Row-level error tracking** with CSV row numbers (row+2 to account for header and 0-indexing)
- **Three-tier results**: Success, Error, and Info messages
- **Real-time log updates** with auto-scrolling results panel
- **Comprehensive error context**: Includes asset ID, title, and row number in error messages

#### Progress Tracking
- **Real-time percentage** calculation (`percentComplete` getter)
- **Visual indicators**: Progress bar, running state
- **Processed count** vs. total records tracking

**Critical Methods:**

```typescript
// CSV Processing
loadAssets()                              // Initiates Papa Parse CSV parsing
parsedAssets(result: ParseResult)         // Async callback handling parsed CSV data
verifyCsvHeaderAgainstProfile(headers)    // Validates CSV headers match profile configuration

// Asset Processing
processAsset(asset, profileType, index)   // Core processing logic (ADD vs UPDATE)
processAssetWithLogging(asset, index)     // Wrapper with error handling and logging
handleError(error, asset, index)          // Enriches errors with contextual information

// Results Management
updateResultsSummary(resultsArray)        // Generates final summary statistics
log(message)                              // Appends to results log

// UI Event Handlers
onSelectProfile(event)                    // Profile selection change
onSelect(event)                           // File drag-drop selection
onRemove(event)                           // File removal
showLogChanged(event)                     // Toggle log visibility
reset()                                   // Clear state for new upload
```

**Processing Flow:**
1. User uploads CSV → `onSelect()`
2. User clicks "Load Assets" → `loadAssets()`
3. Papa Parse processes file → `parsedAssets()` callback
4. Header validation → `verifyCsvHeaderAgainstProfile()`
5. Confirmation dialog → `DialogService.confirm()`
6. Parallel processing → RxJS `mergeMap()` with concurrency limit
7. Results aggregation → `updateResultsSummary()`

**State Management:**
```typescript
files: File[]                    // Uploaded CSV files
selectedProfile: Profile         // Currently selected processing profile
resultsLog: string              // Accumulated processing log
resultsSummary: string          // Final summary message
showLog: boolean                // Log visibility toggle (persisted)
processed: number               // Count of processed assets
recordsToProcess: number        // Total assets to process
running: boolean                // Processing in progress flag
```

### 2. SettingsComponent (`settings/settings.component.ts`)

**Purpose:** Profile configuration management for field mapping and validation

**Key Features:**

#### Profile Management
- **CRUD Operations**: Create, Read, Update, Delete profiles
- **Profile Selection**: Tab interface for switching between profiles
- **Default Profile**: "Default" profile created on first use
- **Profile Types**: ADD (create new assets) or UPDATE (modify existing)

#### Validation System
- **Form-level validation** using `validateForm()` from `settings-utils.ts`
- **Field-level validation** using `validateFields()` validator
- **Real-time validation** with error display
- **Mandatory field checks** based on profile type

#### Import/Export
- **JSON Export**: Download profile configurations
- **JSON Import**: Upload and parse profile configurations
- **Validation on import**: Ensures valid profile structure

#### Persistence
- **Auto-save to cloud**: Uses `CloudAppSettingsService`
- **Success/error notifications**: Via `AlertService`
- **Dirty state tracking**: Warns on unsaved changes

**Key Methods:**

```typescript
// Lifecycle
ngOnInit()                          // Initialize form and load settings
load()                              // Load settings from CloudAppSettingsService
save()                              // Persist settings to cloud

// Profile Operations
newProfile(name: string)            // Factory method for new profile FormGroup
addProfile()                        // Add new profile to form array
removeProfile(index)                // Delete profile with confirmation
setProfile(index)                   // Switch to different profile tab

// Import/Export
export()                            // Download profiles as JSON
import()                            // Upload and validate JSON profiles
selectImportFile(files)             // Handle file selection for import

// Form Management
get profiles()                      // FormArray of profile configurations
get canSave()                       // Validation check before save
get canRemoveProfile()              // Check if profile can be deleted

// Validation
get form()                          // Main form group with custom validation
```

**Form Structure:**
```typescript
FormGroup {
  profiles: FormArray [
    FormGroup {
      name: string                  // Profile name
      profileType: 'ADD' | 'UPDATE' // Operation type
      fields: FormArray [           // Field mappings
        FormGroup {
          header: string            // CSV column header
          fieldName: string         // Esploro field path
          default: string           // Default value (optional)
        }
      ]
    }
  ]
}
```

### 3. ProfileComponent (`settings/profile/profile.component.ts`)

**Purpose:** Individual profile field mapping table editor

**Key Features:**

#### Field Mapping Table
- **Material Table** (`MatTable`) for field editing
- **Columns**: Header, Default Value, Field Name, Actions
- **Inline editing**: Direct cell editing in table
- **Add/Remove rows**: Dynamic field management

#### Esploro Field Selection
- **Grouped dropdown** for field selection
- **Field groups**: General, Authors, Identifiers, Publication, Content, Rights, URLs, Funding
- **Smart field organization**: Fields grouped by logical categories

#### Mandatory Field Helper
- **"Add Mandatory Fields" button**: Automatically adds required fields based on profile type
- **ADD profile requires**: title, asset_type, organization
- **UPDATE profile requires**: id (asset ID)
- **Duplicate detection**: Alerts if mandatory field already exists

**Key Methods:**

```typescript
ngOnInit()                          // Initialize data source for table
addField()                          // Add new empty field row
removeField(index)                  // Delete field row
addMandatoryFields()                // Auto-add required fields

// Getters
get fields()                        // FormArray of field mappings
get profileType()                   // Current profile type (ADD/UPDATE)
```

**UI State:**
- Uses `ChangeDetectionStrategy.OnPush` for performance
- Manual `table.renderRows()` after modifications
- `MatTableDataSource` binds form controls to table

### 4. Data Models

#### Asset Interface (`models/asset.ts`)
Comprehensive TypeScript interface modeling Esploro's asset data structure:

```typescript
interface Asset {
    // Core identifiers
    id?: string;                    // Asset ID (required for UPDATE)
    title: string;                  // Asset title (required for ADD)
    
    // Required for ADD
    asset_type: {                   // e.g., ARTICLE, BOOK, DATASET
        value: string;
        desc?: string;
    };
    organization: {                 // Organization code
        value: string;
    };
    
    // Authors
    authors?: {
        author: Author[];           // Array of authors
    };
    
    // Publication metadata
    publication_date?: string;      // Format: YYYY-MM-DD, YYYY-MM, or YYYY
    publisher?: string;
    
    // Identifiers
    identifiers?: {
        identifier: Identifier[];   // DOI, ISBN, etc.
    };
    
    // Content
    abstracts?: {
        abstract: Abstract[];       // Multi-language abstracts
    };
    keywords?: {
        keyword: Keyword[];         // Keywords/tags
    };
    
    // Journal information
    journal?: {
        title?: string;
        volume?: string;
        issue?: string;
        pages?: string;
    };
    
    // Conference information
    conference?: {
        name?: string;
        location?: string;
        date?: string;
    };
    
    // Access and rights
    rights?: {
        access_policy?: CodeValue;
        license?: CodeValue;
        embargo_date?: string;
    };
    
    // URLs and files
    urls?: {
        url: URL[];
    };
    files?: {
        file: File[];
    };
    
    // Funding
    funding?: {
        grant: Grant[];
    };
    
    // Boolean flags
    peer_reviewed?: boolean;
    open_access?: boolean;
    
    // System fields
    created_date?: string;
    modified_date?: string;
    created_by?: string;
    modified_by?: string;
}
```

**Supporting Interfaces:**

```typescript
interface Author {
    researcher?: { primary_id: string }; // Link to researcher
    author_order?: string;
    first_name?: string;
    last_name?: string;
}

interface Identifier {
    identifier_type: { value: string; desc?: string };
    value: string;
}

interface Abstract {
    text: string;
    language?: { value: string; desc?: string };
}

interface Keyword {
    text: string;
    language?: { value: string; desc?: string };
}

interface URL {
    link: string;
    type?: { value: string; desc?: string };
    description?: string;
}

interface Grant {
    agency?: string;
    grant_number?: string;
    title?: string;
}
```

#### Researcher Interface (`models/researcher.ts`) - Legacy
Retained from original application, includes extensive researcher profile fields:
- Personal information (name, title, email)
- Organization affiliations with positions
- Education history
- Engagement types
- Keywords, languages, name variants
- External identifiers (ORCID, etc.)

#### Settings & Profile Models (`models/settings.ts`)

```typescript
interface Settings {
    profiles: Profile[];            // Array of configured profiles
}

interface Profile {
    name: string;                   // Profile display name
    profileType: ProfileType;       // ADD | UPDATE
    fields: Field[];                // Field mapping configuration
}

enum ProfileType {
    ADD = "ADD",                    // Create new assets
    UPDATE = "UPDATE",              // Modify existing assets
}

interface Field {
    header: string;                 // CSV column header name
    default: string;                // Default value if CSV cell empty
    fieldName: string;              // Esploro API field path (dot notation)
}
```

**Field Name Convention:**
- Simple fields: `"title"`, `"publisher"`
- Nested fields: `"asset_type.value"`, `"organization.value"`
- Array fields: `"authors.author[].first_name"`, `"identifiers.identifier[].value"`
- The `[]` indicates repeatable fields that can have multiple entries

## Data Flow Analysis

### 1. Complete CSV Upload and Processing Flow

```
┌─────────────────────┐
│  User Uploads CSV   │
│   (Main Component)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│     Papa Parse CSV Library          │
│  • Reads file with header mode      │
│  • Skips empty lines                │
│  • Returns ParseResult object       │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│   Header Validation                 │
│  • Compare CSV headers to profile   │
│  • Check field count match          │
│  • Report missing/extra fields      │
└──────────┬──────────────────────────┘
           │
           ├─ Validation Failed ──> Display Errors
           │
           ▼ Validation Passed
┌─────────────────────────────────────┐
│   CSV Row → Asset Mapping           │
│  • AssetService.mapAsset()          │
│  • Match CSV columns to profile     │
│  • Apply default values             │
│  • Convert dot notation to objects  │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│   User Confirmation Dialog          │
│  "Update X assets in Esploro?"      │
└──────────┬──────────────────────────┘
           │
           ├─ Cancel ──> Reset Form
           │
           ▼ Confirm
┌─────────────────────────────────────┐
│   Parallel Processing Pipeline      │
│  • RxJS Observable stream           │
│  • mergeMap with concurrency limit  │
│  • Max 5 parallel (or 1 if no IDs)  │
└──────────┬──────────────────────────┘
           │
           ├─ For Each Asset ─────────┐
           │                           │
           ▼                           ▼
    ┌─────────────┐          ┌─────────────┐
    │ ADD Profile │          │UPDATE Profile│
    │   (Create)  │          │   (Modify)  │
    └──────┬──────┘          └──────┬──────┘
           │                        │
           ▼                        ▼
    ┌─────────────┐          ┌─────────────┐
    │  POST API   │          │  GET Asset  │
    │  /assets    │          │  /assets/id │
    └──────┬──────┘          └──────┬──────┘
           │                        │
           │                        ▼
           │                ┌───────────────┐
           │                │ Deep Merge    │
           │                │ existing +new │
           │                └───────┬───────┘
           │                        │
           │                        ▼
           │                ┌───────────────┐
           │                │  PUT API      │
           │                │  /assets/id   │
           │                └───────┬───────┘
           │                        │
           ├────────────────────────┘
           │
           ▼
    ┌──────────────────┐
    │  Result Logging  │
    │ • Success count  │
    │ • Error details  │
    │ • Row numbers    │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Results Summary  │
    │  Display to User │
    └──────────────────┘
```

### 2. Asset Mapping Transformation (AssetService.mapAsset)

```
CSV Row (Flat)                    Asset Object (Nested)
────────────────                  ───────────────────────
title: "Research Paper"    ──┐
asset_type: "ARTICLE"        │
organization: "ORG_CODE"     │
author_firstName1: "John"    │
author_lastName1: "Doe"      │
author_order1: "1"           │
author_firstName2: "Jane"    ├──> mapCsvToProfileFields()
author_lastName2: "Smith"    │        │
author_order2: "2"           │        │ Match CSV keys to profile headers
identifier_type1: "DOI"      │        │ Replace [] with actual indices
identifier_value1: "10.123"  │        │ Handle boolean conversions
keyword1: "machine learning" │        ▼
keyword2: "AI"               │   {
publication_date: "2023-01"  │     "title": "Research Paper",
peer_reviewed: "true"      ──┘     "asset_type.value": "ARTICLE",
                                   "organization.value": "ORG_CODE",
                                   "authors.author[0].first_name": "John",
                                   "authors.author[0].last_name": "Doe",
                                   "authors.author[0].author_order": "1",
                                   "authors.author[1].first_name": "Jane",
                                   "authors.author[1].last_name": "Smith",
                                   "authors.author[1].author_order": "2",
                                   "identifiers.identifier[0].identifier_type.value": "DOI",
                                   "identifiers.identifier[0].value": "10.123",
                                   "keywords.keyword[0].text": "machine learning",
                                   "keywords.keyword[1].text": "AI",
                                   "publication_date": "2023-01",
                                   "peer_reviewed": true
                                 }
                                     │
                                     │ setDefaultValues()
                                     │ Apply profile defaults
                                     ▼
                                 dot.object()
                                     │
                                     │ Convert flat dot notation
                                     │ to nested structure
                                     ▼
                                 {
                                   title: "Research Paper",
                                   asset_type: { value: "ARTICLE" },
                                   organization: { value: "ORG_CODE" },
                                   authors: {
                                     author: [
                                       { first_name: "John", last_name: "Doe", author_order: "1" },
                                       { first_name: "Jane", last_name: "Smith", author_order: "2" }
                                     ]
                                   },
                                   identifiers: {
                                     identifier: [
                                       { identifier_type: { value: "DOI" }, value: "10.123" }
                                     ]
                                   },
                                   keywords: {
                                     keyword: [
                                       { text: "machine learning" },
                                       { text: "AI" }
                                     ]
                                   },
                                   publication_date: "2023-01",
                                   peer_reviewed: true
                                 }
```

### 3. Profile Configuration and Persistence Flow

```
┌──────────────────┐
│  Settings UI     │
│  (User Actions)  │
└────────┬─────────┘
         │
         ├─> Create Profile ────────┐
         ├─> Edit Profile ──────────┤
         ├─> Delete Profile ────────┤
         ├─> Add/Remove Fields ─────┤
         └─> Import/Export ─────────┤
                                    │
                                    ▼
                          ┌──────────────────┐
                          │  Form Validation │
                          │                  │
                          │ • validateForm() │
                          │ • validateFields()│
                          └────────┬─────────┘
                                   │
                                   ├─ Invalid ──> Display Errors
                                   │
                                   ▼ Valid
                          ┌──────────────────┐
                          │ CloudAppSettings │
                          │    Service       │
                          │   .set(profiles) │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  ExLibris Cloud  │
                          │  Storage (JSON)  │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │ Success/Error    │
                          │ Notification     │
                          └──────────────────┘
```

### 4. Error Handling Flow

```
API Call Failed
     │
     ▼
┌─────────────────────┐
│  catchError()       │
│  (RxJS operator)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  handleError()      │
│  Enrich with:       │
│  • Asset ID         │
│  • Title            │
│  • Row number       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  log() to results   │
│  "Failed: <msg>"    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Continue next item │
│  (error contained)  │
└─────────────────────┘
```

## Key Business Logic

### 1. Profile Types and Operations

#### ADD Profile (Create New Assets)
- **Purpose**: Create entirely new research assets in Esploro
- **Required Fields**: 
  - `title` - Asset title
  - `asset_type.value` - Asset type code (ARTICLE, BOOK, DATASET, etc.)
  - `organization.value` - Organization code
- **API Operation**: `POST /esploro/v1/assets`
- **Use Case**: Bulk importing new research outputs

#### UPDATE Profile (Modify Existing Assets)
- **Purpose**: Update existing asset metadata
- **Required Fields**:
  - `id` - Asset ID (must exist in Esploro)
- **API Operation**: 
  1. `GET /esploro/v1/assets/{id}` - Retrieve current asset
  2. Deep merge current data with CSV changes
  3. `PUT /esploro/v1/assets/{id}` - Update asset
- **Use Case**: Enriching or correcting existing asset metadata
- **Strategy**: Uses `deepMergeObjects()` to preserve existing data not specified in CSV

### 2. Field Mapping Strategy

#### Dot Notation System
The application uses dot notation to represent nested object paths:
- Simple: `"title"` → `{title: "value"}`
- Nested: `"asset_type.value"` → `{asset_type: {value: "value"}}`
- Arrays: `"authors.author[].first_name"` → `{authors: {author: [{first_name: "value"}]}}`

#### Array Field Handling
- **Dynamic indexing**: `[]` in field name indicates array field
- **Automatic numbering**: System replaces `[]` with `[0]`, `[1]`, `[2]`, etc.
- **CSV naming convention**: Use numbered headers (e.g., `author_firstName1`, `author_firstName2`)
- **Profile mapping**: All map to same base field name with `[]`

Example:
```
CSV Headers: author_firstName1, author_firstName2, author_firstName3
Profile Fields: All map to "authors.author[].first_name"
Result: Creates array with 3 author objects
```

#### Default Values
- **Optional fallback**: If CSV cell is empty, use default value from profile
- **Applied per field**: Each field can have independent default
- **Common uses**: Organization codes, asset types, static metadata

### 3. Validation Layers

#### Layer 1: CSV Structure Validation
```typescript
verifyCsvHeaderAgainstProfile(csvHeaders)
```
- **Header count match**: CSV columns must match profile field count
- **Header presence check**: All profile headers must exist in CSV
- **No extra headers**: CSV shouldn't have unmapped columns
- **Early failure**: Stops processing if structure invalid

#### Layer 2: Profile Configuration Validation
```typescript
validateFields(fields: FormArray)
```
Validates field combinations:
- **Identifiers**: If any identifier field used, both `type` and `value` required
- **Authors**: If authors used, must have either `researcher.primary_id` OR (`first_name` AND `last_name`)
- **URLs**: If URLs used, `link` field required
- **Funding**: If funding used, `agency` field required

#### Layer 3: Profile Type Validation
```typescript
validateForm(form: FormGroup)
```
- **General**: All fields must have `fieldName` and either `header` or `default`
- **ADD profiles**: Must include all mandatory fields (title, asset_type, organization)
- **UPDATE profiles**: Must include asset `id` field

#### Layer 4: API Validation
- **Esploro business rules**: Enforced by API (asset types, organization codes, etc.)
- **Permission checks**: User must have appropriate roles
- **Data constraints**: Field formats, date formats, code table values

### 4. Error Handling Strategy

#### Error Enrichment
Every error is enriched with context:
```typescript
handleError(error, asset, index) {
    // Add asset identifiers
    if (asset.id) error.message += ` (${asset.id})`
    if (asset.title) error.message += ` (${asset.title})`
    // Add row number (CSV row + 2 for header + 0-index)
    error.message += ` (row ${index+2})`
}
```

#### Error Categories
1. **Validation Errors**: CSV structure, missing fields, invalid combinations
2. **API Errors**: Esploro rejected the request (invalid data, permissions, etc.)
3. **Network Errors**: Connection issues, timeouts
4. **System Errors**: Unexpected errors in processing logic

#### Graceful Degradation
- **Individual item errors**: Don't stop batch processing
- **Error containment**: `catchError()` on each item
- **Partial success**: Some assets succeed even if others fail
- **Complete error log**: All failures recorded with details

#### Row-Level Tracking
- Error messages include CSV row number
- Format: `(row X)` where X = array index + 2
  - +1 for header row
  - +1 for 0-based indexing
- Enables quick CSV correction

### 5. Deep Merge Algorithm

Used in UPDATE operations to preserve existing data:

```typescript
deepMergeObjects(target, source) {
    // For each property in source:
    // - If both target and source are objects: recursively merge
    // - Otherwise: overwrite target with source value
    // Preserves target properties not in source
}
```

**Example**:
```javascript
Existing Asset: { title: "Old", abstract: "Original", authors: [...] }
CSV Changes:    { title: "New", publisher: "Acme" }
Result:         { title: "New", abstract: "Original", authors: [...], publisher: "Acme" }
```

This ensures UPDATE operations only modify fields specified in CSV, leaving others intact.

## Performance Considerations

### 1. Parallel Processing

#### Concurrency Control
```typescript
const MAX_PARALLEL_CALLS = 5;  // Maximum simultaneous API calls
```
- **RxJS mergeMap**: Controls concurrent observable subscriptions
- **Benefits**: Faster processing, better resource utilization
- **Rationale**: Balance between speed and API load

#### Thread-Safety Consideration
```typescript
const maxParallelCalls = assets.every(res=>res.id) ? MAX_PARALLEL_CALLS : 1;
```
- **Problem**: Esploro's asset ID generation is not thread-safe
- **Solution**: If creating assets without pre-supplied IDs, process serially (concurrency = 1)
- **Optimization**: If IDs provided in CSV, use full parallelization

### 2. File Size Limits

#### CSV Row Limit
```typescript
const MAX_ASSETS_IN_CSV = 500;  // Maximum assets per upload
```
- **Purpose**: Prevent memory exhaustion and timeouts
- **Behavior**: Silently truncates beyond limit
- **User feedback**: Info message displayed if limit exceeded
- **Rationale**: Balance usability with system stability

#### Memory Management
- **Streaming not used**: Entire CSV loaded into memory (acceptable for 500 rows)
- **Papa Parse**: Efficient CSV parsing with header mode
- **Array operations**: JavaScript array handling for moderate dataset sizes

### 3. Progressive Result Reporting

#### Real-Time Updates
- **Progress percentage**: Updates after each asset processed
- **Live logging**: Results appended as they complete
- **Auto-scroll**: Results panel scrolls to show latest entries
- **Responsive UI**: Angular change detection updates view

#### Batching Considerations
- **No explicit batching**: All assets sent individually
- **Natural batching**: Parallel processing provides implicit batching (5 concurrent)
- **Result aggregation**: Final summary calculated after all complete

### 4. UI Performance

#### Change Detection
- **OnPush strategy**: Used in ProfileComponent for better performance
- **Manual rendering**: `table.renderRows()` when data changes
- **Controlled updates**: Minimizes unnecessary re-renders

#### Large Form Handling
- **Dynamic FormArrays**: Can handle dozens of profile fields
- **Material Table**: Virtual scrolling not implemented (not needed for typical sizes)
- **Validation debouncing**: No explicit debouncing (forms are small enough)

### 5. Network Optimization

#### API Call Efficiency
- **Single endpoint per operation**: No unnecessary preflight requests
- **Minimal payload**: Only changed data sent (in UPDATE mode via deep merge)
- **Error recovery**: Failed items don't retry (manual correction needed)

#### Caching Strategy
- **No caching**: Fresh data fetched each time
- **Settings persistence**: Profiles cached via CloudAppSettingsService
- **Session storage**: Selected profile and UI preferences cached locally

### 6. Potential Bottlenecks

#### Identified Limitations
1. **CSV Parsing**: Synchronous header parsing could block UI for very large files
2. **Deep Merge**: Recursive algorithm could be slow for deeply nested assets
3. **Dot Notation Conversion**: `dot.object()` processes entire object each time
4. **No Progress checkpointing**: Can't resume failed batch
5. **Memory footprint**: All results kept in memory until completion

#### Mitigation Strategies
- Keep CSV files under 500 rows
- Use simple asset structures when possible
- Ensure stable network connection
- Process during low-traffic periods if doing large batches

### 7. Scalability Considerations

#### Current Scale
- **Target**: Small to medium batches (50-500 assets)
- **User type**: Research administrators, data managers
- **Frequency**: Occasional bulk operations (not high-volume continuous)

#### If Scaling Needed
Potential improvements for larger scale:
- Implement chunked processing with checkpoints
- Add resume capability for failed batches
- Implement server-side processing instead of client-side
- Add progress persistence to database
- Implement queue-based processing

## Security & Permissions

### Required Esploro Permissions

#### For Asset Operations
The cloud app requires users to have appropriate role privileges to manage research assets:

**For ADD Operations (Creating New Assets):**
- Permission to create new research assets in Esploro
- Write access to asset repository
- Appropriate organizational permissions

**For UPDATE Operations (Modifying Assets):**
- Permission to modify existing research assets
- Write access to specific asset records
- Note: Only fields marked as "Managed externally" in Esploro can be updated

#### Typical Roles
Common roles that have necessary permissions:
- **RESEARCHER_SERVICES_MANAGER** - Full asset management
- **REPOSITORY_MANAGER** - Repository administration
- **ASSET_ADMINISTRATOR** - Asset-specific admin rights

### Authentication & Authorization

#### ExLibris Cloud App Framework Security
- **Authentication**: Handled by ExLibris platform (no app-level auth needed)
- **API Key**: Automatically injected by CloudAppRestService
- **Session Management**: Handled by framework
- **Institution Context**: Automatically scoped to user's institution

#### API Security
```typescript
CloudAppRestService.call({
    url: '/esploro/v1/assets',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    // API key automatically added by framework
})
```

### Data Security Considerations

#### Sensitive Data Handling
1. **No Credentials Stored**: All auth handled by platform
2. **Settings Storage**: Profiles stored in ExLibris cloud (not local storage)
3. **CSV Data**: 
   - Processed client-side in browser
   - Never sent to third-party servers
   - Cleared from memory after processing
4. **Session Data**: UI preferences stored locally (non-sensitive)

#### Input Validation
- **CSV Sanitization**: Papa Parse handles CSV injection risks
- **Field Validation**: Type checking before API calls
- **HTML Escaping**: Angular automatic XSS protection
- **API Payload**: TypeScript interfaces enforce structure

#### Potential Security Concerns
1. **CSV Content**: Users could include malicious data in CSV cells
   - **Mitigation**: Esploro API validates all data
   - **Best Practice**: Review CSV before upload
2. **Profile Import**: Users could import malicious profile JSON
   - **Mitigation**: `validateProfiles()` checks structure
   - **Limitation**: Doesn't validate field names comprehensively
3. **Mass Updates**: Users could accidentally overwrite data
   - **Mitigation**: Confirmation dialog before processing
   - **Limitation**: No undo functionality

### Content Security Policy

From `manifest.json`:
```json
"contentSecurity": {
    "sandbox": {
        "modals": true,      // Required for dialogs
        "downloads": true    // Required for profile export
    }
}
```

Restricts app capabilities to necessary features only.

### Audit & Compliance

#### Logging
- **User Actions**: Not logged at app level
- **API Operations**: Logged by Esploro platform
- **Asset Changes**: Tracked by Esploro audit trail
- **Error Log**: Only visible to user during session (not persisted)

#### Data Retention
- **Settings**: Persisted indefinitely in ExLibris cloud storage
- **Session State**: Cleared on logout
- **CSV Data**: Never persisted (memory only)
- **Results Log**: Exists only during session

#### Compliance Considerations
- **GDPR**: No personal data stored by app (all in Esploro)
- **Access Control**: Relies on Esploro's RBAC system
- **Data Privacy**: CSV data processed client-side only
- **Audit Trail**: Managed by Esploro platform

## Configuration Management

### 1. Cloud App Manifest (`manifest.json`)

Complete manifest configuration:
```json
{
   "id": "esploro-csv-asset-loader",
   "title": "CSV Asset Loader",
   "subtitle": "Cloud app to update research asset data fields in Esploro",
   "author": "Exlibris",
   "description": "This cloud app can be used to create and update research assets in Esploro with data provided by uploading a CSV file. This is a Beta version.",
   "pages": {
      "settings": "/#/settings",
      "help": "https://knowledge.exlibrisgroup.com/Esploro/..."
   },
   "contentSecurity": {
      "sandbox": {
         "modals": true,      // Enable confirmation dialogs
         "downloads": true    // Enable profile export
      }
   },
   "icon": {
      "type": "url",
      "value": "/assets/researcherLoader.png"
   },
   "fullscreen": {
      "allow": true,
      "open": false
   }
}
```

**Key Properties:**
- **id**: Unique identifier for app in ExLibris platform
- **pages.settings**: Link to settings page (shown in app menu)
- **pages.help**: External documentation link
- **fullscreen**: Allows but doesn't force fullscreen mode

### 2. Application Settings Storage

#### Profile Configuration (CloudAppSettingsService)
**Storage Location**: ExLibris cloud storage (institution-specific)

**Data Structure**:
```json
{
  "profiles": [
    {
      "name": "Default",
      "profileType": "UPDATE",
      "fields": [
        {
          "header": "id",
          "fieldName": "id",
          "default": ""
        },
        {
          "header": "title",
          "fieldName": "title",
          "default": ""
        }
      ]
    }
  ]
}
```

**Operations**:
```typescript
settingsService.get()                    // Retrieve all profiles
settingsService.set(settings)            // Save profiles
settingsService.getAsFormGroup()         // Get as Angular FormGroup
```

**Persistence**:
- Stored per institution
- Survives user logout
- Shared across devices for same user
- No size limit documented

#### User Preferences (CloudAppStoreService)
**Storage Location**: Browser local storage

**Data Stored**:
```typescript
{
  "profile": "Default",           // Selected profile name
  "showLog": true                 // Log visibility toggle
}
```

**Operations**:
```typescript
storeService.get('profile')              // Get selected profile
storeService.set('profile', name)        // Save selection
storeService.get('showLog')              // Get log visibility
storeService.set('showLog', boolean)     // Save visibility
```

**Characteristics**:
- Browser-specific (not synced)
- Survives page refresh
- Cleared on browser data clear
- Per-user, per-browser

### 3. Build Configuration

#### package.json Scripts
```json
{
  "scripts": {
    "start": "eca start"
  }
}
```

Simple configuration - relies on ExLibris CLI (`eca`) for:
- Development server
- Building
- Deployment

#### Angular Configuration
Standard Angular 11 configuration (angular.json not shown but standard):
- TypeScript compilation
- Asset management
- Style processing
- Development/production builds

### 4. Esploro Field Configuration

**Centralized Field Definitions** (`esploro-fields.ts`):

```typescript
class EsploroFields {
    private _fieldgroups = [
        {
            name: "General",
            fields: [
                { name: 'assetId', key: 'id', label: 'FieldNames.AssetId' },
                { name: 'title', key: 'title', label: 'FieldNames.Title' },
                // ... more fields
            ]
        },
        // ... more groups
    ];
}
```

**Purpose**:
- Single source of truth for available fields
- Organized by logical groups
- Maps field keys to labels
- Used by profile UI for field selection

**Groups**:
1. **General**: Core asset metadata
2. **Authors**: Creator information
3. **Identifiers**: DOI, ISBN, etc.
4. **Publication**: Journal/conference details
5. **Content**: Abstracts, subjects, notes
6. **Rights**: Access and licensing
7. **URLs**: External links
8. **Funding**: Grant information

### 5. Internationalization Configuration

**Translation Files** (`cloudapp/src/i18n/en.json`):

```json
{
  "Main": {
    "LoadAssets": "Load Assets",
    "SelectProfile": "Select a profile",
    "ShowLog": "Show log"
  },
  "FieldNames": {
    "AssetId": "Asset ID",
    "Title": "Title",
    "AssetType": "Asset Type"
  },
  "Error": {
    "EmptyAssetId": "Asset ID is empty",
    "CsvHeaderValidationError": "Found {count} errors..."
  }
}
```

**Features**:
- ICU message format for pluralization
- Parameterized messages
- Nested structure for organization
- Currently English only (extensible to other languages)

### 6. Environment-Specific Configuration

**No Environment Files**: Application doesn't use Angular environment files

**Runtime Configuration**:
- All configuration through ExLibris framework
- Institution-specific settings from platform
- No hardcoded API endpoints (provided by CloudAppRestService)

### 7. Default Settings (`settings.json`)

Root-level settings file (purpose unclear - may be for testing or documentation):
```json
{
  "profiles": [
    // Default profile configuration
  ]
}
```

Not actively used by application at runtime.

## Critical Implementation Details

### 1. Data Merging Strategy
```typescript
// Deep merge existing researcher data with CSV updates
let new_researcher = deepMergeObjects(original, researcher);
```

### 2. CSV Parsing Configuration
```typescript
papa.parse(file, {
    header: true,              // Use first row as headers
    skipEmptyLines: 'greedy',  // Skip completely empty lines
    complete: callback         // Async processing
});
```

### 3. RxJS Reactive Processing Pattern

**Parallel processing with concurrency control:**

```typescript
let assetProcessingObservables = from(
    assets.map((asset, index) => 
        this.processAssetWithLogging(asset, index)
    )
);

assetProcessingObservables.pipe(
    mergeMap(
        observable => observable,
        maxParallelCalls  // Max 5 concurrent, or 1 if no IDs
    ),
    tap(result => resultsArray.push(result)),
    catchError(error => {
        this.log(`Failed: ${error.message}`);
        return throwError(error);
    })
).subscribe({
    complete: () => {
        this.updateResultsSummary(resultsArray);
        this.running = false;
    }
});
```

### 4. Array Field Index Resolution

```typescript
// Dynamic indexing for multi-value fields
const arrayIndicator = new RegExp(/\[\d*\]/);
if (arrayIndicator.test(fieldName)) {
    const existingCount = Object.keys(mappedFields)
        .filter(k => k.replace(arrayIndicator, '[]') === fieldName)
        .length;
    fieldName = fieldName.replace(arrayIndicator, `[${existingCount}]`);
}
```

### 5. Dot Notation Conversion

```typescript
import * as dot from 'dot-object';
// Converts: { "asset_type.value": "X" } → { asset_type: { value: "X" } }
mappedAsset = dot.object(mappedAsset);
```

### 6. Boolean Conversion

```typescript
mappedFields[fieldName] = ['true', 'false'].includes(csvValue) 
    ? (csvValue === 'true') : csvValue;
```

## Documentation Gaps & Improvement Areas

### Missing Documentation
1. **API Error Code Mapping** - No comprehensive guide to Esploro API errors
2. **Field Mapping Examples** - Limited complex mapping examples
3. **Performance Tuning** - No batch size guidance
4. **Testing Strategy** - No unit tests implemented
5. **Rollback Procedures** - No undo mechanism
6. **Code Table Values** - No reference for valid codes
7. **Troubleshooting Guide** - No systematic error resolution guide

### Code Quality Observations

**Positive Aspects:**
- Clear separation of concerns
- Comprehensive error handling
- Type safety with TypeScript
- Proper RxJS usage
- Modular, reusable code
- Internationalization support

**Areas for Improvement:**
- Large methods need refactoring
- Magic numbers should be configurable
- Error messages could be more user-friendly
- No unit tests
- Code duplication between services
- No server-side logging
- No pause/resume capability

## Usage Workflows

### 1. Initial Setup (First-Time Installation)

```
1. Institution enables Cloud Apps in Esploro
   │
2. Administrator installs "CSV Asset Loader" from App Center
   │
3. Open Cloud Apps pane → Search "CSV" → Click "Install"
   │
4. Click "Open" to launch app
   │
5. Navigate to Settings (gear icon)
   │
6. Create first profile:
   ├─ Name: e.g., "Update Publications"
   ├─ Type: ADD or UPDATE
   ├─ Click "Add Mandatory Fields"
   └─ Add additional fields as needed
   │
7. Map CSV headers to Esploro fields
   │
8. Set default values (optional)
   │
9. Save profile
   │
10. Return to main screen → Ready to use
```

### 2. Typical Processing Workflow (Asset Creation - ADD Profile)

```
1. Prepare CSV file with:
   ├─ Required: title, asset_type, organization
   └─ Optional: authors, identifiers, dates, etc.
   │
2. Open CSV Asset Loader app
   │
3. Select "ADD" profile from dropdown
   │
4. Drag CSV file to upload area (or click to browse)
   │
5. Click "Load Assets" button
   │
6. System validates:
   ├─ CSV headers match profile
   ├─ Field count correct
   └─ All mapped fields present
   │
7. Confirmation dialog appears:
   "Are you sure you want to create X assets?"
   │
8. Click "OK" to proceed
   │
9. Watch progress bar as assets are created
   │
10. Review results:
    ├─ Success count
    ├─ Error count  
    └─ Detailed log (if enabled)
    │
11. For errors: Note row numbers, fix CSV, retry
    │
12. Click "Reset" for next batch
```

### 3. Typical Processing Workflow (Asset Updates - UPDATE Profile)

```
1. Export asset data from Esploro (or prepare CSV with asset IDs)
   │
2. Open CSV file in editor
   │
3. Modify fields you want to update
   ├─ Keep: id column (required)
   ├─ Modify: fields to change
   └─ Leave blank: fields to preserve
   │
4. Save CSV file
   │
5. Open CSV Asset Loader app
   │
6. Select "UPDATE" profile
   │
7. Upload modified CSV file
   │
8. Click "Load Assets"
   │
9. System:
   ├─ Validates headers
   ├─ For each row:
   │   ├─ GET existing asset from Esploro
   │   ├─ Deep merge CSV changes with existing data
   │   └─ PUT updated asset back
   │
10. Confirmation: "Are you sure you want to update X assets?"
    │
11. Monitor progress
    │
12. Review results:
    ├─ Successfully updated
    ├─ Failed updates (with reasons)
    └─ Detailed log
```

### 4. Profile Management Workflow

```
Create New Profile:
1. Settings → Profiles tab
2. Click "+ Add Profile"
3. Enter profile name
4. Select type (ADD/UPDATE)
5. Click "Add Mandatory Fields" button
6. Add additional custom fields:
   ├─ Select field group
   ├─ Select field name
   ├─ Enter CSV header
   └─ Optional: Enter default value
7. Repeat for all fields
8. Save

Edit Existing Profile:
1. Settings → Select profile tab
2. Modify field mappings
3. Add/remove field rows
4. Update defaults
5. Save

Delete Profile:
1. Settings → Select profile tab
2. Click "Delete" button
3. Confirm deletion

Export Profiles:
1. Settings → Click "Export" button
2. JSON file downloads
3. Share with colleagues/backup

Import Profiles:
1. Settings → Click "Import" button
2. Select JSON file
3. System validates structure
4. Profiles added/merged
```

### 5. Error Resolution Workflow

```
Error Occurs During Processing:
1. Note error message in log
2. Identify CSV row number (shown in parentheses)
3. Locate row in CSV (remember +2 offset)
4. Check error type:
   │
   ├─ "Asset ID is empty"
   │  └─ Ensure id column populated (UPDATE profile)
   │
   ├─ "Couldn't retrieve asset"
   │  └─ Verify asset ID exists in Esploro
   │
   ├─ "Field validation error"
   │  ├─ Check field format (dates, codes)
   │  └─ Verify code table values
   │
   └─ "Permission denied"
      └─ Contact administrator for role assignment
      │
5. Fix CSV file
6. Save changes
7. Reset and retry upload
```

## Development Environment

### Prerequisites
- **Node.js** (version compatible with Angular 11)
- **npm** (comes with Node.js)
- **ExLibris Cloud App CLI** (`eca`)

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd esploro-csv-researcher-loader

# Install dependencies
npm install

# Install ExLibris CLI globally (if not already installed)
npm install -g @exlibris/exl-cloudapp-cli
```

### Development Server

```bash
# Start development server with hot reload
npm start
# OR
eca start

# Opens at: http://localhost:4200 (or port shown in terminal)
# Hot reload: Changes auto-refresh browser
```

### Building

```bash
# Build for production
eca build

# Output: dist/ directory
# Contains: manifest.json, compiled app files
```

### Deployment

```bash
# Build first
eca build

# Deploy dist/ contents to web server
# In ExLibris Developer Network:
# 1. Create new app
# 2. Provide URL to manifest.json
# 3. Platform validates and publishes
```

### Project Structure for Development

```
Key Files to Modify:
├── cloudapp/src/app/
│   ├── main/main.component.ts        # Main processing logic
│   ├── main/main.component.html       # Main UI
│   ├── settings/settings.component.ts # Profile management
│   ├── services/asset.service.ts      # API interactions
│   ├── models/asset.ts                # Data structures
│   └── settings/esploro-fields.ts     # Field definitions
├── cloudapp/src/i18n/en.json          # UI text/translations
└── manifest.json                       # App metadata

Configuration:
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript config
└── .vscode/settings.json               # Editor config
```

### Testing

```bash
# Unit tests (not currently implemented)
npm test

# E2E tests (not currently implemented)
npm run e2e

# Lint code
npm run lint
```

### Debugging

**Browser DevTools:**
- Console: View runtime errors, logs
- Network tab: Monitor API calls
- Application tab: Inspect local storage

**VS Code:**
- Breakpoints in TypeScript files
- Launch configuration in `.vscode/launch.json`
- Angular debugging extension recommended

### Key Configuration Files

**package.json**
- Dependencies and versions
- Script commands
- License and metadata

**tsconfig.json**
- TypeScript compiler options
- Path mappings
- Include/exclude patterns

**angular.json** (not visible but exists)
- Build configuration
- Asset paths
- Style preprocessing

**.vscode/settings.json**
- Editor formatting rules
- Extension recommendations

## Questions for Further Clarification

### Technical Questions

1. **API Rate Limits**
   - What are Esploro's API rate limiting policies?
   - How many concurrent requests are allowed?
   - Are there daily/hourly quotas?

2. **Field Validation Rules**
   - Where is the complete list of asset type codes?
   - What date formats are accepted beyond YYYY-MM-DD?
   - Are there documented validation rules for each Esploro field?
   - Which fields are required vs. optional for each asset type?

3. **Data Integrity**
   - What happens to related data (citations, metrics) when an asset is updated?
   - Are there any fields that shouldn't be bulk updated?
   - How are conflicts handled in UPDATE operations?

4. **Transaction Management**
   - Is there a mechanism to undo bulk updates?
   - Can failed batches be retried automatically?
   - Is there a transaction log for audit purposes?

### Operational Questions

5. **Performance**
   - What's the recommended batch size for optimal performance?
   - Should processing be scheduled during off-peak hours?
   - Are there institution-specific performance considerations?

6. **Security & Compliance**
   - Does the system maintain audit trails for compliance?
   - What data privacy considerations apply?
   - How long are logs retained?

7. **Testing & Validation**
   - Are there sample CSV files available for testing?
   - Is there a test/sandbox environment?
   - What's the best practice for validating profiles before production use?

8. **Error Handling**
   - What are the most common error scenarios?
   - Is there a troubleshooting guide for administrators?
   - How can errors be reported to ExLibris support?

### Business Process Questions

9. **Workflows**
   - What are typical use cases for ADD vs. UPDATE?
   - How do institutions typically structure their profiles?
   - Are there best practices for CSV file organization?

10. **Integration**
    - Can this tool integrate with other systems (ORCID, DOI registration, etc.)?
    - Is there an API for programmatic access?
    - Can it be automated/scheduled?

## Conclusion

This codebase represents a well-architected Angular application with:

**Strengths:**
- ✅ Clear separation of concerns
- ✅ Comprehensive error handling
- ✅ Type-safe TypeScript implementation
- ✅ Reactive programming with RxJS
- ✅ Flexible, profile-based configuration
- ✅ User-friendly interface
- ✅ Detailed logging and reporting
- ✅ Internationalization support

**Designed For:**
- Research administrators managing asset metadata
- Data managers performing bulk imports
- Librarians enriching repository content
- Institutions transitioning to Esploro

**Best Suited For:**
- Small to medium batch operations (50-500 assets)
- Occasional bulk updates
- Data migration projects
- Metadata enrichment campaigns

This documentation should serve as a comprehensive guide for developers, administrators, and users working with the Esploro CSV Asset Loader application.