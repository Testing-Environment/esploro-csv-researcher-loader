import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, from, throwError, interval, Subscription, of } from 'rxjs';
import { catchError, concatMap, map, toArray, switchMap, takeWhile } from 'rxjs/operators';
import { AlertService, CloudAppEventsService } from '@exlibris/exl-cloudapp-angular-lib';
import { AssetService } from '../services/asset.service';
import { LoggerService } from '../services/logger.service';
import { AssetFileLink } from '../models/asset';
import { ProcessedAsset, FileType, AssetFileAndLinkType, AssetMetadata, AssetVerificationResult, BatchVerificationSummary, CachedAssetState } from '../models/types';
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
  showFileName = false;        // Controls File URL field visibility
  showFileDescription = false; // Controls File Description field visibility
  showIsSupplemental = false;  // Controls Is Supplemental checkbox visibility
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

  // Verification state (Phase 3.5)
  verificationResults: AssetVerificationResult[] = [];
  batchVerificationSummary: BatchVerificationSummary | null = null;
  processedAssetsCache: ProcessedAsset[] = [];
  assetCacheMap: Map<string, CachedAssetState> = new Map();

  // Layout detection
  private isExpandedView = false;
  private layoutSubscription: Subscription | null = null;

  private readonly urlPattern = /^https?:\/\//i;

  constructor(
    private fb: FormBuilder,
    private assetService: AssetService,
    private alert: AlertService,
    private logger: LoggerService,
    private eventsService: CloudAppEventsService
  ) {
    this.form = this.fb.group({
      entries: this.fb.array([this.createEntryGroup()])
    });
  }

  ngOnInit(): void {
    this.logger.lifecycle('MainComponent initialized', {
      stage: this.stage,
      toggles: {
        fileTypes: this.fileTypesToggle,
        fileName: this.showFileName,
        description: this.showFileDescription,
        supplemental: this.showIsSupplemental
      }
    });

    // Subscribe to layout changes
    this.layoutSubscription = this.eventsService.getPageMetadata().subscribe(pageInfo => {
      const previousLayout = this.isExpandedView;
      // Check if the app is in expanded view (full width)
      // Note: PageInfo may not have a layout property, so we'll use a workaround
      // For now, default to expanded view = true (we can adjust based on actual API)
      this.isExpandedView = true; // TODO: Detect actual layout when API is available
      
      if (previousLayout !== this.isExpandedView) {
        this.logger.userAction('Layout changed', {
          from: previousLayout ? 'expanded' : 'collapsed',
          to: this.isExpandedView ? 'expanded' : 'collapsed'
        });
      }
    });

    this.loadAssetFilesAndLinkTypes();
  }

  ngOnDestroy() {
    this.logger.lifecycle('MainComponent destroyed', {
      stage: this.stage,
      hasPollingSubscription: !!this.pollingSubscription
    });
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
    if (this.layoutSubscription) {
      this.layoutSubscription.unsubscribe();
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

  // Toggle handlers with logging
  toggleFileTypes(): void {
    this.fileTypesToggle = !this.fileTypesToggle;
    this.logger.userAction('File Types toggle changed', { 
      field: 'fileTypes', 
      newValue: this.fileTypesToggle,
      stage: this.stage
    });
  }

  toggleFileName(): void {
    this.showFileName = !this.showFileName;
    this.logger.userAction('File Name toggle changed', { 
      field: 'fileName', 
      newValue: this.showFileName,
      stage: this.stage
    });
  }

  toggleFileDescription(): void {
    this.showFileDescription = !this.showFileDescription;
    this.logger.userAction('File Description toggle changed', { 
      field: 'description', 
      newValue: this.showFileDescription,
      stage: this.stage
    });
  }

  toggleSupplemental(): void {
    this.showIsSupplemental = !this.showIsSupplemental;
    this.logger.userAction('Supplemental toggle changed', { 
      field: 'supplemental', 
      newValue: this.showIsSupplemental,
      stage: this.stage
    });
  }

  /**
   * Calculate number of visible form fields based on toggle states
   */
  get visibleFieldCount(): number {
    let count = 2; // Asset ID and File URL are always visible
    
    if (this.showFileName) count++;     // File Title field
    if (this.fileTypesToggle) count++;  // File Type field (in stage 1, shown when toggle ON)
    if (this.showFileDescription) count++;
    if (this.showIsSupplemental) count++;
    
    return count;
  }

  /**
   * Determine if form should stack horizontally
   * - Expanded view: always horizontal
   * - Collapsed view: horizontal only if 3 or fewer visible fields
   */
  get shouldStackHorizontally(): boolean {
    return this.isExpandedView || this.visibleFieldCount <= 3;
  }

  /**
   * Get CSS class for current layout mode
   */
  getFormLayoutClass(): string {
    if (this.shouldStackHorizontally) {
      return this.isExpandedView ? 'form-layout-expanded' : 'form-layout-collapsed';
    }
    return 'form-layout-vertical';
  }

  async specifyTypesForEachFile(): Promise<void> {
    this.logger.navigation('Stage transition initiated', { from: 'stage1', to: 'stage2' });
    
    if (this.assetValidationInProgress || this.submitting) {
      this.logger.validation('Stage transition blocked', false, { reason: 'validation in progress or submitting' });
      return;
    }

    const isValid = await this.validateStageOneEntries();
    if (!isValid) {
      this.logger.validation('Stage 1 validation failed', false);
      return;
    }

    this.logger.validation('Stage 1 validation passed', true);
    this.stageTwoSkipped = false;
    this.stage = 'stage2';
    this.logger.navigation('Stage transition completed', { from: 'stage1', to: 'stage2' });
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
    this.logger.navigation('Proceeding to validation and review', { 
      from: this.stage, 
      to: 'stage3',
      fileTypesToggle: this.fileTypesToggle 
    });
    
    if (this.assetValidationInProgress || this.submitting) {
      this.logger.validation('Navigation blocked', false, { reason: 'validation in progress or submitting' });
      return;
    }

    const isValid = await this.validateStageOneEntries();
    if (!isValid) {
      this.logger.validation('Stage 1 validation failed', false);
      return;
    }

    this.logger.validation('Stage 1 validation passed', true);
    const skippedStageTwo = !this.fileTypesToggle;

    // Only validate file types if the toggle is ON
    if (this.fileTypesToggle) {
      this.logger.validation('File type validation starting', true, { skippedStageTwo });
      if (skippedStageTwo) {
        const allAssigned = this.entries.controls.every((group: FormGroup) => this.assignDefaultType(group));
        if (!allAssigned) {
          this.logger.validation('Default file type assignment failed', false);
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
          this.logger.validation('File type validation failed', false, { reason: 'incomplete type selection' });
          this.alert.error('Please choose a file type for each entry before continuing.');
          return;
        }
      }
      this.logger.validation('File type validation passed', true);
    } else {
      this.logger.validation('File type validation skipped', true, { reason: 'toggle OFF' });
    }

    // Build payload to confirm counts
    const payload = this.buildSubmissionPayload();
    if (!payload.size) {
      this.logger.validation('Payload validation failed', false, { reason: 'no entries' });
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
    
    this.logger.navigation('Transitioned to review stage', { 
      stage: 'stage3',
      assetsCount: this.reviewAssetsCount,
      filesCount: this.reviewFilesCount,
      uniqueUrlsCount: this.reviewUniqueUrlsCount
    });
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

  /**
   * Build payload for file upload, excluding fields whose toggles are OFF
   */
  private buildFilePayload(entry: any): any {
    const payload: any = {
      mmsId: entry.assetId  // Always required
    };

    // Only include if toggle is ON
    if (this.showFileName && entry.url) {
      payload.url = entry.url;
    }

    if (this.fileTypesToggle && entry.type) {
      payload.type = entry.type;
    }

    if (this.showFileDescription && entry.description) {
      payload.description = entry.description;
    }

    if (this.showIsSupplemental) {
      payload.supplemental = entry.supplemental || false;
    }

    this.logger.dataFlow('File payload built', {
      mmsId: entry.assetId,
      includedFields: Object.keys(payload),
      toggles: {
        fileName: this.showFileName,
        fileType: this.fileTypesToggle,
        description: this.showFileDescription,
        supplemental: this.showIsSupplemental
      }
    });

    return payload;
  }

  private async executeSubmission(skippedStageTwo: boolean): Promise<void> {
    const payloadByAsset = this.buildSubmissionPayload();

    if (payloadByAsset.size === 0) {
      this.alert.error('There are no entries to submit. Please add at least one file.');
      return;
    }

    // Only validate file types if the toggle is ON
    if (this.fileTypesToggle) {
      const hasMissingTypes = Array.from(payloadByAsset.values()).some(files =>
        files.some(file => !file.type)
      );

      if (hasMissingTypes) {
        this.alert.error('One or more entries are missing file types. Please specify them before submitting.');
        return;
      }
    }

    this.submitting = true;
    this.submissionResult = null;

    try {
      // Cache asset states before processing (Phase 3.5)
      this.cacheAssetStates();

      const results = await lastValueFrom(
        from(Array.from(payloadByAsset.entries())).pipe(
          concatMap(([assetId, files]) =>
            this.assetService.addFilesToAsset(assetId, files).pipe(
              map(() => ({ assetId, count: files.length, files })),
              catchError(error => {
                // Enhanced error message with API details (already parsed by AssetService)
                const message = error?.message
                  || `Failed to queue files for asset ${assetId}. Please review the details and try again.`;
                
                this.logger.error('File addition failed for asset', { assetId, files, error });
                return throwError(() => ({ message }));
              })
            )
          ),
          toArray()
        )
      );

      const totalFiles = results.reduce((sum, item) => sum + item.count, 0);
      const uniqueAssets = results.length;

      // Store processed assets for verification (Phase 3.5)
      this.processedAssetsCache = results.map(r => ({
        mmsId: r.assetId,
        remoteUrl: r.files[0]?.url,
        status: 'success' as const
      }));

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
      this.logger.jobProcessing('Set creation skipped', { reason: 'no successful assets' });
      console.log('No successful assets to add to set');
      return;
    }

    const setName = this.assetService.generateSetName();
    const jobName = 'Import Research Assets Files';

    this.logger.jobProcessing('Starting job automation', { assetCount: assetIds.length, setName });

    try {
      // Step 1: Pre-processing notification
      this.alert.info(`Asset pre-processing successful. Creating an itemized set called "${setName}"...`);

      // Phase 3.1: Create the set
      const setDescription = 'Automated set created by Cloud App Files Loader';
      this.logger.jobProcessing('Creating set', { name: setName, description: setDescription });
      
      const setResponse = await firstValueFrom(
        this.assetService.createSet(setName, setDescription)
      );

      this.createdSetId = setResponse.id;
      this.logger.jobProcessing('Set created', { setId: setResponse.id });
      console.log(`Set created successfully: ${setResponse.id}`);

      // Notification: Set created successfully
      this.alert.success(
        `Itemized set "${setName}" successfully created with set ID: ${this.createdSetId}. Adding assets to set...`
      );

      // Phase 3.2: Add members to the set
      this.logger.jobProcessing('Adding members to set', { setId: setResponse.id, memberCount: assetIds.length });
      
      const addMembersResponse = await firstValueFrom(
        this.assetService.updateSetMembers(setResponse.id, assetIds)
      );

      const memberCount = addMembersResponse.number_of_members?.value ?? assetIds.length;
      this.logger.jobProcessing('Members added to set', { setId: setResponse.id, memberCount });
      console.log(`Added ${memberCount} member(s) to set ${setResponse.id}`);

      // Notification: Members added successfully
      this.alert.success(
        `Itemized set "${setName}" successfully updated with all ${assetIds.length} asset(s). Running the job "${jobName}"...`
      );

      // Phase 3.3: Run the import job
      this.logger.jobProcessing('Submitting import job', { setId: setResponse.id, jobName });
      
      const jobResponse = await firstValueFrom(
        this.assetService.runJob(setResponse.id)
      );

      const jobInstanceId = jobResponse.additional_info?.instance?.value || '';
      this.jobInstanceId = jobInstanceId;
      this.logger.jobProcessing('Job submitted', { jobId: jobResponse.id, instanceId: jobInstanceId });
      console.log(`Job submitted successfully. Job ID: ${jobResponse.id}, Instance: ${jobInstanceId}`);

      // Notification: Job initiated successfully
      this.alert.success(
        `Job is successfully initiated with instance ID: ${this.jobInstanceId}. Processing assets and fetching files...`
      );

      // Phase 3.4: Start polling job status
      this.logger.jobProcessing('Starting job polling', { jobId: jobResponse.id, instanceId: jobInstanceId });
      this.startJobPolling(jobResponse.id, jobInstanceId);

    } catch (error: any) {
      // Enhanced error handling with detailed information
      const errorMessage = error?.message || 'Failed to automate job submission';
      
      this.logger.error('Job automation failed', error);
      console.error('Error in job automation:', error);

      this.alert.error(errorMessage);

      // Provide recovery guidance based on where the failure occurred
      if (!this.createdSetId) {
        this.alert.warn('The set was not created. You may need to manually create a set and add the assets.');
      } else if (!this.jobInstanceId) {
        this.alert.warn(`Set "${setName}" (ID: ${this.createdSetId}) was created but job submission failed. You may need to manually run the job.`);
      }
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
   * Cache current asset states before processing (for later verification)
   */
  private cacheAssetStates(): void {
    this.assetCacheMap.clear();

    // Use forEach instead of for...of to avoid downlevelIteration issues
    this.assetMetadataMap.forEach((metadata, mmsId) => {
      this.assetCacheMap.set(mmsId, {
        mmsId,
        assetType: metadata.assetType || '',
        filesBefore: metadata.files || [],
        filesAfter: [],
        remoteUrlFromCSV: ''
      });
    });
  }

  /**
   * Handle job completion and display results
   */
  private async handleJobCompletion(status: any): Promise<void> {
    const counters = this.parseJobCounters(status.counter || []);
    
    if (status.status.value === 'COMPLETED_SUCCESS') {
      this.alert.success(
        `Job completed successfully! Files uploaded: ${counters.fileUploaded}, Assets succeeded: ${counters.assetSucceeded}`
      );

      // Trigger verification if we have processed assets
      if (this.processedAssetsCache && this.processedAssetsCache.length > 0) {
        await this.verifyAssetResults();
      }
    } else if (status.status.value === 'COMPLETED_FAILED') {
      this.alert.error(
        `Job failed! Assets failed: ${counters.assetFailed}, Files failed: ${counters.fileFailed}`
      );
    } else if (status.status.value === 'CANCELLED') {
      this.alert.warn('Job was cancelled.');
    }
  }

  /**
   * Verify asset file attachments after job completion
   */
  private async verifyAssetResults(): Promise<void> {
    if (!this.processedAssetsCache || this.processedAssetsCache.length === 0) {
      return;
    }

    this.alert.info('Verifying file attachments...');

    try {
      // Create array of verification observables
      const verificationObservables = this.processedAssetsCache.map(asset => {
        const cachedState = this.assetCacheMap.get(asset.mmsId);
        return this.assetService.verifyAssetFiles(
          asset.mmsId,
          cachedState,
          asset.remoteUrl || ''
        );
      });

      // Execute all verifications in parallel
      const results = await firstValueFrom(forkJoin(verificationObservables));
      this.verificationResults = results;

      // Generate batch summary
      this.batchVerificationSummary = this.generateBatchSummary(results);

      // Display summary to user
      this.displayVerificationSummary(this.batchVerificationSummary);

    } catch (error) {
      console.error('Verification error:', error);
      this.alert.error('Failed to verify file attachments. Please check manually.');
    }
  }

  /**
   * Generate batch verification summary
   */
  private generateBatchSummary(results: AssetVerificationResult[]): BatchVerificationSummary {
    const summary: BatchVerificationSummary = {
      totalAssets: results.length,
      verifiedSuccess: 0,
      verifiedPartial: 0,
      verifiedFailed: 0,
      unchanged: 0,
      errors: 0,
      totalFilesExpected: 0,
      totalFilesAdded: 0,
      successRate: 0,
      warnings: [],
      recommendations: []
    };

    results.forEach(result => {
      if (result.status === 'error') {
        summary.errors++;
      } else if (result.status === 'verified_success') {
        summary.verifiedSuccess++;
      } else if (result.status === 'verified_partial') {
        summary.verifiedPartial++;
      } else if (result.status === 'verified_failed') {
        summary.verifiedFailed++;
      } else if (result.status === 'unchanged') {
        summary.unchanged++;
      }

      summary.totalFilesExpected += result.filesExpected;
      summary.totalFilesAdded += result.filesAdded;

      if (result.warnings && result.warnings.length > 0) {
        summary.warnings.push(...result.warnings);
      }
    });

    // Calculate success rate
    const successfulAssets = summary.verifiedSuccess;
    summary.successRate = summary.totalAssets > 0 
      ? Math.round((successfulAssets / summary.totalAssets) * 100) 
      : 0;

    // Generate recommendations
    if (summary.verifiedFailed > 0) {
      summary.recommendations.push(
        `${summary.verifiedFailed} asset(s) failed verification. Check the detailed report for specifics.`
      );
    }
    if (summary.verifiedPartial > 0) {
      summary.recommendations.push(
        `${summary.verifiedPartial} asset(s) have partial matches. Review to ensure correct files were attached.`
      );
    }
    if (summary.unchanged > 0) {
      summary.recommendations.push(
        `${summary.unchanged} asset(s) had no file changes detected.`
      );
    }
    if (summary.errors > 0) {
      summary.recommendations.push(
        `${summary.errors} asset(s) encountered verification errors. Manual inspection recommended.`
      );
    }

    return summary;
  }

  /**
   * Display verification summary to user
   */
  private displayVerificationSummary(summary: BatchVerificationSummary): void {
    const successRate = summary.successRate;
    let message = `Verification Complete: ${summary.verifiedSuccess}/${summary.totalAssets} assets fully verified (${successRate}% success rate)`;

    if (summary.verifiedPartial > 0) {
      message += `, ${summary.verifiedPartial} partial matches`;
    }
    if (summary.verifiedFailed > 0) {
      message += `, ${summary.verifiedFailed} failed`;
    }
    if (summary.unchanged > 0) {
      message += `, ${summary.unchanged} unchanged`;
    }
    if (summary.errors > 0) {
      message += `, ${summary.errors} errors`;
    }

    if (successRate === 100 && summary.verifiedPartial === 0) {
      this.alert.success(message);
    } else if (successRate >= 80) {
      this.alert.warn(message);
    } else {
      this.alert.error(message);
    }

    // Show recommendations
    if (summary.recommendations.length > 0) {
      console.log('Verification Recommendations:', summary.recommendations);
    }
  }

  /**
   * Download verification report as CSV
   */
  downloadVerificationReport(): void {
    if (!this.verificationResults || this.verificationResults.length === 0) {
      this.alert.warn('No verification results available to download.');
      return;
    }

    const headers = [
      'MMS ID',
      'Status',
      'Files Before',
      'Files After',
      'Files Added',
      'Files Expected',
      'Verification Summary',
      'Warnings'
    ];

    const rows = this.verificationResults.map(result => {
      return [
        result.mmsId,
        result.status,
        result.filesBeforeCount.toString(),
        result.filesAfterCount.toString(),
        result.filesAdded.toString(),
        result.filesExpected.toString(),
        result.verificationSummary || '',
        result.warnings?.join('; ') || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `verification_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.alert.success('Verification report downloaded successfully.');
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
    
    // Clear verification state (Phase 3.5)
    this.verificationResults = [];
    this.batchVerificationSummary = null;
    this.processedAssetsCache = [];
    this.assetCacheMap.clear();
    
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