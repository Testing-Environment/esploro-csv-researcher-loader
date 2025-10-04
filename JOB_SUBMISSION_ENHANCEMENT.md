# Job Submission Enhancement for Esploro Asset Loader

## Overview

This document outlines the design and implementation plan for enhancing the Esploro CSV Asset Loader with automated job submission capabilities. This feature will enable the application to automatically create itemized sets and trigger the "Load files" job after queueing files for asset ingestion.

## Current Workflow vs. Enhanced Workflow

### Current Workflow (Manual)

```
1. User uploads CSV with asset data
   ↓
2. App queues files via API (POST /assets/{id}?op=patch&action=add)
   ↓
3. User receives success message
   ↓
4. User MANUALLY:
   - Creates an itemized set with the updated assets
   - Navigates to job management
   - Runs "Load files" job for the set
   ↓
5. Files are ingested
```

**Pain Points:**
- Requires multiple manual steps after app submission
- User must remember to run the job
- Delay between queuing and ingestion
- No automated tracking of job status

### Enhanced Workflow (Automated)

```
1. User uploads CSV with asset data
   ↓
2. App queues files via API
   ↓
3. App AUTOMATICALLY:
   - Creates itemized set with affected assets
   - Submits "Load files" job for the set
   - (Optional) Monitors job progress
   ↓
4. User receives comprehensive status:
   - Files queued: X
   - Set created: [Set ID]
   - Job submitted: [Job ID]
   - Job status: In Progress / Completed / Failed
   ↓
5. Files are ingested automatically
```

**Benefits:**
- Eliminates manual steps
- Immediate job submission
- Automated tracking and notifications
- Complete end-to-end workflow

---

## API Requirements

### 1. Set Management API

According to the Alma Configuration API, sets can be created programmatically:

#### Create Itemized Set
```
POST /conf/sets
Content-Type: application/json

{
  "name": "Asset File Load - [Timestamp]",
  "type": {
    "value": "ITEMIZED"
  },
  "content_type": {
    "value": "ASSET"
  },
  "description": "Auto-generated set for file ingestion",
  "private": false,
  "members": {
    "member": [
      { "id": "asset_id_1" },
      { "id": "asset_id_2" },
      { "id": "asset_id_3" }
    ]
  }
}

Response:
{
  "id": "12345678",
  "name": "Asset File Load - 2024-01-15 14:30",
  "link": "/conf/sets/12345678"
}
```

**Required Permissions:**
- General System Administrator role OR
- Repository Administrator role

### 2. Job Submission API

Jobs can be submitted programmatically via the Alma Jobs API:

#### Submit Load Files Job
```
POST /conf/jobs
Content-Type: application/json

{
  "name": "Load files",
  "type": {
    "value": "SCHEDULED"
  },
  "category": {
    "value": "REPOSITORY"
  },
  "parameters": {
    "parameter": [
      {
        "name": "set_id",
        "value": "12345678"
      },
      {
        "name": "run_immediately",
        "value": "true"
      }
    ]
  }
}

Response:
{
  "id": "job_instance_123",
  "name": "Load files",
  "status": {
    "value": "PENDING"
  },
  "submitted_date": "2024-01-15T14:30:00Z"
}
```

**Required Permissions:**
- General System Administrator role OR
- Repository Administrator role

### 3. Job Monitoring API

Monitor job progress:

#### Get Job Status
```
GET /conf/jobs/{job_instance_id}

Response:
{
  "id": "job_instance_123",
  "name": "Load files",
  "status": {
    "value": "COMPLETED_SUCCESS" | "IN_PROGRESS" | "COMPLETED_FAILED"
  },
  "start_time": "2024-01-15T14:30:00Z",
  "end_time": "2024-01-15T14:35:00Z",
  "progress": 100,
  "counters": {
    "counter": [
      { "type": "c.general.total_records", "value": "10" },
      { "type": "c.general.success", "value": "9" },
      { "type": "c.general.failed", "value": "1" }
    ]
  }
}
```

---

## Implementation Design

### Architecture Changes

