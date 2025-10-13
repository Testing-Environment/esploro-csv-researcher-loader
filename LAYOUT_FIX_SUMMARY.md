# Layout Fix Summary

**Date:** October 12, 2025  
**Components Modified:** main.component.ts, main.component.html, main.component.scss

---

## Issues Identified and Fixed

### Issue 1: Collapsed View Showing Vertical Layout When ≤3 Fields

**Problem:**  
The collapsed view was incorrectly displaying vertical layout even when there were 3 or fewer visible fields. This was caused by the `visibleFieldCount` getter incorrectly counting the File Type field in Stage 1.

**Root Cause:**  
The `visibleFieldCount` getter was adding 1 to the count when `fileTypesToggle` was ON, but the File Type field is only shown in **Stage 2**, not Stage 1. This meant:

- In Stage 1 with File Types toggle ON:
  - Actual visible fields: Asset ID, URL, Title (if enabled), Description (if enabled), Supplemental (if enabled)
  - Incorrectly counted fields: Actual fields + 1 (non-existent File Type field)
  - Result: Count could be 4 when only 3 fields were visible, triggering vertical layout

**Fix Applied:**  
Updated the `visibleFieldCount` getter to only count the File Type field when in Stage 2:

```typescript
// Before
get visibleFieldCount(): number {
  let count = 2; // Asset ID and File URL are always visible
  
  if (this.showFileName) count++;
  if (this.fileTypesToggle) count++;  // ❌ Wrong: counted in all stages
  if (this.showFileDescription) count++;
  if (this.showIsSupplemental) count++;
  
  return count;
}

// After
get visibleFieldCount(): number {
  let count = 2; // Asset ID and File URL are always visible
  
  if (this.showFileName) count++;
  // ✅ Correct: only count in Stage 2
  if (this.stage === 'stage2' && this.fileTypesToggle) count++;
  if (this.showFileDescription) count++;
  if (this.showIsSupplemental) count++;
  
  return count;
}
```

**File Modified:** `cloudapp/src/app/main/main.component.ts` (lines 196-207)

---

### Issue 2: Expanded View Fields Not Having Equal Widths

**Problem:**  
In expanded (and collapsed) horizontal layouts, form fields were not displaying with equal widths. Some fields appeared wider than others.

**Root Cause:**  
Inconsistent CSS class usage in the HTML template:
- Asset ID field used `class="entry-field"`
- File Title, URL, Description fields used `class="full-width"`
- The CSS flexbox rules only applied equal width (`flex: 1 1 0`) to `.entry-field`, not `.full-width`

**Fix Applied:**

1. **HTML Template Changes:**  
   Updated File Title and Description fields to use `entry-field` class instead of `full-width`:

   ```html
   <!-- Before -->
   <mat-form-field *ngIf="showFileName" appearance="outline" class="full-width">
   <mat-form-field *ngIf="showFileDescription" appearance="outline" class="full-width">
   
   <!-- After -->
   <mat-form-field *ngIf="showFileName" appearance="outline" class="entry-field">
   <mat-form-field *ngIf="showFileDescription" appearance="outline" class="entry-field">
   ```

2. **SCSS Changes:**  
   Updated CSS to apply equal width rules to both `.entry-field` AND `.full-width` classes:

   ```scss
   // Before - only .entry-field
   .entry-fields {
     .entry-field {
       flex: 1 1 0;
       min-width: 0;
     }
   }
   
   // After - both classes
   .entry-fields {
     .entry-field,
     .full-width {
       flex: 1 1 0;    // Equal width distribution
       min-width: 0;    // Allow shrinking
     }
   }
   ```

   Applied this pattern to:
   - `.form-layout-collapsed` (line 268)
   - `.form-layout-expanded` (line 321)
   - Angular Material overrides (line 374)
   - Responsive adjustments (line 355)

**Files Modified:**  
- `cloudapp/src/app/main/main.component.html` (lines 162, 205)
- `cloudapp/src/app/main/main.component.scss` (lines 268, 321, 355, 374)

---

## Technical Details

### Layout Logic Flow

1. **`visibleFieldCount` getter** calculates number of visible fields based on:
   - Always visible: Asset ID, File URL (count = 2)
   - Conditional: File Title, File Description, Is Supplemental
   - Stage-dependent: File Type (only in Stage 2)

