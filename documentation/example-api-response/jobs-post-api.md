POST
​/almaws​/v1​/conf​/jobs​/{job_id}
Submit a manual or scheduled job
Run a job, either immediately or at a scheduled time. The job is identified by its ID.

set_id has to be provided as a parameter in the body of the request. This is the set that was created in the previous step (or set creation step).

Example URL:
https://api-na.hosted.exlibrisgroup.com/almaws/v1/conf/jobs/M50762?op=run&apikey={apikey}

Example Body:
```xml
<job>
	<parameters>
		<parameter>
			<name>set_id</name>
			<value>9563211250000561</value>
		</parameter>
		<parameter>
			<name>job_name</name>
			<value>Import Research Assets Files - via API - forFileUploadJobViaUpdate</value>
		</parameter>
	</parameters>
</job>
```
```json
{
  "parameter" : [ {
    "name" : {
      "value" : "set_id"
    },
    "value" : "9563211250000561"
  }, {
    "name" : {
      "value" : "job_name"
    },
    "value" : "Import Research Assets Files - via API - forFileUploadJobViaUpdate"
  } ]
}
```

Example Response:
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<job link="https://api-na.hosted.exlibrisgroup.com/almaws/v1/conf/jobs/M50173">
    <id>M50173</id>
    <name>Import Research Assets Files</name>
    <description>Import Research Assets Files</description>
    <type desc="Manual">MANUAL</type>
    <category desc="Research Assets">RESEARCH_ASSETS</category>
    <content desc="Research assets">IMPORT_RESEARCH_ASSETS_FILES</content>
    <parameters>
        <parameter>
            <name>set_id</name>
            <value>9563211250000561</value>
        </parameter>
        <parameter>
            <name>job_name</name>
            <value>Import Research Assets Files - via API - forFileUploadJobViaUpdate</value>
        </parameter>
    </parameters>
    <additional_info link="https://api-na.hosted.exlibrisgroup.com/almaws/v1/conf/jobs/M50173/instances/9563654220000561">Job no. 9563654220000561 triggered on Sun, 05 Oct 2025 09:15:42 GMT</additional_info>
</job>
```
```json
{
  "id": "M50173",
  "name": "Import Research Assets Files",
  "description": "Import Research Assets Files",
  "type": {
    "value": "MANUAL",
    "desc": "Manual"
  },
  "category": {
    "value": "RESEARCH_ASSETS",
    "desc": "Research Assets"
  },
  "content": {
    "value": "IMPORT_RESEARCH_ASSETS_FILES",
    "desc": "Research assets"
  },
  "parameter": [
    {
      "name": {
        "value": "set_id"
      },
      "value": "9563211250000561"
    },
    {
      "name": {
        "value": "job_name"
      },
      "value": "Import Research Assets Files - via API - forFileUploadJobViaUpdate"
    }
  ],
  "additional_info": {
    "value": "Job no. 9563643080000561 triggered on Sun, 05 Oct 2025 09:11:32 GMT",
    "link": "https://api-na.hosted.exlibrisgroup.com/almaws/v1/conf/jobs/M50173/instances/9563643080000561"
  },
  "link": "https://api-na.hosted.exlibrisgroup.com/almaws/v1/conf/jobs/M50173"
}
```