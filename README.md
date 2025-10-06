# Esploro Asset File Loader

This Cloud App streamlines the process of attaching external files to existing Esploro research assets. Provide an asset ID, describe each file, and the app will call the Esploro API to queue the files for ingestion via the "Load files" job.

## Features

- Guided, two-stage form that validates asset IDs and lets you optionally choose file types before submission
- File metadata captured in line with the Esploro API requirements (`link.title`, `link.url`, `link.description`, `link.type`, `link.supplemental`)
- Default file types applied when Stage 2 is skipped, with selections sourced from the AssetFileAndLinkTypes mapping table
- Inline validation and success/error feedback through the Cloud App alert system

## Prerequisites
- Esploro July 2024 release (or later)
- Cloud Apps framework enabled for your institution
- User roles that permit viewing the target asset and running the "Load files" job

## Using the App

1. Open the Cloud Apps panel in Esploro and launch **Esploro Asset File Loader**.
2. **Stage 1 – Provide asset and file details:**
   - **Asset ID** (required)
   - **File URL** (required)
   - Optional file name, description, and supplemental toggle
   - Use **Add another file** to queue additional files. Each row can target a different asset ID.
3. **Choose how to continue:**
   - **Specify Types of Each File** – validates the asset IDs, surfaces any invalid IDs, and advances to Stage 2 so you can pick explicit file types.
   - **Proceed Without Selecting File Types** – validates asset IDs, applies the default file type for each row, and skips Stage 2 entirely.
4. **Stage 2 (when selected)** – review the validated rows, pick a file type for each entry, and submit.
5. Submitting queues the grouped payloads via `POST /esploro/v1/assets/{assetId}?op=patch&action=add` using the required `temporary.linksToExtract` structure.
6. Create an itemized asset set with the records just updated.
7. Run the "Load files" job in Esploro for the created set to complete the ingestion of the queued files.

## CSV Upload Workflow

The CSV tab lets you process many assets at once. The workflow enforces a minimal contract so you can keep your templates lightweight:

1. **Required columns:** every CSV must include `mmsId` (asset identifier) and `remoteUrl` (file URL). The mapper will block progression if either column is missing or mapped but empty.
2. **Optional columns:** file title, file description, and file type can be omitted entirely or mapped where available. Missing optional values default to safe fallbacks so rows without extra metadata still process.
3. **Column mapping UI:** after upload, review the suggested mappings. Only the two required fields must be assigned; all other columns can be set to *Ignore*.
4. **Required value validation:** before any API calls are made, the app scans every row to make sure MMS IDs and URLs are populated. Rows with missing data are reported (with row numbers) so you can fix the CSV quickly.
5. **File type matching:** when a file type column is present, the component first converts exact ID matches, then applies fuzzy matching on target codes. Any values that still lack an ID are listed for manual resolution before processing can continue.
6. **Asset verification:** just like the manual flow, each distinct MMS ID is validated against Esploro prior to posting files, and the before/after comparison flags assets whose file lists remain unchanged.

## API Reference

- **POST** `/esploro/v1/assets/{assetId}?op=patch&action=add`
  - Body schema documented in *API to Add new file to Asset*
  - Only JSON payloads are supported for this workflow

## Troubleshooting

- If the list of file types fails to load, confirm the AssetFileAndLinkTypes mapping table is accessible (`/conf/mapping-tables/AssetFileAndLinkTypes`) and that your API key has configuration permissions.
- You can configure the types of files and/or links that can be associated with research assets on the Asset File and Link Types List page (Configuration Menu > Repository > Asset Details > File and Link Types). For example, you can enable or disable labeling an upload or a link as a ReadMe file.
- Error responses surfaced by the Esploro API are displayed via the Cloud App alert banner. Review the message for details such as missing permissions or malformed payload fields.

For broader Esploro documentation, visit the [Esploro Online Help](https://knowledge.exlibrisgroup.com/Esploro/Product_Documentation/Esploro_Online_Help_(English)).

## Development

### Getting Started
```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app will be available at `http://localhost:4200` and can be loaded into Esploro via Cloud Apps developer mode.

### Documentation for Developers
- **[Developer Quick Reference](documentation/DEVELOPER_QUICK_REFERENCE.md)** - Setup, API reference, common tasks
- **[Visual Diagrams](documentation/VISUAL_DIAGRAMS.md)** - Architecture diagrams and data flow
- **[Job Submission Enhancement](documentation/JOB_SUBMISSION_ENHANCEMENT.md)** - Future enhancement proposals
- **[Cleanup Summary](documentation/CLEANUP_SUMMARY.md)** - History of code cleanup and legacy features

### Project Structure
```
cloudapp/src/app/
├── main/              # File upload component
├── models/            # TypeScript interfaces
├── services/          # AssetService (API integration)
└── settings/          # Settings component (currently minimal)
```

### Key Technologies
- **Angular 11** - Frontend framework
- **Angular Material** - UI components
- **RxJS** - Reactive programming
- **Ex Libris Cloud Apps SDK** - Esploro integration

## Contributing

This is a specialized tool for Esploro environments. For contributions or issues, please refer to the documentation or contact the maintainers.

## Documentation

This project includes comprehensive documentation for developers, administrators, and end users:

### For Developers
- **[Developer Quick Reference](DEVELOPER_QUICK_REFERENCE.md)** - Daily development guide, common tasks, and code patterns
- **[Architecture Diagrams](ARCHITECTURE_DIAGRAMS.md)** - Visual architecture reference with detailed diagrams
- **[Detailed Code Explanation](explaination.md)** - Deep-dive analysis of the codebase
- **[RxJS Migration Guide](documentation/RXJS_MIGRATION.md)** - Migration from toPromise() to firstValueFrom/lastValueFrom
- **[CSV Parsing Enhancement](documentation/CSV_PARSING.md)** - PapaParse integration for robust CSV handling

### For Product Owners & Project Managers
- **[Complete Summary](COMPLETE_SUMMARY.md)** - Overview of all work, documentation index, and project status
- **[Transformation Summary](TRANSFORMATION_SUMMARY.md)** - History of the transformation from researcher to asset loader
- **[Job Submission Enhancement](JOB_SUBMISSION_ENHANCEMENT.md)** - Future automation features roadmap

### For System Administrators
- **[Cleanup Summary](CLEANUP_SUMMARY.md)** - Log of recent code cleanup and improvements
- **[API Usage Report](Esploro_Asset_API_Usage_Report.md)** - Detailed API integration analysis
- **[Database Schema](documentation/Expanded_Esploro_Schema.md)** - Complete Esploro database schema reference

### Quick Links
- **[API Documentation](esploroAssets.md)** - Esploro Assets API reference
- **[File Addition API](documentation/API%20to%20Add%20new%20file%20to%20Asset.md)** - Specific endpoint documentation
- **[Cloud Apps Framework](exlCloudApps.md)** - Ex Libris Cloud Apps development guide

## License

This project is licensed under the BSD-3-Clause License - see the [LICENSE](LICENSE) file for details.

