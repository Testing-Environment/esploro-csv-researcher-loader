# Changelog

All notable changes to the Esploro Asset File Loader will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Phase 3.5: Result Verification - Comprehensive File Attachment Validation**
  - `verifyAssetFiles()` API method in AssetService for detailed file attachment verification
  - Pre-import asset state caching with `CachedAssetState` interface
  - Post-import asset comparison with before/after file counts
  - Intelligent file matching: exact URL match, pre-existing file detection, filename-based partial matching
  - Verification result interfaces (`FileVerificationResult`, `AssetVerificationResult`, `BatchVerificationSummary`)
  - Batch verification summary with success rates, warnings, and recommendations
  - Parallel verification execution using RxJS `forkJoin` for optimal performance
  - User-friendly verification notifications (success/warning/error based on success rate thresholds)
  - Downloadable CSV verification reports with detailed file-level results
  - Automatic verification trigger after successful job completion
  - Verification state management in both CSV and manual entry workflows
  - Asset state caching methods (`cacheAssetStates()`) before job submission
  - Comprehensive verification status tracking: `verified_success`, `verified_partial`, `verified_failed`, `unchanged`, `error`
  - Detailed file verification with `matchType` indicators: `exact`, `partial`, `none`
  - Warning system for verification issues (missing files, partial matches, unchanged assets)
  - Recommendation engine for post-verification actions

- **Phase 3.4: Job Status Polling - Real-time Job Monitoring**
  - `getJobInstance()` API method in AssetService for job status monitoring
  - Real-time job status polling with 5-second intervals
  - Job progress tracking (0-100%)
  - Automatic polling termination on job completion
  - TypeScript interfaces for Job Instance API (`JobInstanceCounter`, `JobInstanceAlert`, `JobInstanceStatus`)
  - Job completion notifications with detailed counters (assets succeeded/failed, files uploaded/failed)
  - 5-minute polling timeout with user notification
  - Terminal state detection (COMPLETED_SUCCESS, COMPLETED_FAILED, CANCELLED)
  - Automatic cleanup of polling subscriptions on component destroy
  - Polling infrastructure in both CSV and manual entry workflows

- **Phase 3.1, 3.2 & 3.3: Job Automation - Complete Workflow Automation**
  - `createSet()` API method in AssetService for automated set creation
  - `generateSetName()` helper method for unique timestamped set names (format: `CloudApp-FilesLoaderSet-YYYY-MM-DD-HH-MM-SS`)
  - `updateSetMembers()` API method in AssetService for adding assets to sets
  - `runJob()` API method in AssetService for submitting import jobs (default job ID: M50762)
  - Automatic set creation after successful file processing in CSV workflow
  - Automatic set creation after successful file processing in manual entry workflow
  - Automatic member addition to created sets with all successful assets
  - Automatic job submission to process queued files (eliminates all manual steps)
  - TypeScript interfaces for Set API (`SetPayload`, `SetResponse`, `SetMember`, `AddSetMembersPayload`, `AddSetMembersResponse`)
  - TypeScript interfaces for Job API (`JobParameter`, `RunJobPayload`, `JobExecutionResponse`)
  - User notification with set ID, member count, and job instance ID upon successful automation
  - Error handling for set creation, member addition, and job submission failures (non-blocking - allows manual fallback)
  - `fail_on_invalid_id=false` parameter for resilient member addition (continues adding valid IDs even if some are invalid)
  - Configurable job ID parameter (defaults to M50762, can be customized per institution)

### Changed
- Restructured project documentation for better organization
- Renamed `explaination.md` → `explanation.md` (fixed typo)
- Moved conversation history to `documentation/archive/CONVERSATION_HISTORY.md`
- CSV processor now creates sets automatically after successful processing
- Manual entry workflow now creates sets automatically after successful submission
- Job completion handling updated to async pattern to support verification
- Enhanced `ProcessedAsset` interface with `verificationResult` property
- `resetFlow()` methods updated to clear verification state variables

---

## [1.0.0] - 2025-01-10

### Added

#### Phase 2: File Type Fuzzy Matching
- Intelligent file type name-to-ID conversion with confidence scoring
- Exact match detection for file type IDs (confidence: 1.0)
- Exact match detection for target codes (confidence: 0.95)
- Partial match detection via fuzzy matching (confidence: 0.7)
- Manual mapping UI for unresolved file types
- File type conversion review screen before processing
- Support for both ID values and human-readable names in CSV

#### Phase 1: CSV Input Enhancement
- Flexible CSV column mapping with intelligent suggestions
- Mandatory field validation (mmsId, remoteUrl)
- Optional field support (fileTitle, fileDescription, fileType)
- Row-level validation with detailed error reporting
- Missing value detection with row number reporting
- Before/after asset state comparison to detect unchanged assets
- Downloadable MMS ID list for successful assets
- Processing results display with status breakdown (success/error/unchanged)

#### Technical Improvements
- RxJS 6 compatibility polyfills (`firstValueFrom`, `lastValueFrom`)
- Eliminated all deprecated `toPromise()` usage (80+ instances)
- Shared `rxjs-helpers` utility module at `cloudapp/src/app/utilities/rxjs-helpers.ts`
- PapaParse integration for RFC 4180 compliant CSV parsing
- Robust handling of multi-line quoted values, embedded commas, CRLF edge cases
- TypeScript strict mode compliance throughout codebase

