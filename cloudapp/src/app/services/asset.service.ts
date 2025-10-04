import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

const FILE_TYPE_CODE_TABLE = 'AssetFileType';

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
}