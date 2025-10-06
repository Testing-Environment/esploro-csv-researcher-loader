# Pending Changes and Improvements

## Asset Validation Enhancement (Stage 1)

**Status**: Documentation Updated  
**Date**: January 2025  
**Type**: Logic Enhancement

### Description
Enhanced the Stage 1 asset validation process to include comprehensive asset ID validation, data extraction, and preparation for post-processing comparison (diffing).

### Key Changes to Documentation

1. **Batch Asset Validation**: Updated description to clarify that asset validation uses `GET /esploro/v1/assets/{assetIds}` in batch mode
2. **Diffing List Management**: Added explanation of how valid asset data (type, existing files) is stored for later comparison
3. **Retry List Tracking**: Documented how invalid asset IDs are tracked and revalidated
4. **Dynamic List Management**: Described how the component handles:
   - Removal of invalid asset IDs when all associated rows are deleted
   - Addition of new asset IDs when rows are added during Stage 1
   - Removal of valid asset IDs when rows/files are deleted
5. **Final Validation Process**: Clarified the retry mechanism and data consolidation

### Implementation Requirements

When implementing this enhancement in the actual codebase:

1. **Data Structures Needed**:
   ```typescript
   // Track valid assets with their metadata for diffing
   private diffingList = new Map<string, AssetMetadata>();
   
   // Track invalid asset IDs for retry validation
   private retryList = new Set<string>();
   ```

2. **Methods to Implement/Update**:
   - `validateStageOneEntries()` - Enhanced batch validation logic
   - `trackAssetForDiffing()` - Store valid asset data
   - `addToRetryList()` - Track invalid asset IDs
   - `cleanupRemovedAssets()` - Remove deleted asset IDs from tracking lists
   - `retryAssetValidation()` - Process retry list

3. **API Integration**:
   - Update `AssetService` to support batch asset retrieval
   - Implement proper error handling for partial batch failures
   - Add methods for extracting asset type and file data

### Benefits
- More efficient asset validation through batching
- Better preparation for post-processing comparison
- Improved user experience with dynamic list management
- Reduced API calls through intelligent retry mechanisms

### Related Files
- `cloudapp/src/app/main/main.component.ts` - Primary implementation
- `cloudapp/src/app/services/asset.service.ts` - API integration updates
- `cloudapp/src/app/models/asset.ts` - Potential model updates
- `explaination.md` - Documentation updated

---

## Future Pending Changes

### Placeholder for Additional Changes
- Document new features, bug fixes, and enhancements here
- Include implementation status, dates, and related files
- Maintain chronological order for tracking purposes

---

# Pending Changes for Asset ID Management

## Dynamic Asset ID Management During Stage 1

### Overview
Implement dynamic tracking and visual feedback for asset ID changes during the Stage 1 retry validation phase.

### Requirements

#### 1. Diffing List Management
- **Remove from Diffing List**: When a valid asset ID is completely removed from all rows (either by field editing or row deletion), remove the corresponding entry from the diffing list
- **Maintain Diffing List**: When a valid asset ID field is changed to an already-validated asset ID, no changes are made to the diffing list

#### 2. Retry List Management  
- **Add to Retry List**: When a valid row's asset ID field is changed to a new (unvalidated) asset ID, add the new asset ID to the retry list

#### 3. Visual Feedback
- **Yellow Highlighting**: Apply yellow background color to rows when:
  - Asset ID field is changed to an already-validated asset ID (exists in diffing list)
- **Remove Highlighting**: Remove yellow highlighting when asset ID is reverted to original valid ID
  **Orange Highlighting**: Apply orange background color to rows when:
  - Asset ID field is changed to a new asset ID (will be added to retry list)
  - A new row is added with a new asset ID
- **Remove highlighting**: when asset ID is reverted to original valid ID

#### 4. Row Sorting
- **Dynamic Sorting**: When a valid row's asset ID is changed to a new (unvalidated) asset ID:
  - Highlight the row in yellow
  - Move the row to appear just under the invalid rows section
  - Maintain the overall sorting: Invalid rows → Newly invalid rows → Valid rows

### Implementation Areas

