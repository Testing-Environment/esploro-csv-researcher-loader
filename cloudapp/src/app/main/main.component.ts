import { Component, OnInit, ViewChild, ElementRef, Injectable } from '@angular/core';
import { Papa, ParseResult } from 'ngx-papaparse';
import { Settings, Profile } from '../models/settings';
import { CloudAppSettingsService, CloudAppStoreService, RestErrorResponse } from '@exlibris/exl-cloudapp-angular-lib';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, switchMap, map, mergeMap, tap } from 'rxjs/operators';
import { DialogService } from 'eca-components';
import { ResearcherService } from '../services/researcher.service';
import { MatSelectChange } from '@angular/material/select';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Researcher } from '../models/researcher';
import { deepMergeObjects, isEmptyString, CustomResponse, CustomResponseType } from '../utilities';

const MAX_PARALLEL_CALLS = 5;
const MAX_RESEARCHERS_IN_CSV = 500;

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  files: File[] = [];
  settings: Settings;
  selectedProfile: Profile;
  resultsLog: string = '';
  resultsSummary: string = '';
  showLog: boolean = false;
  processed: number = 0;
  recordsToProcess: number = 0;
  running: boolean;
  @ViewChild('resultsPanel', {static: false}) private resultsPanel: ElementRef;

  constructor ( 
    private settingsService: CloudAppSettingsService, 
    private researcherService: ResearcherService,
    private papa: Papa,
    private translate: TranslateService,
    private dialogs: DialogService,
    private storeService: CloudAppStoreService,
  ) { }

  ngOnInit() {
    this.settingsService.get().subscribe(settings => {
      this.settings = settings as Settings;
      this.selectedProfile = this.settings.profiles[0];
    });
    this.storeService.get('showLog').subscribe(val => this.showLog = val);
    this.storeService.get('profile').subscribe(val => {
      if (!!val) {
        this.settings.profiles.forEach(p => {
          if (p.name == val) this.selectedProfile = p;
        })
      }
    })
  }

  onSelectProfile(event: MatSelectChange) {
    this.storeService.set('profile', event.value.name).subscribe();
  }

  onSelect(event) {
    this.files.push(...event.addedFiles);
  }
   
  onRemove(event) {
    this.files.splice(this.files.indexOf(event), 1);
  }  

  reset() {
    this.files = [];
    this.resultsLog = '';
    this.resultsSummary = '';
    this.processed = 0;
    this.recordsToProcess = 0;
  }

  compareProfiles(o1: Profile, o2: Profile): boolean {
    return o1 && o2 ? o1.name === o2.name : o1 === o2;
  }  

  loadResearchers() {
    this.papa.parse(this.files[0], {
      header: true,
      complete: this.parsedResearchers,
      skipEmptyLines: 'greedy'
    });
  }

  ngAfterViewChecked() {        
    this.scrollToBottom();        
  } 

  scrollToBottom(): void {
    try {
      this.resultsPanel.nativeElement.scrollTop = this.resultsPanel.nativeElement.scrollHeight;
    } catch(err) { }                 
  }  

  showLogChanged(event: MatSlideToggleChange) {
    this.storeService.set('showLog', event.checked).subscribe();
  }

  get percentComplete() {
    return Math.round((this.processed/this.recordsToProcess)*100)
  }

  private log = (str: string) => this.resultsLog += `${str}\n`;  

  processResearcher(researcher: Researcher, profileType: string, index: number): Observable<Researcher | RestErrorResponse | CustomResponse> {
    switch (profileType) {
      case 'UPDATE':
        if (researcher.primary_id && !isEmptyString(researcher.primary_id)) {
          return this.researcherService.getResearcherByPrimaryId(researcher.primary_id).pipe(catchError(e=>{throw(e)}),
            switchMap(original=>{
              if (original==null) {
                return of(this.handleError({message: this.translate.instant("Error.EmptyGET"), type: CustomResponseType.error}, researcher, index));
              } else {
                let new_researcher = deepMergeObjects(original, researcher);
                return this.researcherService.updateResearcher(new_researcher);
              }
            }),
            catchError(e=>of(this.handleError(e, researcher, index)))
          )
        }
        else {
          return of(this.handleError({message: this.translate.instant("Error.EmptyPrimaryId"), type: CustomResponseType.error}, researcher, index));
        }
      // add more profileTypes like CREATE / ENRICH / DELETE in the future
    }
  }

  private handleError(e: RestErrorResponse | CustomResponse, researcher: any, index: number) {
    if (researcher) {
      const props = ['primary_id']
        .map(p => researcher[p])
        .filter(value => !isEmptyString(value));
      
      if (props.length > 0) {
        e.message += ` (${props.join(', ')}, row ${index+2})`;
      } else {
        e.message += ` (row ${index+2})`;
      }
    }
    return e;
  }

  processResearcherWithLogging(researcher: Researcher, index: number): Observable<any> {
    return this.processResearcher(researcher, this.selectedProfile.profileType, index)
      .pipe(
        tap(() => this.processed++),
        catchError(error => {
          this.log(`${this.translate.instant("Main.Failed")}: ${error.message} (row ${index+2})`);
          return throwError(error); // Re-throw the error for handling in the outer subscription
        })
      );
  }

  updateResultsSummary(resultsArray: any[]): void {
    let successCount = 0, errorCount = 0; 
    resultsArray.forEach(res => {
      if (isRestErrorResponse(res) || isCustomErrorResponse(res)) {
        errorCount++;
        this.log(`${this.translate.instant("Main.Failed")}: ${res.message}`);
      } else if (isInfoResponse(res)) {
        this.log(`${this.translate.instant("Main.Info")}: ${res.message}`);
      } else {
        successCount++;
        this.log(`${this.translate.instant("Main.Processed")}: ${res.primary_id}`);
      }
    });
    this.resultsSummary = this.translate.instant('Main.ResultsSummary', { successCount, errorCount })
  }

  compareFieldNameArrays(source: string[], target: string[], errors: string[], errorMsg: string) {
    if (source.length > 0) {
      source.forEach(item => {
        if (!target.includes(item)) {
          errors.push(this.translate.instant(errorMsg, { field: item }));
        }
      });
    }
    return errors;
  }

  verifyCsvHeaderAgainstProfile(csvHeaderList: string[]) {
    let errorArray = [];
    let profileHeaderList = [];
    this.selectedProfile.fields.forEach(item => {
      if (!isEmptyString(item.header)) profileHeaderList.push(item.header);
    });

    if (profileHeaderList.length !== csvHeaderList.length) {
      errorArray.push(this.translate.instant('Error.CsvHeaderCountMismatch', { csvHeaderCount: csvHeaderList.length, profileHeaderCount: profileHeaderList.length }));
    }
    errorArray = this.compareFieldNameArrays(profileHeaderList, csvHeaderList, errorArray, 'Error.FieldNotFoundInCsv');
    errorArray = this.compareFieldNameArrays(csvHeaderList, profileHeaderList, errorArray, 'Error.FieldNotFoundInProfile');

    return errorArray;
  }

  private parsedResearchers = async (result: ParseResult) => {
    if (result.errors.length>0) 
      console.warn('Errors:', result.errors);
    
    let headerValidationErrors = this.verifyCsvHeaderAgainstProfile(result.meta.fields);
    if (headerValidationErrors.length > 0) {
      this.resultsSummary = this.translate.instant('Error.CsvHeaderValidationError', { count: headerValidationErrors.length });
      headerValidationErrors.forEach(error => {
        this.log(error);
      });
    } else {
      let researchers: Researcher[] = result.data.map(row => this.researcherService.mapResearcher(row, this.selectedProfile));
      let resultsArray: any[] = [];
      if (researchers.length > MAX_RESEARCHERS_IN_CSV) {
        researchers = researchers.slice(0, MAX_RESEARCHERS_IN_CSV);
        let csvMaxRowsInfo = { message: this.translate.instant('Main.CsvMaxRowsInfo', { max_count: MAX_RESEARCHERS_IN_CSV }), type: CustomResponseType.info };
        console.log(csvMaxRowsInfo.message);
        resultsArray.push(csvMaxRowsInfo);
      } 
      /* Generation of primary ID is not thread safe; only parallelize if primary ID is supplied */
      const maxParallelCalls = researchers.every(res=>res.primary_id) ? MAX_PARALLEL_CALLS : 1;
      this.dialogs.confirm({ text: ['Main.ConfirmUpdateResearchers', { count: researchers.length, type: this.selectedProfile.profileType }]})
      .subscribe( async result => {
        if (!result) {
          this.resultsLog = '';
          return;
        }
        this.recordsToProcess = researchers.length;
        this.running = true;

        try {
          let researcherProcessingObservables = from(researchers.map((researcher, index) => this.processResearcherWithLogging(researcher, index)));

          researcherProcessingObservables.pipe(
            mergeMap(researcherProcessingObservable => researcherProcessingObservable, maxParallelCalls),
            tap(result => resultsArray.push(result)),
            catchError(error => {
              this.log(`${this.translate.instant("Main.Failed")}: ${error.message}`);
              return throwError(error);
            })
          )
          .subscribe({
            complete: () => {
              setTimeout(() => {
                this.updateResultsSummary(resultsArray);
                this.running = false;
              }, 500);
            }
          });
        }
        catch(error) {
          console.error('Error initializing all researchers: ', error);
        }
      });
    }    
  }
}




@Injectable({
  providedIn: 'root',
})
export class MainGuard implements CanActivate {
  constructor(
    private settingsService: CloudAppSettingsService,
    private router: Router
  ) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> {
      return this.settingsService.get().pipe( map( settings => {
        if (!settings.profiles) {
          this.router.navigate(['settings']);
          return false;
        }
        return true;
      }))
  }
}

const isRestErrorResponse = (object: any): object is RestErrorResponse => 'error' in object;
const isCustomErrorResponse = (object: any): object is CustomResponse => object.type === CustomResponseType.error;
const isInfoResponse = (object: any): object is CustomResponse => object.type === CustomResponseType.info;