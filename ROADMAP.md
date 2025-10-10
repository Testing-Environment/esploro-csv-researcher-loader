# Project Roadmap

**Last Updated**: January 2025
**Current Version**: 1.0.0

## Vision

Transform the Esploro Asset File Loader from a basic file queuing tool into a **fully automated asset management system** that streamlines the entire workflow from file specification to final ingestion, with minimal manual intervention.

### Long-term Goals
- **Full End-to-End Automation**: Automatically create sets, run jobs, and verify results
- **Enhanced User Experience**: Multi-row interfaces, intelligent validation, comprehensive feedback
- **Robust Data Handling**: Support for complex CSV formats, fuzzy matching, and error recovery
- **Production-Ready Quality**: Comprehensive testing, documentation, and maintainability

---

## Completed Features ✅

### Phase 1: CSV Input Enhancement (January 2025)
**Status**: ✅ **COMPLETED**

- ✅ Flexible CSV column mapping with intelligent suggestions
- ✅ Required field validation (mmsId, remoteUrl)
- ✅ Optional field support (fileTitle, fileDescription, fileType)
- ✅ Row-level validation with detailed error reporting
- ✅ Before/after asset state comparison
- ✅ RFC 4180 compliant CSV parsing (PapaParse integration)

**Deliverables**:
- CSV upload workflow with column mapper UI
- Validation that blocks progression for missing required fields
- Downloadable results with success/error/unchanged status

---

### Phase 2: File Type Fuzzy Matching (January 2025)
**Status**: ✅ **COMPLETED**

- ✅ Automatic conversion of file type names to IDs
- ✅ Exact match detection (confidence: 1.0)
- ✅ Fuzzy matching via target codes (confidence: 0.7-0.95)
- ✅ Manual mapping UI for unresolved types
- ✅ Conversion review screen before processing

**Deliverables**:
- File type matching algorithm with confidence scoring
- User-friendly manual resolution dialog
- Integration with Esploro's AssetFileAndLinkTypes mapping table

---

### Technical Foundation (January 2025)
**Status**: ✅ **COMPLETED**

- ✅ RxJS 6 compatibility with firstValueFrom/lastValueFrom polyfills
- ✅ Elimination of deprecated toPromise() usage
- ✅ Shared rxjs-helpers utility module
- ✅ TypeScript strict mode compliance
- ✅ Comprehensive documentation (50+ pages)

---

## In Progress 🚧

### Current Sprint: Documentation Restructuring
**Started**: January 2025
**Target Completion**: January 2025

- 🚧 Create project roadmap (this document)
- 🚧 Establish changelog tracking
- 🚧 Define current requirements
- 🚧 Set up progress logging system
- 🚧 Archive conversation history

---

## Planned Features 📋

### Phase 3: Job Automation (HIGH PRIORITY)
**Target**: Q1 2025
**Effort Estimate**: 3-4 weeks

Implement fully automated workflow to eliminate manual set creation and job execution steps.

#### Core Requirements
- ✅ Already Implemented: Asset validation via `getAsset()`
- 📋 **Implement**: Create set via `POST /conf/sets`
- 📋 **Implement**: Add members to set via `POST /conf/sets/{setId}/members`
- 📋 **Implement**: Find job ID (try hardcoded M50762, fallback to search)
- 📋 **Implement**: Run job via `POST /conf/jobs/{jobId}/instances`
- 📋 **Implement**: Poll job status via `GET /conf/jobs/{jobId}/instances/{instanceId}`
- 📋 **Implement**: Verify results by comparing before/after asset states

#### API Methods to Add
```typescript
// In asset.service.ts or new job.service.ts
createSet(payload: SetPayload): Observable<SetResponse>
updateSetMembers(setId: string, memberIds: string[]): Observable<MemberResponse>
getJobDetails(jobId: string): Observable<JobDetails>
findJobByName(jobName: string): Observable<string> // Returns job ID
runJob(jobId: string, setId: string): Observable<JobInstanceResponse>
getJobInstance(jobId: string, instanceId: string): Observable<JobStatus>
```

