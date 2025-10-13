import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CloudAppRestService } from '@exlibris/exl-cloudapp-angular-lib';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, of, Observable, interval, Subscription } from 'rxjs';
import { catchError, switchMap, takeWhile, map, finalize } from 'rxjs/operators';
import * as Papa from 'papaparse';
import { 
  ColumnMapping, 
  ProcessedAsset, 
  CSVData, 
  FileType, 
  AssetFileAndLinkType,
  FileTypeConversion,
  FileTypeValidationState,
  CachedAssetState,
  AssetMetadata,
  AssetVerificationResult,
  BatchVerificationSummary
} from '../../models/types';
import { AssetService } from '../../services/asset.service';
import { firstValueFrom, lastValueFrom } from '../../utilities/rxjs-helpers';

@Component({
  selector: 'app-csv-processor',
  templateUrl: './csv-processor.component.html',
  styleUrls: ['./csv-processor.component.scss', './csv-processor.component.css']
})
export class CsvProcessorComponent implements OnInit, OnDestroy {
  @Input() fileTypes: FileType[] = [];
  @Input() assetFileAndLinkTypes: AssetFileAndLinkType[] = [];
  @Output() batchProcessed = new EventEmitter<ProcessedAsset[]>();
  @Output() downloadReady = new EventEmitter<string>();
  @Output() uploadInitiated = new EventEmitter<void>();

  // Component state
  csvData: CSVData | null = null;
  columnMappingData: ColumnMapping[] = [];
  showColumnMapping = false;
  validationErrors: string[] = [];
  displayedColumns = ['csvHeader', 'sampleValue', 'mappedField'];

  // File type validation and conversion state
  fileTypeValidation: FileTypeValidationState | null = null;
  showFileTypeConversion = false;
  fileTypeConversions: FileTypeConversion[] = [];
  conversionDisplayedColumns = ['csvValue', 'matchedTargetCode', 'matchedId', 'manualMapping'];
  unresolvedFileTypeValues: string[] = [];

  get hasPendingManualMappings(): boolean {
    return this.fileTypeConversions.some(conversion => conversion.requiresManualMapping && !conversion.matchedId);
  }

  get manualMappingRequiredCount(): number {
    return this.fileTypeConversions.filter(conversion => conversion.requiresManualMapping).length;
  }

  get autoMappedCount(): number {
    if (this.fileTypeConversions.length === 0) {
      return 0;
    }
    return this.fileTypeConversions.filter(conversion => !conversion.requiresManualMapping).length;
  }

  // Processing state
  isProcessing = false;
  processingProgress = 0;
  processedCount = 0;
  totalCount = 0;
  currentProcessingItem = '';

  // Asset state caching for before/after comparison
  assetCacheMap: Map<string, CachedAssetState> = new Map();
  // NEW: Asset batch tracking with file counts
  assetBatchMap: Map<string, { files: any[], rows: ProcessedAsset[], fileCountBefore: number, fileCountAfter?: number }> = new Map();
  private pendingFieldMapping: { [key: string]: string } | null = null;

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

  // UI state
  isDragActive = false;

  constructor(
    private restService: CloudAppRestService,
    private alertService: AlertService,
    private translate: TranslateService,
    private assetService: AssetService
  ) {}

  ngOnInit() {
    // Component initialization
  }

  ngOnDestroy() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  // File handling methods following Ex Libris patterns
  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.processFile(target.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragActive = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragActive = false;
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragActive = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  private async processFile(file: File) {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.alertService.error(this.translate.instant('Errors.InvalidFileType'));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.alertService.error(this.translate.instant('Errors.FileTooLarge'));
      return;
    }

    try {
      this.uploadInitiated.emit();

      const csvResult = await this.parseCSVFile(file);

      if (!csvResult.data || csvResult.data.length === 0) {
        this.alertService.error(this.translate.instant('Errors.EmptyFile'));
        return;
      }

      this.csvData = csvResult;
      this.generateColumnMapping();
      this.showColumnMapping = true;

      this.alertService.success(
        this.translate.instant('Success.FileUploaded', {
          records: csvResult.data.length
        })
      );

    } catch (error: any) {
      this.alertService.error(
        this.translate.instant('Errors.FileProcessing') + ': ' + error.message
      );
    }
  }

  /**
   * Parse CSV file with PapaParse for robust RFC 4180 handling
   */
  private parseCSVFile(file: File): Promise<CSVData> {
    return new Promise((resolve, reject) => {
      Papa.parse<string[]>(file, {
        skipEmptyLines: 'greedy',
        encoding: 'utf-8',
        worker: false, // Disabled to avoid CSP violations with blob URLs
        transform: value => (typeof value === 'string' ? value.trim() : value),
        complete: (result) => {
          if (result.errors && result.errors.length > 0) {
            reject(new Error(result.errors[0].message));
            return;
          }

          const rows = (result.data || []).filter(row => Array.isArray(row) && row.some(cell => (cell ?? '').toString().trim() !== ''));

          if (rows.length === 0) {
            reject(new Error('Empty file'));
            return;
          }

          const headers = rows[0].map(cell => (cell ?? '').toString());

          if (headers.length === 0 || headers.every(header => header === '')) {
            reject(new Error('No headers found'));
            return;
          }

          const data = rows.slice(1).map((row) => {
            const record: Record<string, string> = {};
            headers.forEach((header, index) => {
              const value = row[index];
              record[header] = value !== undefined && value !== null ? value.toString() : '';
            });
            return record;
          });

          resolve({ headers, data });
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        }
      });
    });
  }

