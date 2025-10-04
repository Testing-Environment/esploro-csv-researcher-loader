# Visual Architecture Diagrams

This document provides visual representations of the Esploro Asset File Loader application architecture, data flow, and component relationships using ASCII diagrams.

---

## Table of Contents
1. [System Architecture](#1-system-architecture)
2. [Component Hierarchy](#2-component-hierarchy)
3. [Data Flow - File Upload](#3-data-flow---file-upload)
4. [API Integration Layer](#4-api-integration-layer)
5. [Form Structure](#5-form-structure)
6. [State Management](#6-state-management)
7. [Error Handling Flow](#7-error-handling-flow)
8. [File Type Loading](#8-file-type-loading)
9. [User Interaction Flow](#9-user-interaction-flow)
10. [Deployment Architecture](#10-deployment-architecture)

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ESPLORO ENVIRONMENT                         │
│                                                                     │
│  ┌────────────────────┐          ┌────────────────────────────┐   │
│  │   Esploro UI       │          │   Cloud Apps Framework      │   │
│  │   (Main Interface) │◄────────►│   (Ex Libris Platform)      │   │
│  └────────────────────┘          └────────────────────────────┘   │
│                                              │                      │
│                                              │ Hosts               │
│                                              ▼                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │         ASSET FILE LOADER CLOUD APP (Angular 11)              │ │
│  │                                                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │ │
│  │  │ Presentation │  │   Service    │  │  External APIs   │   │ │
│  │  │    Layer     │  │    Layer     │  │                  │   │ │
│  │  │              │  │              │  │                  │   │ │
│  │  │ - Components │──│ - Services   │──│ - Esploro API   │   │ │
│  │  │ - Templates  │  │ - HTTP Calls │  │ - Config API    │   │ │
│  │  │ - Forms      │  │ - Logic      │  │                  │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │ │
│  │                                                                │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │                    Data Models                          │  │ │
│  │  │  - AssetFileLink                                        │  │ │
│  │  │  - CodeTableEntry                                       │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                              │                      │
│                                              │ Calls               │
│                                              ▼                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                   ESPLORO REST APIs                           │ │
│  │                                                                │ │
│  │  - POST /esploro/v1/assets/{id}?op=patch&action=add          │ │
│  │  - GET  /conf/code-tables/AssetFileType                       │ │
│  │  - POST /conf/sets (future)                                   │ │
│  │  - POST /conf/jobs (future)                                   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                              │                      │
│                                              ▼                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                   ESPLORO DATABASE                            │ │
│  │                                                                │ │
│  │  - Research Assets                                            │ │
│  │  - Asset Files                                                │ │
│  │  - Code Tables                                                │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Hierarchy

```
AppComponent (Root)
│
└─── Router Outlet
     │
     └─── MainComponent
          │
          ├─── Form (Reactive Forms)
          │    │
          │    ├─── Asset ID Input (FormControl)
          │    │
          │    └─── Files (FormArray)
          │         │
          │         └─── File Group 1..N (FormGroup)
          │              ├─── Title (FormControl)
          │              ├─── URL (FormControl)
          │              ├─── Description (FormControl)
          │              ├─── Type (FormControl)
          │              └─── Supplemental (FormControl)
          │
          ├─── File Type Hint Section
          │    │
          │    └─── File Type List (rendered from fileTypes array)
          │
          ├─── Submit Button
          │
          ├─── Progress Bar (conditional)
          │
          └─── Result Message (conditional)


Dependency Injection Tree:
──────────────────────────
MainComponent
├─── FormBuilder (Angular)
├─── AssetService (custom)
│    └─── CloudAppRestService (Ex Libris)
└─── AlertService (Ex Libris)
```

---

## 3. Data Flow - File Upload

```
┌────────────┐
│   USER     │
└─────┬──────┘
      │ 1. Enters Asset ID and file details
      ▼
┌─────────────────────┐
│  MainComponent      │
│  (Form Validation)  │
└─────┬───────────────┘
      │ 2. submit() called
      │
      ├─── if (form.invalid) ───► Mark all fields as touched
      │                           Show validation errors
      │                           STOP
      │
      │ 3. if (form.valid)
      ▼
┌─────────────────────────┐
│  Build File Payload     │
│  AssetFileLink[]        │
└─────┬───────────────────┘
      │ 4. Call AssetService
      ▼
┌─────────────────────────────────────────────┐
│  AssetService.addFilesToAsset()             │
│                                              │
│  Transforms to API format:                  │
│  {                                           │
│    records: [{                               │
│      temporary: {                            │
│        linksToExtract: [                     │
│          {                                   │
│            'link.title': title,             │
│            'link.url': url,                 │
│            'link.description': description, │
│            'link.type': type,               │
│            'link.supplemental': "false"     │
│          }                                   │
│        ]                                     │
│      }                                       │
│    }]                                        │
│  }                                           │
└─────┬───────────────────────────────────────┘
      │ 5. HTTP POST
      ▼
┌───────────────────────────────────────────────────────┐
│  Esploro API                                          │
│  POST /esploro/v1/assets/{assetId}?op=patch&action=add│
└─────┬─────────────────────────────────────────────────┘
      │
      ├─── SUCCESS ──────────┐
      │                      │
      │                      ▼
      │              ┌──────────────────┐
      │              │  Esploro queues  │
      │              │  files in asset  │
      │              │  temporary field │
      │              └──────────────────┘
      │                      │
      │                      ▼
      │              ┌──────────────────────────┐
      │              │ Return to MainComponent  │
      │              │                          │
      │              │ - Show success message   │
      │              │ - Reset file form fields │
      │              │ - Keep asset ID          │
      │              └──────────────────────────┘
      │
      └─── ERROR ────────────┐
                             │
                             ▼
                     ┌──────────────────┐
                     │ Return to        │
                     │ MainComponent    │
                     │                  │
                     │ - Show error msg │
                     │ - Keep form data │
                     └──────────────────┘


Post-Upload (Manual):
────────────────────
User must manually:
  1. Create itemized set in Esploro containing the asset
  2. Run "Load files" job on the set
  3. Job processes temporary.linksToExtract
  4. Files are downloaded and attached to asset
```

---

## 4. API Integration Layer

```
┌─────────────────────────────────────────────────────────────────┐
│                         AssetService                            │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ addFilesToAsset(assetId, files)                        │   │
│  │                                                         │   │
│  │ Input:  assetId: string                                │   │
│  │         files: AssetFileLink[]                         │   │
│  │                                                         │   │
│  │ Process:                                                │   │
│  │   1. Transform files to API format                     │   │
│  │   2. Build payload with temporary.linksToExtract       │   │
│  │   3. Call REST API via CloudAppRestService             │   │
│  │                                                         │   │
│  │ Output: Observable<any>                                │   │
│  │                                                         │   │
│  │ API: POST /esploro/v1/assets/{id}?op=patch&action=add │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ getFileTypes()                                         │   │
│  │                                                         │   │
│  │ Process:                                                │   │
│  │   1. Call Configuration API                            │   │
│  │   2. Parse response (handle various formats)           │   │
│  │   3. Normalize to CodeTableEntry[]                     │   │
│  │   4. Filter out invalid entries                        │   │
│  │                                                         │   │
│  │ Output: Observable<CodeTableEntry[]>                   │   │
│  │                                                         │   │
│  │ API: GET /conf/code-tables/AssetFileType?view=brief   │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Uses:                                                          │
│  ├─── CloudAppRestService (Ex Libris SDK)                     │
│  │     └─── Handles authentication, headers, base URLs        │
│  │                                                              │
│  └─── RxJS Operators                                           │
│        └─── map(), catchError(), finalize()                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


API Response Handling:
──────────────────────

Success Response:
  └─► Observable emits success value
      └─► Component receives in subscribe.next()
          └─► Show success message
              └─► Reset form

Error Response:
  └─► Observable emits error
      └─► Component receives in subscribe.error()
          └─► Show error message
              └─► Maintain form state
```

---

## 5. Form Structure

```
FormGroup: form
│
├─── assetId: FormControl
│    │
│    ├─── Validators: [required]
│    ├─── Value: string (e.g., "12345678900001234")
│    └─── Error Messages:
│         └─── required: "Asset ID is required."
│
└─── files: FormArray
     │
     ├─── [0]: FormGroup
     │    │
     │    ├─── title: FormControl
     │    │    ├─── Validators: [required]
     │    │    └─── Value: string
     │    │
     │    ├─── url: FormControl
     │    │    ├─── Validators: [required, pattern(/^https?:\/\//i)]
     │    │    └─── Value: string
     │    │
     │    ├─── description: FormControl
     │    │    ├─── Validators: []
     │    │    └─── Value: string (optional)
     │    │
     │    ├─── type: FormControl
     │    │    ├─── Validators: [required]
     │    │    └─── Value: string (code table value)
     │    │
     │    └─── supplemental: FormControl
     │         ├─── Validators: []
     │         └─── Value: boolean (default: false)
     │
     ├─── [1]: FormGroup (if user adds another file)
     │    └─── ... same structure ...
     │
     └─── [N]: FormGroup (dynamically added)


Form Operations:
───────────────

Add File:
  addFile() → files.push(createFileGroup())

Remove File:
  removeFile(index) → files.removeAt(index)
                    → Only if files.length > 1

Reset After Submit:
  resetFiles() → Remove all file groups
               → Add one empty file group
               → Keep asset ID value
               → Mark form as pristine
```

---

## 6. State Management

```
MainComponent State Variables:
───────────────────────────────

┌─────────────────────────────────────────┐
│ form: FormGroup                         │
│   └─► Reactive form instance           │
│       └─► Managed by Angular            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ fileTypes: CodeTableEntry[]             │
│   └─► Loaded from API                   │
│       └─► Falls back to hardcoded list  │
│                                          │
│ Initial:  []                            │
│ Loading:  [] (with spinner)             │
│ Success:  [...API results]              │
│ Error:    [...fallback types]           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ loadingFileTypes: boolean               │
│   └─► Controls loading spinner          │
│                                          │
│ false → true → false                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ submitting: boolean                     │
│   └─► Controls submit button state      │
│       └─► Shows progress bar             │
│                                          │
│ false → true → false                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ submissionResult: {                     │
│   type: 'success' | 'error',            │
│   message: string                       │
│ } | null                                │
│   └─► Displays result banner            │
│                                          │
│ null → { ... } → null (on new submit)  │
└─────────────────────────────────────────┘


State Lifecycle:
────────────────

1. Component Init
   ├─► form created
   ├─► loadingFileTypes = true
   └─► Call getFileTypes()

2. File Types Loaded
   ├─► loadingFileTypes = false
   └─► fileTypes populated

3. User Submits Form
   ├─► submitting = true
   ├─► submissionResult = null
   └─► Call addFilesToAsset()

4. API Response
   ├─► submitting = false
   ├─► submissionResult = { type, message }
   └─► Alert shown

5. Form Reset (on success)
   ├─► Files cleared
   ├─► Asset ID retained
   └─► Form pristine
```

---

## 7. Error Handling Flow

```
Error Scenarios and Handling:
──────────────────────────────

┌─────────────────────────────────────────┐
│ FORM VALIDATION ERRORS                  │
└─────────────────────────────────────────┘
                │
                ├─► Asset ID missing
                │   └─► Show: "Asset ID is required."
                │
                ├─► File name missing
                │   └─► Show: "File name is required."
                │
                ├─► File URL missing
                │   └─► Show: "File URL is required."
                │
                ├─► File URL invalid format
                │   └─► Show: "Enter a valid http(s) URL."
                │
                └─► File type not selected
                    └─► Show: "Select a file type."

┌─────────────────────────────────────────┐
│ API ERRORS                              │
└─────────────────────────────────────────┘
                │
                ├─► File Type API Error
                │   │
                │   ├─► Network error
                │   ├─► Permission denied
                │   └─► Code table not found
                │   │
                │   └─► Fallback: Use hardcoded file types
                │
                └─► Add Files API Error
                    │
                    ├─► 404: Asset not found
                    │   └─► Show: "Asset ID {id} not found"
                    │
                    ├─► 403: Permission denied
                    │   └─► Show: "You don't have permission to modify this asset"
                    │
                    ├─► 400: Bad request
                    │   └─► Show: "Invalid file data. Check URLs and formats."
                    │
                    └─► 500: Server error
                        └─► Show: "Server error. Please try again later."

Error Display Strategy:
───────────────────────

AlertService (Ex Libris):
  └─► Banner at top of page
      ├─► this.alert.success(message)
      ├─► this.alert.error(message)
      └─► this.alert.warn(message)

Inline Validation:
  └─► Mat-error elements in form fields
      └─► Show on: touched && invalid

Submission Result:
  └─► Dedicated result div
      ├─► Green background for success
      └─► Red background for error
```

---

## 8. File Type Loading

```
File Type Loading Sequence:
────────────────────────────

ngOnInit()
    │
    ├─► loadingFileTypes = true
    │
    ├─► Call assetService.getFileTypes()
    │
    └─► Subscribe to Observable
            │
            ├─── SUCCESS PATH ────┐
            │                     │
            │                     ▼
            │         ┌────────────────────────┐
            │         │ Parse API Response     │
            │         │                        │
            │         │ response.code_table    │
            │         │   .codes?.code         │
            │         │   OR .code             │
            │         │   OR [response]        │
            │         └────────┬───────────────┘
            │                  │
            │                  ├─► Normalize to array
            │                  │
            │                  ├─► Map to CodeTableEntry[]
            │                  │   { value, description }
            │                  │
            │                  ├─► Filter out invalid entries
            │                  │
            │                  ▼
            │         ┌────────────────────────┐
            │         │ if (results.length > 0)│
            │         │   fileTypes = results  │
            │         │ else                   │
            │         │   fileTypes = fallback │
            │         └────────────────────────┘
            │
            └─── ERROR PATH ──────┐
                                  │
                                  ▼
                        ┌──────────────────────┐
                        │ Use Fallback Types:  │
                        │                      │
                        │ - accepted           │
                        │ - submitted          │
                        │ - supplementary      │
                        │ - administrative     │
                        └──────────────────────┘
            │
            ▼
    loadingFileTypes = false


API Response Formats (Handled):
────────────────────────────────

Format 1: Standard
{
  "code_table": {
    "codes": {
      "code": [
        { "value": "accepted", "description": "Accepted version" },
        { "value": "submitted", "description": "Submitted version" }
      ]
    }
  }
}

Format 2: Direct codes
{
  "code_table": {
    "code": [...]
  }
}

Format 3: Root level
{
  "code_table": [...]
}

All normalized to:
[
  { value: "accepted", description: "Accepted version" },
  { value: "submitted", description: "Submitted version" }
]
```

---

## 9. User Interaction Flow

```
User Journey:
─────────────

┌────────────────┐
│ 1. User opens  │
│    Cloud App   │
└────────┬───────┘
         │
         ▼
┌─────────────────────────────┐
│ 2. File types loading...    │
│    (spinner shown)           │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 3. Form ready               │
│    - Asset ID field         │
│    - One file group         │
│    - File types loaded      │
└────────┬────────────────────┘
         │
         ├─► User enters asset ID
         │
         ├─► User fills file #1:
         │   ├─► Title
         │   ├─► URL
         │   ├─► Description (opt)
         │   ├─► Type (dropdown)
         │   └─► Supplemental (checkbox)
         │
         ├─► User clicks "Add another file"?
         │   └─► YES: Show file #2 group
         │       └─► User fills file #2
         │           └─► Repeat...
         │
         └─► User clicks "Submit files"
                 │
                 ├─── Form Invalid? ────┐
                 │                      │
                 │                      ▼
                 │            ┌──────────────────┐
                 │            │ Show errors      │
                 │            │ Don't submit     │
                 │            └──────────────────┘
                 │
                 └─── Form Valid ───────┐
                                        │
                                        ▼
                              ┌──────────────────────┐
                              │ Submit to API        │
                              │ (progress bar shown) │
                              └──────────┬───────────┘
                                        │
                                        ├─── Success ────┐
                                        │                │
                                        │                ▼
                                        │      ┌─────────────────────┐
                                        │      │ Show success msg    │
                                        │      │ "Successfully       │
                                        │      │  queued N files"    │
                                        │      └─────────┬───────────┘
                                        │                │
                                        │                ▼
                                        │      ┌─────────────────────┐
                                        │      │ Form reset          │
                                        │      │ - Files cleared     │
                                        │      │ - Asset ID kept     │
                                        │      └─────────────────────┘
                                        │
                                        └─── Error ──────┐
                                                         │
                                                         ▼
                                               ┌─────────────────────┐
                                               │ Show error message  │
                                               │ Keep form data      │
                                               └─────────────────────┘


Next Steps (Manual):
────────────────────
User must go to Esploro:
  1. Create itemized set with the asset
  2. Run "Load files" job
  3. Monitor job completion
  4. Verify files attached to asset
```

---

## 10. Deployment Architecture

```
Development Environment:
────────────────────────

┌─────────────────────────────────────────┐
│ Developer Machine                       │
│                                         │
│  ┌────────────────┐                    │
│  │ Code Editor    │                    │
│  │ (VS Code)      │                    │
│  └────────────────┘                    │
│          │                              │
│          ▼                              │
│  ┌────────────────┐                    │
│  │ npm start      │                    │
│  │                │                    │
│  │ Angular Dev    │                    │
│  │ Server         │                    │
│  │ localhost:4200 │                    │
│  └────────┬───────┘                    │
│           │                             │
└───────────┼─────────────────────────────┘
            │
            │ HTTP
            ▼
┌─────────────────────────────────────────┐
│ Esploro (Dev/Sandbox)                   │
│                                         │
│  Cloud Apps Developer Mode              │
│  └─► Load app from localhost:4200      │
│                                         │
│  ┌────────────────────────────────┐   │
│  │ Cloud Apps Framework           │   │
│  │ - Injects app into page        │   │
│  │ - Provides authentication      │   │
│  │ - Routes API calls             │   │
│  └────────────────────────────────┘   │
└─────────────────────────────────────────┘


Production Environment:
───────────────────────

┌─────────────────────────────────────────┐
│ Build Process                           │
│                                         │
│  npm run build                          │
│  └─► Angular CLI builds app            │
│      └─► Outputs to dist/              │
│                                         │
└─────────────┬───────────────────────────┘
              │
              │ Deploy
              ▼
┌─────────────────────────────────────────┐
│ Ex Libris Developer Network             │
│ OR                                      │
│ Institution's Cloud Apps Repository     │
│                                         │
│  App Package:                           │
│  ├─► manifest.json                     │
│  ├─► Compiled Angular app              │
│  └─► Assets (images, etc.)             │
│                                         │
└─────────────┬───────────────────────────┘
              │
              │ Install
              ▼
┌─────────────────────────────────────────┐
│ Esploro (Production)                    │
│                                         │
│  Cloud Apps Panel                       │
│  └─► Asset File Loader available       │
│                                         │
│  Users with permissions:                │
│  ├─► View research assets              │
│  └─► Modify research assets            │
│                                         │
└─────────────────────────────────────────┘


Network Flow:
─────────────

Browser ──► Cloud Apps Framework ──► Cloud App (Angular)
   │                                      │
   │                                      │
   └──────────── API Calls ◄──────────────┘
                    │
                    ├─► POST /esploro/v1/assets/{id}?op=patch
                    │
                    └─► GET /conf/code-tables/AssetFileType

All API calls authenticated via Cloud Apps Framework
(No direct API keys needed in app code)
```

---

## Notes on Diagrams

### Conventions Used
- `┌─┐ └─┘` - Boxes represent components, systems, or logical groupings
- `──►` - Data flow or process direction
- `│` - Hierarchical relationships or vertical connections
- `├──` - Branch in hierarchy or decision point
- `...` - Continuation or repetition

### How to Read These Diagrams
1. Start from the top or left side
2. Follow arrows for data/control flow
3. Boxes represent distinct components or processes
4. Indentation shows hierarchy or containment
5. Text annotations explain key details

### Tools for Viewing
These ASCII diagrams are best viewed in:
- Monospace font (Courier, Consolas, Monaco)
- Plain text editors
- Markdown viewers
- GitHub/GitLab file viewers

### Related Documentation
- See `DEVELOPER_QUICK_REFERENCE.md` for detailed code examples
- See `JOB_SUBMISSION_ENHANCEMENT.md` for future architecture
- See `README.md` for user-facing documentation
- See `CLEANUP_SUMMARY.md` for historical context
