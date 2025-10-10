# Functional Requirements

**Last Updated**: January 10, 2025
**Version**: 1.0.0
**Status**: Current requirements for the production application

---

## Overview

This document defines the current functional requirements for the Esploro Asset File Loader Cloud App. It serves as the authoritative source for what the application **must do** (as opposed to the [ROADMAP.md](ROADMAP.md), which describes future enhancements).

---

## Core Requirements

### REQ-1: Manual Entry Workflow

#### REQ-1.1: Multi-File Entry Form
**Priority**: CRITICAL
**Status**: ✅ Implemented

The application MUST provide a form-based interface for manual entry of file attachments with the following capabilities:

- **Dynamic row management**:
  - Display at least one entry row initially
  - Allow users to add additional rows via "Add another file" button
  - Allow users to remove rows via delete button (minimum 1 row must remain)

- **Required fields per row**:
  - Asset ID (text input, required, validated against Esploro API)
  - File URL (text input, required, must match `^https?://` pattern)

- **Optional fields per row**:
  - File title (text input)
  - File description (textarea)
  - Supplemental flag (checkbox, defaults to true)

- **Form validation**:
  - Prevent submission if any required field is empty
  - Validate URL format client-side
  - Validate asset ID existence server-side (via Esploro API)

#### REQ-1.2: Three-Stage Progression
**Priority**: CRITICAL
**Status**: ✅ Implemented

The manual entry workflow MUST support three stages:

**Stage 1: Entry**
- User enters asset IDs, file URLs, and optional metadata
- Two progression options:
  - "Specify Types of Each File" → proceeds to Stage 2
  - "Proceed Without Selecting File Types" → auto-assigns default types, skips to Stage 3

**Stage 2: File Type Selection** (optional)
- Display all entries from Stage 1
- For each entry, provide dropdown to select file type
- File types MUST be filtered by asset type (fetched from API in Stage 1 validation)
- Dropdowns pre-populated with default file type based on asset type
- User can modify selections before proceeding

**Stage 3: Review & Submit**
- Display final review of all entries with all fields
- "Submit" button queues files via Esploro API
- Display success/error feedback via alert system

#### REQ-1.3: Asset Validation
**Priority**: CRITICAL
**Status**: ✅ Implemented

Before proceeding from Stage 1:
- Application MUST validate all unique asset IDs via `GET /esploro/v1/assets/{id}`
- Application MUST cache asset metadata (title, type, existing files)
- Application MUST reorder entries to show invalid assets first
- Application MUST display error message for non-existent asset IDs
- Application MUST prevent progression if any asset ID is invalid

---

### REQ-2: CSV Upload Workflow

#### REQ-2.1: CSV File Upload
**Priority**: CRITICAL
**Status**: ✅ Implemented

The application MUST support CSV file upload with the following requirements:

- **File upload control**: Standard file input accepting `.csv` files
- **File size limit**: Maximum 10MB (client-side validation)
- **Parser requirements**: RFC 4180 compliant (handle quoted fields, multi-line values, embedded commas)
- **Implementation**: Uses PapaParse library

#### REQ-2.2: Column Mapping Interface
**Priority**: CRITICAL
**Status**: ✅ Implemented

After CSV upload, the application MUST provide a column mapping interface:

- **Display CSV headers**: Show all detected columns from uploaded file
- **Intelligent suggestions**: Auto-suggest field mappings based on header names
  - Fuzzy matching (case-insensitive, partial match)
  - Common variations (e.g., "MMS ID", "mmsId", "Asset_ID" → all map to `mmsId`)

- **Mapping options** (dropdown for each column):
  - `mmsId` - Asset ID (required)
  - `remoteUrl` - File URL (required)
  - `fileTitle` - File title (optional)
  - `fileDescription` - File description (optional)
  - `fileType` - File type (optional)
  - `Ignore` - Do not import this column

- **Validation**:
  - MUST block progression if `mmsId` is not mapped
  - MUST block progression if `remoteUrl` is not mapped
  - MAY allow all other columns to be ignored

#### REQ-2.3: Required Field Validation
**Priority**: CRITICAL
**Status**: ✅ Implemented

Before processing CSV data, the application MUST validate:

- **All rows have values** for mapped `mmsId` column
- **All rows have values** for mapped `remoteUrl` column
- **Display row numbers** for any rows with missing required values
- **Block progression** until user fixes CSV or removes invalid rows

