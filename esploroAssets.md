Developer's Guide: Interacting with the Esploro Assets REST APIThis guide provides developers with instructions on how to use a custom Ex Libris Cloud App to interact with the Esploro Assets REST API. It covers authentication, key endpoints for managing research assets, sample code, and best practices for UI integration.1. Authentication and WorkflowIn the Ex Libris Cloud App environment, authentication is managed implicitly. When a user runs a Cloud App from within Esploro, the app inherits the user's permissions and context. API calls are proxied through the Ex Libris platform, which injects the necessary authentication headers.Typical Workflow:User Action: A curator interacts with the Cloud App's UI (e.g., clicks a button to fetch an asset or submit a new one).Cloud App Logic: The app's JavaScript code captures the user input and constructs the appropriate API request.API Call: The app uses the CloudAppRestService (provided by the Cloud App framework) to send the request to the Esploro API endpoint. The service automatically handles authentication.Response Handling: The app receives the API response, parses it, and updates the UI to display the result (e.g., shows asset details, a success message, or an error).2. Asset Record StructureBased on the rest_esploro_records.xsd, a research asset object has a complex structure. Below are some of the key fields required or commonly used when creating or updating assets.title (string): The main title of the research asset.asset_type (object): An object specifying the type of asset. Example: { "value": "ARTICLE", "desc": "Article" }.organization (object): The organization unit affiliated with the asset. Example: { "value": "YOUR_ORG_CODE" }.authors (object): A container for a list of authors.author (array): An array of author objects. Each object should contain:researcher (object): Contains researcher identifiers, like { "primary_id": "RESEARCHER_ID" }.author_order (string): The author's position in the author list (e.g., "1").first_name, last_name (string): Author's name details if not an affiliated researcher.publication_date (string): The date of publication in YYYY-MM-DD, YYYY-MM, or YYYY format.identifiers (object): A container for different types of identifiers.identifier (array): An array of identifier objects. Each object includes:identifier_type (object): The type of ID, e.g., { "value": "DOI" }.value (string): The value of the identifier.abstracts (object):abstract (array): An array of abstract objects, each with a text field.keywords (object):keyword (array): An array of keyword objects, each with a text field.For a complete and detailed structure, refer to the official Esploro Records XSD.3. Main API Endpoints & Sample CallsThe following are the primary endpoints for managing research assets. All calls should be made using the CloudAppRestService.GET /esploro/v1/assets/{assetIds}Retrieves one or more research assets by their unique IDs.Path Parameter:assetIds: A comma-separated list of asset IDs to retrieve.Query Parameters:limit: (Optional) The maximum number of records to return. Default: 10.offset: (Optional) The offset of the first record to return. Default: 0.Sample JavaScript Call (using CloudAppRestService):import { CloudAppRestService } from '@exlibris/exl-cloudapp-angular-lib';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// ... inside your component or service

constructor(private restService: CloudAppRestService) {}

fetchAssets(assetIds: string) {
  this.restService.call(`/esploro/v1/assets/${assetIds}`)
    .pipe(
      catchError(error => {
        console.error('Error fetching assets:', error);
        return of(null); // Handle error gracefully
      })
    )
    .subscribe(response => {
      if (response && response.research_asset) {
        console.log('Retrieved Assets:', response.research_asset);
        // Update your UI with the asset data
      }
    });
}

// Example usage:
// this.fetchAssets('ASSET_ID_1,ASSET_ID_2');
POST /esploro/v1/assetsCreates a new research asset. The request body must contain the asset's metadata according to the structure defined in the XSD.Sample JavaScript Call:// ...

createAsset(assetData) {
  this.restService.call({
    url: '/esploro/v1/assets',
    method: 'POST',
    requestBody: assetData
  })
  .pipe(
    catchError(error => {
      console.error('Error creating asset:', error);
      return of(null);
    })
  )
  .subscribe(response => {
    if (response) {
      console.log('Successfully created asset:', response);
      // Display success message in the UI
    }
  });
}

// Example usage:
const newAsset = {
  "title": "A Study on Quantum Entanglement",
  "asset_type": { "value": "ARTICLE" },
  "organization": { "value": "PHYSICS_DEPT" },
  "publication_date": "2023-10-26",
  "authors": {
    "author": [
      {
        "researcher": { "primary_id": "RESEARCHER_PRIMARY_ID" },
        "author_order": "1"
      }
    ]
  },
  "identifiers": {
    "identifier": [
        {
            "identifier_type": { "value": "DOI" },
            "value": "10.1000/12345"
        }
    ]
  }
};
// this.createAsset(newAsset);
PUT /esploro/v1/assets/{assetId}Updates an existing research asset. The request body must contain the full asset object with the modified fields.Path Parameter:assetId: The ID of the asset to update.Sample JavaScript Call:// ...

