import { FormArray, FormGroup } from '@angular/forms';
import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';


/** Validate appropriate combination of fields for CSV import profile */
export const validateFields = (fields: FormArray): string[] | null => {
  let errorArray = [];

  /** Mandatory fields (always required) */
  /* primary_id required */
  if (!fields.value.some(f=>f['fieldName']=='primary_id')) {
    errorArray.push({code:_('Settings.Validation.PrimaryIdRequired')});
  }

  /** Mandatory fields for groups */
  /* Current internal affiliation - organization code required */
  if (fields.value.some(f=>f['fieldName'].startsWith('researcher.researcher_organization_affiliation'))
    && !fields.value.some(f=>f['fieldName']=='researcher.researcher_organization_affiliation[].organization_code'))
    errorArray.push({code:_('Settings.Validation.CurIntAffiliationOrgaRequired')});

  /* Previous internal affiliation - organization code required */
  if (fields.value.some(f=>f['fieldName'].startsWith('researcher.researcher_previous_organization_affiliation'))
    && !fields.value.some(f=>f['fieldName']=='researcher.researcher_previous_organization_affiliation[].organization_code'))
    errorArray.push({code:_('Settings.Validation.PrevIntAffiliationOrgaRequired')});
  
  /* Current external affiliation - organization code required */
  if (fields.value.some(f=>f['fieldName'].startsWith('researcher.researcher_external_organization_affiliation'))
    && !fields.value.some(f=>f['fieldName']=='researcher.researcher_external_organization_affiliation[].organization_code'))
    errorArray.push({code:_('Settings.Validation.CurExtAffiliationOrgaRequired')});

  /* Previous external affiliation - organization code required */
  if (fields.value.some(f=>f['fieldName'].startsWith('researcher.researcher_previous_external_organization_affiliation'))
    && !fields.value.some(f=>f['fieldName']=='researcher.researcher_previous_external_organization_affiliation[].organization_code'))
    errorArray.push({code:_('Settings.Validation.PrevExtAffiliationOrgaRequired')});
  
  /* Engagements - type required */
  if (fields.value.some(f=>f['fieldName'].startsWith('researcher.researcher_engagement_type'))
    && !fields.value.some(f=>f['fieldName']=='researcher.researcher_engagement_type[].researcher_engagement.value'))
    errorArray.push({code:_('Settings.Validation.EngagementsTypeRequired')});

  /* Educations - organization code required */
  if (fields.value.some(f=>f['fieldName'].startsWith('researcher.researcher_education'))
    && !fields.value.some(f=>f['fieldName']=='researcher.researcher_education[].organization_code'))
    errorArray.push({code:_('Settings.Validation.EducationsOrgaRequired')});
  
  /* Honors - organization code required */
  if (fields.value.some(f=>f['fieldName'].startsWith('researcher.researcher_honor'))
    && !fields.value.some(f=>f['fieldName']=='researcher.researcher_honor[].organization_code'))
    errorArray.push({code:_('Settings.Validation.HonorsOrgaRequired')});

  /* Identifiers - type and value required */
  if (fields.value.some(f=>f['fieldName'].startsWith('researcher.user_identifier'))
    && (!fields.value.some(f=>f['fieldName']=='researcher.user_identifier[].value')
      || !fields.value.some(f=>f['fieldName']=='researcher.user_identifier[].id_type.value')))
    errorArray.push({code:_('Settings.Validation.IdentifiersTypeAndValueRequired')});
  
  /* Name variants - last name required */
  if (fields.value.some(f=>f['fieldName'].startsWith('researcher.researcher_name_variant'))
    && !fields.value.some(f=>f['fieldName']=='researcher.researcher_name_variant[].last_name')) 
    errorArray.push({code:_('Settings.Validation.NameVariantsLastNameRequired')});

  /* Webpages - type and url required */
  if (fields.value.some(f=>f['fieldName'].startsWith('researcher.researcher_webpage'))
    && (!fields.value.some(f=>f['fieldName']=='researcher.researcher_webpage[].type')
      || !fields.value.some(f=>f['fieldName']=='researcher.researcher_webpage[].url')))
    errorArray.push({code:_('Settings.Validation.WebpagesTypeAndUrlRequired')});

  return errorArray.length>0 ? errorArray : null;
}

/** Validate entire form */
export const validateForm = (form: FormGroup) : string[] | null => {
  let errorArray = [];
  let profiles = form.get('profiles') as FormArray;

  /* All fields must have a fieldName and either a default or a header */
  profiles.controls.forEach( p => {
    let fields = p.get('fields');
    if ( fields.value.some(f=>!f['fieldName']))
      errorArray.push({code:_('Settings.Validation.FieldNameRequired'), params:{profile:p.get('name').value}})
    if ( fields.value.some(f=>!f['header'] && !f['default']))
      errorArray.push({code:_('Settings.Validation.HeaderRequired'), params:{profile:p.get('name').value}})
  })

  /* If Update/Delete, must have primary ID field */
  profiles.controls.forEach( p => {
    if (['UPDATE'].includes(p.get('profileType').value)) {
      const fields = p.get('fields');
      if ( !fields.value.some(f=>f['fieldName']=='primary_id'))
        errorArray.push({code:_('Settings.Validation.PrimaryIdRequired'), params:{profile:p.get('name').value}})
    }
  })

  return errorArray.length>0 ? errorArray : null;
}