/**
 * Esploro Asset Category Mappings
 * 
 * This file maps Esploro resourcetype.esploro values to their parent category codes.
 * The mapping happens at the category level, not subcategory level.
 * 
 * Example: "publication.journalArticle" maps to category code "publication"
 * 
 * Category codes are used in:
 * - AssetFileAndLinkTypes mapping table (column2 / sourceCode2)
 * - File type filtering based on asset type
 * - CSV processing and validation
 * 
 * Note: File types cannot be configured specifically for subcategories (e.g., teaching.activity).
 * All file type mappings apply to the entire category (e.g., "teaching" for all Teaching and Learning assets).
 * 
 * Source: records[0]["resourcetype.esploro"] from GET /esploro/v1/assets/{id}
 */

/**
 * Asset category definition
 */
export interface AssetCategory {
  /** Category code used in mapping tables (e.g., "publication", "teaching", "etd") */
  code: string;
  /** Display name of the category */
  name: string;
  /** Description of the category */
  description: string;
}

/**
 * All available Esploro asset categories
 * Ordered alphabetically by category code
 */
export const ASSET_CATEGORIES: Record<string, AssetCategory> = {
  'conference': {
    code: 'conference',
    name: 'Conference/Event',
    description: 'Conference papers, posters, presentations, and event materials'
  },
  'creativeWork': {
    code: 'creativeWork',
    name: 'Creative Work',
    description: 'Creative and artistic works including performances, compositions, and visual arts'
  },
  'dataset': {
    code: 'dataset',
    name: 'Dataset',
    description: 'Collections of related facts and data'
  },
  'etd': {
    code: 'etd',
    name: 'ETD',
    description: 'Electronic Theses and Dissertations from this institution'
  },
  'etdexternal': {
    code: 'etdexternal',
    name: 'External ETD',
    description: 'Electronic Theses and Dissertations from external institutions'
  },
  'interactiveResource': {
    code: 'interactiveResource',
    name: 'Interactive Resource',
    description: 'Digital interactive resources including blogs, podcasts, and websites'
  },
  'other': {
    code: 'other',
    name: 'Other',
    description: 'Maps, models, and other unclassifiable resources'
  },
  'patent': {
    code: 'patent',
    name: 'Patent',
    description: 'Patents and intellectual property'
  },
  'postedContent': {
    code: 'postedContent',
    name: 'Posted Content',
    description: 'Preprints, accepted manuscripts, and working papers'
  },
  'publication': {
    code: 'publication',
    name: 'Publication',
    description: 'Published works including articles, books, and reports'
  },
  'software': {
    code: 'software',
    name: 'Software',
    description: 'Software code and workflows'
  },
  'teaching': {
    code: 'teaching',
    name: 'Teaching and Learning',
    description: 'Educational materials and teaching resources'
  }
};

/**
 * Map of all Esploro asset type codes to their parent category codes
 * Format: "category.subcategory" -> "category"
 * 
 * Source: Esploro_Categories_Asset-Types_Type-Codes.md
 */
