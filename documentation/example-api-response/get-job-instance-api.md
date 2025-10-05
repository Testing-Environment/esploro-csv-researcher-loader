GET 
​/almaws​/v1​/conf​/jobs​/{job_id}​/instances​/{instance_id}
Retrieve details of a specific job instance.
Information about the job that was triggered/run and its processing status.

Job ID and Instance ID can be obtained from the response of the Jobs when the job is triggered/run.

Example URL:
https://api-na.hosted.exlibrisgroup.com/almaws/v1/conf/jobs/M50173/instances/9563643080000561?apikey={apikey}

Example Response:
```xml  
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<job_instance link="https://api-na.hosted.exlibrisgroup.com/almaws/v1/conf/jobs/M50173/instances/9563643080000561">
    <id>9563643080000561</id>
    <external_id>9563643070000561</external_id>
    <name>Import Research Assets Files - via API - forFileUploadJobViaUpdate - 2025-10-05 4:11 AM</name>
    <submitted_by desc="Ex Libris, API">exl_api</submitted_by>
    <submit_time>2025-10-05T09:11:32.592Z</submit_time>
    <start_time>2025-10-05T09:11:32.658Z</start_time>
    <end_time>2025-10-05T09:11:36.463Z</end_time>
    <progress>100</progress>
    <status desc="Completed Successfully">COMPLETED_SUCCESS</status>
    <status_date>2025-10-05Z</status_date>
    <alerts>
        <alert desc="The job completed successfully. For more information view the report details.">alert_general_success</alert>
    </alerts>
    <counters>
        <counter>
            <type desc="Number of assets succeeded">import_research_assets_files.asset_succeeded</type>
            <value>0</value>
        </counter>
        <counter>
            <type desc="Number of assets partially succeeded">import_research_assets_files.asset_partial_succeeded</type>
            <value>0</value>
        </counter>
        <counter>
            <type desc="Number of assets failed">import_research_assets_files.asset_failed</type>
            <value>1</value>
        </counter>
        <counter>
            <type desc="Number of files uploaded">import_research_assets_files.file_uploaded</type>
            <value>0</value>
        </counter>
        <counter>
            <type desc="Number of files failed to upload">import_research_assets_files.file_failed_to_upload</type>
            <value>1</value>
        </counter>
        <counter>
            <type desc="Number of files skipped upload">import_research_assets_files.file_skipped_upload</type>
            <value>0</value>
        </counter>
    </counters>
    <job_info link="https://api-na.hosted.exlibrisgroup.com/almaws/v1/conf/jobs/M50173">
        <id>M50173</id>
        <name>Import Research Assets Files</name>
        <description>Import Research Assets Files</description>
        <type desc="Manual">MANUAL</type>
        <category desc="Research Assets">RESEARCH_ASSETS</category>
    </job_info>
</job_instance>
```
```json
{
    "id": "9563643080000561",
    "name": "Import Research Assets Files - via API - forFileUploadJobViaUpdate - 2025-10-05 4:11 AM",
    "progress": 100,
    "status": {
        "value": "COMPLETED_SUCCESS",
        "desc": "Completed Successfully"
    },
    "external_id": "9563643070000561",
    "submitted_by": {
        "value": "exl_api",
        "desc": "Ex Libris, API"
    },
    "submit_time": "2025-10-05T09:11:32.592Z",
    "start_time": "2025-10-05T09:11:32.658Z",
    "end_time": "2025-10-05T09:11:36.463Z",
    "status_date": "2025-10-05Z",
    "alert": [
        {
            "value": "alert_general_success",
            "desc": "The job completed successfully. For more information view the report details."
        }
    ],
    "counter": [
        {
            "type": {
                "value": "import_research_assets_files.asset_succeeded",
                "desc": "Number of assets succeeded"
            },
            "value": "0"
        },
        {
            "type": {
                "value": "import_research_assets_files.asset_partial_succeeded",
                "desc": "Number of assets partially succeeded"
            },
            "value": "0"
        },
        {
            "type": {
                "value": "import_research_assets_files.asset_failed",
                "desc": "Number of assets failed"
            },
            "value": "1"
        },
        {
            "type": {
                "value": "import_research_assets_files.file_uploaded",
                "desc": "Number of files uploaded"
            },
            "value": "0"
        },
        {
            "type": {
                "value": "import_research_assets_files.file_failed_to_upload",
                "desc": "Number of files failed to upload"
            },
            "value": "1"
        },
        {
            "type": {
                "value": "import_research_assets_files.file_skipped_upload",
                "desc": "Number of files skipped upload"
            },
            "value": "0"
        }
    ],
    "job_info": {
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
        "link": "https://api-na.hosted.exlibrisgroup.com/almaws/v1/conf/jobs/M50173"
    },
    "link": "https://api-na.hosted.exlibrisgroup.com/almaws/v1/conf/jobs/M50173/instances/9563643080000561"
}
```