#### MainComponent Updates Required
1. **Asset ID Change Detection**: Monitor asset ID field changes in valid rows
2. **Diffing List Updates**: Remove entries when asset IDs are completely removed
3. **Retry List Updates**: Add new asset IDs when valid rows are changed
4. **Visual State Management**: Apply yellow highlighting based on asset ID status
5. **Row Sorting Logic**: Dynamically reorder rows based on validation state

#### CSS Updates Required
1. **Yellow Highlight Style**: Add CSS class for yellow background highlighting
2. **Row State Classes**: Ensure proper styling for invalid, newly-invalid, and valid row states

#### Form Management Updates Required
1. **FormArray Monitoring**: Track changes to asset ID fields in valid rows
2. **State Synchronization**: Keep diffing list and retry list synchronized with form state
3. **Validation State Tracking**: Maintain accurate validation state per row

### Testing Scenarios
1. Edit valid row's asset ID to existing validated asset ID (should highlight yellow, no list changes)
2. Edit valid row's asset ID to new asset ID (should highlight yellow, add to retry list, reorder)
3. Delete all rows for a valid asset ID (should remove from diffing list)
4. Change valid row's asset ID back to original (should remove highlighting, clean up lists)

### Notes
- This functionality only applies during Stage 1 retry validation phase
- Yellow highlighting serves as visual feedback for asset ID reference status
- Row sorting maintains user experience by grouping similar validation states

---

## Deleted Entries Management and Export Feature

**Status**: Documentation Updated  
**Date**: January 2025  
**Type**: Feature Enhancement

### Description
Implement a comprehensive deleted entries management system that preserves deleted rows, provides visual separation, and offers export capabilities for deleted, valid, and invalid entries.

### Key Features

#### 1. Deleted List Management
- **Active Rows**: Rows currently being considered for manual entry
- **Inactive Rows**: Rows that have been deleted after any fields were populated
- **Deleted List**: Collection of inactive rows maintained until job submission

#### 2. Visual Presentation
- **Collapsible Section**: Deleted entries appear in a collapsible section below all active rows
- **Conditional Display**: Section only appears when deleted list is not empty
- **Greyed-Out Styling**: Deleted rows displayed with reduced opacity/greyed styling
- **Section Header**: Clear header indicating "Deleted Entries" with row count

#### 3. Export Capabilities

##### Immediate Export
- **Location**: Export button in the same row as the collapsible section header
- **Button**: "Export Deleted Entries as CSV file"
- **Functionality**: Allows users to export deleted rows at any time
- **Use Case**: Preserve deleted data for later reference or recovery

##### Pre-Submission Export Options
Before clicking "Proceed to Import Asset Files", users are presented with three checkboxes:

1. **Export Deleted Entries as CSV file**
   - Downloads all inactive/deleted rows
   - Maintains deleted list state

2. **Export Valid Entries as CSV file**
   - Downloads all successfully validated rows
   - Includes all required fields and metadata

3. **Export Invalid Entries as CSV file**
   - Downloads all rows that failed validation
   - Includes error information for troubleshooting

#### 4. Lifecycle Management
- **Persistence**: Deleted list persists throughout Stage 1 and Stage 2
- **Clearing**: Deleted list is only cleared after successful job submission
- **No Validation**: Deleted entries are excluded from all validation processes
- **No Submission**: Deleted entries are not included in API submissions

### Implementation Requirements

#### Data Structures
```typescript
// Track deleted entries
private deletedList: FormGroup[] = [];

// Track deletion metadata
interface DeletedEntry {
  formGroup: FormGroup;
  deletedAt: Date;
  reason?: string;
}
```

#### Methods to Implement

1. **Row Deletion Logic**
```typescript
removeEntry(index: number): void {
  const group = this.entries.at(index) as FormGroup;
  
  // Check if any fields are populated
  if (this.hasPopulatedFields(group)) {
    // Move to deleted list instead of permanent removal
    this.deletedList.push(group);
  }
  
  // Remove from active entries
  this.entries.removeAt(index);
  
  // Update asset tracking lists
  this.cleanupRemovedAssets(group);
}

private hasPopulatedFields(group: FormGroup): boolean {
  // Check if any field has a value
  return Object.keys(group.controls).some(key => {
    const value = group.get(key)?.value;
    return value !== null && value !== '' && value !== false;
  });
}
```

