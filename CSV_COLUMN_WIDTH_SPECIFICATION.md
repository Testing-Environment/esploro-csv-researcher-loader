# CSV Mapping Table Column Width Update

**Date:** October 13, 2025  
**Component:** CSV Processor Mapping Table  
**Type:** UI Enhancement - Column Width Specification

## Summary

Updated the CSV processor mapping table to use fixed column widths with specific percentages for each column, ensuring consistent layout across different data sizes.

## Column Width Specifications

| Column Name | Mat Column Class | Width | Purpose |
|-------------|------------------|-------|---------|
| **CSV Header** | `.mat-column-csvHeader` | **15%** | Display CSV column header names |
| **Sample Value** | `.mat-column-sampleValue` | **45%** | Show sample data from CSV (largest column for data preview) |
| **Map to Field** | `.mat-column-mappedField` | **30%** | Dropdown to select field mapping |

**Total:** 90% (remaining 10% for table margins and padding)

## Changes Made

### `csv-processor.component.scss`

#### Added Table Layout Control
```scss
.mapping-table {
  width: 100%;
  table-layout: fixed;  // Enables fixed column width distribution
}
```

**Purpose:** The `table-layout: fixed` property tells the browser to use the specified column widths rather than auto-sizing based on content.

#### Added Column Width Classes
```scss
// Column width specifications
.mat-column-csvHeader {
  width: 15%;
}

.mat-column-sampleValue {
  width: 45%;
}

.mat-column-mappedField {
  width: 30%;
}
```

**How it works:** Angular Material generates these classes automatically based on the `matColumnDef` values in the HTML template:
- `matColumnDef="csvHeader"` → `.mat-column-csvHeader`
- `matColumnDef="sampleValue"` → `.mat-column-sampleValue`
- `matColumnDef="mappedField"` → `.mat-column-mappedField`

#### Added Header Style
```scss
th {
  // Ensure headers also respect column widths
  overflow: visible;
}
```

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  CSV Header  │          Sample Value                │ Map to Field  │
│     15%      │              45%                     │     30%       │
├──────────────┼──────────────────────────────────────┼───────────────┤
│ column_name  │ "Example data value from CSV..."     │ [Dropdown ▼]  │
│              │                                      │               │
└──────────────┴──────────────────────────────────────┴───────────────┘
        ↑                    ↑                              ↑
    csv-header          sample-value                   mat-select
    (2rem padding)      (2rem padding)                (2rem padding)
```

## Width Distribution Rationale

### CSV Header (15%)
- **Purpose:** Display short column names
- **Typical content:** "id", "title", "url", "file_type", etc.
- **Justification:** Most CSV headers are short; 15% provides adequate space

### Sample Value (45%)
- **Purpose:** Preview actual data from the CSV
- **Typical content:** URLs, titles, descriptions (can be long)
- **Justification:** Largest column to accommodate longer data previews
- **Features:** Truncation with ellipsis, tooltip on hover

### Map to Field (30%)
- **Purpose:** Dropdown for field selection
- **Typical content:** "MMS ID", "Remote URL", "File Title", etc.
- **Justification:** Adequate space for dropdown with descriptions
- **Features:** Dropdown width respects column with padding

## Before vs After

### Before
- Columns auto-sized based on content
- Inconsistent widths across different CSV files
- Sample values limited to 200px fixed width
- Mat-select limited to 30% max-width

### After
- Fixed, predictable column widths (15% / 45% / 30%)
- Consistent layout regardless of content
- Sample values use 45% of table width
- Mat-select uses 30% of table width
- All elements maintain 2rem right padding

## Technical Details

### Table Layout: Fixed
When `table-layout: fixed` is set:
- ✅ Column widths are determined by the first row
- ✅ Specified widths are strictly enforced
- ✅ Rendering is faster (no content-based calculations)
- ✅ Consistent layout across all rows

### Angular Material Column Classes
Angular Material automatically generates CSS classes for each column:
```html
<ng-container matColumnDef="csvHeader">
  <!-- Generates: .mat-column-csvHeader -->
</ng-container>
```

### Content Width with Padding
Each element still maintains padding-right for spacing:
```scss
.csv-header {
  max-width: calc(100% - 2rem);
  padding-right: 2rem;
}
```

This ensures content doesn't touch the next column.

## Browser Compatibility

✅ `table-layout: fixed` - Supported in all browsers
✅ `width` percentages - Universal support
✅ `calc()` function - Supported in all modern browsers

## Testing Checklist

- [ ] CSV Header column displays at 15% width
- [ ] Sample Value column displays at 45% width
- [ ] Map to Field column displays at 30% width
- [ ] Widths remain consistent across different CSV files
- [ ] Long sample values truncate with ellipsis
- [ ] Padding-right (2rem) maintained on all elements
- [ ] Dropdowns display properly within column width
- [ ] Responsive behavior maintained

## Related Files

- **SCSS:** `csv-processor.component.scss`
- **HTML:** `csv-processor.component.html`
- **Component:** `csv-processor.component.ts`
- **Documentation:** `CSV_MAPPING_TABLE_COLUMN_WIDTH_FIX.md`

## Notes

### Why These Specific Percentages?
- **15%** for headers: Accommodates most CSV column names
- **45%** for sample values: Provides maximum preview space
- **30%** for mapping: Sufficient for dropdown with descriptions
- **10%** remaining: Table padding, borders, and margins

### Remaining 10%
The total adds up to 90% intentionally:
- Table padding and borders
- Column gaps and spacing
- Browser default table spacing
- Responsive behavior buffer

## Summary

✅ **Fixed column widths:** 15% / 45% / 30%  
✅ **Consistent layout:** Same widths across all CSV files  
✅ **Predictable behavior:** `table-layout: fixed` enforces widths  
✅ **Maintained spacing:** 2rem padding on all content elements  
✅ **No breaking changes:** Existing functionality preserved  

The CSV mapping table now has a professional, consistent layout with optimal width distribution for each column's purpose.
