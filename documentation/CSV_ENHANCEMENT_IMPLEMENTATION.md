# Ex Libris Cloud App Enhancement - Implementation Guide

## Overview

This implementation enhances the existing Esploro CSV Asset Loader with comprehensive CSV file processing capabilities for bulk asset file operations. The enhancement follows official Ex Libris Cloud Apps development guidelines and integrates seamlessly with the Esploro platform.

## Features Implemented

### 1. **Dual Processing Modes**
- **Manual Entry Tab**: Original functionality for processing individual asset files
- **CSV Upload Tab**: New bulk processing capability with intelligent column mapping

### 2. **CSV Processing Workflow**

#### Phase 1: File Upload
- Drag-and-drop interface for CSV files
- File validation (type, size, format)
- RFC 4180 compliant CSV parsing
- Support for quoted values and embedded commas

#### Phase 2: Intelligent Column Mapping
- Automatic field detection based on:
  - Column header names
  - Sample data patterns
  - Ex Libris naming conventions
- Confidence scoring for mapping suggestions
- Manual override capability
- Real-time validation

#### Phase 3: Batch Processing
- Sequential asset validation
- File attachment processing
- Progress tracking with visual feedback
- Error handling and reporting
- API throttling protection

#### Phase 4: Results & Workflow
- Success/failure summary statistics
- Detailed results table
- MMS ID export for downstream processing
- Step-by-step workflow instructions
- Direct links to Esploro advanced search and job monitoring

## File Structure

```
cloudapp/src/app/
├── components/
│   ├── csv-processor/
│   │   ├── csv-processor.component.ts
│   │   ├── csv-processor.component.html
│   │   └── csv-processor.component.scss
│   └── processing-results/
│       ├── processing-results.component.ts
│       ├── processing-results.component.html
│       └── processing-results.component.scss
├── models/
│   ├── asset.ts (existing)
│   └── types.ts (new)
├── services/
│   └── asset.service.ts (enhanced)
├── main/
│   ├── main.component.ts (enhanced)
│   ├── main.component.html (enhanced)
│   └── main.component.scss (enhanced)
├── enhanced-material.module.ts (new)
└── app.module.ts (updated)
```

## Technical Implementation Details

### Data Types and Interfaces

#### `types.ts` - Core Type Definitions
```typescript
interface FileType {
  code: string;
  description: string;
}

interface ProcessedAsset {
  mmsId: string;
  remoteUrl?: string;
  fileTitle?: string;
  fileDescription?: string;
  fileType?: string;
  status: 'success' | 'error' | 'pending';
  errorMessage?: string;
}

interface ColumnMapping {
  csvHeader: string;
  sampleValue: string;
  mappedField: string;
  confidence: number;
}
```

### CSV Parser Implementation

The CSV parser follows RFC 4180 standards:
- Handles quoted fields with embedded commas
- Supports escaped quotes (double quotes)
- Preserves whitespace within quoted fields
- Validates header row structure
- Gracefully handles malformed rows

### Column Mapping Algorithm

**Detection Patterns:**
- **MMS ID**: Matches patterns like 'mms', 'mmsid', 'id', 'assetid', 'recordid'
- **URL**: Matches 'url', 'link', 'href', 'uri' or detects HTTP(S) in sample data
- **Title**: Matches 'title', 'name', 'filename', 'filetitle'
- **Description**: Matches 'desc', 'description', 'summary', 'abstract'
- **File Type**: Matches 'type', 'format', 'extension' or known file type codes

**Confidence Scoring:**
- 0.9: High confidence (exact matches for critical fields like MMS ID)
- 0.8: Good confidence (URL, Title, Type matches)
- 0.7: Moderate confidence (Description matches)
- 0.1: Low confidence (defaults to 'ignore')

### API Integration

#### Asset Validation
```typescript
GET /esploro/v1/assets/{mmsId}
```
- Verifies asset exists before processing
- Returns 404 if asset not found

#### File Processing
```typescript
POST /esploro/v1/assets/{mmsId}/files
Content-Type: application/json

{
  "url": "https://example.com/file.pdf",
  "title": "Document Title",
  "description": "Optional description",
  "type": "PDF"
}
```

### Error Handling

**Client-Side Validation:**
- File type (.csv extension)
- File size (max 10MB)
- CSV structure (headers, data rows)
- Required field mapping (MMS ID)
- Duplicate field mappings

**Server-Side Error Handling:**
- Network errors (status 0)
- Asset not found (404)
- Validation errors (400)
- Permission errors (401, 403)
- Generic API errors

## Translation Keys

All user-facing text is internationalized using Angular i18n with ICU message format:

### Main Sections
- `Main.Title`: Application title
- `Main.Description`: Application description
- `Tabs.ManualEntry`: Manual entry tab label
- `Tabs.CSVUpload`: CSV upload tab label

### CSV Upload
- `CSV.Upload.*`: Upload interface text
- `CSV.Requirements.*`: File requirement messages
- `CSV.Mapping.*`: Column mapping interface
- `CSV.Preview.*`: Data preview messages
- `CSV.Actions.*`: Action button labels
- `CSV.Processing.*`: Processing status messages

### Field Descriptions
- `Fields.MmsId.Description`
- `Fields.RemoteUrl.Description`
- `Fields.FileTitle.Description`
- `Fields.FileDescription.Description`
- `Fields.FileType.Description`

### Validation & Errors
- `Validation.MmsIdRequired`
- `Validation.DuplicateMappings`
- `Errors.InvalidFileType`
- `Errors.FileTooLarge`
- `Errors.EmptyFile`
- `Errors.FileProcessing`
- `Errors.BatchProcessing`

