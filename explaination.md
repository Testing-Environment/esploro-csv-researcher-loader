# Esploro Asset File Loader - Comprehensive Codebase Analysis

## Executive Summary

The **Esploro Asset File Loader** is a streamlined Angular-based cloud application designed to attach external files to research assets in Ex Libris Esploro. It provides a focused, form-based interface for queueing file downloads that integrates seamlessly with Esploro's native "Load files" job.

### Primary Use Case
A researcher or administrator needs to attach multiple external files (PDFs, datasets, supplementary materials) to an existing research asset in Esploro. Instead of manually entering each file through Esploro's UI, they can use this Cloud App to batch-queue multiple files at once, which Esploro will then download and attach via its background job system.

### Key Capabilities
- ✅ Attach external files to existing Esploro research assets
- ✅ Queue multiple files for a single asset in one operation
- ✅ Dynamic file type selection from Esploro code tables
- ✅ Form validation with immediate feedback
- ✅ Integration with Esploro's "Load files" background job

### What This App Is NOT
- ❌ Not a CSV bulk processor (that was a previous version, now removed)
- ❌ Not a researcher data loader
- ❌ Not a file uploader (files must be at HTTP/HTTPS URLs)
- ❌ Not a direct file transfer tool (Esploro downloads files asynchronously)