2. **Export Functionality**
```typescript
exportDeletedEntries(): void {
  const csvData = this.convertToCSV(this.deletedList);
  this.downloadCSV(csvData, 'deleted-entries.csv');
}

exportValidEntries(): void {
  const validRows = this.getValidatedRows();
  const csvData = this.convertToCSV(validRows);
  this.downloadCSV(csvData, 'valid-entries.csv');
}

exportInvalidEntries(): void {
  const invalidRows = this.getInvalidRows();
  const csvData = this.convertToCSV(invalidRows);
  this.downloadCSV(csvData, 'invalid-entries.csv');
}

private convertToCSV(rows: FormGroup[]): string {
  // Convert form data to CSV format
  // Include headers: Asset ID, URL, Title, Description, Type, Supplemental
}

private downloadCSV(data: string, filename: string): void {
  // Create blob and trigger download
}
```

3. **Clear Deleted List**
```typescript
clearDeletedList(): void {
  this.deletedList = [];
}

// Call after successful submission
executeSubmission(skippedStageTwo: boolean): void {
  // ...existing submission logic...
  
  // Clear deleted list on success
  this.clearDeletedList();
}
```

#### Template Updates

1. **Active Rows Section**
```html
<!-- Stage 1 active rows -->
<section formArrayName="entries" class="active-entries">
  <mat-card *ngFor="let entryGroup of entries.controls; let i = index" 
            [formGroupName]="i"
            [class.invalid-row]="/* invalid logic */"
            [class.yellow-highlight]="/* yellow highlight logic */"
            [class.orange-highlight]="/* orange highlight logic */">
    <!-- Asset ID, URL, title, description fields -->
    <button mat-icon-button type="button" (click)="removeEntry(i)">
      <mat-icon>delete</mat-icon>
    </button>
  </mat-card>
</section>
```

2. **Deleted Entries Section**
```html
<!-- Deleted entries section (collapsible) -->
<mat-expansion-panel *ngIf="deletedList.length > 0" class="deleted-entries-section">
  <mat-expansion-panel-header>
    <mat-panel-title>
      Deleted Entries ({{ deletedList.length }})
    </mat-panel-title>
    <button mat-stroked-button 
            type="button" 
            (click)="exportDeletedEntries(); $event.stopPropagation()">
      <mat-icon>download</mat-icon>
      Export Deleted Entries as CSV file
    </button>
  </mat-expansion-panel-header>
  
  <div class="deleted-rows">
    <mat-card *ngFor="let deletedGroup of deletedList" 
              class="deleted-row greyed-out">
      <!-- Display deleted row data (read-only) -->
      <div class="deleted-row-content">
        <div><strong>Asset ID:</strong> {{ deletedGroup.get('assetId')?.value }}</div>
        <div><strong>URL:</strong> {{ deletedGroup.get('url')?.value }}</div>
        <div *ngIf="deletedGroup.get('title')?.value">
          <strong>Title:</strong> {{ deletedGroup.get('title')?.value }}
        </div>
        <!-- Other fields -->
      </div>
    </mat-card>
  </div>
</mat-expansion-panel>
```

3. **Pre-Submission Export Options**
```html
<!-- Export options before final submission -->
<div class="export-options" *ngIf="stage === 'stage1' && allEntriesValidated">
  <h3>Export Options (Optional)</h3>
  
  <mat-checkbox [(ngModel)]="exportDeletedOnSubmit" 
                [ngModelOptions]="{standalone: true}">
    Export Deleted Entries as CSV file
  </mat-checkbox>
  
  <mat-checkbox [(ngModel)]="exportValidOnSubmit" 
                [ngModelOptions]="{standalone: true}">
    Export Valid Entries as CSV file
  </mat-checkbox>
  
  <mat-checkbox [(ngModel)]="exportInvalidOnSubmit" 
                [ngModelOptions]="{standalone: true}"
                *ngIf="hasInvalidEntries()">
    Export Invalid Entries as CSV file
  </mat-checkbox>
  
  <button mat-raised-button 
          color="primary" 
          type="button"
          (click)="proceedToImport()">
    Proceed to Import Asset Files
  </button>
</div>
```

