# Esploro CSV Asset Loader – Comprehensive Codebase Analysis (2025)

This document maps the structure, components, data flow, dependencies, and design of the Esploro CSV Asset Loader Cloud App so a new developer can get productive quickly and a reviewer can understand how the pieces fit together.

At a glance: An Angular 11 Cloud App for Esploro that lets users attach files/links to research assets either manually or in bulk via CSV, validates and normalizes file type categories using Esploro configuration mapping tables, and guides users to complete ingestion using Esploro’s “Import Research Assets Files” job.

---

## Project purpose and typical usage

- Purpose: Enrich existing Esploro research assets by adding files/links with proper metadata.
- Manual path: Enter one asset ID and one or more file records; app posts a “queue files” payload to the asset.
- CSV path: Upload a CSV with MMS IDs and file metadata. The processor enforces MMS ID and File URL as required columns/values, auto-maps optional columns (title, description, file type), converts file type names to required IDs (prompting for any unresolved values), processes each row, and produces a “successful MMS IDs” CSV to help create a set and run the import job in Esploro.
- Typical workflow:
  1) Open app inside Esploro, 2) choose Manual Entry or CSV Upload, 3) submit, 4) create a set from the MMS IDs, 5) run the “Import Research Assets Files” job.

---

## Structure map (files, folders, entry points)

Top-level
- `manifest.json` – Cloud App manifest: pages, permissions, icon, title/description, and entity scope.
- `package.json` – Node dependencies and scripts; dev served via `eca start`.
- `settings.json` – App settings template (if used with Cloud Apps settings service).
- `README.md` – End-user and developer overview.
- `documentation/` – Rich docs suite, examples, diagrams, API references.

Angular app (Cloud App)
- `cloudapp/src/app/app.module.ts` – Root Angular module; declares components and imports Cloud Apps libs and i18n.
- `cloudapp/src/app/app-routing.module.ts` – Routes; root route renders `MainComponent`.
- `cloudapp/src/app/app.component.ts` – Root shell with alert outlet + router outlet.
- `cloudapp/src/app/main/` – Manual entry form UI and CSV tab container.
  - `main.component.ts|html|scss` – Orchestrates manual form and hosts CSV components and results.
- `cloudapp/src/app/components/`
  - `csv-processor/…` – CSV upload, mapping, validation, conversion, batch processing.
  - `processing-results/…` – Summary table, MMS ID download, deep links back to Esploro.
- `cloudapp/src/app/services/asset.service.ts` – Esploro REST calls and mapping-table helpers.
- `cloudapp/src/app/models/` – Shared interfaces: `asset.ts`, `types.ts`.
- `cloudapp/src/app/constants/file-types.ts` – Legacy placeholder (fallback retired; mapping table is authoritative).
- `cloudapp/src/app/utilities.ts` – Misc. helpers.
- `cloudapp/src/i18n/en.json` – All user-facing strings with ICU message format.
- `cloudapp/src/assets/assetFileLoader.png` – App icon.

Languages and frameworks
- Language: TypeScript (Angular 11)
- UI: Angular Material 11
- Esploro integration: Ex Libris Cloud Apps SDK (`@exlibris/exl-cloudapp-angular-lib`)

Main entry points
- Cloud App loads `/#/` which routes to `MainComponent` (`app-routing.module.ts`).
- `MainComponent` renders tabs for Manual Entry and CSV Upload and wires results view.

---

## Core components and relationships

- AppComponent (root shell)
  - Displays `<cloudapp-alert>` and `<router-outlet>`; no logic beyond app initialization.
- MainComponent (feature container)
  - Holds reactive form for single-asset manual submissions.
  - Loads the AssetFileAndLinkTypes mapping table and derives display hints and default selections from it.
  - Detects asset type by MMS ID to filter compatible file/link categories.
  - Hosts CSVProcessorComponent and ProcessingResultsComponent.
- CSVProcessorComponent (bulk CSV engine)
  - CSV upload, parsing (RFC 4180 style), column auto-mapping, mapping validation, and enforcement that MMS ID + Remote URL columns exist while other fields remain optional.
  - File type value validation against mapping table; fuzzy match to convert names to required IDs and track unresolved values until the user maps them manually.
  - Caches “before” asset file state, calls APIs per row, fetches “after” state, flags unchanged assets.
  - Emits processed rows and generates a “successful MMS IDs” CSV for downstream Esploro steps.
- ProcessingResultsComponent (outcome UI)
  - Renders success/error/unchanged counts and per-row status.
  - Provides deep links to Esploro Viewer, Advanced Search, Jobs.
- AssetService (integration/service layer)
  - Adds files via “queue links to extract” payload to `/esploro/v1/assets/{id}?op=patch&action=add`.
  - Retrieves the AssetFileAndLinkTypes mapping table from `/conf` APIs.
  - Retrieves asset metadata to resolve asset type and compare files before/after.
- AppService (bootstrap helper)
  - Placeholder for Cloud App InitService usage.

Relationship diagram

```mermaid
flowchart TD
  App[AppComponent]
  App --> Main[MainComponent]
  Main -->|manual submit| AssetService
  Main --> CSV[CSVProcessorComponent]
  CSV -->|REST calls| AssetService
  CSV --> Results[ProcessingResultsComponent]
  Main --> Results
  AssetService -->|/conf/mapping-tables| Esploro
  AssetService -->|/esploro/v1/assets| Esploro
```

---

## Data flow (end to end)

Manual entry path
1) Stage 1 – Users can select which optional fields to include via toggle chips at the top of the form. Asset ID and File URL are always required and visible. Optional fields (Title, Description, File Type, Supplemental) can be toggled on/off:
   - **Toggle On**: Field column appears in all rows with validators applied
   - **Toggle Off**: Field column hides (data preserved) and excluded from submission
   - Users add one or more rows, each requiring **Asset ID** and **File URL** as minimum

2) User chooses **Specify Types of Each File** or **Proceed Without Selecting File Types**. The component validates asset IDs via `GET /esploro/v1/assets/{assetIds}` using a batch approach:
   
   - **Valid Asset Processing**: For successfully validated rows, the component extracts and stores asset type information and existing file data for each asset. This data is maintained in a "diffing list" that will be used later to compare pre-processing and post-processing states.
   
   - **Invalid Asset Tracking**: Asset IDs that fail validation are stored in a separate "retry list" for subsequent validation attempts.
   
   - **Duplicate URL+Asset ID Detection**: The component validates that each unique combination of Asset ID and File URL appears only once across all active rows. Duplicate combinations are flagged as invalid and highlighted in red with a tooltip explaining: "Duplicate entry: This asset ID and URL combination already exists. The same file cannot be attached to the same asset multiple times until the current upload completes."
   
   - **Deleted Entries Management**: Rows that are deleted by the user (after any fields were populated) are moved to a "deleted list" and displayed in a collapsible section below all active rows. These deleted entries:
     - Are displayed with greyed-out styling to distinguish them from active rows
     - Can be restored individually or in bulk back to active entries via restore buttons
     - Are automatically removed from the deleted list if a new active row is added with identical field values (excluding asset ID)
     - Remain in the deleted list until the job is submitted (unless restored or auto-removed)
     - Can be exported as a CSV file at any time via the "Export Deleted Entries as CSV file" button
     - Can be permanently removed from the deleted list via individual delete buttons
     - The deleted entries section only appears when the deleted list is not empty
   
   - **Row Duplication**: Users can duplicate any active row by clicking a duplicate button, which:
     - Copies all populated fields from the source row except the Asset ID field
     - Creates a new row immediately below the duplicated row
     - Leaves the Asset ID field empty for the user to populate
     - Maintains all other field values (URL, title, description, type, supplemental)
     - Only copies values from fields that are currently active/visible
   
   - **Dynamic List Management During Stage 1**: 
     - **Invalid Asset ID Cleanup**: If the user deletes all rows containing a specific invalid asset ID, that asset ID is automatically removed from the retry list
     - **New Asset ID Addition**: When new rows are added during this stage, their asset IDs are included in the retry list for validation and highlighted in orange with a tooltip: "New asset ID: This asset ID has not been validated yet and will be checked in the next validation cycle."
     - **Valid Asset ID Removal**: If a valid asset ID is removed from all rows (either by editing the asset ID field or deleting all rows associated with that asset ID), the corresponding entry is removed from the diffing list
     - **Valid Asset ID Field Changes**: 
       - If a user edits a valid row's asset ID field to an asset ID that already exists in the diffing list, the row is highlighted in yellow with a tooltip: "Validated asset: This asset ID has already been validated. You can proceed with this entry." No changes are made to the diffing list
       - If a user edits a valid row's asset ID field to a new asset ID that hasn't been validated, the row is highlighted in orange, sorted to appear just under the invalid rows section, and the new asset ID is added to the retry list with a tooltip: "Pending validation: This asset ID will be validated before submission."
     - **Deleted Row Tracking**: When a user deletes a row that has any populated fields:
       - The row is moved to the deleted list (not permanently removed)
       - The row is displayed in a collapsible "Deleted Entries" section below active rows with greyed-out styling
       - The deleted row is excluded from validation and submission processes
       - The deleted row can be restored to active entries at any time
     - **Automatic Deleted List Cleanup**: When a user adds a new row with field values (excluding asset ID) that exactly match a deleted row, the matching deleted row is automatically removed from the deleted list
   
   - **Retry Validation**: Once the user completes their corrections, the retry list is processed via `GET /esploro/v1/assets/{assetIds}`. The successful responses provide asset category/type data and existing files data, which are then appended to the diffing list.
   
   - **Final Validation**: The process continues until all rows contain valid asset IDs, unique URL+Asset ID combinations, and all required field data is captured for the next processing steps.
   
   - **Pre-Submission Export Options**: Before proceeding to import asset files, users are presented with three export options:
     - **Export Deleted Entries as CSV file** (checkbox): Download all deleted entries for future reference or recovery
     - **Export Valid Entries as CSV file** (checkbox): Download all successfully validated entries
     - **Export Invalid Entries as CSV file** (checkbox): Download all entries that failed validation
     
     Users can select any combination of these options before clicking "Proceed to Import Asset Files". The deleted list is only cleared after successful job submission.