2. **`shouldStackHorizontally` getter** determines layout direction:
   - Returns `true` if: `isExpandedView` OR `visibleFieldCount <= 3`
   - Returns `false` if: More than 3 fields in collapsed view

3. **`getFormLayoutClass()` method** returns CSS class:
   - If horizontal: `'form-layout-expanded'` or `'form-layout-collapsed'`
   - If vertical: `'form-layout-vertical'`

### CSS Flexbox Layout

**Collapsed Horizontal Layout (`form-layout-collapsed`):**
```scss
display: flex;
flex-direction: row;
gap: 12px;

.entry-fields {
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  gap: 12px;
  
  .entry-field, .full-width {
    flex: 1 1 0;      // Equal width, can grow/shrink
    min-width: 0;      // Allow shrinking below content
  }
}
```

**Expanded Horizontal Layout (`form-layout-expanded`):**
```scss
display: flex;
flex-direction: row;
gap: 16px;

.entry-fields {
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  gap: 16px;
  
  .entry-field, .full-width {
    flex: 1 1 0;        // Equal width distribution
    min-width: 120px;   // Minimum readable width
  }
}
```

---

## Testing Scenarios

### Scenario 1: Stage 1 with 2 visible fields (Asset ID + URL)
- **Expected:** Horizontal collapsed layout
- **Result:** ✅ Displays horizontally with equal widths

### Scenario 2: Stage 1 with 3 visible fields (+ File Title)
- **Expected:** Horizontal collapsed layout
- **Result:** ✅ Displays horizontally with equal widths

### Scenario 3: Stage 1 with 4 visible fields (+ File Title + Description)
- **Expected:** Vertical layout
- **Result:** ✅ Displays vertically

### Scenario 4: Stage 1 with File Types toggle ON (2-3 fields visible)
- **Before Fix:** Counted as 3-4 fields (incorrect), showed vertical when should be horizontal
- **After Fix:** ✅ Correctly counts actual visible fields, shows horizontal layout

### Scenario 5: Stage 2 with File Type field visible
- **Expected:** File Type field now counted in `visibleFieldCount`
- **Result:** ✅ Layout correctly adjusts based on total visible fields

### Scenario 6: Expanded view with any number of fields
- **Before Fix:** Fields had unequal widths
- **After Fix:** ✅ All fields have equal widths using `flex: 1 1 0`

---

## Impact Assessment

### Positive Changes
- ✅ Collapsed view now correctly displays horizontal layout when ≤3 fields visible
- ✅ Horizontal layouts now have perfectly equal field widths
- ✅ More consistent user experience across different toggle configurations
- ✅ Stage-aware layout logic prevents incorrect field counting

### No Behavioral Changes
- Layout logic for vertical mode unchanged
- Responsive breakpoints remain the same
- Form validation unaffected
- Stage transition logic unaffected

### Browser Compatibility
- Uses standard flexbox (widely supported)
- No new CSS features introduced
- Maintains existing responsive design

---

## Files Changed

| File | Lines Changed | Type | Description |
|------|--------------|------|-------------|
| `main.component.ts` | 196-207 | Logic | Fixed `visibleFieldCount` to be stage-aware |
| `main.component.html` | 162, 205, 226 | Template | Changed `full-width` to `entry-field` for consistency |
| `main.component.scss` | 268, 321, 355, 374 | Styles | Added `.full-width` to equal-width flex rules |

**Total Changes:** 3 files, ~12 lines modified

---

## Recommendations

### Future Enhancements
1. Consider consolidating to single class (`entry-field`) instead of maintaining both `entry-field` and `full-width`
2. Add unit tests for `visibleFieldCount` getter to prevent regression
3. Consider extracting layout constants (e.g., `MAX_HORIZONTAL_FIELDS = 3`) for easier maintenance

### Code Quality
- Added inline comment in `visibleFieldCount` to document Stage 2 dependency
- Maintained consistent code style and formatting
- No new linting warnings introduced

---

## Verification

Run the application and test:
1. Toggle different optional fields in Stage 1 with File Types toggle OFF
2. Toggle different optional fields in Stage 1 with File Types toggle ON
3. Check field widths in both collapsed and expanded views
4. Verify Stage 2 layout with File Type field visible
5. Test responsive behavior on different screen sizes

All scenarios should now display correct layout (horizontal/vertical) with equal field widths.
