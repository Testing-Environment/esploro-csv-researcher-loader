import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { CloudAppRestService, HttpMethod } from '@exlibris/exl-cloudapp-angular-lib';
import { LoggerService } from './logger.service';
import { AssetFileLink } from '../models/asset';
import {
  AssetFileAndLinkType,
  AssetMetadata,
  AssetFile,
  SetPayload,
  SetResponse,
  AddSetMembersPayload,
  AddSetMembersResponse,
  RunJobPayload,
  JobExecutionResponse,
  JobInstanceStatus,
  FileVerificationResult,
  AssetVerificationResult,
  CachedAssetState
} from '../models/types';
import { extractCategoryFromResourceType } from '../constants/asset-categories';
import { parseRestError } from '../utilities/rest-error';

export interface AddFilesToAssetResponse {
  records?: any[];
  [key: string]: any;
}

const ASSET_FILES_AND_LINK_TYPES_TABLE = 'AssetFileAndLinkTypes';

@Injectable({
  providedIn: 'root'
})
export class AssetService {

  constructor(
    private restService: CloudAppRestService,
    private logger: LoggerService
  ) { }

  addFilesToAsset(assetId: string, files: AssetFileLink[]): Observable<AddFilesToAssetResponse> {
    const payload = {
      records: [
        {
          temporary: {
            linksToExtract: files.map(file => ({
              'link.title': file.title,
              'link.url': file.url,
              ...(file.description ? { 'link.description': file.description } : {}),
              'link.type': file.type,
              'link.supplemental': String(file.supplemental)
            }))
          }
        }
      ]
    };

    this.logger.apiCall('POST /esploro/v1/assets/{id}', 'request', { assetId, filesCount: files.length, payload });

    return this.restService.call({
      url: `/esploro/v1/assets/${assetId}?op=patch&action=add`,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      requestBody: payload,
      method: HttpMethod.POST
    }).pipe(
      tap(response => this.logger.apiCall('POST /esploro/v1/assets/{id}', 'response', { assetId, response })),
      catchError(error => {
        const errorMessage = parseRestError(error, 'Add Files to Asset', this.logger);
        this.logger.error('Add files to asset failed', error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Get AssetFileAndLinkTypes mapping table values from Generals API
   * Returns list of valid file type categories with IDs and target codes
   * 
   * The API returns data in column format:
   * - column0: ID/target code (e.g., "pdf", "video", "accepted")
   * - column1: Applicability ("file", "link", or "both")
   * - column2: Asset types (comma-separated, e.g., "etd,teaching")
   */
  getAssetFilesAndLinkTypes(): Observable<AssetFileAndLinkType[]> {
    return this.restService.call({
      url: `/conf/mapping-tables/${ASSET_FILES_AND_LINK_TYPES_TABLE}`,
      method: HttpMethod.GET
    }).pipe(
      map((response: any) => {
        // Parse response - API returns row array with column0, column1, column2 format
        const rows = response?.row ?? [];
        const normalized = Array.isArray(rows) ? rows : [rows];

        return normalized
          .filter(Boolean)
          .filter((row: any) => row.enabled !== false) // Only include enabled rows
          .map((row: any) => ({
            // column0 = ID/target code (the actual file type category name)
            id: row?.column0 ?? '',
            targetCode: row?.column0 ?? '', // Same as ID for this table
            // column1 = Applicability (file, link, or both)
            sourceCode1: row?.column1 ?? '',
            // column2 = Asset types (comma-separated list)
            sourceCode2: row?.column2 ?? '',
            // Additional columns (if they exist in the future)
            sourceCode3: row?.column3 ?? '',
            sourceCode4: row?.column4 ?? '',
            sourceCode5: row?.column5 ?? ''
          }))
          .filter((entry: AssetFileAndLinkType) => !!entry.id && !!entry.targetCode);
      }),
      catchError(error => {
        console.error('Failed to load AssetFileAndLinkTypes mapping table:', error);
        this.logger.error('Get AssetFileAndLinkTypes failed', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get asset metadata including type and current files
   * Used for pre-import caching and asset type-aware file type filtering
   */
  getAssetMetadata(mmsId: string): Observable<AssetMetadata | null> {
    return this.restService.call({
      url: `/esploro/v1/assets/${mmsId}`,
      method: HttpMethod.GET
    }).pipe(
      map((response: any) => {
        const record = response?.records?.[0] ?? response;
        
        // Extract asset type from various possible locations
        // The API returns the full resource type (e.g., "publication.journalArticle")
        // We need to extract the category code (e.g., "publication") for file type filtering
        const resourceType = record?.['resourcetype.esploro']
          ?? record?.resourcetype?.esploro
          ?? record?.asset_type?.value 
          ?? record?.assetType?.value
          ?? record?.asset_type
          ?? record?.assetType
          ?? record?.type
          ?? '';

        // Extract category from full resource type (e.g., "publication.journalArticle" -> "publication")
        const assetType = extractCategoryFromResourceType(resourceType);

        // Extract title
        const title = record?.title?.value
          ?? record?.title
          ?? '';

        // Extract files/links
        const filesAndLinks = record?.files_and_links ?? record?.filesAndLinks ?? [];
        const files: AssetFile[] = (Array.isArray(filesAndLinks) ? filesAndLinks : [filesAndLinks])
          .filter(Boolean)
          .map((file: any) => ({
            id: file?.id ?? file?.link_id ?? '',
            title: file?.title?.value ?? file?.title ?? '',
            url: file?.url?.value ?? file?.url ?? '',
            type: file?.type?.value ?? file?.type ?? '',
            description: file?.description?.value ?? file?.description ?? '',
            supplemental: file?.supplemental === 'true' || file?.supplemental === true
          }));

        return {
          mmsId,
          title,
          assetType,
          files
        };
      }),
      catchError(error => {
        if (error?.status === 404) {
          return of(null);
        }

        console.error(`Failed to fetch metadata for asset ${mmsId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Filter file types based on asset type and applicability
   * Returns only file types where SOURCE_CODE_2 includes the asset's type
   */
  filterFileTypesByAssetType(
    allFileTypes: AssetFileAndLinkType[],
    assetType: string,
    applicability: 'file' | 'link' | 'both' = 'both'
  ): AssetFileAndLinkType[] {
    if (!assetType) {
      return allFileTypes; // No filtering if asset type unknown
    }

    const normalizedAssetType = assetType.toLowerCase().trim();

    return allFileTypes.filter(fileType => {
      // Check applicability (SOURCE_CODE_1)
      const sourceCode1 = (fileType.sourceCode1 || '').toLowerCase();
      if (sourceCode1 && sourceCode1 !== 'both' && sourceCode1 !== applicability) {
        return false;
      }

      // Check asset type compatibility (SOURCE_CODE_2)
      const sourceCode2 = (fileType.sourceCode2 || '').toLowerCase();
      if (!sourceCode2) {
        return true; // Include if no restriction
      }

      // SOURCE_CODE_2 is comma-separated list of asset types
      const applicableTypes = sourceCode2.split(',').map(t => t.trim());
      return applicableTypes.some(type => type === normalizedAssetType);
    });
  }

  /**
   * Generate unique set name with timestamp
   * Format: CloudApp-FilesLoaderSet-YYYY-MM-DD-HH-MM-SS
   */
  generateSetName(): string {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace('T', '-')
      .replace(/:/g, '-')
      .substring(0, 19);
    return `CloudApp-FilesLoaderSet-${timestamp}`;
  }

  /**
   * Create a set for job automation
   * POST /conf/sets
   *
   * Creates an itemized set of research assets for use in job submission.
   * The set is created empty initially; members are added via updateSetMembers().
   */
  createSet(name: string, description: string): Observable<SetResponse> {
    const payload: SetPayload = {
      name,
      description,
      type: { value: 'ITEMIZED' },
      content: { value: 'IER' },  // IER = Research assets
      private: { value: 'false' },
      status: { value: 'ACTIVE' },
      members: {
        total_record_count: '0',
        member: []
      }
    };

    this.logger.apiCall('POST /conf/sets', 'request', { name, description });

    return this.restService.call({
      url: '/conf/sets',
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      requestBody: payload
    }).pipe(
      tap(response => this.logger.apiCall('POST /conf/sets', 'response', { setId: (response as SetResponse).id })),
      map(response => response as SetResponse),
      catchError(error => {
  const errorMessage = parseRestError(error, 'Set Creation', this.logger);
        this.logger.error('Create set failed', error);
        console.error('Error creating set:', error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Add members to an existing set
   * POST /conf/sets/{setId}?op=add_members&fail_on_invalid_id=false
   *
   * Adds asset MMS IDs as members to the specified set.
   * Uses fail_on_invalid_id=false to continue adding valid IDs even if some are invalid.
   *
   * @param setId - The ID of the set to add members to
   * @param memberIds - Array of asset MMS IDs to add as members
   * @returns Observable of the updated set with member count
   */
  updateSetMembers(setId: string, memberIds: string[]): Observable<AddSetMembersResponse> {
    if (!setId || !memberIds || memberIds.length === 0) {
      return throwError(() => new Error('Set ID and member IDs are required'));
    }

    const payload: AddSetMembersPayload = {
      members: {
        member: memberIds.map(id => ({ id }))
      }
    };

    this.logger.apiCall('POST /conf/sets/{id}?op=add_members', 'request', { setId, memberCount: memberIds.length });

    return this.restService.call({
      url: `/conf/sets/${setId}?op=add_members&fail_on_invalid_id=false`,
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      requestBody: payload
    }).pipe(
      tap(response => this.logger.apiCall('POST /conf/sets/{id}?op=add_members', 'response', { 
        setId, 
        totalMembers: (response as AddSetMembersResponse).number_of_members?.value 
      })),
      map(response => response as AddSetMembersResponse),
      catchError(error => {
  const errorMessage = parseRestError(error, 'Add Members to Set', this.logger);
        this.logger.error('Update set members failed', error);
        console.error(`Error adding members to set ${setId}:`, error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Run the "Import Research Assets Files" job for a given set
   * POST /conf/jobs/{jobId}?op=run
   *
   * Submits the import job to process queued files for assets in the specified set.
   * Uses hardcoded job ID M50762 (or M50173 depending on institution).
   *
   * @param setId - The ID of the set containing assets to process
   * @param jobId - The job ID (default: 'M50762')
   * @returns Observable of the job execution response with instance ID
   */
  runJob(setId: string, jobId: string = 'M50173'): Observable<JobExecutionResponse> {
    if (!setId) {
      return throwError(() => new Error('Set ID is required'));
    }

    const jobName = 'Import Research Assets Files - via API - ' + this.generateSetName();

    const payload: RunJobPayload = {
      parameter: [
        {
          name: { value: 'set_id' },
          value: setId
        },
        {
          name: { value: 'job_name' },
          value: jobName
        }
      ]
    };

  this.logger.apiCall('POST /conf/jobs/{id}?op=run', 'request', { jobId, setId, jobName });

    return this.restService.call({
      url: `/conf/jobs/${jobId}?op=run`,
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      requestBody: payload
    }).pipe(
      tap(response => {
        const jobResponse = response as JobExecutionResponse;
        const instanceId = this.getJobInstanceId(jobResponse);

        this.logger.apiCall('POST /conf/jobs/{id}?op=run', 'response', { 
          jobId,
          instanceId,
          link: this.getJobInstanceLink(jobResponse)
        });
      }),
      map(response => response as JobExecutionResponse),
      catchError(error => {
  const errorMessage = parseRestError(error, 'Job Execution', this.logger);
        this.logger.error('Run job failed', error);
        console.error(`Error running job ${jobId} for set ${setId}:`, error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Get job instance status for monitoring
   * @param jobId Job ID (e.g., 'M50173')
   * @param instanceId Job instance ID from runJob response
   * @returns Observable of job instance status with progress and counters
   */
  getJobInstance(jobId: string = 'M50173', instanceId: string): Observable<JobInstanceStatus> {
    this.logger.apiCall('GET /conf/jobs/{id}/instances/{instanceId}', 'request', { jobId, instanceId });

    return this.restService.call({
      url: `/conf/jobs/${jobId}/instances/${instanceId}`,
      method: HttpMethod.GET
    }).pipe(
      tap(response => this.logger.apiCall('GET /conf/jobs/{id}/instances/{instanceId}', 'response', { 
        jobId, 
        instanceId,
        status: (response as JobInstanceStatus).status?.value,
        progress: (response as JobInstanceStatus).progress 
      })),
      map(response => response as JobInstanceStatus),
      catchError(error => {
        console.error(`Error fetching job instance ${instanceId}:`, error);
        return throwError(() => new Error('Failed to fetch job status'));
      })
    );
  }

  /**
   * Extract job instance ID from job execution response
   */
  getJobInstanceId(jobResponse: JobExecutionResponse | null | undefined): string | null {
    if (!jobResponse || !jobResponse.additional_info) {
      return null;
    }

    const infos = Array.isArray(jobResponse.additional_info)
      ? jobResponse.additional_info
      : [jobResponse.additional_info];

    for (const info of infos) {
      if (!info) continue;

      if (info.instance?.value) {
        return info.instance.value;
      }

      if (info.link) {
        const match = info.link.match(/instances\/(\w+)/);
        if (match?.[1]) {
          return match[1];
        }
      }

      if (info.value) {
        const match = info.value.match(/instance\s*(?:id)?\s*[:#]?\s*(\w+)/i);
        if (match?.[1]) {
          return match[1];
        }
      }
    }

    return null;
  }

  /**
   * Extract a direct link to the job instance when available
   */
  getJobInstanceLink(jobResponse: JobExecutionResponse | null | undefined): string | null {
    if (!jobResponse || !jobResponse.additional_info) {
      return jobResponse?.link ?? null;
    }

    const infos = Array.isArray(jobResponse.additional_info)
      ? jobResponse.additional_info
      : [jobResponse.additional_info];

    for (const info of infos) {
      if (info?.link) {
        return info.link;
      }
    }

    return jobResponse.link ?? null;
  }

  /**
   * Verify file attachments for a specific asset (Phase 3.5)
   * Compares cached before state with current after state
   * @param mmsId Asset MMS ID
   * @param cachedState Cached asset state before processing
   * @param expectedUrl URL that was queued for attachment
   * @returns Observable of asset verification result
   */
  verifyAssetFiles(
    mmsId: string,
    cachedState: CachedAssetState,
    expectedUrl: string
  ): Observable<AssetVerificationResult> {
    return this.getAssetMetadata(mmsId).pipe(
      map(metadata => {
        // Handle null metadata (API error or asset not found)
        if (!metadata) {
          return {
            mmsId,
            status: 'error' as const,
            filesBeforeCount: cachedState.filesBefore.length,
            filesAfterCount: 0,
            filesAdded: 0,
            filesExpected: expectedUrl ? 1 : 0,
            fileVerifications: [],
            verificationSummary: 'Failed to retrieve asset metadata',
            warnings: ['Unable to verify asset: metadata not available']
          };
        }

        const filesAfter = metadata.files || [];
        const filesBefore = cachedState.filesBefore;

        // Detailed file verification
        const verificationResult = this.performFileVerification(
          expectedUrl,
          filesBefore,
          filesAfter
        );

        const filesAdded = filesAfter.length - filesBefore.length;
        const filesExpected = expectedUrl ? 1 : 0;

        // Determine verification status
        let status: AssetVerificationResult['status'];
        if (verificationResult.wasFound && filesAdded >= filesExpected) {
          status = 'verified_success';
        } else if (verificationResult.matchType === 'partial') {
          status = 'verified_partial';
        } else if (filesAdded === 0) {
          status = 'unchanged';
        } else {
          status = 'verified_failed';
        }

        return {
          mmsId,
          status,
          filesBeforeCount: filesBefore.length,
          filesAfterCount: filesAfter.length,
          filesAdded,
          filesExpected,
          fileVerifications: [verificationResult],
          verificationSummary: this.buildVerificationSummary(verificationResult, filesAdded, filesExpected),
          warnings: this.generateVerificationWarnings(verificationResult, filesAdded, filesExpected)
        };
      }),
      catchError(error => {
        console.error(`Verification failed for ${mmsId}:`, error);
        return of({
          mmsId,
          status: 'error' as const,
          filesBeforeCount: cachedState.filesBefore.length,
          filesAfterCount: cachedState.filesBefore.length,
          filesAdded: 0,
          filesExpected: 1,
          fileVerifications: [],
          verificationSummary: `Verification failed: ${error.message}`,
          warnings: [`Unable to verify: ${error.message}`]
        });
      })
    );
  }

  /**
   * Perform detailed file verification
   * @private
   */
  private performFileVerification(
    expectedUrl: string,
    filesBefore: AssetFile[],
    filesAfter: AssetFile[]
  ): FileVerificationResult {
    // Exact URL match
    const exactMatch = filesAfter.find(f => f.url === expectedUrl);
    if (exactMatch) {
      return {
        url: expectedUrl,
        title: exactMatch.title,
        wasFound: true,
        matchType: 'exact',
        existingFile: {
          id: exactMatch.id || '',
          title: exactMatch.title,
          type: exactMatch.type,
          status: 'attached'
        },
        verificationDetails: 'File found with exact URL match'
      };
    }

    // Check if URL exists in before state (was already attached)
    const existedBefore = filesBefore.find(f => f.url === expectedUrl);
    if (existedBefore) {
      return {
        url: expectedUrl,
        wasFound: true,
        matchType: 'exact',
        existingFile: {
          id: existedBefore.id || '',
          title: existedBefore.title,
          type: existedBefore.type,
          status: 'pre-existing'
        },
        verificationDetails: 'File was already attached before import (unchanged)'
      };
    }

    // Partial match by filename
    const urlFilename = this.extractFilenameFromUrl(expectedUrl);
    const partialMatch = filesAfter.find(f => {
      const fileFilename = this.extractFilenameFromUrl(f.url || '');
      return fileFilename && urlFilename && fileFilename.toLowerCase() === urlFilename.toLowerCase();
    });

    if (partialMatch) {
      return {
        url: expectedUrl,
        title: partialMatch.title,
        wasFound: true,
        matchType: 'partial',
        existingFile: {
          id: partialMatch.id || '',
          title: partialMatch.title,
          type: partialMatch.type,
          status: 'partial-match'
        },
        verificationDetails: 'File found with matching filename but different URL'
      };
    }

    // No match found
    return {
      url: expectedUrl,
      wasFound: false,
      matchType: 'none',
      verificationDetails: 'File not found in asset after import'
    };
  }

  /**
   * Extract filename from URL
   * @private
   */
  private extractFilenameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const segments = pathname.split('/');
      return segments[segments.length - 1] || null;
    } catch {
      // If URL parsing fails, try simple extraction
      const segments = url.split('/');
      return segments[segments.length - 1] || null;
    }
  }

  /**
   * Build human-readable verification summary
   * @private
   */
  private buildVerificationSummary(
    verification: FileVerificationResult,
    filesAdded: number,
    filesExpected: number
  ): string {
    if (verification.wasFound && verification.matchType === 'exact') {
      return `✅ File successfully attached (${filesAdded}/${filesExpected} files added)`;
    } else if (verification.matchType === 'partial') {
      return `⚠️ File found with different URL (${filesAdded}/${filesExpected} files added)`;
    } else if (filesAdded === 0) {
      return `⚪ No changes detected (file may have been already attached)`;
    } else {
      return `❌ File attachment could not be verified (${filesAdded}/${filesExpected} files added)`;
    }
  }

  /**
   * Generate verification warnings
   * @private
   */
  private generateVerificationWarnings(
    verification: FileVerificationResult,
    filesAdded: number,
    filesExpected: number
  ): string[] {
    const warnings: string[] = [];

    if (!verification.wasFound && filesAdded > 0) {
      warnings.push('File was queued but URL not found in asset files. It may be processing or failed during ingestion.');
    }

    if (verification.matchType === 'partial') {
      warnings.push('File found with different URL than expected. Verify correct file was attached.');
    }

    if (filesAdded > filesExpected) {
      warnings.push(`More files added than expected (${filesAdded} vs ${filesExpected}). Additional files may have been attached.`);
    }

    if (filesAdded < filesExpected && filesAdded > 0) {
      warnings.push('Fewer files added than expected. Some files may have failed to attach.');
    }

    return warnings;
  }
}