Invalid rows are highlighted and sorted to the top for easy correction, with tooltips providing context-specific guidance for each validation state.
3) Stage 2 (when selected) – user picks the file type ID for each row, with options filtered by asset type. If Stage 2 is skipped, the file type field is excluded from the payload for step 4 altogether (or uses default if File Type field was toggled on in Stage 1).
4) MainComponent groups rows by asset ID, builds the `temporary.linksToExtract` payload(s) using only active/visible fields, and issues `POST /esploro/v1/assets/{assetId}?op=patch&action=add` sequentially.

---

## Structure map (files, folders, entry points)

Top-level
- `manifest.json` – Cloud App manifest: pages, permissions, icon, title/description, and entity scope.
- `package.json` – Node dependencies and scripts; dev served via `eca start`.
- `settings.json` – App settings template (if used with Cloud Apps settings service).
- `README.md` – End-user and developer overview.
- `documentation/` – Rich docs suite, examples, diagrams, API references.

Angular app (Cloud App)
- `cloudapp/src/app/app.module.ts` – Root Angular module; declares components and imports Cloud Apps libs and i18n.
- `cloudapp/src/app/app-routing.module.ts` – Routes; root route renders `MainComponent`.
- `cloudapp/src/app/app.component.ts` – Root shell with alert outlet + router outlet.
- `cloudapp/src/app/main/` – Manual entry form UI and CSV tab container.
  - `main.component.ts|html|scss` – Orchestrates manual form and hosts CSV components and results.
- `cloudapp/src/app/components/`
  - `csv-processor/…` – CSV upload, mapping, validation, conversion, batch processing.
  - `processing-results/…` – Summary table, MMS ID download, deep links back to Esploro.
- `cloudapp/src/app/services/asset.service.ts` – Esploro REST calls and mapping-table helpers.
- `cloudapp/src/app/models/` – Shared interfaces: `asset.ts`, `types.ts`.
- `cloudapp/src/app/constants/file-types.ts` – Legacy placeholder (fallback retired; mapping table is authoritative).
- `cloudapp/src/app/utilities.ts` – Misc. helpers.
- `cloudapp/src/i18n/en.json` – All user-facing strings with ICU message format.
- `cloudapp/src/assets/assetFileLoader.png` – App icon.

Languages and frameworks
- Language: TypeScript (Angular 11)
- UI: Angular Material 11
- Esploro integration: Ex Libris Cloud Apps SDK (`@exlibris/exl-cloudapp-angular-lib`)

Main entry points
- Cloud App loads `/#/` which routes to `MainComponent` (`app-routing.module.ts`).
- `MainComponent` renders tabs for Manual Entry and CSV Upload and wires results view.

---

## Core components and relationships

- AppComponent (root shell)
  - Displays `<cloudapp-alert>` and `<router-outlet>`; no logic beyond app initialization.
- MainComponent (feature container)
  - Holds reactive form for single-asset manual submissions.
  - Loads the AssetFileAndLinkTypes mapping table and derives display hints and default selections from it.
  - Detects asset type by MMS ID to filter compatible file/link categories.
  - Hosts CSVProcessorComponent and ProcessingResultsComponent.
- CSVProcessorComponent (bulk CSV engine)
  - CSV upload, parsing (RFC 4180 style), column auto-mapping, mapping validation, and enforcement that MMS ID + Remote URL columns exist while other fields remain optional.
  - File type value validation against mapping table; fuzzy match to convert names to required IDs and track unresolved values until the user maps them manually.
  - Caches “before” asset file state, calls APIs per row, fetches “after” state, flags unchanged assets.
  - Emits processed rows and generates a “successful MMS IDs” CSV for downstream Esploro steps.
- ProcessingResultsComponent (outcome UI)
  - Renders success/error/unchanged counts and per-row status.
  - Provides deep links to Esploro Viewer, Advanced Search, Jobs.
- AssetService (integration/service layer)
  - Adds files via “queue links to extract” payload to `/esploro/v1/assets/{id}?op=patch&action=add`.
  - Retrieves the AssetFileAndLinkTypes mapping table from `/conf` APIs.
  - Retrieves asset metadata to resolve asset type and compare files before/after.
- AppService (bootstrap helper)
  - Placeholder for Cloud App InitService usage.

Relationship diagram

```mermaid
flowchart TD
  App[AppComponent]
  App --> Main[MainComponent]
  Main -->|manual submit| AssetService
  Main --> CSV[CSVProcessorComponent]
  CSV -->|REST calls| AssetService
  CSV --> Results[ProcessingResultsComponent]
  Main --> Results
  AssetService -->|/conf/mapping-tables| Esploro
  AssetService -->|/esploro/v1/assets| Esploro
```

---

## Data flow (end to end)

Manual entry path
1) Stage 1 – Users can select which optional fields to include via toggle chips at the top of the form. Asset ID and File URL are always required and visible. Optional fields (Title, Description, File Type, Supplemental) can be toggled on/off:
   - **Toggle On**: Field column appears in all rows with validators applied
   - **Toggle Off**: Field column hides (data preserved) and excluded from submission
   - Users add one or more rows, each requiring **Asset ID** and **File URL** as minimum

2) User chooses **Specify Types of Each File** or **Proceed Without Selecting File Types**. The component validates asset IDs via `GET /esploro/v1/assets/{assetIds}` using a batch approach:
   
   - **Valid Asset Processing**: For successfully validated rows, the component extracts and stores asset type information and existing file data for each asset. This data is maintained in a "diffing list" that will be used later to compare pre-processing and post-processing states.
   
   - **Invalid Asset Tracking**: Asset IDs that fail validation are stored in a separate "retry list" for subsequent validation attempts.
   
   - **Duplicate URL+Asset ID Detection**: The component validates that each unique combination of Asset ID and File URL appears only once across all active rows. Duplicate combinations are flagged as invalid and highlighted in red with a tooltip explaining: "Duplicate entry: This asset ID and URL combination already exists. The same file cannot be attached to the same asset multiple times until the current upload completes."
   
   - **Deleted Entries Management**: Rows that are deleted by the user (after any fields were populated) are moved to a "deleted list" and displayed in a collapsible section below all active rows. These deleted entries:
     - Are displayed with greyed-out styling to distinguish them from active rows
     - Can be restored individually or in bulk back to active entries via restore buttons
     - Are automatically removed from the deleted list if a new active row is added with identical field values (excluding asset ID)
     - Remain in the deleted list until the job is submitted (unless restored or auto-removed)
     - Can be exported as a CSV file at any time via the "Export Deleted Entries as CSV file" button
     - Can be permanently removed from the deleted list via individual delete buttons
     - The deleted entries section only appears when the deleted list is not empty
   
   - **Row Duplication**: Users can duplicate any active row by clicking a duplicate button, which:
     - Copies all populated fields from the source row except the Asset ID field
     - Creates a new row immediately below the duplicated row
     - Leaves the Asset ID field empty for the user to populate
     - Maintains all other field values (URL, title, description, type, supplemental)
     - Only copies values from fields that are currently active/visible
   
   - **Dynamic List Management During Stage 1**: 
     - **Invalid Asset ID Cleanup**: If the user deletes all rows containing a specific invalid asset ID, that asset ID is automatically removed from the retry list
     - **New Asset ID Addition**: When new rows are added during this stage, their asset IDs are included in the retry list for validation and highlighted in orange with a tooltip: "New asset ID: This asset ID has not been validated yet and will be checked in the next validation cycle."
     - **Valid Asset ID Removal**: If a valid asset ID is removed from all rows (either by editing the asset ID field or deleting all rows associated with that asset ID), the corresponding entry is removed from the diffing list
     - **Valid Asset ID Field Changes**: 
       - If a user edits a valid row's asset ID field to an asset ID that already exists in the diffing list, the row is highlighted in yellow with a tooltip: "Validated asset: This asset ID has already been validated. You can proceed with this entry." No changes are made to the diffing list
       - If a user edits a valid row's asset ID field to a new asset ID that hasn't been validated, the row is highlighted in orange, sorted to appear just under the invalid rows section, and the new asset ID is added to the retry list with a tooltip: "Pending validation: This asset ID will be validated before submission."
     - **Deleted Row Tracking**: When a user deletes a row that has any populated fields:
       - The row is moved to the deleted list (not permanently removed)
       - The row is displayed in a collapsible "Deleted Entries" section below active rows with greyed-out styling
       - The deleted row is excluded from validation and submission processes
       - The deleted row can be restored to active entries at any time
     - **Automatic Deleted List Cleanup**: When a user adds a new row with field values (excluding asset ID) that exactly match a deleted row, the matching deleted row is automatically removed from the deleted list
   
   - **Retry Validation**: Once the user completes their corrections, the retry list is processed via `GET /esploro/v1/assets/{assetIds}`. The successful responses provide asset category/type data and existing files data, which are then appended to the diffing list.
   
   - **Final Validation**: The process continues until all rows contain valid asset IDs, unique URL+Asset ID combinations, and all required field data is captured for the next processing steps.
   
   - **Pre-Submission Export Options**: Before proceeding to import asset files, users are presented with three export options:
     - **Export Deleted Entries as CSV file** (checkbox): Download all deleted entries for future reference or recovery
     - **Export Valid Entries as CSV file** (checkbox): Download all successfully validated entries
     - **Export Invalid Entries as CSV file** (checkbox): Download all entries that failed validation
     
     Users can select any combination of these options before clicking "Proceed to Import Asset Files". The deleted list is only cleared after successful job submission.

