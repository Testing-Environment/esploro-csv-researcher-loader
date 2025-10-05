# Phase 2 Enhancement - Visual Diagrams

## 1. Asset Type-Aware Filtering Flow (Manual Entry)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER ENTERS ASSET ID                        │
│                         (e.g., "123456789")                          │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ valueChanges subscription
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│              loadAssetTypeAndFilterFileTypes(assetId)                │
│                   Set loadingAssetMetadata = true                    │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ API call
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 GET /esploro/v1/assets/{assetId}                     │
│                                                                       │
│  Response: {                                                         │
│    mmsId: "123456789",                                               │
│    title: "Research Paper",                                          │
│    assetType: "publication",  ← KEY FIELD                            │
│    files: [...]                                                      │
│  }                                                                   │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│            filterFileTypesByAssetType(                               │
│              allFileTypes,                                           │
│              assetType: "publication",                               │
│              applicability: "both"                                   │
│            )                                                         │
│                                                                       │
│  Logic:                                                              │
│  1. Filter by SOURCE_CODE_1 === "file" OR "both"                    │
│  2. Filter by SOURCE_CODE_2 includes "publication"                  │
│                                                                       │
│  Example:                                                            │
│  - ID: 44260621250004721                                             │
│    TARGET_CODE: "published"                                          │
│    SOURCE_CODE_1: "both"                  ← Matches (both)          │
│    SOURCE_CODE_2: "publication,patent"    ← Matches (publication)   │
│    RESULT: ✅ INCLUDED                                               │
│                                                                       │
│  - ID: 44260621290004721                                             │
│    TARGET_CODE: "data_file"                                          │
│    SOURCE_CODE_1: "file"                  ← Matches (file)          │
│    SOURCE_CODE_2: "dataset,other"         ← NO MATCH                │
│    RESULT: ❌ EXCLUDED                                               │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│              UPDATE filteredFileTypes = [...]                        │
│              Set loadingAssetMetadata = false                        │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 DROPDOWN UPDATES AUTOMATICALLY                       │
│                                                                       │
│  Before filtering: 50 file types                                     │
│  After filtering:  12 file types (compatible with publication)       │
│                                                                       │
│  Hint: "Showing categories compatible with publication assets"      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Pre-Import Caching and Comparison Flow (CSV Upload)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CSV UPLOADED & MAPPED                        │
│                                                                       │
│  Data:                                                               │
│  MMS ID    | Remote URL                  | File Title               │
│  ─────────────────────────────────────────────────────────────────  │
│  123456789 | https://example.com/a.pdf   | Paper A                  │
│  123456789 | https://example.com/b.pdf   | Paper B  ← Duplicate ID  │
│  987654321 | https://example.com/c.pdf   | Dataset C                │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTRACT UNIQUE MMS IDs                            │
│                  uniqueMmsIds = [123456789, 987654321]               │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│              PARALLEL PRE-IMPORT CACHING (forkJoin)                  │
│                                                                       │
│  ┌───────────────────────────┐  ┌───────────────────────────┐      │
│  │ GET /assets/123456789     │  │ GET /assets/987654321     │      │
│  │                           │  │                           │      │
│  │ Response: {               │  │ Response: {               │      │
│  │   mmsId: "123456789"      │  │   mmsId: "987654321"      │      │
│  │   assetType: "publication"│  │   assetType: "dataset"    │      │
│  │   files: [                │  │   files: [                │      │
│  │     {url: ".../existing"} │  │     {url: ".../data1"}    │      │
│  │   ]                       │  │     {url: ".../data2"}    │      │
│  │ }                         │  │   ]                       │      │
│  │                           │  │ }                         │      │
│  └───────────────────────────┘  └───────────────────────────┘      │
│              ▼                              ▼                        │
│  ┌────────────────────────────────────────────────────────┐        │
│  │           assetCacheMap.set(mmsId, {                    │        │
│  │             mmsId: "123456789",                         │        │
│  │             assetType: "publication",                   │        │
│  │             filesBefore: [1 file],  ← Current state     │        │
│  │             filesAfter: [],         ← Will populate     │        │
│  │             remoteUrlFromCSV: "https://example.com/a.pdf"│       │
│  │           })                                            │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                       │
│  Console: "Cached 2 asset states for comparison"                    │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BATCH PROCESSING                                 │
│                                                                       │
│  For each CSV row:                                                   │
│  1. Validate asset exists                                            │
│  2. POST /assets/{mmsId}/files with {                                │
│       url: remoteUrl,                                                │
│       title: fileTitle,                                              │
│       type: fileType                                                 │
│     }                                                                │
│  3. Mark success or error                                            │
│                                                                       │
│  Results:                                                            │
│  - Row 1 (123456789, a.pdf): API success ✅                          │
│  - Row 2 (123456789, b.pdf): API success ✅                          │
│  - Row 3 (987654321, c.pdf): API success ✅                          │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│          PARALLEL POST-IMPORT COMPARISON (forkJoin)                  │
│                                                                       │
│  ┌───────────────────────────┐  ┌───────────────────────────┐      │
│  │ GET /assets/123456789     │  │ GET /assets/987654321     │      │
│  │                           │  │                           │      │
│  │ Response: {               │  │ Response: {               │      │
│  │   files: [                │  │   files: [                │      │
│  │     {url: ".../existing"} │  │     {url: ".../data1"}    │      │
│  │     {url: ".../a.pdf"} ✅ │  │     {url: ".../data2"}    │      │
│  │     {url: ".../b.pdf"} ✅ │  │     {url: ".../c.pdf"} ✅ │      │
│  │   ]                       │  │   ]                       │      │
│  │ }                         │  │ }                         │      │
│  └───────────────────────────┘  └───────────────────────────┘      │
│              ▼                              ▼                        │
│  ┌────────────────────────────────────────────────────────┐        │
│  │ Update cache.filesAfter = [3 files]                    │        │
│  └────────────────────────────────────────────────────────┘        │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     COMPARISON LOGIC                                 │
│                                                                       │
│  Asset 123456789:                                                    │
│  ─────────────────────────────────────────────────────────────────  │
│  filesBefore.length:  1                                              │
│  filesAfter.length:   3                                              │
│  remoteUrlFromCSV:    "https://example.com/a.pdf"                   │
│  URL in filesAfter:   ✅ YES                                         │
│                                                                       │
│  Calculation:                                                        │
│  - File count changed (1 → 3)  ← CHANGED                             │
│  - Remote URL was added        ← ADDED                               │
│  RESULT: status = 'success', wasUnchanged = false                   │
│                                                                       │
│  Asset 987654321:                                                    │
│  ─────────────────────────────────────────────────────────────────  │
│  filesBefore.length:  2                                              │
│  filesAfter.length:   3                                              │
│  remoteUrlFromCSV:    "https://example.com/c.pdf"                   │
│  URL in filesAfter:   ✅ YES                                         │
│                                                                       │
│  Calculation:                                                        │
│  - File count changed (2 → 3)  ← CHANGED                             │
│  - Remote URL was added        ← ADDED                               │
│  RESULT: status = 'success', wasUnchanged = false                   │
│                                                                       │
│  Console: "Identified 0 potentially unchanged assets"               │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    RESULTS DISPLAY                                   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────┐            │
│  │ Processing Results                                  │            │
│  │                                                     │            │
│  │  ✅ 3 Successful    ❌ 0 Failed    ⚠️ 0 Unchanged  │            │
│  └─────────────────────────────────────────────────────┘            │
│                                                                       │
│  (No "Potential Unchanged Assets" section - all changed)            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Unchanged Asset Detection Example

