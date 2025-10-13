import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { AlertService, CloudAppEventsService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProcessedAsset } from '../../models/types';
import { parseRestError } from '../../utilities/rest-error';

interface PageInfo {
  baseUrl?: string;
  vid?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-processing-results',
  templateUrl: './processing-results.component.html',
  styleUrls: ['./processing-results.component.scss']
})
export class ProcessingResultsComponent implements OnInit, OnDestroy {
  @Input() processedData: ProcessedAsset[] = [];
  @Input() downloadUrl: string = '';
  @Input() showInstructions: boolean = false;

  private destroy$ = new Subject<void>();
  private pageInfo: PageInfo | null = null;
  private metadataLoadFailed = false;

  resultColumns = ['status', 'mmsId', 'fileTitle', 'errorMessage'];

  serverUrl: string = '';
  institutionCode: string = '';

  constructor(
    private eventsService: CloudAppEventsService,
    private translate: TranslateService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    // Subscribe to page load events to get institution/server info
    this.eventsService.getPageMetadata()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pageInfo) => {
          this.pageInfo = pageInfo;
          console.log('📄 Page metadata loaded:', pageInfo);
          this.applyServerDefaults(pageInfo);
        },
        error: (err) => {
          console.error('Failed to load page metadata:', err);
          this.metadataLoadFailed = true;
          const errorMessage = parseRestError(err, 'Load Page Metadata');
          this.alertService.error(errorMessage);
          this.applyServerDefaults();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getSuccessCount(): number {
    return this.processedData.filter(asset => asset.status === 'success').length;
  }

  getErrorCount(): number {
    return this.processedData.filter(asset => asset.status === 'error').length;
  }

  getUnchangedCount(): number {
    return this.processedData.filter(asset => asset.wasUnchanged === true).length;
  }

  getSuccessfulAssets(): ProcessedAsset[] {
    return this.processedData.filter(asset => asset.status === 'success');
  }

  getUnchangedAssets(): ProcessedAsset[] {
    return this.processedData.filter(asset => asset.wasUnchanged === true);
  }

  openEsploroAdvancedSearch() {
    const baseUrl = this.getBaseUrl();
    const vid = this.pageInfo?.vid ? this.pageInfo.vid : '';

    const advancedSearchUrl = `${baseUrl}/discovery/search?vid=${vid}&advanced=true`;
    window.open(advancedSearchUrl, '_blank');
  }

  openRepositoryJobs() {
    const baseUrl = this.getBaseUrl();
    const vid = this.pageInfo?.vid ? this.pageInfo.vid : '';
    const jobsUrl = `${baseUrl}/mng/action/home.do?vid=${vid}#jobs`;
    window.open(jobsUrl, '_blank');
  }

  trackByMmsId(index: number, asset: ProcessedAsset): string {
    return asset.mmsId;
  }

  private applyServerDefaults(pageInfo?: PageInfo): void {
    const currentUrl = pageInfo?.baseUrl || window.location.href;

    const serverMatch = currentUrl.match(/https:\/\/([^\/]+)/);
    this.serverUrl = serverMatch ? serverMatch[1] : this.serverUrl;

    const metadataInstitution = pageInfo?.institutionCode || pageInfo?.instCode;
    if (metadataInstitution) {
      this.institutionCode = metadataInstitution;
    }
  }

  private getBaseUrl(): string {
    if (this.pageInfo?.baseUrl) {
      return this.pageInfo.baseUrl;
    }

    const protocol = this.serverUrl ? 'https://' : '';
    return `${protocol}${this.serverUrl}` || window.location.origin;
  }
}