**Error message format**:
```
Missing required values in rows: 3, 7, 12, 45
Please ensure all rows have values for: Asset ID, File URL
```

#### REQ-2.4: File Type Conversion
**Priority**: HIGH
**Status**: ✅ Implemented

If CSV includes a `fileType` column, the application MUST support both ID values and human-readable names:

**Automatic conversion**:
- Exact ID match (e.g., "DATA") → confidence 1.0 → auto-convert
- Exact target code match (e.g., "Dataset" → "DATA") → confidence 0.95 → auto-convert
- Partial match (e.g., "Research Data" contains "DATA") → confidence 0.7 → auto-convert

**Manual resolution**:
- If no match found (confidence 0.0) → MUST display manual mapping UI
- User selects correct file type from dropdown for each unresolved value
- User can review and adjust all conversions before processing

**Conversion UI requirements**:
- Display table showing: Original Value → Matched Type → Confidence
- Allow user to override automatic matches
- Prevent progression until all file types resolved

#### REQ-2.5: CSV Processing
**Priority**: CRITICAL
**Status**: ✅ Implemented

CSV processing MUST follow this workflow:

1. **Asset pre-validation** (before API calls):
   - Fetch metadata for all unique asset IDs
   - Cache initial file counts and file list (for comparison)
   - Report invalid asset IDs to user
   - Allow user to proceed or cancel

2. **File attachment** (sequential processing):
   - For each valid row, call `POST /esploro/v1/assets/{id}?op=patch&action=add`
   - Include all available metadata (title, description, type, supplemental)
   - Track success/error status per row
   - Display progress indicator

3. **Post-processing verification**:
   - Fetch updated metadata for all assets
   - Compare before/after file counts
   - Flag assets with no change as "unchanged" status
   - Categorize results: success, error, unchanged

4. **Results display**:
   - Show breakdown by status
   - Provide downloadable CSV of successful MMS IDs
   - Display workflow instructions for next steps (create set → run job)

---

### REQ-3: API Integration

#### REQ-3.1: Esploro API Endpoints
**Priority**: CRITICAL
**Status**: ✅ Implemented

The application MUST integrate with the following Esploro APIs:

| Endpoint | Method | Purpose | Implementation |
|----------|--------|---------|----------------|
| `/esploro/v1/assets/{id}` | GET | Fetch asset metadata | ✅ `getAssetMetadata()` |
| `/esploro/v1/assets/{id}?op=patch&action=add` | POST | Queue files for ingestion | ✅ `addFilesToAsset()` |
| `/conf/mapping-tables/AssetFileAndLinkTypes` | GET | Fetch valid file types | ✅ `getAssetFilesAndLinkTypes()` |

#### REQ-3.2: Payload Structure
**Priority**: CRITICAL
**Status**: ✅ Implemented

File attachment API calls MUST use this payload structure:

```json
{
  "records": [
    {
      "temporary": {
        "linksToExtract": [
          {
            "link.title": "File Title",
            "link.url": "https://example.com/file.pdf",
            "link.description": "Optional description",
            "link.type": "DATA",
            "link.supplemental": "true"
          }
        ]
      }
    }
  ]
}
```

**Field requirements**:
- `link.url`: Required, must be valid HTTP(S) URL
- `link.type`: Required, must be valid file type ID from mapping table
- `link.supplemental`: Required, must be string "true" or "false"
- `link.title`: Optional, defaults to empty string
- `link.description`: Optional, defaults to empty string

#### REQ-3.3: Error Handling
**Priority**: HIGH
**Status**: ✅ Implemented

The application MUST handle API errors gracefully:

| HTTP Status | Handling |
|-------------|----------|
| 200 | Success - parse response and display confirmation |
| 400 | Bad Request - display "Invalid file data provided" |
| 401 | Unauthorized - display "Authentication failed" |
| 404 | Not Found - display "Asset {id} not found" |
| 500 | Server Error - display "Esploro API error" |
| Network Error | Display "Unable to connect to Esploro" |

**Error display requirements**:
- Use Cloud Apps alert system (alert.error())
- Include specific error details when available
- Provide actionable guidance (e.g., "Check asset ID")

---

### REQ-4: User Interface

#### REQ-4.1: Tab Navigation
**Priority**: HIGH
**Status**: ✅ Implemented