  /**
   * Generate intelligent column mapping suggestions
   * Based on Ex Libris field naming conventions
   */
  private generateColumnMapping() {
    if (!this.csvData) return;

    this.columnMappingData = this.csvData.headers.map((header: string) => {
      const sampleValue = this.csvData!.data[0] ? this.csvData!.data[0][header] : '';
      const mapping = this.suggestFieldMapping(header, sampleValue);

      return {
        csvHeader: header,
        sampleValue: sampleValue || '',
        mappedField: mapping.field,
        confidence: mapping.confidence
      };
    });

    this.validateMapping();
  }

  /**
   * Intelligent field mapping based on header names and sample data
   */
  private suggestFieldMapping(header: string, sampleValue: string): { field: string, confidence: number } {
    const lowerHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    const lowerSample = (sampleValue || '').toLowerCase();

    // MMS ID detection - high priority
    if (this.matchesPattern(lowerHeader, ['mms', 'mmsid', 'id', 'assetid', 'recordid'])) {
      return { field: 'mmsId', confidence: 0.9 };
    }

    // URL detection
    if (this.matchesPattern(lowerHeader, ['url', 'link', 'href', 'uri', 'remoteurl']) ||
        lowerSample.includes('http')) {
      return { field: 'remoteUrl', confidence: 0.8 };
    }

    // Title detection
    if (this.matchesPattern(lowerHeader, ['title', 'name', 'filename', 'filetitle'])) {
      return { field: 'fileTitle', confidence: 0.8 };
    }

    // Description detection
    if (this.matchesPattern(lowerHeader, ['desc', 'description', 'summary', 'abstract'])) {
      return { field: 'fileDescription', confidence: 0.7 };
    }

    // File type detection
    if (this.matchesPattern(lowerHeader, ['type', 'format', 'extension', 'filetype', 'mimetype']) ||
        this.fileTypes.some(ft => lowerSample.includes(ft.code.toLowerCase()))) {
      return { field: 'fileType', confidence: 0.8 };
    }

    return { field: 'ignore', confidence: 0.1 };
  }

