# Developer Quick Reference Guide

## Quick Start

### Prerequisites
- Node.js v20+ and npm 10+
- Ex Libris Cloud Apps CLI (`npm install -g @exlibris/exl-cloudapp-angular-cli`)
- Access to an Esploro development environment

### Setup
```bash
# Clone the repository
git clone https://github.com/Testing-Environment/esploro-csv-researcher-loader.git
cd esploro-csv-researcher-loader

# Install dependencies
npm install

# Start development server
npm start
```

The app will be available at `http://localhost:4200` and can be loaded into Esploro via the Cloud Apps developer tools.

---

## Project Structure

```
esploro-csv-researcher-loader/
├── cloudapp/                    # Angular application
│   └── src/
│       └── app/
│           ├── main/            # Main file upload component
│           │   ├── main.component.ts
│           │   ├── main.component.html
│           │   └── main.component.scss
│           ├── settings/        # Settings/configuration (unused in current version)
│           │   ├── settings.component.ts
│           │   └── profile/
│           ├── models/          # TypeScript interfaces
│           │   ├── asset.ts     # AssetFileLink interface
│           │   └── settings.ts  # Settings models
│           ├── services/        # Business logic
│           │   └── asset.service.ts
│           ├── app.module.ts    # App module definition
│           └── app-routing.module.ts
├── documentation/               # Documentation files
│   ├── CLEANUP_SUMMARY.md
│   ├── JOB_SUBMISSION_ENHANCEMENT.md
│   └── Expanded_Esploro_Schema.md
├── manifest.json               # Cloud App manifest
├── package.json                # NPM dependencies
└── README.md                   # User documentation
```

---

## Core Components

### MainComponent
**Location**: `cloudapp/src/app/main/main.component.ts`

**Purpose**: Handles the file upload form and submission logic

**Key Methods**:
- `submit()`: Validates form and calls AssetService
- `addFile()`: Adds another file input group to the form
- `removeFile(index)`: Removes a file input group
- `loadFileTypes()`: Fetches available file types from Esploro

**Form Structure**:
```typescript
{
  assetId: string,          // Required: Target asset ID
  files: [                  // Array of file metadata
    {
      title: string,        // Required: Display name
      url: string,          // Required: HTTP(S) URL
      description: string,  // Optional: Description
      type: string,         // Required: File type code
      supplemental: boolean // Is this a supplemental file?
    }
  ]
}
```

### AssetService
**Location**: `cloudapp/src/app/services/asset.service.ts`

**Purpose**: Handles API communication with Esploro

**Key Methods**:

#### `addFilesToAsset(assetId: string, files: AssetFileLink[]): Observable<any>`
Queues files for attachment to an asset.

**API Call**: `POST /esploro/v1/assets/{assetId}?op=patch&action=add`

**Payload Format**:
```json
{
  "records": [
    {
      "temporary": {
        "linksToExtract": [
          {
            "link.title": "File Name",
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

#### `getFileTypes(): Observable<CodeTableEntry[]>`
Retrieves file type options from Esploro code tables.

**API Call**: `GET /conf/code-tables/AssetFileType?view=brief`

**Returns**: Array of `{ value: string, description: string }`

---

## Data Models

### AssetFileLink
```typescript
export interface AssetFileLink {
  title: string;          // Display name in Esploro
  url: string;            // Download URL (must be HTTP/HTTPS)
  description?: string;   // Optional description
  type: string;           // File type code (from AssetFileType table)
  supplemental: boolean;  // Is this a supplemental file?
}
```

### CodeTableEntry
```typescript
export interface CodeTableEntry {
  value: string;          // Code value (e.g., "accepted")
  description?: string;   // Human-readable description
}
```

---

## API Integration

### Esploro Assets API
**Base URL**: `/esploro/v1/assets`

**Used Endpoints**:

#### Add Files to Asset (PATCH)
```
POST /esploro/v1/assets/{assetId}?op=patch&action=add
Content-Type: application/json

{
  "records": [{
    "temporary": {
      "linksToExtract": [...]
    }
  }]
}
```

### Alma Configuration API
**Base URL**: `/conf`

**Used Endpoints**:

#### Get Code Table
```
GET /conf/code-tables/{codeTableName}?view=brief
```

---

## Common Tasks

### Add a New File Type
File types are configured in Esploro, not in the app:
1. Go to Esploro Configuration Menu
2. Navigate to Repository > Asset Details > File and Link Types
3. Add or modify file type codes
4. The app will automatically pick up changes via `getFileTypes()`

### Customize Fallback File Types
If the API call fails, the app uses hardcoded fallback types:

```typescript
// In main.component.ts
private readonly fallbackFileTypes: CodeTableEntry[] = [
  { value: 'accepted', description: 'Accepted version' },
  { value: 'submitted', description: 'Submitted version' },
  { value: 'supplementary', description: 'Supplementary material' },
  { value: 'administrative', description: 'Administrative' }
];
```

To customize, edit the `fallbackFileTypes` array.

### Handle API Errors
The app uses the Ex Libris `AlertService` for user notifications:

```typescript
this.alert.success('Operation successful');
this.alert.error('Operation failed');
this.alert.warn('Warning message');
```

Errors from the API are caught and displayed to the user with context.

### Add Form Validation
Use Angular's reactive forms validators:

```typescript
this.fb.group({
  myField: ['', [
    Validators.required,
    Validators.pattern(/regex/),
    Validators.minLength(5)
  ]]
});
```

---

## Testing

### Manual Testing in Esploro
1. Build the app: `npm start`
2. In Esploro, open Cloud Apps and enable Developer Mode
3. Add app from `http://localhost:4200`
4. Test with a real asset ID and accessible file URLs

