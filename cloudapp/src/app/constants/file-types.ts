import { CodeTableEntry } from '../services/asset.service';

/**
 * Fallback file types to use when the API call to fetch file types fails
 */
export const FALLBACK_FILE_TYPES: CodeTableEntry[] = [
  { value: 'accepted', description: 'Accepted' },
  { value: 'submitted', description: 'Submitted' },
  { value: 'supplementary', description: 'Supplementary' },
  { value: 'administrative', description: 'Administrative' }
];