The application MUST provide two primary tabs:
- **Manual Entry**: Form-based workflow (REQ-1)
- **CSV Upload**: Bulk processing workflow (REQ-2)

Tabs MUST be clearly labeled and mutually exclusive (switching tabs resets state).

#### REQ-4.2: Form Validation Feedback
**Priority**: HIGH
**Status**: ✅ Implemented

The application MUST provide real-time validation feedback:

- **Invalid fields**: Display red border and error message below field
- **Valid fields**: Display green border or checkmark (optional)
- **Form-level errors**: Display alert banner above form
- **Submit button**: Disabled when form is invalid

**Error message requirements**:
- Clear, specific, actionable
- Displayed immediately (on blur or value change)
- Removed when field becomes valid

#### REQ-4.3: Processing Feedback
**Priority**: HIGH
**Status**: ✅ Implemented

During CSV/manual processing, the application MUST provide:

- **Progress indicator**: Spinner or progress bar showing "Processing X of Y assets"
- **Blocking UI**: Prevent user actions during processing (disable controls)
- **Success feedback**: Green alert with confirmation message
- **Error feedback**: Red alert with specific error details

#### REQ-4.4: Results Display
**Priority**: MEDIUM
**Status**: ✅ Implemented

After CSV processing, the application MUST display:

- **Summary statistics**:
  - Total assets processed
  - Successful (files added)
  - Errors (API failures)
  - Unchanged (no files added)

- **Detailed results table** (expandable/collapsible):
  - Asset ID
  - Status (icon + text)
  - Error message (if applicable)

- **Actions**:
  - Download successful MMS IDs as CSV
  - Copy MMS ID list to clipboard
  - Reset workflow (start over)

- **Next steps guidance**:
  - Instructions to create asset set
  - Instructions to run "Load files" job

---

### REQ-5: File Type Management

#### REQ-5.1: File Type Filtering
**Priority**: HIGH
**Status**: ✅ Implemented

File type dropdowns MUST filter based on asset type:

- Fetch asset type from `GET /assets/{id}` response
- Filter AssetFileAndLinkTypes mapping table using `SOURCE_CODE_2` field
- If `SOURCE_CODE_2` is empty → file type applies to all asset types
- If `SOURCE_CODE_2` contains asset type → include in dropdown
- Dropdown MUST only show applicable file types

**Example**:
```typescript
// Asset type: "publication"
// File type with SOURCE_CODE_2: "publication,patent" → SHOW
// File type with SOURCE_CODE_2: "" → SHOW
// File type with SOURCE_CODE_2: "dataset" → HIDE
```

#### REQ-5.2: Default File Type Assignment
**Priority**: MEDIUM
**Status**: ✅ Implemented

When Stage 2 is skipped (manual entry), application MUST auto-assign default file type:

- Prefer file type with exact match to asset type (if available)
- Otherwise, use first available file type for that asset type
- Ensure assigned type is valid according to filtering rules (REQ-5.1)

---

### REQ-6: Data Validation

#### REQ-6.1: Input Sanitization
**Priority**: HIGH
**Status**: ✅ Implemented

All user inputs MUST be validated and sanitized:

- **Asset IDs**: Trim whitespace, validate format, check existence via API
- **URLs**: Trim whitespace, validate `^https?://` pattern, encode special characters
- **Text fields**: Trim whitespace, limit length (title: 500 chars, description: 5000 chars)
- **CSV data**: Validate encoding (UTF-8), handle BOM, normalize line endings

#### REQ-6.2: Duplicate Detection
**Priority**: LOW
**Status**: ⚠️ Partial (before/after comparison detects duplicates)

The application SHOULD detect duplicate file URLs:

- **Within CSV**: Warn if same URL appears multiple times for same asset
- **Against existing files**: Compare uploaded URLs against asset's existing file list
- **User choice**: Allow user to proceed or cancel duplicate uploads

**Current implementation**: Duplicates are detected post-upload via before/after comparison (status: "unchanged")

---

### REQ-7: Security & Permissions

#### REQ-7.1: Authentication
**Priority**: CRITICAL
**Status**: ✅ Implemented (via SDK)

- All API calls MUST use Ex Libris Cloud Apps SDK authentication
- OAuth 2.0 token-based authentication (handled by SDK)
- Application MUST NOT store or display user credentials

#### REQ-7.2: Authorization
**Priority**: CRITICAL
**Status**: ✅ Implemented (delegated to Esploro)

