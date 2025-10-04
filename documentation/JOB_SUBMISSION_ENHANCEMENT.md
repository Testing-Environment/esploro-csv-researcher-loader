# Job Submission Enhancement Documentation

## Overview
This document explores potential enhancements to the Esploro Asset File Loader application by integrating automated job submission capabilities. Currently, users must manually run the "Load files" job in Esploro after queuing files through the API. This enhancement would streamline the workflow by automating job creation and submission.

## Current Workflow vs. Enhanced Workflow

### Current Workflow (Manual)
```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User enters Asset ID and file details in Cloud App          │
│ 2. App calls POST /esploro/v1/assets/{id}?op=patch&action=add │
│ 3. Files queued in temporary.linksToExtract                    │
│ 4. User manually creates itemized set in Esploro UI            │
│ 5. User manually runs "Load files" job on the set              │
│ 6. Job processes queued files and attaches them to assets      │
└─────────────────────────────────────────────────────────────────┘
```

### Proposed Enhanced Workflow (Automated)
```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User enters Asset ID and file details in Cloud App          │
│ 2. App calls POST /esploro/v1/assets/{id}?op=patch&action=add │
│ 3. Files queued in temporary.linksToExtract                    │
│ 4. ✨ App creates itemized set via Configuration API           │
│ 5. ✨ App submits "Load files" job via Configuration API       │
│ 6. Job processes queued files automatically                    │
│ 7. ✨ App monitors job status and reports completion           │
└─────────────────────────────────────────────────────────────────┘
```

## Technical Implementation

### Required APIs

#### 1. Configuration API for Set Creation
**Endpoint**: `POST /conf/sets`
**Documentation**: https://developers.exlibrisgroup.com/alma/apis/conf/

**Purpose**: Create an itemized set containing the modified asset

**Request Example**:
```json
{
  "name": "Asset File Load - {timestamp}",
  "type": {
    "value": "ITEMIZED",
    "desc": "Itemized"
  },
  "content": {
    "value": "ASSET",
    "desc": "Research Asset"
  },
  "private": {
    "value": "false"
  },
  "members": {
    "member": [
      {
        "link": "/esploro/v1/assets/{assetId}"
      }
    ]
  }
}
```

#### 2. Configuration API for Job Submission
**Endpoint**: `POST /conf/jobs`
**Documentation**: https://developers.exlibrisgroup.com/alma/apis/conf/

**Purpose**: Submit the "Load files" job for the created set

**Job Types for Esploro Assets**:
- `LOAD_FILES` - Load files from temporary.linksToExtract
- `EXPORT_ASSETS` - Export assets from a set
- `DELETE_ASSETS` - Delete assets from a set

**Request Example**:
```json
{
  "name": "Load Files - {assetId}",
  "type": {
    "value": "LOAD_FILES",
    "desc": "Load Files"
  },
  "schedule": {
    "value": "MANUAL"
  },
  "parameters": {
    "parameter": [
      {
        "name": {
          "value": "set_id",
          "desc": "Set ID"
        },
        "value": "{setId}"
      },
      {
        "name": {
          "value": "operation_type",
          "desc": "Operation Type"
        },
        "value": "LOAD_FILES"
      }
    ]
  }
}
```

#### 3. Configuration API for Job Monitoring
**Endpoint**: `GET /conf/jobs/{jobId}`

**Purpose**: Monitor job status and retrieve results

**Response Fields**:
- `status`: `QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`, `PARTIALLY_COMPLETED`
- `start_time`: Job start timestamp
- `end_time`: Job completion timestamp
- `progress`: Current progress percentage
- `counters`: Success/failure counts

### Service Layer Enhancement

