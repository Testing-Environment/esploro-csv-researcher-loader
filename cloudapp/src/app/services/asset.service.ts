import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CloudAppRestService, HttpMethod } from '@exlibris/exl-cloudapp-angular-lib';
import { AssetFileLink } from '../models/asset';

export interface AddFilesToAssetResponse {
  records?: any[];
  [key: string]: any;
}

export interface CodeTableEntry {
  value: string;
  description?: string;
}

export interface Asset {
  id: string;
  type?: { value: string; desc?: string };
  files?: AssetFile[];
  [key: string]: any;
}

export interface AssetFile {
  id?: string;
  name?: string;
  url?: string;
  type?: string;
  [key: string]: any;
}

export interface UrlValidationResult {
  url: string;
  accessible: boolean;
  status?: number;
  error?: string;
}

export interface BulkUpdateResult {
  assetId: string;
  success: boolean;
  error?: string;
}

const FILE_TYPE_CODE_TABLE = 'AssetFileType';
const ASSET_FILE_AND_LINK_TYPES_TABLE = 'AssetFileAndLinkTypes';

@Injectable({
  providedIn: 'root'
})
export class AssetService {

  constructor(
    private restService: CloudAppRestService
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

    return this.restService.call({
      url: `/esploro/v1/assets/${assetId}?op=patch&action=add`,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      requestBody: payload,
      method: HttpMethod.POST
    });
  }

  getFileTypes(): Observable<CodeTableEntry[]> {
    return this.restService.call({
      url: `/conf/code-tables/${FILE_TYPE_CODE_TABLE}?view=brief`,
      method: HttpMethod.GET
    }).pipe(
      map((response: any) => {
        const codes = response?.code_table?.codes?.code
          ?? response?.code_table?.code
          ?? response?.code_table
          ?? [];

        const normalized = Array.isArray(codes) ? codes : [codes];

        return normalized
          .filter(Boolean)
          .map((code: any) => ({
            value: code?.value ?? code?.code ?? '',
            description: code?.description ?? code?.desc ?? code?.value ?? ''
          }))
          .filter(entry => !!entry.value);
      })
    );
  }

  /**
   * Get an asset by its ID
   * @param assetId The asset ID
   * @returns Observable of the asset details
   */
  getAsset(assetId: string): Observable<Asset> {
    return this.restService.call({
      url: `/esploro/v1/assets/${assetId}`,
      method: HttpMethod.GET
    });
  }

  /**
   * Get the AssetFileAndLinkTypes mapping table
   * This maps asset types to valid file/link types
   */
  getAssetFileAndLinkTypes(): Observable<any[]> {
    return this.restService.call({
      url: `/conf/mapping-tables/${ASSET_FILE_AND_LINK_TYPES_TABLE}`,
      method: HttpMethod.GET
    }).pipe(
      map((response: any) => {
        const rows = response?.row ?? [];
        return Array.isArray(rows) ? rows : [rows];
      })
    );
  }

  /**
   * Get valid file types for a specific asset type
   * @param assetType The type of the asset
   */
  getValidFileTypesForAssetType(assetType: string): Observable<CodeTableEntry[]> {
    return this.getAssetFileAndLinkTypes().pipe(
      map((mappings: any[]) => {
        // Filter mappings for this asset type
        const validMappings = mappings.filter(
          (mapping: any) => mapping?.asset_type?.value === assetType || mapping?.asset_type === assetType
        );

        // Extract file types from the mappings
        const fileTypes = validMappings
          .map((mapping: any) => {
            const typeValue = mapping?.file_type?.value ?? mapping?.file_type;
            const typeDesc = mapping?.file_type?.desc ?? mapping?.file_type_desc ?? typeValue;
            return typeValue ? { value: typeValue, description: typeDesc } : null;
          })
          .filter(Boolean);

        return fileTypes as CodeTableEntry[];
      })
    );
  }

  /**
   * Validate URL accessibility by making a GET request
   * @param url The URL to validate
   * @returns Observable with validation result
   */
  validateUrl(url: string): Observable<UrlValidationResult> {
    return this.restService.call({
      url: url,
      method: HttpMethod.GET
    }).pipe(
      map((response: any) => ({
        url,
        accessible: true,
        status: response?.status || 200
      })),
      catchError((error: any) => {
        return of({
          url,
          accessible: false,
          status: error?.status,
          error: error?.message || 'URL is not accessible'
        });
      })
    );
  }

  /**
   * Validate multiple URLs concurrently
   * @param urls Array of URLs to validate
   * @returns Observable with array of validation results
   */
  validateUrls(urls: string[]): Observable<UrlValidationResult[]> {
    if (!urls || urls.length === 0) {
      return of([]);
    }
    
    const validationRequests = urls.map(url => this.validateUrl(url));
    return forkJoin(validationRequests);
  }

  /**
   * Bulk update multiple assets with the same file URL
   * @param assetIds Array of asset IDs to update
   * @param file File information to add to all assets
   * @returns Observable with array of update results
   */
  bulkUpdateAssets(assetIds: string[], file: AssetFileLink): Observable<BulkUpdateResult[]> {
    if (!assetIds || assetIds.length === 0) {
      return of([]);
    }

    const updateRequests = assetIds.map(assetId => 
      this.addFilesToAsset(assetId, [file]).pipe(
        map(() => ({
          assetId,
          success: true
        })),
        catchError((error: any) => {
          return of({
            assetId,
            success: false,
            error: error?.message || 'Failed to update asset'
          });
        })
      )
    );

    return forkJoin(updateRequests);
  }
}