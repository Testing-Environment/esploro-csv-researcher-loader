# Esploro Asset File Loader

This Cloud App streamlines the process of attaching external files to existing Esploro research assets. Provide an asset ID, describe each file, and the app will call the Esploro API to queue the files for ingestion via the "Load files" job.

## Features

### Manual Entry Workflow
- **Two-stage interface** for adding files to one or multiple assets
- **Multi-row entry** - add files for different assets in a single session
- **Stage 1**: Enter asset details (Asset ID, Title, URL, Description, Supplemental)
- **Stage 2**: Select file types based on validated asset types
- **Automatic validation** - assets are verified before processing
- **Dynamic file type selection** - available file types are filtered based on asset type

### CSV Upload Workflow
- **Template download** - get a pre-formatted CSV template
- **Bulk upload** - process multiple files across multiple assets
- **Automated processing** - same validation and job execution as manual entry

### Automated Job Orchestration
The app automatically handles the complete workflow:
1. **Validates assets** - fetches asset details and current file lists
2. **Creates itemized set** - automatically generates a set with the target assets
3. **Adds files via API** - queues files using the Esploro Asset API
4. **Runs import job** - automatically executes the "Import Research Assets Files" job
5. **Monitors progress** - polls job status until completion
6. **Verifies results** - compares before/after file lists to confirm success
7. **Displays report** - shows comprehensive results with per-asset verification

## Prerequisites

- Esploro July 2024 release (or later)
- Cloud Apps framework enabled for your institution
- User roles that permit:
  - Viewing and updating assets
  - Creating and managing sets
  - Running the "Import Research Assets Files" job

## Using the App

### Manual Entry Method

1. Open the Cloud Apps panel in Esploro and launch **Upload Files to Assets using URL**.
2. Navigate to the **Manual Entry** tab.
3. **Stage 1 - Enter File Details**:
   - For each file, enter:
     - **Asset ID** - the ID of the asset to add the file to //mandatory
     - **Title** - display name for the file
     - **URL** - HTTP(S) accessible file location //mandatory
     - **Description** - optional description
     - **Supplemental** - select True or False
   - Click **Add another row** to add more files
   - Click the **Delete** button on any row to remove it
   - Click **Validate & Proceed** when ready
4. The app validates all assets and fetches their types
5. **Stage 2 - Select File Types**: //if 'File Types' is selected in Stage 1
   - For each entry, select the appropriate file type
   - Available types are filtered based on the asset's type
   - Click **Back** to return to Stage 1 if needed
   - Click **Submit & Process** to start the automated workflow
6. The app automatically:
   - Queues files via `POST /esploro/v1/assets/{assetId}?op=patch&action=add`
   - Creates an itemized set with all target assets
   - Runs the "Import Research Assets Files" job for the set
   - Monitors job progress and displays real-time status
   - Verifies file additions by comparing before/after file lists
7. Review the comprehensive results showing:
   - Set ID and Job ID for reference
   - Job status and completion details
   - Per-asset verification (files added, success/failure)
   - Any errors encountered during the process

### CSV Upload Method

1. Open the Cloud Apps panel and navigate to the **CSV Upload** tab.
2. Click **Download Template CSV** to get a pre-formatted template.
3. Fill in the CSV with your data:
   - `assetId` - Asset ID //mandatory
   - `title` - File title
   - `url` - File URL //mandatory
   - `description` - Optional description
   - `supplemental` - true or false
4. Click **Load CSV File** and select your filled template.
5. The app processes the CSV using the same automated workflow as manual entry.

## API Reference

The app uses the following Esploro APIs:

### Asset Management
- **GET** `/esploro/v1/assets/{assetId}` - Fetch asset details and current files
- **POST** `/esploro/v1/assets/{assetId}?op=patch&action=add` - Queue files for ingestion

### Set Management
- **POST** `/conf/sets` - Create itemized set
- **POST** `/conf/sets/{setId}?op=add_members` - Add assets to set
- **GET** `/conf/sets/{setId}` - Verify set membership

### Job Management
- **GET** `/conf/jobs/{jobId}` - Get job details
- **GET** `/conf/jobs?offset={offset}&limit={limit}` - List all jobs (with pagination)
- **POST** `/conf/jobs/{jobId}/instances` - Run a job
- **GET** `/conf/jobs/{jobId}/instances/{instanceId}` - Monitor job status

### Configuration
- **GET** `/conf/code-tables/AssetFileType` - Get file types
- **GET** `/conf/mapping-tables/AssetFileAndLinkTypes` - Get asset type to file type mappings

## Troubleshooting

- **Asset validation fails**: Ensure the asset IDs exist and you have permission to view them
- **File types not loading**: The app falls back to default types (`accepted`, `submitted`, `supplementary`, `administrative`)
- **Job not found**: The app tries job ID `M50762` first, then searches for jobs named "Import Research Assets Files"
- **Set creation fails**: Verify you have permission to create sets
- **Job execution fails**: Check you have permission to run the import job
- **Files not added**: Review the verification results in the final report - the app compares file counts before and after

## License

This project is licensed under the BSD-3-Clause License - see the [LICENSE](LICENSE) file for details.