#### Workflow Steps
1. Validate all assets (existing)
2. **Queue files to assets** (existing - `addFilesToAsset()`)
3. **Create temporary set** (new)
4. **Add validated assets to set** (new)
5. **Find "Import Research Assets Files" job** (new)
6. **Submit job for the set** (new)
7. **Poll until job completes** (new)
8. **Parse job counters and verify** (new)
9. **Display comprehensive results** (enhance existing)

#### Success Criteria
- User clicks "Submit" → files are fully ingested without manual intervention
- Job progress displayed in real-time (polling with progress bar)
- Final report shows: files uploaded, assets succeeded, assets failed
- Error handling at each API step with user-friendly messages

**Dependencies**:
- Esploro API documentation for `/conf/sets` and `/conf/jobs` endpoints
- Testing environment with appropriate permissions
- Example API responses for all new endpoints

---

### Phase 4: Manual Entry UI Refactoring (MEDIUM PRIORITY)
**Target**: Q2 2025
**Effort Estimate**: 2 weeks

Overhaul the manual entry workflow to match the sophistication of the CSV workflow.

#### Planned Improvements
- 📋 **Multi-row dynamic interface** (currently: FormArray-based, enhance UX)
  - Initially display one row
  - "Add another file" button to add rows
  - "Delete" button on each row
  - Better visual separation between rows

- 📋 **Enhanced Stage 1 Validation**
  - Validate on blur (not just on submit)
  - Inline error messages per field
  - Visual indicators for valid/invalid rows

- 📋 **Improved Stage 2 (File Type Selection)**
  - Pre-filter file types by asset type (already implemented, enhance UI)
  - Show asset title alongside asset ID
  - Bulk actions: "Apply type to all" option

- 📋 **CSV Template Download**
  - Add "Download Template CSV" button to CSV tab
  - Generate CSV with proper headers and example rows
  - Include inline comments/guidance

#### UI/UX Enhancements
- Drag-and-drop row reordering
- Copy/paste from clipboard (parse tab-separated values)
- Keyboard shortcuts (Enter to add row, Esc to cancel)
- Save draft functionality (localStorage)

---

### Phase 5: Testing & Quality Assurance (HIGH PRIORITY)
**Target**: Q2 2025
**Effort Estimate**: 2-3 weeks

**Current Status**: ⚠️ 0% test coverage (Karma/Jasmine configured but no tests)

#### Test Coverage Goals
- Unit tests for critical methods (target: 80% coverage)
  - File type matching algorithm
  - API payload construction
  - CSV parsing and validation
  - Column mapping suggestions

- Integration tests
  - API service calls with mocked responses
  - Asset validation flow
  - Before/after state comparison

- E2E tests (migrate from Protractor → Cypress/Playwright)
  - Manual entry workflow (Stage 1 → Stage 2 → Submit)
  - CSV upload workflow (Upload → Map → Process → Results)
  - Error scenarios and recovery

#### Quality Improvements
- Set up CI/CD pipeline (GitHub Actions)
- Add ESLint with strict rules
- Implement Prettier for code formatting
- Add pre-commit hooks (lint + format)
- Accessibility audit (WCAG 2.1 AA compliance)

---

### Phase 6: Performance Optimization (MEDIUM PRIORITY)
**Target**: Q3 2025
**Effort Estimate**: 1 week

#### Current Bottlenecks
- Sequential CSV processing (100 assets × 100ms delay = 10s overhead)
- No caching of file type mappings
- Large CSV files block UI thread

#### Planned Optimizations
- 📋 **Parallel batch processing**
  - Semaphore pattern (max 5 concurrent requests)
  - Adaptive delay based on API response times
  - Progress tracking for parallel operations

- 📋 **Web Worker for CSV parsing**
  - Already supported by PapaParse, needs configuration
  - Offload parsing to background thread
  - Stream processing for very large files (10k+ rows)

- 📋 **Caching improvements**
  - Cache file type mappings in localStorage (refresh daily)
  - Cache asset metadata during session
  - Implement stale-while-revalidate pattern

