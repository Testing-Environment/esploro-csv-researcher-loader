/**
 * Lightweight representation of a file type hint derived from the
 * AssetFileAndLinkTypes mapping table. Used primarily for UI guidance
 * and CSV auto-mapping heuristics.
 */
export interface FileType {
  code: string;
  description: string;
}

/**
 * AssetFileAndLinkTypes mapping table entry from Generals API
 * Retrieved via: /conf/mapping-tables/AssetFileAndLinkTypes
 */
export interface AssetFileAndLinkType {
  id: string;  // The ID value to use in API calls
  targetCode: string;  // The human-readable name/label
  sourceCode1?: string;  // Applicability: "file", "link", or "both"
  sourceCode2?: string;  // Comma-separated asset types (e.g., "publication,patent")
  sourceCode3?: string;
  sourceCode4?: string;
  sourceCode5?: string;
}

/**
 * Asset metadata from Esploro API
 */
export interface AssetMetadata {
  mmsId: string;
  title?: string;
  assetType?: string;  // Asset category/type for filtering file types
  files?: AssetFile[];  // Current files attached to asset
}

/**
 * Asset file/link information
 */
export interface AssetFile {
  id?: string;
  title?: string;
  url?: string;
  type?: string;
  description?: string;
  supplemental?: boolean;
}

/**
 * Cached asset state before import
 */
export interface CachedAssetState {
  mmsId: string;
  assetType: string;
  filesBefore: AssetFile[];  // Snapshot before import
  filesAfter?: AssetFile[];  // Populated after import
  remoteUrlFromCSV?: string;  // URL that was attempted to import
}

/**
 * Unchanged asset report entry
 */
export interface UnchangedAssetReport {
  mmsId: string;
  assetTitle: string;
  remoteUrl: string;
  reason?: string;  // Why it might not have changed
}

/**
 * File type conversion mapping for CSV validation
 */
export interface FileTypeConversion {
  csvValue: string;  // Value from CSV
  matchedTargetCode?: string;  // Matched target_code from mapping table
  matchedId?: string;  // Matched ID from mapping table
  confidence: number;  // Match confidence (0-1)
  requiresManualMapping: boolean;  // True if no automatic match found
}

/**
 * File type validation state
 */
export interface FileTypeValidationState {
  hasInvalidTypes: boolean;
  conversions: FileTypeConversion[];
  autoConvertible: boolean;  // True if all values can be auto-converted
}

/**
 * File verification result for Phase 3.5
 */
export interface FileVerificationResult {
  url: string;
  title?: string;
  wasFound: boolean;
  matchType: 'exact' | 'partial' | 'none';
  existingFile?: {
    id: string;
    title?: string;
    type?: string;
    status?: string;
  };
  verificationDetails: string;
}

/**
 * Asset verification result for Phase 3.5
 */
export interface AssetVerificationResult {
  mmsId: string;
  status: 'verified_success' | 'verified_partial' | 'verified_failed' | 'unchanged' | 'error';
  filesBeforeCount: number;
  filesAfterCount: number;
  filesAdded: number;
  filesExpected: number;
  fileVerifications: FileVerificationResult[];
  verificationSummary: string;
  warnings: string[];
}

/**
 * Batch verification summary for Phase 3.5
 */
export interface BatchVerificationSummary {
  totalAssets: number;
  verifiedSuccess: number;
  verifiedPartial: number;
  verifiedFailed: number;
  unchanged: number;
  errors: number;
  totalFilesExpected: number;
  totalFilesAdded: number;
  successRate: number;
  warnings: string[];
  recommendations: string[];
}

export interface ProcessedAsset {
  mmsId: string;
  remoteUrl?: string;
  fileTitle?: string;
  fileDescription?: string;
  fileType?: string;
  status: 'success' | 'error' | 'pending' | 'unchanged';  // Added 'unchanged' status
  errorMessage?: string;
  wasUnchanged?: boolean;  // Flag for post-import comparison
  verificationResult?: AssetVerificationResult;  // Phase 3.5 verification
}

export interface ColumnMapping {
  csvHeader: string;
  sampleValue: string;
  mappedField: string;
  confidence: number;
}

export interface CSVData {
  headers: string[];
  data: any[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  fileTypeValidation?: FileTypeValidationState;
}

/**
 * Set creation payload for POST /conf/sets
 */
export interface SetPayload {
  name: string;
  description: string;
  type: { value: string };
  content: { value: string };
  private: { value: string };
  status: { value: string };
  members?: {
    total_record_count: string;
    member: Array<{ id: string; link?: string }>;
  };
}

/**
 * Set creation response from POST /conf/sets
 */
export interface SetResponse {
  id: string;
  name: string;
  description?: string;
  type?: { value: string; desc?: string };
  content?: { value: string; desc?: string };
  private?: { value: string; desc?: string };
  status?: { value: string; desc?: string };
  link?: string;
  created_by?: { value: string; desc?: string };
  created_date?: string;
  number_of_members?: { value: number; link?: string };
}

/**
 * Set member entry
 */
export interface SetMember {
  id: string;
  link?: string;
}

/**
 * Add members payload for POST /conf/sets/{setId}?op=add_members
 */
export interface AddSetMembersPayload {
  members: {
    member: SetMember[];
  };
}

/**
 * Response from adding members to a set
 * Returns the full set object with updated member count
 */
export interface AddSetMembersResponse extends SetResponse {
  members?: {
    member: SetMember[];
  };
}

/**
 * Job parameter for POST /conf/jobs/{jobId}?op=run
 */
export interface JobParameter {
  name: { value: string };
  value: string;
}

/**
 * Run job payload for POST /conf/jobs/{jobId}?op=run
 */
export interface RunJobPayload {
  parameter: JobParameter[];
}

/**
 * Job execution response from POST /conf/jobs/{jobId}?op=run
 */
export interface JobExecutionResponse {
  id: string;
  name: string;
  description?: string;
  type?: { value: string; desc?: string };
  category?: { value: string; desc?: string };
  content?: { value: string; desc?: string };
  parameter?: JobParameter[];
  additional_info?: {
    value: string;  // e.g., "Job no. 9563654220000561 triggered on ..."
    link?: string;  // Link to job instance
    instance?: {
      value: string;  // Instance ID
      desc: string;
    };
  };
  link?: string;
}

/**
 * Job Instance Counter - Tracks specific metrics for job execution
 */
export interface JobInstanceCounter {
  type: { value: string; desc: string };
  value: string;
}

/**
 * Job Instance Alert - Alerts or messages from job execution
 */
export interface JobInstanceAlert {
  value: string;
  desc: string;
}

/**
 * Job Instance Status - Full job instance response with progress and counters
 */
export interface JobInstanceStatus {
  id: string;
  name: string;
  progress: number;  // 0-100
  status: {
    value: 'COMPLETED_SUCCESS' | 'COMPLETED_FAILED' | 'RUNNING' | 'QUEUED' | 'CANCELLED';
    desc: string;
  };
  submit_time?: string;
  start_time?: string;
  end_time?: string;
  counter?: JobInstanceCounter[];
  alert?: JobInstanceAlert[];
  job_info?: {
    id: string;
    name: string;
    link?: string;
  };
  link?: string;
}
