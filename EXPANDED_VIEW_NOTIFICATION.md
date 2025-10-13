# Expanded View Notification Restoration

**Date:** October 13, 2025  
**Purpose:** Restore user notifications for expanded view mode using simple width-based detection  
**Component:** Main Component

## Overview

Restored the expanded view notification system using a lightweight approach that checks the form's width directly without using ResizeObserver. The notifications advise users to switch to expanded view mode when working with multiple files or viewing CSV results while in collapsed mode.

## Implementation Details

### Detection Method

Instead of the complex ResizeObserver approach, we now use a simple width check:

```typescript
/**
 * Check if the app is currently in collapsed view mode
 * Based on simple width check: width < 400px = collapsed
 */
private isViewCollapsed(): boolean {
  const appContainer = document.querySelector('app-main') as HTMLElement;
  if (!appContainer) {
    return false; // If we can't determine, assume not collapsed
  }
  return appContainer.offsetWidth < 400;
}
```

**Logic:**
- If `app-main` container width < 400px → View is **collapsed**
- If width ≥ 400px → View is **expanded**
- If container not found → Assume **not collapsed** (safe default)

### Notification Triggers

#### 1. Adding Multiple Files (Manual Entry)

**When:** User clicks "Add another file" button  
**Condition:** View is collapsed AND notification hasn't been shown yet  
**Message:** "For a better experience with multiple files, consider using the expanded view mode. Click the expand icon in the top-right corner of the app."

```typescript
addEntry(): void {
  this.entries.push(this.createEntryGroup());
  
  // Show expanded mode notification if in collapsed view and haven't shown it yet
  if (!this.hasShownExpandedModeNotification && this.isViewCollapsed()) {
    this.hasShownExpandedModeNotification = true;
    this.alert.info(
      'For a better experience with multiple files, consider using the expanded view mode. ' +
      'Click the expand icon in the top-right corner of the app.',
      { autoClose: false }
    );
    this.logger.userAction('Expanded mode notification shown', { 
      trigger: 'addEntry', 
      viewCollapsed: true 
    });
  }
}
```

#### 2. CSV Batch Processing Complete

**When:** CSV batch processing completes and results are shown  
**Condition:** View is collapsed AND notification hasn't been shown yet  
**Message:** "For a better experience viewing results, consider using the expanded view mode. Click the expand icon in the top-right corner of the app."

```typescript
onBatchProcessed(assets: ProcessedAsset[]) {
  this.processedAssets = assets;
  this.showResults = true;
  
  // Show expanded mode notification if in collapsed view and haven't shown it yet
  if (!this.hasShownExpandedModeNotification && this.isViewCollapsed()) {
    this.hasShownExpandedModeNotification = true;
    this.alert.info(
      'For a better experience viewing results, consider using the expanded view mode. ' +
      'Click the expand icon in the top-right corner of the app.',
      { autoClose: false }
    );
    this.logger.userAction('Expanded mode notification shown', { 
      trigger: 'csvUpload', 
      viewCollapsed: true 
    });
  }
}
```

## Changes Made

### File: `main.component.ts`

1. **Added property** (line ~67):
   ```typescript
   private hasShownExpandedModeNotification = false;
   ```

2. **Added helper method** (lines ~115-124):
   ```typescript
   private isViewCollapsed(): boolean {
     const appContainer = document.querySelector('app-main') as HTMLElement;
     if (!appContainer) {
       return false;
     }
     return appContainer.offsetWidth < 400;
   }
   ```

3. **Updated `addEntry()` method** (lines ~126-139):
   - Added notification logic for manual entry
   - Shows notification only if view is collapsed
   - Prevents duplicate notifications via flag

4. **Updated `onBatchProcessed()` method** (lines ~455-468):
   - Added notification logic for CSV results
   - Shows notification only if view is collapsed
   - Prevents duplicate notifications via flag

## Key Features

### 1. Lightweight Detection
- ✅ No ResizeObserver needed
- ✅ No continuous monitoring
- ✅ Simple width check only when needed
- ✅ Zero performance overhead

### 2. Smart Notification Logic
- ✅ Only shown when view is actually collapsed (< 400px)
- ✅ Only shown once per session (flag-based)
- ✅ Doesn't auto-close (persistent until user dismisses)
- ✅ Logged for debugging/analytics

### 3. User-Friendly
- ✅ Clear, actionable message
- ✅ Tells user exactly what to do ("Click the expand icon")
- ✅ Context-specific messages (multiple files vs viewing results)
- ✅ Non-intrusive (info level, not warning)

