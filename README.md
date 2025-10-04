# Esploro Asset File Loader

This Cloud App streamlines the process of attaching external files to existing Esploro research assets. Provide an asset ID, describe each file, and the app will call the Esploro API to queue the files for ingestion via the "Load files" job.

## Features

- Guided form for adding one or many files to a single asset
- File metadata captured in line with the Esploro API requirements (`link.title`, `link.url`, `link.description`, `link.type`, `link.supplemental`)
- File type selector sourced from the Esploro code tables, with a built-in fallback list
- Inline validation and success/error feedback through the Cloud App alert system

## Prerequisites

- Esploro July 2024 release (or later)
- Cloud Apps framework enabled for your institution
- User roles that permit viewing the target asset and running the "Load files" job

## Using the App

1. Open the Cloud Apps panel in Esploro and launch **Esploro Asset File Loader**.
2. Enter the **Asset ID** of the record you want to enrich.
3. For each file you want to add, supply:
   - File name (display title)
   - Download URL (HTTP(S) accessible file location)
   - Optional description
   - File type (choose from the configured code table values)
   - Whether the file is supplemental
4. Click **Add another file** to queue additional files for the same asset.
5. Submit the form. The app issues `POST /esploro/v1/assets/{assetId}?op=patch&action=add` with the `temporary.linksToExtract` payload required by the Esploro Asset API.
6. Create an itemized asset with the records just updated.
7. Run the "Load files" job in Esploro for the created set to complete the ingestion of the queued files.

## API Reference

- **POST** `/esploro/v1/assets/{assetId}?op=patch&action=add`
  - Body schema documented in *API to Add new file to Asset*
  - Only JSON payloads are supported for this workflow

## Troubleshooting

- If the list of file types fails to load, the app falls back to a default set (`accepted`, `submitted`, `supplementary`, `administrative`). Confirm the code table name configured in `AssetService.FILE_TYPE_CODE_TABLE` if you maintain a custom list.
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

