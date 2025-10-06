# Complete API Workflow Documentation

## Workflow Overview

The Esploro Asset File Loader implements a 9-step automated workflow:

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Submits Entries                         │
│              (Manual Entry or CSV Upload)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Validate Assets                                         │
│ ─────────────────────────────────────────────────────────────  │
│ For each unique asset ID:                                       │
│   GET /esploro/v1/assets/{assetId}                             │
│                                                                  │
│ Purpose:                                                         │
│   - Verify asset exists                                         │
│   - Get asset type (for file type filtering)                    │
│   - Store initial file list (for before/after comparison)       │
│                                                                  │
│ Response: Asset object with type and files array                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Queue Files via API                                     │
│ ─────────────────────────────────────────────────────────────  │
│ For each asset (grouped by asset ID):                           │
│   POST /esploro/v1/assets/{assetId}?op=patch&action=add        │
│                                                                  │
│ Payload:                                                         │
│   {                                                              │
│     "records": [{                                                │
│       "temporary": {                                             │
│         "linksToExtract": [                                      │
│           {                                                      │
│             "link.title": "File Title",                          │
│             "link.url": "https://...",                           │
│             "link.description": "Description",                   │
│             "link.type": "accepted",                             │
│             "link.supplemental": "false"                         │
│           }                                                      │
│         ]                                                        │
│       }                                                          │
│     }]                                                           │
│   }                                                              │
│                                                                  │
│ Purpose: Queue files for ingestion                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Create Itemized Set                                     │
│ ─────────────────────────────────────────────────────────────  │
│ POST /conf/sets                                                  │
│                                                                  │
│ Payload:                                                         │
│   {                                                              │
│     "name": "Asset File Load - 2025-01-05T12-30-00",            │
│     "type": { "value": "ITEMIZED" },                            │
│     "content_type": { "value": "ASSET" },                       │
│     "description": "Auto-generated set...",                     │
│     "private": false,                                            │
│     "members": {                                                 │
│       "member": [                                                │
│         { "id": "12345678900001234" },                          │
│         { "id": "12345678900001235" }                           │
│       ]                                                          │
│     }                                                            │
│   }                                                              │
│                                                                  │
│ Response: Set object with id                                    │
│ Purpose: Create set containing all target assets                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Verify Set Members                                      │
│ ─────────────────────────────────────────────────────────────  │
│ GET /conf/sets/{setId}                                          │
│                                                                  │
│ Purpose:                                                         │
│   - Confirm all assets were added to the set                    │
│   - Log warning if any assets are missing                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Find Import Job ID                                      │
│ ─────────────────────────────────────────────────────────────  │
│ Primary attempt:                                                 │
│   GET /conf/jobs/M50762                                         │
│   Verify name matches "Import Research Assets Files"            │
│                                                                  │
│ Fallback (if primary fails):                                    │
│   GET /conf/jobs?offset=0&limit=100                             │
│   Continue fetching pages until total_record_count reached      │
│   Search for job matching:                                       │
│     - "Import Research Assets Files"                            │
│     - "Import Asset Files"                                       │
│     - "Import Research Assets Files - via API..."               │
│                                                                  │
│ Purpose: Get the job ID for the import job                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: Run the Job                                             │
│ ─────────────────────────────────────────────────────────────  │
│ POST /conf/jobs/{jobId}/instances                              │
│                                                                  │
│ Payload:                                                         │
│   {                                                              │
│     "set_id": "{setId}"                                         │
│   }                                                              │
│                                                                  │
│ Response:                                                        │
│   {                                                              │
│     "id": "{instanceId}",                                       │
│     "status": { "value": "QUEUED" }                             │
│   }                                                              │
│                                                                  │
│ Purpose: Execute the import job for the created set             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 7: Monitor Job Progress                                    │
│ ─────────────────────────────────────────────────────────────  │
│ Polling loop (every 5 seconds, max 10 minutes):                │
│   GET /conf/jobs/{jobId}/instances/{instanceId}                │
│                                                                  │
│ Terminal statuses:                                               │
│   - COMPLETED_SUCCESS                                            │
│   - COMPLETED_FAILED                                             │
│   - FAILED                                                       │
│   - ABORTED                                                      │
│                                                                  │
│ Response includes:                                               │
│   {                                                              │
│     "status": { "value": "COMPLETED_SUCCESS" },                 │
│     "counter": [                                                 │
│       { "type": "file_uploaded", "value": 5 },                  │
│       { "type": "asset_succeeded", "value": 3 },                │
│       { "type": "asset_failed", "value": 0 }                    │
│     ],                                                           │
│     "report": { "value": "..." }                                │
│   }                                                              │
│                                                                  │
│ Purpose: Wait for job to complete                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 8: Verify Results                                          │
│ ─────────────────────────────────────────────────────────────  │
│ For each asset:                                                  │
│   GET /esploro/v1/assets/{assetId}                             │
│                                                                  │
│ Compare:                                                         │
│   initialFileCount (from Step 1)                                │
│   vs                                                             │
│   finalFileCount (from Step 8)                                  │
│                                                                  │
│ Calculate:                                                       │
│   filesAdded = finalFileCount - initialFileCount                │
│   success = filesAdded > 0                                       │
│                                                                  │
│ Purpose: Definitively verify files were added                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 9: Display Results                                         │
│ ─────────────────────────────────────────────────────────────  │
│ Show user:                                                       │
│   - Set ID                                                       │
│   - Job ID                                                       │
│   - Job Status                                                   │
│   - Job Counters (files_uploaded, assets_succeeded, etc.)      │
│   - Per-Asset Verification:                                     │
│     * Asset ID                                                   │
│     * Initial file count                                         │
│     * Final file count                                           │
│     * Files added                                                │
│     * Success/Failure status                                     │
│   - Errors (if any)                                              │
│                                                                  │
│ Purpose: Provide comprehensive feedback to user                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### Before/After Verification
The app uses before-and-after file list comparison as the **definitive** verification method:
- More reliable than job counters alone
- Confirms actual state change in Esploro
- Provides exact count of files added per asset