```
┌─────────────────────────────────────────────────────────────────┐
│                   Enhanced Component Flow                        │
└─────────────────────────────────────────────────────────────────┘

MainComponent
│
├── Step 1: Queue Files
│   └── assetService.addFilesToAsset(assetId, files)
│       ↓ Success
│
├── Step 2: Create Set (NEW)
│   └── setService.createItemizedSet(assetIds[], name)
│       ↓ Returns set ID
│
├── Step 3: Submit Job (NEW)
│   └── jobService.submitLoadFilesJob(setId)
│       ↓ Returns job instance ID
│
└── Step 4: Monitor Job (NEW, OPTIONAL)
    └── jobService.monitorJob(jobInstanceId)
        ↓ Poll every 5 seconds
        └── Update UI with progress
```

### New Service: SetService

Create a new service for set management:

```typescript
// cloudapp/src/app/services/set.service.ts

import { Injectable } from '@angular/core';
import { CloudAppRestService, HttpMethod, Request } from '@exlibris/exl-cloudapp-angular-lib';
import { Observable } from 'rxjs';

export interface ItemizedSet {
  id?: string;
  name: string;
  type: { value: 'ITEMIZED' };
  content_type: { value: 'ASSET' };
  description?: string;
  private?: boolean;
  members: {
    member: Array<{ id: string }>;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SetService {
  constructor(private restService: CloudAppRestService) {}

  /**
   * Create an itemized set with the given asset IDs
   */
  createItemizedSet(assetIds: string[], name?: string): Observable<ItemizedSet> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const setName = name || `Asset File Load - ${timestamp}`;

    const payload: ItemizedSet = {
      name: setName,
      type: { value: 'ITEMIZED' },
      content_type: { value: 'ASSET' },
      description: `Auto-generated set for file ingestion. Contains ${assetIds.length} asset(s).`,
      private: false,
      members: {
        member: assetIds.map(id => ({ id }))
      }
    };

    const request: Request = {
      url: '/conf/sets',
      method: HttpMethod.POST,
      headers: { 'Content-Type': 'application/json' },
      requestBody: payload
    };

    return this.restService.call(request);
  }

  /**
   * Add members to an existing set
   */
  addMembersToSet(setId: string, assetIds: string[]): Observable<any> {
    const request: Request = {
      url: `/conf/sets/${setId}?op=add_members`,
      method: HttpMethod.POST,
      headers: { 'Content-Type': 'application/json' },
      requestBody: {
        members: {
          member: assetIds.map(id => ({ id }))
        }
      }
    };

    return this.restService.call(request);
  }

  /**
   * Delete a set
   */
  deleteSet(setId: string): Observable<void> {
    const request: Request = {
      url: `/conf/sets/${setId}`,
      method: HttpMethod.DELETE
    };

    return this.restService.call(request);
  }
}
```

### New Service: JobService

Create a new service for job management:

```typescript
// cloudapp/src/app/services/job.service.ts

import { Injectable } from '@angular/core';
import { CloudAppRestService, HttpMethod, Request } from '@exlibris/exl-cloudapp-angular-lib';
import { Observable, interval } from 'rxjs';
import { switchMap, takeWhile, startWith } from 'rxjs/operators';

export interface Job {
  id?: string;
  name: string;
  type?: { value: string };
  category?: { value: string };
  status?: { value: string };
  submitted_date?: string;
  start_time?: string;
  end_time?: string;
  progress?: number;
  counters?: {
    counter: Array<{ type: string; value: string }>;
  };
  parameters?: {
    parameter: Array<{ name: string; value: string }>;
  };
}

@Injectable({
  providedIn: 'root'
})
export class JobService {
  constructor(private restService: CloudAppRestService) {}

  /**
   * Submit the "Load files" job for a given set
   */
  submitLoadFilesJob(setId: string): Observable<Job> {
    const payload: Job = {
      name: 'Load files',
      type: { value: 'SCHEDULED' },
      category: { value: 'REPOSITORY' },
      parameters: {
        parameter: [
          { name: 'set_id', value: setId },
          { name: 'run_immediately', value: 'true' }
        ]
      }
    };

    const request: Request = {
      url: '/conf/jobs',
      method: HttpMethod.POST,
      headers: { 'Content-Type': 'application/json' },
      requestBody: payload
    };

    return this.restService.call(request);
  }

  /**
   * Get job status by ID
   */
  getJobStatus(jobInstanceId: string): Observable<Job> {
    const request: Request = {
      url: `/conf/jobs/${jobInstanceId}`,
      method: HttpMethod.GET
    };

    return this.restService.call(request);
  }

  /**
   * Monitor job until completion (polls every 5 seconds)
   * Emits job status updates until job is complete
   */
  monitorJobUntilComplete(jobInstanceId: string): Observable<Job> {
    return interval(5000).pipe(
      startWith(0), // Emit immediately on subscribe
      switchMap(() => this.getJobStatus(jobInstanceId)),
      takeWhile(
        (job) => {
          const status = job.status?.value || '';
          return !['COMPLETED_SUCCESS', 'COMPLETED_FAILED', 'ABORTED'].includes(status);
        },
        true // Include the final emission
      )
    );
  }
}
```

