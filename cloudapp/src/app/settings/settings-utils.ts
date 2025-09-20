import { FormArray, FormGroup, ValidatorFn } from '@angular/forms';
import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { EsploroFields } from './esploro-fields'
import { isEmptyString } from '../utilities';

export const mandatoryFieldsAdd = [
  {header: 'title', fieldName: 'title'},
  {header: 'asset_type', fieldName: 'asset_type.value'},
  {header: 'organization', fieldName: 'organization.value'}
];
export const mandatoryFieldsUpdate = [{header: 'id', fieldName: 'id'}];

/** Validate appropriate combination of fields for CSV import profile */
export const validateFields = (fields: FormArray): string[] | null => {
  let errorArray = [];

  /** Mandatory fields (always required) */
  /* For ADD operations: title, asset_type, and organization required */
  /* For UPDATE operations: id required */
  
  /** Mandatory fields for groups */
  /* Identifiers - type and value required */
  if (fields.value.some(f=>f['fieldName'].startsWith('identifiers.identifier'))
    && (!fields.value.some(f=>f['fieldName']=='identifiers.identifier[].value')
      || !fields.value.some(f=>f['fieldName']=='identifiers.identifier[].identifier_type.value')))
    errorArray.push({code:_('Settings.Validation.IdentifiersTypeAndValueRequired')});
  
  /* Authors - either researcher ID or first/last name required */
  if (fields.value.some(f=>f['fieldName'].startsWith('authors.author'))
    && !fields.value.some(f=>f['fieldName']=='authors.author[].researcher.primary_id')
    && (!fields.value.some(f=>f['fieldName']=='authors.author[].first_name')
      || !fields.value.some(f=>f['fieldName']=='authors.author[].last_name')))
    errorArray.push({code:_('Settings.Validation.AuthorsRequired')});

  /* URLs - link required if URL fields are used */
  if (fields.value.some(f=>f['fieldName'].startsWith('urls.url'))
    && !fields.value.some(f=>f['fieldName']=='urls.url[].link'))
    errorArray.push({code:_('Settings.Validation.URLLinkRequired')});

  /* Funding - agency required if funding fields are used */
  if (fields.value.some(f=>f['fieldName'].startsWith('funding.grant'))
    && !fields.value.some(f=>f['fieldName']=='funding.grant[].agency'))
    errorArray.push({code:_('Settings.Validation.FundingAgencyRequired')});

  return errorArray.length>0 ? errorArray : null;
}

/** Validate entire form */
export function validateForm(translate: TranslateService): ValidatorFn {
  return (form: FormGroup) : string[] | null => {
    let errorArray = [];
    let profiles = form.get('profiles') as FormArray;

    /* General validations */
    profiles.controls.forEach( p => {
      let fields = p.get('fields');
      /* All fields must have a fieldName and either a default or a header */
      if ( fields.value.some(f=>!f['fieldName']))
        errorArray.push({code:_('Settings.Validation.FieldNameRequired'), params:{profile:p.get('name').value}})
      if ( fields.value.some(f=>!f['header'] && !f['default']))
        errorArray.push({code:_('Settings.Validation.HeaderRequired'), params:{profile:p.get('name').value}})
      /* For UPDATE profile type, asset ID is required */
      if (p.get('profileType').value === 'UPDATE' && !fields.value.some(f=>f['fieldName']=='id'))
        errorArray.push({code:_('Settings.Validation.AssetIdRequired'), params:{profile:p.get('name').value}})
    })

    /* If profile_type = ADD, certain fields are required by researcher api */
    const esploroFields = EsploroFields.getInstance();
    const reqFieldErrorLabelKey = 'Settings.Validation.FieldRequired';
    
    profiles.controls.forEach( p => {
      if (['ADD'].includes(p.get('profileType').value)) {
        const fields = p.get('fields');
        
        mandatoryFieldsAdd.forEach(currentField => {
          if (!(fields.value.some(f=>f['fieldName'] == currentField.fieldName))) {
            let fieldLabelKey = esploroFields.getLabelKeyByFieldKey(currentField.fieldName);
            let groupLabelKey = esploroFields.getFieldGroupNameByFieldKey(currentField.fieldName);
            translate.get([fieldLabelKey, groupLabelKey]).subscribe(translations => {
              let fieldLabel = translations[fieldLabelKey];
              let groupLabel = translations[groupLabelKey];

              if (!isEmptyString(fieldLabel) && !isEmptyString(groupLabel)) {
                errorArray.push({code: _(reqFieldErrorLabelKey), params:{fieldname: fieldLabel, groupname: groupLabel}});
              } else {
                errorArray.push({code: _(reqFieldErrorLabelKey), params:{fieldname: currentField.fieldName}});
              }
            });
          }
        })
      }
    })

    return errorArray.length>0 ? errorArray : null;
  };
}