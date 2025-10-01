import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { AssetService, CodeTableEntry } from '../services/asset.service';
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
  submissionResult: { type: 'success' | 'error'; message: string } | null = null;

  private readonly fallbackFileTypes: CodeTableEntry[] = [
    { value: 'accepted', description: 'Accepted version' },
    { value: 'submitted', description: 'Submitted version' },
    { value: 'supplementary', description: 'Supplementary material' },
    { value: 'administrative', description: 'Administrative' }
  ];

  constructor(
    private fb: FormBuilder,
    private assetService: AssetService,
    private alert: AlertService
  ) {
    this.form = this.fb.group({
      assetId: ['', Validators.required],
      files: this.fb.array([this.createFileGroup()])
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
          const message = error?.message || 'Failed to add files to the asset. Please review the details and try again.';
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
}