- User MUST have appropriate Esploro permissions:
  - View asset permission (to validate assets)
  - Modify asset permission (to add files)
- Authorization MUST be enforced server-side by Esploro API
- Application MUST handle 401/403 errors gracefully

#### REQ-7.3: Input Validation (Security)
**Priority**: HIGH
**Status**: ✅ Implemented

- URL validation MUST prevent non-HTTP protocols (e.g., `javascript:`, `data:`)
- CSV upload MUST limit file size (10MB max) to prevent DoS
- No `innerHTML` usage (Angular's sanitization only)
- All user inputs displayed via safe interpolation (`{{ }}`)

---

### REQ-8: Performance

#### REQ-8.1: Response Time Targets
**Priority**: MEDIUM
**Status**: ✅ Met

- Asset validation: < 2 seconds per asset (API dependent)
- CSV parsing: < 2 seconds for 1000 rows
- File submission: < 1 second per file (API dependent)
- UI responsiveness: < 100ms for user interactions

#### REQ-8.2: Scalability
**Priority**: MEDIUM
**Status**: ⚠️ Partial

- MUST support CSV files up to 1000 rows (tested)
- SHOULD support CSV files up to 10,000 rows (untested)
- Manual entry: Support at least 50 simultaneous rows (tested up to 20)

**Current limitation**: Sequential processing (not parallelized)

---

## Non-Functional Requirements

### NFR-1: Compatibility

**Browser support**:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

**Esploro version**:
- ✅ July 2024 release or later
- ⚠️ Older versions not tested

### NFR-2: Accessibility

**Priority**: MEDIUM
**Status**: ⚠️ Partial

- MUST support keyboard navigation (tab, enter, escape)
- SHOULD meet WCAG 2.1 AA standards (not audited)
- MUST provide clear focus indicators
- SHOULD support screen readers (not tested)

### NFR-3: Internationalization

**Priority**: LOW
**Status**: ⚠️ Framework only

- i18n framework in place (ngx-translate)
- Only English language currently implemented
- Translation keys defined in `i18n/en.json`
- SHOULD support additional languages (future)

### NFR-4: Documentation

**Priority**: HIGH
**Status**: ✅ Implemented

- ✅ User-facing documentation in README.md
- ✅ Technical documentation in explanation.md
- ✅ Developer quick reference
- ✅ API documentation
- ✅ Visual diagrams

---

## Requirements Traceability

### Implemented Requirements (v1.0.0)

| Requirement ID | Description | Implementation Status |
|----------------|-------------|----------------------|
| REQ-1 | Manual Entry Workflow | ✅ Complete |
| REQ-2 | CSV Upload Workflow | ✅ Complete |
| REQ-3 | API Integration | ✅ Complete |
| REQ-4 | User Interface | ✅ Complete |
| REQ-5 | File Type Management | ✅ Complete |
| REQ-6.1 | Input Sanitization | ✅ Complete |
| REQ-6.2 | Duplicate Detection | ⚠️ Partial |
| REQ-7 | Security & Permissions | ✅ Complete |
| REQ-8.1 | Response Time | ✅ Met |
| REQ-8.2 | Scalability | ⚠️ Partial |

### Deferred Requirements (Future Versions)

See [ROADMAP.md](ROADMAP.md) for planned enhancements:

- Full job automation (create set + run job)
- Parallel CSV processing
- Web Worker for large CSV files
- Advanced duplicate detection
- WCAG 2.1 AA accessibility compliance
- Multi-language support

---

## Requirements Change Process

To propose changes to these requirements:

1. **Review** current requirements and ROADMAP.md
2. **Document** proposed change with rationale
3. **Assess** impact on existing functionality
4. **Update** this document and ROADMAP.md
5. **Communicate** changes to development team

**Change approval authority**: Project owner / Product manager

---

## References

- **User Documentation**: [README.md](README.md)
- **Technical Documentation**: [explanation.md](explanation.md)
- **API Documentation**: [documentation/API to Add new file to Asset.md](documentation/API%20to%20Add%20new%20file%20to%20Asset.md)
- **Future Plans**: [ROADMAP.md](ROADMAP.md)
- **Change History**: [CHANGELOG.md](CHANGELOG.md)

---

**Document owner**: Project team
**Last reviewed**: January 10, 2025
**Next review**: February 10, 2025
