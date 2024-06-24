import { Injectable } from '@angular/core';
import { Observable } from 'rxjs'
import * as dot from 'dot-object';
import { CloudAppRestService, HttpMethod } from '@exlibris/exl-cloudapp-angular-lib';
import { Researcher } from '../models/researcher';
import { Profile } from '../models/settings';



@Injectable({
  providedIn: 'root'
})
export class ResearcherService {

  constructor( 
    private restService: CloudAppRestService
   ) { }

  /** (PUT) Update researcher via Esploro API */
  updateResearcher(researcher: Researcher): Observable<Researcher> {
    return this.restService.call( {
      url: `/esploro/v1/researchers/${researcher.primary_id}`,
      headers: { 
        "Content-Type": "application/json",
        Accept: "application/json" 
      },
      requestBody: researcher,
      method: HttpMethod.PUT
    })
  }

  /** (GET) Fetch researcher from Esploro API */
  getResearcherByPrimaryId(primary_id: string): Observable<Researcher> {
    return this.restService.call( {
      url: `/esploro/v1/researchers/${primary_id}`,
      headers: { 
        "Content-Type": "application/json",
        Accept: "application/json" 
      },
    })
  }

  /** (GET) Fetch user from Alma API */
  getUserByPrimaryId(primary_id: string): Observable<Researcher> {
    return this.restService.call( {
      url: `/users/${primary_id}`,
      headers: { 
        "Content-Type": "application/json",
        Accept: "application/json" 
      },
    })
  }

  mapResearcher = (parsedResearcher: any, selectedProfile: Profile) => {
    const arrayIndicator = new RegExp(/\[\d*\]/);
    const mapCsvToProfileFields = (parsedResearcher: any, selectedProfile: Profile) => {
      return Object.entries<string>(parsedResearcher).reduce((mappedFields, [csvKey, csvValue]) => {
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

    const setDefaultValues = (researcher: any, selectedProfile: Profile) => {
      const occurrences: { [fieldName: string]: number } = {};
      selectedProfile.fields.filter(field => field.default).forEach(field => {
        occurrences[field.fieldName] = (occurrences[field.fieldName] === undefined ? -1 : occurrences[field.fieldName]) + 1;
        const fname = field.fieldName.replace(/\[\]/g, `[${occurrences[field.fieldName]}]`);
        if (!researcher[fname]) researcher[fname] = field.default;
      });
    };

    let mappedResearcher = mapCsvToProfileFields(parsedResearcher, selectedProfile);
    setDefaultValues(mappedResearcher, selectedProfile);
    mappedResearcher = dot.object(mappedResearcher);

    return mappedResearcher;
  }
}