export const ASSET_TYPE_TO_CATEGORY: Record<string, string> = {
  // Conference/Event
  'conference.conferencePaper': 'conference',
  'conference.conferencePoster': 'conference',
  'conference.conferencePresentation': 'conference',
  'conference.conferenceProgram': 'conference',
  'conference.eventposter': 'conference',
  'conference.presentation': 'conference',

  // Creative Work
  'creativeWork.choreography': 'creativeWork',
  'creativeWork.dance': 'creativeWork',
  'creativeWork.designAndArchitecture': 'creativeWork',
  'creativeWork.drama': 'creativeWork',
  'creativeWork.essay': 'creativeWork',
  'creativeWork.exhibitionCatalog': 'creativeWork',
  'creativeWork.fiction': 'creativeWork',
  'creativeWork.film': 'creativeWork',
  'creativeWork.musicalComposition': 'creativeWork',
  'creativeWork.musicalPerformance': 'creativeWork',
  'creativeWork.musicalScore': 'creativeWork',
  'creativeWork.newMedia': 'creativeWork',
  'creativeWork.nonFiction': 'creativeWork',
  'creativeWork.other': 'creativeWork',
  'creativeWork.painting': 'creativeWork',
  'creativeWork.poetry': 'creativeWork',
  'creativeWork.script': 'creativeWork',
  'creativeWork.sculpture': 'creativeWork',
  'creativeWork.setDesign': 'creativeWork',
  'creativeWork.theater': 'creativeWork',

  // Dataset
  'dataset.dataset': 'dataset',

  // ETD
  'etd.doctoral': 'etd',
  'etd.graduate': 'etd',
  'etd.undergraduate': 'etd',

  // External ETD
  'etdexternal.doctoral_external': 'etdexternal',
  'etdexternal.graduate_external': 'etdexternal',
  'etdexternal.undergraduate_external': 'etdexternal',

  // Interactive Resource
  'interactiveResource.blog': 'interactiveResource',
  'interactiveResource.podcast': 'interactiveResource',
  'interactiveResource.virtualRealityEnvironment': 'interactiveResource',
  'interactiveResource.webinar': 'interactiveResource',
  'interactiveResource.website': 'interactiveResource',

  // Other
  'other.map': 'other',
  'other.model': 'other',
  'other.other': 'other',

  // Patent
  'patent.patent': 'patent',

  // Posted Content
  'postedContent.acceptedManuscript': 'postedContent',
  'postedContent.preprint': 'postedContent',
  'postedContent.workingPaper': 'postedContent',

  // Publication
  'publication.abstract': 'publication',
  'publication.annotation': 'publication',
  'publication.bibliography': 'publication',
  'publication.book': 'publication',
  'publication.bookChapter': 'publication',
  'publication.bookReview': 'publication',
  'publication.conferenceProceeding': 'publication',
  'publication.dictionaryEntry': 'publication',
  'publication.editedBook': 'publication',
  'publication.editorial': 'publication',
  'publication.encyclopediaEntry': 'publication',
  'publication.journalArticle': 'publication',
  'publication.journalIssue': 'publication',
  'publication.letter': 'publication',
  'publication.magazineArticle': 'publication',
  'publication.newsletterArticle': 'publication',
  'publication.newspaperArticle': 'publication',
  'publication.report': 'publication',
  'publication.technicalDocumentation': 'publication',
  'publication.translation': 'publication',

  // Software
  'software.code': 'software',
  'software.workflow': 'software',

  // Teaching and Learning
  'teaching.activity': 'teaching',
  'teaching.assignment': 'teaching',
  'teaching.casestudy': 'teaching',
  'teaching.coursemodule': 'teaching',
  'teaching.demonstration': 'teaching',
  'teaching.flashcards': 'teaching',
  'teaching.lecture': 'teaching',
  'teaching.manual': 'teaching',
  'teaching.other': 'teaching',
  'teaching.outline': 'teaching',
  'teaching.questionbank': 'teaching',
  'teaching.studyguide': 'teaching',
  'teaching.syllabus': 'teaching',
  'teaching.textbook': 'teaching',
  'teaching.tutorial': 'teaching'
};

/**
 * Extract category code from full Esploro asset type
 * 
 * @param resourceType - Full Esploro type (e.g., "publication.journalArticle")
 * @returns Category code (e.g., "publication") or empty string if not found
 * 
 * @example
 * ```typescript
 * extractCategoryFromResourceType('publication.journalArticle') // Returns: 'publication'
 * extractCategoryFromResourceType('teaching.activity')          // Returns: 'teaching'
 * extractCategoryFromResourceType('etd.doctoral')               // Returns: 'etd'
 * extractCategoryFromResourceType('unknown.type')               // Returns: ''
 * ```
 */
export function extractCategoryFromResourceType(resourceType: string): string {
  if (!resourceType) {
    return '';
  }

  const normalizedType = resourceType.trim();

  // Direct lookup in mapping
  if (ASSET_TYPE_TO_CATEGORY[normalizedType]) {
    return ASSET_TYPE_TO_CATEGORY[normalizedType];
  }

  // Fallback: extract category from dot notation (e.g., "publication.journalArticle" -> "publication")
  const parts = normalizedType.split('.');
  if (parts.length > 1 && ASSET_CATEGORIES[parts[0]]) {
    return parts[0];
  }

  // If it's already a category code, return it
  if (ASSET_CATEGORIES[normalizedType]) {
    return normalizedType;
  }

  return '';
}

/**
 * Get category information by code
 * 
 * @param categoryCode - Category code (e.g., "publication", "teaching")
 * @returns Category information or null if not found
 */
export function getCategoryByCode(categoryCode: string): AssetCategory | null {
  return ASSET_CATEGORIES[categoryCode] || null;
}

/**
 * Get category information from full resource type
 * 
 * @param resourceType - Full Esploro type (e.g., "publication.journalArticle")
 * @returns Category information or null if not found
 */
export function getCategoryFromResourceType(resourceType: string): AssetCategory | null {
  const categoryCode = extractCategoryFromResourceType(resourceType);
  return categoryCode ? getCategoryByCode(categoryCode) : null;
}

/**
 * Get all category codes as array
 * Useful for validation and dropdown options
 */
export function getAllCategoryCodes(): string[] {
  return Object.keys(ASSET_CATEGORIES);
}

/**
 * Get all categories as array
 * Useful for UI display
 */
export function getAllCategories(): AssetCategory[] {
  return Object.values(ASSET_CATEGORIES);
}

/**
 * Validate if a resource type is valid
 * 
 * @param resourceType - Resource type to validate
 * @returns True if valid, false otherwise
 */
export function isValidResourceType(resourceType: string): boolean {
  return !!ASSET_TYPE_TO_CATEGORY[resourceType];
}

/**
 * Validate if a category code is valid
 * 
 * @param categoryCode - Category code to validate
 * @returns True if valid, false otherwise
 */
export function isValidCategoryCode(categoryCode: string): boolean {
  return !!ASSET_CATEGORIES[categoryCode];
}