#### CSS Updates

```scss
// Deleted entries section styling
.deleted-entries-section {
  margin-top: 24px;
  border: 1px solid #e0e0e0;
  
  .mat-expansion-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.deleted-row {
  &.greyed-out {
    opacity: 0.5;
    background-color: #f5f5f5;
    pointer-events: none;
  }
  
  .deleted-row-content {
    padding: 12px;
    
    div {
      margin-bottom: 8px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.export-options {
  margin-top: 24px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  
  h3 {
    margin-top: 0;
    margin-bottom: 16px;
  }
  
  mat-checkbox {
    display: block;
    margin-bottom: 12px;
  }
  
  button {
    margin-top: 16px;
  }
}
```

#### Component Properties

```typescript
export class MainComponent implements OnInit {
  // ...existing properties...
  
  // Deleted entries management
  deletedList: FormGroup[] = [];
  
  // Export options
  exportDeletedOnSubmit = false;
  exportValidOnSubmit = false;
  exportInvalidOnSubmit = false;
  
  // Validation state
  allEntriesValidated = false;
  
  // ...existing code...
}
```

#### Submission Flow Update

```typescript
proceedToImport(): void {
  // Handle export requests based on checkboxes
  if (this.exportDeletedOnSubmit && this.deletedList.length > 0) {
    this.exportDeletedEntries();
  }
  
  if (this.exportValidOnSubmit) {
    this.exportValidEntries();
  }
  
  if (this.exportInvalidOnSubmit) {
    this.exportInvalidEntries();
  }
  
  // Proceed with submission
  if (this.stageTwoSkipped) {
    this.proceedWithoutSelectingTypes();
  } else {
    this.specifyTypesForEachFile();
  }
}
```

---

## Dynamic Field Selection Feature

**Status**: Documentation Updated  
**Date**: January 2025  
**Type**: Feature Enhancement

### Description
Implement a dynamic field selection system that allows users to choose which optional fields to include in the manual entry form. This provides a cleaner UI and reduces cognitive load by showing only relevant fields.

### Key Features

#### 1. Field Toggle Controls
- **Location**: Top of Stage 1, above the entry rows
- **Style**: Chip-style or button-toggle-group Material components
- **Always Visible Fields**: Asset ID and File URL (cannot be toggled off)
- **Optional Fields**: Title, Description, File Type, Supplemental

#### 2. Toggle Behavior
- **Initial State**: Only Asset ID and File URL visible by default
- **Click to Activate**: User clicks field toggle to show the column
- **Click to Deactivate**: User clicks again to hide the column
- **Visual Feedback**: 
  - Active toggles highlighted with primary color
  - Inactive toggles appear in default/muted color
  - Smooth show/hide animations for columns

#### 3. Field State Management
- **Show/Hide**: Toggle controls visibility of columns in all rows
- **Data Preservation**: Values in hidden fields are preserved (not cleared)
- **Submission Exclusion**: Hidden fields excluded from API submission
- **Form Validation**: Hidden fields excluded from validation checks

#### 4. User Experience
- **Persistent State**: Field selection state maintained throughout Stage 1 and Stage 2
- **Smart Defaults**: Common fields (Title, File Type) can be pre-selected
- **Tooltip Guidance**: Each toggle has tooltip explaining the field purpose

### Implementation Requirements

#### Data Structures

```typescript
// Track which optional fields are active
interface FieldConfig {
  name: string;
  label: string;
  active: boolean;
  tooltip: string;
  formControlName: string;
}

private optionalFields: FieldConfig[] = [
  {
    name: 'title',
    label: 'File Title',
    active: false,
    tooltip: 'Display name for the file in Esploro',
    formControlName: 'title'
  },
  {
    name: 'description',
    label: 'Description',
    active: false,
    tooltip: 'Additional context or notes about the file',
    formControlName: 'description'
  },
  {
    name: 'type',
    label: 'File Type',
    active: false,
    tooltip: 'Category/type of file (e.g., Supplementary material)',
    formControlName: 'type'
  },
  {
    name: 'supplemental',
    label: 'Supplemental',
    active: false,
    tooltip: 'Mark as supplemental/additional file',
    formControlName: 'supplemental'
  }
];

// Required fields (always visible)
private requiredFields: FieldConfig[] = [
  {
    name: 'assetId',
    label: 'Asset ID',
    active: true,
    tooltip: 'Esploro asset identifier',
    formControlName: 'assetId'
  },
  {
    name: 'url',
    label: 'File URL',
    active: true,
    tooltip: 'HTTP(S) URL where file can be downloaded',
    formControlName: 'url'
  }
];
```

