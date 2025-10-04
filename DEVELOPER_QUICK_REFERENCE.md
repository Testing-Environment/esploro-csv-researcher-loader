# Developer Quick Reference Guide

## Esploro Asset File Loader

> **Quick start guide for developers working on the Esploro Asset File Loader project**

### Recent Updates

**New Features (Latest)**:
- ✨ **Bulk URL Update**: Update multiple assets with a single file URL
- ✨ **URL Validation**: Validate remote file URLs for accessibility
- 📖 See [BULK_UPDATE_AND_URL_VALIDATION.md](documentation/BULK_UPDATE_AND_URL_VALIDATION.md) for detailed documentation

---

## Table of Contents

1. [Project Setup](#project-setup)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Common Tasks](#common-tasks)
5. [Key Concepts](#key-concepts)
6. [Debugging Tips](#debugging-tips)
7. [Testing](#testing)
8. [Code Patterns](#code-patterns)
9. [API Reference Quick Guide](#api-reference-quick-guide)
10. [Troubleshooting](#troubleshooting)

---

## Project Setup

### Prerequisites
```bash
# Required software
- Node.js 14.x or higher
- npm 6.x or higher
- Ex Libris Cloud App CLI (@exlibris/exl-cloudapp-angular-lib)
```

### First-Time Setup
```bash
# Clone repository
git clone https://github.com/Testing-Environment/esploro-csv-researcher-loader.git
cd esploro-csv-researcher-loader

# Install dependencies
npm install

# Start development server
npm start
```

### Environment Configuration
```bash
# No .env file required - Cloud App framework handles authentication
# Configuration is managed via Esploro admin console
```

---

## Project Structure

```
esploro-csv-researcher-loader/
├── cloudapp/                    # Main application code
│   └── src/
│       └── app/
│           ├── main/            # File upload component (with tabs)
│           ├── models/          # TypeScript interfaces
│           │   ├── asset.ts     # Asset data model
│           │   └── settings.ts  # Settings/Profile models
│           ├── services/        # Business logic
│           │   ├── asset.service.ts  # API calls for assets
│           │   └── app.service.ts    # Settings management
│           ├── constants/       # Application constants
│           │   └── file-types.ts # File type fallback values
│           └── utilities.ts     # Helper functions
├── documentation/               # API and feature documentation
│   ├── BULK_UPDATE_AND_URL_VALIDATION.md  # New features guide
│   └── ...                     # Other documentation
├── manifest.json               # Cloud App configuration
├── package.json               # Node dependencies
└── README.md                  # User documentation
```

### Key Files

| File | Purpose | When to Edit |
|------|---------|--------------|
| `main.component.ts` | File upload logic | Add/modify upload features |
| `asset.service.ts` | API integration | Add/modify API calls |
| `asset.ts` | Data model | Add/modify asset fields |
| `settings.ts` | Profile configuration | Add/modify profile structure |
| `manifest.json` | App metadata | Update app name, permissions |

---

## Development Workflow

### Standard Development Cycle

```bash
# 1. Start development server
npm start

# 2. Open in browser (Cloud App framework will launch)
# Typically at http://localhost:4200

# 3. Make code changes
# Hot reload is enabled - changes appear automatically

# 4. Run linter (optional, if configured)
npm run lint

# 5. Build for production
npm run build

# 6. Package for deployment
eca package
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit frequently
git add .
git commit -m "Description of changes"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

---

## Common Tasks

### 1. Add a New Asset Field

**Step 1:** Update the Asset model
```typescript
// cloudapp/src/app/models/asset.ts
export interface Asset {
  // ... existing fields
  new_field?: string;  // Add your field
}
```

**Step 2:** Update the service (if needed for API mapping)
```typescript
// cloudapp/src/app/services/asset.service.ts
// Usually no changes needed - field automatically included in requests
```

**Step 3:** Update field options for profiles
```typescript
// cloudapp/src/app/settings/esploro-fields.ts
export const ESPLORO_FIELDS: EsploroField[] = [
  // ... existing fields
  {
    fieldName: 'new_field',
    group: 'General',
    description: 'Description of new field',
    example: 'Example value'
  }
];
```

**Step 4:** Test with a profile
- Create a profile mapping CSV column to `new_field`
- Upload CSV with the new field
- Verify data is sent to API correctly

### 2. Add API Endpoint

```typescript
// cloudapp/src/app/services/asset.service.ts

newApiMethod(param: string): Observable<any> {
  const request: Request = {
    url: `/esploro/v1/your-endpoint/${param}`,
    method: HttpMethod.GET  // or POST, PUT, DELETE
  };
  return this.restService.call(request);
}
```

### 3. Add Form Validation

```typescript
// In component
this.form = this.fb.group({
  assetId: ['', [
    Validators.required,
    Validators.minLength(3),
    Validators.pattern(/^[A-Z0-9]+$/)  // Custom pattern
  ]]
});

// Custom validator function
function customValidator(control: AbstractControl): ValidationErrors | null {
  if (someCondition) {
    return { customError: 'Error message' };
  }
  return null;
}
```

### 4. Add Translation String

```typescript
// cloudapp/src/assets/i18n/en.json
{
  "Main": {
    "YourNewKey": "Your translated text"
  }
}

// Use in template
<p>{{ 'Main.YourNewKey' | translate }}</p>

// Use in component
this.translate.get('Main.YourNewKey').subscribe(text => {
  console.log(text);
});
```

### 5. Handle Loading States

```typescript
// Component
isLoading = false;

loadData() {
  this.isLoading = true;
  this.service.getData()
    .pipe(finalize(() => this.isLoading = false))
    .subscribe({
      next: (data) => { /* handle data */ },
      error: (err) => { /* handle error */ }
    });
}

// Template
<mat-spinner *ngIf="isLoading"></mat-spinner>
<div *ngIf="!isLoading">Content</div>
```

---

## Key Concepts

### 1. Profile-Based Mapping

**Concept:** Users create "profiles" that define how CSV columns map to Esploro asset fields.

```
CSV Column → Profile Field Mapping → API Field Path
"Title"    → header: "Title"       → "title"
           → fieldName: "title"

"Type"     → header: "Type"        → "asset_type.value"
           → fieldName: "asset_type.value"
```

**Code Location:** `settings.component.ts`, `profile.component.ts`

### 2. Asset File Links

**Concept:** Files are not directly uploaded; instead, URLs are provided and Esploro's "Load files" job fetches them.

```typescript
interface AssetFileLink {
  title: string;        // Display name
  url: string;          // HTTP/HTTPS URL to file
  description?: string; // Optional description
  type: string;         // File type (from code table)
  supplemental: boolean;// Is this supplementary material?
}
```

**API Endpoint:** `POST /esploro/v1/assets/{id}?op=patch&action=add`

### 3. Observable Pattern

**Concept:** All async operations use RxJS Observables.

```typescript
// Service returns Observable
getData(): Observable<Asset> {
  return this.restService.call(request);
}

// Component subscribes
this.service.getData().subscribe({
  next: (asset) => { /* success */ },
  error: (err) => { /* error */ }
});

// With operators
this.service.getData()
  .pipe(
    map(asset => asset.title),
    catchError(err => of('Default')),
    finalize(() => this.loading = false)
  )
  .subscribe(title => console.log(title));
```

### 4. Material Design Components

**Concept:** UI uses Angular Material for consistent UX.

```html
<!-- Form field -->
<mat-form-field>
  <mat-label>Label</mat-label>
  <input matInput formControlName="fieldName">
  <mat-error *ngIf="form.get('fieldName')?.hasError('required')">
    Required
  </mat-error>
</mat-form-field>

<!-- Button -->
<button mat-raised-button color="primary">
  Click me
</button>

<!-- Card -->
<mat-card>
  <mat-card-header>Title</mat-card-header>
  <mat-card-content>Content</mat-card-content>
</mat-card>
```

---

## Debugging Tips

### 1. Console Logging

```typescript
// Service debugging
console.log('Request:', request);
console.log('Response:', response);

// Component debugging
console.log('Form value:', this.form.value);
console.log('Form valid:', this.form.valid);
console.log('Form errors:', this.form.errors);

// Pipe operator debugging
tap(data => console.log('Data at this step:', data))
```

### 2. Network Debugging

```bash
# Open browser DevTools
# Navigate to Network tab
# Filter by "XHR" to see API calls
# Check request/response headers and body
```

### 3. Common Issues

**Issue:** "Cannot read property 'value' of null"
```typescript
// Bad
this.form.get('assetId').value

// Good
this.form.get('assetId')?.value
```

**Issue:** Observable never completes
```typescript
// Always unsubscribe in ngOnDestroy
private subscription: Subscription;

ngOnInit() {
  this.subscription = this.service.getData().subscribe(...);
}

ngOnDestroy() {
  this.subscription?.unsubscribe();
}
```

**Issue:** Form not updating
```typescript
// Mark for check if using OnPush strategy
constructor(private cdr: ChangeDetectorRef) {}

updateForm() {
  this.form.patchValue({ ... });
  this.cdr.markForCheck();
}
```

---

## Testing

### Manual Testing Checklist

- [ ] File upload form displays correctly
- [ ] Asset ID validation works
- [ ] File URL must be HTTP/HTTPS
- [ ] File type selector shows options
- [ ] Can add/remove multiple files
- [ ] Submit button disabled when form invalid
- [ ] Success/error messages display
- [ ] Settings page loads profiles
- [ ] Can create/edit/delete profiles
- [ ] Profile validation prevents invalid configs

### Test Data

**Sample Asset ID:** `12345678`

**Sample File URL:** `https://example.com/sample.pdf`

**Sample File Types:**
- `accepted` - Accepted version
- `submitted` - Submitted version
- `supplementary` - Supplementary material

---

## Code Patterns

### 1. Service Call Pattern

```typescript
// In service
methodName(param: string): Observable<ReturnType> {
  const request: Request = {
    url: `/esploro/v1/endpoint/${param}`,
    method: HttpMethod.GET,
    headers: { 'Content-Type': 'application/json' }
  };
  return this.restService.call(request);
}

// In component
this.loading = true;
this.service.methodName(param)
  .pipe(finalize(() => this.loading = false))
  .subscribe({
    next: (data) => {
      this.data = data;
      this.alert.success('Success!');
    },
    error: (error) => {
      const message = error?.message || 'An error occurred';
      this.alert.error(message);
    }
  });
```

### 2. Form Validation Pattern

```typescript
// Component
form: FormGroup;

constructor(private fb: FormBuilder) {
  this.form = this.fb.group({
    field1: ['', Validators.required],
    field2: ['', [Validators.required, Validators.email]]
  });
}

submit() {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }
  
  const value = this.form.value;
  // Process form
}

// Template
<form [formGroup]="form" (ngSubmit)="submit()">
  <mat-form-field>
    <input matInput formControlName="field1">
    <mat-error *ngIf="form.get('field1')?.hasError('required')">
      Required
    </mat-error>
  </mat-form-field>
  
  <button type="submit" [disabled]="form.invalid">Submit</button>
</form>
```

### 3. Error Handling Pattern

```typescript
this.service.methodName()
  .pipe(
    catchError((error: any) => {
      console.error('Error:', error);
      
      // User-friendly message
      let message = 'An unexpected error occurred';
      if (error.status === 404) {
        message = 'Asset not found';
      } else if (error.status === 403) {
        message = 'Permission denied';
      } else if (error.message) {
        message = error.message;
      }
      
      this.alert.error(message);
      return of(null); // Return fallback value
    })
  )
  .subscribe(data => { /* handle data */ });
```

---

## API Reference Quick Guide

### AssetService Methods

```typescript
// Get file types from code table
getFileTypes(): Observable<CodeTableEntry[]>

// Add files to an asset
addFilesToAsset(assetId: string, files: AssetFileLink[]): Observable<any>
```

### AppService Methods

```typescript
// Get settings (includes profiles)
getSettings(): Observable<Settings>

// Save settings
setSettings(settings: Settings): Observable<void>
```

### CloudAppRestService (Ex Libris Library)

```typescript
// Generic API call
call(request: Request): Observable<any>

// Request interface
interface Request {
  url: string;
  method: HttpMethod;
  headers?: { [key: string]: string };
  requestBody?: any;
  queryParams?: { [key: string]: string };
}
```

### AlertService (Ex Libris Library)

```typescript
success(message: string): void
error(message: string): void
warn(message: string): void
info(message: string): void
```

---

## Troubleshooting

### Build Errors

**Error:** `Cannot find module '@angular/...'`
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Error:** TypeScript compilation errors
```bash
# Solution: Check TypeScript version
npm list typescript

# Ensure it matches package.json (~4.1.5)
```

### Runtime Errors

**Error:** "NullInjectorError: No provider for..."
```typescript
// Solution: Add to app.module.ts providers
providers: [
  YourService
]
```

**Error:** API calls return 403 Forbidden
```
// Solution: Check user has required permissions in Esploro
// Required role: "Research Asset Manager" or equivalent
```

**Error:** Form not submitting
```typescript
// Check form validity
console.log(this.form.valid);
console.log(this.form.errors);

// Check individual field errors
Object.keys(this.form.controls).forEach(key => {
  const control = this.form.get(key);
  if (control?.invalid) {
    console.log(`${key}:`, control.errors);
  }
});
```

---

## Useful Commands

```bash
# Development
npm start                 # Start dev server
npm run build            # Build for production
eca package              # Package Cloud App

# Code Quality
npm run lint             # Run linter (if configured)
npm run test             # Run tests (if configured)

# Git
git status               # Check status
git log --oneline -10    # View recent commits
git diff                 # See changes

# Node/npm
npm list                 # List installed packages
npm outdated             # Check for updates
npm audit                # Security audit
```

---

## Additional Resources

### Documentation
- [Main README](README.md) - User documentation
- [Architecture Diagrams](ARCHITECTURE_DIAGRAMS.md) - Visual reference
- [Job Submission Enhancement](JOB_SUBMISSION_ENHANCEMENT.md) - Future features
- [Transformation Summary](TRANSFORMATION_SUMMARY.md) - Historical changes

### External Links
- [Angular Material Docs](https://material.angular.io/)
- [RxJS Documentation](https://rxjs.dev/)
- [Ex Libris Developer Network](https://developers.exlibrisgroup.com/)
- [Esploro API Documentation](https://developers.exlibrisgroup.com/esploro/apis/)

### Community
- Ex Libris Developer Community
- GitHub Issues for bug reports
- Stack Overflow (tag: angular, rxjs)

---

## Quick Tips

💡 **Tip 1:** Use Angular DevTools browser extension for component debugging

💡 **Tip 2:** Enable source maps in production for easier debugging

💡 **Tip 3:** Use `| async` pipe instead of manual subscriptions when possible

💡 **Tip 4:** FormArray is your friend for dynamic form fields (like the file list)

💡 **Tip 5:** Always unsubscribe from observables to prevent memory leaks

💡 **Tip 6:** Use `trackBy` in `*ngFor` for better performance

💡 **Tip 7:** Material Design guidelines are your friend for UX consistency

💡 **Tip 8:** Test with both small and large CSV files (edge cases matter!)

💡 **Tip 9:** The Cloud App framework handles authentication - don't reinvent it

💡 **Tip 10:** When in doubt, check the browser console for errors

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-15  
**Maintained By:** Development Team

---

**Happy Coding! 🚀**
