import { CodeTableEntry } from '../services/asset.service';

export const FALLBACK_FILE_TYPES: CodeTableEntry[] = [
  { value: 'accepted', description: 'Accepted' },
  { value: 'submitted', description: 'Submitted' },
  { value: 'supplementary', description: 'Supplementary' },
  { value: 'administrative', description: 'Administrative' }
];