#### Methods to Implement

```typescript
toggleField(field: FieldConfig): void {
  field.active = !field.active;
  
  if (field.active) {
    // Field activated - show column
    this.showFieldColumn(field.formControlName);
  } else {
    // Field deactivated - hide column and clear validators
    this.hideFieldColumn(field.formControlName);
  }
}

private showFieldColumn(fieldName: string): void {
  // Add validators if needed (e.g., title might be required when shown)
  this.entries.controls.forEach(group => {
    const control = group.get(fieldName);
    if (control) {
      // Optionally add validators based on field requirements
      if (fieldName === 'title' || fieldName === 'type') {
        control.setValidators([Validators.required]);
      }
      control.updateValueAndValidity();
    }
  });
}

private hideFieldColumn(fieldName: string): void {
  // Remove validators for hidden fields
  this.entries.controls.forEach(group => {
    const control = group.get(fieldName);
    if (control) {
      control.clearValidators();
      control.updateValueAndValidity();
    }
  });
}

isFieldActive(fieldName: string): boolean {
  // Check if field should be displayed
  const requiredField = this.requiredFields.find(f => f.formControlName === fieldName);
  if (requiredField) return true; // Required fields always active
  
  const optionalField = this.optionalFields.find(f => f.formControlName === fieldName);
  return optionalField?.active || false;
}

getActiveFields(): FieldConfig[] {
  // Return all active fields for form submission
  return [
    ...this.requiredFields,
    ...this.optionalFields.filter(f => f.active)
  ];
}

buildFilePayload(group: FormGroup): any {
  // Build payload only with active fields
  const payload: any = {
    'link.url': group.get('url')?.value,
    'link.title': group.get('assetId')?.value // Default title if not provided
  };
  
  // Include optional fields only if active and populated
  this.optionalFields.forEach(field => {
    if (field.active) {
      const value = group.get(field.formControlName)?.value;
      if (value !== null && value !== '' && value !== undefined) {
        const apiFieldName = this.getApiFieldName(field.formControlName);
        payload[apiFieldName] = value;
      }
    }
  });
  
  return payload;
}

private getApiFieldName(formControlName: string): string {
  const mapping: Record<string, string> = {
    'title': 'link.title',
    'description': 'link.description',
    'type': 'link.type',
    'supplemental': 'link.supplemental'
  };
  return mapping[formControlName] || formControlName;
}
```

#### Template Updates

