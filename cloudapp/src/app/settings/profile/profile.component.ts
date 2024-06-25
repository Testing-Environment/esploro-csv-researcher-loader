import { Component, OnInit, ViewChild, Input, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, FormControl } from '@angular/forms';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { EsploroFields } from '../esploro-fields';
import { mandatoryFieldsAdd, mandatoryFieldsUpdate } from '../settings-utils'


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
    private alert: AlertService,
    private fb: FormBuilder,
    private translate: TranslateService,
  ) { }

  esploroFieldsInstance = EsploroFields.getInstance();
  fieldGroups = this.esploroFieldsInstance.getEsploroFieldGroups();

  ngOnInit() {
    this.dataSource = new MatTableDataSource(this.fields.controls);
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

  addMandatoryFields() {
    const mandatoryFields = this.profileType.value == "ADD" ? mandatoryFieldsAdd : mandatoryFieldsUpdate;
    const esploroFields = EsploroFields.getInstance();

    mandatoryFields.forEach(currentField => {
      let fieldLabelKey = esploroFields.getLabelKeyByFieldKey(currentField.fieldName);
      this.translate.get(fieldLabelKey).subscribe(translatedFieldName => {
        if (!(this.fields.value.some(f=>f['fieldName'] == currentField.fieldName))) {
          this.fields.push(this.fb.group({header: currentField.header, fieldName: currentField.fieldName, default: ''}));
          this.fields.markAsDirty();
          this.table.renderRows();
          this.alert.success(this.translate.instant('Profile.MandatoryFieldAdded', {field: translatedFieldName}));
        } else {
          this.alert.info(this.translate.instant('Profile.MandatoryFieldAlreadyExisting', {field: translatedFieldName}));
        }
      });
    });
  }

  get fields() { return this.form ? (this.form.get('fields') as FormArray) : new FormArray([])}
  get profileType() { return this.form ? (this.form.get('profileType') as FormControl) : new FormControl('')}
}