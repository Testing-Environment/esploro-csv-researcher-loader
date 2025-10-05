import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CloudAppEventsService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProcessedAsset } from '../../models/types';

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

  resultColumns = ['status', 'mmsId', 'fileTitle', 'errorMessage'];

  constructor(
    private eventsService: CloudAppEventsService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.eventsService.onPageLoad(this.onPageLoad);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private onPageLoad = (pageInfo: PageInfo) => {
    this.pageInfo = pageInfo;
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

  /**
   * Generate Esploro Viewer URL following Ex Libris URL patterns
   */
  getEsploroViewerUrl(mmsId: string): string {
    if (!this.pageInfo) {
      return '';
    }

    // Extract server and institution from current page info
    const currentUrl = this.pageInfo.baseUrl || window.location.href;
    const serverMatch = currentUrl.match(/https:\/\/([^\/]+)/);
    const institutionMatch = currentUrl.match(/institution\/([^\/]+)/);

    const serverName = serverMatch ? serverMatch[1] : '';
    const institutionCode = institutionMatch ? institutionMatch[1] : '';

    if (!serverName || !institutionCode) {
      console.warn('Could not extract server or institution information');
      return '';
    }

    return `https://${serverName}/esploro/outputs/${mmsId}/filesAndLinks?institution=${institutionCode}`;
  }

  openEsploroAdvancedSearch() {
    if (!this.pageInfo) return;

    const baseUrl = this.pageInfo.baseUrl;
    const advancedSearchUrl = `${baseUrl}/discovery/search?vid=${this.pageInfo.vid}&advanced=true`;
    window.open(advancedSearchUrl, '_blank');
  }

  openRepositoryJobs() {
    if (!this.pageInfo) return;

    const baseUrl = this.pageInfo.baseUrl;
    const jobsUrl = `${baseUrl}/mng/action/home.do?vid=${this.pageInfo.vid}#jobs`;
    window.open(jobsUrl, '_blank');
  }

  trackByMmsId(index: number, asset: ProcessedAsset): string {
    return asset.mmsId;
  }
}
