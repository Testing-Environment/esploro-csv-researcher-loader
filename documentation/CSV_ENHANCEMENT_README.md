# CSV Asset File Processing Enhancement - Quick Start Guide

## 🎯 Overview

This enhancement transforms the Esploro CSV Asset Loader into a comprehensive asset file processing solution with dual modes:
- **Manual Entry**: Process individual asset files one at a time
- **CSV Bulk Upload**: Process hundreds of asset files with intelligent column mapping

## 🚀 Quick Start

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Start development server**:
```bash
npm start
```

3. **Build for production**:
```bash
npm run build
```

### Usage

#### Method 1: Manual Entry (Original Functionality)
1. Select "Manual Entry" tab
2. Enter Asset ID
3. Add file details (title, URL, description, type)
4. Add multiple files if needed
5. Submit

#### Method 2: CSV Bulk Upload (New Feature)
1. Select "CSV Upload" tab
2. Drag and drop your CSV file (or click to browse)
3. Review and adjust column mappings
4. Click "Process Data"
5. Download MMS ID file for import job
6. Follow step-by-step workflow instructions

## 📋 CSV File Format

### Required Columns
- **MMS ID**: Esploro asset identifier
- **Remote URL**: Direct link to file content

### Optional Columns
- **File Title**: Display name for the file
- **File Description**: Detailed description
- **File Type**: AssetFileAndLinkTypes ID or label (when present, the app attempts to match it for you)

### Example CSV

```csv
MMS ID,Remote URL,File Title,File Description,File Type
12345678900001234,https://example.com/file1.pdf,Research Paper,Main publication,PDF
98765432100009876,https://example.com/file2.docx,Supplementary Data,Additional results,DOCX
```

### Best Practices
- ✅ Use UTF-8 encoding
- ✅ Include descriptive header row
- ✅ Use comma separation
- ✅ Quote values containing commas
- ✅ Keep file size under 10MB
- ❌ Avoid special characters in headers
- ❌ Don't use Excel formulas

## 🔧 Configuration

### File Types
File types are loaded from Esploro configuration tables. Fallback types include:
- PDF, DOC, DOCX
- XLS, XLSX
- PPT, PPTX
- TXT, RTF, HTML, XML

### Manifest Settings
Located in `manifest.json`:
```json
{
  "id": "esploro-csv-asset-loader",
  "title": "Enhanced Asset File Processor",
  "entities": ["RESEARCH_ASSET"]
}
```

## 📊 Features

### Intelligent Column Mapping
The system automatically suggests field mappings based on:
- Column header names (e.g., "ID" → "MMS ID")
- Sample data patterns (e.g., URLs detected)
- Confidence scoring (shown with ✓ icon)

### Validation
Real-time validation ensures:
- Required MMS ID and Remote URL mapping
- Every row includes values for both required fields
- No duplicate field mappings
- Valid CSV structure
- Proper file format
- Unmatched file type values are collected for manual resolution before processing resumes

### Progress Tracking
Visual indicators show:
- Overall progress percentage
- Current asset being processed
- Success/failure counts
- Detailed error messages

### Results Export
After processing:
- Download CSV of successful MMS IDs
- View detailed results table
- Access direct links to asset viewer
- Follow workflow instructions

## 🔄 Complete Workflow

### 1. Upload and Map CSV
```
Upload CSV → Auto-detect columns → Review mappings → Process
```

### 2. Download Results
```
Process complete → Download MMS ID CSV → Save file
```

### 3. Create Asset Set in Esploro
```
Advanced Search → Upload identifiers → Select MMS ID type → Create set
```

### 4. Run Import Job
```
Monitor Jobs → Import Research Assets Files → Select set → Run job
```

### 5. Verify Results
```
Job complete → View files → Access via generated URLs
```

## 🎨 User Interface

### Tab Navigation
- **Manual Entry**: Traditional single-asset workflow
- **CSV Upload**: New bulk processing workflow

### Upload Interface
- Drag-and-drop zone
- File validation messages
- Requirements checklist
- Browse button alternative

### Mapping Interface
- Three-column table:
  - CSV Header (your column name)
  - Sample Value (first row data)
  - Map to Field (dropdown selection)
- Confidence indicators
- Validation warnings

### Results Interface
- Summary statistics (success/error counts)
- Detailed results table
- Step-by-step workflow instructions
- Direct action buttons

## 🐛 Troubleshooting

### CSV Not Uploading
**Problem**: File rejected at upload
**Solution**: 
- Check file extension is `.csv`
- Verify file size is under 10MB
- Ensure file is not corrupted

