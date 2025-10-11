import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { from, throwError, Subscription } from 'rxjs';
import { catchError, concatMap, map, toArray } from 'rxjs/operators';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { AssetService, BatchAssetMetadataResult } from '../services/asset.service';
import { AssetFileLink } from '../models/asset';
import { ProcessedAsset, FileType, AssetFileAndLinkType, AssetMetadata, AssetFile } from '../models/types';
import { lastValueFrom } from '../utilities/rxjs-helpers';

type ManualEntryStage = 'stage1' | 'stage2';

interface ManualEntryFormValue {
  assetId: string;
  title: string;
  url: string;
  description: string;
  type: string;
  supplemental: boolean;
}

interface DeletedEntry {
  formGroup: FormGroup;
  deletedAt: Date;
  reason?: string;
}

type RowValidationState = 'valid' | 'invalid' | 'pending' | 'duplicate' | 'pendingNew' | 'validatedExisting';

interface DeletedRowSnapshot {
  url: string;
  title: string;
  description: string;
  type: string;
  supplemental: boolean;
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  form: FormGroup;
  stage: ManualEntryStage = 'stage1';
  stageTwoSkipped = false;
  assetValidationInProgress = false;
  fileTypes: FileType[] = [];
  assetFileAndLinkTypes: AssetFileAndLinkType[] = [];  // All file type categories
  submitting = false;
  submissionResult: { type: 'success' | 'error'; message: string } | null = null;
  assetMetadataMap = new Map<string, AssetMetadata>();
  private diffingList = new Map<string, AssetMetadata>();
  private retryAssetIds = new Set<string>();
  private duplicateEntryMap = new Map<string, FormGroup[]>();
  private readonly duplicateErrorKey = 'duplicateAssetUrl';
  private lastBatchValidation: BatchAssetMetadataResult | null = null;
  deletedEntries: DeletedEntry[] = [];
  exportDeletedOnSubmit = false;
  exportValidOnSubmit = false;
  exportInvalidOnSubmit = false;
  private entrySubscriptions = new Map<FormGroup, Map<string, Subscription>>();
  private lastKnownAssetIds = new WeakMap<FormGroup, string>();
  private rowValidationStates = new WeakMap<FormGroup, RowValidationState>();
  fileTypeFieldEnabled = true;
  readonly rowStateLabelMap: Record<RowValidationState, string> = {
    pending: 'ManualEntry.RowStates.Pending',
    pendingNew: 'ManualEntry.RowStates.PendingNew',
    validatedExisting: 'ManualEntry.RowStates.ValidatedExisting',
    valid: 'ManualEntry.RowStates.Valid',
    invalid: 'ManualEntry.RowStates.Invalid',
    duplicate: 'ManualEntry.RowStates.Duplicate'
  };
  readonly rowStateDescriptionMap: Record<RowValidationState, string> = {
    pending: 'ManualEntry.RowStateDescriptions.Pending',
    pendingNew: 'ManualEntry.RowStateDescriptions.PendingNew',
    validatedExisting: 'ManualEntry.RowStateDescriptions.ValidatedExisting',
    valid: 'ManualEntry.RowStateDescriptions.Valid',
    invalid: 'ManualEntry.RowStateDescriptions.Invalid',
    duplicate: 'ManualEntry.RowStateDescriptions.Duplicate'
  };
  readonly rowStateIconMap: Record<RowValidationState, string> = {
    pending: 'hourglass_empty',
    pendingNew: 'fiber_new',
    validatedExisting: 'verified',
    valid: 'check_circle',
    invalid: 'error',
    duplicate: 'warning'
  };
  readonly rowStateClassMap: Record<RowValidationState, string> = {
    pending: 'row-state--pending',
    pendingNew: 'row-state--pending-new',
    validatedExisting: 'row-state--validated-existing',
    valid: 'row-state--valid',
    invalid: 'row-state--invalid',
    duplicate: 'row-state--duplicate'
  };
  readonly existingFilePreviewLimit = 3;

