# CSV Processor - Correct 3-Phase Workflow Implementation

**Date:** October 13, 2025  
**Status:** ✅ Complete - Correctly Implements GET-UPDATE-GET Pattern

---

## The Correct Workflow

### ✅ **3-Phase Approach**

```
PHASE 1: GET File Counts (BEFORE)
   ↓
PHASE 2: Update Assets + Run Job  
   ↓
PHASE 3: GET File Counts (AFTER) + Compare
```

---

## Phase 1: GET Current File Counts (BEFORE Updates)

**Purpose:** Measure the baseline - how many files does each asset have right now?

### API Call: GET Asset Details

```
GET /esploro/v1/assets/{assetId}
```

### Response Structure:

```json
{
  "totalRecordCount": 1,
  "records": [{
    "mmsId": "991283105700561",
    "title": "Some Asset Title",
    "files": [
      {
        "file.name": "document1.pdf",
        "file.type": "submitted",
        ...
      },
      {
        "file.name": "document2.pdf",
        "file.type": "accepted",
        ...
      }
    ],
    ...
  }]
}
```

### What We Extract:

```typescript
const response = await GET(`/esploro/v1/assets/${assetId}`);
const files = response.records[0].files || [];
const fileCountBefore = files.length;  // COUNT THE FILES!

console.log(`Asset ${assetId} currently has ${fileCountBefore} file(s)`);
```

### Implementation:

```typescript
// Step 1.1: Group CSV rows by Asset ID
this.assetBatchMap.clear();

assets.forEach(asset => {
  if (!this.assetBatchMap.has(asset.mmsId)) {
    this.assetBatchMap.set(asset.mmsId, {
      files: [],
      rows: [],
      fileCountBefore: 0  // Will be filled by GET
    });
  }
  
  const batch = this.assetBatchMap.get(asset.mmsId)!;
  batch.files.push({ url: asset.remoteUrl, title: asset.fileTitle, ... });
  batch.rows.push(asset);
});

// Step 1.2: GET file counts for all unique assets
const uniqueAssetIds = Array.from(this.assetBatchMap.keys());

const fileCountRequests = uniqueAssetIds.map(mmsId =>
  this.restService.call(`/esploro/v1/assets/${mmsId}`).pipe(
    map((response: any) => {
      const files = response?.records?.[0]?.files || [];
      const fileCount = Array.isArray(files) ? files.length : 0;
      return { mmsId, fileCount, valid: true };
    }),
    catchError(error => {
      // Asset not found or error
      return of({ mmsId, fileCount: 0, valid: false, error: error.message });
    })
  )
);

const results = await lastValueFrom(forkJoin(fileCountRequests));

// Step 1.3: Store counts and validate
results.forEach(result => {
  const batch = this.assetBatchMap.get(result.mmsId)!;
  
  if (!result.valid) {
    // Mark as error - asset doesn't exist
    batch.rows.forEach(row => {
      row.status = 'error';
      row.errorMessage = result.error;
    });
  } else {
    // Store the "before" count
    batch.fileCountBefore = result.fileCount;
  }
});
```

### Output:

```
📊 PHASE 1: Getting current file counts for all assets...
📦 Grouped 100 CSV rows into 10 unique assets
  ✓ Asset 991001: 5 file(s) currently
  ✓ Asset 991002: 0 file(s) currently
  ✓ Asset 991003: 2 file(s) currently
  ✗ Asset 991999: NOT FOUND
✅ Phase 1 complete: 9 valid assets, 1 invalid
```

---

## Phase 2: Update Assets + Run Job

**Purpose:** Queue files for import and run the job to actually fetch them.

### Step 2.1: Call addFilesToAsset for Each Unique Asset

```
POST /esploro/v1/assets/{assetId}?op=patch&action=add
```

**Request Body:**

```json
{
  "records": [{
    "temporary": {
      "linksToExtract": [
        {
          "link.title": "Document 1",
          "link.url": "http://example.com/doc1.pdf",
          "link.type": "submitted",
          "link.supplemental": "false"
        },
        {
          "link.title": "Document 2",
          "link.url": "http://example.com/doc2.pdf",
          "link.type": "accepted",
          "link.supplemental": "false"
        }
      ]
    }
  }]
}
```

### Implementation:

```typescript
console.log('🔄 PHASE 2: Updating assets and running import job...');

for (const mmsId of validAssetIds) {
  const batch = this.assetBatchMap.get(mmsId)!;
  
  console.log(`  🔄 Queuing ${batch.files.length} file(s) for asset ${mmsId}...`);
  
  await firstValueFrom(
    this.assetService.addFilesToAsset(mmsId, batch.files)
  );
  
  console.log(`  ✅ Successfully queued ${batch.files.length} file(s)`);
  
  batch.rows.forEach(row => {
    row.status = 'success';  // Pending job verification
  });
}
```