updateAsset(assetId, assetData) {
  this.restService.call({
    url: `/esploro/v1/assets/${assetId}`,
    method: 'PUT',
    requestBody: assetData
  })
  .pipe(
    catchError(error => {
      console.error('Error updating asset:', error);
      return of(null);
    })
  )
  .subscribe(response => {
    if (response) {
      console.log('Successfully updated asset:', response);
      // Display success message
    }
  });
}

// Example usage:
// First, fetch the full asset object using GET.
// Then, modify the necessary fields.
const updatedAssetData = { /* full asset object with changes */ };
// this.updateAsset('EXISTING_ASSET_ID', updatedAssetData);
4. Common Errors and HandlingWhen interacting with the API, be prepared to handle common errors gracefully.400 Bad Request:Invalid Date Format: Ensure dates are in YYYY-MM-DD or YYYY-MM-DDZ format.Missing Required Fields: Validate that fields like title, asset_type, and organization are present in POST/PUT bodies.Invalid ID: The provided assetId, researcherId, or organization code does not exist.401 Unauthorized / 403 Forbidden:The user running the Cloud App does not have the necessary roles or permissions to perform the action.404 Not Found:The asset with the specified assetId could not be found.Error Handling Strategy: Your Cloud App should catch errors from the API call, inspect the error response body for a detailed message, and display a user-friendly notification in the UI.// Example error handling within a call
// ...
catchError(error => {
  let errorMessage = 'An unknown error occurred.';
  if (error.error && error.error.errorList && error.error.errorList.error) {
    errorMessage = error.error.errorList.error[0].errorMessage;
  }
  // Display errorMessage in your app's UI (e.g., a toast notification)
  console.error(errorMessage);
  return of(null); // Return a safe value
})
// ...
5. Mapping API Calls to UI ActionsA well-designed Cloud App maps these API calls to intuitive UI components for curators.Fetch Asset: A search box where a curator can enter an Asset ID. A "Search" button triggers the GET call. The results are displayed in a structured form below.Create Asset: A form with input fields for Title, Asset Type (dropdown), Organization (autocomplete), and Authors. A "Submit" button triggers the POST call with the form data.Update Asset: After fetching an asset, display its data in editable fields. A "Save Changes" button triggers the PUT call with the modified asset object.By connecting these backend API calls to a clean frontend panel, a Cloud App can significantly streamline a curator's workflow for managing research assets directly within the Esploro interface.6. OpenAPI SpecificationThe following is the OpenAPI 3.0 specification for the Esploro Assets API.{
  "openapi": "3.0.1",
  "info": {
    "version": "1.0",
    "title": "Ex Libris APIs",
    "description": "For more information on how to use these APIs, including how to create an API key required for authentication, see [Alma REST APIs](https://developers.exlibrisgroup.com/alma/apis).",
    "termsOfService": "[https://developers.exlibrisgroup.com/about/terms](https://developers.exlibrisgroup.com/about/terms)"
  },
  "externalDocs": {
    "description": "Detailed documentation on these APIs at the Ex Libris Developer Network.",
    "url": "[https://developers.exlibrisgroup.com/alma/apis/](https://developers.exlibrisgroup.com/alma/apis/)"
  },
  "servers": [
    { "url": "[https://api-eu.hosted.exlibrisgroup.com](https://api-eu.hosted.exlibrisgroup.com)" },
    { "url": "[https://api-na.hosted.exlibrisgroup.com](https://api-na.hosted.exlibrisgroup.com)" },
    { "url": "[https://api-ap.hosted.exlibrisgroup.com](https://api-ap.hosted.exlibrisgroup.com)" },
    { "url": "[https://api-aps.hosted.exlibrisgroup.com](https://api-aps.hosted.exlibrisgroup.com)" },
    { "url": "[https://api-cn.hosted.exlibrisgroup.com.cn](https://api-cn.hosted.exlibrisgroup.com.cn)" },
    { "url": "[https://api-ca.hosted.exlibrisgroup.com](https://api-ca.hosted.exlibrisgroup.com)" }
  ],
  "tags": [ { "name": "Assets" } ],
  "paths": {
    "/esploro/v1/assets": {
      "get": {
        "tags": ["Assets"],
        "description": "This Web service returns Esploro Assets data for a given parameter(s)...",
        "summary": "Retrieve Asset",
        "operationId": "get/esploro/v1/assets",
        "parameters": [
            { "name": "doi", "in": "query", "required": true, "schema": { "type": "string" }, "description": "DOI(s), optionally delimited by comma" }
        ],
        "responses": { "200": { "description": "OK" } }
      },
      "post": {
        "tags": ["Assets"],
        "description": "This Web service creates a new asset.",
        "summary": "Create asset",
        "operationId": "post/esploro/v1/assets",
        "requestBody": {
          "description": "This method takes an asset object.",
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "[https://developers.exlibrisgroup.com/wp-content/uploads/esploro/openapi/schemas/rest_esploro_records-post.json#/rest_esploro_records-post](https://developers.exlibrisgroup.com/wp-content/uploads/esploro/openapi/schemas/rest_esploro_records-post.json#/rest_esploro_records-post)" } } }
        },
        "responses": { "200": { "description": "OK" } }
      }
    },
    "/esploro/v1/assets/{assetIds}": {
      "get": {
        "tags": ["Assets"],
        "description": "This web service returns Esploro Asset data for given assetId(s).",
        "summary": "Retrieve Asset by ID",
        "operationId": "get/esploro/v1/assets/{assetIds}",
        "parameters": [
            { "name": "assetIds", "in": "path", "required": true, "schema": { "type": "string" }, "description": "The Asset Identifier(s), optionally delimited by comma" }
        ],
        "responses": { "200": { "description": "OK" } }
      }
    },
     "/esploro/v1/assets/{assetId:.+}": {
        "post": {
            "tags": ["Assets"],
            "summary": "Update asset",
            "description": "This Web service updates parts of an existing asset.",
            "operationId": "post/esploro/v1/assets/{assetId:.+}",
            "parameters": [
                { "name": "assetId", "in": "path", "required": true, "schema": { "type": "string" }, "description": "MMS ID of the asset to update" }
            ],
            "requestBody": {
                "required": true,
                "content": { "application/json": { "schema": { "$ref": "[https://developers.exlibrisgroup.com/wp-content/uploads/esploro/openapi/schemas/rest_esploro_records-post.json#/rest_esploro_records-post](https://developers.exlibrisgroup.com/wp-content/uploads/esploro/openapi/schemas/rest_esploro_records-post.json#/rest_esploro_records-post)" } } }
            },
            "responses": { "200": { "description": "OK" } }
        }
     }
  },
  "security": [ { "ApiKeyAuth": [] } ],
  "components": {
    "securitySchemes": {
      "ApiKeyAuth": { "type": "apiKey", "description": "API key used to authorize requests.", "in": "query", "name": "apikey" }
    },
    "headers": {
      "remaining": { "description": "The number of remaining calls.", "schema": { "type": "integer" } }
    }
  }
}
7. Building a Cloud App for Bulk Asset Updates via CSVThis section provides a step-by-step guide for creating a Cloud App that allows curators to upload a CSV file to bulk update Esploro research assets, based on the New asset template.csv format.7.1. App Overview and WorkflowThe app will provide a simple UI for a user to upload a CSV file. The app will then:Parse the CSV file row by row.Validate each row against required formats and fields.For each valid row, it will perform a "fetch-and-update" operation using the Esploro Assets API.Provide real-time feedback on the status of the import and report any errors.7.2. Development Setup and PrerequisitesBefore you begin, ensure you have the Ex Libris Cloud App Command Line Interface (CLI) installed and are familiar with the basic development workflow.Getting Started: Follow the Getting Started with Ex Libris Cloud Apps guide to set up your environment.App Manifest: Your manifest.json will need to request the necessary API permissions for Esploro assets (/esploro/v1/assets).7.3. UI for File Upload and FeedbackThe UI should be simple: a file input, an "Upload & Process" button, and an area to display results.Example HTML Snippet:<div>
  <input type="file" id="csvFileInput" accept=".csv">
  <button (click)="processCsv()">Upload & Process</button>
