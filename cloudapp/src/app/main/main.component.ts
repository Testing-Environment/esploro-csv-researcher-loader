import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { AssetService, CodeTableEntry, UrlValidationResult, BulkUpdateResult } from '../services/asset.service';
import { AssetFileLink } from '../models/asset';
import { FALLBACK_FILE_TYPES } from '../constants/file-types';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  form: FormGroup;
  bulkForm: FormGroup;
  urlValidationForm: FormGroup;
  fileTypes: CodeTableEntry[] = [];
  loadingFileTypes = false;
  submitting = false;
  bulkSubmitting = false;
  validatingUrls = false;
  submissionResult: { type: 'success' | 'error'; message: string } | null = null;
  bulkUpdateResult: BulkUpdateResult[] = [];
  urlValidationResults: UrlValidationResult[] = [];
  
  // View mode flags
  showBulkUpdate = false;
  showUrlValidation = false;

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

    this.bulkForm = this.fb.group({
      assetIds: ['', Validators.required],
      title: ['', Validators.required],
      url: ['', [Validators.required, Validators.pattern(/^https?:\/\//i)]],
      description: [''],
      type: ['', Validators.required],
      supplemental: [false]
    });

    this.urlValidationForm = this.fb.group({
      urls: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadFileTypes();
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
          this.fileTypes = normalized.length > 0 ? normalized : this.fallbackFileTypes;
        },
        error: () => {
          this.fileTypes = this.fallbackFileTypes;
        }
      });
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

  // Bulk update methods
  submitBulkUpdate(): void {
    if (this.bulkForm.invalid) {
      this.bulkForm.markAllAsTouched();
      return;
    }

    const assetIdsText = this.bulkForm.get('assetIds')?.value;
    const assetIds = assetIdsText
      .split('\n')
      .map((id: string) => id.trim())
      .filter((id: string) => id.length > 0);

    if (assetIds.length === 0) {
      this.alert.error('Please provide at least one asset ID.');
      return;
    }

    const file: AssetFileLink = {
      title: this.bulkForm.get('title')?.value,
      url: this.bulkForm.get('url')?.value,
      description: this.bulkForm.get('description')?.value || undefined,
      type: this.bulkForm.get('type')?.value,
      supplemental: !!this.bulkForm.get('supplemental')?.value
    };

    this.bulkSubmitting = true;
    this.bulkUpdateResult = [];

    this.assetService.bulkUpdateAssets(assetIds, file)
      .pipe(finalize(() => this.bulkSubmitting = false))
      .subscribe({
        next: (results) => {
          this.bulkUpdateResult = results;
          const successCount = results.filter(r => r.success).length;
          const failCount = results.filter(r => !r.success).length;
          
          if (failCount === 0) {
            this.alert.success(`Successfully updated ${successCount} asset${successCount === 1 ? '' : 's'}.`);
          } else if (successCount === 0) {
            this.alert.error(`Failed to update all ${failCount} asset${failCount === 1 ? '' : 's'}. See details below.`);
          } else {
            this.alert.warn(`Updated ${successCount} asset${successCount === 1 ? '' : 's'}, but ${failCount} failed. See details below.`);
          }
        },
        error: (error: any) => {
          this.alert.error(`Bulk update failed: ${error?.message || 'Unknown error'}`);
        }
      });
  }

  resetBulkForm(): void {
    this.bulkForm.reset({
      assetIds: '',
      title: '',
      url: '',
      description: '',
      type: '',
      supplemental: false
    });
    this.bulkUpdateResult = [];
  }

  // URL validation methods
  validateUrls(): void {
    if (this.urlValidationForm.invalid) {
      this.urlValidationForm.markAllAsTouched();
      return;
    }

    const urlsText = this.urlValidationForm.get('urls')?.value;
    const urls = urlsText
      .split('\n')
      .map((url: string) => url.trim())
      .filter((url: string) => url.length > 0);

    if (urls.length === 0) {
      this.alert.error('Please provide at least one URL to validate.');
      return;
    }

    this.validatingUrls = true;
    this.urlValidationResults = [];

    this.assetService.validateUrls(urls)
      .pipe(finalize(() => this.validatingUrls = false))
      .subscribe({
        next: (results) => {
          this.urlValidationResults = results;
          const accessibleCount = results.filter(r => r.accessible).length;
          const inaccessibleCount = results.filter(r => !r.accessible).length;

          if (inaccessibleCount === 0) {
            this.alert.success(`All ${accessibleCount} URL${accessibleCount === 1 ? ' is' : 's are'} accessible.`);
          } else if (accessibleCount === 0) {
            this.alert.error(`All ${inaccessibleCount} URL${inaccessibleCount === 1 ? ' is' : 's are'} inaccessible.`);
          } else {
            this.alert.warn(`${accessibleCount} URL${accessibleCount === 1 ? ' is' : 's are'} accessible, ${inaccessibleCount} ${inaccessibleCount === 1 ? 'is' : 'are'} not.`);
          }
        },
        error: (error: any) => {
          this.alert.error(`URL validation failed: ${error?.message || 'Unknown error'}`);
        }
      });
  }

  resetUrlValidation(): void {
    this.urlValidationForm.reset({ urls: '' });
    this.urlValidationResults = [];
  }
}