```
SCENARIO: Duplicate URL Already Exists
═══════════════════════════════════════════════════════════════════════

CSV Input:
┌─────────────────────────────────────────────────────────────────────┐
│ MMS ID    | Remote URL                      | File Title            │
│───────────────────────────────────────────────────────────────────  │
│ 555555555 | https://journal.com/paper.pdf   | Published Paper       │
└─────────────────────────────────────────────────────────────────────┘

PRE-IMPORT CACHING:
┌─────────────────────────────────────────────────────────────────────┐
│ GET /assets/555555555                                                │
│                                                                       │
│ Response: {                                                          │
│   mmsId: "555555555",                                                │
│   assetType: "publication",                                          │
│   files: [                                                           │
│     {                                                                │
│       id: "file001",                                                 │
│       title: "Published Paper",                                      │
│       url: "https://journal.com/paper.pdf",  ← ALREADY EXISTS        │
│       type: "published"                                              │
│     },                                                               │
│     {                                                                │
│       id: "file002",                                                 │
│       title: "Supplementary Data",                                   │
│       url: "https://example.com/data.xlsx",                          │
│       type: "supplementary_material"                                 │
│     }                                                                │
│   ]                                                                  │
│ }                                                                    │
│                                                                       │
│ Cached State:                                                        │
│   filesBefore: 2 files                                               │
│   remoteUrlFromCSV: "https://journal.com/paper.pdf"                  │
└─────────────────────────────────────────────────────────────────────┘

PROCESSING:
┌─────────────────────────────────────────────────────────────────────┐
│ POST /assets/555555555/files                                         │
│                                                                       │
│ Body: {                                                              │
│   url: "https://journal.com/paper.pdf",                              │
│   title: "Published Paper",                                          │
│   type: "44260621250004721"                                          │
│ }                                                                    │
│                                                                       │
│ Response: 200 OK  ← API may silently accept duplicate                │
│ OR                                                                   │
│ Response: 409 Conflict "URL already exists"  ← Explicit rejection    │
│                                                                       │
│ Either way, marked as: status = 'success' ✅                         │
└─────────────────────────────────────────────────────────────────────┘

POST-IMPORT COMPARISON:
┌─────────────────────────────────────────────────────────────────────┐
│ GET /assets/555555555                                                │
│                                                                       │
│ Response: {                                                          │
│   files: [                                                           │
│     {                                                                │
│       id: "file001",                                                 │
│       title: "Published Paper",                                      │
│       url: "https://journal.com/paper.pdf",  ← STILL SAME FILE       │
│       type: "published"                                              │
│     },                                                               │
│     {                                                                │
│       id: "file002",                                                 │
│       title: "Supplementary Data",                                   │
│       url: "https://example.com/data.xlsx",                          │
│       type: "supplementary_material"                                 │
│     }                                                                │
│   ]                                                                  │
│ }                                                                    │
│                                                                       │
│ Updated Cached State:                                                │
│   filesAfter: 2 files  ← SAME AS BEFORE                              │
└─────────────────────────────────────────────────────────────────────┘

COMPARISON CALCULATION:
┌─────────────────────────────────────────────────────────────────────┐
│ filesBeforeCount:  2                                                 │
│ filesAfterCount:   2                                                 │
│ remoteUrlFromCSV:  "https://journal.com/paper.pdf"                   │
│                                                                       │
│ Check URL was added:                                                 │
│   filesAfter.some(f => f.url === remoteUrlFromCSV)                   │
│   → filesAfter contains this URL: ✅ YES                             │
│   → But it was ALREADY there (not newly added)                       │
│                                                                       │
│ Logic:                                                               │
│   if (filesBeforeCount === filesAfterCount && !remoteUrlAdded) {     │
│     // File count same AND URL not newly added                       │
│     asset.status = 'unchanged';                                      │
│     asset.wasUnchanged = true;                                       │
│   }                                                                  │
│                                                                       │
│ RESULT: status = 'unchanged', wasUnchanged = true ⚠️                 │
└─────────────────────────────────────────────────────────────────────┘

RESULTS DISPLAY:
┌─────────────────────────────────────────────────────────────────────┐
│ Processing Results                                                   │
│                                                                       │
│  ✅ 1 Successful    ❌ 0 Failed    ⚠️ 1 Unchanged                    │
│                                                                       │
│ ┌───────────────────────────────────────────────────────────────┐  │
│ │ ⚠️ Potential Unchanged Assets                                  │  │
│ │                                                                 │  │
│ │ The following 1 asset was successfully processed, but the file  │  │
│ │ list appears unchanged. This could indicate that the file       │  │
│ │ already exists on the asset...                                  │  │
│ │                                                                 │  │
│ │ ┌─────────────────────────────────────────────────────────────┐ │  │
│ │ │ Asset ID    │ File Title       │ Remote URL         │ Reason│ │  │
│ │ ├─────────────────────────────────────────────────────────────┤ │  │
│ │ │ 555555555   │ Published Paper  │ https://journal... │ File  │ │  │
│ │ │             │                  │                    │ count │ │  │
│ │ │             │                  │                    │ un-   │ │  │
│ │ │             │                  │                    │ changed│ │  │
│ │ └─────────────────────────────────────────────────────────────┘ │  │
│ │                                                                 │  │
│ │ 💡 Review these assets manually in Esploro to confirm the file  │  │
│ │    status. The provided URLs may already be attached or may     │  │
│ │    have been rejected.                                          │  │
│ └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                           │
│                                                                       │
│  ┌───────────────────┐         ┌────────────────────────────────┐  │
│  │  MainComponent    │         │  CSVProcessorComponent         │  │
│  │  ─────────────    │         │  ────────────────────────      │  │
│  │  • assetId field  │         │  • parseCSVFile()              │  │
│  │  • fileType       │         │  • validateFileTypes()         │  │
│  │    dropdown       │         │  • cacheAssetStates() ← NEW    │  │
│  │  • filteredFile   │         │  • processAssets()             │  │
│  │    Types ← NEW    │         │  • compareAssetStates() ← NEW  │  │
│  └─────────┬─────────┘         └────────────┬───────────────────┘  │
│            │                                 │                       │
└────────────┼─────────────────────────────────┼───────────────────────┘
             │                                 │
             │ Reactive Forms                  │ Observables
             │ valueChanges                    │ forkJoin
             ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                                │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  AssetService                                                  │  │
│  │  ────────────                                                  │  │
│  │  • getAssetMetadata(mmsId) ← NEW                               │  │
│  │    → Observable<AssetMetadata>                                 │  │
│  │    → Fetches: type, title, files[]                             │  │
│  │                                                                 │  │
│  │  • filterFileTypesByAssetType(...) ← NEW                       │  │
│  │    → Filters by SOURCE_CODE_1 and SOURCE_CODE_2                │  │
│  │    → Returns compatible file types only                        │  │
│  │                                                                 │  │
│  │  • getAssetFilesAndLinkTypes()                                 │  │
│  │    → Observable<AssetFileAndLinkType[]>                        │  │
│  │    → Fetches mapping table with IDs                            │  │
│  └────────────────────────────┬──────────────────────────────────┘  │
│                               │                                      │
└───────────────────────────────┼──────────────────────────────────────┘
                                │
                                │ CloudAppRestService
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            API LAYER                                 │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Esploro REST APIs                                             │  │
│  │  ──────────────────                                            │  │
│  │  GET  /esploro/v1/assets/{mmsId}                               │  │
│  │       → Asset metadata with type and files                     │  │
│  │                                                                 │  │
│  │  POST /esploro/v1/assets/{mmsId}/files                         │  │
│  │       → Attach file to asset                                   │  │
│  │                                                                 │  │
│  │  GET  /conf/mapping-tables/AssetFileAndLinkTypes              │  │
│  │       → File type categories with compatibility                │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. State Management Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      COMPONENT STATE                                 │
└─────────────────────────────────────────────────────────────────────┘

MainComponent State:
┌─────────────────────────────────────────────────────────────────────┐
│ assetFileAndLinkTypes: AssetFileAndLinkType[]  ← All types (loaded) │
│ filteredFileTypes: AssetFileAndLinkType[]      ← Filtered subset    │
│ currentAssetType: string                       ← Cached asset type  │
│ loadingAssetMetadata: boolean                  ← Loading state      │
└─────────────────────────────────────────────────────────────────────┘

State Transitions:
─────────────────

Initial State:
  assetFileAndLinkTypes: []
  filteredFileTypes: []
  currentAssetType: ''
  loadingAssetMetadata: false

After Loading File Types:
  assetFileAndLinkTypes: [50 types]  ← From API
  filteredFileTypes: [50 types]      ← Initially same
  currentAssetType: ''
  loadingAssetMetadata: false

User Enters Asset ID "123456":
  loadingAssetMetadata: true         ← Loading starts

Asset Metadata Fetched (type: "publication"):
  currentAssetType: 'publication'
  filteredFileTypes: [12 types]      ← Filtered
  loadingAssetMetadata: false        ← Loading done

User Clears Asset ID:
  (filteredFileTypes remains filtered until new ID entered)

Error Fetching Metadata:
  currentAssetType: ''
  filteredFileTypes: [50 types]      ← Fallback to all
  loadingAssetMetadata: false


CSVProcessorComponent State:
┌─────────────────────────────────────────────────────────────────────┐
│ csvData: CSVData | null                        ← Parsed CSV         │
│ columnMappingData: ColumnMapping[]             ← User mappings      │
│ assetCacheMap: Map<string, CachedAssetState>   ← Before/after cache │
│ isProcessing: boolean                          ← Processing state   │
│ processingProgress: number                     ← 0-100%             │
└─────────────────────────────────────────────────────────────────────┘

Cache State Transitions:
─────────────────────────

Initial State:
  assetCacheMap: Map (size: 0)

After Pre-Import Caching:
  assetCacheMap: Map (size: N unique MMS IDs)
    Key: "123456789"
    Value: {
      mmsId: "123456789",
      assetType: "publication",
      filesBefore: [2 files],
      filesAfter: [],              ← Empty until comparison
      remoteUrlFromCSV: "https://..."
    }

After Post-Import Comparison:
  assetCacheMap: Map (size: N)
    Key: "123456789"
    Value: {
      mmsId: "123456789",
      assetType: "publication",
      filesBefore: [2 files],
      filesAfter: [3 files],       ← Updated
      remoteUrlFromCSV: "https://..."
    }

After Reset:
  assetCacheMap: Map (size: 0)     ← Cleared
```

---

*End of Visual Diagrams Document*
