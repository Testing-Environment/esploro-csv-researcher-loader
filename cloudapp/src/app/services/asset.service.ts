import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CloudAppRestService, HttpMethod } from '@exlibris/exl-cloudapp-angular-lib';
import { AssetFileLink } from '../models/asset';
import { AssetFileAndLinkType, AssetMetadata, AssetFile } from '../models/types';

export interface AddFilesToAssetResponse {
  records?: any[];
  [key: string]: any;
}

export interface CodeTableEntry {
  value: string;
  description?: string;
}

const FILE_TYPE_CODE_TABLE = 'AssetFileType';
const ASSET_FILES_AND_LINK_TYPES_TABLE = 'AssetFileAndLinkTypes';

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
   * Get AssetFileAndLinkTypes mapping table values from Generals API
   * Returns list of valid file type categories with IDs and target codes
   */
  getAssetFilesAndLinkTypes(): Observable<AssetFileAndLinkType[]> {
    return this.restService.call({
      url: `/conf/mapping-tables/${ASSET_FILES_AND_LINK_TYPES_TABLE}`,
      method: HttpMethod.GET
    }).pipe(
      map((response: any) => {
        // Parse response - the API may return different structures
        const rows = response?.mapping_table?.rows?.row
          ?? response?.rows?.row
          ?? response?.row
          ?? [];

        const normalized = Array.isArray(rows) ? rows : [rows];

        return normalized
          .filter(Boolean)
          .map((row: any) => ({
            id: row?.id ?? row?.ID ?? '',
            targetCode: row?.target_code ?? row?.TARGET_CODE ?? '',
            sourceCode1: row?.source_code_1 ?? row?.SOURCE_CODE_1 ?? '',
            sourceCode2: row?.source_code_2 ?? row?.SOURCE_CODE_2 ?? '',
            sourceCode3: row?.source_code_3 ?? row?.SOURCE_CODE_3 ?? '',
            sourceCode4: row?.source_code_4 ?? row?.SOURCE_CODE_4 ?? '',
            sourceCode5: row?.source_code_5 ?? row?.SOURCE_CODE_5 ?? ''
          }))
          .filter((entry: AssetFileAndLinkType) => !!entry.id && !!entry.targetCode);
      })
    );
  }

  /**
   * Get asset metadata including type and current files
   * Used for pre-import caching and asset type-aware file type filtering
   */
  getAssetMetadata(mmsId: string): Observable<AssetMetadata> {
    return this.restService.call({
      url: `/esploro/v1/assets/${mmsId}`,
      method: HttpMethod.GET
    }).pipe(
      map((response: any) => {
        const record = response?.records?.[0] ?? response;
        
        // Extract asset type from various possible locations
        const assetType = record?.asset_type?.value 
          ?? record?.assetType?.value
          ?? record?.asset_type
          ?? record?.assetType
          ?? record?.type
          ?? '';

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
        console.error(`Failed to fetch metadata for asset ${mmsId}:`, error);
        return of({
          mmsId,
          assetType: '',
          files: []
        });
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
}