#### Enhanced AssetService
```typescript
// filepath: cloudapp/src/app/services/asset.service.ts

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  constructor(private restService: CloudAppRestService) { }

  // Existing method
  addFilesToAsset(assetId: string, files: AssetFileLink[]): Observable<any> {
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

  // ✨ NEW: Create itemized set
  createItemizedSet(assetId: string, setName?: string): Observable<SetResponse> {
    const name = setName || `Asset File Load - ${new Date().toISOString()}`;
    
    const payload = {
      name,
      type: { value: 'ITEMIZED' },
      content: { value: 'ASSET' },
      private: { value: 'false' },
      members: {
        member: [
          { link: `/esploro/v1/assets/${assetId}` }
        ]
      }
    };

    return this.restService.call({
      url: '/conf/sets',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      requestBody: payload,
      method: HttpMethod.POST
    });
  }

  // ✨ NEW: Submit load files job
  submitLoadFilesJob(setId: string, jobName?: string): Observable<JobResponse> {
    const name = jobName || `Load Files - ${new Date().toISOString()}`;
    
    const payload = {
      name,
      type: { value: 'LOAD_FILES' },
      schedule: { value: 'MANUAL' },
      parameters: {
        parameter: [
          {
            name: { value: 'set_id' },
            value: setId
          },
          {
            name: { value: 'operation_type' },
            value: 'LOAD_FILES'
          }
        ]
      }
    };

    return this.restService.call({
      url: '/conf/jobs',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      requestBody: payload,
      method: HttpMethod.POST
    });
  }

  // ✨ NEW: Monitor job status
  getJobStatus(jobId: string): Observable<JobStatusResponse> {
    return this.restService.call({
      url: `/conf/jobs/${jobId}`,
      method: HttpMethod.GET
    });
  }

  // ✨ NEW: Enhanced workflow combining all steps
  addFilesAndProcessJob(
    assetId: string, 
    files: AssetFileLink[],
    autoProcess: boolean = false
  ): Observable<CompleteWorkflowResult> {
    return this.addFilesToAsset(assetId, files).pipe(
      switchMap(() => {
        if (!autoProcess) {
          return of({ 
            success: true, 
            message: 'Files queued successfully',
            filesQueued: true 
          });
        }
        // Create set
        return this.createItemizedSet(assetId).pipe(
          switchMap(setResponse => {
            // Submit job
            return this.submitLoadFilesJob(setResponse.id).pipe(
              map(jobResponse => ({
                success: true,
                message: 'Files queued and job submitted',
                filesQueued: true,
                setId: setResponse.id,
                jobId: jobResponse.id,
                jobStatus: 'QUEUED'
              }))
            );
          })
        );
      }),
      catchError(error => {
        return of({
          success: false,
          message: error.message || 'Failed to process files',
          error
        });
      })
    );
  }
}

// Type definitions
export interface SetResponse {
  id: string;
  name: string;
  type: { value: string };
  content: { value: string };
}

export interface JobResponse {
  id: string;
  name: string;
  type: { value: string };
  status: { value: string };
}

export interface JobStatusResponse {
  id: string;
  status: { value: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED' };
  progress?: number;
  counters?: {
    succeeded?: number;
    failed?: number;
    total?: number;
  };
}

export interface CompleteWorkflowResult {
  success: boolean;
  message: string;
  filesQueued?: boolean;
  setId?: string;
  jobId?: string;
  jobStatus?: string;
  error?: any;
}
```

### UI Component Enhancement

