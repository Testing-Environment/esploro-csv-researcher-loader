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


