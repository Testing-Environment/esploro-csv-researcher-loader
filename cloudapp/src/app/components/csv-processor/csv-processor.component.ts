import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CloudAppRestService } from '@exlibris/exl-cloudapp-angular-lib';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  AssetMetadata
} from '../../models/types';
import { AssetService } from '../../services/asset.service';
import { firstValueFrom, lastValueFrom } from '../../utilities/rxjs-helpers';

@Component({
  selector: 'app-csv-processor',
  templateUrl: './csv-processor.component.html',
  styleUrls: ['./csv-processor.component.scss']
})
export class CSVProcessorComponent implements OnInit {
  @Input() fileTypes: FileType[] = [];
  @Input() assetFileAndLinkTypes: AssetFileAndLinkType[] = [];
  @Output() batchProcessed = new EventEmitter<ProcessedAsset[]>();
  @Output() downloadReady = new EventEmitter<string>();

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
  private pendingFieldMapping: { [key: string]: string } | null = null;

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
        worker: true,
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

    // Cache asset states before processing
    await this.cacheAssetStates(transformedData);

    // Process assets
    try {
      const processedAssets = await this.processAssets(transformedData);

      // Compare asset states after processing
      await this.compareAssetStates(processedAssets);

      // Generate MMS ID download file
      const downloadUrl = this.generateMmsIdDownload(processedAssets);

      // Emit results
      this.batchProcessed.emit(processedAssets);
      this.downloadReady.emit(downloadUrl);

      this.alertService.success(
        this.translate.instant('Success.BatchProcessed', {
          count: processedAssets.length
        })
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
   * Process individual assets using Ex Libris REST APIs
   */
  private async processAssets(assets: ProcessedAsset[]): Promise<ProcessedAsset[]> {
    const processedAssets: ProcessedAsset[] = [];

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      this.currentProcessingItem = asset.mmsId;

      try {
        // Validate MMS ID exists in Esploro
        await this.validateAsset(asset.mmsId);

        // Process file attachment if URL provided
        if (asset.remoteUrl) {
          await this.processAssetFile(asset);
        }

        asset.status = 'success';

      } catch (error: any) {
        asset.status = 'error';
        asset.errorMessage = error.message;
        console.error(`Failed to process asset ${asset.mmsId}:`, error);
      }

      processedAssets.push(asset);
      this.processedCount = i + 1;
      this.processingProgress = (this.processedCount / this.totalCount) * 100;

      // Small delay to prevent API throttling
      if (i < assets.length - 1) {
        await this.delay(100);
      }
    }

    return processedAssets;
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
   * Process asset file attachment
   */
  private async processAssetFile(asset: ProcessedAsset): Promise<void> {
    const fileData = {
      url: asset.remoteUrl,
      title: asset.fileTitle,
      description: asset.fileDescription,
      type: asset.fileType
    };

    try {
      await firstValueFrom(this.restService.call({
        url: `/esploro/v1/assets/${asset.mmsId}/files`,
        method: 'POST',
        requestBody: fileData
      } as any));

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
