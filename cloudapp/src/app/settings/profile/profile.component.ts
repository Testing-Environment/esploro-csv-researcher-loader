import { Component, OnInit, ViewChild, Input, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, FormControl } from '@angular/forms';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';

interface FieldName {
  name: string;
  label: string;
}

interface FieldGroup {
  disabled?: boolean;
  name: string;
  fields: FieldName[];
}

@Component({
  selector: 'app-settings-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  displayedColumns = ['header', 'default', 'name', 'actions'];
  selectedFieldName: string = '';
  
  dataSource: MatTableDataSource<any>;
  @ViewChild('table') table: MatTable<any>;
  @Input() form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private translate: TranslateService,
  ) { }

  fieldGroups: FieldGroup[] = [
    {
      name: 'FieldGroups.General', fields: [
        { name: 'primary_id', label: 'FieldNames.PrimaryId'},
        { name: 'researcher.default_publication_language.value', label: 'FieldNames.DefaultPublicationLanguage' },
        { name: 'researcher.display_title', label: 'FieldNames.DisplayTitle' },
        { name: 'researcher.portal_profile.value', label: 'FieldNames.PortalProfile' },
        { name: 'researcher.auto_capture', label: 'FieldNames.AutoCapture' },
        { name: 'researcher.position.value', label: 'FieldNames.Position' },
        { name: 'researcher.research_center', label: 'FieldNames.ResearchCenter' },
        { name: 'researcher.researcher_description[].description', label: 'FieldNames.Description' },
        { name: 'researcher.researcher_language[].value', label: 'FieldNames.Languages' },
        { name: 'researcher.researcher_association[].value', label: 'FieldNames.Associations' },
        { name: 'researcher.researcher_alternate_email[].email_address', label: 'FieldNames.AlternateEmails' },
        { name: 'researcher.researcher_research_topic[].value', label: 'FieldNames.ResearchTopics' },
        { name: 'researcher.researcher_keyword[].value', label: 'FieldNames.Keywords' },
      ]
    },
    {
      name: 'FieldGroups.ResearcherName', fields: [
        { name: 'researcher.researcher_first_name', label: 'FieldNames.FirstName' },
        { name: 'researcher.researcher_middle_name', label: 'FieldNames.MiddleName' },
        { name: 'researcher.researcher_last_name', label: 'FieldNames.LastName' },
        { name: 'researcher.researcher_suffix', label: 'FieldNames.Suffix' },
        { name: 'researcher.researcher_title.value', label: 'FieldNames.Title' },
      ]
    },
    {
      name: 'FieldGroups.NameVariants', fields: [
        { name: 'researcher.researcher_name_variant[].first_name', label: 'FieldNames.FirstName' },
        { name: 'researcher.researcher_name_variant[].middle_name', label: 'FieldNames.MiddleName' },
        { name: 'researcher.researcher_name_variant[].last_name', label: 'FieldNames.LastName' },
        { name: 'researcher.researcher_name_variant[].name_suffix', label: 'FieldNames.Suffix' },
      ]
    },
    {
      name: 'FieldGroups.CurIntAffiliations', fields: [
        { name: 'researcher.researcher_organization_affiliation[].organization_code', label: 'FieldNames.OrganizationCode' },
        { name: 'researcher.researcher_organization_affiliation[].start_date', label: 'FieldNames.StartDate' },
        { name: 'researcher.researcher_organization_affiliation[].end_date', label: 'FieldNames.EndDate' },
        { name: 'researcher.researcher_organization_affiliation[].position.value', label: 'FieldNames.Position' },
        { name: 'researcher.researcher_organization_affiliation[].title', label: 'FieldNames.Title' },
        { name: 'researcher.researcher_organization_affiliation[].positionOrder', label: 'FieldNames.Order' },
      ]
    },
    {
      name: 'FieldGroups.PrevIntAffiliations', fields: [
        { name: 'researcher.researcher_previous_organization_affiliation[].organization_code', label: 'FieldNames.OrganizationCode' },
        { name: 'researcher.researcher_previous_organization_affiliation[].start_date', label: 'FieldNames.StartDate' },
        { name: 'researcher.researcher_previous_organization_affiliation[].end_date', label: 'FieldNames.EndDate' },
        { name: 'researcher.researcher_previous_organization_affiliation[].position.value', label: 'FieldNames.Position' },
        { name: 'researcher.researcher_previous_organization_affiliation[].title', label: 'FieldNames.Title' },
        { name: 'researcher.researcher_previous_organization_affiliation[].positionOrder', label: 'FieldNames.Order' },
      ]
    },
    {
      name: 'FieldGroups.CurExtAffiliations', fields: [
        { name: 'researcher.researcher_external_organization_affiliation[].organization_code', label: 'FieldNames.OrganizationCode' },
        { name: 'researcher.researcher_external_organization_affiliation[].start_date', label: 'FieldNames.StartDate' },
        { name: 'researcher.researcher_external_organization_affiliation[].end_date', label: 'FieldNames.EndDate' },
        { name: 'researcher.researcher_external_organization_affiliation[].position.value', label: 'FieldNames.Position' },
        { name: 'researcher.researcher_external_organization_affiliation[].title', label: 'FieldNames.Title' },
        { name: 'researcher.researcher_external_organization_affiliation[].positionOrder', label: 'FieldNames.Order' },
      ]
    },
    {
      name: 'FieldGroups.PrevExtAffiliations', fields: [
        { name: 'researcher.researcher_previous_external_organization_affiliation[].organization_code', label: 'FieldNames.OrganizationCode' },
        { name: 'researcher.researcher_previous_external_organization_affiliation[].start_date', label: 'FieldNames.StartDate' },
        { name: 'researcher.researcher_previous_external_organization_affiliation[].end_date', label: 'FieldNames.EndDate' },
        { name: 'researcher.researcher_previous_external_organization_affiliation[].position.value', label: 'FieldNames.Position' },
        { name: 'researcher.researcher_previous_external_organization_affiliation[].title', label: 'FieldNames.Title' },
        { name: 'researcher.researcher_previous_external_organization_affiliation[].positionOrder', label: 'FieldNames.Order' },
      ]
    },
    {
      name: 'FieldGroups.Engagements', fields: [
        { name: 'researcher.researcher_engagement_type[].researcher_engagement.value', label: 'FieldNames.Type' },
        { name: 'researcher.researcher_engagement_type[].engagement_end_date', label: 'FieldNames.EndDate' },
      ]
    },
    {
      name: 'FieldGroups.Educations', fields: [
        { name: 'researcher.researcher_education[].organization_code', label: 'FieldNames.OrganizationCode' },
        { name: 'researcher.researcher_education[].degree', label: 'FieldNames.Degree' },
        { name: 'researcher.researcher_education[].field_of_study', label: 'FieldNames.FieldOfStudy' },
        { name: 'researcher.researcher_education[].from_year', label: 'FieldNames.FromDate' },
        { name: 'researcher.researcher_education[].to_year', label: 'FieldNames.ToDate' },
        { name: 'researcher.researcher_education[].additional_details', label: 'FieldNames.AdditionalDetails' },
      ]
    },
    {
      name: 'FieldGroups.Honors', fields: [
        { name: 'researcher.researcher_honor[].organization_code', label: 'FieldNames.OrganizationCode' },
        { name: 'researcher.researcher_honor[].title', label: 'FieldNames.Title' },
        { name: 'researcher.researcher_honor[].time_period', label: 'FieldNames.TimePeriod' },
      ]
    },
    {
      name: 'FieldGroups.Webpages', fields: [
        { name: 'researcher.researcher_webpage[].url', label: 'FieldNames.URL' },
        { name: 'researcher.researcher_webpage[].type', label: 'FieldNames.Type' },
        { name: 'researcher.researcher_webpage[].title', label: 'FieldNames.Title' },
      ]
    },
    {
      name: 'FieldGroups.Identifiers', fields: [
        { name: 'researcher.user_identifier[].value', label: 'FieldNames.Value' },
        { name: 'researcher.user_identifier[].id_type.value', label: 'FieldNames.IdType' },
      ]
    },
  ];

  ngOnInit() {
    this.dataSource = new MatTableDataSource(this.fields.controls);
  }

  getFieldGroupName(fieldName: string): string {
    if(fieldName) {
      for (const group of this.fieldGroups) {
        for (const field of group.fields) {
          if (field.name === fieldName) {
            return group.name;
          }
        }
      }
    }
    return '';
  }


  addField() {
    this.fields.push(this.fb.group({header: '', fieldName: '', default: ''}));
    this.fields.markAsDirty();
    this.table.renderRows();
  }

  removeField(index: number) {
    this.fields.removeAt(index);
    this.fields.markAsDirty();
    this.table.renderRows();
  }

  get fields() { return this.form ? (this.form.get('fields') as FormArray) : new FormArray([])}
  get profileType() { return this.form ? (this.form.get('profileType') as FormControl) : new FormControl('UPDATE')}
}