# **UPDATE ASSET API Documentation**

This document outlines the accepted JSON and XML formats and usage notes for the Update Asset API.

## **1\. API Endpoint and Parameters**

To update an asset in Ex Libris Esploro, use the POST /esploro/v1/assets/{assetId} endpoint. This API supports the addition and replacement of individual asset fields.

Sample Endpoint:  
POST https://\[your-institution\].exlibrisgroup.com/esploro/v1/assets/{assetId}?op=patch\&action=replace  
Example:  
[https://api-na.hosted.exlibrisgroup.com/esploro/v1/assets/991291935000561?op=patch\&action=add\&apikey={APIKEY](https://api-na.hosted.exlibrisgroup.com/esploro/v1/assets/991291935000561?op=patch&action=add&apikey={APIKEY)}

**URL Parameters:**

* **assetId**: (Required) The unique identifier of the asset to be updated.  
* **op**: The operation to be performed on the asset. patch is currently supported and is the default value.  
* **action**: Determines how the data is updated.  
  * **add**: For simple fields, this will only update the value if it's currently empty. For list fields, it will append the new value to the existing list.  
  * **replace**: For simple fields, this will replace the existing value. For list fields, it will replace the entire list with the new one.

**Supported Fields Include:**

| Field | JSON Support | XML Support |
| ----- | ----- | ----- |
| Date | Yes | Yes |
| Identifiers | No | Yes |
| Grants Note | Yes | Yes |
| Related Grants (via fundingreferences) | Yes | Yes |
| Links | Yes | Yes |
| Files (via temporary) | Yes | No |

**General Process Summary:**

1. Identify the assetId and the specific fields you wish to modify.  
2. Choose the appropriate action (add or replace) based on your update needs.  
3. Construct the JSON or XML request body with the desired fields and values.  
4. Execute the POST request to the API endpoint.

This method allows for targeted, partial updates without affecting other asset data. Always refer to the official Ex Libris API documentation for complete field definitions and further guidelines.

## **2\. Accepted XML Formats**

Below are examples of accepted XML structures for the request body.

### **XML for Dates**

\<?xml version="1.0" encoding="UTF-8" standalone="yes"?\>  
\<ns3:records total\_record\_count="1" xmlns:ns2="http://esploro\_record" xmlns:ns3="http://rest\_esploro"\>  
    \<record\>  
        \<date.published\>20241110\</date.published\>  
        \<date.accepted\>20200125\</date.accepted\>  
        \<date.created\>20241110\</date.created\>  
        \<date.submitted\>20200125\</date.submitted\>  
    \</record\>  
\</ns3:records\>

### **XML for Funding References**

\<?xml version="1.0" encoding="UTF-8" standalone="yes"?\>  
\<ns3:records total\_record\_count="1" xmlns:ns2="http://esploro\_record" xmlns:ns3="http://rest\_esploro"\>  
    \<record\>  
        \<fundingreferenceList\>  
            \<fundingreference\>  
                \<fundername\>Universitat de València (Spain, Valencia) \- UV\</fundername\>  
                \<awardnumber\>fundrefGrantForDoiTest\</awardnumber\>  
                \<awardtitle\>fundrefGrantForDoiTest\</awardtitle\>  
                \<grantURL\>\</grantURL\>  
            \</fundingreference\>  
            \<fundingreference\>  
                \<fundername\>Technion – Israel Institute of Technology (Israel, Haifa)\</fundername\>  
                \<awardnumber\>existingGrantID31101044960\</awardnumber\>  
                \<awardtitle\>existingGrantName31101044960\</awardtitle\>  
                \<grantURL\>\</grantURL\>  
            \</fundingreference\>  
            \<fundingreference\>  
                \<fundername\>Centre Hospitalier Régional Universitaire de Brest (France, Brest)\</fundername\>  
                \<awardnumber\>newGrant10112024\</awardnumber\>  
                \<awardtitle\>newGrant10112024\</awardtitle\>  
                \<grantURL\>testGrantURL.com\</grantURL\>  
            \</fundingreference\>  
        \</fundingreferenceList\>  
    \</record\>  
\</ns3:records\>

### **XML for Identifiers**

**Note:** \<identifier.\*\>\</identifier.\*\> is only supported in XML format.

\<?xml version="1.0" encoding="UTF-8" standalone="yes"?\>  
\<ns3:records total\_record\_count="1" xmlns:ns2="http://esploro\_record" xmlns:ns3="http://rest\_esploro"\>  
    \<record\>  
        \<identifier.doi\>10.20/30456\</identifier.doi\>  
        \<identifier.pmid\>123456\</identifier.pmid\>  
        \<identifier.pmcid\>123456789\</identifier.pmcid\>  
        \<identifier.uri\>\</identifier.uri\>  
        \<identifier.handle\>someHandleType\</identifier.handle\>  
        \<identifier.ismn\>111222\</identifier.ismn\>  
        \<identifier.isbn\>12345678\</identifier.isbn\>  
        \<identifier.eissn\>11115555\</identifier.eissn\>  
        \<identifier.issn\>12345678\</identifier.issn\>  
        \<identifier.other\>oth\</identifier.other\>  
        \<identifier.govtnum\>gov\</identifier.govtnum\>  
        \<identifier.wos\>12345678922\</identifier.wos\>  
        \<identifier.scopus\>scop\</identifier.scopus\>  
        \<identifier.arxiv\>arx\</identifier.arxiv\>  
        \<identifier.ark\>ark\</identifier.ark\>  
        \<identifier.sici\>sic\</identifier.sici\>  
        \<identifier.rno\>rno\</identifier.rno\>  
        \<identifier.additional01\>add1\</identifier.additional01\>  
        \<identifier.additional02\>add2\</identifier.additional02\>  
        \<identifier.additional03\>add3\</identifier.additional03\>  
        \<identifier.additional04\>add4\</identifier.additional04\>  
        \<identifier.additional05\>add5\</identifier.additional05\>  
        \<identifier.additional06\>add6\</identifier.additional06\>  
        \<identifier.additional07\>add7\</identifier.additional07\>  
        \<identifier.additional08\>add8\</identifier.additional08\>  
        \<identifier.additional09\>add9\</identifier.additional09\>  
        \<identifier.pqdt\>pq\</identifier.pqdt\>  
        \<identifier.eisbn\>123345\</identifier.eisbn\>  
    \</record\>  
\</ns3:records\>

### **XML for Links**

\<?xml version="1.0" encoding="UTF-8" standalone="yes"?\>  
\<ns3:records total\_record\_count="1" xmlns:ns2="http://esploro\_record" xmlns:ns3="http://rest\_esploro"\>  
    \<record\>  
        \<links\>  
            \<link\>  
                \<link.url\>www.google.com\</link.url\>  
                \<link.type\>pdf\</link.type\>  
                \<link.description\>linkDesc\</link.description\>  
                \<link.title\>linkTitle\</link.title\>  
                \<link.rights\>open\</link.rights\>  
                \<link.supplemental\>true\</link.supplemental\>  
                \<link.license\>CCBY\_V\_4.0\</link.license\>  
                \<link.ownership\>owner.institutional\</link.ownership\>  
                \<link.display\_in\_viewer\>true\</link.display\_in\_viewer\>  
            \</link\>  
        \</links\>  
    \</record\>  
\</ns3:records\>

### **XML for Grants Note**

\<?xml version="1.0" encoding="UTF-8" standalone="yes"?\>  
\<ns3:records total\_record\_count="1" xmlns:ns2="http://esploro\_record" xmlns:ns3="http://rest\_esploro"\>  
    \<record\>  
        \<grants.note\>Grants are subject to the completion of milestones\</grants.note\>  
    \</record\>  
\</ns3:records\>

### **XML for Temporary Element**

**Note:** The temporary element for adding files is not a valid or supported field in XML requests for this API version. Please use the JSON format for this functionality.

## **3\. Accepted JSON Formats**

Below are examples of accepted JSON structures for the request body.

### **JSON for Dates**

This format is a more direct way to update record fields.

{  
    "records": \[  
        {  
            "date.published": "20241110",  
            "date.accepted": "20200125",  
            "date.created": "20241110",  
            "date.submitted": "20200125"  
        }  
    \]  
}

### **JSON for Adding Files via temporary element**

This structure is used to add files that need to be extracted and linked to the asset.  
Note: temporary \> linksToExtract \> link\* is only supported in JSON format.  
{  
    "records": \[  
        {  
            "temporary": {  
                "linksToExtract": \[  
                    {  
                        "link.title": "THIS WORKS",  
                        "link.url": “www.google.com”,  
                        "link.description": "some file description",  
                        "link.type": "accepted",  
                        "link.supplemental": "true"  
                    }  
                \]  
            }  
        }  
    \]  
}

### **JSON for Funding References**

Use this format to add or replace funding and grant information.

{  
    "records": \[  
        {  
            "fundingreferenceList": \[  
                {  
                    "fundername": "Universitat de València (Spain, Valencia) \- UV",  
                    "awardnumber": "fundrefGrantForDoiTest",  
                    "awardtitle": "fundrefGrantForDoiTest",  
                    "grantURL": ""  
                },  
                {  
                    "fundername": "Technion – Israel Institute of Technology (Israel, Haifa)",  
                    "awardnumber": "existingGrantID31101044960",  
                    "awardtitle": "existingGrantName31101044960",  
                    "grantURL": ""  
                },  
                {  
                    "fundername": "Centre Hospitalier Régional Universitaire de Brest (France, Brest)",  
                    "awardnumber": "newGrant10112024",  
                    "awardtitle": "newGrant10112024",  
                    "grantURL": "testGrantURL.com"  
                }  
            \]  
        }  
    \]  
}

### **JSON for Identifiers**

**Note:** The identifier.\* fields are not valid for updates via JSON input. Please use the XML format for this functionality.

### **JSON for Links**

This format is used for updating general web links associated with the asset.

{  
    "records": \[  
        {  
            "links": \[  
                {  
                    "link.url": "\[https://www.google.com\](https://www.google.com)",  
                    "link.type": "pdf",  
                    "link.description": "linkDesc",  
                    "link.title": "linkTitle",  
                    "link.rights": "open",  
                    "link.supplemental": true,  
                    "link.license": "CCBY\_V4.0",  
                    "link.ownership": "owner.institutional",  
                    "link.display\_in\_viewer": true  
                }  
            \]  
        }  
    \]  
}

### **JSON for Grants Note**

Use this format to add a note that applies to all grants listed for the asset.

{  
    "records": \[  
        {  
            "grants.note": "Grants are subject to the completion of milestones"  
        }  
    \]  
}

## **4\. Element Relationship Diagram**

The diagram below illustrates the hierarchical structure of the data elements used in the Asset API. The `record` (or `records` in JSON) is the main entity, containing various fields and lists of objects.

records   
├── date.published  
├── date.accepted  
├── date.created  
├── date.submitted  
├── grants.note  
├── identifier.doi		(XML Only)  
├── identifier.pmid 		(XML Only)  
├── identifier.pmcid		(XML Only)  
├── identifier.uri 		(XML Only)  
├── identifier.handle		(XML Only)  
├── identifier.ismn		(XML Only)  
├── identifier.isbn 		(XML Only)  
├── identifier.eissn		(XML Only)  
├── identifier.issn		(XML Only)  
├── identifier.other 		(XML Only)  
├── identifier.govtnum 	(XML Only)  
├── identifier.wos 		(XML Only)  
├── identifier.scopus 	(XML Only)  
├── identifier.arxiv 		(XML Only)  
├── identifier.ark 		(XML Only)  
├── identifier.sici 		(XML Only)  
├── identifier.rno 		(XML Only)  
├── identifier.additional\#\# 	(XML Only) / /where \#\#m is a digit between 01 \- 09  
├── identifier.pqdt 		(XML Only)  
├── identifier.eisbn 		(XML Only)  
├── fundingreferenceList  
│   └── fundingreference  
│       ├── fundername   
│       ├── awardnumber   
│       ├── awardtitle  
│       └── grantURL  
├── links  
│   └── link  
│       ├── link.url 		// mandatory   
│       ├── link.type  
│       ├── link.description  
│       ├── link.title  
│       ├── link.rights  
│       ├── link.supplemental  
│       ├── link.license  
│       ├── link.ownership  
│       └── link.display\_in\_viewer  
└── temporary 		(JSON Only)  
    └── linksToExtract  
        └── link  
            ├── link.title   
            ├── link.url 		// mandatory  
            ├── link.description   
            ├── link.type  
            └── link.supplemental

## **1\. Consolidated XML Structure**

This example shows a single `record` element containing all supported fields for the XML format. Note that `identifier.*` fields are only supported via XML.

\<?xml version="1.0" encoding="UTF-8" standalone="yes"?\>  
\<ns3:records total\_record\_count="1" xmlns:ns2="http://esploro\_record" xmlns:ns3="http://rest\_esploro"\>  
    \<record\>  
        \<\!-- Date Fields \--\>  
        \<date.published\>20241110\</date.published\>  
        \<date.accepted\>20200125\</date.accepted\>  
        \<date.created\>20241110\</date.created\>  
        \<date.submitted\>20200125\</date.submitted\>

        \<\!-- Grant Note \--\>  
        \<grants.note\>Grants are subject to the completion of milestones\</grants.note\>

        \<\!-- Identifier Fields (XML Only) \--\>  
        \<identifier.doi\>10.20/30456\</identifier.doi\>  
        \<identifier.pmid\>123456\</identifier.pmid\>  
        \<identifier.pmcid\>123456789\</identifier.pmcid\>  
        \<identifier.uri\>\</identifier.uri\>  
        \<identifier.handle\>someHandleType\</identifier.handle\>  
        \<identifier.ismn\>111222\</identifier.ismn\>  
        \<identifier.isbn\>12345678\</identifier.isbn\>  
        \<identifier.eissn\>11115555\</identifier.eissn\>  
        \<identifier.issn\>12345678\</identifier.issn\>  
        \<identifier.other\>oth\</identifier.other\>  
        \<identifier.govtnum\>gov\</identifier.govtnum\>  
        \<identifier.wos\>12345678922\</identifier.wos\>  
        \<identifier.scopus\>scop\</identifier.scopus\>  
        \<identifier.arxiv\>arx\</identifier.arxiv\>  
        \<identifier.ark\>ark\</identifier.ark\>  
        \<identifier.sici\>sic\</identifier.sici\>  
        \<identifier.rno\>rno\</identifier.rno\>  
        \<identifier.additional01\>add1\</identifier.additional01\>  
        \<identifier.additional02\>add2\</identifier.additional02\>  
        \<identifier.additional03\>add3\</identifier.additional03\>  
        \<identifier.additional04\>add4\</identifier.additional04\>  
        \<identifier.additional05\>add5\</identifier.additional05\>  
        \<identifier.additional06\>add6\</identifier.additional06\>  
        \<identifier.additional07\>add7\</identifier.additional07\>  
        \<identifier.additional08\>add8\</identifier.additional08\>  
        \<identifier.additional09\>add9\</identifier.additional09\>  
        \<identifier.pqdt\>pq\</identifier.pqdt\>  
        \<identifier.eisbn\>123345\</identifier.eisbn\>

        \<\!-- Funding References List \--\>  
        \<fundingreferenceList\>  
            \<fundingreference\>  
                \<fundername\>Universitat de València (Spain, Valencia) \- UV\</fundername\>  
                \<awardnumber\>fundrefGrantForDoiTest\</awardnumber\>  
                \<awardtitle\>fundrefGrantForDoiTest\</awardtitle\>  
                \<grantURL\>\</grantURL\>  
            \</fundingreference\>  
            \<fundingreference\>  
                \<fundername\>Technion – Israel Institute of Technology (Israel, Haifa)\</fundername\>  
                \<awardnumber\>existingGrantID31101044960\</awardnumber\>  
                \<awardtitle\>existingGrantName31101044960\</awardtitle\>  
                \<grantURL\>\</grantURL\>  
            \</fundingreference\>  
        \</fundingreferenceList\>

        \<\!-- Links List \--\>  
        \<links\>  
            \<link\>  
                \<link.url\>\[www.google.com\](https://www.google.com)\</link.url\>  
                \<link.type\>pdf\</link.type\>  
                \<link.description\>linkDesc\</link.description\>  
                \<link.title\>linkTitle\</link.title\>  
                \<link.rights\>open\</link.rights\>  
                \<link.supplemental\>true\</link.supplemental\>  
                \<link.license\>CCBY\_V\_4.0\</link.license\>  
                \<link.ownership\>owner.institutional\</link.ownership\>  
                \<link.display\_in\_viewer\>true\</link.display\_in\_viewer\>  
            \</link\>  
        \</links\>  
    \</record\>  
\</ns3:records\>

## **2\. Consolidated JSON Structure**

This example shows a single `records` object containing all supported fields for the JSON format. Note that the `temporary` element for file uploads is only supported via JSON.

{  
    "records": \[  
        {  
            "date.published": "20241110",  
            "date.accepted": "20200125",  
            "date.created": "20241110",  
            "date.submitted": "20200125",  
            "grants.note": "Grants are subject to the completion of milestones",  
            "fundingreferenceList": \[  
                {  
                    "fundername": "Universitat de València (Spain, Valencia) \- UV",  
                    "awardnumber": "fundrefGrantForDoiTest",  
                    "awardtitle": "fundrefGrantForDoiTest",  
                    "grantURL": ""  
                },  
                {  
                    "fundername": "Technion – Israel Institute of Technology (Israel, Haifa)",  
                    "awardnumber": "existingGrantID31101044960",  
                    "awardtitle": "existingGrantName31101044960",  
                    "grantURL": ""  
                }  
            \],  
            "links": \[  
                {  
                    "link.url": "\[https://www.google.com\](https://www.google.com)",  
                    "link.type": "pdf",  
                    "link.description": "linkDesc",  
                    "link.title": "linkTitle",  
                    "link.rights": "open",  
                    "link.supplemental": true,  
                    "link.license": "CCBY\_V4.0",  
                    "link.ownership": "owner.institutional",  
                    "link.display\_in\_viewer": true  
                }  
            \],  
            "temporary": {  
                "linksToExtract": \[  
                    {  
                        "link.title": "Sample File Title",  
                        "link.url": "\[https://knowledge.exlibrisgroup.com/\](https://knowledge.exlibrisgroup.com/)...",  
                        "link.description": "some file description",  
                        "link.type": "accepted",  
                        "link.supplemental": "true"  
                    }  
                \]  
            }  
        }  
    \]  
}  
