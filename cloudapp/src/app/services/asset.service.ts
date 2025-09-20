import { Injectable } from '@angular/core';
import { Observable } from 'rxjs'
import * as dot from 'dot-object';
import { CloudAppRestService, HttpMethod } from '@exlibris/exl-cloudapp-angular-lib';
import { Asset } from '../models/asset';
import { Profile } from '../models/settings';

@Injectable({
  providedIn: 'root'
})
export class AssetService {

  constructor( 
    private restService: CloudAppRestService
   ) { }

  /** (PUT) Update asset via Esploro API */
  updateAsset(asset: Asset): Observable<Asset> {
    return this.restService.call( {
      url: `/esploro/v1/assets/${asset.id}`,
      headers: { 
        "Content-Type": "application/json",
        Accept: "application/json" 
      },
      requestBody: asset,
      method: HttpMethod.PUT
    })
  }

  /** (POST) Create asset via Esploro API */
  createAsset(asset: Asset): Observable<Asset> {
    return this.restService.call( {
      url: `/esploro/v1/assets`,
      headers: { 
        "Content-Type": "application/json",
        Accept: "application/json" 
      },
      requestBody: asset,
      method: HttpMethod.POST
    })
  }

  /** (GET) Fetch asset from Esploro API */
  getAssetById(id: string): Observable<Asset> {
    return this.restService.call( {
      url: `/esploro/v1/assets/${id}`,
      headers: { 
        "Content-Type": "application/json",
        Accept: "application/json" 
      },
    })
  }

  mapAsset = (parsedAsset: any, selectedProfile: Profile) => {
    const arrayIndicator = new RegExp(/\[\d*\]/);
    const mapCsvToProfileFields = (parsedAsset: any, selectedProfile: Profile) => {
      return Object.entries<string>(parsedAsset).reduce((mappedFields, [csvKey, csvValue]) => {
        const profileField = selectedProfile.fields.find(profileField => profileField.header === csvKey);
        if (profileField && profileField.fieldName && csvValue) {
          let fieldName = profileField.fieldName;
          if (arrayIndicator.test(fieldName)) { // array field
            fieldName = fieldName.replace(arrayIndicator, `[${Object.keys(mappedFields).filter(k => k.replace(arrayIndicator, '[]') === fieldName).length}]`);
          }
          mappedFields[fieldName] = ['true', 'false'].includes(csvValue) ? (csvValue === 'true') : csvValue;
        }
        return mappedFields;
      }, {});
    };

    const setDefaultValues = (asset: any, selectedProfile: Profile) => {
      const occurrences: { [fieldName: string]: number } = {};
      selectedProfile.fields.filter(field => field.default).forEach(field => {
        occurrences[field.fieldName] = (occurrences[field.fieldName] === undefined ? -1 : occurrences[field.fieldName]) + 1;
        const fname = field.fieldName.replace(/\[\]/g, `[${occurrences[field.fieldName]}]`);
        if (!asset[fname]) asset[fname] = field.default;
      });
    };

    let mappedAsset = mapCsvToProfileFields(parsedAsset, selectedProfile);
    setDefaultValues(mappedAsset, selectedProfile);
    mappedAsset = dot.object(mappedAsset);

    return mappedAsset;
  }
}