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

export interface ProcessedAsset {
  mmsId: string;
  remoteUrl?: string;
  fileTitle?: string;
  fileDescription?: string;
  fileType?: string;
  status: 'success' | 'error' | 'pending' | 'unchanged';  // Added 'unchanged' status
  errorMessage?: string;
  wasUnchanged?: boolean;  // Flag for post-import comparison
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
