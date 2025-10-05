# File Type Category Management Guide

## Overview

The Ex Libris Esploro Asset File Processor uses a controlled vocabulary system for file type categories. This guide explains how file types work, the validation system, and the automatic conversion feature.

## Understanding File Type Categories

### What Are File Type Categories?

File type categories in Esploro are **NOT** file formats (like PDF, DOCX, XLSX). Instead, they are **semantic categories** that describe the purpose or nature of the file in the research context.

**Examples:**
- `published` - Published version of a paper
- `preprint` - Pre-publication version
- `slides` - Presentation slides
- `data` - Research datasets
- `code` - Source code files
- `supplemental` - Supplementary materials

### The AssetFileAndLinkTypes Mapping Table

File type categories are managed through the `AssetFileAndLinkTypes` mapping table in the Generals API. Each entry contains:

| Field | Description | Example |
|-------|-------------|---------|
| **ID** | Unique identifier (REQUIRED for API calls) | `44260621250004721` |
| **TARGET_CODE** | Human-readable category name | `published` |
| **SOURCE_CODE_1** | Applicability context | `both` (file or link) |
| **SOURCE_CODE_2** | Asset types this category applies to | `publication,postedContent,patent` |

### Critical Rule: Use ID, Not Name

❌ **WRONG:** Using the category name in API calls
```csv
MMS ID,Remote URL,File Title,File Type
123,https://example.com/paper.pdf,Main Paper,published
```

✅ **CORRECT:** Using the category ID in API calls
```csv
MMS ID,Remote URL,File Title,File Type
123,https://example.com/paper.pdf,Main Paper,44260621250004721
```

## How File Type Validation Works

### 1. CSV Upload

When you upload a CSV file with a "File Type" column, the system automatically validates the values.

### 2. Validation Process

The system checks each unique file type value:

1. **Is it already a valid ID?** → No conversion needed ✓
2. **Does it match a target_code (name)?** → Automatic conversion available
3. **No match found** → Manual selection required

### 3. Validation Results

The system displays a **File Type Validation & Conversion** dialog showing:

- **Submitted Value**: The value from your CSV
- **Matched Category Name**: Auto-detected category name
- **Category ID**: The ID that will be used in API calls
- **Manual Selection**: Dropdown for unmatched values

### 4. Confidence Scoring

Each automatic match has a confidence score:

- **90-100%** (✓ green) - Exact match, high confidence
- **70-89%** (? orange) - Partial match, medium confidence
- **0-69%** (⚠ red) - No match, requires manual selection

## Using the Conversion System

### Scenario 1: All Values Auto-Convert

If all file type values match known categories:

1. Review the suggested mappings
2. Adjust any low-confidence matches if needed
3. Click **"Apply Conversions & Continue"**
4. Processing proceeds automatically

### Scenario 2: Some Values Require Manual Mapping

If some values don't match:

1. Review auto-matched values (sorted first)
2. For unmapped values (highlighted in red):
   - Click the dropdown in the "Manual Selection" column
   - Select the appropriate category
3. Once all values are mapped, click **"Apply Conversions & Continue"**

### Scenario 3: Cancel and Fix CSV

If you prefer to update your CSV file:

1. Click **"Cancel Processing"**
2. Update your CSV with correct ID values
3. Re-upload the corrected file

## Manual Entry Mode

### Updated UI

The manual entry form now uses a **dropdown** for File Type selection:

```
File type
┌─────────────────────────────────────────┐
│ published (ID: 44260621250004721)      ▼│
├─────────────────────────────────────────┤
│ preprint (ID: 44260621260004721)        │
│ accepted (ID: 44260621240004721)        │
│ submitted (ID: 44260621270004721)       │
│ slides (ID: 44260621320004721)          │
│ data (ID: 44260621430004721)            │
│ ...                                      │
└─────────────────────────────────────────┘
```

### How It Works

1. Dropdown automatically loads from AssetFileAndLinkTypes API
2. Shows human-readable category name with ID reference
3. Stores the ID value (not the name)
4. No manual conversion needed

## API Integration

### Fetching Categories

**Endpoint:** `GET /conf/mapping-tables/AssetFileAndLinkTypes`

**Response Format:**
```json
{
  "mapping_table": {
    "rows": {
      "row": [
        {
          "id": "44260621250004721",
          "target_code": "published",
          "source_code_1": "both",
          "source_code_2": "publication,postedContent,patent"
        }
      ]
    }
  }
}
```

### Using in Asset File API

**Endpoint:** `POST /esploro/v1/assets/{mmsId}/files`

**Payload:**
```json
{
  "records": [{
    "temporary": {
      "linksToExtract": [{
        "link.title": "Main Paper",
        "link.url": "https://example.com/paper.pdf",
        "link.type": "44260621250004721",  ← Use ID here
        "link.supplemental": "false"
      }]
    }
  }]
}
```

## Common File Type Categories

| Category | ID | Used For | Applies To |
|----------|-----|----------|------------|
| **published** | 44260621250004721 | Published version | publication, postedContent, patent |
| **preprint** | 44260621260004721 | Pre-publication version | publication, postedContent |
| **accepted** | 44260621240004721 | Accepted manuscript | publication, postedContent, patent |
| **submitted** | 44260621270004721 | Submitted version | publication, postedContent, patent |
| **slides** | 44260621320004721 | Presentation slides | conference, creativeWork, teaching |
| **data** | 44260621430004721 | Research datasets | etd |
| **code** | 44260621340004721 | Source code | etd |
| **pdf** | 44260621360004721 | PDF document | etd, etdexternal |
| **video** | 44260621410004721 | Video content | etd, teaching |
| **audio** | 44260621330004721 | Audio content | etd, teaching |