</div>

<div id="resultsArea">
  <h4>Processing Log:</h4>
  <pre id="logOutput"></pre>
</div>
7.4. CSV Parsing and ValidationOnce the user selects a file, the app needs to parse and validate it. We recommend using a robust library like Papa Parse for this.Step 1: Parse the CSVimport * as Papa from 'papaparse';

// ...

processCsv() {
  const fileInput = document.getElementById('csvFileInput');
  const file = fileInput.files[0];
  
  Papa.parse(file, {
    header: true, // Treat the first row as headers
    skipEmptyLines: true,
    complete: (results) => {
      this.validateAndProcessRows(results.data);
    }
  });
}
Step 2: Validate RowsFor each row, you must validate required fields and formats as per Esploro's Bulk Update Documentation.validateAndProcessRows(rows) {
  const logOutput = document.getElementById('logOutput');
  logOutput.textContent = ''; // Clear previous logs

  rows.forEach((row, index) => {
    // 1. Validate Required Fields from your CSV template
    if (!row.GROUP_ID || !row.ASSET_TITLE) {
      this.log(`Row ${index + 2}: SKIPPED - Missing required GROUP_ID or ASSET_TITLE.`);
      return;
    }

    // 2. Validate Field Formats (example for DOI)
    if (row.ASSET_DOI && !/^10.\d{4,9}\/[-._;()\/:A-Z0-9]+$/i.test(row.ASSET_DOI)) {
      this.log(`Row ${index + 2}: SKIPPED - Invalid DOI format for asset ${row.GROUP_ID}.`);
      return;
    }
    
    // If validation passes, proceed to update
    this.updateAssetFromCsvRow(row, index + 2);
  });
}