### Results & Instructions
- `Results.*`: Results display
- `Instructions.Step1-4.*`: Workflow step instructions

## Workflow Integration with Esploro

### Step 1: Process CSV and Generate MMS ID File
The application processes the CSV, validates assets, and generates a downloadable CSV containing only successful MMS IDs.

### Step 2: Create Asset Set in Esploro
Users upload the MMS ID CSV through Esploro's Advanced Search:
1. Navigate to Search & Browse > Advanced Search
2. Click "Upload file with identifiers"
3. Select MMS ID as identifier type
4. Create named set

### Step 3: Run Import Job
Execute the "Import Research Assets Files" job:
1. Go to Repository > Monitor Jobs > Run a Job
2. Select "Import Research Assets Files"
3. Choose the created set
4. Monitor job progress

### Step 4: Access Files
View processed files through generated Esploro viewer URLs:
```
https://{server}/esploro/outputs/{mmsId}/filesAndLinks?institution={code}
```

## Material Design Components Used

### Core Components
- `mat-tab-group`: Tab navigation
- `mat-card`: Content containers
- `mat-table`: Results display
- `mat-stepper`: Workflow instructions
- `mat-progress-bar`: Processing progress
- `mat-select`: Dropdown fields
- `mat-icon`: Icons throughout
- `mat-button`: Action buttons

### Additional Modules
- `ClipboardModule`: Copy-to-clipboard functionality
- `MatTooltipModule`: Contextual help

## Styling Approach

### Design System
- **Primary Color**: `#3f51b5` (Material Indigo)
- **Success Color**: `#4caf50` (Material Green)
- **Error Color**: `#f44336` (Material Red)
- **Neutral Gray**: `#666`

### Layout Patterns
- Max content width: 1400px
- Consistent spacing: 8px grid system
- Card-based content organization
- Responsive grid layouts

### Interactive States
- Hover effects on upload area
- Drag-active state with color change
- Disabled states for buttons
- Loading indicators

## Performance Considerations

### Optimization Strategies
1. **Batch Processing Delays**: 100ms delay between API calls to prevent throttling
2. **CSV Parsing**: Client-side parsing to minimize server load
3. **Lazy Loading**: Components loaded on-demand via tab selection
4. **Memory Management**: Blob URL cleanup after download generation

### Scalability
- Tested with files up to 10MB
- Recommended maximum: 1,000 rows per CSV
- Progress tracking prevents UI freezing
- Error isolation prevents cascade failures

## Browser Compatibility

Following Ex Libris Cloud Apps standards:
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

## Accessibility Features

- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Focus indicators
- Semantic HTML structure

## Security Considerations

### Input Validation
- File type whitelist (.csv only)
- File size limits (10MB)
- CSV injection prevention (proper parsing)
- URL validation for remote files

### Data Handling
- No server-side storage of CSV content
- Client-side processing only
- Blob URLs with proper cleanup
- API authentication via CloudApp framework

## Testing Recommendations

### Unit Tests
- CSV parser edge cases
- Column mapping algorithm
- Validation logic
- Error handling

### Integration Tests
- API communication
- File upload flow
- Results display
- Translation loading

### E2E Tests
- Complete CSV workflow
- Manual entry workflow
- Tab switching
- Error scenarios

## Deployment

### Build Process
```bash
npm install
npm run start  # Development
npm run build  # Production
```

### Package Configuration
All dependencies are specified in `package.json`:
- Angular 11.2.x
- Angular Material 11.2.x
- Ex Libris Cloud App Library 1.4.x
- RxJS 6.5.x

### Manifest Configuration
Updated `manifest.json` includes:
- Main page route: `/#/main`
- Settings page route: `/#/settings`
- Entity support: `RESEARCH_ASSET`
- Full screen capability enabled

## Troubleshooting

### Common Issues

**Issue**: CSV file not uploading
- **Solution**: Check file size (<10MB) and extension (.csv)

**Issue**: Column mapping not detected
- **Solution**: Ensure CSV has header row with descriptive names

**Issue**: Asset validation failures
- **Solution**: Verify MMS IDs exist in Esploro system

**Issue**: File processing errors
- **Solution**: Check remote URLs are accessible and file types are configured

### Debug Mode
Enable browser console to view detailed logs:
- CSV parsing steps
- API request/response
- Validation errors
- Processing progress

## Future Enhancement Opportunities

### Potential Improvements
1. **Multiple file attachments per asset**: Support array of files per MMS ID
2. **Resume failed processing**: Retry only failed items
3. **Template management**: Save/load column mapping templates
4. **Preview before submit**: Show transformation results before API calls
5. **Scheduled processing**: Queue jobs for off-peak hours
6. **Advanced filtering**: Filter results by status, error type
7. **Export options**: Excel, JSON export formats
8. **Undo functionality**: Reverse processed operations

### Performance Enhancements
1. **Parallel processing**: Process multiple assets concurrently
2. **Incremental upload**: Stream large files
3. **Caching**: Cache file type lookups
4. **Virtual scrolling**: For large result sets

## Support and Documentation

### Official References
- Ex Libris Developer Network: https://developers.exlibrisgroup.com
- Cloud Apps GitHub: https://github.com/ExLibrisGroupCloudApps
- Esploro API Documentation: https://developers.exlibrisgroup.com/esploro/apis
- Angular Material: https://material.angular.io

### Code Examples
All implementations follow patterns from:
- `cloudapp-tutorials` repository
- Official Ex Libris sample apps
- Angular best practices guide

## Conclusion

This enhancement provides a production-ready, enterprise-grade solution for bulk asset file processing in Esploro. It maintains backward compatibility with existing functionality while adding powerful new capabilities for handling large-scale file attachments through an intuitive, user-friendly interface.