- 📋 **Virtual scrolling**
  - For CSV preview (displaying 1000+ rows)
  - For results table (displaying 500+ processed assets)
  - Use Angular CDK Virtual Scroll

**Performance Targets**:
- 500 row CSV: < 30 seconds total processing time
- CSV parsing: < 2 seconds for 10k rows
- UI remains responsive during all operations

---

## Future Enhancements 💡

### Nice-to-Have Features (LOWER PRIORITY)

#### Internationalization (i18n)
- Currently: English only (i18n framework in place)
- Add: Spanish, French, Hebrew translations
- Effort: 1 week per language

#### Advanced CSV Features
- Multi-file upload (batch multiple CSVs)
- Excel file support (.xlsx parsing)
- CSV validation before upload (client-side schema check)
- Column auto-detection improvements (ML-based?)

#### User Experience
- Dark mode support
- Customizable column mappings (save presets)
- Undo/redo functionality
- Export processing log as PDF report

#### Admin Features
- Usage analytics dashboard
- Rate limiting configuration
- Batch size limits (configurable)
- Audit log export

#### Integration Enhancements
- Webhook notifications on job completion
- Integration with institutional repository systems
- ORCID integration for researcher validation
- DOI lookup and auto-fill metadata

---

## Technical Debt & Maintenance

### Code Refactoring Needs
- 🔴 **csv-processor.component.ts** (910 lines)
  - Split into smaller services
  - Extract file type conversion to dedicated service
  - Extract column mapping to dedicated component

- 🟡 **main.component.ts** (584 lines)
  - Extract stage management to state service
  - Simplify FormArray manipulation logic

### Documentation Gaps to Address
- API endpoint documentation (create OpenAPI spec)
- Inline JSDoc comments for complex methods
- Architecture Decision Records (ADRs)
- Troubleshooting guide for common errors
- Deployment guide (build + Ex Libris Cloud Apps platform)

### Dependency Updates
- Monitor Angular 12+ compatibility (when Ex Libris SDK updates)
- RxJS 7 migration (when Angular updates)
- Security patches for all dependencies

---

## Release Planning

### Version 1.1.0 (Q1 2025)
- Job automation (Phase 3)
- Manual entry UI improvements (Phase 4)
- Basic test coverage (Phase 5 - initial)

### Version 1.2.0 (Q2 2025)
- Comprehensive testing (Phase 5 - complete)
- Performance optimizations (Phase 6)
- CSV template download

### Version 2.0.0 (Q3 2025)
- Full end-to-end automation
- Advanced features (virtual scrolling, caching)
- Internationalization support
- Production-ready quality

---

## Success Metrics

### User Experience
- Time to process 100 assets: < 2 minutes (currently: ~3-4 minutes)
- User clicks required: < 5 for CSV workflow (currently: ~8-10)
- Error resolution time: < 30 seconds with clear guidance

### Technical Quality
- Test coverage: > 80% (currently: 0%)
- Build time: < 60 seconds (currently: ~45 seconds)
- Bundle size: < 500KB gzipped (currently: ~420KB)
- Zero critical security vulnerabilities

### Reliability
- API error rate: < 1% (with retry logic)
- Job success rate: > 95% (for valid input)
- Uptime: 99.9% (dependent on Esploro availability)

---

## Contributing to the Roadmap

This roadmap is a living document. To suggest new features or reprioritize items:

1. Review [REQUIREMENTS.md](REQUIREMENTS.md) for current functional requirements
2. Check [documentation/archive/CONVERSATION_HISTORY.md](documentation/archive/CONVERSATION_HISTORY.md) for historical context
3. Review [CHANGELOG.md](CHANGELOG.md) to see what's been completed
4. Update this roadmap with your proposals (clearly marked as 💡 **Proposed**)
5. Discuss in team meetings or GitHub issues

---

**Roadmap maintained by**: Project team and AI development assistants
**Review frequency**: Monthly
**Next review**: February 2025
