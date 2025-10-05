POST
/almaws/v1/conf/sets/{set_id}
Add members to an existing set.

Members are added with the following object structure:
```json
{
  "members": {
    "member": [
      {
        "id": "991274654700561"
      },
      {
        "id": "99998648800561"
      }
    ]
  }
}
```
The id is the asset ID (MMS_ID).

Example URL:
https://api-na.hosted.exlibrisgroup.com/almaws/v1/conf/sets/9563654780000561?op=add_members&fail_on_invalid_id=false&apikey={apikey}
Note: parameter "fail_on_invalid_id" if set to false, will ignore invalid ids in the members list. When set to true, the entire request will fail if one or more ids are invalid.

Example Body:
```json
{
  "id": "9563654780000561",
  "name": "CloudApp-FilesLoaderSet-YYYYMMDD-HH:MM:SS",
  "description": "List of loaded research asset via the Cloud App Files Loader",
  "type": {
    "value": "ITEMIZED",
    "desc": "Itemized"
    },
 "content": {
    "value": "IER",
    "desc": "Research assets"
  },
  "status": {
    "value": "ACTIVE",
    "desc": "Active"
  },
  "origin": {
    "value": "UI",
    "desc": "Institution only"
  },
  "private": {
    "value": "true",
    "desc": "Yes"
  },
  "status_date": "2025-10-05T09:38:16.058Z",
  "created_by": {
    "value": "exl_api",
    "desc": "Ex Libris, API"
  },
  "created_date": "2025-10-05T09:38:16.058Z",
  "number_of_members": {
    "value": 2,
    "link": "https://api-na.hosted.exlibrisgroup.com/almaws/v1/conf/sets/9563654780000561/members"
  },
  "members": {
    "member": [
      {
        "id": "991274654700561"
      },
      {
        "id": "99998648800561"
      }
    ]
  },
  "link": "https://api-na.hosted.exlibrisgroup.com/almaws/v1/conf/sets/9563654780000561"
}
```

Example Response:
```json
{
  "id": "9563654780000561",
  "name": "CloudApp-FilesLoaderSet-YYYYMMDD-HH:MM:SS",
  "description": "List of loaded research asset via the Cloud App Files Loader",
  "type": {
    "value": "ITEMIZED",
    "desc": "Itemized"
  },
  "content": {
    "value": "IER",
    "desc": "Research assets"
  },
  "status": {
    "value": "ACTIVE",
    "desc": "Active"
  },
  "origin": {
    "value": "UI",
    "desc": "Institution only"
  },
  "private": {
    "value": "true",
    "desc": "Yes"
  },
  "status_date": "2025-10-05T09:38:16.058Z",
  "created_by": {
    "value": "exl_api",
    "desc": "Ex Libris, API"
  },
  "created_date": "2025-10-05T09:38:16.058Z",
  "number_of_members": {
    "value": 2,
    "link": "https://api-na.hosted.exlibrisgroup.com/almaws/v1/conf/sets/9563654780000561/members"
  },
  "link": "https://api-na.hosted.exlibrisgroup.com/almaws/v1/conf/sets/9563654780000561"
}
```