```html
<!-- Field selection toggles at top of Stage 1 -->
<div class="field-selection-container" *ngIf="stage === 'stage1'">
  <h3>Select Fields to Include</h3>
  <p class="field-selection-hint">
    <mat-icon>info</mat-icon>
    Asset ID and File URL are always required. Choose additional fields as needed.
  </p>
  
  <mat-chip-list class="field-toggles" selectable multiple>
    <!-- Required fields (always shown, not toggleable) -->
    <mat-chip *ngFor="let field of requiredFields" 
              selected 
              disabled
              [matTooltip]="field.tooltip">
      <mat-icon>lock</mat-icon>
      {{ field.label }}
      <span class="required-badge">Required</span>
    </mat-chip>
    
    <!-- Optional fields (toggleable) -->
    <mat-chip *ngFor="let field of optionalFields"
              [selected]="field.active"
              (click)="toggleField(field)"
              [matTooltip]="field.tooltip"
              class="toggle-chip">
      <mat-icon *ngIf="field.active">check_circle</mat-icon>
      <mat-icon *ngIf="!field.active">add_circle_outline</mat-icon>
      {{ field.label }}
    </mat-chip>
  </mat-chip-list>
</div>

<!-- Active rows with dynamic field visibility -->
<section formArrayName="entries" class="active-entries">
  <mat-card *ngFor="let entryGroup of entries.controls; let i = index" 
            [formGroupName]="i"
            [class.invalid-row]="isInvalidRow(entryGroup)"
            [class.duplicate-row]="isDuplicateRow(entryGroup)"
            [class.yellow-highlight]="isYellowHighlight(entryGroup)"
            [class.orange-highlight]="isOrangeHighlight(entryGroup)"
            [matTooltip]="getRowTooltip(entryGroup)"
            matTooltipPosition="above"
            matTooltipShowDelay="500">
    
    <div class="entry-row-header">
      <span class="row-number">File {{ i + 1 }}</span>
      <div class="row-actions">
        <button mat-icon-button 
                type="button" 
                (click)="duplicateEntry(i)"
                matTooltip="Duplicate this row (Asset ID will be blank)">
          <mat-icon>content_copy</mat-icon>
        </button>
        <button mat-icon-button 
                type="button" 
                (click)="removeEntry(i)">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    </div>
    
    <div class="entry-fields">
      <!-- Asset ID - Always visible -->
      <mat-form-field appearance="outline" class="field-assetId">
        <mat-label>Asset ID</mat-label>
        <input matInput formControlName="assetId">
        <mat-icon matSuffix 
                  *ngIf="entryGroup.get('assetId')?.hasError('duplicate')"
                  class="duplicate-warning"
                  matTooltip="Duplicate entry: This asset ID and URL combination already exists."
                  color="warn">
          warning
        </mat-icon>
        <mat-error *ngIf="entryGroup.get('assetId')?.hasError('required')">
          Asset ID is required.
        </mat-error>
        <mat-error *ngIf="entryGroup.get('assetId')?.hasError('duplicate')">
          Duplicate Asset ID + URL combination.
        </mat-error>
      </mat-form-field>
      
      <!-- File URL - Always visible -->
      <mat-form-field appearance="outline" class="field-url">
        <mat-label>File URL</mat-label>
        <input matInput formControlName="url">
        <mat-error *ngIf="entryGroup.get('url')?.hasError('required')">
          File URL is required.
        </mat-error>
        <mat-error *ngIf="entryGroup.get('url')?.hasError('pattern')">
          Enter a valid http(s) URL.
        </mat-error>
      </mat-form-field>
      
      <!-- Optional fields - Conditionally visible -->
      <mat-form-field appearance="outline" 
                      class="field-title"
                      *ngIf="isFieldActive('title')"
                      [@slideIn]:
        <mat-label>File Title</mat-label>
        <input matInput formControlName="title">
        <mat-error *ngIf="entryGroup.get('title')?.hasError('required')">
          File title is required when this field is selected.
        </mat-error>
      </mat-form-field>
      
      <mat-form-field appearance="outline" 
                      class="field-description"
                      *ngIf="isFieldActive('description')"
                      [@slideIn]:
        <mat-label>Description</mat-label>
        <textarea matInput 
                  formControlName="description" 
                  rows="2"></textarea>
      </mat-form-field>
      
      <mat-form-field appearance="outline" 
                      class="field-type"
                      *ngIf="isFieldActive('type')"
                      [@slideIn]:
        <mat-label>File Type</mat-label>
        <mat-select formControlName="type">
          <mat-option *ngFor="let fileType of getFilteredFileTypes(entryGroup)" 
                      [value]="fileType.id">
            {{ fileType.targetCode }} (ID: {{ fileType.id }})
          </mat-option>
        </mat-select>
        <mat-error *ngIf="entryGroup.get('type')?.hasError('required')">
          File type is required when this field is selected.
        </mat-error>
      </mat-form-field>
      
      <mat-checkbox *ngIf="isFieldActive('supplemental')"
                    formControlName="supplemental"
                    class="field-supplemental"
                    [@slideIn]:
        Mark as Supplemental File
      </mat-checkbox>
    </div>
  </mat-card>
  
  <!-- Add new entry button -->
  <button mat-stroked-button 
          type="button" 
          (click)="addEntry()"
          class="add-entry-button">
    <mat-icon>add</mat-icon>
    Add Another File
  </button>
</section>
```

#### CSS Updates