Invalid rows are highlighted and sorted to the top for easy correction, with tooltips providing context-specific guidance for each validation state.
3) Stage 2 (when selected) – user picks the file type ID for each row, with options filtered by asset type. If Stage 2 is skipped, the file type field is excluded from the payload for step 4 altogether (or uses default if File Type field was toggled on in Stage 1).
4) MainComponent groups rows by asset ID, builds the `temporary.linksToExtract` payload(s) using only active/visible fields, and issues `POST /esploro/v1/assets/{assetId}?op=patch&action=add` sequentially.

---

## Core components and relationships

- AppComponent (root shell)
  - Displays `<cloudapp-alert>` and `<router-outlet>`; no logic beyond app initialization.
- MainComponent (feature container)
  - Holds reactive form for single-asset manual submissions.
  - Loads the AssetFileAndLinkTypes mapping table and derives display hints and default selections from it.
  - Detects asset type by MMS ID to filter compatible file/link categories.
  - Hosts CSVProcessorComponent and ProcessingResultsComponent.
- CSVProcessorComponent (bulk CSV engine)
  - CSV upload, parsing (RFC 4180 style), column auto-mapping, mapping validation, and enforcement that MMS ID + Remote URL columns exist while other fields remain optional.
  - File type value validation against mapping table; fuzzy match to convert names to required IDs and track unresolved values until the user maps them manually.
  - Caches “before” asset file state, calls APIs per row, fetches “after” state, flags unchanged assets.
  - Emits processed rows and generates a “successful MMS IDs” CSV for downstream Esploro steps.
- ProcessingResultsComponent (outcome UI)
  - Renders success/error/unchanged counts and per-row status.
  - Provides deep links to Esploro Viewer, Advanced Search, Jobs.
- AssetService (integration/service layer)
  - Adds files via “queue links to extract” payload to `/esploro/v1/assets/{id}?op=patch&action=add`.
  - Retrieves the AssetFileAndLinkTypes mapping table from `/conf` APIs.
  - Retrieves asset metadata to resolve asset type and compare files before/after.
- AppService (bootstrap helper)
  - Placeholder for Cloud App InitService usage.

Relationship diagram

```mermaid
flowchart TD
  App[AppComponent]
  App --> Main[MainComponent]
  Main -->|manual submit| AssetService
  Main --> CSV[CSVProcessorComponent]
  CSV -->|REST calls| AssetService
  CSV --> Results[ProcessingResultsComponent]
  Main --> Results
  AssetService -->|/conf/mapping-tables| Esploro
  AssetService -->|/esploro/v1/assets| Esploro
```

---

## Data flow (end to end)

Manual entry path
1) Stage 1 – Users can select which optional fields to include via toggle chips at the top of the form. Asset ID and File URL are always required and visible. Optional fields (Title, Description, File Type, Supplemental) can be toggled on/off:
   - **Toggle On**: Field column appears in all rows with validators applied
   - **Toggle Off**: Field column hides (data preserved) and excluded from submission
   - Users add one or more rows, each requiring **Asset ID** and **File URL** as minimum

2) User chooses **Specify Types of Each File** or **Proceed Without Selecting File Types**. The component validates asset IDs via `GET /esploro/v1/assets/{assetIds}` using a batch approach:
   
   - **Valid Asset Processing**: For successfully validated rows, the component extracts and stores asset type information and existing file data for each asset. This data is maintained in a "diffing list" that will be used later to compare pre-processing and post-processing states.
   
   - **Invalid Asset Tracking**: Asset IDs that fail validation are stored in a separate "retry list" for subsequent validation attempts.
   
   - **Duplicate URL+Asset ID Detection**: The component validates that each unique combination of Asset ID and File URL appears only once across all active rows. Duplicate combinations are flagged as invalid and highlighted in red with a tooltip explaining: "Duplicate entry: This asset ID and URL combination already exists. The same file cannot be attached to the same asset multiple times until the current upload completes."
   
   - **Deleted Entries Management**: Rows that are deleted by the user (after any fields were populated) are moved to a "deleted list" and displayed in a collapsible section below all active rows. These deleted entries:
     - Are displayed with greyed-out styling to distinguish them from active rows
     - Can be restored individually or in bulk back to active entries via restore buttons
     - Are automatically removed from the deleted list if a new active row is added with identical field values (excluding asset ID)
     - Remain in the deleted list until the job is submitted (unless restored or auto-removed)
     - Can be exported as a CSV file at any time via the "Export Deleted Entries as CSV file" button
     - Can be permanently removed from the deleted list via individual delete buttons
     - The deleted entries section only appears when the deleted list is not empty
   
   - **Row Duplication**: Users can duplicate any active row by clicking a duplicate button, which:
     - Copies all populated fields from the source row except the Asset ID field
     - Creates a new row immediately below the duplicated row
     - Leaves the Asset ID field empty for the user to populate
     - Maintains all other field values (URL, title, description, type, supplemental)
     - Only copies values from fields that are currently active/visible
   
   - **Dynamic List Management During Stage 1**: 
     - **Invalid Asset ID Cleanup**: If the user deletes all rows containing a specific invalid asset ID, that asset ID is automatically removed from the retry list
     - **New Asset ID Addition**: When new rows are added during this stage, their asset IDs are included in the retry list for validation and highlighted in orange with a tooltip: "New asset ID: This asset ID has not been validated yet and will be checked in the next validation cycle."
     - **Valid Asset ID Removal**: If a valid asset ID is removed from all rows (either by editing the asset ID field or deleting all rows associated with that asset ID), the corresponding entry is removed from the diffing list
     - **Valid Asset ID Field Changes**: 
       - If a user edits a valid row's asset ID field to an asset ID that already exists in the diffing list, the row is highlighted in yellow with a tooltip: "Validated asset: This asset ID has already been validated. You can proceed with this entry." No changes are made to the diffing list
       - If a user edits a valid row's asset ID field to a new asset ID that hasn't been validated, the row is highlighted in orange, sorted to appear just under the invalid rows section, and the new asset ID is added to the retry list with a tooltip: "Pending validation: This asset ID will be validated before submission."
     - **Deleted Row Tracking**: When a user deletes a row that has any populated fields:
       - The row is moved to the deleted list (not permanently removed)
       - The row is displayed in a collapsible "Deleted Entries" section below active rows with greyed-out styling
       - The deleted row is excluded from validation and submission processes
       - The deleted row can be restored to active entries at any time
     - **Automatic Deleted List Cleanup**: When a user adds a new row with field values (excluding asset ID) that exactly match a deleted row, the matching deleted row is automatically removed from the deleted list
   
   - **Retry Validation**: Once the user completes their corrections, the retry list is processed via `GET /esploro/v1/assets/{assetIds}`. The successful responses provide asset category/type data and existing files data, which are then appended to the diffing list.
   
   - **Final Validation**: The process continues until all rows contain valid asset IDs, unique URL+Asset ID combinations, and all required field data is captured for the next processing steps.
   
   - **Pre-Submission Export Options**: Before proceeding to import asset files, users are presented with three export options:
     - **Export Deleted Entries as CSV file** (checkbox): Download all deleted entries for future reference or recovery
     - **Export Valid Entries as CSV file** (checkbox): Download all successfully validated entries
     - **Export Invalid Entries as CSV file** (checkbox): Download all entries that failed validation
     
     Users can select any combination of these options before clicking "Proceed to Import Asset Files". The deleted list is only cleared after successful job submission.

Invalid rows are highlighted and sorted to the top for easy correction, with tooltips providing context-specific guidance for each validation state.
3) Stage 2 (when selected) – user picks the file type ID for each row, with options filtered by asset type. If Stage 2 is skipped, the file type field is excluded from the payload for step 4 altogether (or uses default if File Type field was toggled on in Stage 1).
4) MainComponent groups rows by asset ID, builds the `temporary.linksToExtract` payload(s) using only active/visible fields, and issues `POST /esploro/v1/assets/{assetId}?op=patch&action=add` sequentially.

---

## External dependencies and roles

- Angular 11 and Angular Material 11 – UI framework and components.
- RxJS 6 – Observables, operators (`finalize`, `catchError`, etc.).
- `@exlibris/exl-cloudapp-angular-lib` – Cloud Apps runtime services:
  - `CloudAppRestService` for proxied REST calls inside Esploro context.
  - `AlertService` to surface success/info/warn/error banners.
  - `InitService`, `CloudAppEventsService` for init and page info.
- `@ngx-translate/core` + `ngx-translate-parser-plural-select` – i18n with ICU.

---

## Coding patterns and practices

- Angular component/service separation; single-responsibility components.
- Reactive forms for manual entry with validators and pristine/touched management.
- Observable pipelines with `finalize` for consistent loading flags; `catchError` to avoid stream failures.
- Progressive enhancement: gracefully handles mapping-table outages by hiding hints and prompting users to retry, while still enforcing valid IDs.
- Config normalization: robust parsing of `/conf` API responses that can vary in shape.
- Defensive CSV parser: handles quotes, commas, and empty lines; reports per-row issues.
- Asset-type–aware filtering of file categories using mapping table and asset metadata.
- Minimal rate-limiting (100 ms delay between CSV rows) to reduce throttling risk.

---

## Critical logic hotspots (security/performance/behavior)

1) File type validation and conversion
  - The Esploro “AssetFileAndLinkTypes” mapping table requires ID values in API calls. Users often provide labels/names in CSV. The component auto-matches names→IDs, tracks unresolved values until mapped, and prompts for manual selection if needed. This prevents subtle API failures.