### Test Cases to Cover
- ✅ Valid asset ID with one file
- ✅ Valid asset ID with multiple files
- ✅ Invalid asset ID (should show API error)
- ✅ Invalid file URL (should show validation error)
- ✅ Missing required fields (should prevent submission)
- ✅ File type dropdown loads correctly
- ✅ File type dropdown falls back when API fails
- ✅ Form resets after successful submission
- ✅ Asset ID is retained after submission

### Common Test Asset IDs
Esploro uses long numeric IDs like: `12345678900001234`

You'll need valid asset IDs from your Esploro instance for testing.

---

## Deployment

### Build for Production
```bash
npm run build
```

Builds are output to `dist/` directory (if configured).

### Deploy to Esploro
1. Package the app according to Ex Libris Cloud Apps guidelines
2. Upload to the Developer Network or deploy directly
3. Ensure users have proper permissions:
   - View research assets
   - Modify research assets

### Manifest Configuration
Edit `manifest.json` to customize:
- **id**: Unique identifier for your app
- **title**: Display name in Esploro
- **description**: Short description
- **pages.help**: Link to help documentation
- **icon.value**: Path to app icon

---

## Troubleshooting

### File Types Not Loading
**Symptom**: Dropdown shows only fallback file types

**Causes**:
1. Code table name mismatch (check `FILE_TYPE_CODE_TABLE` constant)
2. User lacks permissions to read configuration
3. Network error

**Solution**: Check browser console, verify code table exists in Esploro

### API Call Fails
**Symptom**: Error message after submission

**Causes**:
1. Invalid asset ID
2. Asset doesn't exist
3. User lacks modify permissions
4. Malformed file URLs

**Solution**: Check error message, verify asset ID and permissions

### Form Not Resetting
**Symptom**: Form shows previous data after submission

**Causes**: Bug in `resetFiles()` method

**Solution**: Check that form controls are properly reset:
```typescript
this.form.reset();
this.form.markAsPristine();
this.form.markAsUntouched();
```

---

## Code Style

### TypeScript
- Use strict typing
- Avoid `any` types where possible
- Use interfaces for data structures
- Follow Angular style guide

### Component Structure
```typescript
export class MyComponent implements OnInit {
  // Public properties
  public myProperty: string;

  // Private properties
  private myPrivateProperty: string;

  // Constructor with dependency injection
  constructor(private service: MyService) { }

  // Lifecycle hooks
  ngOnInit(): void { }

  // Public methods
  public myMethod(): void { }

  // Private methods
  private myPrivateMethod(): void { }
}
```

### Observables
- Always unsubscribe in `ngOnDestroy()` or use `finalize()`
- Use RxJS operators for transformation
- Handle errors with `catchError()` or error callback

---

## Useful Resources

### Ex Libris Documentation
- [Cloud Apps Framework](https://developers.exlibrisgroup.com/cloudapps/)
- [Esploro API Documentation](https://developers.exlibrisgroup.com/alma/apis/)
- [Esploro Online Help](https://knowledge.exlibrisgroup.com/Esploro/Product_Documentation/Esploro_Online_Help_(English))

### Angular Resources
- [Angular Documentation](https://angular.io/docs)
- [Angular Material](https://material.angular.io/)
- [RxJS Documentation](https://rxjs.dev/)

### Repository Documentation
- `README.md` - User-facing documentation
- `documentation/CLEANUP_SUMMARY.md` - Legacy code removal
- `documentation/JOB_SUBMISSION_ENHANCEMENT.md` - Future enhancement ideas
- `documentation/Expanded_Esploro_Schema.md` - Database schema reference

---

## Quick Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production (if configured)
npm run build

# Lint code (if configured)
npm run lint

# Run tests (if configured)
npm test
```

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub
```

---

## Need Help?

- Check the [Esploro Online Help](https://knowledge.exlibrisgroup.com/Esploro)
- Review [API Documentation](https://developers.exlibrisgroup.com/alma/apis/)
- Contact Ex Libris Developer Network
- Review existing documentation in the `documentation/` folder

---

## Changelog

### Current Version (File Uploader)
- Simple form-based file attachment to assets
- Dynamic file type loading from code tables
- Multi-file support
- Form validation and error handling

### Legacy Version (Removed)
- CSV-based researcher data loading
- Profile-based field mapping
- Bulk update operations

See `documentation/CLEANUP_SUMMARY.md` for details on removed features.
