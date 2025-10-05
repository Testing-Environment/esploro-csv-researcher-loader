import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { AssetService, CodeTableEntry } from '../services/asset.service';
import { AssetFileLink } from '../models/asset';
import { ProcessedAsset, FileType, AssetFileAndLinkType } from '../models/types';
import { FALLBACK_FILE_TYPES } from '../constants/file-types';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  form: FormGroup;
  fileTypes: FileType[] = [];
  assetFileAndLinkTypes: AssetFileAndLinkType[] = [];  // All file type categories
  filteredFileTypes: AssetFileAndLinkType[] = [];  // Filtered by asset type
  loadingFileTypes = false;
  loadingAssetMetadata = false;
  currentAssetType: string = '';  // Cached asset type for filtering
  submitting = false;
  submissionResult: { type: 'success' | 'error'; message: string } | null = null;

  // CSV Processing state
  processedAssets: ProcessedAsset[] = [];
  mmsIdDownloadUrl: string = '';
  showResults = false;
  showWorkflowInstructions = false;

  private readonly fallbackFileTypes: CodeTableEntry[] = FALLBACK_FILE_TYPES;

  constructor(
    private fb: FormBuilder,
    private assetService: AssetService,
    private alert: AlertService
  ) {
    this.form = this.fb.group({
      assetId: ['', Validators.required],
      files: this.fb.array([this.createFileGroup()])
    });

    // Watch for asset ID changes to fetch asset type
    this.form.get('assetId')?.valueChanges.subscribe(assetId => {
      if (assetId && assetId.trim()) {
        this.loadAssetTypeAndFilterFileTypes(assetId.trim());
      } else {
        this.currentAssetType = '';
        this.filteredFileTypes = this.assetFileAndLinkTypes;
      }
    });
  }

  ngOnInit(): void {
    this.loadFileTypes();
    this.loadAssetFilesAndLinkTypes();
  }

  get files(): FormArray {
    return this.form.get('files') as FormArray;
  }

  addFile(): void {
    this.files.push(this.createFileGroup());
  }

  removeFile(index: number): void {
    if (this.files.length === 1) {
      return;
    }
    this.files.removeAt(index);
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

    this.assetService.addFilesToAsset(assetId, filesPayload)
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: () => {
          const message = `Successfully queued ${filesPayload.length} file${filesPayload.length === 1 ? '' : 's'} for asset ${assetId}.`;
          this.alert.success(message);
          this.submissionResult = { type: 'success', message };
          this.resetFiles();
        },
        error: (error: any) => {
          let message = 'Failed to add files to the asset. Please review the details and try again.';
          if (error?.status === 0) {
            message = 'Network error: Unable to reach the server. Please check your connection and try again.';
          } else if (error?.status === 400) {
            message = 'Validation error: Please check the file details and ensure all required fields are filled correctly.';
          } else if (error?.status === 403 || error?.status === 401) {
            message = 'Permission error: You do not have permission to perform this action.';
          } else if (error?.message) {
            message = error.message;
          }
          this.alert.error(message);
          this.submissionResult = { type: 'error', message };
        }
      });
  }

  trackByIndex(index: number): number {
    return index;
  }

  private createFileGroup(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      url: ['', [Validators.required, Validators.pattern(/^https?:\/\//i)]],
      description: [''],
      type: ['', Validators.required],
      supplemental: [false]
    });
  }

  private buildFilePayload(): AssetFileLink[] {
    return this.files.controls.map(control => {
      const { title, url, description, type, supplemental } = control.value;
      return {
        title,
        url,
        description: description || undefined,
        type,
        supplemental: !!supplemental
      } as AssetFileLink;
    });
  }

  private loadFileTypes(): void {
    this.loadingFileTypes = true;
    this.assetService.getFileTypes()
      .pipe(finalize(() => this.loadingFileTypes = false))
      .subscribe({
        next: (entries) => {
          const normalized = (entries ?? []).filter(entry => !!entry.value);
          const codeTableEntries = normalized.length > 0 ? normalized : this.fallbackFileTypes;
          
          // Convert to FileType format for new components
          this.fileTypes = codeTableEntries.map(entry => ({
            code: entry.value,
            description: entry.description || entry.value
          }));
        },
        error: () => {
          this.fileTypes = this.fallbackFileTypes.map(entry => ({
            code: entry.value,
            description: entry.description || entry.value
          }));
        }
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
          this.filteredFileTypes = types;  // Initially show all
        },
        error: (error) => {
          console.error('Failed to load AssetFileAndLinkTypes mapping table:', error);
          this.alert.error('Failed to load file type categories. Some features may be limited.');
        }
      });
  }

  /**
   * Load asset type and filter available file types based on compatibility
   */
  private loadAssetTypeAndFilterFileTypes(assetId: string): void {
    this.loadingAssetMetadata = true;
    
    this.assetService.getAssetMetadata(assetId)
      .pipe(finalize(() => this.loadingAssetMetadata = false))
      .subscribe({
        next: (metadata) => {
          this.currentAssetType = metadata.assetType || '';
          
          if (this.currentAssetType) {
            this.filteredFileTypes = this.assetService.filterFileTypesByAssetType(
              this.assetFileAndLinkTypes,
              this.currentAssetType,
              'both'  // Can be 'file', 'link', or 'both'
            );
          } else {
            // If asset type not found, show all file types
            this.filteredFileTypes = this.assetFileAndLinkTypes;
          }
        },
        error: (error) => {
          console.warn(`Could not load asset type for ${assetId}:`, error);
          // On error, show all file types
          this.currentAssetType = '';
          this.filteredFileTypes = this.assetFileAndLinkTypes;
        }
      });
  }

  onBatchProcessed(assets: ProcessedAsset[]) {
    this.processedAssets = assets;
    this.showResults = true;
  }

  onDownloadReady(downloadUrl: string) {
    this.mmsIdDownloadUrl = downloadUrl;
    this.showWorkflowInstructions = true;
  }

  private resetFiles(): void {
    const assetIdControl = this.form.get('assetId');
    const assetId = assetIdControl?.value;
    while (this.files.length) {
      this.files.removeAt(0);
    }
    this.files.push(this.createFileGroup());
    if (assetIdControl) {
      assetIdControl.setValue(assetId);
      assetIdControl.markAsPristine();
      assetIdControl.markAsUntouched();
    }
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}