2) Pre/post asset state comparison
   - Caches existing files and compares after processing to flag “unchanged” assets—useful when URLs are duplicates or policies prevent attachment. This improves operator awareness.

3) URL validation and trust boundaries
   - Manual form enforces `^https?://` pattern; CSV path relies on mapping and downstream API errors. Consider adding stricter URL checks and optional allowlists.

4) Error handling and user feedback
   - Manual path maps HTTP status codes to friendly messages (0/400/401-403). CSV path surfaces per-row failures. AlertService ensures visibility.

5) Performance and throttling
   - Sequential CSV processing with a small delay; could be extended with concurrency + exponential backoff where safe, but beware of tenant rate limits.

6) Config API variability
  - Code handles multiple shapes of mapping-table responses. This resilience is critical for compatibility across deployments.

---

## APIs and payloads in use

- Queue links to extract (manual)
  - `POST /esploro/v1/assets/{assetId}?op=patch&action=add`
  - Payload: `{ records: [{ temporary: { linksToExtract: [{ 'link.title', 'link.url', 'link.description'?, 'link.type', 'link.supplemental' }] } }] }`
    - **Required fields**: `link.title`, `link.url`, `link.type`, `link.supplemental`
    - **Optional fields**: `link.description` (indicated by `?` - can be omitted if empty)

- Add file (CSV per-row path)
  - `POST /esploro/v1/assets/{mmsId}/files`
  - Body: `{ url, title, description, type }`

- Read asset metadata
  - `GET /esploro/v1/assets/{mmsId}` → used for type, title, and file list.

- Configuration
  - `GET /conf/mapping-tables/AssetFileAndLinkTypes` → mapping table with IDs/labels/applicability.

---

## Visual data flow (CSV path)

```mermaid
sequenceDiagram
  participant U as User
  participant CSV as CSVProcessorComponent
  participant S as AssetService
  participant E as Esploro APIs

  U->>CSV: Upload CSV
  CSV->>CSV: Parse + auto-map + validate
  CSV->>S: getAssetFilesAndLinkTypes()
  S->>E: GET /conf/mapping-tables/AssetFileAndLinkTypes
  E-->>S: Mapping table
  S-->>CSV: Normalized types
  CSV->>CSV: Convert file type names → IDs (prompt if needed)
  loop each row
    CSV->>S: getAssetMetadata(mmsId)
    S->>E: GET /esploro/v1/assets/{mmsId}
    E-->>S: Asset (pre-state)
    CSV->>E: POST /esploro/v1/assets/{mmsId}/files {url,title,desc,type}
    E-->>CSV: Ack
  end
  CSV->>S: getAssetMetadata() for successes
  S->>E: GET /esploro/v1/assets/{mmsId}
  E-->>S: Asset (post-state)
  CSV->>CSV: Compare states, mark unchanged
  CSV-->>U: Results + MMS IDs CSV + next steps
```

---

## Configuration files and significance

- `manifest.json`
  - App identity, pages (`/#/main`, `/#/settings`), icon, and entity scope `RESEARCH_ASSET`.
  - Enables fullscreen and relevant sandbox permissions.
- `package.json`
  - Angular 11, Material 11, Cloud Apps libraries, i18n libs.
  - Script `start: eca start` uses Ex Libris Cloud App CLI tooling for dev serving.
- `settings.json`
  - Template for persisted app settings if needed (current version uses minimal settings; CSV and mapping are in-app).

---

## Notable implementation details

- i18n: Centralized strings in `cloudapp/src/i18n/en.json` with rich copy for CSV workflow, conversion dialogs, and instructions.
- UI: Angular Material with an enhanced module wrapper; consistent outline appearance for form fields.
- Utilities: Generic helpers for chunking, downloads, deep merges; can be leveraged for future features (e.g., batched requests).

---

## Gaps, risks, and questions

Documentation gaps
- Some legacy docs still reference the old “researcher loader.” The code now supports CSV-based asset file processing—ensure cross-doc consistency (README mostly aligned; verify all references).
- `settings/` feature is minimal; `esploro-fields.ts` is empty. Either remove or flesh out usage.

Testing/quality
- No unit tests present. Consider adding tests for:
  - CSV parsing edge cases (quotes, escapes, malformed rows).
  - Mapping-table normalization across response shapes.
  - File type matching (exact/fuzzy/manual) with snapshots.
  - Pre/post asset comparison logic.

Security
- Strengthen URL validation beyond `^https?://`; optionally support allowlists or HEAD checks.
- Confirm Cloud App permissions are the minimum required; validate `entities` is correct for your tenancy.

Performance
- Consider bounded concurrency with retry/backoff for large CSVs; monitor tenant rate limits.

Open questions to clarify
- Should CSV processing also support the manual “queue links to extract” endpoint for parity with manual path?
- Do we need institutional overrides for mapping-table names or alternative code tables?
- Any need to persist user-defined column mappings or conversions between sessions?

---

## Onboarding quick-start for developers

1) Install dependencies and start dev server
   - `npm install`
   - `npm start` (served via Cloud Apps dev tooling)
2) Load app in Esploro Developer Mode and test both Manual and CSV flows.
3) Key files to read first
   - `main.component.ts` – feature container and manual path
   - `services/asset.service.ts` – API contracts and helpers
   - `components/csv-processor/*` – CSV path end-to-end
   - `i18n/en.json` – feature copy and user flows

---

## Requirements coverage summary

- Structure map: Done (folders, languages, entry points, configs)
- Core components: Done (list + relationships)
- Data flow: Done (manual and CSV paths + sequence diagram)
- Dependencies: Done (frameworks and roles)
- Patterns/practices: Done
- Critical logic: Done (validation, comparison, errors, throttling)
- Project purpose & usage: Done
- Documentation gaps: Done, plus open questions
- Visual aids: Done (mermaid diagrams)

Last updated: 2025-10-05

│   ├── angular.json                    # Angular configuration
│   ├── tsconfig.json                   # TypeScript config
│   └── package.json                    # Frontend dependencies
│
├── documentation/                       # Comprehensive documentation
│   ├── CLEANUP_SUMMARY.md              # Legacy code removal history
│   ├── DEVELOPER_QUICK_REFERENCE.md    # Quick start guide
│   ├── JOB_SUBMISSION_ENHANCEMENT.md   # Future enhancement proposals
│   ├── VISUAL_DIAGRAMS.md              # Architecture diagrams
│   ├── LEGACY_CSV_LOADER_EXPLANATION.md # Old CSV loader docs
│   └── Expanded_Esploro_Schema.md      # Database schema reference
│
├── manifest.json                        # Cloud App manifest ⭐
├── package.json                         # Root package file
├── README.md                            # User-facing documentation
└── settings.json                        # App settings template

⭐ = Core files for understanding the application
```

### Key Directory Purposes

- **`cloudapp/src/app/main/`**: The heart of the application - contains the file upload form
- **`cloudapp/src/app/services/`**: API integration with Esploro
- **`cloudapp/src/app/models/`**: TypeScript type definitions
- **`documentation/`**: Comprehensive developer and architectural documentation
- **Root files**: Configuration, manifest, deployment settings

---

## Technology Stack

### Frontend Framework
- **Angular 11.2.14** - Core framework
  - Component-based architecture
  - Reactive forms for data binding
  - Dependency injection
  - RxJS for async operations

### UI Components
- **Angular Material 11.2.12** - Material Design components
  - `mat-form-field` - Form inputs
  - `mat-select` - Dropdowns
  - `mat-checkbox` - Checkboxes
  - `mat-card` - File group containers
  - `mat-progress-bar` - Loading indicators
  - `mat-icon` - Icons

### Key Libraries

#### Ex Libris Cloud Apps SDK
- **@exlibris/exl-cloudapp-angular-lib** (v1.4.7)
  - `CloudAppRestService` - API calls with built-in authentication
  - `AlertService` - User notifications
  - Framework integration and routing

#### Reactive Programming
- **RxJS 6.5.5**
  - `Observable` - Async data streams
  - `map()`, `catchError()`, `finalize()` - Operators
  - `switchMap()` - Chaining API calls (future enhancement)

#### Angular Ecosystem
- **@angular/forms** - Reactive forms
- **@angular/router** - Navigation (minimal usage)
- **@angular/common/http** - HTTP client (wrapped by SDK)

### Build Tools
- **Angular CLI** - Build and dev server
- **TypeScript 4.1.5** - Type safety
- **Webpack** (bundled with Angular) - Module bundling

### Development Tools
- **Node.js 20+** - Runtime
- **npm 10+** - Package management

---

## Core Architecture

### Architectural Pattern: Component-Service Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           MainComponent (main.component.ts)            │  │
│  │                                                        │  │
│  │  - Reactive Form (FormGroup + FormArray)               │  │
│  │  - User interaction handlers                           │  │
│  │  - Validation logic                                    │  │
│  │  - UI state management                                 │  │
│  └─────────────────┬──────────────────────────────────────┘  │
│                    │                                         │
└────────────────────┼─────────────────────────────────────────┘
                     │ Dependency Injection
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           AssetService (asset.service.ts)              │  │
│  │                                                        │  │
│  │  - API integration                                     │  │
│  │  - Data transformation (UI ↔ API format)               │  │
│  │  - HTTP request construction                           │  │
│  │  - Response parsing                                    │  │
│  └─────────────────┬──────────────────────────────────────┘  │
│                    │                                         │
└────────────────────┼─────────────────────────────────────────┘
                     │ Uses
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    INTEGRATION LAYER                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │      CloudAppRestService (Ex Libris SDK)               │  │
│  │                                                        │  │
│  │  - Authentication                                      │  │
│  │  - Base URL configuration                              │  │
│  │  - Request/response interception                       │  │
│  └─────────────────┬──────────────────────────────────────┘  │
│                    │                                         │
└────────────────────┼─────────────────────────────────────────┘
                     │ HTTP Calls
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                      ESPLORO APIs                            │
│                                                              │
│  - POST /esploro/v1/assets/{id}?op=patch&action=add          │
│  - GET  /conf/mapping-tables/AssetFileAndLinkTypes           │
└──────────────────────────────────────────────────────────────┘
```