  private matchesPattern(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern));
  }

  /**
   * Validate current column mapping
   */
  validateMapping() {
    this.validationErrors = [];

    const mappedFields = this.columnMappingData.map(col => col.mappedField);

    // Check for required MMS ID and Remote URL columns
    if (!mappedFields.includes('mmsId')) {
      this.validationErrors.push(this.translate.instant('Validation.MmsIdRequired'));
    }

    if (!mappedFields.includes('remoteUrl')) {
      this.validationErrors.push(this.translate.instant('Validation.RemoteUrlRequired'));
    }

    // Check for duplicate mappings
    const duplicates = mappedFields.filter((field, index) =>
      field !== 'ignore' && field !== '' && mappedFields.indexOf(field) !== index
    );

    if (duplicates.length > 0) {
      this.validationErrors.push(
        this.translate.instant('Validation.DuplicateMappings', {
          fields: Array.from(new Set(duplicates)).join(', ')
        })
      );
    }
  }

  isValidMapping(): boolean {
    this.validateMapping();
    return this.validationErrors.length === 0;
  }

  /**
   * Validate file types in CSV against AssetFileAndLinkTypes mapping table
   * Check if values are IDs or target codes (names)
   */
  validateFileTypes(): FileTypeValidationState {
    if (!this.csvData || this.assetFileAndLinkTypes.length === 0) {
      return {
        hasInvalidTypes: false,
        conversions: [],
        autoConvertible: true
      };
    }

    // Find file type column
    const fileTypeMapping = this.columnMappingData.find(col => col.mappedField === 'fileType');
    if (!fileTypeMapping) {
      return {
        hasInvalidTypes: false,
        conversions: [],
        autoConvertible: true
      };
    }

    // Extract unique file type values from CSV
    const uniqueFileTypes = new Set<string>();
    this.csvData.data.forEach(row => {
      const value = row[fileTypeMapping.csvHeader];
      if (value && value.trim()) {
        uniqueFileTypes.add(value.trim());
      }
    });

    // Validate each unique value
    const conversions: FileTypeConversion[] = [];
    const validIds = this.assetFileAndLinkTypes.map(t => t.id);

    Array.from(uniqueFileTypes).forEach(csvValue => {
      // Check if it's already a valid ID
      if (validIds.indexOf(csvValue) !== -1) {
        conversions.push({
          csvValue,
          matchedId: csvValue,
          matchedTargetCode: this.assetFileAndLinkTypes.find(t => t.id === csvValue)?.targetCode,
          confidence: 1.0,
          requiresManualMapping: false
        });
      } else {
        // Try to match by target code (name)
        const match = this.matchFileTypeByTargetCode(csvValue);
        conversions.push(match);
      }
    });

    // Sort: successful matches first, then alphabetically
    conversions.sort((a, b) => {
      if (a.requiresManualMapping === b.requiresManualMapping) {
        return a.csvValue.localeCompare(b.csvValue);
      }
      return a.requiresManualMapping ? 1 : -1;
    });

    const hasInvalidTypes = conversions.some(c => c.requiresManualMapping || c.confidence < 1.0);
    const autoConvertible = conversions.every(c => !c.requiresManualMapping);
    this.refreshUnresolvedFileTypeValues(conversions);

    return {
      hasInvalidTypes,
      conversions,
      autoConvertible
    };
  }

  /**
   * Match CSV file type value with target_code from mapping table
   * Uses fuzzy matching with confidence scoring
   */
  private matchFileTypeByTargetCode(csvValue: string): FileTypeConversion {
    const normalizedValue = csvValue.toLowerCase().trim();
    
    // Try exact match first
    let bestMatch = this.assetFileAndLinkTypes.find(
      t => t.targetCode.toLowerCase() === normalizedValue
    );

    if (bestMatch) {
      return {
        csvValue,
        matchedTargetCode: bestMatch.targetCode,
        matchedId: bestMatch.id,
        confidence: 0.95,
        requiresManualMapping: false
      };
    }

    // Try partial match
    bestMatch = this.assetFileAndLinkTypes.find(
      t => t.targetCode.toLowerCase().indexOf(normalizedValue) !== -1 ||
           normalizedValue.indexOf(t.targetCode.toLowerCase()) !== -1
    );

    if (bestMatch) {
      return {
        csvValue,
        matchedTargetCode: bestMatch.targetCode,
        matchedId: bestMatch.id,
        confidence: 0.7,
        requiresManualMapping: false
      };
    }

    // No match found - requires manual mapping
    return {
      csvValue,
      confidence: 0,
      requiresManualMapping: true
    };
  }

  /**
   * Update manual file type mapping selection
   */
  updateManualFileTypeMapping(conversion: FileTypeConversion, selectedId: string) {
    const mappingType = this.assetFileAndLinkTypes.find(t => t.id === selectedId);
    if (mappingType) {
      conversion.matchedId = mappingType.id;
      conversion.matchedTargetCode = mappingType.targetCode;
      conversion.confidence = 0.9; // Manual selection has high confidence
      conversion.requiresManualMapping = false;
      this.refreshUnresolvedFileTypeValues(this.fileTypeConversions);
    }
  }

  /**
   * Apply file type conversions to CSV data
   */
  applyFileTypeConversions() {
    if (!this.csvData || !this.fileTypeValidation) {
      return;
    }

    // Create conversion map
    const conversionMap = new Map<string, string>();
    this.fileTypeValidation.conversions.forEach(conv => {
      if (conv.matchedId) {
        conversionMap.set(conv.csvValue, conv.matchedId);
      }
    });

    // Find file type column
    const fileTypeMapping = this.columnMappingData.find(col => col.mappedField === 'fileType');
    if (!fileTypeMapping) {
      return;
    }

    // Update CSV data
    this.csvData.data = this.csvData.data.map(row => {
      const originalValue = row[fileTypeMapping.csvHeader];
      if (originalValue && conversionMap.has(originalValue.trim())) {
        row[fileTypeMapping.csvHeader] = conversionMap.get(originalValue.trim());
      }
      return row;
    });

    this.alertService.success(
      this.translate.instant('Success.FileTypesConverted', {
        count: conversionMap.size
      })
    );

    this.showFileTypeConversion = false;
    this.fileTypeValidation = null;
    this.unresolvedFileTypeValues = [];

    // Continue with processing using last known field mapping
    this.executeBatchProcessing(this.pendingFieldMapping || undefined);
  }

  /**
   * Cancel file type conversion
   */
  cancelFileTypeConversion() {
    this.showFileTypeConversion = false;
    this.pendingFieldMapping = null;
    this.unresolvedFileTypeValues = [];
  }

  /**
   * Process mapped CSV data
   * Following Ex Libris REST service patterns
   */
  async processMappedData() {
    if (!this.isValidMapping() || !this.csvData) {
      return;
    }

    const fieldMapping = this.buildFieldMapping();
    const requiredValueValidation = this.validateRequiredFieldValues(fieldMapping);

    if (!requiredValueValidation.valid) {
      requiredValueValidation.messages.forEach(message => this.alertService.error(message));
      return;
    }

    this.pendingFieldMapping = fieldMapping;

    // Validate file types before processing
    this.fileTypeValidation = this.validateFileTypes();
    
    if (this.fileTypeValidation.hasInvalidTypes) {
      // Show conversion dialog if file types need conversion
      this.fileTypeConversions = this.fileTypeValidation.conversions;
      this.showFileTypeConversion = true;
      this.refreshUnresolvedFileTypeValues(this.fileTypeConversions);
      
      if (!this.fileTypeValidation.autoConvertible) {
        this.alertService.warn(
          this.translate.instant('Warnings.FileTypeConversionRequired')
        );
      } else {
        this.alertService.info(
          this.translate.instant('Info.FileTypeConversionAvailable')
        );
      }
      
      return; // Wait for user to confirm/adjust conversions
    }

    this.executeBatchProcessing(fieldMapping);
  }

  /**
   * Cache asset states before processing for comparison
   */
  private async cacheAssetStates(assets: ProcessedAsset[]): Promise<void> {
    // Clear previous cache
    this.assetCacheMap.clear();

    // Extract unique MMS IDs
  const uniqueMmsIds = Array.from(new Set(assets.map(a => a.mmsId).filter(id => id)));

    if (uniqueMmsIds.length === 0) {
      return;
    }

    // Fetch metadata for all assets in parallel
    const cacheRequests = uniqueMmsIds.map(mmsId => 
      this.assetService.getAssetMetadata(mmsId).pipe(
        catchError(error => {
          console.warn(`Failed to cache state for asset ${mmsId}:`, error);
          return of(null);
        })
      )
    );

    try {
  const results = await lastValueFrom(forkJoin(cacheRequests)) as (AssetMetadata | null)[];

      // Store cached states
      results?.forEach((metadata, index) => {
        if (metadata) {
          const mmsId = uniqueMmsIds[index];
          const asset = assets.find(a => a.mmsId === mmsId);
          
          this.assetCacheMap.set(mmsId, {
            mmsId: metadata.mmsId,
            assetType: metadata.assetType || '',
            filesBefore: metadata.files || [],
            filesAfter: [],
            remoteUrlFromCSV: asset?.remoteUrl || ''
          });
        }
      });

      console.log(`Cached ${this.assetCacheMap.size} asset states for comparison`);
    } catch (error) {
      console.error('Error caching asset states:', error);
      // Continue processing even if caching fails
    }
  }

  /**
   * Execute batch processing after validation
   */
  async executeBatchProcessing(fieldMappingOverride?: { [key: string]: string }) {
    if (!this.csvData) {
      return;
    }

    this.isProcessing = true;
    this.processingProgress = 0;
    this.processedCount = 0;
    this.totalCount = this.csvData.data.length;

    // Create field mapping
    const fieldMapping = fieldMappingOverride || this.pendingFieldMapping || this.buildFieldMapping();

    // Transform data
    const transformedData: ProcessedAsset[] = this.csvData.data.map((row: any) => {
      const asset: ProcessedAsset = {
        mmsId: '',
        remoteUrl: '',
        fileTitle: '',
        fileDescription: '',
        fileType: '',
        status: 'pending'
      };

      Object.keys(fieldMapping).forEach(field => {
        const csvColumn = fieldMapping[field];
        const rawValue = row[csvColumn];
        const normalizedValue = typeof rawValue === 'string' ? rawValue.trim() : rawValue;

        switch (field) {
          case 'mmsId':
            asset.mmsId = (normalizedValue || '').toString();
            break;
          case 'remoteUrl':
            asset.remoteUrl = (normalizedValue || '').toString();
            break;
          case 'fileTitle':
            asset.fileTitle = normalizedValue || '';
            break;
          case 'fileDescription':
            asset.fileDescription = normalizedValue || '';
            break;
          case 'fileType':
            asset.fileType = normalizedValue || '';
            break;
          default:
            (asset as any)[field] = normalizedValue || '';
        }
      });

      return asset;
    });

    // Process assets (groups by asset ID and batch-submits files)
    try {
      console.log(`Starting batch processing of ${transformedData.length} CSV rows...`);
      
      const processedAssets = await this.processAssets(transformedData);
      
      // Store processed assets for later reference
      this.processedAssetsCache = processedAssets;

      // Get unique asset IDs that were successfully processed
      const successfulAssetIds = Array.from(
        new Set(
          processedAssets
            .filter(a => a.status === 'success')
            .map(a => a.mmsId)
        )
      );

      console.log(`Successfully processed ${successfulAssetIds.length} unique assets`);

      // Create set with successful assets and run import job
      await this.createSetForSuccessfulAssets(processedAssets);

      // Generate MMS ID download file
      const downloadUrl = this.generateMmsIdDownload(processedAssets);

      // Emit results
      this.batchProcessed.emit(processedAssets);
      this.downloadReady.emit(downloadUrl);

      const successCount = processedAssets.filter(a => a.status === 'success').length;
      const errorCount = processedAssets.filter(a => a.status === 'error').length;
      
      this.alertService.success(
        `Batch processing complete: ${successCount} successful, ${errorCount} failed. ` +
        `Job has been submitted - check Admin > Monitor Jobs for progress.`
      );

    } catch (error: any) {
      this.alertService.error(
        this.translate.instant('Errors.BatchProcessing') + ': ' + error.message
      );
    } finally {
      this.isProcessing = false;
      this.pendingFieldMapping = null;
    }
  }

  /**
   * Process assets in 3 phases: GET counts, UPDATE via job, GET counts again
   * This matches the correct workflow: measure before, update, measure after
   */
  private async processAssets(assets: ProcessedAsset[]): Promise<ProcessedAsset[]> {
    // ============================================================================
    // PHASE 1: GET Current File Counts (BEFORE Updates)
    // ============================================================================
    console.log('\n📊 PHASE 1: Getting current file counts for all assets...');
    
    // Step 1.1: Group CSV rows by Asset ID
    this.assetBatchMap.clear(); // Clear previous data
    
    assets.forEach(asset => {
      if (!asset.mmsId) {
        console.warn('⚠️  Skipping row with missing MMS ID');
        return;
      }

      if (!this.assetBatchMap.has(asset.mmsId)) {
        this.assetBatchMap.set(asset.mmsId, { files: [], rows: [], fileCountBefore: 0 });
      }

      const batch = this.assetBatchMap.get(asset.mmsId)!;
      
      // Collect all files for this asset
      if (asset.remoteUrl) {
        batch.files.push({
          url: asset.remoteUrl,
          title: asset.fileTitle || '',
          description: asset.fileDescription || undefined,
          type: asset.fileType || undefined,
          supplemental: false
        });
      }
      
      batch.rows.push(asset);
    });

    console.log(`📦 Grouped ${assets.length} CSV rows into ${this.assetBatchMap.size} unique assets`);

    this.startPhaseOneProgress(this.assetBatchMap.size);

    // Step 1.2: GET file counts for all assets (validate + count files)
    const uniqueAssetIds = Array.from(this.assetBatchMap.keys());
    const fileCountRequests = uniqueAssetIds.map(mmsId =>
      this.restService.call(`/esploro/v1/assets/${mmsId}`).pipe(
        map((response: any) => {
          const files = response?.records?.[0]?.files || [];
          const fileCount = Array.isArray(files) ? files.length : 0;
          console.log(`  ✓ Asset ${mmsId}: ${fileCount} file(s) currently`);
          return { mmsId, fileCount, valid: true };
        }),
        catchError((error: any) => {
          if (error?.status === 404) {
            console.error(`  ✗ Asset ${mmsId}: NOT FOUND`);
            return of({ mmsId, fileCount: 0, valid: false, error: 'Asset not found' });
          }
          console.error(`  ✗ Asset ${mmsId}: ERROR - ${error.message}`);
          return of({ mmsId, fileCount: 0, valid: false, error: error.message });
        }),
        finalize(() => this.advancePhaseOneProgress(mmsId))
      )
    );

    let fileCountResults: Array<{ mmsId: string; fileCount: number; valid: boolean; error?: string }>;
    try {
      fileCountResults = await lastValueFrom(forkJoin(fileCountRequests)) as Array<{ mmsId: string; fileCount: number; valid: boolean; error?: string }>;
    } catch (error: any) {
      console.error('❌ Failed to get file counts:', error);
      throw new Error('Failed to validate assets and get file counts');
    }

    this.currentProcessingItem = '';

    // Step 1.3: Store counts and mark invalid assets as errors
    const processedAssets: ProcessedAsset[] = [];
    const invalidAssets: string[] = [];

    fileCountResults.forEach(result => {
      const batch = this.assetBatchMap.get(result.mmsId)!;
      
      if (!result.valid) {
        // Mark all rows for this invalid asset as error
        invalidAssets.push(result.mmsId);
        batch.rows.forEach((row: ProcessedAsset) => {
          row.status = 'error';
          row.errorMessage = result.error || 'Asset validation failed';
          processedAssets.push(row);
        });
      } else {
        // Store the "before" count
        batch.fileCountBefore = result.fileCount;
      }
    });

    const validAssetIds = uniqueAssetIds.filter(id => !invalidAssets.includes(id));
    
    if (validAssetIds.length === 0) {
      console.error('❌ No valid assets to process');
      return processedAssets;
    }

    console.log(`✅ Phase 1 complete: ${validAssetIds.length} valid assets, ${invalidAssets.length} invalid\n`);

    // ============================================================================
    // PHASE 2: Update Assets + Run Job (Copy from Manual Entry)
    // ============================================================================
    console.log('🔄 PHASE 2: Updating assets and running import job...');
    
    // Step 2.1: Call addFilesToAsset for each valid asset
    for (const mmsId of validAssetIds) {
      const batch = this.assetBatchMap.get(mmsId)!;
      const fileCount = batch.files.length;

      if (fileCount === 0) {
        console.log(`  ⏭️  Skipping asset ${mmsId} - no files to add`);
        batch.rows.forEach((row: ProcessedAsset) => {
          row.status = 'error';
          row.errorMessage = 'No file URL provided';
          processedAssets.push(row);
        });
        continue;
      }

      try {
        console.log(`  🔄 Queuing ${fileCount} file(s) for asset ${mmsId}...`);
        
        await firstValueFrom(
          this.assetService.addFilesToAsset(mmsId, batch.files)
        );

        console.log(`  ✅ Successfully queued ${fileCount} file(s) for asset ${mmsId}`);

        // Mark rows as success (pending job verification)
        batch.rows.forEach((row: ProcessedAsset) => {
          row.status = 'success';
          processedAssets.push(row);
        });

      } catch (error: any) {
        console.error(`  ❌ Failed to queue files for asset ${mmsId}:`, error);
        
        batch.rows.forEach((row: ProcessedAsset) => {
          row.status = 'error';
          row.errorMessage = error.message || 'Failed to queue files';
          processedAssets.push(row);
        });
      }

      await this.delay(300); // Small delay between assets
    }

    console.log(`✅ Phase 2 complete: Assets updated, job will be submitted\n`);

    return processedAssets;
  }

  private startPhaseOneProgress(totalAssets: number): void {
    this.totalCount = totalAssets;
    this.processedCount = 0;
    this.processingProgress = totalAssets === 0 ? 100 : 0;
  this.currentProcessingItem = totalAssets > 0 ? 'Queuing submitted assets...' : '';
  }

  private advancePhaseOneProgress(mmsId: string): void {
    if (this.totalCount === 0) {
      this.processingProgress = 100;
      this.currentProcessingItem = '';
      return;
    }

    this.processedCount = Math.min(this.processedCount + 1, this.totalCount);
    this.processingProgress = Math.round((this.processedCount / this.totalCount) * 100);
    this.currentProcessingItem = `Validating asset ${mmsId}`;
  }

  /**
   * Compare asset states before and after processing to identify unchanged assets
   */
  private async compareAssetStates(processedAssets: ProcessedAsset[]): Promise<void> {
    if (this.assetCacheMap.size === 0) {
      return;
    }

    // Fetch post-processing states for successfully processed assets
    const successfulAssets = processedAssets.filter(a => a.status === 'success');
    
    const comparisonRequests = successfulAssets.map(asset => 
      this.assetService.getAssetMetadata(asset.mmsId).pipe(
        catchError(error => {
          console.warn(`Failed to fetch post-processing state for ${asset.mmsId}:`, error);
          return of(null);
        })
      )
    );

    try {
  const results = await lastValueFrom(forkJoin(comparisonRequests)) as (AssetMetadata | null)[];

      results?.forEach((metadata, index) => {
        if (!metadata) return;

        const asset = successfulAssets[index];
        const cachedState = this.assetCacheMap.get(asset.mmsId);

        if (!cachedState) return;

        // Update cached state with post-processing files
        cachedState.filesAfter = metadata.files || [];

        // Compare file counts
        const filesBeforeCount = cachedState.filesBefore.length;
        const filesAfterCount = cachedState.filesAfter.length;

        // Check if the remote URL from CSV exists in the asset's files after processing
        const remoteUrlAdded = cachedState.remoteUrlFromCSV && 
          cachedState.filesAfter.some(f => f.url === cachedState.remoteUrlFromCSV);

        // Determine if asset is unchanged
        if (filesBeforeCount === filesAfterCount && !remoteUrlAdded) {
          asset.status = 'unchanged';
          asset.wasUnchanged = true;
          console.log(`Asset ${asset.mmsId} was not modified by import`);
        } else if (filesBeforeCount === filesAfterCount && remoteUrlAdded) {
          // File was added but another was possibly removed/replaced
          console.log(`Asset ${asset.mmsId} has same file count but content changed`);
        }
      });

      const unchangedCount = processedAssets.filter(a => a.wasUnchanged).length;
      if (unchangedCount > 0) {
        console.log(`Identified ${unchangedCount} potentially unchanged assets`);
      }
    } catch (error) {
      console.error('Error comparing asset states:', error);
      // Don't fail the entire process if comparison fails
    }
  }

  /**
   * Create set for job automation (Phase 3.1, 3.2 & 3.3)
   * Creates an Esploro set, adds members, and runs the import job
   */
  private async createSetForSuccessfulAssets(processedAssets: ProcessedAsset[]): Promise<void> {
    // Get unique asset IDs (multiple CSV rows may map to same asset)
    const successfulMmsIds = Array.from(
      new Set(
        processedAssets
          .filter(a => a.status === 'success')
          .map(a => a.mmsId)
      )
    );

    if (successfulMmsIds.length === 0) {
      console.log('No successful assets to add to set');
      return;
    }

    console.log(`Creating set with ${successfulMmsIds.length} unique asset(s)...`);

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
        this.assetService.updateSetMembers(setResponse.id, successfulMmsIds)
      );

      const memberCount = addMembersResponse.number_of_members?.value ?? successfulMmsIds.length;
      console.log(`Added ${memberCount} member(s) to set ${setResponse.id}`);

      // Phase 3.3: Run the import job
      const jobResponse = await firstValueFrom(
        this.assetService.runJob(setResponse.id)
      );

      const jobInstanceId = this.assetService.getJobInstanceId(jobResponse);
      const jobInstanceLink = this.assetService.getJobInstanceLink(jobResponse);

      this.jobInstanceId = jobInstanceId ?? null;

      if (!jobInstanceId) {
        console.warn('Job response did not include an instance ID.', {
          jobResponse,
          additionalInfo: jobResponse.additional_info,
          jobLink: jobResponse.link
        });
        this.alertService.warn(
          'Job automation started, but Esploro did not return a job instance ID. Please monitor the job manually in Esploro.'
        );
        if (jobInstanceLink) {
          console.info('Job instance link provided by API:', jobInstanceLink);
        }
      } else {
        console.log(`Job submitted successfully. Job ID: ${jobResponse.id}, Instance: ${jobInstanceId}`);

        // Phase 3.4: Start polling job status
        this.startJobPolling(jobResponse.id, jobInstanceId);

        this.alertService.success(
          `Job automation started! Set: ${setResponse.id}, Job Instance: ${jobInstanceId}. Monitoring job progress...`
        );
      }

    } catch (error: any) {
      console.error('Error in job automation:', error);
      const errorMessage = error?.message || 'Failed to automate job submission';
      this.alertService.error(`Job automation failed: ${errorMessage}. You may need to manually run the import job.`);
      // Don't fail the entire process if automation fails
      // User can still manually run the job using the created set
    }
  }

  /**
   * Validate asset exists using Esploro API
   */
  private async validateAsset(mmsId: string): Promise<void> {
    try {
  await firstValueFrom(this.restService.call(`/esploro/v1/assets/${mmsId}`));
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`Asset ${mmsId} not found`);
      }
      throw error;
    }
  }

  /**
   * Process asset file attachment using the correct API endpoint
   */
  private async processAssetFile(asset: ProcessedAsset): Promise<void> {
    const fileLink = {
      url: asset.remoteUrl || '',
      title: asset.fileTitle || '',
      description: asset.fileDescription,
      type: asset.fileType,
      supplemental: false
    };

    try {
      await firstValueFrom(this.assetService.addFilesToAsset(asset.mmsId, [fileLink]));

    } catch (error: any) {
      throw new Error(`Failed to process file for ${asset.mmsId}: ${error.message}`);
    }
  }

  /**
   * Generate CSV file for MMS ID download
   */
  private generateMmsIdDownload(assets: ProcessedAsset[]): string {
    const successfulAssets = assets.filter(asset => asset.status === 'success');
    const mmsIds = successfulAssets.map(asset => `"${asset.mmsId}"`);

    const csvContent = 'MMS ID\n' + mmsIds.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    return window.URL.createObjectURL(blob);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
            this.alertService.warn('Job monitoring timeout reached. Please check job status in Esploro.');
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
          this.alertService.error('Failed to monitor job status. Job may still be running in Esploro.');
        }
      );
  }

  /**
   * Handle job completion and trigger verification (Phase 3.5)
   */
  private async handleJobCompletion(status: any): Promise<void> {
    const counters = this.parseJobCounters(status.counter || []);
    
    if (status.status.value === 'COMPLETED_SUCCESS') {
      // Job completed successfully - now verify results
      this.alertService.info('Job completed! Verifying file attachments...');
      
      // Trigger verification for processed assets
      if (this.processedAssetsCache.length > 0) {
        await this.verifyAssetResults(this.processedAssetsCache);
      } else {
        this.alertService.success(
          `Job completed successfully! Files uploaded: ${counters.fileUploaded}, Assets succeeded: ${counters.assetSucceeded}`
        );
      }
      
    } else if (status.status.value === 'COMPLETED_FAILED') {
      this.alertService.error(
        `Job failed! Assets failed: ${counters.assetFailed}, Files failed: ${counters.fileFailed}`
      );
    } else if (status.status.value === 'CANCELLED') {
      this.alertService.warn('Job was cancelled.');
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

  /**
   * Perform comprehensive asset verification after job completion (Phase 3.5)
   */
  /**
   * PHASE 3: GET file counts AFTER job completes and compare with BEFORE counts
   */
  private async verifyAssetResults(processedAssets: ProcessedAsset[]): Promise<void> {
    console.log('\n📊 PHASE 3: Getting updated file counts after job completion...');
    
    if (this.assetBatchMap.size === 0) {
      console.warn('⚠️  No asset batch data available for verification');
      return;
    }

    const successfulAssets = processedAssets.filter(a => a.status === 'success');
    if (successfulAssets.length === 0) {
      console.log('No successful assets to verify');
      return;
    }

    const uniqueAssetIds = Array.from(new Set(successfulAssets.map(a => a.mmsId)));
    console.log(`Verifying ${uniqueAssetIds.length} unique assets...`);

    // Step 3.1: GET file counts again (AFTER job)
    const fileCountRequests = uniqueAssetIds.map(mmsId =>
      this.restService.call(`/esploro/v1/assets/${mmsId}`).pipe(
        map((response: any) => {
          const files = response?.records?.[0]?.files || [];
          const fileCountAfter = Array.isArray(files) ? files.length : 0;
          const batch = this.assetBatchMap.get(mmsId);
          const fileCountBefore = batch?.fileCountBefore || 0;
          
          console.log(`  📄 Asset ${mmsId}: ${fileCountBefore} → ${fileCountAfter} files (${fileCountAfter > fileCountBefore ? '+' + (fileCountAfter - fileCountBefore) : 'unchanged'})`);
          
          return { 
            mmsId, 
            fileCountBefore,
            fileCountAfter, 
            filesAdded: fileCountAfter - fileCountBefore,
            changed: fileCountAfter > fileCountBefore
          };
        }),
        catchError((error: any) => {
          console.error(`  ✗ Asset ${mmsId}: Failed to get updated count - ${error.message}`);
          return of({ mmsId, fileCountBefore: 0, fileCountAfter: 0, filesAdded: 0, changed: false, error: error.message });
        })
      )
    );

    try {
      const verificationResults = await lastValueFrom(forkJoin(fileCountRequests)) as Array<{
        mmsId: string;
        fileCountBefore: number;
        fileCountAfter: number;
        filesAdded: number;
        changed: boolean;
        error?: string;
      }>;

      // Step 3.2: Store updated counts and mark unchanged assets
      verificationResults.forEach(result => {
        const batch = this.assetBatchMap.get(result.mmsId);
        if (batch) {
          batch.fileCountAfter = result.fileCountAfter;
        }

        // Update all rows for this asset based on verification
        const assetRows = processedAssets.filter(a => a.mmsId === result.mmsId);
        assetRows.forEach((row: ProcessedAsset) => {
          if (!result.changed && !result.error) {
            // Asset was not modified
            row.status = 'unchanged';
            row.wasUnchanged = true;
            console.log(`  ⚠️  Asset ${result.mmsId} was NOT modified by job`);
          } else if (result.error) {
            row.errorMessage = `Verification failed: ${result.error}`;
          }
        });
      });

      // Step 3.3: Generate summary
      const totalAssets = uniqueAssetIds.length;
      const changedAssets = verificationResults.filter(r => r.changed).length;
      const unchangedAssets = verificationResults.filter(r => !r.changed && !r.error).length;
      const totalFilesAdded = verificationResults.reduce((sum, r) => sum + r.filesAdded, 0);

      console.log(`\n✅ Phase 3 complete:`);
      console.log(`   • ${changedAssets} assets modified`);
      console.log(`   • ${unchangedAssets} assets unchanged`);
      console.log(`   • ${totalFilesAdded} total files added\n`);

      this.alertService.success(
        `Verification complete! ${changedAssets} assets modified, ${unchangedAssets} unchanged, ${totalFilesAdded} files added.`
      );

    } catch (error) {
      console.error('❌ Phase 3 verification error:', error);
      this.alertService.warn('Could not verify all file attachments. Check individual asset results.');
    }
  }

  /**
   * OLD VERIFICATION METHOD - KEEP FOR REFERENCE BUT NOT USED
   */
  private async OLD_verifyAssetResults(processedAssets: ProcessedAsset[]): Promise<void> {
    if (this.assetCacheMap.size === 0) {
      console.warn('No cached asset states available for verification');
      return;
    }

    const successfulAssets = processedAssets.filter(a => a.status === 'success');
    if (successfulAssets.length === 0) {
      return;
    }

    this.alertService.info('Verifying file attachments...');

    // Perform verification for each asset
    const verificationRequests = successfulAssets.map(asset => {
      const cachedState = this.assetCacheMap.get(asset.mmsId);
      if (!cachedState) {
        return of(null);
      }

      return this.assetService.verifyAssetFiles(
        asset.mmsId,
        cachedState,
        asset.remoteUrl || ''
      ).pipe(
        catchError(error => {
          console.error(`Verification failed for ${asset.mmsId}:`, error);
          return of(null);
        })
      );
    });

    try {
      const results = await lastValueFrom(forkJoin(verificationRequests)) as (AssetVerificationResult | null)[];

      // Filter out null results and store
      this.verificationResults = results.filter(r => r !== null) as AssetVerificationResult[];

      // Update processedAssets with verification results
      this.verificationResults.forEach(verificationResult => {
        const asset = processedAssets.find(a => a.mmsId === verificationResult.mmsId);
        if (asset) {
          asset.verificationResult = verificationResult;
          
          // Update status based on verification
          if (verificationResult.status === 'unchanged') {
            asset.status = 'unchanged';
            asset.wasUnchanged = true;
          } else if (verificationResult.status === 'verified_failed') {
            asset.status = 'error';
            asset.errorMessage = verificationResult.verificationSummary;
          }
        }
      });

      // Generate batch summary
      this.batchVerificationSummary = this.generateBatchSummary(this.verificationResults);

      // Display verification results
      this.displayVerificationSummary(this.batchVerificationSummary);

    } catch (error) {
      console.error('Batch verification error:', error);
      this.alertService.warn('Could not verify all file attachments. Check individual asset results.');
    }
  }

  /**
   * Generate batch verification summary (Phase 3.5)
   */
  private generateBatchSummary(results: AssetVerificationResult[]): BatchVerificationSummary {
    const totalAssets = results.length;
    const verifiedSuccess = results.filter(r => r.status === 'verified_success').length;
    const verifiedPartial = results.filter(r => r.status === 'verified_partial').length;
    const verifiedFailed = results.filter(r => r.status === 'verified_failed').length;
    const unchanged = results.filter(r => r.status === 'unchanged').length;
    const errors = results.filter(r => r.status === 'error').length;

    const totalFilesExpected = results.reduce((sum, r) => sum + r.filesExpected, 0);
    const totalFilesAdded = results.reduce((sum, r) => sum + r.filesAdded, 0);

    const successRate = totalAssets > 0 
      ? ((verifiedSuccess + verifiedPartial) / totalAssets) * 100 
      : 0;

    // Collect all warnings (using reduce instead of flatMap for ES2015 compatibility)
    const warnings = results.reduce((acc, r) => acc.concat(r.warnings), [] as string[]);
    const uniqueWarnings: string[] = Array.from(new Set(warnings));

    // Generate recommendations
    const recommendations: string[] = [];
    if (verifiedFailed > 0) {
      recommendations.push(`${verifiedFailed} asset(s) failed verification. Check Esploro for file processing status.`);
    }
    if (verifiedPartial > 0) {
      recommendations.push(`${verifiedPartial} asset(s) have partial matches. Verify correct files were attached.`);
    }
    if (unchanged > 0) {
      recommendations.push(`${unchanged} asset(s) were unchanged. Files may have been already attached.`);
    }

    return {
      totalAssets,
      verifiedSuccess,
      verifiedPartial,
      verifiedFailed,
      unchanged,
      errors,
      totalFilesExpected,
      totalFilesAdded,
      successRate,
      warnings: uniqueWarnings,
      recommendations
    };
  }

  /**
   * Display verification summary to user (Phase 3.5)
   */
  private displayVerificationSummary(summary: BatchVerificationSummary): void {
    const successRate = summary.successRate.toFixed(1);
    
    if (summary.verifiedSuccess === summary.totalAssets) {
      this.alertService.success(
        `✅ All files verified! ${summary.verifiedSuccess}/${summary.totalAssets} assets successfully processed (${successRate}% success rate)`
      );
    } else if (summary.verifiedSuccess + summary.verifiedPartial === summary.totalAssets) {
      this.alertService.warn(
        `⚠️ Verification complete with warnings. ${summary.verifiedSuccess} verified, ${summary.verifiedPartial} partial matches (${successRate}% success rate)`
      );
    } else {
      this.alertService.error(
        `⚠️ Verification issues detected. ${summary.verifiedSuccess} verified, ${summary.verifiedFailed} failed, ${summary.unchanged} unchanged (${successRate}% success rate)`
      );
    }

    // Log recommendations
    if (summary.recommendations.length > 0) {
      console.log('Verification recommendations:', summary.recommendations);
    }
  }

  /**
   * Generate downloadable verification report (Phase 3.5)
   */
  downloadVerificationReport(): void {
    if (!this.verificationResults || this.verificationResults.length === 0) {
      this.alertService.warn('No verification results available to download.');
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

    const rows = this.verificationResults.map(result => [
      result.mmsId,
      result.status,
      result.filesBeforeCount.toString(),
      result.filesAfterCount.toString(),
      result.filesAdded.toString(),
      result.filesExpected.toString(),
      result.verificationSummary,
      result.warnings.join('; ')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `verification-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.alertService.success('Verification report downloaded successfully.');
  }

  resetUpload() {
    this.csvData = null;
    this.columnMappingData = [];
    this.showColumnMapping = false;
    this.validationErrors = [];
    this.isProcessing = false;
    this.processingProgress = 0;
    this.processedCount = 0;
    this.totalCount = 0;
    this.currentProcessingItem = '';
    this.fileTypeValidation = null;
    this.showFileTypeConversion = false;
    this.fileTypeConversions = [];
    this.assetCacheMap.clear();
    this.pendingFieldMapping = null;
    this.unresolvedFileTypeValues = [];
    this.createdSetId = null;
    this.jobInstanceId = null;
    this.jobProgress = 0;
    this.jobStatusText = '';
    this.verificationResults = [];
    this.batchVerificationSummary = null;
    this.processedAssetsCache = [];
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  private refreshUnresolvedFileTypeValues(conversions: FileTypeConversion[]) {
    this.unresolvedFileTypeValues = Array.from(new Set(
      conversions
        .filter(conversion => conversion.requiresManualMapping && !conversion.matchedId)
        .map(conversion => conversion.csvValue)
    ));
  }

  private buildFieldMapping(): { [key: string]: string } {
    const mapping: { [key: string]: string } = {};
    this.columnMappingData.forEach(col => {
      if (col.mappedField && col.mappedField !== 'ignore') {
        mapping[col.mappedField] = col.csvHeader;
      }
    });
    return mapping;
  }

  private validateRequiredFieldValues(fieldMapping: { [key: string]: string }): { valid: boolean; messages: string[] } {
    if (!this.csvData) {
      return { valid: false, messages: [] };
    }

    const requiredFields: Array<{ key: string; label: string }> = [
      { key: 'mmsId', label: this.translate.instant('CSV.RequiredFields.MmsId') },
      { key: 'remoteUrl', label: this.translate.instant('CSV.RequiredFields.RemoteUrl') }
    ];

    const messages: string[] = [];

    requiredFields.forEach(field => {
      const csvHeader = fieldMapping[field.key];
      if (!csvHeader) {
        messages.push(this.translate.instant('Validation.RequiredColumnMissing', {
          field: field.label
        }));
        return;
      }

      const missingRows: number[] = [];
      this.csvData!.data.forEach((row, index) => {
        const value = row[csvHeader];
        const hasValue = typeof value === 'string' ? value.trim().length > 0 : value !== undefined && value !== null;
        if (!hasValue) {
          missingRows.push(index + 2); // +2 accounts for header row and 1-based indexing
        }
      });

      if (missingRows.length > 0) {
        messages.push(this.translate.instant('Validation.RequiredFieldValuesMissing', {
          field: field.label,
          count: missingRows.length,
          rows: missingRows.slice(0, 10).join(', '),
          truncated: missingRows.length > 10
        }));
      }
    });

    return {
      valid: messages.length === 0,
      messages
    };
  }
}
