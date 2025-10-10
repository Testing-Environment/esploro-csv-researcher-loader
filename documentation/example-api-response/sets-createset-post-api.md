POST
/almaws/v1/conf/sets
Create an empty set to contain the list of assets to be processed by a job.

Example URL:
https://api-na.hosted.exlibrisgroup.com/almaws/v1/conf/sets?combine=None&set1=None&set2=None&apikey={apikey}

Example Body:
```json
{
  "link": "",
  "name": "CloudApp-FilesLoaderSet-YYYYMMDD-HH:MM:SS",
  "description": "List of loaded research asset via the Cloud App Files Loader",
  "type": {
    "value": "ITEMIZED
  },
  "content": {
    "value": "IER"
  },
  "private": {
    "value": "true"
  },
  "status": {
    "value": "ACTIVE"
  },
  "note": "",
  "query": {
    "value": ""
  },
  "members": {
    "total_record_count": "",
    "member": [
      {
        "link": "",
        "id": ""
      }
    ]
  },
  "origin": {
    "value": "UI"
  }
}
```


Response:
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
    "value": 0,
    "link": "https://api-na.hosted.exlibrisgroup.com/almaws/v1/conf/sets/9563654780000561/members"
  },
  "link": "https://api-na.hosted.exlibrisgroup.com/almaws/v1/conf/sets/9563654780000561"
}
```

