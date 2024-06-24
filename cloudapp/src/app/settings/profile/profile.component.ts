import { Component, OnInit, ViewChild, Input, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, FormControl } from '@angular/forms';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { EsploroFields } from '../esploro-fields';


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

  get fields() { return this.form ? (this.form.get('fields') as FormArray) : new FormArray([])}
  get profileType() { return this.form ? (this.form.get('profileType') as FormControl) : new FormControl('')}
}