**Note:** IDs shown are examples. Your institution's mapping table may have different IDs.

## Best Practices

### CSV Preparation

✅ **Recommended Approach:**

1. Query the AssetFileAndLinkTypes API first
2. Create a reference sheet mapping names to IDs
3. Use IDs directly in your CSV
4. No conversion needed during upload

✅ **Alternative Approach:**

1. Use category names in CSV (e.g., "published", "preprint")
2. Let the system auto-convert during validation
3. Review and confirm conversions before processing

### Naming Conventions

If using names in CSV:
- Use lowercase names matching target_code exactly
- Examples: `published`, `preprint`, `slides`, `data`
- Avoid variations like "Published", "Pre-print", "Slide"

### Error Prevention

Common mistakes to avoid:

❌ Using file format names: `PDF`, `DOCX`, `XLSX`  
✅ Use category names: `published`, `data`, `code`

❌ Mixed case: `Published`, `PrePrint`  
✅ Lowercase: `published`, `preprint`

❌ Random IDs: `123456`  
✅ Valid IDs from mapping table: `44260621250004721`

## Troubleshooting

### Problem: "No automatic match found"

**Cause:** CSV value doesn't match any target_code in mapping table

**Solutions:**
1. Check spelling and capitalization
2. Verify the category exists in your institution's mapping table
3. Use the dropdown to select the correct category manually
4. Update your CSV with the correct ID or name

### Problem: Low confidence matches

**Cause:** Partial string matching detected a possible match

**Solutions:**
1. Review the suggested match carefully
2. If incorrect, use the dropdown to select the right category
3. For future uploads, use exact target_code names or IDs

### Problem: Dropdown is empty in manual entry

**Cause:** API call to AssetFileAndLinkTypes failed

**Solutions:**
1. Check network connection
2. Verify API permissions
3. Check browser console for error details
4. Contact system administrator

### Problem: Conversion fails after selection

**Cause:** Invalid ID selected or API error

**Solutions:**
1. Verify all required fields are mapped
2. Check that all unmapped values have manual selections
3. Review browser console for API errors
4. Try canceling and re-uploading

## Workflow Example

### Complete CSV Upload with Conversion

**Step 1:** Upload CSV with category names
```csv
MMS ID,Remote URL,File Title,File Type
991234567890,https://repo.edu/paper.pdf,Main Paper,published
991234567890,https://repo.edu/data.csv,Dataset,data
991234567890,https://repo.edu/code.zip,Code,code
```

**Step 2:** System validates and shows conversion dialog

| CSV Value | Matched Category | Category ID | Manual Selection |
|-----------|------------------|-------------|------------------|
| published | published | 44260621250004721 | Auto-mapped ✓ |
| data | data | 44260621430004721 | Auto-mapped ✓ |
| code | code | 44260621340004721 | Auto-mapped ✓ |

**Step 3:** Click "Apply Conversions & Continue"

**Step 4:** CSV data automatically updated:
```csv
MMS ID,Remote URL,File Title,File Type
991234567890,https://repo.edu/paper.pdf,Main Paper,44260621250004721
991234567890,https://repo.edu/data.csv,Dataset,44260621430004721
991234567890,https://repo.edu/code.zip,Code,44260621340004721
```

**Step 5:** Processing continues with correct IDs

## Technical Implementation

### Component Architecture

```
MainComponent
  ├── assetFileAndLinkTypes: AssetFileAndLinkType[]
  ├── loadAssetFilesAndLinkTypes() → API call
  └── passes to child components

CSVProcessorComponent
  ├── @Input() assetFileAndLinkTypes
  ├── validateFileTypes() → checks CSV values
  ├── matchFileTypeByTargetCode() → auto-matching
  ├── updateManualFileTypeMapping() → user selection
  └── applyFileTypeConversions() → updates CSV
```

### Validation Algorithm

```typescript
1. Extract unique file type values from CSV
2. For each value:
   a. Check if it's already a valid ID
      → If yes: confidence = 1.0, no conversion needed
   b. Try exact match with target_code
      → If yes: confidence = 0.95, auto-convertible
   c. Try partial match with target_code
      → If yes: confidence = 0.7, auto-convertible
   d. No match found
      → confidence = 0, requires manual mapping
3. Sort results: successful matches first, then alphabetically
4. Display conversion dialog
5. User reviews/adjusts
6. Apply conversions to CSV data
7. Continue processing
```

## Additional Resources

- [AssetFileAndLinkTypes API Documentation](../documentation/Working%20with%20Research%20Assets.pdf)
- [Esploro Asset API Schema](../documentation/Esploro%20Asset%20API%20Schema.docx)
- [CSV Enhancement Implementation Guide](CSV_ENHANCEMENT_IMPLEMENTATION.md)
- [Quick Start Guide](CSV_ENHANCEMENT_README.md)

## Support

For issues or questions:
1. Check this guide's Troubleshooting section
2. Review browser console for error messages
3. Contact your system administrator
4. Refer to Ex Libris Developer Network documentation

---

**Last Updated:** October 2025  
**Version:** 1.0  
**Related Feature:** CSV Asset File Processing Enhancement