### Design Patterns Used

1. **Dependency Injection** (Angular core)
   - Services injected into components
   - Singleton service instances
   - Testability through mocking

2. **Observer Pattern** (RxJS)
   - Async operations via Observables
   - Subscribe to API responses
   - Unsubscribe on component destroy

3. **Reactive Forms Pattern**
   - Form state managed reactively
   - Validation rules declarative
   - Two-way data binding

4. **Service Layer Pattern**
   - Business logic separated from UI
   - API calls centralized in service
   - Reusable service methods

---

## Component Analysis

### MainComponent (`cloudapp/src/app/main/main.component.ts`)

**Purpose**: Primary user interface for file attachment workflow

#### Component Properties

```typescript
export class MainComponent implements OnInit {
  form: FormGroup;
  stage: ManualEntryStage = 'stage1';
  stageTwoSkipped = false;
  assetValidationInProgress = false;
  fileTypes: FileType[] = [];
  assetFileAndLinkTypes: AssetFileAndLinkType[] = [];
  submitting = false;
  submissionResult: { type: 'success' | 'error'; message: string } | null = null;
  assetMetadataMap = new Map<string, AssetMetadata>();

  processedAssets: ProcessedAsset[] = [];
  mmsIdDownloadUrl = '';
  showResults = false;
  showWorkflowInstructions = false;

  private readonly urlPattern = /^https?:\/\//i;
}
```

#### Component Lifecycle

```
Constructor
  ├─► Inject dependencies (FormBuilder, AssetService, AlertService)
  └─► Initialize form structure
      └─► entries: FormArray of row FormGroups (assetId, url, optional metadata, type)

ngOnInit()
  └─► Load AssetFileAndLinkTypes mapping table (derive file type hints and default IDs)

User Interaction
  ├─► Stage 1 editing
  │   ├─► "Add another file" → addEntry()
  │   └─► Remove icon → removeEntry(index)
  ├─► "Specify Types of Each File" → specifyTypesForEachFile()
  │   ├─► Validate required fields
  │   ├─► Validate asset IDs via `getAssetMetadata` (reorder invalid rows)
  │   ├─► Apply type validators and default suggestions
  │   └─► Transition to Stage 2 (stage = 'stage2')
  ├─► "Proceed Without Selecting File Types" → proceedWithoutSelectingTypes()
  │   ├─► Validate required fields and asset IDs
  │   ├─► Assign default type IDs per entry
  │   └─► Submit immediately with `executeSubmission(true)`
  ├─► Stage 2 form (type selection)
  │   ├─► User picks types, can adjust optional metadata
  │   └─► "Back to Details" → returnToStageOne()
  └─► Submit button → submitWithSelectedTypes()
      ├─► Ensure type controls valid
      ├─► Group entries by assetId
      ├─► Call assetService.addFilesToAsset() sequentially
      └─► Display success/error and reset Stage 1 state
```

#### Key Methods

##### `addEntry()` / `removeEntry(index)`
- Manage the Stage 1 FormArray of file rows.
- Prevents removing the final entry to keep at least one row on screen.

##### `specifyTypesForEachFile()`
- Marks required controls, validates Stage 1 rows, and calls `validateStageOneEntries()` to confirm every asset exists.
- Invalid asset IDs are highlighted and moved to the top of the list for quick correction.
- When validation passes, applies type validators, pre-fills suggested defaults, and flips the component to Stage 2.

##### `proceedWithoutSelectingTypes()`
- Shares the same Stage 1 validation path.
- Assigns a default file type ID for each entry (based on asset type filtering) and immediately calls `executeSubmission(true)` to queue the files without entering Stage 2.

##### `submitWithSelectedTypes()`
- Stage 2 submission handler. Ensures every type control is valid before delegating to `executeSubmission(false)`.

##### `executeSubmission(skippedStageTwo: boolean)` (private)
- Groups rows by `assetId`, transforms them into `AssetFileLink[]`, and calls `assetService.addFilesToAsset()` sequentially via `concatMap`.
- Aggregates success counts across assets, surfaces errors with context, and resets the Stage 1 form when finished.

##### `validateStageOneEntries()` (private)
- Ensures asset IDs and URLs are populated, uses `forkJoin` to fetch metadata for each unique asset, and returns `false` if any lookups fail (while flagging the offending rows).

##### `assignDefaultType(group)` / `getFilteredFileTypes(group)` (private)
- Guarantee each entry carries a valid file type ID, either via Stage 2 selection or by choosing the first compatible mapping-table value.

##### `createEntryGroup()` (private)
- Factory for each row form group: `{ assetId, title, url, description, type, supplemental }` with only `assetId` and `url` marked as required in Stage 1.

##### `loadAssetFilesAndLinkTypes()` (private)
- Fetches the AssetFileAndLinkTypes mapping table, caches valid IDs, and builds the file type hint list used by both manual and CSV flows. On error, clears the hint list and surfaces an alert so users know to retry.

#### Template Integration

**File**: `cloudapp/src/app/main/main.component.html`

**Structure Outline**:
```html
<form [formGroup]="form" (ngSubmit)="submitWithSelectedTypes()">
  <ng-container [ngSwitch]="stage">
    <ng-container *ngSwitchCase="'stage1'">
      <!-- Guidance callout + Stage 1 formArray (assetId + URL required) -->
      <section formArrayName="entries">
        <mat-card *ngFor="let entryGroup of entries.controls; let i = index" [formGroupName]="i">
          <!-- Asset ID, URL, optional metadata -->
        </mat-card>
      </section>
      <button type="button" (click)="specifyTypesForEachFile()">Specify Types of Each File</button>
      <button type="button" (click)="proceedWithoutSelectingTypes()">Proceed Without Selecting File Types</button>
    </ng-container>

    <ng-container *ngSwitchCase="'stage2'">
      <!-- Stage 2 summary + type selectors -->
      <section formArrayName="entries">
        <mat-card *ngFor="let entryGroup of entries.controls; let i = index" [formGroupName]="i">
          <mat-select formControlName="type">
            <mat-option *ngFor="let option of getFilteredFileTypes(entryGroup)">
              {{ option.targetCode }} (ID: {{ option.id }})
            </mat-option>
          </mat-select>
        </mat-card>
      </section>
      <button type="button" (click)="returnToStageOne()">Back to Details</button>
      <button type="submit">Submit Files</button>
    </ng-container>
  </ng-container>

  <mat-progress-bar *ngIf="submitting || assetValidationInProgress"></mat-progress-bar>
  <div *ngIf="submissionResult">{{ submissionResult.message }}</div>
</form>
```

#### Styling

**File**: `cloudapp/src/app/main/main.component.scss`

**Key Styles** (typical):
- Form layout and spacing
- Card styling for file groups
- Button positioning
- Result message colors (success/error)
- Responsive design

---

## Service Layer

### AssetService (`cloudapp/src/app/services/asset.service.ts`)

**Purpose**: Centralized API integration for asset-related operations

#### Service Structure

```typescript
@Injectable({
  providedIn: 'root' // Singleton service
})
export class AssetService {
  constructor(
    private restService: CloudAppRestService
  ) { }
  
  // Public API methods
  addFilesToAsset(assetId: string, files: AssetFileLink[]): Observable<any>
  getAssetFilesAndLinkTypes(): Observable<AssetFileAndLinkType[]>
}
```

#### Method: `addFilesToAsset()`

**Signature**:
```typescript
addFilesToAsset(assetId: string, files: AssetFileLink[]): Observable<any>
```

**Purpose**: Queue external files for attachment to an asset

**Input**:
- `assetId`: Target asset identifier (e.g., "12345678900001234")
- `files`: Array of file metadata

**Process**:
1. Transform `AssetFileLink[]` to Esploro API format
2. Build payload with `temporary.linksToExtract` structure
3. Construct HTTP POST request
4. Return Observable

**API Call**:
```http
POST /esploro/v1/assets/{assetId}?op=patch&action=add
Content-Type: application/json

{
  "records": [
    {
      "temporary": {
        "linksToExtract": [
          {
            "link.title": "File Title",
            "link.url": "https://example.com/file.pdf",
            "link.description": "Optional description",
            "link.type": "accepted",
            "link.supplemental": "false"
          }
        ]
      }
    }
  ]
}
```

**Data Transformation**:
```typescript
// Input: AssetFileLink
{
  title: "My Document",
  url: "https://example.com/doc.pdf",
  description: "Research findings",
  type: "accepted",
  supplemental: false
}

// Output: API format
{
  "link.title": "My Document",
  "link.url": "https://example.com/doc.pdf",
  "link.description": "Research findings",
  "link.type": "accepted",
  "link.supplemental": "false" // Note: string, not boolean
}
```

**Key Implementation Detail**: The `supplemental` field is converted to a string (`"true"` or `"false"`) because the Esploro API expects string values for this field.

#### Method: `getAssetFilesAndLinkTypes()`

**Signature**:
```typescript
getAssetFilesAndLinkTypes(): Observable<AssetFileAndLinkType[]>
```

**Purpose**: Retrieve the AssetFileAndLinkTypes mapping table, which supplies the valid file/link category IDs and labels required for both manual and CSV flows.

**API Call**:
```http
GET /conf/mapping-tables/AssetFileAndLinkTypes
```

**Response Parsing**:
The mapping-table API can return rows in several formats. The service normalizes each row into a consistent shape:

