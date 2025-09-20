# Esploro CSV Researcher Loader - Codebase Analysis

## Project Overview

The **Esploro CSV Researcher Loader** is an Angular-based cloud application designed to bulk update researcher data in Exlibris Esploro research management systems. It provides a user-friendly interface for uploading CSV files and applying researcher data updates through configurable profiles.

### Key Purpose
- Bulk update researcher information in Esploro via CSV uploads
- Support flexible field mapping through configurable profiles
- Handle both ADD (convert users to researchers) and UPDATE operations
- Provide comprehensive validation and error reporting

## Project Structure

```
esploro-csv-researcher-loader/
├── cloudapp/
│   └── src/
│       └── app/
│           ├── main/                    # Main upload/processing component
│           ├── settings/                # Configuration management
│           ├── models/                  # TypeScript interfaces
│           ├── services/                # Business logic services
│           └── utilities/               # Helper functions
├── package.json                         # Dependencies and scripts
├── manifest.json                        # Cloud app configuration
└── README.md                           # Project documentation
```

## Core Technologies & Dependencies

### Framework Stack
- **Angular 11.2.14** - Primary frontend framework
- **Angular Material** - UI component library
- **RxJS 6.5.5** - Reactive programming for async operations

### Key Libraries
- **@exlibris/exl-cloudapp-angular-lib** - Exlibris cloud app framework
- **ngx-papaparse** - CSV parsing functionality
- **ngx-dropzone** - File upload UI component
- **@ngx-translate/core** - Internationalization support
- **lodash** - Utility functions
- **dot-object** - Object property manipulation

## Architecture Overview

### Component Architecture
The application follows Angular's component-based architecture with clear separation of concerns:

```
AppComponent (Root)
├── MainComponent (CSV Upload & Processing)
└── SettingsComponent (Profile Management)
    └── ProfileComponent (Individual Profile Config)
```

### Service Layer
- **ResearcherService** - Handles Esploro API interactions
- **CloudAppSettingsService** - Manages application configuration
- **CloudAppStoreService** - Handles local data persistence

## Core Components Deep Dive

### 1. MainComponent (`main/main.component.ts`)

**Primary Responsibilities:**
- CSV file upload and validation
- Profile selection and configuration
- Batch researcher processing
- Progress tracking and error reporting

**Key Features:**
- **File Upload**: Drag-and-drop CSV upload with validation
- **Profile Management**: Dynamic profile selection with stored preferences
- **Batch Processing**: Parallel processing with configurable limits (MAX_PARALLEL_CALLS = 5)
- **Error Handling**: Comprehensive error logging with row-level tracking
- **Progress Tracking**: Real-time progress indication during processing

**Critical Methods:**
```typescript
loadResearchers() // Initiates CSV parsing
parsedResearchers() // Handles parsed CSV data
processResearcher() // Individual researcher processing
processResearcherWithLogging() // Wrapper with error handling
verifyCsvHeaderAgainstProfile() // Header validation
```

### 2. SettingsComponent (`settings/settings.component.ts`)

**Purpose:** Profile configuration management for field mapping

**Key Features:**
- Create/edit/delete processing profiles
- Field mapping configuration
- Profile type selection (ADD/UPDATE)
- Import/export profile configurations

### 3. Data Models

#### Researcher Interface (`models/researcher.ts`)
Comprehensive TypeScript interface modeling Esploro's researcher data structure:

```typescript
interface Researcher {
    primary_id: string;
    is_researcher?: boolean;
    researcher?: {
        // Personal information
        researcher_first_name?: string;
        researcher_last_name: string;
        
        // Professional details
        researcher_organization_affiliation?: OrganizationAffiliation[];
        researcher_education?: EducationRecord[];
        researcher_keyword?: KeywordRecord[];
        
        // ... extensive field definitions
    };
}
```

#### Settings & Profile Models (`models/settings.ts`)
```typescript
interface Profile {
    name: string;
    profileType: ProfileType; // ADD | UPDATE
    fields: Field[]; // Field mapping configuration
}

interface Field {
    header: string;    // CSV column header
    default: string;   // Default value
    fieldName: string; // Target Esploro field
}
```

## Data Flow Analysis

### 1. CSV Upload Flow
```
File Upload → CSV Parsing → Header Validation → Profile Mapping → Processing Queue
```

