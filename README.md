# esploro-csv-asset-loader
 This app can be used to create and update research assets via a CSV file. Supports flexible configuration and multiple profiles.

## Getting Started
Welcome to the Esploro CSV Asset Loader. This application gives you the ability to create and update research assets in your Esploro instance using a CSV file. It's implemented as a Cloud App, which means you can install it and use it directly in your Esploro instance.

You first need to ensure that your institution allows Cloud Apps and that this app is enabled. Then you can open the Cloud Apps pane and search for CSV in the search box. Click the install button to install the app, then click the Open button.

For more information on using Cloud Apps in Esploro, see the online help.

## Important Info
- The Cloud App requires Esploro version >= July 2024.
- The Cloud App will only work for Esploro users that have the appropriate role privileges to manage research assets.
- For ADD operations: Users need permissions to create new research assets in Esploro.
- For UPDATE operations: Users need permissions to modify existing research assets.
- The Cloud App will only be able to update fields that are marked as "Managed externally" in Esploro - otherwise updates for concerned fields will be ignored.
- Asset ID is required for UPDATE operations, while Title, Asset Type, and Organization are required for ADD operations.

## Some Notes About CSV Files
- Fields that are lists in Esploro can be added multiple times to the profile and provided in the CSV file - make sure to use different headers, e.g. "keyword1,keyword2,keyword3"
  - For authors: "author_firstName1,author_lastName1,author_order1,author_firstName2,author_lastName2,author_order2"
  - For identifiers: "identifier_type1,identifier_value1,identifier_type2,identifier_value2" (e.g. "DOI,10.1000/123,ISBN,978-3-16-148410-0")
  - For URLs: "url_link1,url_type1,url_description1,url_link2,url_type2,url_description2"
- Usually lists behave as swap all, i.e. any values existing in Esploro will be replaced by the values provided in the CSV file.
- For some fields you'll need to provide codes instead of string values (e.g. for Asset Types, Organization Codes, Languages).
- Common Asset Types include: ARTICLE, BOOK, CHAPTER, CONFERENCE_PAPER, DATASET, PATENT, THESIS, etc.
- Dates need to be provided in the following format: YYYY-MM-DD (e.g. 2023-12-31) or YYYY-MM or YYYY for publication dates.
- Boolean fields (peer_reviewed, open_access) should use "true" or "false" values.

## Sample CSV Headers
For ADD operations (creating new assets):
```
title,asset_type,organization,publication_date,author_firstName1,author_lastName1,keyword1,keyword2
```

For UPDATE operations (updating existing assets):
```
id,title,publication_date,keyword1,keyword2,abstract_text
```

## Documentation
For more details please visit the Esploro product documentation:
https://knowledge.exlibrisgroup.com/Esploro/Product_Documentation/Esploro_Online_Help_(English)/Working_with_the_Esploro_Research_Hub/040_Working_with_Assets

## API Reference
This application uses the Esploro Assets REST API. For technical details, see:
- POST /esploro/v1/assets (for creating new assets)
- PUT /esploro/v1/assets/{assetId} (for updating existing assets)
- GET /esploro/v1/assets/{assetId} (for retrieving asset data)