### 4. Defensive Programming
- ✅ Gracefully handles missing DOM element
- ✅ Safe default behavior (assume not collapsed)
- ✅ No errors if DOM structure changes

## Comparison with Previous Implementation

### Old Approach (ResizeObserver)
```typescript
❌ Complex: ResizeObserver setup, cleanup, callbacks
❌ Continuous: Always monitoring for width changes
❌ TypeScript: Required dom.iterable library
❌ Overhead: Event handlers, subscriptions, ngOnDestroy cleanup
```

### New Approach (Simple Width Check)
```typescript
✅ Simple: Single method, one-time check
✅ On-Demand: Only checks when notification needed
✅ TypeScript: No special libraries required
✅ Lightweight: No cleanup, no subscriptions, no overhead
```

## Testing Scenarios

### Scenario 1: Collapsed View - Manual Entry
1. Open app in collapsed mode (width < 400px)
2. Click "Add another file" button
3. **Expected:** Info notification appears with expanded view suggestion
4. Add more files
5. **Expected:** Notification does NOT appear again (already shown)

### Scenario 2: Expanded View - Manual Entry
1. Open app in expanded mode (width ≥ 400px)
2. Click "Add another file" button
3. **Expected:** NO notification appears
4. Continue adding files
5. **Expected:** Still no notification

### Scenario 3: Collapsed View - CSV Upload
1. Open app in collapsed mode (width < 400px)
2. Upload and process CSV file
3. When results appear
4. **Expected:** Info notification appears with expanded view suggestion

### Scenario 4: Expanded View - CSV Upload
1. Open app in expanded mode (width ≥ 400px)
2. Upload and process CSV file
3. When results appear
4. **Expected:** NO notification appears

### Scenario 5: Edge Case - DOM Element Missing
1. Simulate missing `app-main` element (developer scenario)
2. Click "Add another file" or process CSV
3. **Expected:** No notification, no errors, app continues normally

## User Experience

### When to Expect Notifications

| Action | View Mode | Notification? | Message Type |
|--------|-----------|---------------|--------------|
| Add file (manual) | Collapsed (< 400px) | ✅ Yes (once) | Multiple files tip |
| Add file (manual) | Expanded (≥ 400px) | ❌ No | - |
| CSV complete | Collapsed (< 400px) | ✅ Yes (once) | Results viewing tip |
| CSV complete | Expanded (≥ 400px) | ❌ No | - |

### Notification Appearance
- **Type:** Info (blue icon)
- **Auto-close:** No (user must dismiss)
- **Position:** Top of screen (standard alert position)
- **Style:** Non-blocking, can continue working

## Technical Specifications

### Width Threshold
- **Collapsed threshold:** < 400px
- **Expanded threshold:** ≥ 400px
- **Rationale:** 400px is a reasonable mobile/tablet breakpoint

### DOM Query
- **Element:** `app-main` (root component selector)
- **Property:** `offsetWidth` (includes padding, excludes margins)
- **Timing:** Synchronous, immediate

### Browser Compatibility
- ✅ All modern browsers support `offsetWidth`
- ✅ `querySelector` is universally supported
- ✅ No polyfills required

### Performance
- **Overhead:** Negligible (single DOM query)
- **Frequency:** Only when notification needed
- **Memory:** No continuous listeners or observers
- **Cleanup:** None needed (stateless check)

## Configuration

The width threshold can be easily adjusted if needed:

```typescript
// Current threshold
return appContainer.offsetWidth < 400;

// Examples of alternative thresholds:
return appContainer.offsetWidth < 500;  // More aggressive (larger threshold)
return appContainer.offsetWidth < 300;  // Less aggressive (smaller threshold)
```

## Logging

All notifications are logged for debugging:

```typescript
this.logger.userAction('Expanded mode notification shown', { 
  trigger: 'addEntry',      // or 'csvUpload'
  viewCollapsed: true        // Always true when notification shown
});
```

## Verification Status

✅ **TypeScript Compilation:** No errors  
✅ **Logic:** Correct conditional checks  
✅ **Safety:** Defensive programming for missing DOM  
✅ **UX:** Clear, actionable messages  
✅ **Performance:** Lightweight, on-demand only  

## Summary

Successfully restored the expanded view notification system using a simple, lightweight approach. The new implementation:

1. Uses a straightforward width check (< 400px = collapsed)
2. Shows helpful notifications only when relevant
3. Prevents duplicate notifications with a flag
4. Has zero performance overhead
5. Requires no cleanup or subscriptions
6. Works reliably across all browsers

The user experience remains the same as before while the implementation is significantly simpler and more maintainable.