### Job Finding Strategy
Two-tier approach for finding the import job:
1. **Primary**: Try hardcoded ID `M50762` (fast)
2. **Fallback**: Search all jobs with pagination (comprehensive)

### Parallel Processing
- Asset validation: All assets validated in parallel (Step 1)
- File queuing: All assets updated in parallel (Step 2)
- Result verification: All assets re-fetched in parallel (Step 8)

### Error Handling
Each step has error handling:
- Asset not found → Stop with clear error
- Set creation fails → Stop with error
- Job not found → Try fallback search
- Job timeout → Stop after 10 minutes
- Verification fails → Show per-asset details

## API Endpoints Used

| Endpoint | Method | Purpose | Step |
|----------|--------|---------|------|
| `/esploro/v1/assets/{id}` | GET | Get asset details | 1, 8 |
| `/esploro/v1/assets/{id}?op=patch&action=add` | POST | Queue files | 2 |
| `/conf/sets` | POST | Create set | 3 |
| `/conf/sets/{id}` | GET | Verify set | 4 |
| `/conf/jobs/{id}` | GET | Get job details | 5 |
| `/conf/jobs` | GET | List all jobs | 5 |
| `/conf/jobs/{id}/instances` | POST | Run job | 6 |
| `/conf/jobs/{id}/instances/{iid}` | GET | Monitor job | 7 |
| `/conf/mapping-tables/AssetFileAndLinkTypes` | GET | Get file type mappings | UI |
| `/conf/code-tables/AssetFileType` | GET | Get file types | UI |

## Performance Characteristics

- **Validation time**: ~1-2 seconds per asset (parallel)
- **File queuing**: ~1-2 seconds per asset (parallel)
- **Set creation**: ~1-2 seconds
- **Job start**: ~1-2 seconds
- **Job monitoring**: 5 seconds per poll, typically 1-5 minutes total
- **Verification**: ~1-2 seconds per asset (parallel)

**Total typical workflow time**: 2-7 minutes depending on job execution time.