### Step 2.2: Create Set (Already Implemented)

```typescript
// In createSetForSuccessfulAssets()
const uniqueAssetIds = Array.from(
  new Set(processedAssets.filter(a => a.status === 'success').map(a => a.mmsId))
);

const setResponse = await firstValueFrom(
  this.assetService.createSet(setName, description)
);

await firstValueFrom(
  this.assetService.updateSetMembers(setResponse.id, uniqueAssetIds)
);
```

### Step 2.3: Run Job (Already Implemented)

```typescript
const jobResponse = await firstValueFrom(
  this.assetService.runJob(setResponse.id)
);

this.startJobPolling(jobResponse.id, jobInstanceId);
```

### Output:

```
🔄 PHASE 2: Updating assets and running import job...
  🔄 Queuing 3 file(s) for asset 991001...
  ✅ Successfully queued 3 file(s) for asset 991001
  🔄 Queuing 2 file(s) for asset 991002...
  ✅ Successfully queued 2 file(s) for asset 991002
✅ Phase 2 complete: Assets updated, job will be submitted

Creating set with 9 unique asset(s)...
Set created successfully: 12345678900561
Job submitted successfully. Job ID: M50173, Instance: 67890
Job monitoring started...
```

---

## Phase 3: GET Updated File Counts (AFTER Job Completes)

**Purpose:** Measure again - did the files actually get added?

### Trigger: Job Completion

```typescript
private async handleJobCompletion(status: any): Promise<void> {
  if (status.status.value === 'COMPLETED_SUCCESS') {
    console.log('✅ Job completed! Starting Phase 3 verification...');
    
    await this.verifyAssetResults(this.processedAssetsCache);
  }
}
```

### API Call: GET Asset Details Again

```
GET /esploro/v1/assets/{assetId}  // SAME AS PHASE 1
```

### Implementation:

```typescript
private async verifyAssetResults(processedAssets: ProcessedAsset[]): Promise<void> {
  console.log('\n📊 PHASE 3: Getting updated file counts after job completion...');
  
  const uniqueAssetIds = Array.from(
    new Set(processedAssets.filter(a => a.status === 'success').map(a => a.mmsId))
  );

  // GET file counts again
  const fileCountRequests = uniqueAssetIds.map(mmsId =>
    this.restService.call(`/esploro/v1/assets/${mmsId}`).pipe(
      map((response: any) => {
        const files = response?.records?.[0]?.files || [];
        const fileCountAfter = Array.isArray(files) ? files.length : 0;
        const batch = this.assetBatchMap.get(mmsId);
        const fileCountBefore = batch?.fileCountBefore || 0;
        
        return {
          mmsId,
          fileCountBefore,
          fileCountAfter,
          filesAdded: fileCountAfter - fileCountBefore,
          changed: fileCountAfter > fileCountBefore
        };
      }),
      catchError(error => of({ /* error result */ }))
    )
  );

  const results = await lastValueFrom(forkJoin(fileCountRequests));

  // Compare and update statuses
  results.forEach(result => {
    const batch = this.assetBatchMap.get(result.mmsId);
    if (batch) {
      batch.fileCountAfter = result.fileCountAfter;
    }

    const assetRows = processedAssets.filter(a => a.mmsId === result.mmsId);
    assetRows.forEach(row => {
      if (!result.changed) {
        // Asset was NOT modified by the job
        row.status = 'unchanged';
        row.wasUnchanged = true;
      }
    });
  });

  // Display summary
  const changedAssets = results.filter(r => r.changed).length;
  const unchangedAssets = results.filter(r => !r.changed).length;
  const totalFilesAdded = results.reduce((sum, r) => sum + r.filesAdded, 0);

  console.log(`\n✅ Phase 3 complete:`);
  console.log(`   • ${changedAssets} assets modified`);
  console.log(`   • ${unchangedAssets} assets unchanged`);
  console.log(`   • ${totalFilesAdded} total files added`);
}
```

### Output:

```
📊 PHASE 3: Getting updated file counts after job completion...
Verifying 9 unique assets...
  📄 Asset 991001: 5 → 8 files (+3)
  📄 Asset 991002: 0 → 2 files (+2)
  📄 Asset 991003: 2 → 2 files (unchanged)
  ⚠️  Asset 991003 was NOT modified by job
  📄 Asset 991004: 1 → 3 files (+2)

✅ Phase 3 complete:
   • 8 assets modified
   • 1 assets unchanged
   • 7 total files added
```

---

## Complete Flow Example

### CSV Input:

```csv
MMS ID,File URL,File Title
991001,http://example.com/doc1.pdf,Document 1
991001,http://example.com/doc2.pdf,Document 2
991001,http://example.com/doc3.pdf,Document 3
991002,http://example.com/paper.pdf,Research Paper
991003,http://example.com/duplicate.pdf,Already Exists
```

### Processing Log:

```
📊 PHASE 1: Getting current file counts for all assets...
📦 Grouped 5 CSV rows into 3 unique assets
  ✓ Asset 991001: 5 file(s) currently
  ✓ Asset 991002: 0 file(s) currently
  ✓ Asset 991003: 1 file(s) currently
✅ Phase 1 complete: 3 valid assets, 0 invalid

🔄 PHASE 2: Updating assets and running import job...
  🔄 Queuing 3 file(s) for asset 991001...
  ✅ Successfully queued 3 file(s) for asset 991001
  🔄 Queuing 1 file(s) for asset 991002...
  ✅ Successfully queued 1 file(s) for asset 991002
  🔄 Queuing 1 file(s) for asset 991003...
  ✅ Successfully queued 1 file(s) for asset 991003
✅ Phase 2 complete

Creating set with 3 unique asset(s)...
Set created: 12345678900561
Job submitted: M50173, Instance: 67890
[Job runs for ~60 seconds]
Job completed successfully!

📊 PHASE 3: Getting updated file counts after job completion...
  📄 Asset 991001: 5 → 8 files (+3)  ✅ Changed
  📄 Asset 991002: 0 → 1 files (+1)  ✅ Changed
  📄 Asset 991003: 1 → 1 files (unchanged)  ⚠️  Already existed

✅ Phase 3 complete:
   • 2 assets modified
   • 1 assets unchanged
   • 4 total files added
```

---

## Why This Approach is Correct

### ❌ Wrong Approach (Before):

- Called API once per CSV row
- Manual before/after comparison
- No validation before updating
- Slow and unreliable

### ✅ Correct Approach (Now):

1. **Phase 1: Measure First**
   - GET current file counts
   - Validate all assets exist
   - Store baseline measurements

2. **Phase 2: Update via Job System**
   - Group files by asset
   - Queue all files per asset in one call
   - Create set and run job
   - Job handles the actual file fetching

3. **Phase 3: Measure Again**
   - GET updated file counts
   - Compare with baseline
   - Identify what actually changed
   - Report accurate results

---

## Key Data Structure

```typescript
// Class property
assetBatchMap: Map<string, {
  files: any[],                // Files to add from CSV
  rows: ProcessedAsset[],      // All CSV rows for this asset
  fileCountBefore: number,     // From Phase 1 GET
  fileCountAfter?: number      // From Phase 3 GET
}> = new Map();
```

### Example Entry:

```typescript
assetBatchMap.set('991001', {
  files: [
    { url: 'http://example.com/doc1.pdf', title: 'Doc 1', ... },
    { url: 'http://example.com/doc2.pdf', title: 'Doc 2', ... },
    { url: 'http://example.com/doc3.pdf', title: 'Doc 3', ... }
  ],
  rows: [
    { mmsId: '991001', remoteUrl: '...doc1.pdf', status: 'success', ... },
    { mmsId: '991001', remoteUrl: '...doc2.pdf', status: 'success', ... },
    { mmsId: '991001', remoteUrl: '...doc3.pdf', status: 'success', ... }
  ],
  fileCountBefore: 5,   // Phase 1: Asset had 5 files
  fileCountAfter: 8     // Phase 3: Asset now has 8 files (+3)
});
```

---

## API Response Structure Reference

### GET /esploro/v1/assets/{id}

**Response:**

```json
{
  "totalRecordCount": 1,
  "records": [
    {
      "mms_id": "991283105700561",
      "title": "Asset Title",
      "resourcetype.esploro": "publication.journalArticle",
      "files": [
        {
          "file.name": "document1.pdf",
          "file.type": "submitted",
          "file.mimeType": "application/pdf",
          "file.size": "24214",
          "file.creationDate": "2025-09-21 21:45:43",
          "file.persistent.url": "https://...",
          "file.supplemental": "no"
        },
        {
          "file.name": "document2.pdf",
          ...
        }
      ],
      "links": [ /* external links */ ]
    }
  ]
}
```

**File Count Extraction:**

```typescript
const files = response?.records?.[0]?.files || [];
const fileCount = Array.isArray(files) ? files.length : 0;
```

---

## Benefits of This Approach

1. ✅ **Validation:** Ensures all assets exist before updating
2. ✅ **Accurate Measurement:** Knows exact before/after counts
3. ✅ **Reliable Detection:** Can confidently say which assets changed
4. ✅ **Batch Efficiency:** Groups files per asset correctly
5. ✅ **Job System Integration:** Uses Esploro's designed workflow
6. ✅ **Better Error Handling:** Catches issues at each phase
7. ✅ **Clear Reporting:** Shows exactly what happened

---

## Summary

**The correct workflow is: GET → UPDATE → GET**

1. **GET file counts first** (validate and measure baseline)
2. **UPDATE via job system** (queue files and run import job)
3. **GET file counts again** (verify what actually changed)

This is the **only reliable way** to know if files were actually added to assets!
