<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Configuration and Administration - Ex Libris Developer Network

## Overview

The Configuration API allows access to configuration-related information.
Alma provides a set of Web services for handling configuration details, enabling external systems to easily receive and use configuration data.

***

## Table of Contents

- [Organization Units](#organization-units)
- [General](#general)
- [Jobs](#jobs)
- [Sets](#sets)
- [Deposit Profiles](#deposit-profiles)
- [Import Profiles](#import-profiles)
- [Integration Profiles](#integration-profiles)
- [Utilities](#utilities)
- [Reminders](#reminders)
- [Printers](#printers)
- [Letter](#letter)
- [License Terms](#license-terms)
- [Test](#test)
- [OpenAPI Specification](#openapi-specification)
- [Swagger Codegen](#swagger-codegen)
- [Swagger Editor](#swagger-editor)

***

## Organization Units

| API | Path |
| :-- | :-- |
| [Retrieve Departments](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9kZXBhcnRtZW50cw==) | `GET /almaws/v1/conf/departments` |
| [Retrieve Libraries](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9saWJyYXJpZXM=) | `GET /almaws/v1/conf/libraries` |
| [Retrieve Library](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9saWJyYXJpZXMve2xpYnJhcnlDb2RlfQ==) | `GET /almaws/v1/conf/libraries/{libraryCode}` |
| [Retrieve Circulation Desks](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9saWJyYXJpZXMve2xpYnJhcnlDb2RlfS9jaXJjLWRlc2tzLw==) | `GET /almaws/v1/conf/libraries/{libraryCode}/circ-desks/` |
| [Retrieve Circulation Desk](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9saWJyYXJpZXMve2xpYnJhcnlDb2RlfS9jaXJjLWRlc2tzL3tjaXJjRGVza0NvZGV9) | `GET /almaws/v1/conf/libraries/{libraryCode}/circ-desks/{circDeskCode}` |
| [Retrieve Locations](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9saWJyYXJpZXMve2xpYnJhcnlDb2RlfS9sb2NhdGlvbnM=) | `GET /almaws/v1/conf/libraries/{libraryCode}/locations` |
| [Create a Location](https://developers.exlibrisgroup.com/alma/apis/docs/conf/UE9TVCAvYWxtYXdzL3YxL2NvbmYvbGlicmFyaWVzL3tsaWJyYXJ5Q29kZX0vbG9jYXRpb25z) | `POST /almaws/v1/conf/libraries/{libraryCode}/locations` |
| [Delete Location](https://developers.exlibrisgroup.com/alma/apis/docs/conf/REVMRVRFIC9hbG1hd3MvdjEvY29uZi9saWJyYXJpZXMve2xpYnJhcnlDb2RlfS9sb2NhdGlvbnMve2xvY2F0aW9uQ29kZX0=) | `DELETE /almaws/v1/conf/libraries/{libraryCode}/locations/{locationCode}` |
| [Retrieve Location](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9saWJyYXJpZXMve2xpYnJhcnlDb2RlfS9sb2NhdGlvbnMve2xvY2F0aW9uQ29kZX0=) | `GET /almaws/v1/conf/libraries/{libraryCode}/locations/{locationCode}` |
| [Update a Location](https://developers.exlibrisgroup.com/alma/apis/docs/conf/UFVUIC9hbG1hd3MvdjEvY29uZi9saWJyYXJpZXMve2xpYnJhcnlDb2RlfS9sb2NhdGlvbnMve2xvY2F0aW9uQ29kZX0=) | `PUT /almaws/v1/conf/libraries/{libraryCode}/locations/{locationCode}` |


***

## General

| API | Path |
| :-- | :-- |
| [Retrieve Code Tables](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9jb2RlLXRhYmxlcw==) | `GET /almaws/v1/conf/code-tables` |
| [Retrieve Code-table](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9jb2RlLXRhYmxlcy97Y29kZVRhYmxlTmFtZX0=) | `GET /almaws/v1/conf/code-tables/{codeTableName}` |
| [Update Code-table](https://developers.exlibrisgroup.com/alma/apis/docs/conf/UFVUIC9hbG1hd3MvdjEvY29uZi9jb2RlLXRhYmxlcy97Y29kZVRhYmxlTmFtZX0=) | `PUT /almaws/v1/conf/code-tables/{codeTableName}` |
| [Retrieve General Configuration](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9nZW5lcmFs) | `GET /almaws/v1/conf/general` |
| [Retrieve Library Open Hours](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9saWJyYXJpZXMve2xpYnJhcnlDb2RlfS9vcGVuLWhvdXJz) | `GET /almaws/v1/conf/libraries/{libraryCode}/open-hours` |
| [Retrieve Mapping Tables](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9tYXBwaW5nLXRhYmxlcw==) | `GET /almaws/v1/conf/mapping-tables` |
| [Retrieve Mapping-table](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9tYXBwaW5nLXRhYmxlcy97bWFwcGluZ1RhYmxlTmFtZX0=) | `GET /almaws/v1/conf/mapping-tables/{mappingTableName}` |
| [Update Mapping-table](https://developers.exlibrisgroup.com/alma/apis/docs/conf/UFVUIC9hbG1hd3MvdjEvY29uZi9tYXBwaW5nLXRhYmxlcy97bWFwcGluZ1RhYmxlTmFtZX0=) | `PUT /almaws/v1/conf/mapping-tables/{mappingTableName}` |


***

## Jobs

| API | Path |
| :-- | :-- |
| [Retrieve Jobs](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9qb2Jz) | `GET /almaws/v1/conf/jobs` |
| [Retrieve Job Details](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9qb2JzL3tqb2JfaWR9) | `GET /almaws/v1/conf/jobs/{job_id}` |
| [Submit a manual or scheduled job](https://developers.exlibrisgroup.com/alma/apis/docs/conf/UE9TVCAvYWxtYXdzL3YxL2NvbmYvam9icy97am9iX2lkfQ==) | `POST /almaws/v1/conf/jobs/{job_id}` |
| [Retrieve Job Instances](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9qb2JzL3tqb2JfaWR9L2luc3RhbmNlcw==) | `GET /almaws/v1/conf/jobs/{job_id}/instances` |
| [Retrieve Job Instance Details](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9qb2JzL3tqb2JfaWR9L2luc3RhbmNlcy97aW5zdGFuY2VfaWR9) | `GET /almaws/v1/conf/jobs/{job_id}/instances/{instance_id}` |
| [Download MD import input file](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9qb2JzL3tqb2JfaWR9L2luc3RhbmNlcy97aW5zdGFuY2VfaWR9L2Rvd25sb2Fk) | `GET /almaws/v1/conf/jobs/{job_id}/instances/{instance_id}/download` |


***

## Sets

| API | Path |
| :-- | :-- |
| [Retrieve a list of Sets](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9zZXRz) | `GET /almaws/v1/conf/sets` |
| [Create a Set](https://developers.exlibrisgroup.com/alma/apis/docs/conf/UE9TVCAvYWxtYXdzL3YxL2NvbmYvc2V0cw==) | `POST /almaws/v1/conf/sets` |
| [Delete a Set](https://developers.exlibrisgroup.com/alma/apis/docs/conf/REVMRVRFIC9hbG1hd3MvdjEvY29uZi9zZXRzL3tzZXRfaWR9) | `DELETE /almaws/v1/conf/sets/{set_id}` |
| [Retrieve a Set](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9zZXRzL3tzZXRfaWR9) | `GET /almaws/v1/conf/sets/{set_id}` |
| [Manage Members](https://developers.exlibrisgroup.com/alma/apis/docs/conf/UE9TVCAvYWxtYXdzL3YxL2NvbmYvc2V0cy97c2V0X2lkfQ==) | `POST /almaws/v1/conf/sets/{set_id}` |
| [Update a Set](https://developers.exlibrisgroup.com/alma/apis/docs/conf/UFVUIC9hbG1hd3MvdjEvY29uZi9zZXRzL3tzZXRfaWR9) | `PUT /almaws/v1/conf/sets/{set_id}` |
| [Retrieve Set Members](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9zZXRzL3tzZXRfaWR9L21lbWJlcnM=) | `GET /almaws/v1/conf/sets/{set_id}/members` |


***

## Deposit Profiles

| API | Path |
| :-- | :-- |
| [Retrieve Deposit Profiles](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9kZXBvc2l0LXByb2ZpbGVz) | `GET /almaws/v1/conf/deposit-profiles` |
| [Retrieve Deposit Profile](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9kZXBvc2l0LXByb2ZpbGVzL3tkZXBvc2l0X3Byb2ZpbGVfaWR9) | `GET /almaws/v1/conf/deposit-profiles/{deposit_profile_id}` |


***

## Import Profiles

| API | Path |
| :-- | :-- |
| [Retrieve Import Profiles](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9tZC1pbXBvcnQtcHJvZmlsZXM=) | `GET /almaws/v1/conf/md-import-profiles` |
| [Retrieve Import Profile](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9tZC1pbXBvcnQtcHJvZmlsZXMve3Byb2ZpbGVfaWR9) | `GET /almaws/v1/conf/md-import-profiles/{profile_id}` |
| [MD Import op - Deprecated](https://developers.exlibrisgroup.com/alma/apis/docs/conf/UE9TVCAvYWxtYXdzL3YxL2NvbmYvbWQtaW1wb3J0LXByb2ZpbGVzL3twcm9maWxlX2lkfQ==) | `POST /almaws/v1/conf/md-import-profiles/{profile_id}` |


***

## Integration Profiles

| API | Path |
| :-- | :-- |
| [Retrieve a list of Integration Profiles](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9pbnRlZ3JhdGlvbi1wcm9maWxlcw==) | `GET /almaws/v1/conf/integration-profiles` |
| [Retrieve an Integration Profile](https://developers.exlibrisgroup.com/alma/apis/docs/conf/UE9TVCAvYWxtYXdzL3YxL2NvbmYvaW50ZWdyYXRpb24tcHJvZmlsZXM=) | `POST /almaws/v1/conf/integration-profiles` |
| [Retrieve an Integration Profile](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9pbnRlZ3JhdGlvbi1wcm9maWxlcy97aWR9) | `GET /almaws/v1/conf/integration-profiles/{id}` |
| [Update an Integration Profile](https://developers.exlibrisgroup.com/alma/apis/docs/conf/UFVUIC9hbG1hd3MvdjEvY29uZi9pbnRlZ3JhdGlvbi1wcm9maWxlcy97aWR9) | `PUT /almaws/v1/conf/integration-profiles/{id}` |


***

## Utilities

| API | Path |
| :-- | :-- |
| [Retrieve Fine Fee Report](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi91dGlsaXRpZXMvZmVlLXRyYW5zYWN0aW9ucw==) | `GET /almaws/v1/conf/utilities/fee-transactions` |


***

## Reminders

| API | Path |
| :-- | :-- |
| [Retrieve a list of Reminders](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9yZW1pbmRlcnM=) | `GET /almaws/v1/conf/reminders` |
| [Create a Reminder](https://developers.exlibrisgroup.com/alma/apis/docs/conf/UE9TVCAvYWxtYXdzL3YxL2NvbmYvcmVtaW5kZXJz) | `POST /almaws/v1/conf/reminders` |
| [Delete a Reminder](https://developers.exlibrisgroup.com/alma/apis/docs/conf/REVMRVRFIC9hbG1hd3MvdjEvY29uZi9yZW1pbmRlcnMve3JlbWluZGVyX2lkfQ==) | `DELETE /almaws/v1/conf/reminders/{reminder_id}` |
| [Retrieve a Reminder](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9yZW1pbmRlcnMve3JlbWluZGVyX2lkfQ==) | `GET /almaws/v1/conf/reminders/{reminder_id}` |
| [Update a Reminder](https://developers.exlibrisgroup.com/alma/apis/docs/conf/UFVUIC9hbG1hd3MvdjEvY29uZi9yZW1pbmRlcnMve3JlbWluZGVyX2lkfQ==) | `PUT /almaws/v1/conf/reminders/{reminder_id}` |


***

## Printers

| API | Path |
| :-- | :-- |
| [Retrieve Printers](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9wcmludGVycw==) | `GET /almaws/v1/conf/printers` |
| [Retrieve a Printer](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9wcmludGVycy97cHJpbnRlcl9pZH0=) | `GET /almaws/v1/conf/printers/{printer_id}` |


***

## Letter

| API | Path |
| :-- | :-- |
| [Retrieve Letters](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9sZXR0ZXJz) | `GET /almaws/v1/conf/letters` |
| [Retrieve Letter](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9sZXR0ZXJzL3tsZXR0ZXJDb2RlfQ==) | `GET /almaws/v1/conf/letters/{letterCode}` |
| [Update Letter](https://developers.exlibrisgroup.com/alma/apis/docs/conf/UFVUIC9hbG1hd3MvdjEvY29uZi9sZXR0ZXJzL3tsZXR0ZXJDb2RlfQ==) | `PUT /almaws/v1/conf/letters/{letterCode}` |


***

## License Terms

| API | Path |
| :-- | :-- |
| [Create License Term](https://developers.exlibrisgroup.com/alma/apis/docs/conf/UE9TVCAvYWxtYXdzL3YxL2NvbmYvbGljZW5zZS10ZXJtcw==) | `POST /almaws/v1/conf/license-terms` |
| [Delete License Term](https://developers.exlibrisgroup.com/alma/apis/docs/conf/REVMRVRFIC9hbG1hd3MvdjEvY29uZi9saWNlbnNlLXRlcm1zL3tsaWNlbnNlX3Rlcm1fY29kZX0=) | `DELETE /almaws/v1/conf/license-terms/{license_term_code}` |
| [Retrieve License Term:](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi9saWNlbnNlLXRlcm1zL3tsaWNlbnNlX3Rlcm1fY29kZX0=) | `GET /almaws/v1/conf/license-terms/{license_term_code}` |
| [Update License Term](https://developers.exlibrisgroup.com/alma/apis/docs/conf/UFVUIC9hbG1hd3MvdjEvY29uZi9saWNlbnNlLXRlcm1zL3tsaWNlbnNlX3Rlcm1fY29kZX0=) | `PUT /almaws/v1/conf/license-terms/{license_term_code}` |


***

## Test

| API | Path |
| :-- | :-- |
| [GET Conf Test API](https://developers.exlibrisgroup.com/alma/apis/docs/conf/R0VUIC9hbG1hd3MvdjEvY29uZi90ZXN0) | `GET /almaws/v1/conf/test` |
| [POST Conf Test API](https://developers.exlibrisgroup.com/alma/apis/docs/conf/UE9TVCAvYWxtYXdzL3YxL2NvbmYvdGVzdA==) | `POST /almaws/v1/conf/test` |


***

## OpenAPI Specification

For information about the OpenAPI standard, see the [OpenAPI Initiative](https://www.openapis.org/) and [OpenAPI support in Ex Libris APIs](https://developers.exlibrisgroup.com/alma/apis/openapi/).

Download the OpenAPI specification for these APIs:

- [YAML](https://developers.exlibrisgroup.com/wp-content/uploads/alma/openapi/conf.yaml)
- [JSON](https://developers.exlibrisgroup.com/wp-content/uploads/alma/openapi/conf.json)

***

## Swagger Codegen

Download an SDK powered by the [Swagger Code Generator](https://swagger.io/tools/swagger-codegen/):

*Select client language*:

- csharp
- csharp-dotnet2
- java
- javascript
- jaxrs-cxf-client
- kotlin-client
- php
- python
- scala
- swift3
- swift4
- swift5
- typescript-angular

***

## Swagger Editor

The Swagger Editor offers a side-by-side view of the specification and the Swagger UI console. It's an easy way to explore and learn the standard.

- [View this API specification in the Swagger Editor](https://editor.swagger.io/?url=https://developers.exlibrisgroup.com/wp-content/uploads/alma/openapi/conf.yaml)

***

© Copyright Ex Libris Ltd. 2025
All Rights Reserved
Follow Us: [Twitter](https://twitter.com/ExLibrisGroup) [Facebook](https://www.facebook.com/exlibrisgroup) [LinkedIn](https://www.linkedin.com/company/7746) [YouTube](https://www.youtube.com/user/ExLibrisLtd)
<span style="display:none">[^1]</span>

<div align="center">⁂</div>

[^1]: https://developers.exlibrisgroup.com/alma/apis/conf/

