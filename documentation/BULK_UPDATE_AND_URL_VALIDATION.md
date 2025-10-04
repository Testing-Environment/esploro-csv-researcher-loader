# Bulk Update and URL Validation Features

This document describes the new bulk update and URL validation features added to the Esploro Asset File Loader Cloud App.

## Overview

Two new features have been added to enhance the functionality of the app:

1. **Bulk URL Update**: Update multiple assets at once with a single file URL
2. **URL Validation**: Validate that remote file URLs are accessible before adding them to assets

## Feature Details

### Bulk URL Update

The bulk update feature allows curators to add the same file URL to multiple assets simultaneously, reducing repetitive work when the same supplementary file needs to be attached to many research assets.

#### Use Cases
- Adding the same dataset file to multiple related research outputs
- Attaching a common supplementary document to a collection of assets
- Batch updating assets with a new version of a shared resource

#### How It Works

1. Navigate to the **Bulk Update** tab
2. Enter a list of asset IDs (one per line) in the textarea
3. Provide the file details that will be added to all assets:
   - File name (title)
   - File URL (must be HTTP/HTTPS)
   - Optional description
   - File type (from code table)
   - Supplemental flag (checkbox)
4. Click **Bulk Update Assets**
5. The app processes each asset using the `bulkUpdateAssets` method in `AssetService`
6. Results are displayed showing:
   - ✓ Success for each asset that was updated successfully
   - ✗ Error for assets that failed, with error message
7. Create an itemized set with successfully updated assets
8. Run the "Load files" job in Esploro to complete the ingestion

#### API Calls

The bulk update feature uses:
- `POST /esploro/v1/assets/{assetId}?op=patch&action=add` for each asset in the list
- Parallel processing using RxJS `forkJoin` to update multiple assets concurrently
- Individual error handling per asset to report partial success

#### Error Handling

The bulk update provides detailed feedback:
- Each asset is processed independently
- Failures in one asset don't prevent others from being updated
- Error messages indicate the specific reason for failure (e.g., asset not found, permission denied)
- Success/failure counts are displayed in alert messages

### URL Validation

The URL validation feature allows curators to check if remote file URLs are accessible before attempting to add them to assets, preventing failed file loads.

#### Use Cases
- Verifying URLs before bulk updates
- Checking that external file repositories are accessible
- Ensuring URLs haven't been moved or deleted
- Testing network connectivity to file sources

#### How It Works

1. Navigate to the **URL Validation** tab
2. Enter one or more URLs (one per line) to validate
3. Click **Validate URLs**
4. The app sends HEAD requests to each URL using the `validateUrls` method
5. Results are displayed showing:
   - ✓ Accessible URLs with HTTP status code (typically 200)
   - ✗ Inaccessible URLs with error message and status code (e.g., 404)

#### API Calls

The URL validation feature uses:
- `HEAD` requests to each URL to check accessibility
- Parallel processing using RxJS `forkJoin` to validate multiple URLs concurrently
- HTTP status codes to determine accessibility

#### Technical Details

The validation uses HEAD requests instead of GET requests to:
- Minimize network traffic (no body content downloaded)
- Reduce load on file servers
- Provide faster validation results

**Note**: Some web servers may not support HEAD requests. In such cases, the URL may appear as inaccessible even though it would work with a GET request. The Esploro "Load files" job uses GET requests, so validation results should be considered advisory.

#### Limitations

- URLs must be accessible from the Esploro server (not just from the user's browser)
- URLs requiring authentication will typically fail validation
- Some servers block HEAD requests
- CORS restrictions don't apply to server-side validation

## Technical Implementation

### Service Layer (AssetService)

Three new methods were added to `AssetService`:

#### validateUrl(url: string): Observable<UrlValidationResult>

Validates a single URL by sending a HEAD request.

**Returns**: Observable with result containing:
- `url`: The URL that was validated
- `accessible`: Boolean indicating if URL is accessible
- `status`: HTTP status code (if available)
- `error`: Error message (if inaccessible)

#### validateUrls(urls: string[]): Observable<UrlValidationResult[]>

Validates multiple URLs concurrently using `forkJoin`.

**Parameters**:
- `urls`: Array of URL strings to validate

**Returns**: Observable with array of validation results

#### bulkUpdateAssets(assetIds: string[], file: AssetFileLink): Observable<BulkUpdateResult[]>

Updates multiple assets with the same file URL.

**Parameters**:
- `assetIds`: Array of asset IDs to update
- `file`: File information (title, URL, description, type, supplemental)

**Returns**: Observable with array of update results containing:
- `assetId`: The asset ID that was processed
- `success`: Boolean indicating if update succeeded
- `error`: Error message (if update failed)

### Component Layer (MainComponent)

The component was enhanced with:

1. **Forms**:
   - `bulkForm`: FormGroup for bulk update inputs
   - `urlValidationForm`: FormGroup for URL validation inputs

2. **State Management**:
   - `bulkUpdateResult`: Array of bulk update results
   - `urlValidationResults`: Array of URL validation results
   - `bulkSubmitting`: Loading state for bulk operations
   - `validatingUrls`: Loading state for URL validation

3. **Methods**:
   - `submitBulkUpdate()`: Handles bulk update form submission
   - `validateUrls()`: Handles URL validation form submission
   - `resetBulkForm()`: Resets bulk update form
   - `resetUrlValidation()`: Resets URL validation form

### UI Layer

The UI was restructured using Angular Material Tabs (`mat-tab-group`):

1. **Single Asset Tab**: Original functionality
2. **Bulk Update Tab**: New bulk update interface
3. **URL Validation Tab**: New URL validation interface

Each tab provides a focused interface for its specific task, improving usability and reducing visual clutter.

## References

This implementation follows Ex Libris Cloud Apps best practices:

- [Ex Libris Developer Network](https://developers.exlibrisgroup.com/)
- [Esploro Assets API Documentation](https://developers.exlibrisgroup.com/esploro/apis/)
- [Cloud Apps Framework Documentation](https://developers.exlibrisgroup.com/cloudapps/)
- [Cloud Apps REST Service](https://developers.exlibrisgroup.com/cloudapps/docs/api/rest/)
- [RxJS forkJoin Documentation](https://rxjs.dev/api/index/function/forkJoin)

## Code References

### Service Files
- `cloudapp/src/app/services/asset.service.ts` - Service layer with new API methods

### Component Files
- `cloudapp/src/app/main/main.component.ts` - Component logic
- `cloudapp/src/app/main/main.component.html` - UI template with tabs
- `cloudapp/src/app/main/main.component.scss` - Styles for new features

### Model Files
- `cloudapp/src/app/constants/file-types.ts` - File type constants

## Future Enhancements

Potential improvements for these features:

1. **Bulk Update**:
   - Support for different file URLs per asset (CSV import)
   - Batch processing with progress indicators
   - Ability to retry failed updates
   - Export results to CSV

2. **URL Validation**:
   - Retry failed validations
   - Support for URLs requiring authentication
   - Bulk validation from file import
   - Detailed diagnostics (response headers, redirect chains)

3. **Integration**:
   - Combine validation with bulk update (validate before updating)
   - Automatic set creation and job submission
   - Scheduled validation of existing asset URLs
