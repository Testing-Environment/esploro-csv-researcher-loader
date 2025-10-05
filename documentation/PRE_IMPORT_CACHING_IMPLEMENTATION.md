# Pre-Import Asset Caching Implementation

## Overview
This document details the implementation of the pre-import asset caching system that enables before/after comparison to identify assets that were not modified during CSV import operations.

**Implementation Date:** October 4, 2025  
**Component:** CSV Processor  
**Purpose:** Track asset states before and after import to identify unchanged assets

---

## Architecture

### Data Flow
```
1. User submits CSV with asset file attachments
2. System validates and maps columns
3. PRE-IMPORT CACHING: Fetch current state of all target assets
4. Process asset file attachments via API
5. POST-IMPORT COMPARISON: Fetch updated state of all assets
6. Compare before/after states
7. Flag assets where file list didn't change
8. Display results with "unchanged" status
```

### Key Components

#### 1. CachedAssetState Interface
```typescript
interface CachedAssetState {
  mmsId: string;
  assetType: string;
  filesBefore: AssetFile[];      // Files attached before import
  filesAfter: AssetFile[];       // Files attached after import
  remoteUrlFromCSV: string;      // URL from CSV that should have been added
}
```

#### 2. Enhanced ProcessedAsset
```typescript
interface ProcessedAsset {
  mmsId: string;
  status: 'pending' | 'success' | 'error' | 'unchanged';  // Added 'unchanged'
  wasUnchanged?: boolean;  // NEW: Flag for post-import reporting
  // ... other fields
}
```

---

## Implementation Details

### Phase 1: Asset State Caching (Before Import)

#### Method: `cacheAssetStates()`
**Location:** `csv-processor.component.ts`

```typescript
private async cacheAssetStates(assets: ProcessedAsset[]): Promise<void> {
  // Clear previous cache
  this.assetCacheMap.clear();

  // Extract unique MMS IDs from CSV
  const uniqueMmsIds = [...new Set(assets.map(a => a.mmsId).filter(id => id))];

  // Fetch metadata for all assets in parallel
  const cacheRequests = uniqueMmsIds.map(mmsId => 
    this.assetService.getAssetMetadata(mmsId).pipe(
      catchError(error => {
        console.warn(`Failed to cache state for asset ${mmsId}:`, error);
        return of(null);
      })
    )
  );

  const results = await forkJoin(cacheRequests).toPromise();

  // Store cached states with current file lists
  results?.forEach((metadata, index) => {
    if (metadata) {
      const mmsId = uniqueMmsIds[index];
      const asset = assets.find(a => a.mmsId === mmsId);
      
      this.assetCacheMap.set(mmsId, {
        mmsId: metadata.mmsId,
        assetType: metadata.assetType || '',
        filesBefore: metadata.files || [],  // Current files
        filesAfter: [],                     // Will be populated after import
        remoteUrlFromCSV: asset?.remoteUrl || ''
      });
    }
  });
}
```

**Key Features:**
- **Parallel fetching:** Uses `forkJoin` to fetch all asset metadata simultaneously
- **Error resilience:** Continues processing even if some assets fail to cache
- **Deduplication:** Only fetches unique MMS IDs (handles duplicate rows in CSV)
- **Remote URL tracking:** Stores the URL from CSV for later verification

**Invocation Point:**
```typescript
async executeBatchProcessing() {
  // ... validation and data transformation ...
  
  // Cache asset states BEFORE processing
  await this.cacheAssetStates(transformedData);
  
  // Process assets
  const processedAssets = await this.processAssets(transformedData);
  
  // Compare states AFTER processing
  await this.compareAssetStates(processedAssets);
}
```

---

### Phase 2: Post-Import Comparison

#### Method: `compareAssetStates()`
**Location:** `csv-processor.component.ts`

```typescript
private async compareAssetStates(processedAssets: ProcessedAsset[]): Promise<void> {
  const successfulAssets = processedAssets.filter(a => a.status === 'success');
  
  // Fetch post-processing states
  const comparisonRequests = successfulAssets.map(asset => 
    this.assetService.getAssetMetadata(asset.mmsId).pipe(
      catchError(error => of(null))
    )
  );

  const results = await forkJoin(comparisonRequests).toPromise();

  results?.forEach((metadata, index) => {
    const asset = successfulAssets[index];
    const cachedState = this.assetCacheMap.get(asset.mmsId);

    if (!cachedState || !metadata) return;

    // Update post-processing file list
    cachedState.filesAfter = metadata.files || [];

    // Compare file counts
    const filesBeforeCount = cachedState.filesBefore.length;
    const filesAfterCount = cachedState.filesAfter.length;

    // Check if remote URL was added
    const remoteUrlAdded = cachedState.remoteUrlFromCSV && 
      cachedState.filesAfter.some(f => f.url === cachedState.remoteUrlFromCSV);

    // Determine if asset is unchanged
    if (filesBeforeCount === filesAfterCount && !remoteUrlAdded) {
      asset.status = 'unchanged';
      asset.wasUnchanged = true;
    }
  });
}
```