### 2. Researcher Processing Flow
```
CSV Row → Field Mapping → API Validation → Esploro API Call → Result Logging
```

### 3. Profile Configuration Flow
```
Settings UI → Profile Creation → Field Mapping → Validation → Storage
```

## Key Business Logic

### 1. Profile Types
- **ADD**: Converts existing Esploro users to researchers
- **UPDATE**: Updates existing researcher records

### 2. Field Mapping Strategy
- Configurable field mappings through profiles
- Support for default values
- Flexible header naming conventions
- Multi-value field support (lists, affiliations)

### 3. Validation Layers
- **CSV Structure**: Header validation against profiles
- **Data Integrity**: Required field validation
- **API Constraints**: Esploro-specific business rules
- **Permission Checks**: Role-based access validation

### 4. Error Handling Strategy
- Row-level error tracking with line numbers
- Comprehensive error categorization
- Graceful degradation on partial failures
- Detailed logging for troubleshooting

## Performance Considerations

### 1. Parallel Processing
- Configurable parallel API calls (MAX_PARALLEL_CALLS = 5)
- Thread-safe primary ID generation handling
- Memory-efficient streaming for large files

### 2. Limits & Constraints
- Maximum 500 researchers per CSV (MAX_RESEARCHERS_IN_CSV)
- Chunked processing to prevent memory issues
- Progressive result reporting

## Security & Permissions

### Required Esploro Permissions
- `USER_MANAGER_VIEW` - Read user data
- `USER_MANAGER_UPDATE` - Modify user/researcher data

### Typical Roles
- `USER_ADMINISTRATOR`
- `USER_MANAGER_FULL`

## Configuration Management

### 1. Cloud App Manifest (`manifest.json`)
```json
{
    "id": "esploro-csv-researcher-loader",
    "title": "CSV Researcher Loader",
    "contentSecurity": {
        "sandbox": {
            "modals": true,
            "downloads": true
        }
    }
}
```

### 2. Application Settings
- Profile configurations stored via CloudAppSettingsService
- User preferences (selected profile, log visibility) via CloudAppStoreService
- Persistent configuration across sessions

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

### 3. Async Processing Pattern
```typescript
from(researchers.map((researcher, index) => 
    this.processResearcherWithLogging(researcher, index)
)).pipe(
    mergeMap(observable => observable, maxParallelCalls),
    tap(result => resultsArray.push(result)),
    catchError(error => /* error handling */)
)
```

## Documentation Gaps & Improvement Areas

### Missing Documentation
1. **API Error Code Mapping** - No documentation of Esploro API error responses
2. **Field Mapping Examples** - Limited examples of complex field mappings
3. **Performance Tuning** - No guidance on optimal batch sizes
4. **Testing Strategy** - No unit tests visible in current structure

### Code Quality Observations
1. **Positive Aspects:**
   - Clear separation of concerns
   - Comprehensive error handling
   - Type safety with TypeScript interfaces
   - Reactive programming patterns

2. **Areas for Improvement:**
   - Large component methods could be refactored
   - Some magic numbers should be configurable
   - Error messages could be more user-friendly

## Usage Workflows

### 1. Initial Setup
1. Install cloud app in Esploro
2. Configure profiles in Settings
3. Map CSV headers to Esploro fields

### 2. Typical Processing Workflow
1. Select appropriate profile
2. Upload CSV file
3. Validate headers against profile
4. Confirm processing operation
5. Monitor progress and review results

### 3. Profile Management
1. Create new profile
2. Define field mappings
3. Set default values
4. Test with sample data
5. Save and activate profile

## Development Environment

### Build & Development
```bash
npm start              # Start development server
eca start             # Exlibris cloud app development
```

### Key Configuration Files
- `package.json` - Dependencies and scripts
- `angular.json` - Angular CLI configuration
- `tsconfig.json` - TypeScript configuration
- `.vscode/settings.json` - IDE configuration

## Questions for Further Clarification

1. **API Rate Limits** - What are Esploro's API rate limiting policies?
2. **Field Validation Rules** - Are there documented validation rules for each Esploro field?
3. **Rollback Strategy** - Is there a mechanism to undo bulk updates?
4. **Audit Logging** - Does the system maintain audit trails for compliance?
5. **Testing Data** - Are there sample CSV files and test profiles available?

This codebase represents a well-structured Angular application with clear business logic separation and comprehensive error handling, designed specifically for Exlibris Esploro integration.