### Historical Context
**Important**: Legacy documentation may reference CSV loading, researcher management, or bulk operations. Those features were part of a previous version that has been completely replaced. See `documentation/CLEANUP_SUMMARY.md` and `documentation/LEGACY_CSV_LOADER_EXPLANATION.md` for historical details.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Technology Stack](#technology-stack)
3. [Core Architecture](#core-architecture)
4. [Component Analysis](#component-analysis)
5. [Service Layer](#service-layer)
6. [Data Models](#data-models)
7. [Data Flow](#data-flow)
8. [API Integration](#api-integration)
9. [Form Management](#form-management)
10. [Validation Strategy](#validation-strategy)
11. [Error Handling](#error-handling)
12. [User Experience](#user-experience)
13. [Configuration](#configuration)
14. [Deployment](#deployment)
15. [Testing Approach](#testing-approach)
16. [Future Enhancements](#future-enhancements)
17. [Developer Onboarding](#developer-onboarding)

---

## Project Structure

```
esploro-csv-researcher-loader/           # Repository (legacy name)
├── cloudapp/                             # Angular application root
│   ├── src/
│   │   ├── app/
│   │   │   ├── main/                    # Main file upload component ⭐
│   │   │   │   ├── main.component.ts
│   │   │   │   ├── main.component.html
│   │   │   │   └── main.component.scss
│   │   │   │
│   │   │   ├── models/                  # TypeScript interfaces
│   │   │   │   ├── asset.ts            # AssetFileLink interface
│   │   │   │   └── settings.ts         # Settings models (minimal usage)
│   │   │   │
│   │   │   ├── services/               # Business logic
│   │   │   │   └── asset.service.ts   # API integration ⭐
│   │   │   │
│   │   │   ├── settings/               # Settings component (currently minimal)
│   │   │   │   ├── settings.component.ts
│   │   │   │   └── profile/
│   │   │   │
│   │   │   ├── app.module.ts           # Module definitions
│   │   │   ├── app.component.ts        # Root component
│   │   │   ├── app-routing.module.ts   # Routes (single route to main)
│   │   │   └── utilities.ts            # Helper functions (minimal)
│   │   │
│   │   ├── assets/                     # Static resources
│   │   └── i18n/                       # Internationalization (if used)
│   │
│   ├── angular.json                    # Angular configuration
│   ├── tsconfig.json                   # TypeScript config
│   └── package.json                    # Frontend dependencies
│
├── documentation/                       # Comprehensive documentation
│   ├── CLEANUP_SUMMARY.md              # Legacy code removal history
│   ├── DEVELOPER_QUICK_REFERENCE.md    # Quick start guide
│   ├── JOB_SUBMISSION_ENHANCEMENT.md   # Future enhancement proposals
│   ├── VISUAL_DIAGRAMS.md              # Architecture diagrams
│   ├── LEGACY_CSV_LOADER_EXPLANATION.md # Old CSV loader docs
│   └── Expanded_Esploro_Schema.md      # Database schema reference
│
├── manifest.json                        # Cloud App manifest ⭐
├── package.json                         # Root package file
├── README.md                            # User-facing documentation
└── settings.json                        # App settings template

⭐ = Core files for understanding the application
```

### Key Directory Purposes

- **`cloudapp/src/app/main/`**: The heart of the application - contains the file upload form
- **`cloudapp/src/app/services/`**: API integration with Esploro
- **`cloudapp/src/app/models/`**: TypeScript type definitions
- **`documentation/`**: Comprehensive developer and architectural documentation
- **Root files**: Configuration, manifest, deployment settings

---

## Technology Stack

### Frontend Framework
- **Angular 11.2.14** - Core framework
  - Component-based architecture
  - Reactive forms for data binding
  - Dependency injection
  - RxJS for async operations

### UI Components
- **Angular Material 11.2.12** - Material Design components
  - `mat-form-field` - Form inputs
  - `mat-select` - Dropdowns
  - `mat-checkbox` - Checkboxes
  - `mat-card` - File group containers
  - `mat-progress-bar` - Loading indicators
  - `mat-icon` - Icons

### Key Libraries

#### Ex Libris Cloud Apps SDK
- **@exlibris/exl-cloudapp-angular-lib** (v1.4.7)
  - `CloudAppRestService` - API calls with built-in authentication
  - `AlertService` - User notifications
  - Framework integration and routing

#### Reactive Programming
- **RxJS 6.5.5**
  - `Observable` - Async data streams
  - `map()`, `catchError()`, `finalize()` - Operators
  - `switchMap()` - Chaining API calls (future enhancement)

#### Angular Ecosystem
- **@angular/forms** - Reactive forms
- **@angular/router** - Navigation (minimal usage)
- **@angular/common/http** - HTTP client (wrapped by SDK)

### Build Tools
- **Angular CLI** - Build and dev server
- **TypeScript 4.1.5** - Type safety
- **Webpack** (bundled with Angular) - Module bundling

### Development Tools
- **Node.js 20+** - Runtime
- **npm 10+** - Package management

---

## Core Architecture

### Architectural Pattern: Component-Service Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                         │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           MainComponent (main.component.ts)            │  │
│  │                                                         │  │
│  │  - Reactive Form (FormGroup + FormArray)               │  │
│  │  - User interaction handlers                           │  │
│  │  - Validation logic                                    │  │
│  │  - UI state management                                 │  │
│  └─────────────────┬──────────────────────────────────────┘  │
│                    │                                          │
└────────────────────┼──────────────────────────────────────────┘
                     │ Dependency Injection
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                             │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           AssetService (asset.service.ts)              │  │
│  │                                                         │  │
│  │  - API integration                                     │  │
│  │  - Data transformation (UI ↔ API format)               │  │
│  │  - HTTP request construction                           │  │
│  │  - Response parsing                                    │  │
│  └─────────────────┬──────────────────────────────────────┘  │
│                    │                                          │
└────────────────────┼──────────────────────────────────────────┘
                     │ Uses
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    INTEGRATION LAYER                          │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │      CloudAppRestService (Ex Libris SDK)               │  │
│  │                                                         │  │
│  │  - Authentication                                      │  │
│  │  - Base URL configuration                              │  │
│  │  - Request/response interception                       │  │
│  └─────────────────┬──────────────────────────────────────┘  │
│                    │                                          │
└────────────────────┼──────────────────────────────────────────┘
                     │ HTTP Calls
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                      ESPLORO APIs                             │
│                                                                │
│  - POST /esploro/v1/assets/{id}?op=patch&action=add          │
│  - GET  /conf/code-tables/AssetFileType                       │
└──────────────────────────────────────────────────────────────┘
```

### Design Patterns Used

1. **Dependency Injection** (Angular core)
   - Services injected into components
   - Singleton service instances
   - Testability through mocking

2. **Observer Pattern** (RxJS)
   - Async operations via Observables
   - Subscribe to API responses
   - Unsubscribe on component destroy

3. **Reactive Forms Pattern**
   - Form state managed reactively
   - Validation rules declarative
   - Two-way data binding

4. **Service Layer Pattern**
   - Business logic separated from UI
   - API calls centralized in service
   - Reusable service methods

---

## Component Analysis

### MainComponent (`cloudapp/src/app/main/main.component.ts`)

**Purpose**: Primary user interface for file attachment workflow

#### Component Properties

```typescript
export class MainComponent implements OnInit {
  // Form instance
  form: FormGroup;
  
  // File type options loaded from API
  fileTypes: CodeTableEntry[] = [];
  
  // Loading state for file types
  loadingFileTypes = false;
  
  // Submission in progress
  submitting = false;
  
  // Result of last submission
  submissionResult: { 
    type: 'success' | 'error'; 
    message: string 
  } | null = null;
  
  // Fallback file types if API fails
  private readonly fallbackFileTypes: CodeTableEntry[] = [
    { value: 'accepted', description: 'Accepted version' },
    { value: 'submitted', description: 'Submitted version' },
    { value: 'supplementary', description: 'Supplementary material' },
    { value: 'administrative', description: 'Administrative' }
  ];
}
```

#### Component Lifecycle

```
Constructor
  ├─► Inject dependencies (FormBuilder, AssetService, AlertService)
  └─► Initialize form structure
      ├─► assetId: FormControl (required)
      └─► files: FormArray (dynamic)

ngOnInit()
  └─► Load file types from API
      ├─► Set loadingFileTypes = true
      ├─► Call assetService.getFileTypes()
      └─► Handle response
          ├─► Success: populate fileTypes array
          └─► Error: use fallback types

User Interaction
  ├─► User fills form
  ├─► User clicks "Add another file" → addFile()
  ├─► User clicks remove icon → removeFile(index)
  └─► User clicks "Submit files" → submit()
      ├─► Validate form
      ├─► Build payload
      ├─► Call assetService.addFilesToAsset()
      └─► Handle response
          ├─► Success: show alert, reset files
          └─► Error: show alert, keep form

ngOnDestroy() (implicit)
  └─► Subscriptions cleaned up by finalize()
```

#### Key Methods

##### `submit(): void`
**Purpose**: Handle form submission

**Logic Flow**:
1. Check form validity
2. Extract asset ID and file data
3. Build AssetFileLink[] payload
4. Set `submitting = true`
5. Call `assetService.addFilesToAsset()`
6. Subscribe to Observable
7. On success: show alert, update result, reset files
8. On error: show alert, update result, keep form
9. Finally: set `submitting = false`

##### `addFile(): void`
**Purpose**: Add another file group to the form

**Implementation**:
```typescript
addFile(): void {
  this.files.push(this.createFileGroup());
}
```

##### `removeFile(index: number): void`
**Purpose**: Remove a file group from the form

**Safety Check**: Prevents removing the last file group

```typescript
removeFile(index: number): void {
  if (this.files.length === 1) {
    return; // Always keep at least one file group
  }
  this.files.removeAt(index);
}
```

##### `loadFileTypes(): void` (private)
**Purpose**: Fetch file type options from Esploro

**Error Handling**: Falls back to hardcoded types on failure

##### `resetFiles(): void` (private)
**Purpose**: Reset file form groups after successful submission

**Behavior**: 
- Removes all file groups
- Adds one empty file group
- **Retains** the asset ID for convenience
- Marks form as pristine

##### `buildFilePayload(): AssetFileLink[]` (private)
**Purpose**: Transform form data to API format

**Transformation**:
- Extracts values from FormArray
- Maps to AssetFileLink interface
- Handles optional description field
- Converts supplemental to boolean

##### `createFileGroup(): FormGroup` (private)
**Purpose**: Factory method for file form groups

**Structure**:
```typescript
{
  title: ['', Validators.required],
  url: ['', [Validators.required, Validators.pattern(/^https?:\/\//i)]],
  description: [''],
  type: ['', Validators.required],
  supplemental: [false]
}
```

#### Template Integration

**File**: `cloudapp/src/app/main/main.component.html`

**Structure**:
```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <!-- Asset ID input -->
  <mat-form-field>
    <input formControlName="assetId">
  </mat-form-field>
  
  <!-- File type hint section -->
  <section *ngIf="fileTypes.length">
    <!-- Display available file types -->
  </section>
  
  <!-- Dynamic file groups -->
  <section formArrayName="files">
    <mat-card *ngFor="let fileGroup of files.controls; let i = index">
      <!-- File fields for each group -->
    </mat-card>
  </section>
  
  <!-- Add file button -->
  <button type="button" (click)="addFile()">Add another file</button>
  
  <!-- Submit button -->
  <button type="submit" [disabled]="submitting">Submit files</button>
  
  <!-- Progress bar -->
  <mat-progress-bar *ngIf="submitting"></mat-progress-bar>
  
  <!-- Result message -->
  <div *ngIf="submissionResult">{{ submissionResult.message }}</div>
</form>
```

#### Styling

**File**: `cloudapp/src/app/main/main.component.scss`

**Key Styles** (typical):
- Form layout and spacing
- Card styling for file groups
- Button positioning
- Result message colors (success/error)
- Responsive design

---

## Service Layer

### AssetService (`cloudapp/src/app/services/asset.service.ts`)

**Purpose**: Centralized API integration for asset-related operations

#### Service Structure

```typescript
@Injectable({
  providedIn: 'root' // Singleton service
})
export class AssetService {
  constructor(
    private restService: CloudAppRestService
  ) { }
  
  // Public API methods
  addFilesToAsset(assetId: string, files: AssetFileLink[]): Observable<any>
  getFileTypes(): Observable<CodeTableEntry[]>
}
```

#### Method: `addFilesToAsset()`

**Signature**:
```typescript
addFilesToAsset(assetId: string, files: AssetFileLink[]): Observable<any>
```

**Purpose**: Queue external files for attachment to an asset

**Input**:
- `assetId`: Target asset identifier (e.g., "12345678900001234")
- `files`: Array of file metadata

**Process**:
1. Transform `AssetFileLink[]` to Esploro API format
2. Build payload with `temporary.linksToExtract` structure
3. Construct HTTP POST request
4. Return Observable

**API Call**:
```http
POST /esploro/v1/assets/{assetId}?op=patch&action=add
Content-Type: application/json

{
  "records": [
    {
      "temporary": {
        "linksToExtract": [
          {
            "link.title": "File Title",
            "link.url": "https://example.com/file.pdf",
            "link.description": "Optional description",
            "link.type": "accepted",
            "link.supplemental": "false"
          }
        ]
      }
    }
  ]
}
```

**Data Transformation**:
```typescript
// Input: AssetFileLink
{
  title: "My Document",
  url: "https://example.com/doc.pdf",
  description: "Research findings",
  type: "accepted",
  supplemental: false
}

// Output: API format
{
  "link.title": "My Document",
  "link.url": "https://example.com/doc.pdf",
  "link.description": "Research findings",
  "link.type": "accepted",
  "link.supplemental": "false" // Note: string, not boolean
}
```

**Key Implementation Detail**: The `supplemental` field is converted to a string (`"true"` or `"false"`) because the Esploro API expects string values for this field.

#### Method: `getFileTypes()`

**Signature**:
```typescript
getFileTypes(): Observable<CodeTableEntry[]>
```

**Purpose**: Fetch available file type codes from Esploro configuration

**API Call**:
```http
GET /conf/code-tables/AssetFileType?view=brief
```

**Response Parsing**:
The Esploro API can return code tables in various formats:

```typescript
// Format 1: Nested structure
{
  "code_table": {
    "codes": {
      "code": [ ... ]
    }
  }
}

// Format 2: Direct codes
{
  "code_table": {
    "code": [ ... ]
  }
}

// Format 3: Root array
{
  "code_table": [ ... ]
}
```

**Normalization Logic**:
```typescript
.pipe(
  map((response: any) => {
    // Try to extract codes array
    const codes = response?.code_table?.codes?.code
      ?? response?.code_table?.code
      ?? response?.code_table
      ?? [];

    // Ensure it's an array
    const normalized = Array.isArray(codes) ? codes : [codes];

    // Map to CodeTableEntry format
    return normalized
      .filter(Boolean) // Remove null/undefined
      .map((code: any) => ({
        value: code?.value ?? code?.code ?? '',
        description: code?.description ?? code?.desc ?? code?.value ?? ''
      }))
      .filter(entry => !!entry.value); // Remove entries without values
  })
)
```

**Output**: `CodeTableEntry[]`
```typescript
[
  { value: "accepted", description: "Accepted version" },
  { value: "submitted", description: "Submitted version" },
  { value: "supplementary", description: "Supplementary material" },
  { value: "administrative", description: "Administrative" }
]
```

---

## Data Models

### AssetFileLink (`cloudapp/src/app/models/asset.ts`)

**Purpose**: Represents file metadata for attachment

```typescript
export interface AssetFileLink {
  title: string;          // Display name in Esploro UI
  url: string;            // HTTP(S) URL where file can be downloaded
  description?: string;   // Optional description shown to users
  type: string;           // File type code from AssetFileType table
  supplemental: boolean;  // Is this a supplemental/additional file?
}
```

**Field Details**:

- **title**: Required. The name shown in Esploro's file list. Example: "Supplementary Data Table S1"
- **url**: Required. Must be a valid HTTP or HTTPS URL accessible to Esploro servers. Example: "https://repository.example.edu/files/dataset.csv"
- **description**: Optional. Additional context for users. Example: "Raw experimental data in CSV format"
- **type**: Required. Must match a code from the AssetFileType code table. Example: "supplementary"
- **supplemental**: Required (default: false). Indicates if this is additional material rather than the primary file

**Usage Example**:
```typescript
const file: AssetFileLink = {
  title: "Research Dataset",
  url: "https://data.example.edu/dataset.zip",
  description: "Complete experimental dataset with README",
  type: "supplementary",
  supplemental: true
};
```

### CodeTableEntry (`cloudapp/src/app/services/asset.service.ts`)

**Purpose**: Represents a code table entry from Esploro configuration

```typescript
export interface CodeTableEntry {
  value: string;          // Code value (e.g., "accepted")
  description?: string;   // Human-readable description
}
```

**Usage**: Populates dropdown menus and validates file types

**Example**:
```typescript
const fileType: CodeTableEntry = {
  value: "accepted",
  description: "Accepted version"
};
```

---

## Data Flow

### Complete File Attachment Workflow

```
┌─────────────┐
│    USER     │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Opens Cloud App in Esploro
       ▼
┌──────────────────────────────────────┐
│     MainComponent Initializes        │
│                                      │
│  ngOnInit() called                   │
│  └─► loadFileTypes()                 │
│      └─► AssetService.getFileTypes() │
└──────────┬───────────────────────────┘
           │
           │ 2. API call to fetch file types
           ▼
┌────────────────────────────────────────────┐
│  GET /conf/code-tables/AssetFileType       │
│                                            │
│  Response: [ {value, description}, ... ]   │
└──────────┬─────────────────────────────────┘
           │
           │ 3. File types loaded (or fallback used)
           ▼
┌──────────────────────────────────────┐
│     Form Ready for User Input        │
│                                      │
│  - Asset ID field (empty)            │
│  - File #1 group (empty)             │
│  - File type dropdown (populated)    │
└──────────┬───────────────────────────┘
           │
           │ 4. User enters data
           │    - Asset ID: "12345678900001234"
           │    - File 1: title, URL, type, etc.
           │    - File 2: (optional) add another
           ▼
┌──────────────────────────────────────┐
│     User Clicks "Submit files"       │
│                                      │
│  submit() method called              │
└──────────┬───────────────────────────┘
           │
           │ 5. Form validation
           ├─► If invalid: Show errors, STOP
           │
           │ 6. If valid: Build payload
           ▼
┌────────────────────────────────────────────────┐
│  buildFilePayload()                            │
│                                                │
│  Input (form values):                          │
│    files: [                                    │
│      {                                         │
│        title: "My File",                       │
│        url: "https://example.com/file.pdf",    │
│        description: "Test",                    │
│        type: "accepted",                       │
│        supplemental: false                     │
│      }                                         │
│    ]                                           │
│                                                │
│  Output (AssetFileLink[]):                     │
│    [                                           │
│      {                                         │
│        title: "My File",                       │
│        url: "https://example.com/file.pdf",    │
│        description: "Test",                    │
│        type: "accepted",                       │
│        supplemental: false                     │
│      }                                         │
│    ]                                           │
└──────────┬─────────────────────────────────────┘
           │
           │ 7. Call service
           ▼
┌────────────────────────────────────────────────┐
│  AssetService.addFilesToAsset(assetId, files)  │
│                                                │
│  Transforms to API payload:                    │
│    {                                           │
│      records: [{                               │
│        temporary: {                            │
│          linksToExtract: [                     │
│            {                                   │
│              "link.title": "My File",          │
│              "link.url": "https://...",        │
│              "link.description": "Test",       │
│              "link.type": "accepted",          │
│              "link.supplemental": "false"      │
│            }                                   │
│          ]                                     │
│        }                                       │
│      }]                                        │
│    }                                           │
└──────────┬─────────────────────────────────────┘
           │
           │ 8. HTTP POST
           ▼
┌───────────────────────────────────────────────────┐
│  Esploro API                                      │
│  POST /esploro/v1/assets/12345678900001234        │
│       ?op=patch&action=add                        │
│                                                   │
│  Esploro processes request:                       │
│  ├─► Validates asset exists                      │
│  ├─► Validates user permissions                  │
│  ├─► Validates file metadata                     │
│  └─► Stores in temporary.linksToExtract          │
└──────────┬────────────────────────────────────────┘
           │
           ├───── Success ─────┐
           │                   │
           │                   ▼
           │         ┌─────────────────────────────┐
           │         │  HTTP 200 OK                │
           │         │  { ... asset metadata ... } │
           │         └──────────┬──────────────────┘
           │                    │
           │                    │ 9. Return to component
           │                    ▼
           │         ┌─────────────────────────────────────┐
           │         │  MainComponent.subscribe.next()     │
           │         │                                     │
           │         │  - AlertService.success(message)    │
           │         │  - submissionResult = success       │
           │         │  - resetFiles() called              │
           │         │  - Form cleared (except asset ID)   │
           │         └─────────────────────────────────────┘
           │
           └───── Error ───────┐
                               │
                               ▼
                     ┌─────────────────────────────┐
                     │  HTTP 4xx/5xx Error         │
                     │  { error: { message } }     │
                     └──────────┬──────────────────┘
                                │
                                │ 10. Return to component
                                ▼
                     ┌─────────────────────────────────────┐
                     │  MainComponent.subscribe.error()    │
                     │                                     │
                     │  - AlertService.error(message)      │
                     │  - submissionResult = error         │
                     │  - Form data retained               │
                     └─────────────────────────────────────┘


Post-Submission (Manual Steps):
───────────────────────────────
┌─────────────────────────────────────────────────────┐
│  User must manually in Esploro:                     │
│                                                     │
│  1. Go to "Manage Sets"                             │
│  2. Create new itemized set                         │
│  3. Add the updated asset(s) to the set             │
│  4. Go to "Admin" > "Manage Jobs"                   │
│  5. Run "Load files" job                            │
│  6. Select the set created in step 2                │
│  7. Submit job                                      │
│  8. Monitor job completion                          │
│  9. Verify files attached to asset                  │
│                                                     │
│  ⚠️ This manual process could be automated         │
│     (see JOB_SUBMISSION_ENHANCEMENT.md)             │
└─────────────────────────────────────────────────────┘
```

---

## API Integration

### Esploro Assets API

#### Endpoint: Add Files to Asset

**URL**: `/esploro/v1/assets/{assetId}?op=patch&action=add`

**Method**: POST

**Purpose**: Queue external files for download and attachment

**Authentication**: Handled by CloudAppRestService (automatic)

**Headers**:
```http
Content-Type: application/json
Accept: application/json
```

**Request Body Schema**:
```json
{
  "records": [
    {
      "temporary": {
        "linksToExtract": [
          {
            "link.title": "string (required)",
            "link.url": "string (required, HTTP/HTTPS URL)",
            "link.description": "string (optional)",
            "link.type": "string (required, code table value)",
            "link.supplemental": "string ('true' or 'false')"
          }
        ]
      }
    }
  ]
}
```

**Success Response**:
```json
{
  "id": "12345678900001234",
  "title": "Asset Title",
  ... other asset fields ...
}
```

**Error Responses**:

- **404 Not Found**: Asset ID doesn't exist
  ```json
  {
    "errorList": {
      "error": [{
        "errorCode": "ASSET_NOT_FOUND",
        "errorMessage": "Asset with ID 12345678900001234 not found"
      }]
    }
  }
  ```

- **403 Forbidden**: User lacks permissions
  ```json
  {
    "errorList": {
      "error": [{
        "errorCode": "INSUFFICIENT_PERMISSIONS",
        "errorMessage": "User does not have permission to modify asset"
      }]
    }
  }
  ```

- **400 Bad Request**: Invalid data
  ```json
  {
    "errorList": {
      "error": [{
        "errorCode": "INVALID_LINK_URL",
        "errorMessage": "Link URL must be a valid HTTP or HTTPS URL"
      }]
    }
  }
  ```

### Alma Configuration API

#### Endpoint: Get Code Table

**URL**: `/conf/code-tables/{codeTableName}?view=brief`

**Method**: GET

**Used For**: `AssetFileType` code table

**Response Format** (varies):
```json
{
  "code_table": {
    "name": "AssetFileType",
    "codes": {
      "code": [
        {
          "value": "accepted",
          "description": "Accepted version",
          "enabled": "true"
        },
        {
          "value": "submitted",
          "description": "Submitted version",
          "enabled": "true"
        }
      ]
    }
  }
}
```

**Note**: Response structure can vary. AssetService normalizes all formats.

---

## Form Management

### Reactive Forms Architecture

The application uses Angular's Reactive Forms for powerful form handling:

```typescript
// Form Structure
FormGroup: form
├── assetId: FormControl<string>
└── files: FormArray
    ├── [0]: FormGroup
    │   ├── title: FormControl<string>
    │   ├── url: FormControl<string>
    │   ├── description: FormControl<string>
    │   ├── type: FormControl<string>
    │   └── supplemental: FormControl<boolean>
    ├── [1]: FormGroup (if added)
    │   └── ... same structure ...
    └── [N]: FormGroup (dynamically added)
```

### Form Initialization

**In Constructor**:
```typescript
this.form = this.fb.group({
  assetId: ['', Validators.required],
  files: this.fb.array([this.createFileGroup()])
});
```

**Factory Method for File Groups**:
```typescript
private createFileGroup(): FormGroup {
  return this.fb.group({
    title: ['', Validators.required],
    url: ['', [
      Validators.required, 
      Validators.pattern(/^https?:\/\//i)
    ]],
    description: [''],  // Optional, no validators
    type: ['', Validators.required],
    supplemental: [false]  // Default value
  });
}
```

### Form Validation

#### Built-in Validators

- **Validators.required**: Field must have a value
  - Applied to: `assetId`, `title`, `url`, `type`

- **Validators.pattern()**: Field must match regex
  - Applied to: `url` (must start with `http://` or `https://`)

#### Validation States

```typescript
// Check if form is valid
if (this.form.invalid) {
  this.form.markAllAsTouched(); // Show all validation errors
  return; // Prevent submission
}

// Check individual field
const assetIdControl = this.form.get('assetId');
if (assetIdControl?.hasError('required')) {
  // Show error message
}
```

#### Error Messages in Template

```html
<mat-form-field>
  <input matInput formControlName="url">
  <mat-error *ngIf="control.hasError('required')">
    File URL is required.
  </mat-error>
  <mat-error *ngIf="control.hasError('pattern')">
    Enter a valid http(s) URL.
  </mat-error>
</mat-form-field>
```

### Dynamic Form Array

#### Adding a File Group

```typescript
addFile(): void {
  this.files.push(this.createFileGroup());
}
```

**Template**:
```html
<button mat-stroked-button type="button" (click)="addFile()">
  <mat-icon>add</mat-icon>
  <span>Add another file</span>
</button>
```

#### Removing a File Group

```typescript
removeFile(index: number): void {
  if (this.files.length === 1) {
    return; // Always keep at least one file
  }
  this.files.removeAt(index);
}
```

**Template**:
```html
<button mat-icon-button type="button" 
        (click)="removeFile(i)" 
        *ngIf="files.length > 1">
  <mat-icon>delete</mat-icon>
</button>
```

### Form State Management

#### Pristine vs. Dirty

- **Pristine**: User hasn't changed any values
- **Dirty**: User has modified at least one value

```typescript
// After form reset
this.form.markAsPristine();  // Mark as unchanged
this.form.markAsUntouched(); // Mark as not interacted with
```

#### Touched vs. Untouched

- **Untouched**: User hasn't focused any field
- **Touched**: User has focused at least one field

```typescript
// Before showing errors
if (control.touched && control.invalid) {
  // Show error
}
```

---

## Validation Strategy

### Multi-Layer Validation

```
┌─────────────────────────────────────┐
│     LAYER 1: CLIENT-SIDE            │
│     (Immediate Feedback)            │
│                                     │
│  ✓ Required fields                  │
│  ✓ URL format (HTTP/HTTPS)          │
│  ✓ Form structure                   │
│                                     │
│  Prevents: Invalid submissions      │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│     LAYER 2: SERVICE LAYER          │
│     (Pre-API Validation)            │
│                                     │
│  ✓ Payload transformation           │
│  ✓ Data type conversions            │
│  ✓ Optional field handling          │
│                                     │
│  Prevents: Malformed API requests   │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│     LAYER 3: API VALIDATION         │
│     (Server-Side Rules)             │
│                                     │
│  ✓ Asset exists                     │
│  ✓ User has permissions             │
│  ✓ File type code is valid          │
│  ✓ URLs are accessible              │
│                                     │
│  Prevents: Business rule violations │
└─────────────────────────────────────┘
```

### Validation Rules Detail

#### Asset ID
- **Required**: Yes
- **Format**: Numeric string
- **Example**: "12345678900001234"
- **Validation**: Built-in `required` validator

#### File Title
- **Required**: Yes
- **Format**: Any non-empty string
- **Max Length**: Not enforced (Esploro may have limits)
- **Example**: "Supplementary Table S1"

#### File URL
- **Required**: Yes
- **Format**: Must start with `http://` or `https://`
- **Validation**: `Validators.pattern(/^https?:\/\//i)`
- **Example**: "https://example.com/file.pdf"
- **Note**: URL must be accessible to Esploro servers

#### File Description
- **Required**: No
- **Format**: Any string
- **Default**: Empty string (omitted from API payload)

#### File Type
- **Required**: Yes
- **Format**: Must match a code from `AssetFileType` table
- **Validation**: Required + dynamic dropdown
- **Example**: "accepted", "submitted", "supplementary"

#### Supplemental
- **Required**: No (has default)
- **Format**: Boolean (converted to string for API)
- **Default**: `false`
- **Example**: `true` → `"true"` in API

---

## Error Handling

### Error Handling Strategy

```
Error Sources:
├── Form Validation Errors (Client-side)
│   └── Handled by: Angular Forms + mat-error
│
├── File Type Loading Errors (API)
│   └── Handled by: Fallback to hardcoded types
│
└── File Submission Errors (API)
    └── Handled by: subscribe.error() + AlertService
```

### Error Categories

#### 1. Form Validation Errors

**When**: User submits with invalid data

**Handling**:
```typescript
if (this.form.invalid) {
  this.form.markAllAsTouched(); // Show all errors
  return; // Don't submit
}
```

**Display**: Inline error messages under each field

**Example**:
```html
<mat-error>File URL is required.</mat-error>
<mat-error>Enter a valid http(s) URL.</mat-error>
```

#### 2. API Errors - File Types

**When**: `getFileTypes()` fails

**Handling**:
```typescript
this.assetService.getFileTypes()
  .subscribe({
    next: (types) => { ... },
    error: () => {
      // Use fallback types
      this.fileTypes = this.fallbackFileTypes;
    }
  });
```

**User Experience**: Seamless - user sees hardcoded file types

**Logging**: Silent (could be enhanced)

#### 3. API Errors - File Submission

**When**: `addFilesToAsset()` fails

**Common Errors**:

- **Asset Not Found (404)**
  - Message: "Asset with ID {id} not found"
  - Cause: Invalid or non-existent asset ID
  - Recovery: User re-checks asset ID

- **Permission Denied (403)**
  - Message: "You don't have permission to modify this asset"
  - Cause: User lacks "modify research assets" permission
  - Recovery: Contact administrator for permissions

- **Bad Request (400)**
  - Message: "Invalid file data. Check URLs and formats."
  - Cause: Invalid URL, file type, or payload structure
  - Recovery: User reviews and corrects data

- **Server Error (500)**
  - Message: "Server error. Please try again later."
  - Cause: Esploro internal error
  - Recovery: Retry later or contact support

**Handling**:
```typescript
this.assetService.addFilesToAsset(assetId, files)
  .subscribe({
    next: (response) => {
      this.alert.success('Success!');
      this.submissionResult = { type: 'success', message: '...' };
    },
    error: (error) => {
      const message = error?.message || 'Unknown error';
      this.alert.error(message);
      this.submissionResult = { type: 'error', message };
    }
  });
```

**Display**: 
1. Alert banner at top of page (via `AlertService`)
2. Result message in form (via `submissionResult`)

### Error Recovery

#### Form Errors
- **Action**: Fix invalid fields
- **Guidance**: Red error messages under each field
- **State**: Form data preserved

#### API Errors
- **Action**: Review error message and correct
- **Guidance**: Error message displayed via alert
- **State**: Form data preserved (except on success)

#### File Type Loading Failure
- **Action**: None required
- **Guidance**: None shown to user
- **State**: Fallback types used automatically

---

## User Experience

### User Journey

```
1. App Load
   ├─► Shows form with loading spinner for file types
   └─► File types load (or fallback)
   
2. Data Entry
   ├─► User enters asset ID
   ├─► User fills file #1 details
   ├─► (Optional) User clicks "Add another file"
   │   └─► New file group appears
   └─► User fills additional files
   
3. Submission
   ├─► User clicks "Submit files"
   ├─► Progress bar appears
   ├─► Submit button disabled
   └─► Form becomes read-only
   
4. Response
   ├─► Success:
   │   ├─► Green success banner
   │   ├─► Success message in form
   │   ├─► Files cleared (asset ID kept)
   │   └─► Ready for next batch
   │
   └─► Error:
       ├─► Red error banner
       ├─► Error message in form
       ├─► Form data preserved
       └─► User can correct and retry
```

### UX Best Practices Implemented

1. **Progressive Enhancement**
   - Form works even if file types fail to load
   - Fallback types ensure functionality

2. **Immediate Feedback**
   - Validation errors shown on blur/submit
   - Loading states clearly indicated
   - Success/error messages prominent

3. **Error Recovery**
   - Form data preserved on error
   - Clear error messages with guidance
   - Easy to correct and retry

4. **Efficiency**
   - Asset ID retained after submission
   - Multiple files in one operation
   - Quick "add another file" action

5. **Accessibility**
   - Material Design components (ARIA support)
   - Keyboard navigation
   - Screen reader friendly

---

## Configuration

### Application Manifest

**File**: `manifest.json`

**Purpose**: Defines the Cloud App for Esploro

```json
{
  "id": "esploro-csv-asset-loader",
  "title": "CSV Asset Loader",
  "subtitle": "Cloud app to update research asset data fields in Esploro",
  "author": "Exlibris",
  "description": "This cloud app can be used to create and update research assets in Esploro with data provided by uploading a CSV file. This is a Beta version.",
  "pages": {
    "settings": "/#/settings",
    "help": "https://knowledge.exlibrisgroup.com/Esploro/Product_Documentation/Esploro_Online_Help_(English)/Working_with_the_Esploro_Research_Hub/040_Working_with_Assets"
  },
  "contentSecurity": {
    "sandbox": {
      "modals": true,
      "downloads": true
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

**Note**: The manifest references "CSV" and "create and update", which are legacy descriptions. The current app only attaches files, not CSV-based bulk operations.

### Settings Configuration

**File**: `settings.json`

**Purpose**: Template for app settings (currently minimal usage)

**Current Usage**: The settings component exists but is not actively used in the file upload workflow.

### Code Table Configuration

**File Type Code Table**: `AssetFileType`

**Location**: Esploro Configuration → Repository → Asset Details → File and Link Types

**Example Codes**:
- `accepted` - Accepted version
- `submitted` - Submitted version
- `supplementary` - Supplementary material
- `administrative` - Administrative
- `published` - Published version

**Customization**: Administrators can add/modify file types in Esploro, which automatically appear in the app.

---

## Deployment

### Development Deployment

```bash
# Install dependencies
npm install

# Start development server
npm start

# App available at http://localhost:4200
```

**Loading in Esploro**:
1. Open Esploro
2. Enable Cloud Apps Developer Mode
3. Add app from `http://localhost:4200`

### Production Deployment

**Build** (if build scripts configured):
```bash
npm run build
```

**Package**:
1. Include `manifest.json`
2. Include compiled Angular app
3. Include assets (icons, images)

**Deploy**:
1. Upload to Ex Libris Developer Network, or
2. Deploy to institution's Cloud Apps repository

**Permissions Required**:
- View research assets
- Modify research assets

### Deployment Checklist

- [ ] Update `manifest.json` with correct URLs
- [ ] Update `package.json` version
- [ ] Test in development environment
- [ ] Build for production
- [ ] Package app files
- [ ] Upload to deployment target
- [ ] Test in Esploro production
- [ ] Verify permissions
- [ ] Document for users

---

## Testing Approach

### Manual Testing

**Test Scenarios**:

1. **Single File Upload**
   - Enter valid asset ID
   - Fill one file with all fields
   - Submit
   - Expected: Success message, file queued

2. **Multiple Files Upload**
   - Enter valid asset ID
   - Add 3 file groups
   - Fill all with valid data
   - Submit
   - Expected: Success message, all files queued

3. **Invalid Asset ID**
   - Enter non-existent asset ID
   - Fill file data
   - Submit
   - Expected: Error message "Asset not found"

4. **Invalid URL Format**
   - Enter valid asset ID
   - Enter URL without http:// prefix
   - Submit
   - Expected: Validation error "Enter a valid http(s) URL"

5. **Missing Required Fields**
   - Leave title blank
   - Submit
   - Expected: Validation error "File name is required"

6. **File Types Loading**
   - Open app
   - Observe file type dropdown
   - Expected: Types loaded from API or fallback shown

7. **Form Reset After Success**
   - Submit files successfully
   - Observe form state
   - Expected: Files cleared, asset ID retained

### Unit Testing (If Implemented)

**Component Tests**:
```typescript
describe('MainComponent', () => {
  it('should create file group with all fields', () => {
    const group = component.createFileGroup();
    expect(group.get('title')).toBeTruthy();
    expect(group.get('url')).toBeTruthy();
    // ... etc
  });

  it('should validate URL format', () => {
    const urlControl = component.form.get('files.0.url');
    urlControl.setValue('invalid-url');
    expect(urlControl.hasError('pattern')).toBe(true);
  });
});
```

**Service Tests**:
```typescript
describe('AssetService', () => {
  it('should transform AssetFileLink to API format', () => {
    // Test payload transformation
  });

  it('should handle file type API errors gracefully', () => {
    // Test error handling
  });
});
```

---

## Future Enhancements

### Proposed Enhancement: Automated Job Submission

**See**: `documentation/JOB_SUBMISSION_ENHANCEMENT.md`

**Summary**: Automate the creation of itemized sets and submission of "Load files" jobs, eliminating manual steps.

**Benefits**:
- Reduced user effort (7 steps → 1 step)
- Faster workflow
- Automatic job monitoring
- Better user experience

**Challenges**:
- Requires additional permissions (Configuration API)
- Complexity in job parameter management
- Polling for job status

**Implementation Phases**:
1. Set creation
2. Job submission
3. Job monitoring
4. Enhanced UX

### Other Potential Enhancements

1. **Batch Asset Processing**
   - Upload CSV with asset IDs and file URLs
   - Process multiple assets at once
   - Requires CSV parsing library

2. **File URL Validation**
   - Pre-check URLs before submission
   - Warn if URL is inaccessible
   - Requires backend proxy or CORS handling

3. **Job History**
   - Track previous submissions
   - Re-submit failed operations
   - Requires local storage or backend

4. **Advanced Permissions Handling**
   - Check user permissions before showing form
   - Disable features based on roles
   - Better error messages

5. **Internationalization**
   - Multi-language support
   - Already has i18n infrastructure
   - Needs translations

---

## Developer Onboarding

### Getting Started (Quick)

1. **Clone repository**
   ```bash
   git clone https://github.com/Testing-Environment/esploro-csv-researcher-loader.git
   cd esploro-csv-researcher-loader
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Open in Esploro**
   - Enable Developer Mode in Cloud Apps
   - Add app from `http://localhost:4200`

### Key Files to Understand

**Must Read**:
1. `cloudapp/src/app/main/main.component.ts` - Main logic
2. `cloudapp/src/app/services/asset.service.ts` - API integration
3. `cloudapp/src/app/models/asset.ts` - Data models
4. `README.md` - User documentation

**Helpful**:
5. `documentation/DEVELOPER_QUICK_REFERENCE.md` - Developer guide
6. `documentation/VISUAL_DIAGRAMS.md` - Architecture diagrams
7. `documentation/JOB_SUBMISSION_ENHANCEMENT.md` - Future features

### Common Development Tasks

**Add a new form field**:
1. Update `createFileGroup()` in `main.component.ts`
2. Add FormControl with validators
3. Update template with mat-form-field
4. Update `buildFilePayload()` to include field
5. Update `AssetFileLink` interface if needed

**Change API endpoint**:
1. Update URL in `asset.service.ts`
2. Update payload transformation if needed
3. Test with Esploro API documentation

**Add new file type**:
1. Configure in Esploro (Configuration → Code Tables)
2. App automatically picks it up via `getFileTypes()`

**Debug API calls**:
1. Check browser Network tab
2. Review request/response
3. Check Esploro API logs
4. Verify authentication headers

### Coding Standards

- **TypeScript**: Strict typing, avoid `any`
- **Components**: Single responsibility
- **Services**: Centralized API calls
- **Forms**: Reactive forms pattern
- **Observables**: Always unsubscribe or use `finalize()`
- **Error Handling**: User-friendly messages

### Helpful Resources

- [Angular Documentation](https://angular.io/docs)
- [Angular Material](https://material.angular.io/)
- [RxJS Documentation](https://rxjs.dev/)
- [Esploro API Docs](https://developers.exlibrisgroup.com/alma/apis/)
- [Cloud Apps Framework](https://developers.exlibrisgroup.com/cloudapps/)

---

## Appendix

### Glossary

- **Asset**: Research output in Esploro (article, dataset, etc.)
- **Cloud App**: Angular application running in Esploro UI
- **Code Table**: Configuration table in Esploro (e.g., file types)
- **FormArray**: Angular form control for dynamic lists
- **FormGroup**: Angular form control for grouped fields
- **Observable**: RxJS async data stream
- **Reactive Forms**: Angular form management approach
- **temporary.linksToExtract**: Esploro API field for queued file downloads

### Acronyms

- **API**: Application Programming Interface
- **CSV**: Comma-Separated Values
- **HTTP**: Hypertext Transfer Protocol
- **HTTPS**: HTTP Secure
- **RxJS**: Reactive Extensions for JavaScript
- **SDK**: Software Development Kit
- **UI**: User Interface
- **URL**: Uniform Resource Locator

### File Reference

| File | Purpose | Lines | Complexity |
|------|---------|-------|------------|
| `main.component.ts` | Main UI logic | ~143 | Medium |
| `asset.service.ts` | API integration | ~74 | Low |
| `main.component.html` | UI template | ~82 | Low |
| `asset.ts` | Data models | ~7 | Low |
| `manifest.json` | App config | ~25 | Low |

### Version History

- **Current Version**: File uploader for assets
- **Previous Version**: CSV-based researcher loader (removed)
- **Repository Name**: `esploro-csv-researcher-loader` (legacy name)

---

## Conclusion

The Esploro Asset File Loader is a focused, well-architected Angular application that solves a specific problem: efficiently attaching external files to research assets. Its clean separation of concerns, robust error handling, and user-friendly interface make it a valuable tool for Esploro administrators and researchers.

While it has evolved from a more complex CSV-based researcher loader, the current implementation prioritizes simplicity and reliability. Future enhancements, particularly automated job submission, could further streamline the workflow.

For developers new to this codebase, start with the `MainComponent` and `AssetService` to understand the core functionality, then explore the comprehensive documentation in the `documentation/` folder for deeper architectural insights.

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Maintained By**: Development Team  
**Related Docs**: See `documentation/` folder for additional resources