#### Enhanced MainComponent
```typescript
// filepath: cloudapp/src/app/main/main.component.ts

export class MainComponent implements OnInit {
  form: FormGroup;
  fileTypes: CodeTableEntry[] = [];
  loadingFileTypes = false;
  submitting = false;
  submissionResult: { type: 'success' | 'error'; message: string } | null = null;
  
  // ✨ NEW: Job processing options
  autoProcessJob = false;
  jobId: string | null = null;
  jobStatus: string | null = null;
  pollingSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private assetService: AssetService,
    private alert: AlertService
  ) {
    this.form = this.fb.group({
      assetId: ['', Validators.required],
      files: this.fb.array([this.createFileGroup()]),
      autoProcess: [false] // ✨ NEW: Auto-process option
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const assetId = this.form.get('assetId')?.value;
    const filesPayload: AssetFileLink[] = this.buildFilePayload();
    const autoProcess = this.form.get('autoProcess')?.value;

    this.submitting = true;
    this.submissionResult = null;

    // ✨ Enhanced: Use new workflow method
    this.assetService.addFilesAndProcessJob(assetId, filesPayload, autoProcess)
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.alert.success(result.message);
            this.submissionResult = { type: 'success', message: result.message };
            
            // ✨ NEW: Start polling if job was submitted
            if (result.jobId) {
              this.jobId = result.jobId;
              this.startJobPolling(result.jobId);
            }
            
            this.resetFiles();
          } else {
            this.alert.error(result.message);
            this.submissionResult = { type: 'error', message: result.message };
          }
        },
        error: (error: any) => {
          const message = error?.message || 'Failed to process request';
          this.alert.error(message);
          this.submissionResult = { type: 'error', message };
        }
      });
  }

  // ✨ NEW: Poll job status
  private startJobPolling(jobId: string): void {
    this.pollingSubscription = interval(5000) // Poll every 5 seconds
      .pipe(
        switchMap(() => this.assetService.getJobStatus(jobId)),
        takeWhile(status => {
          const isRunning = ['QUEUED', 'RUNNING'].includes(status.status.value);
          if (!isRunning) {
            this.handleJobCompletion(status);
          }
          return isRunning;
        }, true)
      )
      .subscribe(
        status => {
          this.jobStatus = status.status.value;
        },
        error => {
          this.alert.error('Failed to monitor job status');
          this.jobStatus = 'UNKNOWN';
        }
      );
  }

  // ✨ NEW: Handle job completion
  private handleJobCompletion(status: JobStatusResponse): void {
    this.jobStatus = status.status.value;
    
    if (status.status.value === 'COMPLETED') {
      const message = `Job completed successfully. ${status.counters?.succeeded || 0} files loaded.`;
      this.alert.success(message);
      this.submissionResult = { type: 'success', message };
    } else if (status.status.value === 'FAILED') {
      const message = `Job failed. Check Esploro job logs for details.`;
      this.alert.error(message);
      this.submissionResult = { type: 'error', message };
    } else if (status.status.value === 'PARTIALLY_COMPLETED') {
      const succeeded = status.counters?.succeeded || 0;
      const failed = status.counters?.failed || 0;
      const message = `Job completed with warnings. ${succeeded} succeeded, ${failed} failed.`;
      this.alert.warn(message);
      this.submissionResult = { type: 'error', message };
    }
  }

  ngOnDestroy(): void {
    // ✨ NEW: Clean up polling subscription
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }
}
```

#### Enhanced UI Template
```html
<!-- filepath: cloudapp/src/app/main/main.component.html -->

<form class="file-form" [formGroup]="form" (ngSubmit)="submit()">
  <h1>Add files to an Esploro asset</h1>

  <!-- Existing asset ID and file fields... -->

  <!-- ✨ NEW: Auto-process option -->
  <section class="auto-process-section">
    <mat-checkbox formControlName="autoProcess">
      Automatically create set and run "Load files" job
    </mat-checkbox>
    <p class="hint-text">
      When enabled, the app will create an itemized set and submit the Load Files job automatically.
      Otherwise, you'll need to manually create a set and run the job in Esploro.
    </p>
  </section>

  <div class="form-actions">
    <button mat-flat-button color="primary" type="submit" [disabled]="submitting">
      Submit files
    </button>
  </div>

  <mat-progress-bar *ngIf="submitting" mode="indeterminate"></mat-progress-bar>

  <!-- ✨ NEW: Job status display -->
  <div class="job-status" *ngIf="jobId">
    <h3>Job Status</h3>
    <p>Job ID: {{ jobId }}</p>
    <p>Status: {{ jobStatus }}</p>
    <mat-progress-bar 
      *ngIf="jobStatus === 'QUEUED' || jobStatus === 'RUNNING'" 
      mode="indeterminate">
    </mat-progress-bar>
  </div>

  <div class="submission-result" *ngIf="submissionResult" [ngClass]="submissionResult.type">
    {{ submissionResult.message }}
  </div>
</form>
```

## Permissions Required

### Current Permissions
- View research assets
- Modify research assets (for file attachment)

### Additional Permissions Required for Job Submission
- **Configuration - General - Sets**: Create and manage sets
- **Configuration - General - Jobs**: Submit and monitor jobs
- Specific job permissions: `LOAD_FILES` job execution rights

## Benefits

