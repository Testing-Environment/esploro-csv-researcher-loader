import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CloudAppRestService, HttpMethod } from '@exlibris/exl-cloudapp-angular-lib';
import { AssetFileLink } from '../models/asset';
import { AssetFileAndLinkType, AssetMetadata, AssetFile } from '../models/types';

export interface AddFilesToAssetResponse {
  records?: any[];
  [key: string]: any;
}

export interface BatchAssetMetadataResult {
  metadataMap: Map<string, AssetMetadata>;
  missingAssetIds: string[];
  failedAssetIds: string[];
}

const ASSET_FILES_AND_LINK_TYPES_TABLE = 'AssetFileAndLinkTypes';

@Injectable({
  providedIn: 'root'
})
export class AssetService {

  constructor(
    private restService: CloudAppRestService
  ) { }

  private extractAssetMetadata(record: any, fallbackMmsId: string): AssetMetadata {
    const resolvedId = this.resolveAssetIdentifier(record, fallbackMmsId);

    const assetType = record?.asset_type?.value
      ?? record?.assetType?.value
      ?? record?.asset_type
      ?? record?.assetType
      ?? record?.type
      ?? record?.resourceTypeEsploroWithDesc?.value
      ?? record?.resourceType?.value
      ?? '';

    const title = record?.title?.value
      ?? record?.title
      ?? record?.name
      ?? '';

    const files = this.extractFilesFromRecord(record);

    return {
      mmsId: resolvedId,
      title,
      assetType,
      files
    };
  }

  private extractFilesFromRecord(record: any): AssetFile[] {
    const results: AssetFile[] = [];

    const filesAndLinks = record?.files_and_links ?? record?.filesAndLinks;
    const normalizedFilesAndLinks = Array.isArray(filesAndLinks)
      ? filesAndLinks
      : filesAndLinks ? [filesAndLinks] : [];

    normalizedFilesAndLinks
      .filter(Boolean)
      .forEach((file: any) => {
        results.push({
          id: file?.id ?? file?.link_id ?? '',
          title: file?.title?.value ?? file?.title ?? '',
          url: file?.url?.value ?? file?.url ?? '',
          type: file?.type?.value ?? file?.type ?? '',
          description: file?.description?.value ?? file?.description ?? '',
          supplemental: file?.supplemental === 'true' || file?.supplemental === true
        });
      });

    const alternativeFiles = record?.files ?? [];
    const normalizedAltFiles = Array.isArray(alternativeFiles)
      ? alternativeFiles
      : alternativeFiles ? [alternativeFiles] : [];

    normalizedAltFiles
      .filter(Boolean)
      .forEach((file: any) => {
        const urlCandidate = file?.url
          ?? file?.fileDownloadUrl
          ?? file?.['file.downloadUrl']
          ?? file?.['file.persistent.url']
          ?? file?.['file.url']
          ?? '';

        const supplementalCandidate = file?.supplemental
          ?? file?.['file.supplemental']
          ?? file?.['file.supplementalFlag'];

        results.push({
          id: file?.id ?? file?.['file.id'] ?? file?.link_id ?? '',
          title: file?.title ?? file?.['file.displayName'] ?? file?.['file.name'] ?? '',
          url: typeof urlCandidate === 'string' ? urlCandidate : urlCandidate?.value ?? '',
          type: file?.type ?? file?.['file.type'] ?? file?.fileTypeWithDesc?.value ?? '',
          description: file?.description ?? file?.['file.description'] ?? '',
          supplemental: supplementalCandidate === 'yes'
            || supplementalCandidate === true
            || supplementalCandidate === 'true'
        });
      });

    return results;
  }

  private resolveAssetIdentifier(record: any, fallback: string): string {
    const candidates = [
      record?.mmsId,
      record?.mms_id,
      record?.id,
      record?.assetId,
      record?.asset_id,
      record?.originalRepository?.assetId,
      record?.['originalRepository.assetId'],
      fallback
    ];

    const cleaned = candidates
      .map(value => typeof value === 'string' ? value.trim() : '')
      .filter(value => !!value);

    return cleaned[0] ?? fallback;
  }

  private normalizeRecords(response: any): any[] {
    if (!response) {
      return [];
    }

    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.records)) {
      return response.records;
    }

    if (response.records) {
      return [response.records];
    }

    if (Array.isArray(response.record)) {
      return response.record;
    }

    if (response.record) {
      return [response.record];
    }

    return [response];
  }

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
  getAssetMetadata(mmsId: string): Observable<AssetMetadata | null> {
    return this.restService.call({
      url: `/esploro/v1/assets/${mmsId}`,
      method: HttpMethod.GET
    }).pipe(
      map((response: any) => {
        const record = this.normalizeRecords(response)[0];
        if (!record) {
          return null;
        }

        return this.extractAssetMetadata(record, mmsId);
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

  getAssetsMetadataBatch(assetIds: string[], chunkSize = 10): Observable<BatchAssetMetadataResult> {
    const uniqueIds = Array.from(new Set(
      assetIds
        .map(id => (id ?? '').toString().trim())
        .filter(id => !!id)
    ));

    if (!uniqueIds.length) {
      return of({
        metadataMap: new Map<string, AssetMetadata>(),
        missingAssetIds: [],
        failedAssetIds: []
      });
    }

    const chunkedIds: string[][] = [];
    for (let index = 0; index < uniqueIds.length; index += chunkSize) {
      chunkedIds.push(uniqueIds.slice(index, index + chunkSize));
    }

    const requests = chunkedIds.map(chunk =>
      this.restService.call({
        url: `/esploro/v1/assets/${encodeURIComponent(chunk.join(','))}`,
        method: HttpMethod.GET
      }).pipe(
        map((response: any) => this.parseBatchResponse(response, chunk)),
        catchError(error => {
          console.error(`Failed to fetch metadata for assets [${chunk.join(', ')}]:`, error);
          return of({
            metadata: new Map<string, AssetMetadata>(),
            missingIds: [] as string[],
            failedIds: chunk
          });
        })
      )
    );

    return forkJoin(requests).pipe(
      map(results => {
        const metadataMap = new Map<string, AssetMetadata>();
        const missingAssetIds = new Set<string>();
        const failedAssetIds = new Set<string>();

        results.forEach(result => {
          if (result.failedIds && result.failedIds.length) {
            result.failedIds.forEach(id => failedAssetIds.add(id));
            return;
          }

          result.metadata.forEach((metadata, id) => {
            metadataMap.set(id, metadata);
          });

          result.missingIds.forEach(id => missingAssetIds.add(id));
        });

        uniqueIds.forEach(id => {
          if (!metadataMap.has(id) && !failedAssetIds.has(id)) {
            missingAssetIds.add(id);
          }
        });

        return {
          metadataMap,
          missingAssetIds: Array.from(missingAssetIds),
          failedAssetIds: Array.from(failedAssetIds)
        };
      })
    );
  }

  private parseBatchResponse(response: any, requestedIds: string[]): { metadata: Map<string, AssetMetadata>; missingIds: string[]; failedIds?: string[] } {
    const metadata = new Map<string, AssetMetadata>();

    const records = this.normalizeRecords(response);
    const matchedIds = new Set<string>();

    records
      .filter(Boolean)
      .forEach(record => {
        const resolvedId = this.resolveAssetIdentifier(record, requestedIds[0]);
        const metadataEntry = this.extractAssetMetadata(record, resolvedId);

        metadata.set(resolvedId, metadataEntry);
        matchedIds.add(resolvedId);
      });

    const missingIds = requestedIds.filter(id => !matchedIds.has(id));

    return {
      metadata,
      missingIds
    };
  }
}