  // CSV Processing state
  processedAssets: ProcessedAsset[] = [];
  mmsIdDownloadUrl: string = '';
  showResults = false;
  showWorkflowInstructions = false;

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

  get entries(): FormArray {
    return this.form.get('entries') as FormArray;
  }

  addEntry(): void {
    this.entries.push(this.createEntryGroup());
  }

  duplicateEntry(index: number): void {
    const sourceGroup = this.entries.at(index) as FormGroup;
    if (!sourceGroup) {
      return;
    }

    const sourceValue = sourceGroup.value as ManualEntryFormValue;

    const clone = this.fb.group({
      assetId: ['', Validators.required],
      title: [sourceValue.title || ''],
      url: [sourceValue.url || '', [Validators.required, Validators.pattern(this.urlPattern)]],
      description: [sourceValue.description || ''],
      type: [sourceValue.type || ''],
      supplemental: [!!sourceValue.supplemental]
    });

    this.registerEntryListeners(clone);
    this.rowValidationStates.set(clone, 'pending');
    this.entries.insert(index + 1, clone);
    this.handleUrlChange();
  }

  removeEntry(index: number): void {
    if (this.entries.length === 1) {
      return;
    }
    const group = this.entries.at(index) as FormGroup;
    const assetId = this.safeTrim(group.get('assetId')?.value);
    const hasData = this.hasPopulatedFields(group);

    this.unregisterEntryListeners(group);

    this.entries.removeAt(index);
    this.cleanupRemovedAssetTracking(assetId);

    if (hasData) {
      this.deletedEntries.push({
        formGroup: group,
        deletedAt: new Date()
      });
    }

    this.rowValidationStates.delete(group);
    this.clearDuplicateMarkers();
    this.applyDuplicateMarkers(this.detectDuplicateAssetUrlPairs());
  }

