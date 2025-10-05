import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MaterialModule, LazyTranslateLoader, AlertModule } from '@exlibris/exl-cloudapp-angular-lib';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateICUParser } from 'ngx-translate-parser-plural-select';
import { TranslateModule, TranslateLoader, TranslateParser } from '@ngx-translate/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';
import { CSVProcessorComponent } from './components/csv-processor/csv-processor.component';
import { ProcessingResultsComponent } from './components/processing-results/processing-results.component';
import { EnhancedMaterialModule } from './enhanced-material.module';


export function getTranslateModuleWithICU() {
  return TranslateModule.forRoot({
    loader: {
      provide: TranslateLoader,
      useClass: (LazyTranslateLoader)
    },
    parser: {
      provide: TranslateParser,
      useClass: TranslateICUParser
    }
  });
}

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    CSVProcessorComponent,
    ProcessingResultsComponent
  ],
  imports: [
    MaterialModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    AlertModule,
    BrowserAnimationsModule,
    EnhancedMaterialModule,
    getTranslateModuleWithICU(),
  ],
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } },
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