#### Documentation
- Comprehensive technical documentation ([explanation.md](explanation.md)) - 50+ pages
- Developer quick reference guide
- Visual architecture diagrams (10+ Mermaid diagrams)
- API usage documentation
- CSV enhancement implementation guide
- File type implementation summary
- RxJS migration guide

### Fixed
- CSV parsing failures on quoted fields with commas
- CSV parsing failures on multi-line field values
- RxJS deprecation warnings from `toPromise()` usage
- Duplicate helper function implementations across components
- File type dropdown not filtering by asset type correctly

### Changed
- Refactored CSV processor to use PapaParse instead of custom parser
- Consolidated RxJS helper functions into shared utility
- Improved error messages for CSV validation failures
- Enhanced column mapping UI with better visual feedback
- Updated API payload construction for file attachments

---

## [0.9.0] - 2025-01-05

### Added
- Basic CSV upload functionality
- Manual entry workflow with 3-stage progression
  - Stage 1: Asset ID and file URL entry
  - Stage 2: File type selection (optional)
  - Stage 3: Review and confirm
- Asset validation via Esploro API
- File type filtering by asset type
- Multi-file entry support (FormArray-based)
- Processing results component

### Initial Features
- Ex Libris Cloud Apps SDK integration (v1.4.7)
- Angular 11.2.14 framework
- Angular Material UI components
- AssetService for Esploro API interactions
  - `getAssetMetadata()` - Fetch asset details
  - `addFilesToAsset()` - Queue files for ingestion
  - `getAssetFilesAndLinkTypes()` - Fetch valid file types
- Internationalization support (i18n framework)
- Alert system for user feedback

---

## [0.8.0] - 2024-12-20

### Added
- Initial project setup
- Basic Angular application structure
- Ex Libris Cloud Apps framework integration
- Manual entry form (single-row version)
- Asset ID validation
- File URL validation
- Basic error handling

### Technical
- Angular 11.2.14 setup
- TypeScript 4.1.5 configuration
- Angular Material 11.2.12 integration
- RxJS 6.5.5 for reactive programming
- Karma/Jasmine testing framework setup (not yet utilized)

---

## Version History Summary

| Version | Date       | Highlights |
|---------|------------|------------|
| 1.0.0   | 2025-01-10 | CSV enhancement + file type fuzzy matching + RxJS migration |
| 0.9.0   | 2025-01-05 | CSV upload + 3-stage manual workflow + comprehensive docs |
| 0.8.0   | 2024-12-20 | Initial release with basic manual entry |

---

## Upgrade Guide

### Upgrading to 1.0.0

#### For Users
- **New CSV Requirements**: Only `mmsId` and `remoteUrl` are mandatory; all other columns are optional
- **File Type Names**: You can now use human-readable names (e.g., "Dataset") instead of IDs (e.g., "DATA")
- **Enhanced Feedback**: Processing results now show "unchanged" status for assets where no files were added

#### For Developers
- **Breaking Changes**:
  - Custom CSV parser removed; now uses PapaParse
  - `toPromise()` completely removed; use `firstValueFrom`/`lastValueFrom` from `rxjs-helpers`
  - RxJS helper functions moved to shared utility (`utilities/rxjs-helpers.ts`)

- **Migration Steps**:
  1. Update imports:
     ```typescript
     // Old
     import { Observable } from 'rxjs';
     const result = await observable.toPromise();

     // New
     import { firstValueFrom } from '../utilities/rxjs-helpers';
     const result = await firstValueFrom(observable);
     ```

  2. If you created custom CSV parsing, remove it and use PapaParse:
     ```typescript
     import Papa from 'papaparse';

     Papa.parse(file, {
       header: true,
       skipEmptyLines: true,
       complete: (results) => { /* handle results */ }
     });
     ```

  3. Update file type handling to support both IDs and names
     - Use `matchFileTypeByTargetCode()` for fuzzy matching
     - Implement manual resolution UI for unmatched types

---

## Planned for Future Releases

See [ROADMAP.md](ROADMAP.md) for detailed future plans.

### Version 1.1.0 (Planned Q1 2025)
- Full job automation (create set + run job)
- Enhanced manual entry UI (multi-row improvements)
- CSV template download button
- Basic test coverage (unit tests for critical methods)

### Version 1.2.0 (Planned Q2 2025)
- Comprehensive test suite (80%+ coverage)
- Performance optimizations (parallel processing)
- CI/CD pipeline setup
- Accessibility improvements

### Version 2.0.0 (Planned Q3 2025)
- Complete end-to-end automation
- Web Worker for CSV parsing
- Virtual scrolling for large datasets
- Internationalization (multiple languages)

---

## Contributing

When adding entries to this changelog:

1. **Unreleased section**: Add all changes here during development
2. **Version release**: Move items from Unreleased to new version section
3. **Categories**: Use standard categories (Added, Changed, Deprecated, Removed, Fixed, Security)
4. **Format**: Write for end users, not developers (unless in technical section)
5. **Links**: Reference documentation files for detailed information

---

## Support

For questions about specific changes:
- Check [explanation.md](explanation.md) for technical details
- Review [ROADMAP.md](ROADMAP.md) for future plans
- See [README.md](README.md) for user documentation
- Consult [documentation/INDEX.md](documentation/INDEX.md) for all documentation

---

**Changelog maintained by**: Project team and development assistants
**Last updated**: January 10, 2025
