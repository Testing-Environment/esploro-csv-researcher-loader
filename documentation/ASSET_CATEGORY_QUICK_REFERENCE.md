# Asset Category Mapping - Quick Reference

## Overview

The Esploro CSV Researcher Loader now includes comprehensive asset category mapping that extracts category codes from full Esploro resource types for proper file type filtering.

## Key Concept

**Problem:** Esploro API returns `"publication.journalArticle"`, but mapping table uses `"publication"`  
**Solution:** Extract category from full resource type using lookup table

## Files

- **`constants/asset-categories.ts`** - Category mappings and utility functions (new)
- **`services/asset.service.ts`** - Updated to use category extraction

## Usage

### Import the Utilities

```typescript
import { 
  extractCategoryFromResourceType,
  getCategoryByCode,
  ASSET_CATEGORIES,
  ASSET_TYPE_TO_CATEGORY 
} from '../constants/asset-categories';
```

### Extract Category from Resource Type

```typescript
const resourceType = "publication.journalArticle";
const category = extractCategoryFromResourceType(resourceType);
// Returns: "publication"

const resourceType2 = "teaching.activity";
const category2 = extractCategoryFromResourceType(resourceType2);
// Returns: "teaching"
```

### Validate Resource Type

```typescript
import { isValidResourceType } from '../constants/asset-categories';

isValidResourceType('publication.journalArticle') // true
isValidResourceType('invalid.type')               // false
```

### Get Category Information

```typescript
import { getCategoryByCode } from '../constants/asset-categories';

const category = getCategoryByCode('publication');
// Returns: { code: 'publication', name: 'Publication', description: '...' }
```

### Get All Categories

```typescript
import { getAllCategories, getAllCategoryCodes } from '../constants/asset-categories';

const codes = getAllCategoryCodes();
// Returns: ['conference', 'creativeWork', 'dataset', 'etd', ...]

const categories = getAllCategories();
// Returns: [{ code: 'conference', name: '...', ... }, ...]
```

## Available Categories

| Code | Name | Subcategories |
|------|------|---------------|
| `conference` | Conference/Event | 6 types |
| `creativeWork` | Creative Work | 20 types |
| `dataset` | Dataset | 1 type |
| `etd` | ETD | 3 types |
| `etdexternal` | External ETD | 3 types |
| `interactiveResource` | Interactive Resource | 5 types |
| `other` | Other | 3 types |
| `patent` | Patent | 1 type |
| `postedContent` | Posted Content | 3 types |
| `publication` | Publication | 18 types |
| `software` | Software | 2 types |
| `teaching` | Teaching and Learning | 15 types |

**Total:** 12 categories, 80 subcategories

## Example Mappings

### Publication Types
```
publication.journalArticle    → publication
publication.bookChapter       → publication
publication.report            → publication
publication.conferenceProceeding → publication
```

### Teaching and Learning Types
```
teaching.activity    → teaching
teaching.lecture     → teaching
teaching.syllabus    → teaching
teaching.assignment  → teaching
```

### ETD Types
```
etd.doctoral        → etd
etd.graduate        → etd
etd.undergraduate   → etd
```

## API Field Locations

The asset service checks these fields in order:

1. `records[0]["resourcetype.esploro"]` ← **Primary** (Esploro standard)
2. `records[0].resourcetype.esploro` (nested structure)
3. `records[0].asset_type.value` (legacy)
4. `records[0].assetType.value` (legacy)
5. `records[0].asset_type` (legacy)
6. `records[0].assetType` (legacy)
7. `records[0].type` (fallback)

## File Type Filtering

### How It Works

1. Asset metadata extracted: `"publication.journalArticle"`
2. Category extracted: `"publication"`
3. File types filtered where `column2` includes `"publication"`
4. Only compatible file types shown

### Column2 Format in Mapping Table

- **Single category:** `"publication"`
- **Multiple categories:** `"etd,teaching"` (comma-separated)
- **All categories:** `"all"`

### Filter Logic

```typescript
// Asset type: "teaching"
// Mapping table column2: "etd,teaching"
// Result: MATCH ✅

// Asset type: "publication"
// Mapping table column2: "etd,teaching"
// Result: NO MATCH ❌

// Asset type: anything
// Mapping table column2: "all"
// Result: MATCH ✅
```

## Important Notes

### Category-Level Only

❌ **NOT supported:** Filtering by subcategory (e.g., only `teaching.activity`)  
✅ **Supported:** Filtering by category (e.g., entire `teaching` category)

**Why?** The AssetFileAndLinkTypes mapping table stores only category codes in `column2`, not full resource types.

### Fallback Behavior

If resource type is invalid or not found:
- `extractCategoryFromResourceType()` returns empty string
- File type filtering shows **all** file types (no restriction)

### No Breaking Changes

- Legacy field names still supported
- Existing functionality preserved
- Enhanced with primary field lookup

## Testing Examples

### Test Category Extraction

```typescript
import { extractCategoryFromResourceType } from '../constants/asset-categories';

// Valid types
extractCategoryFromResourceType('publication.journalArticle') // "publication" ✅
extractCategoryFromResourceType('teaching.activity')          // "teaching" ✅
extractCategoryFromResourceType('etd.doctoral')               // "etd" ✅

// Invalid types
extractCategoryFromResourceType('unknown.type')               // "" ✅
extractCategoryFromResourceType('')                           // "" ✅
extractCategoryFromResourceType(null)                         // "" ✅

// Already a category code
extractCategoryFromResourceType('publication')                // "publication" ✅
```

### Test Validation

```typescript
import { isValidResourceType, isValidCategoryCode } from '../constants/asset-categories';

// Resource type validation
isValidResourceType('publication.journalArticle') // true ✅
isValidResourceType('teaching.activity')          // true ✅
isValidResourceType('invalid.type')               // false ✅

// Category code validation
isValidCategoryCode('publication')                // true ✅
isValidCategoryCode('teaching')                   // true ✅
isValidCategoryCode('invalid')                    // false ✅
```

## Common Use Cases

### Case 1: Manual Entry
User enters asset ID → System fetches metadata → Extracts category → Filters file types → Shows dropdown

### Case 2: CSV Upload
CSV contains multiple asset IDs → System fetches all metadata → Extracts categories → Filters per asset → Validates selections

### Case 3: Pre-Import Caching
Asset metadata cached on load → Category extracted during cache → Used for immediate filtering → No re-fetch needed

## Documentation

**Full Details:** `ASSET_CATEGORY_MAPPING.md`  
**Source Reference:** `documentation/Esploro_Categories_Asset-Types_Type-Codes.md`

## Summary

✅ 12 categories, 80 subcategories fully mapped  
✅ Primary field: `resourcetype.esploro`  
✅ Backward compatible with legacy fields  
✅ Category-level filtering (not subcategory)  
✅ Utility functions for validation and lookup  
✅ No breaking changes to existing code  

The system now correctly maps Esploro resource types to category codes for accurate file type filtering.