log(message) {
  const logOutput = document.getElementById('logOutput');
  logOutput.textContent += message + '\n';
}
7.5. Mapping CSV to API and Updating AssetsThe core logic involves fetching the existing asset, merging the changes from the CSV, and sending the updated object back. This prevents accidental overwriting of fields not included in the CSV.Best Practice: Fetch, Merge, and Update// ... (requires CloudAppRestService)

async updateAssetFromCsvRow(row, rowIndex) {
  try {
    // 1. Fetch the full, existing asset record using GROUP_ID
    const existingAsset = await this.restService.call(`/esploro/v1/assets/${row.GROUP_ID}`).toPromise();

    // 2. Map CSV fields and merge into the fetched record
    // This is a simplified mapping. Refer to the Esploro XML mapping for complex fields.
    // [https://developers.exlibrisgroup.com/esploro/integrations/research-assets/import/esploro-xml/](https://developers.exlibrisgroup.com/esploro/integrations/research-assets/import/esploro-xml/)
    const updatedAsset = { ...existingAsset };
    
    if (row.ASSET_TITLE) updatedAsset.title = row.ASSET_TITLE;
    if (row.ASSET_PUBLISHDATE) updatedAsset.publication_date = row.ASSET_PUBLISHDATE;
    if (row.ASSET_RESTYPE) updatedAsset.asset_type = { value: row.ASSET_RESTYPE };

    // Example for identifier (clearing existing DOI before adding new one)
    if (row.ASSET_DOI) {
        if (!updatedAsset.identifiers) updatedAsset.identifiers = { identifier: [] };
        // Remove old DOI if it exists
        updatedAsset.identifiers.identifier = updatedAsset.identifiers.identifier.filter(id => id.identifier_type.value !== 'DOI');
        // Add new DOI
        updatedAsset.identifiers.identifier.push({
            identifier_type: { value: 'DOI' },
            value: row.ASSET_DOI
        });
    }

    // ... map other fields from your 'New asset template.csv' ...

    // 3. PUT the updated asset object back to the API
    await this.restService.call({
      url: `/esploro/v1/assets/${row.GROUP_ID}`,
      method: 'PUT',
      requestBody: updatedAsset
    }).toPromise();

    this.log(`Row ${rowIndex}: SUCCESS - Updated asset ${row.GROUP_ID}.`);

  } catch (error) {
    const errorMessage = error.message || 'Unknown API Error';
    this.log(`Row ${rowIndex}: FAILED to update asset ${row.GROUP_ID}. Reason: ${errorMessage}`);
  }
}
7.6. Key Documentation and PublishingCloud App APIs: For details on CloudAppRestService and other services, see the REST/Store APIs guide.Cloud App Events: To interact with the Alma/Esploro UI, refer to the Events service documentation.Publishing your App: Once development is complete, follow the Publishing Workflow to make your app available to users.