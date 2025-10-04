# **API to Add new file to Asset**

**Product:** Esploro

### **Description**

Can I use the Post Asset API to add a file to an existing asset?

### **Resolution**

Yes, the Post Asset API can be used to add a temporary file link to the Asset record using the temporary element. This operation is **only supported in JSON format**.

After the API call, the "Load files" job can be run to move the files from their temporary location and load them into Esploro.

API Endpoint  
POST /esploro/v1/assets/{assetId}  
**URL Parameters**

* **assetId**: (Required) The unique identifier of the asset to be updated.  
* **op**: The operation to be performed. patch is currently supported and is the default value.  
* **action**: Determines how the data is updated. Use add to append files to the list.

### **Body Parameters**

**Note:** Adding files via the temporary element is only supported using the JSON format. The XML format is not valid for this operation.

The body should contain a records array with an object that includes the temporary element as shown below.

**JSON**

{  
    "records": \[  
        {  
            "temporary": {  
                "linksToExtract": \[  
                    {  
                        "link.title": "some file display name",  
                        "link.url": "\[https://static.dw.com/image/43134986\_303.jpg\](https://static.dw.com/image/43134986\_303.jpg)",  
                        "link.description": "some file description",  
                        "link.type": "accepted",  
                        "link.supplemental": "true"  
                    },  
                    {  
                        "link.title": "another file display name",  
                        "link.url": "\[https://static.dw.com/image/43134986\_304.jpg\](https://static.dw.com/image/43134986\_304.jpg)",  
                        "link.description": "another file description",  
                        "link.type": "supplementary",  
                        "link.supplemental": "true"  
                    }  
                \]  
            }  
        }  
    \]  
}

### **Additional Information**

* Esploro API Resource URL (Developer Network)  
* Esploro API Rest Esploro Records (Developer Network)

*Article last updated: September 30, 2025*