### Invalid Column Mapping
**Problem**: "MMS ID Required" or "Remote URL Required" error
**Solution**:
- Map at least one column to both "MMS ID" and "Remote URL"
- Check CSV header row exists
- Verify required columns contain data for every row

### Asset Not Found
**Problem**: "Asset {ID} not found" errors
**Solution**:
- Verify MMS IDs exist in Esploro
- Check for typos in MMS IDs
- Ensure correct institution context

### File Processing Failed
**Problem**: Individual files failing
**Solution**:
- Verify remote URLs are accessible
- Check file type is configured in system
- Review detailed error messages

## 📁 File Structure Reference

```
cloudapp/
└── src/
    ├── app/
    │   ├── components/
    │   │   ├── csv-processor/         # CSV upload & mapping
    │   │   └── processing-results/    # Results display & workflow
    │   ├── models/
    │   │   ├── asset.ts              # Original asset types
    │   │   └── types.ts              # New type definitions
    │   ├── services/
    │   │   └── asset.service.ts      # API integration
    │   ├── main/
    │   │   ├── main.component.ts     # Enhanced main component
    │   │   ├── main.component.html
    │   │   └── main.component.scss
    │   └── app.module.ts             # Updated module config
    └── i18n/
        └── en.json                   # English translations
```

## 🌐 API Integration

### Endpoints Used

#### Get File Types
```http
GET /almaws/v1/conf/mapping-tables/FileTypes
```

#### Validate Asset
```http
GET /esploro/v1/assets/{mmsId}
```

#### Add File to Asset
```http
POST /esploro/v1/assets/{mmsId}/files
Content-Type: application/json

{
  "url": "https://example.com/file.pdf",
  "title": "Document Title",
  "description": "Optional",
  "type": "PDF"
}
```

## 🔒 Security

### Client-Side Security
- File type validation
- File size limits
- CSV injection prevention
- URL validation

### Server-Side Security
- API authentication via Cloud App framework
- CORS handling
- Rate limiting (100ms delay between calls)

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

## ♿ Accessibility

- Keyboard navigation supported
- Screen reader compatible
- ARIA labels on all interactive elements
- High contrast mode support

## 📈 Performance

### Optimizations
- Client-side CSV parsing
- Throttled API calls (100ms delay)
- Progress feedback
- Error isolation

### Limits
- Max file size: 10MB
- Recommended: <1,000 rows per CSV
- Sequential processing (prevents overwhelming API)

## 🎓 Training Resources

### Video Tutorials (Recommended)
1. "CSV Upload Overview" (5 min)
2. "Column Mapping Deep Dive" (10 min)
3. "Complete Workflow Walkthrough" (15 min)

### Documentation
- [Complete Implementation Guide](./CSV_ENHANCEMENT_IMPLEMENTATION.md)
- [Ex Libris Developer Network](https://developers.exlibrisgroup.com)
- [Cloud Apps GitHub](https://github.com/ExLibrisGroupCloudApps)

## 💡 Tips & Best Practices

### CSV Preparation
1. **Consistent naming**: Use descriptive column headers
2. **Clean data**: Remove empty rows and columns
3. **Validate URLs**: Test links before upload
4. **Backup data**: Keep original CSV file

### Processing Strategy
1. **Test first**: Start with small sample (10-20 rows)
2. **Review mappings**: Always verify auto-detected mappings
3. **Monitor progress**: Watch for errors during processing
4. **Save results**: Download MMS ID file immediately

### Error Recovery
1. **Export errors**: Save detailed results table
2. **Filter failed**: Process only failed items separately
3. **Check logs**: Review browser console for details
4. **Contact support**: Provide MMS IDs and error messages

## 🤝 Contributing

### Reporting Issues
Include:
- Browser and version
- Steps to reproduce
- Sample CSV (sanitized)
- Screenshots
- Console logs

### Feature Requests
Describe:
- Use case scenario
- Expected behavior
- Current workaround
- Priority/impact

## 📞 Support

### Internal Support
- Library IT Help Desk
- Esploro Administrator
- Repository Manager

### External Support
- Ex Libris Support Portal
- Developer Network Forums
- GitHub Issues

## 📄 License

This enhancement maintains the original license of the base cloud app.

## 🙏 Acknowledgments

- Ex Libris Developer Network for Cloud Apps framework
- Community contributors and testers
- Angular Material design team

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Compatibility**: Ex Libris Cloud Apps Angular Library 1.4.x