```typescript
.pipe(
  map((response: any) => {
    const rows = response?.mapping_table?.rows?.row
      ?? response?.rows?.row
      ?? response?.row
      ?? [];

    const normalized = Array.isArray(rows) ? rows : [rows];

    return normalized
      .filter(Boolean)
      .map((row: any) => ({
        id: row?.id ?? row?.ID ?? '',
        targetCode: row?.target_code ?? row?.TARGET_CODE ?? '',
        sourceCode1: row?.source_code_1 ?? row?.SOURCE_CODE_1 ?? '',
        sourceCode2: row?.source_code_2 ?? row?.SOURCE_CODE_2 ?? '',
        sourceCode3: row?.source_code_3 ?? row?.SOURCE_CODE_3 ?? '',
        sourceCode4: row?.source_code_4 ?? row?.SOURCE_CODE_4 ?? '',
        sourceCode5: row?.source_code_5 ?? row?.SOURCE_CODE_5 ?? ''
      }))
      .filter((entry: AssetFileAndLinkType) => !!entry.id && !!entry.targetCode);
  })
)
```

**Output**: `AssetFileAndLinkType[]` containing IDs, human-readable labels (`targetCode`), and applicability metadata. This collection is cached for default type assignment, Stage 2 dropdowns, and CSV auto-conversion heuristics.

---

## Data Models

### AssetFileLink (`cloudapp/src/app/models/asset.ts`)

**Purpose**: Represents file metadata for attachment

```typescript
export interface AssetFileLink {
  title: string;          // Display name in Esploro UI
  url: string;            // HTTP(S) URL where file can be downloaded
  description?: string;   // Optional description shown to users
  type: string;           // AssetFileAndLinkTypes ID required by the Esploro API
  supplemental: boolean;  // Is this a supplemental/additional file?
}
```

**Field Details**:

- **title**: Required. The name shown in Esploro's file list. Example: "Supplementary Data Table S1"
- **url**: Required. Must be a valid HTTP or HTTPS URL accessible to Esploro servers. Example: "https://repository.example.edu/files/dataset.csv"
- **description**: Optional. Additional context for users. Example: "Raw experimental data in CSV format"
- **type**: Required. Must match an ID from the AssetFileAndLinkTypes mapping table. Example: the ID associated with "Supplementary material"
- **supplemental**: Required (default: false). Indicates if this is additional material rather than the primary file

**Usage Example**:
```typescript
const file: AssetFileLink = {
  title: "Research Dataset",
  url: "https://data.example.edu/dataset.zip",
  description: "Complete experimental dataset with README",
  type: "62", // Example ID for "Supplementary material"
  supplemental: true
};
```

---

## Data Flow

### Complete File Attachment Workflow

```
┌─────────────┐
│    USER     │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Opens Cloud App in Esploro
       ▼
┌──────────────────────────────────────┐
│     MainComponent Initializes        │
│                                      │
│  ngOnInit() called                   │
│  └─► loadAssetFilesAndLinkTypes()    │
│      └─► AssetService.getAssetFilesAndLinkTypes() │
└──────────┬───────────────────────────┘
           │
           │ 2. API call to fetch file type mapping table
           ▼
Flow summary (Stage 1 → Stage 2):

1. User enters rows in Stage 1 (Asset ID + File URL required, optional metadata)
2. On **Specify Types of Each File**, `specifyTypesForEachFile()` validates fields and asset IDs via `getAssetMetadata`. Invalid rows are highlighted and moved to the top of the list for quick correction.
3. Stage 2 renders, enforcing `type` selections with options filtered by asset type. Users can go back to Stage 1 or submit with chosen IDs.
4. On **Proceed Without Selecting File Types**, `proceedWithoutSelectingTypes()` performs the same validation but assigns default type IDs and skips Stage 2 entirely.
5. `executeSubmission(skippedStageTwo)` groups rows by asset ID and builds the `temporary.linksToExtract` payload that `AssetService.addFilesToAsset()` posts to `/esploro/v1/assets/{assetId}?op=patch&action=add`.
           │
           │ 8. HTTP POST
           ▼
┌───────────────────────────────────────────────────┐
│  Esploro API                                      │
│  POST /esploro/v1/assets/12345678900001234        │
│       ?op=patch&action=add                        │
│                                                   │
│  Esploro processes request:                       │
│  ├─► Validates asset exists                      │
│  ├─► Validates user permissions                  │
│  ├─► Validates file metadata                     │
│  └─► Stores in temporary.linksToExtract          │
└──────────┬────────────────────────────────────────┘
           │
           ├───── Success ─────┐
           │                   │
           │                   ▼
           │         ┌─────────────────────────────┐
           │         │  HTTP 200 OK                │
           │         │  { ... asset metadata ... } │
           │         └──────────┬──────────────────┘
           │                    │
           │                    │ 9. Return to component
           │                    ▼
           │         ┌─────────────────────────────────────┐
           │         │  MainComponent.subscribe.next()     │
           │         │                                     │
           │         │  - AlertService.success(message)    │
           │         │  - submissionResult = success       │
           │         │  - resetFiles() called              │
           │         │  - Form cleared (except asset ID)   │
           │         └─────────────────────────────────────┘
           │
           └───── Error ───────┐
                               │
                               ▼
                     ┌─────────────────────────────┐
                     │  HTTP 4xx/5xx Error         │
                     │  { error: { message } }     │
                     └──────────┬──────────────────┘
                                │
                                │ 10. Return to component
                                ▼
                     ┌─────────────────────────────────────┐
                     │  MainComponent.subscribe.error()    │
                     │                                     │
                     │  - AlertService.error(message)      │
                     │  - submissionResult = error         │
                     │  - Form data retained               │
                     └─────────────────────────────────────┘


Post-Submission (Manual Steps):
───────────────────────────────
┌─────────────────────────────────────────────────────┐
│  User must manually in Esploro:                     │
│                                                     │
│  1. Go to "Manage Sets"                             │
│  2. Create new itemized set                         │
│  3. Add the updated asset(s) to the set             │
│  4. Go to "Admin" > "Manage Jobs"                   │
│  5. Run "Load files" job                            │
│  6. Select the set created in step 2                │
│  7. Submit job                                      │
│  8. Monitor job completion                          │
│  9. Verify files attached to asset                  │
│                                                     │
│  ⚠️ This manual process could be automated         │
│     (see JOB_SUBMISSION_ENHANCEMENT.md)             │
└─────────────────────────────────────────────────────┘
```

---

## API Integration

### Esploro Assets API

#### Endpoint: Add Files to Asset

**URL**: `/esploro/v1/assets/{assetId}?op=patch&action=add`

**Method**: POST

**Purpose**: Queue external files for download and attachment

**Authentication**: Handled by CloudAppRestService (automatic)

**Headers**:
```http
Content-Type: application/json
Accept: application/json
```

**Request Body Schema**:
```json
{
  "records": [
    {
      "temporary": {
        "linksToExtract": [
          {
            "link.title": "string (required)",
            "link.url": "string (required, HTTP/HTTPS URL)",
            "link.description": "string (optional)",
            "link.type": "string (required, code table value)",
            "link.supplemental": "string ('true' or 'false')"
          }
        ]
      }
    }
  ]
}
```

**Success Response**:
```json
{
  "id": "12345678900001234",
  "title": "Asset Title",
  ... other asset fields ...
}
```

**Error Responses**:

- **404 Not Found**: Asset ID doesn't exist
  ```json
  {
    "errorList": {
      "error": [{
        "errorCode": "ASSET_NOT_FOUND",
        "errorMessage": "Asset with ID 12345678900001234 not found"
      }]
    }
  }
  ```

- **403 Forbidden**: User lacks permissions
  ```json
  {
    "errorList": {
      "error": [{
        "errorCode": "INSUFFICIENT_PERMISSIONS",
        "errorMessage": "User does not have permission to modify asset"
      }]
    }
  }
  ```

- **400 Bad Request**: Invalid data
  ```json
  {
    "errorList": {
      "error": [{
        "errorCode": "INVALID_LINK_URL",
        "errorMessage": "Link URL must be a valid HTTP or HTTPS URL"
      }]
    }
  }
  ```

### Alma Configuration API

#### Endpoint: Get Mapping Table

**URL**: `/conf/mapping-tables/{mappingTableName}`

**Method**: GET

**Used For**: `AssetFileAndLinkTypes` mapping table

**Response Format** (varies):
```json
{
  "mapping_table": {
    "name": "AssetFileAndLinkTypes",
    "rows": {
      "row": [
        {
          "id": "62",
          "target_code": "Supplementary material",
          "source_code_1": "both",
          "source_code_2": "publication,patent"
        },
        {
          "id": "63",
          "target_code": "Accepted version",
          "source_code_1": "file",
          "source_code_2": "publication"
        }
      ]
    }
  }
}
```

**Note**: Response structure can vary. AssetService normalizes all formats.

---

## Form Management

### Reactive Forms Architecture

The application uses Angular's Reactive Forms for powerful form handling:

```typescript
// Form Structure
FormGroup: form
├── assetId: FormControl<string>
└── files: FormArray
    ├── [0]: FormGroup
    │   ├── title: FormControl<string>
    │   ├── url: FormControl<string>
    │   ├── description: FormControl<string>
    │   ├── type: FormControl<string>
    │   └── supplemental: FormControl<boolean>
    ├── [1]: FormGroup (if added)
    │   └── ... same structure ...
    └── [N]: FormGroup (dynamically added)
```

### Form Initialization

**In Constructor**:
```typescript
this.form = this.fb.group({
  assetId: ['', Validators.required],
  files: this.fb.array([this.createFileGroup()])
});
```

**Factory Method for File Groups**:
```typescript
private createFileGroup(): FormGroup {
  return this.fb.group({
    title: ['', Validators.required],
    url: ['', [
      Validators.required, 
      Validators.pattern(/^https?:\/\//i)
    ]],
    description: [''],  // Optional, no validators
    type: ['', Validators.required],
    supplemental: [false]  // Default value
  });
}
```

