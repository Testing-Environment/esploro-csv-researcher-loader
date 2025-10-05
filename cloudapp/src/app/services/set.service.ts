import { Injectable } from '@angular/core';
import { CloudAppRestService, HttpMethod, Request } from '@exlibris/exl-cloudapp-angular-lib';
import { Observable } from 'rxjs';

export interface ItemizedSet {
  id?: string;
  name: string;
  type: { value: 'ITEMIZED' };
  content_type: { value: 'ASSET' };
  description?: string;
  private?: boolean;
  members?: {
    member: Array<{ id: string }>;
  };
}

export interface SetMemberResponse {
  members?: {
    member?: Array<{ id: string; [key: string]: any }>;
  };
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class SetService {
  constructor(private restService: CloudAppRestService) {}

  /**
   * Create an itemized set with the given asset IDs
   * @param assetIds Array of asset IDs to include in the set
   * @param name Optional name for the set
   */
  createItemizedSet(assetIds: string[], name?: string): Observable<ItemizedSet> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const setName = name || `Asset File Load - ${timestamp}`;

    const payload: ItemizedSet = {
      name: setName,
      type: { value: 'ITEMIZED' },
      content_type: { value: 'ASSET' },
      description: `Auto-generated set for file ingestion. Contains ${assetIds.length} asset(s).`,
      private: false,
      members: {
        member: assetIds.map(id => ({ id }))
      }
    };

    const request: Request = {
      url: '/conf/sets',
      method: HttpMethod.POST,
      headers: { 'Content-Type': 'application/json' },
      requestBody: payload
    };

    return this.restService.call(request);
  }

  /**
   * Add members to an existing set
   * @param setId The ID of the set
   * @param assetIds Array of asset IDs to add
   */
  addMembersToSet(setId: string, assetIds: string[]): Observable<SetMemberResponse> {
    const request: Request = {
      url: `/conf/sets/${setId}?op=add_members`,
      method: HttpMethod.POST,
      headers: { 'Content-Type': 'application/json' },
      requestBody: {
        members: {
          member: assetIds.map(id => ({ id }))
        }
      }
    };

    return this.restService.call(request);
  }

  /**
   * Get details of a set
   * @param setId The ID of the set
   */
  getSet(setId: string): Observable<ItemizedSet> {
    const request: Request = {
      url: `/conf/sets/${setId}`,
      method: HttpMethod.GET
    };

    return this.restService.call(request);
  }

  /**
   * Delete a set
   * @param setId The ID of the set to delete
   */
  deleteSet(setId: string): Observable<void> {
    const request: Request = {
      url: `/conf/sets/${setId}`,
      method: HttpMethod.DELETE
    };

    return this.restService.call(request);
  }
}
