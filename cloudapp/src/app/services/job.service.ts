import { Injectable } from '@angular/core';
import { CloudAppRestService, HttpMethod, Request } from '@exlibris/exl-cloudapp-angular-lib';
import { Observable, throwError } from 'rxjs';
import { expand, map, reduce, catchError } from 'rxjs/operators';

export interface Job {
  id?: string;
  name?: string;
  description?: string;
  [key: string]: any;
}

export interface JobInstance {
  id?: string;
  status?: {
    value?: string;
  };
  counter?: Array<{
    type?: string;
    value?: number;
  }>;
  report?: {
    value?: string;
  };
  [key: string]: any;
}

export interface JobListResponse {
  job?: Job[];
  total_record_count?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private readonly IMPORT_JOB_ID = 'M50762';
  private readonly IMPORT_JOB_NAMES = [
    'Import Research Assets Files',
    'Import Asset Files',
    'Import Research Assets Files - via API - forFileUploadJobViaUpdate'
  ];

  constructor(private restService: CloudAppRestService) {}

  /**
   * Get details of a specific job
   * @param jobId The job ID
   */
  getJobDetails(jobId: string): Observable<Job> {
    const request: Request = {
      url: `/conf/jobs/${jobId}`,
      method: HttpMethod.GET
    };

    return this.restService.call(request);
  }

  /**
   * Find a job by its name by searching through all jobs
   * @param jobName The name of the job to find
   */
  findJobByName(jobName: string): Observable<Job | null> {
    return this.getAllJobs().pipe(
      map((jobs: Job[]) => {
        const found = jobs.find(job => 
          job.name === jobName || 
          this.IMPORT_JOB_NAMES.some(name => job.name?.includes(name))
        );
        return found || null;
      })
    );
  }

  /**
   * Get all jobs by handling pagination
   */
  private getAllJobs(): Observable<Job[]> {
    return this.getJobsPage(0, 100).pipe(
      expand((response: JobListResponse) => {
        const jobs = response.job || [];
        const total = response.total_record_count || 0;
        const currentOffset = jobs.length;
        
        // Continue fetching if there are more jobs
        if (currentOffset < total) {
          return this.getJobsPage(currentOffset, 100);
        }
        
        // Return empty to stop the expansion
        return [];
      }),
      reduce((acc: Job[], response: JobListResponse) => {
        const jobs = response.job || [];
        return acc.concat(jobs);
      }, [])
    );
  }

  /**
   * Get a page of jobs
   * @param offset The offset for pagination
   * @param limit The number of jobs to retrieve
   */
  private getJobsPage(offset: number, limit: number): Observable<JobListResponse> {
    const request: Request = {
      url: `/conf/jobs?offset=${offset}&limit=${limit}`,
      method: HttpMethod.GET
    };

    return this.restService.call(request);
  }

  /**
   * Run a job for a specific set
   * @param jobId The job ID
   * @param setId The set ID
   */
  runJob(jobId: string, setId: string): Observable<JobInstance> {
    const request: Request = {
      url: `/conf/jobs/${jobId}/instances`,
      method: HttpMethod.POST,
      headers: { 'Content-Type': 'application/json' },
      requestBody: {
        set_id: setId
      }
    };

    return this.restService.call(request);
  }

  /**
   * Get the status of a job instance
   * @param jobId The job ID
   * @param instanceId The instance ID
   */
  getJobInstance(jobId: string, instanceId: string): Observable<JobInstance> {
    const request: Request = {
      url: `/conf/jobs/${jobId}/instances/${instanceId}`,
      method: HttpMethod.GET
    };

    return this.restService.call(request);
  }

  /**
   * Find the import job ID, trying the hardcoded ID first, then searching
   */
  findImportJobId(): Observable<string> {
    // First try the hardcoded ID
    return this.getJobDetails(this.IMPORT_JOB_ID).pipe(
      map((job: Job) => {
        // Verify the job name matches one of the expected names
        const isValidJob = this.IMPORT_JOB_NAMES.some(name => 
          job.name?.includes(name) || job.name === name
        );
        
        if (isValidJob) {
          return this.IMPORT_JOB_ID;
        }
        
        throw new Error('Hardcoded job ID does not match expected job name');
      }),
      catchError(() => {
        // Fallback: search for the job by name
        return this.findJobByName(this.IMPORT_JOB_NAMES[0]).pipe(
          map((job: Job | null) => {
            if (job && job.id) {
              return job.id;
            }
            throw new Error('Could not find import job');
          })
        );
      })
    );
  }
}
