import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, timer, throwError } from 'rxjs';
import { map, mergeMap, catchError, switchMap, takeWhile, tap } from 'rxjs/operators';
import { AssetService, Asset } from './asset.service';
import { SetService } from './set.service';
import { JobService, JobInstance } from './job.service';

export interface FileEntry {
  assetId: string;
  title: string;
  url: string;
  description?: string;
  supplemental: boolean;
  type?: string; // Will be set in stage 2
}

export interface AssetValidationResult {
  assetId: string;
  exists: boolean;
  type?: string;
  initialFiles?: any[];
  error?: string;
}

export interface WorkflowResult {
  success: boolean;
  setId?: string;
  jobId?: string;
  instanceId?: string;
  jobStatus?: string;
  counters?: { [key: string]: number };
  filesProcessed?: number;
  assetsProcessed?: number;
  errors?: string[];
  assetVerifications?: AssetVerification[];
}

export interface AssetVerification {
  assetId: string;
  initialFileCount: number;
  finalFileCount: number;
  filesAdded: number;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private readonly JOB_POLL_INTERVAL = 5000; // 5 seconds
  private readonly JOB_MAX_POLLS = 120; // 10 minutes max

  constructor(
    private assetService: AssetService,
    private setService: SetService,
    private jobService: JobService
  ) {}

  /**
   * Step 1: Validate assets and fetch their details
   */
  validateAssets(assetIds: string[]): Observable<AssetValidationResult[]> {
    const uniqueAssetIds = [...new Set(assetIds)];
    
    const validations = uniqueAssetIds.map(assetId =>
      this.assetService.getAsset(assetId).pipe(
        map((asset: Asset) => ({
          assetId,
          exists: true,
          type: asset.type?.value || asset.type as any,
          initialFiles: asset.files || []
        } as AssetValidationResult)),
        catchError(error => of({
          assetId,
          exists: false,
          error: error.message || 'Asset not found'
        } as AssetValidationResult))
      )
    );

    return forkJoin(validations);
  }

  /**
   * Execute the complete automated workflow
   */
  executeWorkflow(entries: FileEntry[]): Observable<WorkflowResult> {
    const uniqueAssetIds = [...new Set(entries.map(e => e.assetId))];
    const totalFiles = entries.length;
    const totalAssets = uniqueAssetIds.length;

    let validatedAssets: AssetValidationResult[] = [];
    let setId: string;
    let jobId: string;
    let instanceId: string;

    return this.validateAssets(uniqueAssetIds).pipe(
      // Step 1: Check validation results
      tap(results => {
        validatedAssets = results;
        const failedAssets = results.filter(r => !r.exists);
        if (failedAssets.length > 0) {
          throw new Error(`Failed to validate assets: ${failedAssets.map(a => a.assetId).join(', ')}`);
        }
      }),
      // Step 2: Create set
      mergeMap(() => {
        const validAssetIds = validatedAssets.filter(r => r.exists).map(r => r.assetId);
        return this.setService.createItemizedSet(validAssetIds);
      }),
      tap(set => {
        setId = set.id!;
      }),
      // Step 3: Verify set members (the create call should have added them)
      mergeMap(() => this.setService.getSet(setId)),
      tap(set => {
        const memberIds = set.members?.member?.map(m => m.id) || [];
        const missingAssets = uniqueAssetIds.filter(id => !memberIds.includes(id));
        
        if (missingAssets.length > 0) {
          // Note: These assets should be added using a different API if needed
          console.warn('Some assets were not added to the set:', missingAssets);
        }
      }),
      // Step 4: Find import job ID
      mergeMap(() => this.jobService.findImportJobId()),
      tap(id => {
        jobId = id;
      }),
      // Step 5: Run the job
      mergeMap(() => this.jobService.runJob(jobId, setId)),
      tap(instance => {
        instanceId = instance.id!;
      }),
      // Step 6: Monitor job progress
      mergeMap(() => this.pollJobStatus(jobId, instanceId)),
      // Step 7: Process and verify results
      mergeMap(jobInstance => {
        return this.verifyResults(jobInstance, validatedAssets, totalFiles, totalAssets);
      }),
      // Step 8: Return comprehensive result
      map(verification => ({
        success: verification.success,
        setId,
        jobId,
        instanceId,
        ...verification
      } as WorkflowResult)),
      catchError(error => {
        return of({
          success: false,
          setId,
          jobId,
          instanceId,
          errors: [error.message || 'Workflow failed']
        } as WorkflowResult);
      })
    );
  }

