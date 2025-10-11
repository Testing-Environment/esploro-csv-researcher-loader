import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, from, throwError, interval, Subscription } from 'rxjs';
import { catchError, concatMap, map, toArray, switchMap, takeWhile } from 'rxjs/operators';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { AssetService } from '../services/asset.service';
import { AssetFileLink } from '../models/asset';
import { ProcessedAsset, FileType, AssetFileAndLinkType, AssetMetadata } from '../models/types';
import { firstValueFrom, lastValueFrom } from '../utilities/rxjs-helpers';

type ManualEntryStage = 'stage1' | 'stage2' | 'stage3';

interface ManualEntryFormValue {
  assetId: string;
  title: string;
  url: string;
  description: string;
  type: string;
  supplemental: boolean;
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {
  form: FormGroup;
  stage: ManualEntryStage = 'stage1';
  stageTwoSkipped = false;
  assetValidationInProgress = false;
  // Controls whether Stage 2 (File Type selection) is presented
  fileTypesToggle = false; // default OFF per requirements
  fileTypes: FileType[] = [];
  assetFileAndLinkTypes: AssetFileAndLinkType[] = [];  // All file type categories
  submitting = false;
  submissionResult: { type: 'success' | 'error'; message: string } | null = null;
  assetMetadataMap = new Map<string, AssetMetadata>();
  // Stage 3 review counts
  reviewAssetsCount = 0;
  reviewFilesCount = 0;
  reviewUniqueUrlsCount = 0;

  // CSV Processing state
  processedAssets: ProcessedAsset[] = [];
  mmsIdDownloadUrl: string = '';
  showResults = false;
  showWorkflowInstructions = false;

  // Job automation state (Phase 3)
  createdSetId: string | null = null;
  jobInstanceId: string | null = null;
  pollingSubscription: Subscription | null = null;
  jobProgress: number = 0;
  jobStatusText: string = '';

  private readonly urlPattern = /^https?:\/\//i;

  constructor(
    private fb: FormBuilder,
    private assetService: AssetService,
    private alert: AlertService
  ) {
    this.form = this.fb.group({
      entries: this.fb.array([this.createEntryGroup()])
    });
  }

  ngOnInit(): void {
    this.loadAssetFilesAndLinkTypes();
  }

  ngOnDestroy() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  get entries(): FormArray {
    return this.form.get('entries') as FormArray;
  }

  addEntry(): void {
    this.entries.push(this.createEntryGroup());
  }

  removeEntry(index: number): void {
    if (this.entries.length === 1) {
      return;
    }
    this.entries.removeAt(index);
  }

  async specifyTypesForEachFile(): Promise<void> {
    if (this.assetValidationInProgress || this.submitting) {
      return;
    }

    const isValid = await this.validateStageOneEntries();
    if (!isValid) {
      return;
    }

    this.stageTwoSkipped = false;
    this.stage = 'stage2';
    this.applyTypeValidators(true);

    this.entries.controls.forEach((group: FormGroup) => {
      const typeControl = group.get('type');
      if (!typeControl?.value) {
        this.assignDefaultType(group);
      }
      typeControl?.markAsUntouched();
    });
  }

  /**
   * Validate Stage 1 and, when valid, proceed to Stage 3 (Review & Confirm)
   * Used when File Types toggle is OFF (skip Stage 2 entirely)
   */
  async proceedToValidationAndReview(): Promise<void> {
    if (this.assetValidationInProgress || this.submitting) {
      return;
    }

    const isValid = await this.validateStageOneEntries();
    if (!isValid) {
      return;
    }

    const skippedStageTwo = !this.fileTypesToggle;

    if (skippedStageTwo) {
      const allAssigned = this.entries.controls.every((group: FormGroup) => this.assignDefaultType(group));
      if (!allAssigned) {
        this.alert.error('Unable to determine a default file type for one or more entries. Please specify file types manually.');
        return;
      }
      this.applyTypeValidators(false);
    } else {
      // Ensure type selection is complete (similar to submitWithSelectedTypes)
      const hasTypeErrors = this.entries.controls.some(group => {
        const control = (group as FormGroup).get('type');
        control?.markAsTouched();
        return control?.invalid;
      });

      if (hasTypeErrors) {
        this.alert.error('Please choose a file type for each entry before continuing.');
        return;
      }
    }

    // Build payload to confirm counts
    const payload = this.buildSubmissionPayload();
    if (!payload.size) {
      this.alert.error('There are no entries to submit. Please add at least one file.');
      return;
    }

    let totalFiles = 0;
    const uniqueUrls = new Set<string>();

    payload.forEach(files => {
      totalFiles += files.length;
      files.forEach(file => {
        if (file.url) {
          uniqueUrls.add(file.url);
        }
      });
    });

    this.reviewAssetsCount = payload.size;
    this.reviewFilesCount = totalFiles;
    this.reviewUniqueUrlsCount = uniqueUrls.size;
    this.stageTwoSkipped = skippedStageTwo;
    this.stage = 'stage3';
  }

  async proceedWithoutSelectingTypes(): Promise<void> {
    if (this.assetValidationInProgress || this.submitting) {
      return;
    }

    const isValid = await this.validateStageOneEntries();
    if (!isValid) {
      return;
    }

    const allAssigned = this.entries.controls.every((group: FormGroup) => this.assignDefaultType(group));

    if (!allAssigned) {
      this.alert.error('Unable to determine a default file type for one or more entries. Please specify file types manually.');
      return;
    }

    this.stageTwoSkipped = true;
    this.applyTypeValidators(false);
    await this.executeSubmission(true);
  }

  async submitWithSelectedTypes(): Promise<void> {
    if (this.submitting) {
      return;
    }

    const hasTypeErrors = this.entries.controls.some(group => {
      const control = (group as FormGroup).get('type');
      control?.markAsTouched();
      return control?.invalid;
    });

    if (hasTypeErrors) {
      this.alert.error('Please choose a file type for each entry before submitting.');
      return;
    }

    await this.executeSubmission(false);
  }

  returnToStageOne(): void {
    if (this.submitting) {
      return;
    }

    this.stage = 'stage1';
    this.stageTwoSkipped = false;
    this.applyTypeValidators(false);
  }

  /** Return from Stage 3 to Stage 1 for edits */
  backFromReview(): void {
    if (this.submitting) return;
    this.stage = 'stage1';
  }

  /** Placeholder for job run orchestration; will be wired to services in Phase 2 */
  async runImportJob(): Promise<void> {
    await this.executeSubmission(this.stageTwoSkipped);
  }

  trackByIndex(index: number): number {
    return index;
  }

  isAssetInvalid(index: number): boolean {
    const control = (this.entries.at(index) as FormGroup).get('assetId');
    return !!control?.errors?.['invalidAsset'];
  }

  getFilteredFileTypes(group: FormGroup): AssetFileAndLinkType[] {
    const assetId = (group.get('assetId')?.value || '').trim();
    const metadata = this.assetMetadataMap.get(assetId);

    if (!metadata?.assetType) {
      return this.assetFileAndLinkTypes;
    }

    return this.assetService.filterFileTypesByAssetType(
      this.assetFileAndLinkTypes,
      metadata.assetType,
      'both'
    );
  }

  private createEntryGroup(): FormGroup {
    return this.fb.group({
      assetId: ['', Validators.required],
      title: [''],
      url: ['', [Validators.required, Validators.pattern(this.urlPattern)]],
      description: [''],
      type: [''],
      supplemental: [false]
    });
  }

  /**
   * Load AssetFileAndLinkTypes mapping table for file type categories
   * This provides the valid ID values that must be used in API calls
   */
  private loadAssetFilesAndLinkTypes(): void {
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
  }

  private buildFileTypeHints(types: AssetFileAndLinkType[]): FileType[] {
    const seen = new Set<string>();

    return types.reduce((accumulator: FileType[], type) => {
      const targetCode = (type.targetCode || '').trim();
      const id = (type.id || '').trim();

      if (!targetCode) {
        return accumulator;
      }

      const uniqueKey = `${targetCode.toLowerCase()}|${id.toLowerCase()}`;
      if (seen.has(uniqueKey)) {
        return accumulator;
      }

      seen.add(uniqueKey);
      accumulator.push({
        code: targetCode,
        description: id && id.toLowerCase() !== targetCode.toLowerCase() ? id : ''
      });

      return accumulator;
    }, []);
  }

  onBatchProcessed(assets: ProcessedAsset[]) {
    this.processedAssets = assets;
    this.showResults = true;
  }

  onDownloadReady(downloadUrl: string) {
    this.mmsIdDownloadUrl = downloadUrl;
    this.showWorkflowInstructions = true;
  }

  private async executeSubmission(skippedStageTwo: boolean): Promise<void> {
    const payloadByAsset = this.buildSubmissionPayload();

    if (payloadByAsset.size === 0) {
      this.alert.error('There are no entries to submit. Please add at least one file.');
      return;
    }

    const hasMissingTypes = Array.from(payloadByAsset.values()).some(files =>
      files.some(file => !file.type)
    );

    if (hasMissingTypes) {
      this.alert.error('One or more entries are missing file types. Please specify them before submitting.');
      return;
    }

    this.submitting = true;
    this.submissionResult = null;

    try {
      const results = await lastValueFrom(
        from(Array.from(payloadByAsset.entries())).pipe(
          concatMap(([assetId, files]) =>
            this.assetService.addFilesToAsset(assetId, files).pipe(
              map(() => ({ assetId, count: files.length })),
              catchError(error => {
                const message = error?.message
                  || `Failed to queue files for asset ${assetId}. Please review the details and try again.`;
                return throwError(() => ({ message }));
              })
            )
          ),
          toArray()
        )
      );

      const totalFiles = results.reduce((sum, item) => sum + item.count, 0);
      const uniqueAssets = results.length;

      // Phase 3: Create set with successful assets
      const assetIds = results.map(r => r.assetId);
      await this.createSetForSuccessfulAssets(assetIds);

      const message = skippedStageTwo
        ? `Successfully queued ${totalFiles} file${totalFiles === 1 ? '' : 's'} across ${uniqueAssets} asset${uniqueAssets === 1 ? '' : 's'} using default file type selections.`
        : `Successfully queued ${totalFiles} file${totalFiles === 1 ? '' : 's'} across ${uniqueAssets} asset${uniqueAssets === 1 ? '' : 's'}.`;

      this.alert.success(message);
      this.submissionResult = { type: 'success', message };
      this.resetFlow();
    } catch (error: any) {
      const message = error?.message
        || 'Failed to add files to the selected assets. Please review the details and try again.';
      this.alert.error(message);
      this.submissionResult = { type: 'error', message };
    } finally {
      this.submitting = false;
    }
  }

  /**
   * Create set for job automation (Phase 3.1, 3.2 & 3.3)
   * Creates an Esploro set, adds members, and runs the import job
   */
  private async createSetForSuccessfulAssets(assetIds: string[]): Promise<void> {
    if (assetIds.length === 0) {
      console.log('No successful assets to add to set');
      return;
    }

    try {
      const setName = this.assetService.generateSetName();
      const setDescription = 'Automated set created by Cloud App Files Loader';

      // Phase 3.1: Create the set
      const setResponse = await firstValueFrom(
        this.assetService.createSet(setName, setDescription)
      );

      this.createdSetId = setResponse.id;
      console.log(`Set created successfully: ${setResponse.id}`);

      // Phase 3.2: Add members to the set
      const addMembersResponse = await firstValueFrom(
        this.assetService.updateSetMembers(setResponse.id, assetIds)
      );

      const memberCount = addMembersResponse.number_of_members?.value ?? assetIds.length;
      console.log(`Added ${memberCount} member(s) to set ${setResponse.id}`);

      // Phase 3.3: Run the import job
      const jobResponse = await firstValueFrom(
        this.assetService.runJob(setResponse.id)
      );

      const jobInstanceId = jobResponse.additional_info?.instance?.value || '';
      this.jobInstanceId = jobInstanceId;
      console.log(`Job submitted successfully. Job ID: ${jobResponse.id}, Instance: ${jobInstanceId}`);

      // Phase 3.4: Start polling job status
      this.startJobPolling(jobResponse.id, jobInstanceId);

      this.alert.success(
        `Job automation started! Set: ${setResponse.id}, Job Instance: ${jobInstanceId}. Monitoring job progress...`
      );

    } catch (error: any) {
      console.error('Error in job automation:', error);
      const errorMessage = error?.message || 'Failed to automate job submission';
      this.alert.error(`Job automation failed: ${errorMessage}. You may need to manually run the import job.`);
      // Don't fail the entire process if automation fails
      // User can still manually run the job using the created set
    }
  }

  private buildSubmissionPayload(): Map<string, AssetFileLink[]> {
    const payload = new Map<string, AssetFileLink[]>();

    this.entries.controls.forEach((group: FormGroup) => {
      const value = group.value as ManualEntryFormValue;
      const assetId = (value.assetId || '').trim();
      const url = (value.url || '').trim();

      if (!assetId || !url) {
        return;
      }

      const entry: AssetFileLink = {
        title: value.title || undefined,
        url,
        description: value.description || undefined,
        type: value.type,
        supplemental: !!value.supplemental
      };

      if (!payload.has(assetId)) {
        payload.set(assetId, []);
      }

      payload.get(assetId)?.push(entry);
    });

    return payload;
  }

  private async validateStageOneEntries(): Promise<boolean> {
    this.clearAssetValidationMarkers();

    const hasRequiredFields = this.ensureRequiredFields();
    if (!hasRequiredFields) {
      this.alert.error('Please provide an Asset ID and File URL for each entry before continuing.');
      return false;
    }

    const uniqueAssetIds = this.collectUniqueAssetIds();
    if (!uniqueAssetIds.length) {
      this.alert.error('Enter at least one Asset ID to continue.');
      return false;
    }

    this.assetValidationInProgress = true;

    try {
      const responses = await lastValueFrom(
        forkJoin(
          uniqueAssetIds.map(assetId =>
            this.assetService.getAssetMetadata(assetId).pipe(
              map(metadata => ({ assetId, metadata }))
            )
          )
        )
      );

      this.assetMetadataMap.clear();

      responses.forEach(({ assetId, metadata }) => {
        if (metadata) {
          this.assetMetadataMap.set(assetId, metadata);
        }
      });

      const invalidIndices: number[] = [];

      this.entries.controls.forEach((group: FormGroup, index: number) => {
        const assetId = (group.get('assetId')?.value || '').trim();
        if (!assetId || !this.assetMetadataMap.has(assetId)) {
          invalidIndices.push(index);
        }
      });

      if (invalidIndices.length) {
        this.highlightInvalidEntries(invalidIndices);
        this.alert.error('Some asset IDs could not be found. They have been moved to the top for correction.');
        return false;
      }

      return true;
    } catch (error: any) {
      const message = error?.status === 0
        ? 'Network error: Unable to validate asset IDs. Please check your connection and try again.'
        : 'Failed to validate asset IDs. Please try again.';
      this.alert.error(message);
      return false;
    } finally {
      this.assetValidationInProgress = false;
    }
  }

  private ensureRequiredFields(): boolean {
    let hasErrors = false;

    this.entries.controls.forEach((group: FormGroup) => {
      const assetIdControl = group.get('assetId');
      const urlControl = group.get('url');

      const assetIdValue = (assetIdControl?.value || '').trim();
      const urlValue = (urlControl?.value || '').trim();

      assetIdControl?.setValue(assetIdValue);
      urlControl?.setValue(urlValue);

      if (assetIdControl?.invalid) {
        assetIdControl.markAsTouched();
        hasErrors = true;
      }

      if (urlControl?.invalid) {
        urlControl.markAsTouched();
        hasErrors = true;
      }
    });

    return !hasErrors;
  }

  private collectUniqueAssetIds(): string[] {
    const ids = this.entries.controls
      .map(group => (group.get('assetId')?.value || '').trim())
      .filter(id => !!id);

    return Array.from(new Set(ids));
  }

  private highlightInvalidEntries(indices: number[]): void {
    const controls = this.entries.controls.slice() as FormGroup[];
    const invalidControls = indices.map(index => controls[index]);
    const validControls = controls.filter((_, index) => !indices.includes(index));

    indices.forEach(index => {
      const control = (controls[index] as FormGroup).get('assetId');
      const currentErrors = control?.errors || {};
      control?.setErrors({ ...currentErrors, invalidAsset: true });
      control?.markAsTouched();
    });

    const newOrder = [...invalidControls, ...validControls];
    this.replaceEntries(newOrder);
  }

  private replaceEntries(newOrder: FormGroup[]): void {
    while (this.entries.length) {
      this.entries.removeAt(0);
    }

    newOrder.forEach(group => this.entries.push(group));
  }

  private clearAssetValidationMarkers(): void {
    this.entries.controls.forEach((group: FormGroup) => {
      const control = group.get('assetId');
      const errors = control?.errors;

      if (!errors?.['invalidAsset']) {
        return;
      }

      const { invalidAsset, ...remaining } = errors;
      control?.setErrors(Object.keys(remaining).length ? remaining : null);
    });
  }

  private assignDefaultType(group: FormGroup): boolean {
    const assetId = (group.get('assetId')?.value || '').trim();
    const metadata = this.assetMetadataMap.get(assetId);

    const applicableTypes = metadata?.assetType
      ? this.assetService.filterFileTypesByAssetType(this.assetFileAndLinkTypes, metadata.assetType, 'both')
      : this.assetFileAndLinkTypes;

    const defaultType = applicableTypes?.[0]?.id;

    if (defaultType) {
      group.get('type')?.setValue(defaultType);
      return true;
    }

    return false;
  }

  private applyTypeValidators(isRequired: boolean): void {
    this.entries.controls.forEach((group: FormGroup) => {
      const typeControl = group.get('type');
      typeControl?.clearValidators();
      if (isRequired) {
        typeControl?.setValidators([Validators.required]);
      }
      typeControl?.updateValueAndValidity({ emitEvent: false });
    });
  }

  /**
   * Start polling job status with 5-second interval
   */
  private startJobPolling(jobId: string, instanceId: string): void {
    const pollInterval = 5000; // 5 seconds
    const maxDuration = 300000; // 5 minutes timeout
    const startTime = Date.now();

    this.pollingSubscription = interval(pollInterval)
      .pipe(
        switchMap(() => this.assetService.getJobInstance(jobId, instanceId)),
        takeWhile(status => {
          // Check timeout
          if (Date.now() - startTime > maxDuration) {
            this.alert.warn('Job monitoring timeout reached. Please check job status in Esploro.');
            return false;
          }

          // Update progress
          this.jobProgress = status.progress;
          this.jobStatusText = status.status.desc;

          // Check if job is still running
          const isRunning = ['QUEUED', 'RUNNING'].includes(status.status.value);
          if (!isRunning) {
            this.handleJobCompletion(status);
          }
          return isRunning;
        }, true)
      )
      .subscribe(
        status => {
          console.log('Job status update:', status);
        },
        error => {
          console.error('Job polling error:', error);
          this.alert.error('Failed to monitor job status. Job may still be running in Esploro.');
        }
      );
  }

  /**
   * Handle job completion and display results
   */
  private handleJobCompletion(status: any): void {
    const counters = this.parseJobCounters(status.counter || []);
    
    if (status.status.value === 'COMPLETED_SUCCESS') {
      this.alert.success(
        `Job completed successfully! Files uploaded: ${counters.fileUploaded}, Assets succeeded: ${counters.assetSucceeded}`
      );
    } else if (status.status.value === 'COMPLETED_FAILED') {
      this.alert.error(
        `Job failed! Assets failed: ${counters.assetFailed}, Files failed: ${counters.fileFailed}`
      );
    } else if (status.status.value === 'CANCELLED') {
      this.alert.warn('Job was cancelled.');
    }
  }

  /**
   * Parse job counters from API response
   */
  private parseJobCounters(counters: any[]): any {
    const findCounter = (type: string) => {
      const counter = counters.find(c => c.type?.value === type);
      return counter ? counter.value : '0';
    };

    return {
      assetSucceeded: findCounter('asset_succeeded'),
      assetFailed: findCounter('asset_failed'),
      fileUploaded: findCounter('file_uploaded'),
      fileFailed: findCounter('file_failed_to_upload')
    };
  }

  private resetFlow(): void {
    this.stage = 'stage1';
    this.stageTwoSkipped = false;
    this.assetMetadataMap.clear();
    this.createdSetId = null;
    this.jobInstanceId = null;
    this.jobProgress = 0;
    this.jobStatusText = '';
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }

    while (this.entries.length) {
      this.entries.removeAt(0);
    }

    this.entries.push(this.createEntryGroup());
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}