# CSV Processor API Endpoint Fix

**Date:** October 13, 2025  
**Issue:** CSV batch processing failing with "No asset data provided in request body" (400 Bad Request)  
**Component:** CSV Processor

## Problem Analysis

### Console Errors Observed

```
Failed to load resource: the server responded with a status of 400 (Bad Request)
csv-processor.component.ts:722 Failed to process asset 991283105700561: 
Error: Failed to process file for 991283105700561: 
Request failed: No asset data provided in request body
```

### Root Cause

The CSV processor was using an **incorrect API endpoint** for adding files to assets:

**❌ Incorrect Endpoint (Used by CSV Processor):**
```typescript
// WRONG - This endpoint doesn't exist in the Esploro API
POST /esploro/v1/assets/${asset.mmsId}/files
```

**✅ Correct Endpoint (Documented in API docs):**
```typescript
// CORRECT - As documented in "API to Add new file to Asset.md"
POST /esploro/v1/assets/${assetId}?op=patch&action=add
```

### Why This Happened

The CSV processor had its own `processAssetFile()` method that was making a direct REST API call instead of using the centralized `AssetService.addFilesToAsset()` method, which implements the correct endpoint.

## Solution Implemented

### Before (Incorrect Implementation)

```typescript
/**
 * Process asset file attachment
 */
private async processAssetFile(asset: ProcessedAsset): Promise<void> {
  const fileData = {
    url: asset.remoteUrl,
    title: asset.fileTitle,
    description: asset.fileDescription,
    type: asset.fileType
  };

  try {
    // ❌ WRONG ENDPOINT
    await firstValueFrom(this.restService.call({
      url: `/esploro/v1/assets/${asset.mmsId}/files`,
      method: 'POST',
      requestBody: fileData
    } as any));

  } catch (error: any) {
    throw new Error(`Failed to process file for ${asset.mmsId}: ${error.message}`);
  }
}
```

### After (Correct Implementation)

```typescript
/**
 * Process asset file attachment using the correct API endpoint
 */
private async processAssetFile(asset: ProcessedAsset): Promise<void> {
  const fileLink = {
    url: asset.remoteUrl || '',
    title: asset.fileTitle || '',
    description: asset.fileDescription,
    type: asset.fileType,
    supplemental: false
  };

  try {
    // ✅ CORRECT - Uses AssetService with proper endpoint
    await firstValueFrom(this.assetService.addFilesToAsset(asset.mmsId, [fileLink]));

  } catch (error: any) {
    throw new Error(`Failed to process file for ${asset.mmsId}: ${error.message}`);
  }
}
```

## Changes Made

### File: `csv-processor.component.ts`

1. **Replaced direct REST call** with `assetService.addFilesToAsset()`
2. **Fixed payload structure** to use `AssetFileLink` interface
3. **Added supplemental field** (set to false by default)
4. **Added null-safety operators** for `remoteUrl` and `fileTitle`

## Technical Details

### Correct API Request Structure

According to the official Esploro API documentation, files must be added using the PATCH operation:

**Endpoint:**
```
POST /esploro/v1/assets/{assetId}?op=patch&action=add
```

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

**Request Body:**
```json
{
  "records": [
    {
      "temporary": {
        "linksToExtract": [
          {
            "link.title": "some file display name",
            "link.url": "https://example.com/file.pdf",
            "link.description": "some file description",
            "link.type": "accepted",
            "link.supplemental": "true"
          }
        ]
      }
    }
  ]
}
```

### AssetService Implementation

The `AssetService.addFilesToAsset()` method correctly implements this structure:

```typescript
addFilesToAsset(assetId: string, files: AssetFileLink[]): Observable<AddFilesToAssetResponse> {
  const payload = {
    records: [
      {
        temporary: {
          linksToExtract: files.map(file => ({
            'link.title': file.title,
            'link.url': file.url,
            ...(file.description ? { 'link.description': file.description } : {}),
            'link.type': file.type,
            'link.supplemental': String(file.supplemental)
          }))
        }
      }
    ]
  };

  return this.restService.call({
    url: `/esploro/v1/assets/${assetId}?op=patch&action=add`,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    requestBody: payload,
    method: HttpMethod.POST
  });
}
```

## Benefits of This Fix

### 1. Code Consistency
- ✅ CSV processor now uses the same API method as manual entry
- ✅ Eliminates code duplication
- ✅ Single source of truth for file addition logic

### 2. Error Handling
- ✅ Leverages centralized error parsing in AssetService
- ✅ Consistent error messages across both workflows
- ✅ Better logging and debugging capabilities

### 3. Maintainability
- ✅ API changes only need to be updated in one place (AssetService)
- ✅ Easier to test and debug
- ✅ Follows DRY (Don't Repeat Yourself) principle

### 4. Reliability
- ✅ Uses the officially documented API endpoint
- ✅ Proper request structure as per Esploro API specification
- ✅ Reduces risk of API call failures

## Testing

### Verification Steps

1. ✅ **TypeScript Compilation:** No errors
2. ⏳ **CSV Upload Test:** Upload CSV with valid asset IDs and file URLs
3. ⏳ **API Request Inspection:** Verify correct endpoint is called
4. ⏳ **Job Completion:** Confirm files are successfully attached
5. ⏳ **Error Handling:** Test with invalid data to ensure proper error messages

### Expected Behavior

**Before Fix:**
- ❌ 400 Bad Request: "No asset data provided in request body"
- ❌ All CSV batch processing fails
- ❌ No files attached to assets

**After Fix:**
- ✅ API calls succeed with 200 OK response
- ✅ Files are queued in Esploro temporary storage
- ✅ "Load files" job processes the temporary files
- ✅ Files appear in asset records after job completion

## Related Files

- **Modified:** `cloudapp/src/app/components/csv-processor/csv-processor.component.ts`
- **Reference:** `cloudapp/src/app/services/asset.service.ts` (already correct)
- **Documentation:** `documentation/API to Add new file to Asset.md`

## Additional Issues Addressed

While fixing the main issue, also noticed:

### 1. Gateway Timeout (504)
```
Failed to fetch metadata for asset 991283105600561: RestError
```
- This is a network/server issue, not related to the API endpoint fix
- Consider adding retry logic for metadata fetches
- May need to increase timeout settings

### 2. ObservableEmptyError
```
Error comparing asset states: ObservableEmptyError: 
Observable completed without emitting a value.
```
- Occurs when all verification observables fail
- Should add error handling for empty forkJoin results
- Consider using `forkJoin` with `defaultIfEmpty()`

### 3. MatStepper Missing
```
ERROR NullInjectorError: No provider for MatStepper!
```
- Angular Material Stepper module not imported
- Needs to be added to app.module.ts imports
- Not critical for current functionality (if not using stepper)

## Recommendations

### Immediate Actions
1. ✅ **DONE:** Fix CSV processor API endpoint
2. ⏳ **TODO:** Test CSV upload with production-like data
3. ⏳ **TODO:** Add retry logic for network timeout errors

### Future Improvements
1. Add unit tests for `processAssetFile()` method
2. Implement exponential backoff for API retries
3. Add better error recovery for partial batch failures
4. Consider batch processing API calls (if supported by Esploro)

## Summary

Successfully fixed the CSV batch processing failure by correcting the API endpoint used to add files to assets. The CSV processor now uses the centralized `AssetService.addFilesToAsset()` method instead of making direct REST calls with an incorrect endpoint. This ensures consistency across both manual entry and CSV upload workflows.

**Impact:** CSV batch processing should now work correctly for adding files to existing assets in Esploro.