### Updated MainComponent

Enhance the main component to orchestrate the full workflow:

```typescript
// cloudapp/src/app/main/main.component.ts

import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize, mergeMap } from 'rxjs/operators';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { AssetService, CodeTableEntry } from '../services/asset.service';
import { SetService } from '../services/set.service';
import { JobService, Job } from '../services/job.service';
import { AssetFileLink } from '../models/asset';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  form: FormGroup;
  fileTypes: CodeTableEntry[] = [];
  loadingFileTypes = false;
  submitting = false;
  submissionResult: {
    type: 'success' | 'error';
    message: string;
    setId?: string;
    jobId?: string;
    jobStatus?: string;
  } | null = null;

  enableAutoJobSubmission = true; // Feature flag

  // ... (existing properties and methods)

  constructor(
    private fb: FormBuilder,
    private assetService: AssetService,
    private setService: SetService,
    private jobService: JobService,
    private alert: AlertService
  ) {
    // ... (existing constructor code)
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const assetId = this.form.get('assetId')?.value;
    const filesPayload: AssetFileLink[] = this.buildFilePayload();

    this.submitting = true;
    this.submissionResult = null;

    // Step 1: Queue files
    this.assetService.addFilesToAsset(assetId, filesPayload)
      .pipe(
        // Step 2: Create set (if auto-submission enabled)
        mergeMap(() => {
          if (this.enableAutoJobSubmission) {
            return this.setService.createItemizedSet([assetId]);
          }
          return [null]; // Skip set creation
        }),
        // Step 3: Submit job (if set was created)
        mergeMap((set) => {
          if (set && set.id) {
            return this.jobService.submitLoadFilesJob(set.id).pipe(
              mergeMap((job) => ({ set, job }))
            );
          }
          return [{ set: null, job: null }];
        }),
        finalize(() => this.submitting = false)
      )
      .subscribe({
        next: (result: any) => {
          const { set, job } = result;
          
          let message = `Successfully queued ${filesPayload.length} file${filesPayload.length === 1 ? '' : 's'} for asset ${assetId}.`;
          
          if (set && job) {
            message += `\n\nSet created: ${set.name} (ID: ${set.id})`;
            message += `\nJob submitted: ${job.name} (ID: ${job.id})`;
            message += `\nStatus: ${job.status?.value || 'PENDING'}`;

            this.submissionResult = {
              type: 'success',
              message,
              setId: set.id,
              jobId: job.id,
              jobStatus: job.status?.value
            };

            // Optional: Start monitoring job
            if (job.id) {
              this.monitorJob(job.id);
            }
          } else {
            this.submissionResult = { type: 'success', message };
          }

          this.alert.success(message);
          this.resetFiles();
        },
        error: (error: any) => {
          const message = error?.message || 'Failed to process the request. Please review the details and try again.';
          this.alert.error(message);
          this.submissionResult = { type: 'error', message };
        }
      });
  }

  /**
   * Monitor job progress and update UI
   */
  private monitorJob(jobId: string): void {
    this.jobService.monitorJobUntilComplete(jobId).subscribe({
      next: (job: Job) => {
        if (this.submissionResult) {
          this.submissionResult.jobStatus = job.status?.value;
          
          // Update message with final status
          if (job.status?.value === 'COMPLETED_SUCCESS') {
            const successCount = job.counters?.counter.find(c => c.type === 'c.general.success')?.value || '0';
            this.alert.success(`Job completed successfully! Files processed: ${successCount}`);
          } else if (job.status?.value === 'COMPLETED_FAILED') {
            this.alert.error('Job completed with errors. Please check the job log for details.');
          }
        }
      },
      error: (error) => {
        console.error('Job monitoring error:', error);
      }
    });
  }
}
```

### UI Enhancements

Update the template to display job status:

