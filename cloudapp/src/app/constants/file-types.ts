import { CodeTableEntry } from '../services/asset.service';

/**
 * Fallback file types used when the Asset File Type code table cannot be retrieved from Alma.
 * These values provide a minimal, human-readable set of options so the UI remains usable offline
 * or when the configuration API is unavailable. Update these to reflect the institution's
 * preferred defaults if necessary.
 */
export const FALLBACK_FILE_TYPES: CodeTableEntry[] = [
  { value: 'accepted', description: 'Accepted version' },
  { value: 'submitted', description: 'Submitted version' },
  { value: 'supplementary', description: 'Supplementary material' },
  { value: 'administrative', description: 'Administrative' }
];
