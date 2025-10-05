import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, from, lastValueFrom, throwError } from 'rxjs';
import { catchError, concatMap, map, toArray } from 'rxjs/operators';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { AssetService } from '../services/asset.service';
import { AssetFileLink } from '../models/asset';
import { ProcessedAsset, FileType, AssetFileAndLinkType, AssetMetadata } from '../models/types';

type ManualEntryStage = 'stage1' | 'stage2';

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

  private resetFlow(): void {
    this.stage = 'stage1';
    this.stageTwoSkipped = false;
    this.assetMetadataMap.clear();

    while (this.entries.length) {
      this.entries.removeAt(0);
    }

    this.entries.push(this.createEntryGroup());
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}