```html
<!-- cloudapp/src/app/main/main.component.html -->

<!-- Existing form -->
<form [formGroup]="form">
  <!-- ... existing fields ... -->
</form>

<!-- Enhanced result display -->
<div *ngIf="submissionResult" class="submission-result">
  <mat-card [class.success]="submissionResult.type === 'success'" 
            [class.error]="submissionResult.type === 'error'">
    <mat-card-header>
      <mat-icon>{{ submissionResult.type === 'success' ? 'check_circle' : 'error' }}</mat-icon>
      <mat-card-title>
        {{ submissionResult.type === 'success' ? 'Success' : 'Error' }}
      </mat-card-title>
    </mat-card-header>
    
    <mat-card-content>
      <p>{{ submissionResult.message }}</p>
      
      <!-- Job status indicator (if job was submitted) -->
      <div *ngIf="submissionResult.setId" class="job-details">
        <h4>Automated Processing</h4>
        
        <div class="detail-row">
          <strong>Set ID:</strong>
          <span>{{ submissionResult.setId }}</span>
        </div>
        
        <div class="detail-row" *ngIf="submissionResult.jobId">
          <strong>Job ID:</strong>
          <span>{{ submissionResult.jobId }}</span>
        </div>
        
        <div class="detail-row" *ngIf="submissionResult.jobStatus">
          <strong>Job Status:</strong>
          <span class="status-badge" [class]="submissionResult.jobStatus">
            {{ submissionResult.jobStatus }}
          </span>
          
          <!-- Progress spinner for in-progress jobs -->
          <mat-spinner *ngIf="submissionResult.jobStatus === 'IN_PROGRESS'" 
                       diameter="20" mode="indeterminate">
          </mat-spinner>
        </div>
      </div>
    </mat-card-content>
  </mat-card>
</div>
```

Add corresponding styles:

```scss
// cloudapp/src/app/main/main.component.scss

.submission-result {
  margin-top: 20px;

  mat-card {
    &.success {
      border-left: 4px solid #4caf50;
      
      mat-icon {
        color: #4caf50;
      }
    }

    &.error {
      border-left: 4px solid #f44336;
      
      mat-icon {
        color: #f44336;
      }
    }
  }

  .job-details {
    margin-top: 15px;
    padding: 15px;
    background: #f5f5f5;
    border-radius: 4px;

    h4 {
      margin-top: 0;
      color: #666;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 8px 0;

      strong {
        margin-right: 10px;
      }

      .status-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;

        &.PENDING {
          background: #fff3cd;
          color: #856404;
        }

        &.IN_PROGRESS {
          background: #cce5ff;
          color: #004085;
        }

        &.COMPLETED_SUCCESS {
          background: #d4edda;
          color: #155724;
        }

        &.COMPLETED_FAILED {
          background: #f8d7da;
          color: #721c24;
        }
      }
    }
  }
}
```

---

## Configuration Options

Add a settings toggle for job auto-submission:

```typescript
// cloudapp/src/app/models/settings.ts

export interface Settings {
  profiles: Profile[];
  autoSubmitJobs?: boolean; // NEW: Enable/disable auto job submission
  jobMonitoringInterval?: number; // NEW: Polling interval in ms (default 5000)
}
```

Settings UI enhancement:

```html
<!-- cloudapp/src/app/settings/settings.component.html -->

<mat-card class="settings-card">
  <mat-card-header>
    <mat-card-title>Job Automation</mat-card-title>
  </mat-card-header>
  
  <mat-card-content>
    <mat-slide-toggle [(ngModel)]="settings.autoSubmitJobs">
      Automatically create sets and submit "Load files" job
    </mat-slide-toggle>
    
    <p class="help-text">
      When enabled, the app will automatically create an itemized set
      and submit the "Load files" job after queueing files. This requires
      Repository Administrator permissions.
    </p>
  </mat-card-content>
</mat-card>
```

---

## Error Handling

### Permission Errors

```typescript
// Handle insufficient permissions gracefully

this.setService.createItemizedSet([assetId])
  .pipe(
    catchError((error) => {
      if (error.status === 403) {
        this.alert.warn(
          'Files queued successfully, but automatic set creation failed due to insufficient permissions. ' +
          'Please create a set and run the "Load files" job manually.'
        );
        return of(null); // Continue without set
      }
      throw error; // Re-throw other errors
    })
  );
```

### Job Submission Failures

