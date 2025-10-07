import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { AssetService, CodeTableEntry, Asset, UrlValidationResult, BulkUpdateResult } from '../services/asset.service';
import { WorkflowService, FileEntry, AssetValidationResult, WorkflowResult } from '../services/workflow.service';
import { AssetFileLink } from '../models/asset';
import { FALLBACK_FILE_TYPES } from '../constants/file-types';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  // Stage management
  currentStage = 1;
  
  // Forms
  manualForm: FormGroup;
  stage2Form: FormGroup;
  bulkForm: FormGroup;
  urlValidationForm: FormGroup;
  
  // Validated data
  validatedEntries: FileEntry[] = [];
  validatedAssets: AssetValidationResult[] = [];
  assetFileTypes: Map<string, CodeTableEntry[]> = new Map();
  
  // State
  validating = false;
  processing = false;
  workflowResult: WorkflowResult | null = null;
  bulkSubmitting = false;
  validatingUrls = false;
  bulkUpdateResult: BulkUpdateResult[] = [];
  urlValidationResults: UrlValidationResult[] = [];
  
  // CSV
  selectedCsvFile: File | null = null;
  csvProcessing = false;
  csvResult: string | null = null;
  
  // Legacy support (kept for compatibility)
  fileTypes: CodeTableEntry[] = [];
  private readonly fallbackFileTypes: CodeTableEntry[] = FALLBACK_FILE_TYPES;

  constructor(
    private fb: FormBuilder,
    private assetService: AssetService,
    private workflowService: WorkflowService,
    private alert: AlertService
  ) {
    this.manualForm = this.fb.group({
      entries: this.fb.array([this.createEntryGroup()])
    });
    
    this.stage2Form = this.fb.group({
      fileTypes: this.fb.array([])
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
    // Load file types for legacy compatibility
    this.loadFileTypes();
  }

  get manualEntries(): FormArray {
    return this.manualForm.get('entries') as FormArray;
  }

  get stage2FileTypes(): FormArray {
    return this.stage2Form.get('fileTypes') as FormArray;
  }

  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Create a new entry form group for Stage 1
   */
  private createEntryGroup(): FormGroup {
    return this.fb.group({
      assetId: ['', Validators.required],
      title: ['', Validators.required],
      url: ['', [Validators.required, Validators.pattern(/^https?:\/\//i)]],
      description: [''],
      supplemental: [false, Validators.required]
    });
  }

  /**
   * Add a new entry row
   */
  addEntry(): void {
    this.manualEntries.push(this.createEntryGroup());
  }

  /**
   * Remove an entry row
   */
  removeEntry(index: number): void {
    if (this.manualEntries.length === 1) {
      return;
    }
    this.manualEntries.removeAt(index);
  }

  /**
   * Validate entries and proceed to Stage 2
   */
  validateAndProceed(): void {
    if (this.manualForm.invalid) {
      this.manualForm.markAllAsTouched();
      this.alert.error('Please fill in all required fields');
      return;
    }

    const entries: FileEntry[] = this.manualEntries.controls.map(control => control.value);
    const uniqueAssetIds = Array.from(new Set(entries.map(e => e.assetId)));

    this.validating = true;
    this.workflowService.validateAssets(uniqueAssetIds)
      .pipe(finalize(() => this.validating = false))
      .subscribe({
        next: (results: AssetValidationResult[]) => {
          const failedAssets = results.filter(r => !r.exists);
          
          if (failedAssets.length > 0) {
            const assetList = failedAssets.map(a => a.assetId).join(', ');
            this.alert.error(`Failed to validate assets: ${assetList}`);
            return;
          }

          this.validatedAssets = results;
          this.validatedEntries = entries;
          
          // Load file types for each asset type
          this.loadFileTypesForAssets(results).subscribe({
            next: () => {
              this.prepareStage2();
              this.currentStage = 2;
              this.alert.success('Assets validated successfully!');
            },
            error: (error) => {
              this.alert.error('Failed to load file types: ' + error.message);
            }
          });
        },
        error: (error) => {
          this.alert.error('Validation failed: ' + error.message);
        }
      });
  }

  /**
   * Load file types for validated assets
   */
  private loadFileTypesForAssets(results: AssetValidationResult[]): any {
    const uniqueTypes = Array.from(new Set(results.map(r => r.type).filter(Boolean)));
    
    return new Observable(observer => {
      // Load file types for each unique asset type
      Promise.all(
        uniqueTypes.map(type => {
          return this.assetService.getValidFileTypesForAssetType(type!)
            .toPromise()
            .then(types => {
              this.assetFileTypes.set(type!, types);
            })
            .catch(() => {
              // Use fallback on error
              this.assetFileTypes.set(type!, this.fallbackFileTypes);
            });
        })
      ).then(() => {
        observer.next();
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Prepare Stage 2 form with file type selection
   */
  private prepareStage2(): void {
    // Clear existing file type form array
    while (this.stage2FileTypes.length) {
      this.stage2FileTypes.removeAt(0);
    }

    // Add a file type control for each entry
    this.validatedEntries.forEach(() => {
      this.stage2FileTypes.push(this.fb.group({
        type: ['', Validators.required]
      }));
    });
  }

  /**
   * Get file types for a specific entry based on its asset type
   */
  getFileTypesForEntry(index: number): CodeTableEntry[] {
    const entry = this.validatedEntries[index];
    const assetValidation = this.validatedAssets.find(a => a.assetId === entry.assetId);
    
    if (assetValidation && assetValidation.type) {
      return this.assetFileTypes.get(assetValidation.type) || this.fallbackFileTypes;
    }
    
    return this.fallbackFileTypes;
  }

  /**
   * Go back to Stage 1
   */
  backToStage1(): void {
    this.currentStage = 1;
  }

  /**
   * Submit the complete workflow
   */
  submitWorkflow(): void {
    if (this.stage2Form.invalid) {
      this.stage2Form.markAllAsTouched();
      this.alert.error('Please select file types for all entries');
      return;
    }

    // Combine entries with file types
    const entriesWithTypes: FileEntry[] = this.validatedEntries.map((entry, index) => ({
      ...entry,
      type: this.stage2FileTypes.at(index).get('type')?.value
    }));

    this.processing = true;
    this.workflowService.executeWorkflow(entriesWithTypes)
      .pipe(finalize(() => this.processing = false))
      .subscribe({
        next: (result: WorkflowResult) => {
          this.workflowResult = result;
          
          if (result.success) {
            this.alert.success('Workflow completed successfully!');
          } else {
            this.alert.error('Workflow completed with errors. See details below.');
          }
        },
        error: (error) => {
          this.alert.error('Workflow failed: ' + error.message);
          this.workflowResult = {
            success: false,
            errors: [error.message]
          };
        }
      });
  }

  /**
   * Reset workflow and start over
   */
  resetWorkflow(): void {
    this.currentStage = 1;
    this.workflowResult = null;
    this.validatedEntries = [];
    this.validatedAssets = [];
    this.assetFileTypes.clear();
    
    // Reset manual form
    while (this.manualEntries.length) {
      this.manualEntries.removeAt(0);
    }
    this.manualEntries.push(this.createEntryGroup());
    this.manualForm.reset();
  }

  /**
   * Download CSV template
   */
  downloadTemplate(): void {
    const csvContent = 'assetId,title,url,description,supplemental\n' +
      '12345678900001234,Sample File,https://example.com/file.pdf,Sample description,false\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'asset_file_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Handle CSV file selection
   */
  onCsvFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedCsvFile = file;
      this.alert.info('CSV processing not yet implemented in this version');
    }
  }

  /**
   * Load file types (legacy)
   */
  private loadFileTypes(): void {
    this.assetService.getFileTypes()
      .pipe(finalize(() => {}))
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