```scss
// Field selection container
.field-selection-container {
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
  
  h3 {
    margin-top: 0;
    margin-bottom: 8px;
    font-size: 16px;
    font-weight: 500;
  }
  
  .field-selection-hint {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 14px;
    color: #666;
    
    mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  }
}

// Field toggle chips
.field-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  
  mat-chip {
    cursor: pointer;
    transition: all 0.2s ease;
    
    &.toggle-chip {
      &:hover {
        background-color: #e0e0e0;
      }
      
      &.mat-chip-selected {
        background-color: #3f51b5;
        color: white;
        
        &:hover {
          background-color: #303f9f;
        }
      }
    }
    
    &[disabled] {
      cursor: default;
      opacity: 1;
      background-color: #bdbdbd;
      color: white;
      
      .required-badge {
        margin-left: 4px;
        font-size: 11px;
        background-color: rgba(255, 255, 255, 0.3);
        padding: 2px 6px;
        border-radius: 10px;
      }
    }
    
    mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 4px;
    }
  }
}

// Entry fields grid
.entry-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  
  // Full width for description
  .field-description {
    grid-column: 1 / -1;
  }
  
  // Checkbox styling
  .field-supplemental {
    display: flex;
    align-items: center;
    padding-top: 8px;
  }
}

// Smooth animations for field show/hide
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Entry row header
.entry-row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
  
  .row-number {
    font-weight: 500;
    font-size: 14px;
    color: #666;
  }
}

// Add entry button
.add-entry-button {
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  border: 2px dashed #ccc;
  
  &:hover {
    border-color: #3f51b5;
    background-color: #f5f5f5;
  }
}
```

#### Angular Animations

```typescript
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  // ...existing component config...
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class MainComponent implements OnInit {
  // ...existing code...
}
```

### Component Lifecycle Integration

```typescript
ngOnInit(): void {
  // ...existing code...
  
  // Set smart defaults for common fields
  this.setDefaultFieldSelection();
  
  // Watch for field toggle changes to update form
  this.watchFieldToggleChanges();
}

private setDefaultFieldSelection(): void {
  // Pre-select commonly used fields
  const defaultActiveFields = ['title', 'type'];
  
  this.optionalFields.forEach(field => {
    if (defaultActiveFields.includes(field.name)) {
      field.active = true;
      this.showFieldColumn(field.formControlName);
    }
  });
}

private watchFieldToggleChanges(): void {
  // Monitor changes to ensure form stays synchronized
  // This is handled by the toggleField() method
}

// Update createEntryGroup to include all fields
private createEntryGroup(): FormGroup {
  return this.fb.group({
    assetId: ['', Validators.required],
    url: ['', [Validators.required, Validators.pattern(/^https?:\/\//i)]],
    title: [''], // Initially no validator
    description: [''],
    type: [''],
    supplemental: [false]
  });
}
```

### Benefits
- **Cleaner UI**: Only show relevant fields to reduce clutter
- **Flexibility**: Users customize form based on their workflow
- **Improved UX**: Less overwhelming for users with simple requirements
- **Data Integrity**: Hidden fields preserve data if user toggles back
- **Performance**: Reduced validation overhead for hidden fields
- **Accessibility**: Clear visual feedback for active/inactive state

### Testing Scenarios

1. **Toggle Field On**
   - Click inactive field toggle
   - Verify toggle highlights
   - Verify column appears in all rows
   - Verify validators applied if needed

2. **Toggle Field Off**
   - Click active field toggle
   - Verify toggle becomes inactive
   - Verify column hides in all rows
   - Verify validators removed
   - Verify data preserved

3. **Toggle with Data**
   - Enter data in field
   - Toggle field off
   - Toggle field back on
   - Verify data still present

4. **Submission with Hidden Fields**
   - Toggle some fields off
   - Enter data in visible fields
   - Submit form
   - Verify only active fields included in API payload

5. **Add Row with Custom Selection**
   - Set custom field selection
   - Add new row
   - Verify new row respects current selection

6. **Duplicate Row with Hidden Fields**
   - Populate all fields
   - Hide some fields
   - Duplicate row
   - Verify only visible fields copied

7. **Required Field Toggle**
   - Verify Asset ID cannot be toggled off
   - Verify File URL cannot be toggled off
   - Verify toggles show "Required" badge