```typescript
// Retry logic for job submission

this.jobService.submitLoadFilesJob(setId)
  .pipe(
    retry(3), // Retry up to 3 times
    catchError((error) => {
      this.alert.error(
        `Job submission failed after 3 attempts. Set ${setId} was created. ` +
        'Please submit the job manually from the Esploro admin interface.'
      );
      return of(null);
    })
  );
```

---

## Testing Strategy

### Unit Tests

```typescript
// cloudapp/src/app/services/set.service.spec.ts

describe('SetService', () => {
  let service: SetService;
  let restService: jasmine.SpyObj<CloudAppRestService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('CloudAppRestService', ['call']);
    
    TestBed.configureTestingModule({
      providers: [
        SetService,
        { provide: CloudAppRestService, useValue: spy }
      ]
    });

    service = TestBed.inject(SetService);
    restService = TestBed.inject(CloudAppRestService) as jasmine.SpyObj<CloudAppRestService>;
  });

  it('should create itemized set with correct payload', (done) => {
    const mockResponse = { id: '12345', name: 'Test Set' };
    restService.call.and.returnValue(of(mockResponse));

    service.createItemizedSet(['asset1', 'asset2']).subscribe((result) => {
      expect(result.id).toBe('12345');
      expect(restService.call).toHaveBeenCalledWith(
        jasmine.objectContaining({
          url: '/conf/sets',
          method: HttpMethod.POST
        })
      );
      done();
    });
  });
});
```

### Integration Tests

- Test complete workflow: file queue → set creation → job submission
- Test permission errors and fallback behavior
- Test job monitoring and status updates

### Manual Testing Checklist

- [ ] Files queue successfully for a single asset
- [ ] Set is created with correct asset ID
- [ ] Job is submitted with correct set ID
- [ ] Job status updates appear in UI
- [ ] Job completion triggers success message
- [ ] Permission errors show user-friendly message
- [ ] Feature can be disabled via settings
- [ ] Manual workflow still works when auto-submission is off

---

## Performance Considerations

### Batch Processing

For multiple assets, create one set with all assets instead of individual sets:

```typescript
// Process multiple assets, then create one set
const processedAssetIds: string[] = [];

for (const asset of assets) {
  await this.assetService.addFilesToAsset(asset.id, files);
  processedAssetIds.push(asset.id);
}

// Create single set with all processed assets
this.setService.createItemizedSet(processedAssetIds);
```

### Polling Optimization

- Use exponential backoff for long-running jobs
- Limit polling duration (e.g., stop after 30 minutes)
- Allow user to manually refresh status

---

## Future Enhancements

### Phase 1 (Current Scope)
- ✅ Automatic set creation
- ✅ Automatic job submission
- ✅ Basic job status monitoring

### Phase 2 (Future)
- 📧 Email notifications on job completion
- 📊 Job history and logs viewer
- ⏰ Scheduled job submission (delayed start)
- 📦 Batch operations (multiple jobs for different sets)

### Phase 3 (Advanced)
- 🔄 Job retry mechanism for failed files
- 📈 Analytics dashboard (success rates, processing times)
- 🔔 Browser notifications (Web Notifications API)
- 🔗 Integration with other Esploro jobs (metadata enrichment, etc.)

---

## Rollout Plan

### Development
1. Create SetService and JobService
2. Update MainComponent with orchestration logic
3. Add UI components for status display
4. Write unit and integration tests

### Testing
1. Test in development environment
2. Verify permissions and error handling
3. Load test with large datasets
4. User acceptance testing

### Deployment
1. Deploy with feature flag disabled by default
2. Enable for pilot users
3. Monitor for errors and performance issues
4. Roll out to all users
5. Gather feedback and iterate

---

## Documentation Updates Required

- **README.md**: Add section on automated job submission
- **User Guide**: Explain the complete workflow
- **Admin Guide**: Document required permissions
- **API Reference**: List new endpoints used

---

## Conclusion

This enhancement transforms the Esploro CSV Asset Loader from a file-queuing tool into a complete end-to-end ingestion solution. By automating set creation and job submission, we eliminate manual steps, reduce errors, and significantly improve the user experience.

**Estimated Development Time:** 2-3 weeks
**Complexity:** Medium
**Impact:** High (eliminates 3-5 manual steps per use)

---

**Revision History**

| Version | Date       | Changes                              |
|---------|------------|--------------------------------------|
| 1.0     | 2024-01-XX | Initial enhancement design document  |