### Form Validation

#### Built-in Validators

- **Validators.required**: Field must have a value
  - Applied to: `assetId`, `title`, `url`, `type`

- **Validators.pattern()**: Field must match regex
  - Applied to: `url` (must start with `http://` or `https://`)

#### Validation States

```typescript
// Check if form is valid
if (this.form.invalid) {
  this.form.markAllAsTouched(); // Show all validation errors
  return; // Prevent submission
}

// Check individual field
const assetIdControl = this.form.get('assetId');
if (assetIdControl?.hasError('required')) {
  // Show error message
}
```

#### Error Messages in Template

```html
<mat-form-field>
  <input matInput formControlName="url">
  <mat-error *ngIf="control.hasError('required')">
    File URL is required.
  </mat-error>
  <mat-error *ngIf="control.hasError('pattern')">
    Enter a valid http(s) URL.
  </mat-error>
</mat-form-field>
```

#### Dynamic Form Array

##### Adding a File Group

```typescript
addFile(): void {
  this.files.push(this.createFileGroup());
}
```

**Template**:
```html
<button mat-stroked-button type="button" (click)="addFile()">
  <mat-icon>add</mat-icon>
  <span>Add another file</span>
</button>
```

##### Removing a File Group

```typescript
removeFile(index: number): void {
  if (this.files.length === 1) {
    return; // Always keep at least one file
  }
  this.files.removeAt(index);
}
```

**Template**:
```html
<button mat-icon-button type="button" 
        (click)="removeFile(i)" 
        *ngIf="files.length > 1">
  <mat-icon>delete</mat-icon>
</button>
```

### Form State Management

#### Pristine vs. Dirty

- **Pristine**: User hasn't changed any values
- **Dirty**: User has modified at least one value

```typescript
// After form reset
this.form.markAsPristine();  // Mark as unchanged
this.form.markAsUntouched(); // Mark as not interacted with
```

#### Touched vs. Untouched

- **Untouched**: User hasn't focused any field
- **Touched**: User has focused at least one field

```typescript
// Before showing errors
if (control.touched && control.invalid) {
  // Show error
}
```

---

## Validation Strategy

### Multi-Layer Validation

```
┌─────────────────────────────────────┐
│     LAYER 1: CLIENT-SIDE            │
│     (Immediate Feedback)            │
│                                     │
│  ✓ Required fields (manual form + CSV MMS ID/Remote URL) │
│  ✓ URL format (HTTP/HTTPS)          │
│  ✓ Form structure                   │
│                                     │
│  Prevents: Invalid submissions      │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│     LAYER 2: SERVICE LAYER          │
│     (Pre-API Validation)            │
│                                     │
│  ✓ Payload transformation           │
│  ✓ Data type conversions            │
│  ✓ Optional field handling          │
│                                     │
│  Prevents: Malformed API requests   │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│     LAYER 3: API VALIDATION         │
│     (Server-Side Rules)             │
│                                     │
│  ✓ Asset exists                     │
│  ✓ User has permissions             │
│  ✓ File type code is valid          │
│  ✓ URLs are accessible              │
│                                     │
│  Prevents: Business rule violations │
└─────────────────────────────────────┘
```

### Validation Rules Detail

#### Asset ID
- **Required**: Yes
- **Format**: Numeric string
- **Example**: "12345678900001234"
- **Validation**: Built-in `required` validator

#### File Title
- **Required**: Yes
- **Format**: Any non-empty string
- **Max Length**: Not enforced (Esploro may have limits)
- **Example**: "Supplementary Data Table S1"

#### File URL
- **Required**: Yes
- **Format**: Must start with `http://` or `https://`
- **Validation**: `Validators.pattern(/^https?:\/\//i)`
- **Example**: "https://example.com/file.pdf"
- **Note**: URL must be accessible to Esploro servers

#### File Description
- **Required**: No
- **Format**: Any string
- **Default**: Empty string (omitted from API payload)

#### File Type
- **Required**: Yes
- **Format**: Must match an ID from the `AssetFileAndLinkTypes` mapping table
- **Validation**: Required + dynamic dropdown filtered by asset type
- **Example**: `62` (ID for "Supplementary material")

#### Supplemental
- **Required**: No (has default)
- **Format**: Boolean (converted to string for API)
- **Default**: `false`
- **Example**: `true` → `"true"` in API

---

## Error Handling

### Error Handling Strategy

```
Error Sources:
├── Form Validation Errors (Client-side)
│   └── Handled by: Angular Forms + mat-error
│
├── File Type Loading Errors (API)
│   └── Handled by: Alert the user and hide type hints until the mapping table loads successfully
│
└── File Submission Errors (API)
    └── Handled by: subscribe.error() + AlertService
```

### Error Categories

#### 1. Form Validation Errors

**When**: User submits with invalid data

**Handling**:
```typescript
if (this.form.invalid) {
  this.form.markAllAsTouched(); // Show all errors
  return; // Don't submit
}
```

**Display**: Inline error messages under each field

**Example**:
```html
<mat-error>File URL is required.</mat-error>
<mat-error>Enter a valid http(s) URL.</mat-error>
```

#### 2. API Errors - File Types

**When**: `getAssetFilesAndLinkTypes()` fails

**Handling**:
```typescript
this.assetService.getAssetFilesAndLinkTypes()
  .subscribe({
    next: (types) => {
      this.assetFileAndLinkTypes = types;
      this.fileTypes = this.buildFileTypeHints(types);
    },
    error: (error) => {
      console.error('Failed to load AssetFileAndLinkTypes mapping table:', error);
      this.alert.error('Failed to load file type categories. Some features may be limited.');
      this.assetFileAndLinkTypes = [];
      this.fileTypes = [];
    }
  });
```

**User Experience**: Seamless - user sees hardcoded file types

**Logging**: Silent (could be enhanced)

#### 3. API Errors - File Submission

**When**: `addFilesToAsset()` fails

**Common Errors**:

- **Asset Not Found (404)**
  - Message: "Asset with ID {id} not found"
  - Cause: Invalid or non-existent asset ID
  - Recovery: User re-checks asset ID

- **Permission Denied (403)**
  - Message: "You don't have permission to modify this asset"
  - Cause: User lacks "modify research assets" permission
  - Recovery: Contact administrator for permissions

- **Bad Request (400)**
  - Message: "Invalid file data. Check URLs and formats."
  - Cause: Invalid URL, file type, or payload structure
  - Recovery: User reviews and corrects data

- **Server Error (500)**
  - Message: "Server error. Please try again later."
  - Cause: Esploro internal error
  - Recovery: Retry later or contact support

**Handling**:
```typescript
this.assetService.addFilesToAsset(assetId, files)
  .subscribe({
    next: (response) => {
      this.alert.success('Success!');
      this.submissionResult = { type: 'success', message: '...' };
    },
    error: (error) => {
      const message = error?.message || 'Unknown error';
      this.alert.error(message);
      this.submissionResult = { type: 'error', message };
    }
  });
```

**Display**: 
1. Alert banner at top of page (via `AlertService`)
2. Result message in form (via `submissionResult`)

### Error Recovery

#### Form Errors
- **Action**: Fix invalid fields
- **Guidance**: Red error messages under each field
- **State**: Form data preserved

#### API Errors
- **Action**: Review error message and correct
- **Guidance**: Error message displayed via alert
- **State**: Form data preserved (except on success)

#### File Type Loading Failure
- **Action**: Review alert, retry loading the mapping table once connectivity is restored
- **Guidance**: Error banner explains that file type categories could not be retrieved
- **State**: Type hints hidden until the mapping table loads successfully

---

## User Experience

### User Journey

```
1. App Load
  ├─► Shows form and begins loading AssetFileAndLinkTypes mapping table
  └─► File type hints appear after the mapping table loads (if the call fails, an alert advises the user to retry)
   
2. Data Entry
   ├─► User enters asset ID
   ├─► User fills one file with all fields
   ├─► (Optional) User clicks "Add another file"
   │   └─► New file group appears
   └─► User fills additional files
   
3. Submission
   ├─► User clicks "Submit files"
   ├─► Progress bar appears
   ├─► Submit button disabled
   └─► Form becomes read-only
   
4. Response
   ├─► Success:
   │   ├─► Green success banner
   │   ├─► Success message in form
   │   ├─► Files cleared (asset ID kept)
   │   └─► Ready for next batch
   │
   └─► Error:
       ├─► Red error banner
       ├─► Error message in form
       ├─► Form data preserved
       └─► User can correct and retry
```

### UX Best Practices Implemented

1. **Progressive Enhancement**
  - Form works even if the mapping table fails to load
  - Clear guidance prompts users to retry when file type hints are unavailable

2. **Immediate Feedback**
   - Validation errors shown on blur/submit
   - Loading states clearly indicated
   - Success/error messages prominent

3. **Error Recovery**
   - Form data preserved on error
   - Clear error messages with guidance
   - Easy to correct and retry

4. **Efficiency**
   - Asset ID retained after submission
   - Multiple files in one operation
   - Quick "add another file" action

5. **Accessibility**
   - Material Design components (ARIA support)
   - Keyboard navigation
   - Screen reader friendly

---

## Configuration

### Application Manifest

**File**: `manifest.json`

**Purpose**: Defines the Cloud App for Esploro