### For End Users
1. **Reduced manual steps**: No need to navigate to set creation and job submission
2. **Immediate feedback**: See job status directly in the Cloud App
3. **Error handling**: Automatic notifications if job fails
4. **Time savings**: Faster workflow for bulk file operations

### For Administrators
1. **Audit trail**: Automatic set and job naming with timestamps
2. **Consistency**: Standardized job submission process
3. **Monitoring**: Track job execution from within the app

## Potential Challenges

### 1. Permission Complexity
**Challenge**: Users need additional configuration permissions
**Mitigation**: 
- Make job submission optional (toggle in UI)
- Provide clear permission requirements in documentation
- Fall back gracefully if permissions are insufficient

### 2. Job Parameter Variability
**Challenge**: Load Files job may have institution-specific parameters
**Mitigation**:
- Allow configuration of job parameters in app settings
- Provide sensible defaults
- Document customization options

### 3. Long-Running Jobs
**Challenge**: Jobs may take significant time to complete
**Mitigation**:
- Use polling with reasonable intervals (5-10 seconds)
- Allow users to close the app while job runs
- Store job ID in browser storage for later retrieval
- Provide link to Esploro job monitor

### 4. API Rate Limits
**Challenge**: Polling may hit rate limits
**Mitigation**:
- Use exponential backoff for polling
- Allow users to disable auto-monitoring
- Cache job status responses

## Implementation Phases

### Phase 1: Set Creation (Low Risk)
- Add `createItemizedSet()` method to AssetService
- Add optional toggle in UI
- Test with small datasets
- **Effort**: 2-3 days

### Phase 2: Job Submission (Medium Risk)
- Add `submitLoadFilesJob()` method to AssetService
- Integrate with set creation flow
- Handle job submission errors
- **Effort**: 3-4 days

### Phase 3: Job Monitoring (Medium Risk)
- Add `getJobStatus()` method to AssetService
- Implement polling mechanism
- Display job progress in UI
- **Effort**: 4-5 days

### Phase 4: Enhanced UX (Optional)
- Job history tracking
- Retry mechanisms
- Batch processing optimizations
- **Effort**: 5-7 days

## Testing Strategy

### Unit Tests
```typescript
describe('AssetService - Job Submission', () => {
  it('should create itemized set with correct payload', () => {
    // Test set creation request format
  });

  it('should submit load files job with set ID', () => {
    // Test job submission request format
  });

  it('should poll job status until completion', () => {
    // Test polling mechanism
  });
});
```

### Integration Tests
1. Test complete workflow: Queue files → Create set → Submit job
2. Test error handling at each step
3. Test permission failures
4. Test job monitoring and completion

### Manual Testing
1. Test with various file counts (1, 5, 20 files)
2. Test with different asset types
3. Test with insufficient permissions
4. Test job failure scenarios
5. Test long-running jobs

## Alternative Approaches

### Option 1: External Job Scheduler
Instead of submitting jobs via API, use Esploro's scheduled job system
- **Pros**: No additional permissions needed
- **Cons**: Requires manual configuration, less flexible

### Option 2: Webhook Integration
Use webhooks to notify when files are ready for processing
- **Pros**: Real-time notifications
- **Cons**: Requires external infrastructure

### Option 3: Batch Processing
Queue multiple assets, create single set with all assets
- **Pros**: More efficient for bulk operations
- **Cons**: More complex UI and error handling

## Conclusion

The job submission enhancement would significantly improve the user experience by automating the file loading workflow. While it introduces additional complexity and permission requirements, the benefits for users who frequently attach files to assets are substantial.

**Recommendation**: Implement in phases, starting with set creation (Phase 1), then evaluate user feedback before proceeding with job submission and monitoring.

## References

- [Alma Configuration API Documentation](https://developers.exlibrisgroup.com/alma/apis/conf/)
- [Esploro Online Help - Working with Sets](https://knowledge.exlibrisgroup.com/Esploro/Product_Documentation/Esploro_Online_Help_(English))
- [Esploro Online Help - Jobs](https://knowledge.exlibrisgroup.com/Esploro/Product_Documentation/Esploro_Online_Help_(English))
- [Ex Libris Cloud Apps Framework](https://developers.exlibrisgroup.com/cloudapps/)