**Comparison Logic:**

| Condition | File Count Before | File Count After | Remote URL Added | Status | Reason |
|-----------|-------------------|------------------|------------------|--------|--------|
| 1 | 5 | 5 | No | **unchanged** | Same file count, URL not added |
| 2 | 5 | 6 | Yes | **success** | File successfully added |
| 3 | 5 | 5 | Yes | **success** | File added but another removed/replaced |
| 4 | 5 | 4 | No | **success** | File was removed (not by this import) |

**Detection Criteria for "Unchanged":**
1. File count is identical before and after
2. The remote URL from CSV is NOT found in the asset's file list after processing
3. Asset processing status was 'success' (no API errors)

---

## Integration Points

### 1. Service Layer Enhancement
**File:** `asset.service.ts`

**New Method:** `getAssetMetadata()`
- Fetches asset type and current file list
- Used for both pre-import caching and post-import comparison
- Handles multiple API response structures
- Returns `AssetMetadata` with error handling

```typescript
getAssetMetadata(mmsId: string): Observable<AssetMetadata> {
  return this.restService.call(`/esploro/v1/assets/${mmsId}`).pipe(
    map((response: any) => ({
      mmsId: response.mms_id || response.mmsId || mmsId,
      title: response.title || '',
      assetType: response.asset_type || response.assetType || '',
      files: this.parseAssetFiles(response)
    })),
    catchError(error => {
      console.error(`Failed to fetch asset metadata for ${mmsId}:`, error);
      throw error;
    })
  );
}
```

### 2. Component State Management
**File:** `csv-processor.component.ts`

**New Properties:**
```typescript
// Asset state caching for before/after comparison
assetCacheMap: Map<string, CachedAssetState> = new Map();
```

**Updated Dependencies:**
```typescript
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AssetService } from '../../services/asset.service';
```

**Constructor Injection:**
```typescript
constructor(
  private restService: CloudAppRestService,
  private alertService: AlertService,
  private translate: TranslateService,
  private assetService: AssetService  // NEW
) {}
```

### 3. Reset Handling
**Updated:** `resetUpload()` method now clears the cache map
```typescript
resetUpload() {
  // ... existing resets ...
  this.assetCacheMap.clear();  // NEW
}
```

---

## Performance Considerations

### Parallel Processing
- **Pre-import caching:** Uses `forkJoin` to fetch all asset metadata in parallel
- **Post-import comparison:** Uses `forkJoin` to fetch updated metadata in parallel
- **Benefit:** For 100 assets, sequential would take ~100 API calls × latency, parallel takes ~1 batch × latency

### Error Resilience
- Individual asset caching failures don't stop the entire process
- Uses `catchError` with `of(null)` to continue on failures
- Logs warnings for debugging but maintains workflow continuity

### Memory Management
- Cache is stored in a `Map` for O(1) lookup performance
- Cache is cleared on `resetUpload()` to prevent memory leaks
- Only stores essential data (MMS ID, asset type, file arrays, remote URL)

### API Efficiency
- **Deduplication:** Only fetches unique MMS IDs (if CSV has duplicate rows)
- **Conditional fetching:** Only compares assets that processed successfully
- **Batch operations:** Uses observable composition for efficient HTTP request handling

---

## Usage Scenarios

### Scenario 1: Successful File Addition
**CSV Input:**
```csv
MMS ID,Remote URL,File Title,File Type
123456,https://example.com/paper.pdf,Research Paper,published
```

**Pre-import State:**
- Asset 123456 has 2 files attached

**Import Process:**
- API call succeeds, file added

**Post-import State:**
- Asset 123456 has 3 files attached
- Remote URL `https://example.com/paper.pdf` found in files

**Result:**
- Status: `success`
- wasUnchanged: `false`

---

### Scenario 2: Duplicate URL (Already Exists)
**CSV Input:**
```csv
MMS ID,Remote URL,File Title,File Type
123456,https://example.com/existing.pdf,Existing File,published
```

