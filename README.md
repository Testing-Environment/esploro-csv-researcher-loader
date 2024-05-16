# esploro-csv-researcher-loader
 This app can be used to update researchers via a CSV file. Supports flexible configuration and multiple profiles.

## Getting Started
Welcome to the Esploro CSV Researcher Loader. This application gives you the ability to update researchers in your Esploro instance using a CSV file. It's implemented as a Cloud App, which means you can install it and use it directly in your Esploro instance.

You first need to ensure that your institution allows Cloud Apps and that this app is enabled. Then you can open the Cloud Apps pane and search for CSV in the search box. Click the install button to install the app, then click the Open button.

For more information on using Cloud Apps in Esploro, see the online help.

## Notes About CSV Files
- The Cloud App will only be able to update fields that are marked as "Managed externally" in Esploro - otherwise updates for concerned fields will be ignored.
- Fields that are lists in Esploro can be added multiple times to the profile and provided in the CSV file - make sure to use different headers, e.g. "keyword1,keyword2,keyword3"
  - In case you want to provide multiple values for a list with multiple fields, make sure to repeat all of the fields you want to provide and use different headers in your CSV file, e.g. "curAffiliation_orgaCode1,curAffiliation_position1,curAffiliation_startDate1,curAffiliation_orgaCode2,curAffiliation_position2,curAffiliation_startDate2". In addition the profile must be configured in the same way and use the same headers as in your CSV file.
- Usually lists behave as swap all, i.e. any values existing in Esploro will be replaced by the values provided in the CSV file.
  - Except for affiliations, which have special logic (see Esploro documentation for more info).
- For some fields you'll need to provide codes instead of string values (e.g. for Languages, Organization Codes or Research Topics).
- For research topics different code types are supported, i.e. research topics or ANZ topics.
- Dates need to be provided in the following format: YYYY-MM-DD (e.g. 2023-12-31).
  - Except for Educations: fromyear and toyear must be given in the following format: YYYYMMDD (e.g. 20231231).

## Documentation
For more details please visit the Esploro product documentation:
https://knowledge.exlibrisgroup.com/Esploro/Product_Documentation/Esploro_Online_Help_(English)/Working_with_the_Esploro_Research_Hub/030_Working_with_Researchers