  async specifyTypesForEachFile(): Promise<void> {
    if (this.assetValidationInProgress || this.submitting) {
      return;
    }

    if (!this.fileTypeFieldEnabled) {
      await this.proceedWithoutSelectingTypes();
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

  onFileTypeToggleChange(enabled: boolean): void {
    this.fileTypeFieldEnabled = enabled;

    if (!enabled) {
      if (this.stage !== 'stage1') {
        this.stage = 'stage1';
      }
      this.applyTypeValidators(false);
      this.stageTwoSkipped = true;
    } else {
      this.stageTwoSkipped = false;
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  isAssetInvalid(index: number): boolean {
    const control = (this.entries.at(index) as FormGroup).get('assetId');
    return !!control?.errors?.['invalidAsset'];
  }

  getFilteredFileTypes(group: AbstractControl | null): AssetFileAndLinkType[] {
    const formGroup = group as FormGroup | null;
    const assetId = this.safeTrim(formGroup?.get('assetId')?.value);
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
    const group = this.fb.group({
      assetId: ['', Validators.required],
      title: [''],
      url: ['', [Validators.required, Validators.pattern(this.urlPattern)]],
      description: [''],
      type: [''],
      supplemental: [false]
    });

    this.registerEntryListeners(group);
    this.rowValidationStates.set(group, 'pending');

    return group;
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
      const message = skippedStageTwo
        ? `Successfully queued ${totalFiles} file${totalFiles === 1 ? '' : 's'} across ${uniqueAssets} asset${uniqueAssets === 1 ? '' : 's'} using default file type selections.`
        : `Successfully queued ${totalFiles} file${totalFiles === 1 ? '' : 's'} across ${uniqueAssets} asset${uniqueAssets === 1 ? '' : 's'}.`;

      this.alert.success(message);
      this.submissionResult = { type: 'success', message };

      if (this.exportDeletedOnSubmit && this.deletedEntries.length) {
        this.exportDeletedEntries();
      }

      if (this.exportValidOnSubmit) {
        this.exportValidEntries();
      }

      if (this.exportInvalidOnSubmit) {
        this.exportInvalidEntries();
      }

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

  private buildSubmissionPayload(): Map<string, AssetFileLink[]> {
    const payload = new Map<string, AssetFileLink[]>();

    this.entries.controls.forEach((group: FormGroup) => {
      const value = group.value as ManualEntryFormValue;
  const assetId = this.safeTrim(value.assetId);
  const url = this.safeTrim(value.url);

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
    this.clearDuplicateMarkers();

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
      const batchResult = await lastValueFrom(
        this.assetService.getAssetsMetadataBatch(uniqueAssetIds)
      );

      this.lastBatchValidation = batchResult;
      this.assetMetadataMap = new Map(batchResult.metadataMap);
      this.diffingList = new Map(batchResult.metadataMap);

      this.retryAssetIds.clear();
      batchResult.missingAssetIds.forEach(id => this.retryAssetIds.add(id));
      batchResult.failedAssetIds.forEach(id => this.retryAssetIds.add(id));

      const invalidAssetIndices: number[] = [];
      const invalidGroups: FormGroup[] = [];

      this.entries.controls.forEach((group: FormGroup, index: number) => {
        const assetId = this.safeTrim(group.get('assetId')?.value);

        if (!assetId) {
          return;
        }

        if (this.assetMetadataMap.has(assetId)) {
          const metadata = this.assetMetadataMap.get(assetId)!;
          this.trackAssetForDiffing(assetId, metadata);
          this.retryAssetIds.delete(assetId);
          return;
        }

        invalidAssetIndices.push(index);
        this.addToRetryList(assetId);
        invalidGroups.push(group);
      });

      invalidAssetIndices.forEach(index => {
        const group = this.entries.at(index) as FormGroup;
        const assetControl = group.get('assetId');
        if (!assetControl) {
          return;
        }
        const errors = assetControl.errors ?? {};
        assetControl.setErrors({ ...errors, invalidAsset: true });
        assetControl.markAsTouched();
        this.rowValidationStates.set(group, 'invalid');
      });

      const duplicateMap = this.detectDuplicateAssetUrlPairs();
      const duplicateIndices = this.applyDuplicateMarkers(duplicateMap);
      const duplicateGroups = duplicateIndices.map(index => this.entries.at(index) as FormGroup);
      duplicateGroups.forEach(group => this.rowValidationStates.set(group, 'duplicate'));

      this.reorderEntriesByPriority(invalidAssetIndices, duplicateIndices);

      const flaggedGroups = new Set<FormGroup>([...invalidGroups, ...duplicateGroups]);
      this.entries.controls.forEach(control => {
        const group = control as FormGroup;
        if (flaggedGroups.has(group)) {
          return;
        }

        const assetId = this.safeTrim(group.get('assetId')?.value);
        const currentState = this.rowValidationStates.get(group);

        if (assetId && this.assetMetadataMap.has(assetId)) {
          if (currentState === 'validatedExisting') {
            return;
          }
          this.rowValidationStates.set(group, 'valid');
        } else if (assetId) {
          this.rowValidationStates.set(group, 'pendingNew');
        } else {
          this.rowValidationStates.set(group, 'pending');
        }
      });

      if (invalidAssetIndices.length || duplicateIndices.length) {
        const messages: string[] = [];

        if (invalidAssetIndices.length) {
          messages.push('Some asset IDs could not be validated. They have been moved to the top for correction.');
        }

        if (duplicateIndices.length) {
          messages.push('Duplicate asset ID and URL combinations detected. Please ensure each entry is unique before continuing.');
        }

        if (batchResult.failedAssetIds.length) {
          messages.push('One or more assets could not be validated due to API errors. Please try again.');
        }

        this.alert.error(messages.join(' '));
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

  const assetIdValue = this.safeTrim(assetIdControl?.value);
  const urlValue = this.safeTrim(urlControl?.value);

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
      .map(group => this.safeTrim(group.get('assetId')?.value))
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

  private clearDuplicateMarkers(): void {
    this.duplicateEntryMap.forEach(groups => {
      groups.forEach(group => {
        this.removeError(group.get('assetId'), this.duplicateErrorKey);
        this.removeError(group.get('url'), this.duplicateErrorKey);
        this.rowValidationStates.set(group, this.computePendingState(group));
      });
    });

    this.entries.controls.forEach((control: AbstractControl) => {
      const group = control as FormGroup;
      if (!this.duplicateEntryMapHasGroup(group)) {
        this.rowValidationStates.set(group, this.computePendingState(group));
      }
    });

    this.duplicateEntryMap.clear();
  }

  private detectDuplicateAssetUrlPairs(): Map<string, FormGroup[]> {
    const duplicates = new Map<string, FormGroup[]>();

    this.entries.controls.forEach(control => {
      const group = control as FormGroup;
      const assetId = this.safeTrim(group.get('assetId')?.value);
      const url = this.safeTrim(group.get('url')?.value);

      if (!assetId || !url) {
        return;
      }

      const key = `${assetId}||${url.toLowerCase()}`;
      if (!duplicates.has(key)) {
        duplicates.set(key, []);
      }

      duplicates.get(key)!.push(group);
    });

    return new Map(
      Array.from(duplicates.entries()).filter(([, groups]) => groups.length > 1)
    );
  }

  private applyDuplicateMarkers(duplicateMap: Map<string, FormGroup[]>): number[] {
    const duplicateIndices = new Set<number>();

    duplicateMap.forEach(groups => {
      groups.forEach(group => {
        const index = this.entries.controls.indexOf(group);
        if (index >= 0) {
          duplicateIndices.add(index);
        }

        const assetControl = group.get('assetId');
        const urlControl = group.get('url');

        this.setControlError(assetControl, this.duplicateErrorKey);
        this.setControlError(urlControl, this.duplicateErrorKey);
        assetControl?.markAsTouched();
        urlControl?.markAsTouched();
        this.rowValidationStates.set(group, 'duplicate');
      });
    });

    this.duplicateEntryMap = duplicateMap;
    return Array.from(duplicateIndices).sort((a, b) => a - b);
  }

  private reorderEntriesByPriority(invalidIndices: number[], duplicateIndices: number[]): void {
    if (!invalidIndices.length && !duplicateIndices.length) {
      return;
    }

    const controls = this.entries.controls.slice() as FormGroup[];
    const invalidSet = new Set(invalidIndices);
    const duplicateSet = new Set(duplicateIndices.filter(index => !invalidSet.has(index)));

    const prioritized: FormGroup[] = [];

    invalidIndices.forEach(index => {
      const control = controls[index];
      if (control && !prioritized.includes(control)) {
        prioritized.push(control);
      }
    });

    duplicateIndices.forEach(index => {
      if (invalidSet.has(index)) {
        return;
      }
      const control = controls[index];
      if (control && !prioritized.includes(control)) {
        prioritized.push(control);
      }
    });

    const remaining = controls.filter((_, index) => !invalidSet.has(index) && !duplicateSet.has(index));

    this.replaceEntries([...prioritized, ...remaining]);
  }

  private trackAssetForDiffing(assetId: string, metadata: AssetMetadata): void {
    if (!assetId) {
      return;
    }

    this.diffingList.set(assetId, metadata);
    this.assetMetadataMap.set(assetId, metadata);
  }

  private addToRetryList(assetId: string): void {
    if (!assetId) {
      return;
    }

    this.retryAssetIds.add(assetId);
  }

  private cleanupRemovedAssetTracking(assetId: string): void {
    this.removeAssetTrackingIfUnused(assetId);
  }

  private setControlError(control: AbstractControl | null, errorKey: string): void {
    if (!control) {
      return;
    }

    const errors = control.errors ?? {};
    if (errors[errorKey]) {
      return;
    }

    control.setErrors({ ...errors, [errorKey]: true });
  }

  private removeError(control: AbstractControl | null, errorKey: string): void {
    if (!control) {
      return;
    }

    const errors = control.errors;
    if (!errors?.[errorKey]) {
      return;
    }

    const { [errorKey]: _removed, ...remaining } = errors;
    control.setErrors(Object.keys(remaining).length ? remaining : null);
    control.updateValueAndValidity({ emitEvent: false });
  }

  private safeTrim(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return value.trim();
    }

    return value.toString().trim();
  }

  private registerEntryListeners(group: FormGroup): void {
    const subscriptions = new Map<string, Subscription>();

    const assetControl = group.get('assetId');
    if (assetControl) {
      const subscription = assetControl.valueChanges.subscribe((value: string) => {
        this.onAssetIdChanged(group, this.safeTrim(value));
      });
      subscriptions.set('assetId', subscription);
    }

    const urlControl = group.get('url');
    if (urlControl) {
      const subscription = urlControl.valueChanges.subscribe(() => {
        this.handleUrlChange();
      });
      subscriptions.set('url', subscription);
    }

    const valueSubscription = group.valueChanges.subscribe(() => {
      this.removeMatchingDeletedEntries(group);
    });
    subscriptions.set('value', valueSubscription);

    this.entrySubscriptions.set(group, subscriptions);
    this.lastKnownAssetIds.set(group, this.safeTrim(group.get('assetId')?.value));
  }

  private unregisterEntryListeners(group: FormGroup): void {
    const subscriptions = this.entrySubscriptions.get(group);
    if (!subscriptions) {
      return;
    }

    subscriptions.forEach(subscription => subscription.unsubscribe());
    this.entrySubscriptions.delete(group);
  }

  private disposeAllEntryListeners(): void {
    this.entrySubscriptions.forEach(subscriptions => {
      subscriptions.forEach(subscription => subscription.unsubscribe());
    });

    this.entrySubscriptions.clear();
  }

  private onAssetIdChanged(group: FormGroup, newAssetId: string): void {
    const previousAssetId = this.lastKnownAssetIds.get(group) ?? '';

    if (newAssetId === previousAssetId) {
      return;
    }

    if (previousAssetId) {
      this.removeAssetTrackingIfUnused(previousAssetId);
    }

    if (newAssetId) {
      if (this.assetMetadataMap.has(newAssetId)) {
        const metadata = this.assetMetadataMap.get(newAssetId)!;
        this.trackAssetForDiffing(newAssetId, metadata);
        this.retryAssetIds.delete(newAssetId);
        this.rowValidationStates.set(group, 'validatedExisting');
      } else {
        this.retryAssetIds.add(newAssetId);
        this.rowValidationStates.set(group, 'pendingNew');
      }
    } else {
      this.rowValidationStates.set(group, 'pending');
    }

    this.lastKnownAssetIds.set(group, newAssetId);
    this.clearDuplicateMarkers();
    this.applyDuplicateMarkers(this.detectDuplicateAssetUrlPairs());
  }

  private handleUrlChange(): void {
    this.clearDuplicateMarkers();
    this.applyDuplicateMarkers(this.detectDuplicateAssetUrlPairs());
  }

  private removeMatchingDeletedEntries(group: FormGroup): void {
    if (!this.deletedEntries.length) {
      return;
    }

    const activeSnapshot = this.extractDeletedRowSnapshot(group);

    const filtered = this.deletedEntries.filter(entry => {
      const snapshot = this.extractDeletedRowSnapshot(entry.formGroup);
      const matches = this.compareDeletedSnapshots(activeSnapshot, snapshot);
      return !matches;
    });

    if (filtered.length !== this.deletedEntries.length) {
      this.deletedEntries = filtered;
    }
  }

  private extractDeletedRowSnapshot(group: FormGroup): DeletedRowSnapshot {
    return {
      url: this.safeTrim(group.get('url')?.value),
      title: this.safeTrim(group.get('title')?.value),
      description: this.safeTrim(group.get('description')?.value),
      type: this.safeTrim(group.get('type')?.value),
      supplemental: !!group.get('supplemental')?.value
    };
  }

  private compareDeletedSnapshots(a: DeletedRowSnapshot, b: DeletedRowSnapshot): boolean {
    return a.url === b.url
      && a.title === b.title
      && a.description === b.description
      && a.type === b.type
      && a.supplemental === b.supplemental;
  }

  private computePendingState(group: FormGroup): RowValidationState {
    const assetId = this.safeTrim(group.get('assetId')?.value);

    if (!assetId) {
      return 'pending';
    }

    if (this.assetMetadataMap.has(assetId)) {
      return 'validatedExisting';
    }

    return 'pendingNew';
  }

  private duplicateEntryMapHasGroup(group: FormGroup): boolean {
    return Array.from(this.duplicateEntryMap.values()).some(groups => groups.includes(group));
  }

  private hasPopulatedFields(group: FormGroup): boolean {
    return Object.keys(group.controls).some(key => {
      const control = group.get(key);
      if (!control) {
        return false;
      }

      const value = control.value;

      if (typeof value === 'boolean') {
        return value;
      }

      return this.safeTrim(value) !== '';
    });
  }

  private removeAssetTrackingIfUnused(assetId: string): void {
    if (!assetId) {
      return;
    }

    const stillPresent = this.entries.controls.some(group =>
      this.safeTrim((group as FormGroup).get('assetId')?.value) === assetId
    );

    if (!stillPresent) {
      this.diffingList.delete(assetId);
      this.assetMetadataMap.delete(assetId);
      this.retryAssetIds.delete(assetId);
    }
  }

  private async retryAssetValidation(): Promise<void> {
    if (!this.retryAssetIds.size || this.assetValidationInProgress) {
      return;
    }

    const pendingIds = Array.from(this.retryAssetIds);

    try {
      const result = await lastValueFrom(
        this.assetService.getAssetsMetadataBatch(pendingIds)
      );

      result.metadataMap.forEach((metadata, id) => {
        this.trackAssetForDiffing(id, metadata);
        this.retryAssetIds.delete(id);
      });
    } catch (error) {
      console.warn('Retry validation failed', error);
    }
  }

  getRowValidationState(group: FormGroup): RowValidationState | undefined {
    return this.rowValidationStates.get(group);
  }

  private resolveRowState(control: AbstractControl | null): RowValidationState {
    if (!control) {
      return 'pending';
    }

    const group = control as FormGroup;
    return this.rowValidationStates.get(group) ?? 'pending';
  }

  getRowStateClass(control: AbstractControl | null): string {
    return this.rowStateClassMap[this.resolveRowState(control)];
  }

  getRowStateLabelKey(control: AbstractControl | null): string {
    return this.rowStateLabelMap[this.resolveRowState(control)];
  }

  getRowStateTooltipKey(control: AbstractControl | null): string {
    return this.rowStateDescriptionMap[this.resolveRowState(control)];
  }

  getRowStateIcon(control: AbstractControl | null): string {
    return this.rowStateIconMap[this.resolveRowState(control)];
  }

  isRowState(control: AbstractControl | null, state: RowValidationState): boolean {
    return this.resolveRowState(control) === state;
  }

  getAssetMetadataForEntry(control: AbstractControl | null): AssetMetadata | undefined {
    const group = control as FormGroup | null;
    if (!group) {
      return undefined;
    }

    const assetId = this.safeTrim(group.get('assetId')?.value);
    if (!assetId) {
      return undefined;
    }

    return this.assetMetadataMap.get(assetId);
  }

  getExistingFileOverflowCount(metadata?: AssetMetadata): number {
    if (!metadata?.files?.length) {
      return 0;
    }

    return Math.max(metadata.files.length - this.existingFilePreviewLimit, 0);
  }

  isUrlAlreadyOnAsset(control: AbstractControl | null, metadata?: AssetMetadata): boolean {
    const group = control as FormGroup | null;
    if (!group) {
      return false;
    }

    const urlValue = this.safeTrim(group.get('url')?.value).toLowerCase();
    if (!urlValue) {
      return false;
    }

    const files = metadata?.files ?? this.getAssetMetadataForEntry(control)?.files;
    if (!files?.length) {
      return false;
    }

    return files.some((file: AssetFile) => (file.url ?? '').toLowerCase() === urlValue);
  }

  getEntryFieldValue(group: FormGroup, controlName: string): string {
    return this.safeTrim(group.get(controlName)?.value);
  }

  restoreDeletedEntry(index: number, insertIndex: number = this.entries.length): void {
    const entry = this.deletedEntries[index];
    if (!entry) {
      return;
    }

    const [removed] = this.deletedEntries.splice(index, 1);
    const group = removed.formGroup;

    this.registerEntryListeners(group);
    this.entries.insert(insertIndex, group);
    this.rowValidationStates.set(group, 'pending');
    this.handleUrlChange();
  }

  permanentlyDeleteEntry(index: number): void {
    const entry = this.deletedEntries[index];
    if (!entry) {
      return;
    }

    this.deletedEntries.splice(index, 1);
  }

  exportDeletedEntries(): void {
    const groups = this.deletedEntries.map(entry => entry.formGroup);
    if (!groups.length) {
      this.alert.info('There are no deleted entries to export.');
      return;
    }

    this.exportEntriesToCsv(groups, 'deleted-entries.csv');
  }

  exportValidEntries(): void {
    const groups = this.collectGroupsByStates(['valid', 'validatedExisting']);

    if (!groups.length) {
      this.alert.info('There are no validated entries to export.');
      return;
    }

    this.exportEntriesToCsv(groups, 'validated-entries.csv');
  }

  exportInvalidEntries(): void {
    const groups = this.collectGroupsByStates(['invalid', 'duplicate']);

    if (!groups.length) {
      this.alert.info('There are no invalid entries to export.');
      return;
    }

    this.exportEntriesToCsv(groups, 'invalid-entries.csv');
  }

  private collectGroupsByStates(states: RowValidationState[]): FormGroup[] {
    const allowed = new Set<RowValidationState>(states);

    return this.entries.controls
      .map(control => control as FormGroup)
      .filter(group => allowed.has(this.rowValidationStates.get(group) ?? 'pending'));
  }

  private exportEntriesToCsv(groups: FormGroup[], filename: string): void {
    const headers = ['Asset ID', 'File URL', 'File Title', 'Description', 'File Type', 'Supplemental'];
    const rows = groups.map(group => this.buildExportRow(group));
    const csvLines = [headers, ...rows]
      .map(row => row.map(value => this.toCsvCell(value)).join(','))
      .join('\n');

    this.triggerCsvDownload(csvLines, filename);
  }

  private buildExportRow(group: FormGroup): string[] {
    const supplemental = group.get('supplemental')?.value ? 'Yes' : 'No';

    return [
      this.safeTrim(group.get('assetId')?.value),
      this.safeTrim(group.get('url')?.value),
      this.safeTrim(group.get('title')?.value),
      this.safeTrim(group.get('description')?.value),
      this.safeTrim(group.get('type')?.value),
      supplemental
    ];
  }

  private toCsvCell(value: string): string {
    const normalized = value.replace(/"/g, '""');
    return `"${normalized}"`;
  }

  private triggerCsvDownload(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    window.URL.revokeObjectURL(url);
  }

  private assignDefaultType(group: FormGroup): boolean {
    const assetId = this.safeTrim(group.get('assetId')?.value);
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

  private resetFlow(): void {
    this.stage = 'stage1';
    this.stageTwoSkipped = false;
    this.assetMetadataMap.clear();
    this.diffingList.clear();
    this.retryAssetIds.clear();
    this.clearDuplicateMarkers();
    this.duplicateEntryMap.clear();
    this.lastBatchValidation = null;
    this.disposeAllEntryListeners();
    this.deletedEntries = [];
    this.exportDeletedOnSubmit = false;
    this.exportValidOnSubmit = false;
    this.exportInvalidOnSubmit = false;

    while (this.entries.length) {
      this.entries.removeAt(0);
    }

    this.entries.push(this.createEntryGroup());
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}