```json
{
  "id": "esploro-csv-asset-loader",
  "title": "CSV Asset Loader",
  "subtitle": "Cloud app to update research asset data fields in Esploro",
  "author": "Exlibris",
  "description": "This cloud app can be used to create and update research assets in Esploro with data provided by uploading a CSV file. This is a Beta version.",
  "pages": {
    "settings": "/#/settings",
    "help": "https://knowledge.exlibrisgroup.com/Esploro/Product_Documentation/Esploro_Online_Help_(English)/Working_with_the_Esploro_Research_Hub/040_Working_with_Assets"
  },
  "contentSecurity": {
    "sandbox": {
      "modals": true,
      "downloads": true
    }
  },
  "icon": {
    "type": "url",
  "value": "/assets/assetFileLoader.png"
  },
  "fullscreen": {
    "allow": true,
    "open": false
  }
}
```

**Note**: The manifest references "CSV" and "create and update", which are legacy descriptions. The current app only attaches files, not CSV-based bulk operations.

### Settings Configuration

**File**: `settings.json`

**Purpose**: Template for app settings (currently minimal usage)

**Current Usage**: The settings component exists but is not actively used in the file upload workflow.

### Mapping Table Configuration

**Mapping Table**: `AssetFileAndLinkTypes`

**Location**: Esploro Configuration → Repository → Asset Details → File and Link Types

**Example Rows**:
- ID `62` – `Supplementary material` (applicability: both; asset types: publication, patent)
- ID `63` – `Accepted version` (applicability: file; asset types: publication)
- ID `64` – `Published version` (applicability: file; asset types: publication)

**Customization**: Administrators can add or adjust mapping table rows in Esploro, which automatically flow into the app for manual entry and CSV type validation.

---

## Deployment

### Development Deployment

```bash
# Install dependencies
npm install

# Start development server
npm start

# App available at http://localhost:4200
```

**Loading in Esploro**:
1. Open Esploro
2. Enable Cloud Apps Developer Mode
3. Add app from `http://localhost:4200`

### Production Deployment

**Build** (if build scripts configured):
```bash
npm run build
```

**Package**:
1. Include `manifest.json`
2. Include compiled Angular app
3. Include assets (icons, images)

**Deploy**:
1. Upload to Ex Libris Developer Network, or
2. Deploy to institution's Cloud Apps repository

**Permissions Required**:
- View research assets
- Modify research assets

### Deployment Checklist

- [ ] Update `manifest.json` with correct URLs
- [ ] Update `package.json` version
- [ ] Test in development environment
- [ ] Build for production
- [ ] Package app files
- [ ] Upload to deployment target
- [ ] Test in Esploro production
- [ ] Verify permissions
- [ ] Document for users

---

## Testing Approach

### Manual Testing

**Test Scenarios**:

1. **Single File Upload**
   - Enter valid asset ID
   - Fill one file with all fields
   - Submit
   - Expected: Success message, file queued

2. **Multiple Files Upload**
   - Enter valid asset ID
   - Add 3 file groups
   - Fill all with valid data
   - Submit
   - Expected: Success message, all files queued

3. **Invalid Asset ID**
   - Enter non-existent asset ID
   - Fill file data
   - Submit
   - Expected: Error message "Asset not found"

4. **Invalid URL Format**
   - Enter valid asset ID
   - Enter URL without http:// prefix
   - Submit
   - Expected: Validation error "Enter a valid http(s) URL"

5. **Missing Required Fields**
   - Leave title blank
   - Submit
   - Expected: Validation error "File name is required"

6. **File Types Loading**
   - Open app
   - Observe file type dropdown
  - Expected: Types loaded from mapping table; if the call fails, the alert banner advises the user and type hints stay hidden

7. **Form Reset After Success**
   - Submit files successfully
   - Observe form state
   - Expected: Files cleared, asset ID retained

### Unit Testing (If Implemented)

**Component Tests**:
```typescript
describe('MainComponent', () => {
  it('should create file group with all fields', () => {
    const group = component.createFileGroup();
    expect(group.get('title')).toBeTruthy();
    expect(group.get('url')).toBeTruthy();
    // ... etc
  });

  it('should validate URL format', () => {
    const urlControl = component.form.get('files.0.url');
    urlControl.setValue('invalid-url');
    expect(urlControl.hasError('pattern')).toBe(true);
  });
});
```

**Service Tests**:
```typescript
describe('AssetService', () => {
  it('should transform AssetFileLink to API format', () => {
    // Test payload transformation
  });

  it('should handle file type API errors gracefully', () => {
    // Test error handling
  });
});
```

---

## Future Enhancements

### Proposed Enhancement: Automated Job Submission

**See**: `documentation/JOB_SUBMISSION_ENHANCEMENT.md`

**Summary**: Automate the creation of itemized sets and submission of "Load files" jobs, eliminating manual steps.

**Benefits**:
- Reduced user effort (7 steps → 1 step)
- Faster workflow
- Automatic job monitoring
- Better user experience

**Challenges**:
- Requires additional permissions (Configuration API)
- Complexity in job parameter management
- Polling for job status

**Implementation Phases**:
1. Set creation
2. Job submission
3. Job monitoring
4. Enhanced UX

### Other Potential Enhancements

1. **Batch Asset Processing**
   - Upload CSV with asset IDs and file URLs
   - Process multiple assets at once
   - Requires CSV parsing library

2. **File URL Validation**
   - Pre-check URLs before submission
   - Warn if URL is inaccessible
   - Requires backend proxy or CORS handling

3. **Job History**
   - Track previous submissions
   - Re-submit failed operations
   - Requires local storage or backend

4. **Advanced Permissions Handling**
   - Check user permissions before showing form
   - Disable features based on roles
   - Better error messages

5. **Internationalization**
   - Multi-language support
   - Already has i18n infrastructure
   - Needs translations

---

## Developer Onboarding

### Getting Started (Quick)

1. **Clone repository**
   ```bash
   git clone https://github.com/Testing-Environment/esploro-csv-researcher-loader.git
   cd esploro-csv-researcher-loader
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Open in Esploro**
   - Enable Developer Mode in Cloud Apps
   - Add app from `http://localhost:4200`

### Key Files to Understand

**Must Read**:
1. `cloudapp/src/app/main/main.component.ts` - Main logic
2. `cloudapp/src/app/services/asset.service.ts` - API integration
3. `cloudapp/src/app/models/asset.ts` - Data models
4. `README.md` - User documentation

**Helpful**:
5. `documentation/DEVELOPER_QUICK_REFERENCE.md` - Developer guide
6. `documentation/VISUAL_DIAGRAMS.md` - Architecture diagrams
7. `documentation/JOB_SUBMISSION_ENHANCEMENT.md` - Future features

### Common Development Tasks

**Add a new form field**:
1. Update `createFileGroup()` in `main.component.ts`
2. Add FormControl with validators
3. Update template with mat-form-field
4. Update `buildFilePayload()` to include field
5. Update `AssetFileLink` interface if needed

**Change API endpoint**:
1. Update URL in `asset.service.ts`
2. Update payload transformation if needed
3. Test with Esploro API documentation

**Add new file type**:
1. Configure in Esploro (Configuration → Repository → Asset Details → File and Link Types mapping table)
2. App automatically picks it up via `getAssetFilesAndLinkTypes()`

**Debug API calls**:
1. Check browser Network tab
2. Review request/response
3. Check Esploro API logs
4. Verify authentication headers

### Coding Standards

- **TypeScript**: Strict typing, avoid `any`
- **Components**: Single responsibility
- **Services**: Centralized API calls
- **Forms**: Reactive forms pattern
- **Observables**: Always unsubscribe or use `finalize()`
- **Error Handling**: User-friendly messages

### Helpful Resources

- [Angular Documentation](https://angular.io/docs)
- [Angular Material](https://material.angular.io/)
- [RxJS Documentation](https://rxjs.dev/)
- [Esploro API Docs](https://developers.exlibrisgroup.com/alma/apis/)
- [Cloud Apps Framework](https://developers.exlibrisgroup.com/cloudapps/)

---

## Appendix

### Glossary

- **Asset**: Research output in Esploro (article, dataset, etc.)
- **Cloud App**: Angular application running in Esploro UI
- **Code Table**: Configuration table in Esploro (e.g., file types)
- **FormArray**: Angular form control for dynamic lists
- **FormGroup**: Angular form control for grouped fields
- **Observable**: RxJS async data stream
- **Reactive Forms**: Angular form management approach
- **temporary.linksToExtract**: Esploro API field for queued file downloads

### Acronyms

- **API**: Application Programming Interface
- **CSV**: Comma-Separated Values
- **HTTP**: Hypertext Transfer Protocol
- **HTTPS**: HTTP Secure
- **RxJS**: Reactive Extensions for JavaScript
- **SDK**: Software Development Kit
- **UI**: User Interface
- **URL**: Uniform Resource Locator

### File Reference

| File | Purpose | Lines | Complexity |
|------|---------|-------|------------|
| `main.component.ts` | Main UI logic | ~143 | Medium |
| `asset.service.ts` | API integration | ~74 | Low |
| `main.component.html` | UI template | ~82 | Low |
| `asset.ts` | Data models | ~7 | Low |
| `manifest.json` | App config | ~25 | Low |

### Version History

- **Current Version**: File uploader for assets
- **Previous Version**: CSV-based researcher loader (removed)
- **Repository Name**: `esploro-csv-researcher-loader` (legacy name)

---

## Conclusion

The Esploro Asset File Loader is a focused, well-architected Angular application that solves a specific problem: efficiently attaching external files to research assets. Its clean separation of concerns, robust error handling, and user-friendly interface make it a valuable tool for Esploro administrators and researchers.

While it has evolved from a more complex CSV-based researcher loader, the current implementation prioritizes simplicity and reliability. Future enhancements, particularly automated job submission, could further streamline the workflow.

For developers new to this codebase, start with the `MainComponent` and `AssetService` to understand the core functionality, then explore the comprehensive documentation in the `documentation/` folder for deeper architectural insights.

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Maintained By**: Development Team  
**Related Docs**: See `documentation/` folder for additional resources