**Pre-import State:**
- Asset 123456 has 2 files
- One file already has URL `https://example.com/existing.pdf`

**Import Process:**
- API call succeeds (or may return "already exists" error)

**Post-import State:**
- Asset 123456 still has 2 files (unchanged count)
- URL not added (already existed)

**Result:**
- Status: `unchanged`
- wasUnchanged: `true`

**Reason:** File count identical, remote URL from CSV not newly added

---

### Scenario 3: Permission Denied
**CSV Input:**
```csv
MMS ID,Remote URL,File Title,File Type
123456,https://example.com/restricted.pdf,Restricted,published
```

**Pre-import State:**
- Asset 123456 has 2 files

**Import Process:**
- API call fails with 403 Forbidden

**Post-import State:**
- Not fetched (asset marked as error)

**Result:**
- Status: `error`
- wasUnchanged: Not evaluated (only success cases compared)

---

## Testing Recommendations

### Unit Tests
```typescript
describe('CSVProcessorComponent - Asset Caching', () => {
  it('should cache asset states before processing', async () => {
    // Test cacheAssetStates() method
  });

  it('should identify unchanged assets after comparison', async () => {
    // Test compareAssetStates() logic
  });

  it('should handle caching failures gracefully', async () => {
    // Test error resilience
  });

  it('should deduplicate MMS IDs before caching', async () => {
    // Test unique ID extraction
  });
});
```

### Integration Tests
1. **End-to-end workflow:** Upload CSV → Cache → Process → Compare → Results
2. **Duplicate URL test:** Import file that already exists on asset
3. **Mixed results test:** Some succeed, some fail, some unchanged
4. **Large batch test:** 100+ assets to verify performance

### Manual Testing Checklist
- [ ] Upload CSV with duplicate asset IDs (verify deduplication)
- [ ] Upload CSV with URLs that already exist (verify unchanged detection)
- [ ] Upload CSV with mix of new and existing URLs
- [ ] Verify console logs show caching progress
- [ ] Verify processing results show unchanged count
- [ ] Verify reset clears cache properly

---

## Next Steps

### Immediate (Pending)
1. ✅ **Pre-import caching:** COMPLETED
2. ✅ **Post-import comparison:** COMPLETED
3. ⏳ **Update processing-results component:** Show "Potential Unchanged Assets" section
4. ⏳ **Add translation keys:** For unchanged asset UI elements
5. ⏳ **Update documentation:** User guide and technical summary

### Future Enhancements
1. **Detailed change tracking:** Track which specific files were added/removed
2. **Hash-based comparison:** Compare file content hashes instead of just counts
3. **Caching optimization:** Store cache in session storage for multi-batch workflows
4. **Export unchanged report:** Downloadable CSV of unchanged assets for review

---

## Dependencies

### RxJS Operators
- `forkJoin` - Parallel observable execution
- `of` - Error handling with fallback values
- `catchError` - Graceful error recovery

### Services
- `AssetService.getAssetMetadata()` - Fetch asset state
- `CloudAppRestService` - Esploro API calls

### Types
- `CachedAssetState` - Cache data structure
- `AssetMetadata` - Asset metadata response
- `AssetFile` - Individual file details
- `ProcessedAsset` - Enhanced with wasUnchanged flag

---

## Troubleshooting

### Issue: "Cannot find module 'rxjs'"
**Solution:** Run `npm install` to install dependencies

### Issue: Cache not clearing between uploads
**Solution:** Verify `resetUpload()` is called properly

### Issue: False positives for "unchanged"
**Cause:** File was replaced (same count but different file)  
**Mitigation:** Future enhancement with hash-based comparison

### Issue: Performance degradation with large batches
**Cause:** Too many parallel API calls  
**Mitigation:** Consider chunking requests (e.g., 20 at a time)

---

## Related Documentation
- [FILE_TYPE_CATEGORY_GUIDE.md](./FILE_TYPE_CATEGORY_GUIDE.md) - User guide for file type system
- [FILE_TYPE_IMPLEMENTATION_SUMMARY.md](./FILE_TYPE_IMPLEMENTATION_SUMMARY.md) - Technical summary Phase 1
- [DEVELOPER_QUICK_REFERENCE.md](../DEVELOPER_QUICK_REFERENCE.md) - Quick reference guide
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migration and setup instructions

---

**Document Version:** 1.0  
**Last Updated:** October 4, 2025  
**Author:** Development Team  
**Status:** Implementation Complete - Testing Pending