8. **Animation Smoothness**
   - Toggle fields rapidly
   - Verify smooth show/hide animations
   - Verify no layout jumps

### Related Files
- `cloudapp/src/app/main/main.component.ts` - Primary implementation
- `cloudapp/src/app/main/main.component.html` - Template updates
- `cloudapp/src/app/main/main.component.scss` - Styling updates
- `cloudapp/src/app/models/asset.ts` - Potential FieldConfig interface
- `explaination.md` - Documentation updated
  
  // Red - Duplicate
  if (assetIdControl?.hasError('duplicate')) {
    return 'Duplicate entry: This asset ID and URL combination already exists. ' +
           'The same file cannot be attached to the same asset multiple times until ' +
           'the current upload completes.';
  }
  
  // Red - Invalid Asset
  if (assetIdControl?.hasError('notFound')) {
    return 'Invalid asset ID: This asset ID was not found in Esploro. ' +
           'Please verify the asset ID and try again.';
  }
  
  // Red - Missing Required
  if (assetIdControl?.hasError('required') || group.get('url')?.hasError('required')) {
    return 'Missing required fields: Please fill in all required fields ' +
           '(Asset ID and File URL) before proceeding.';
  }
  
  // Orange - Pending Validation
  if (this.isInRetryList(assetIdControl?.value)) {
    return 'Pending validation: This asset ID will be validated before submission. ' +
           'Please wait for validation to complete.';
  }
  
  // Orange - New Asset
  if (this.isNewAssetId(assetIdControl?.value)) {
    return 'New asset ID: This asset ID has not been validated yet and will be ' +
           'checked in the next validation cycle.';
  }
  
  // Yellow - Already Validated
  if (this.isInDiffingList(assetIdControl?.value)) {
    return 'Validated asset: This asset ID has already been validated. ' +
           'You can proceed with this entry.';
  }
  
  return ''; // No tooltip for valid rows
}

private isInvalidRow(group: FormGroup): boolean {
  return group.get('assetId')?.invalid || 
         group.get('url')?.invalid ||
         group.get('assetId')?.hasError('notFound');
}

private isDuplicateRow(group: FormGroup): boolean {
  return group.get('assetId')?.hasError('duplicate');
}

private isYellowHighlight(group: FormGroup): boolean {
  const assetId = group.get('assetId')?.value;
  return this.isInDiffingList(assetId) && 
         !this.isDuplicateRow(group) && 
         !this.isInvalidRow(group);
}

private isOrangeHighlight(group: FormGroup): boolean {
  const assetId = group.get('assetId')?.value;
  return this.isInRetryList(assetId) && 
         !this.isDuplicateRow(group) && 
         !this.isInvalidRow(group);
}
```

#### CSS Updates

```scss
// Ensure tooltips are visible and styled appropriately
.mat-tooltip {
  font-size: 12px;
  max-width: 300px;
  text-align: center;
  line-height: 1.4;
}

// Cursor changes to indicate tooltip availability
.mat-card[matTooltip] {
  cursor: help;
  
  &.duplicate-row,
  &.invalid-row {
    cursor: not-allowed;
  }
}
```

### Tooltip Behavior
- **Show Delay**: 500ms hover before tooltip appears
- **Hide Delay**: 200ms after mouse leaves
- **Position**: Above the row by default, auto-adjust if space limited
- **Multi-line**: Tooltips wrap for longer messages
- **Accessibility**: Tooltips also shown on keyboard focus

### Testing Scenarios
1. **Duplicate Tooltip**: Hover over duplicate row → verify correct message
2. **Invalid Tooltip**: Hover over invalid row → verify error message
3. **Orange Tooltip**: Hover over pending validation row → verify message
4. **Yellow Tooltip**: Hover over validated row → verify informational message
5. **Tooltip Priority**: Row with multiple states → verify most critical message shown
6. **Keyboard Access**: Tab to row → verify tooltip shown on focus

---

## Related Files
- `cloudapp/src/app/main/main.component.ts` - Primary implementation
- `cloudapp/src/app/main/main.component.html` - Template updates
- `cloudapp/src/app/main/main.component.scss` - Styling updates
- `cloudapp/src/app/services/asset.service.ts` - API integration
- `explaination.md` - Documentation updated