  /**
   * Poll job status until completion
   */
  private pollJobStatus(jobId: string, instanceId: string): Observable<JobInstance> {
    let pollCount = 0;

    return timer(0, this.JOB_POLL_INTERVAL).pipe(
      switchMap(() => this.jobService.getJobInstance(jobId, instanceId)),
      takeWhile((instance: JobInstance) => {
        pollCount++;
        const status = instance.status?.value || '';
        const isRunning = !['COMPLETED_SUCCESS', 'COMPLETED_FAILED', 'FAILED', 'ABORTED'].includes(status);
        
        // Continue polling if still running and haven't exceeded max polls
        return isRunning && pollCount < this.JOB_MAX_POLLS;
      }, true), // Include the final value
      // Take the last emitted value (the completed job)
      map((instance, index, arr) => {
        const status = instance.status?.value || '';
        if (['COMPLETED_SUCCESS', 'COMPLETED_FAILED', 'FAILED', 'ABORTED'].includes(status)) {
          return instance;
        }
        
        // If we've exceeded max polls
        if (pollCount >= this.JOB_MAX_POLLS) {
          throw new Error('Job monitoring timed out');
        }
        
        return instance;
      })
    );
  }

  /**
   * Verify the results by comparing counters and re-fetching assets
   */
  private verifyResults(
    jobInstance: JobInstance,
    validatedAssets: AssetValidationResult[],
    expectedFiles: number,
    expectedAssets: number
  ): Observable<any> {
    const counters = this.parseCounters(jobInstance.counter || []);
    const jobStatus = jobInstance.status?.value || 'UNKNOWN';

    // Check for discrepancies
    const filesUploaded = counters.file_uploaded || 0;
    const assetsSucceeded = counters.asset_succeeded || 0;
    const assetsFailed = counters.asset_failed || 0;

    // Re-fetch assets to verify file counts
    return this.verifyAssetFiles(validatedAssets).pipe(
      map(assetVerifications => ({
        success: jobStatus === 'COMPLETED_SUCCESS' && assetsFailed === 0,
        jobStatus,
        counters,
        filesProcessed: filesUploaded,
        assetsProcessed: assetsSucceeded,
        assetVerifications,
        errors: assetsFailed > 0 ? [`${assetsFailed} assets failed to process`] : []
      }))
    );
  }

  /**
   * Verify asset files by comparing before and after
   */
  private verifyAssetFiles(validatedAssets: AssetValidationResult[]): Observable<AssetVerification[]> {
    const verifications = validatedAssets.map(validated =>
      this.assetService.getAsset(validated.assetId).pipe(
        map((asset: Asset) => {
          const initialCount = validated.initialFiles?.length || 0;
          const finalCount = asset.files?.length || 0;
          const filesAdded = finalCount - initialCount;

          return {
            assetId: validated.assetId,
            initialFileCount: initialCount,
            finalFileCount: finalCount,
            filesAdded,
            success: filesAdded > 0
          } as AssetVerification;
        }),
        catchError(() => of({
          assetId: validated.assetId,
          initialFileCount: validated.initialFiles?.length || 0,
          finalFileCount: 0,
          filesAdded: 0,
          success: false
        } as AssetVerification))
      )
    );

    return forkJoin(verifications);
  }

  /**
   * Parse counter array into a map
   */
  private parseCounters(counters: any[]): { [key: string]: number } {
    const result: { [key: string]: number } = {};
    
    counters.forEach(counter => {
      const type = counter.type || counter.name;
      const value = counter.value || 0;
      result[type] = value;
    });

    return result;
  }
}
