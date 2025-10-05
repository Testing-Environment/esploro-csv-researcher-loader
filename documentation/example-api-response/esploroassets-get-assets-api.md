GET
/esploro/v1/assets/{assetIds}
{assetIds}: The Asset Identifier(s), optionally delimited by commas

Example URL where assetIds are 991274654700561, 99998648800561 and 991283105600561:
https://api-na.hosted.exlibrisgroup.com/esploro/v1/assets/991274654700561%2C99998648800561%2C991283105600561?limit=10&offset=0&apikey={apikey}
{apikey}: Your API key

In Cloud Apps, the API key is not required if you are authenticated. It will use the Cloud App restapi service. 

Please refer to the documentation for more details: https://developers.exlibrisgroup.com/cloud-apps/docs/guides/rest-api/

The data of interest in the response would be the:
1: "resourceTypeEsploroWithDesc" of each asset, for example: 
{
        "value": "publication.journalArticle",
        "desc": "Journal article"
}

This will inform the file types that can be applied to the asset.

2: "files" of each asset, for example:

"files": [
        {
          "fileTypeWithDesc": null,
          "fileLicenseCodeWithDesc": null,
          "fileDownloadUrl": "https://tr-integration-researchmanagement.esploro.exlibrisgroup.com/view/delivery/TR_INTEGRATION_INST/12442803160000561/13442803130000561",
          "file.name": "DOI.html",
          "file.creationDate": "2025-06-27 14:29:38",
          "file.mimeType": "text/html",
          "file.type": null,
          "file.description": null,
          "file.rights": "Open",
          "file.license.code": null,
          "file.size": "296",
          "file.extension": "html",
          "file.persistent.url": "https://tr-integration-researchmanagement.esploro.exlibrisgroup.com/esploro/outputs/journalArticle/07947818-COVID-19-in-2021--Edited/991283105600561#file-0",
          "file.order": "0",
          "file.supplemental": "no",
          "file.embargo_expiry_date": "",
          "file.displayName": "DOI File with Open Access"
        },
        {
          "fileTypeWithDesc": null,
          "fileLicenseCodeWithDesc": null,
          "fileDownloadUrl": "https://tr-integration-researchmanagement.esploro.exlibrisgroup.com/view/delivery/TR_INTEGRATION_INST/12442803160000561/13442803120000561",
          "file.name": "DOI2.html",
          "file.creationDate": "2025-06-27 14:29:38",
          "file.mimeType": "text/html",
          "file.type": null,
          "file.description": null,
          "file.rights": "Local",
          "file.license.code": null,
          "file.size": "296",
          "file.extension": "html",
          "file.persistent.url": "https://tr-integration-researchmanagement.esploro.exlibrisgroup.com/esploro/outputs/journalArticle/07947818-COVID-19-in-2021--Edited/991283105600561#file-1",
          "file.order": "1",
          "file.supplemental": "no",
          "file.embargo_expiry_date": "",
          "file.displayName": "DOI File with Custom Access"
        }
      ]

This will inform the current files that exists for the asset.

Example Response:
```json
{
  "totalRecordCount": 3,
  "records": [
    {
      "mobileCompatibility": "unknown",
      "sourceCodeAvailability": "unknown",
      "creators": [
        {
          "order": "1",
          "isDisplayInPublicProfile": false,
          "affiliationWithDesc": [
            {
              "value": "PanTherapeutics, CH-1095 Lutry, Switzerland",
              "desc": "PanTherapeutics, CH-1095 Lutry, Switzerland",
              "order": "1"
            }
          ],
          "almaUserId": "9506568840000561",
          "creatorname": "Kenneth Lundstrom",
          "familyname": "Lundstrom",
          "givenname": "Kenneth"
        },
        {
          "order": "2",
          "additionalIdentifiers": {
            "GoogleScholarID": "0",
            "UNIV_ID": "14119901"
          },
          "isDisplayInPublicProfile": true,
          "affiliationWithDesc": [
            {
              "value": "TR_INTEGRATION_INST___Faculty_of_Engineering",
              "desc": "Faculty of Engineering",
              "order": "1"
            }
          ],
          "almaUserId": "7301475980000561",
          "creatorname": "Amir Faaiz Shamsolnizam",
          "familyname": "Shamsolnizam",
          "givenname": "Amir",
          "middlename": "Faaiz",
          "user.primaryId": "amirshomzy"
        },
        {
          "order": "3",
          "isDisplayInPublicProfile": false,
          "affiliationWithDesc": [
            {
              "value": "41___YARMOUK_UNIVERSITY_(IRBID)",
              "desc": "Yarmouk University (Jordan, Irbid) - YU",
              "order": "1"
            }
          ],
          "almaUserId": "9506568940000561",
          "creatorname": "Alaa A. A. Aljabali",
          "familyname": "Aljabali",
          "givenname": "Alaa A. A.",
          "identifier.orcid": "0000-0002-9519-6338"
        }
      ],
      "event": {},
      "title": "07947818 COVID-19 in 2021 | Edited 4 Aug 2025 | NLM Abbrev. Edited",
      "publisher": "Mdpi",
      "openaccess": "yes",
      "openAccessStatus": "gold",
      "peerreview": "yes",
      "license": "CCBY_V4.0",
      "licenseWithDesc": {
        "value": "CCBY_V4.0",
        "desc": "CC BY V4.0"
      },
      "language": [
        "eng"
      ],
      "pages": "5",
      "etd": {},
      "patent": {},
      "originalRepository": {
        "assetId": "991283105600561"
      },
      "temporary": {},
      "depositStatusWithDesc": {
        "value": "approved",
        "desc": "Approved"
      },
      "files": [
        {
          "fileTypeWithDesc": null,
          "fileLicenseCodeWithDesc": null,
          "fileDownloadUrl": "https://tr-integration-researchmanagement.esploro.exlibrisgroup.com/view/delivery/TR_INTEGRATION_INST/12442803160000561/13442803130000561",
          "file.name": "DOI.html",
          "file.creationDate": "2025-06-27 14:29:38",
          "file.mimeType": "text/html",
          "file.type": null,
          "file.description": null,
          "file.rights": "Open",
          "file.license.code": null,
          "file.size": "296",
          "file.extension": "html",
          "file.persistent.url": "https://tr-integration-researchmanagement.esploro.exlibrisgroup.com/esploro/outputs/journalArticle/07947818-COVID-19-in-2021--Edited/991283105600561#file-0",
          "file.order": "0",
          "file.supplemental": "no",
          "file.embargo_expiry_date": "",
          "file.displayName": "DOI File with Open Access"
        },
        {
          "fileTypeWithDesc": null,
          "fileLicenseCodeWithDesc": null,
          "fileDownloadUrl": "https://tr-integration-researchmanagement.esploro.exlibrisgroup.com/view/delivery/TR_INTEGRATION_INST/12442803160000561/13442803120000561",
          "file.name": "DOI2.html",
          "file.creationDate": "2025-06-27 14:29:38",
          "file.mimeType": "text/html",
          "file.type": null,
          "file.description": null,
          "file.rights": "Local",
          "file.license.code": null,
          "file.size": "296",
          "file.extension": "html",
          "file.persistent.url": "https://tr-integration-researchmanagement.esploro.exlibrisgroup.com/esploro/outputs/journalArticle/07947818-COVID-19-in-2021--Edited/991283105600561#file-1",
          "file.order": "1",
          "file.supplemental": "no",
          "file.embargo_expiry_date": "",
          "file.displayName": "DOI File with Custom Access"
        }
      ],
      "displayedDateByPriorityEsploroCP": "18/10/2021",
      "translatedLanguages": [
        "English"
      ],
      "identifier.doi": "10.3390/v13102098",
      "identifier.pmid": "34696528",
      "identifier.uri": "https://tr-integration-researchmanagement.esploro.exlibrisgroup.com/esploro/outputs/journalArticle/07947818-COVID-19-in-2021--Edited/991283105600561",
      "identifier.wos": "WOS:000714038800001",
      "links": [
        {
          "linkTypeWithDesc": {
            "value": "published",
            "desc": "Published (Version of record)"
          },
          "linkLicenseCodeWithDesc": null,
          "linkOwnershipWithDesc": {
            "value": "owner.external",
            "desc": "External"
          },
          "link.url": "https://doi.org/10.3390/v13102098/amireditedthisin",
          "link.type": "published",
          "link.description": null,
          "link.title": null,
          "link.rights": "open",
          "link.supplemental": false,
          "link.license": null,
          "link.ownership": "owner.external",
          "link.order": 1,
          "link.display_in_viewer": false,
          "link.rightsreason": null,
          "link.embargoend": null
        }
      ],
      "date.published": "20211018",
      "asset.views": 2,
      "asset.downloads": 1,
      "open_access_indicator": "Yes",
      "resourcetype.esploro": "publication.journalArticle",
      "subject.esploro": [
        "Virology"
      ],
      "discipline.summon": [
        "Biology"
      ],
      "keywords": [
        {
          "language": "und",
          "values": [
            "Life Sciences",
            "Science"
          ]
        }
      ],
      "relationships": [
        {
          "relationtype": "ispartof",
          "relationtitle": "Viruses",
          "issue": "10",
          "volume": "13",
          "relationTypeWithDesc": {
            "value": "c.esploro.relation.asset.ispartof",
            "desc": "is part of"
          },
          "relationCategoryCodeWithDesc": {
            "value": "INTERNAL",
            "desc": "Internal"
          },
          "spage": "2098",
          "article.number": "2098",
          "identifier.eissn": "1999-4915",
          "identifier.issn": "1999-4915",
          "nlm.abbrev": "Viruses Edited",
          "relation.category": "INTERNAL"
        }
      ],
      "local.fields": {},
      "asset.affiliation": [
        "Faculty of Engineering",
        "Greek philosophy"
      ],
      "portal_visibility": "true",
      "profile_visibility": "true",
      "resourceTypeEsploroWithDesc": {
        "value": "publication.journalArticle",
        "desc": "Journal article"
      },
      "format": [
        "html"
      ]
    },
    {
      "mobileCompatibility": "unknown",
      "sourceCodeAvailability": "unknown",
      "creators": [
        {
          "suffix": "",
          "order": "2",
          "additionalIdentifiers": {
            "Scopus": "0054321"
          },
          "isDisplayInPublicProfile": true,
          "affiliationWithDesc": [
            {
              "value": "Faculty of Classics",
              "desc": "Faculty of Classics",
              "order": "1"
            }
          ],
          "almaUserId": "7034511220000561",
          "creatorname": "Aliza Ben-Draim",
          "familyname": "Ben-Draim",
          "givenname": "Aliza",
          "middlename": "",
          "identifier.scopus": "0054321",
          "user.primaryId": "AlizaBD"
        },
        {
          "order": "3",
          "additionalIdentifiers": {
            "GoogleScholarID": "0",
            "UNIV_ID": "14119901"
          },
          "role": "Author",
          "isDisplayInPublicProfile": true,
          "almaUserId": "7301475980000561",
          "creatorname": "Amir Faaiz Shomzy",
          "familyname": "Shomzy",
          "givenname": "Amir",
          "middlename": "Faaiz",
          "user.primaryId": "amirshomzy"
        },
        {
          "suffix": "",
          "order": "1",
          "isDisplayInPublicProfile": false,
          "almaUserId": "7045766340000561",
          "creatorname": "Laurence M. Epstein",
          "familyname": "Epstein",
          "givenname": "Laurence M.",
          "middlename": ""
        }
      ],
      "contributors": [
        {
          "order": "1",
          "additionalIdentifiers": {
            "GoogleScholarID": "0",
            "UNIV_ID": "14119901"
          },
          "role": "Contributor",
          "isDisplayInPublicProfile": true,
          "almaUserId": "7301475980000561",
          "contributorname": "Amir Faaiz Shomzy",
          "familyname": "Shomzy",
          "givenname": "Amir",
          "middlename": "Faaiz",
          "user.primaryId": "amirshomzy"
        }
      ],
      "event": {},
      "title": "07947818 Supraventricular Tachycardia | Edited on 4 Aug 2025 | NLM Abbrv. Edited | esploro_impl edited",
      "openaccess": "no",
      "peerreview": "no",
      "language": [
        "eng"
      ],
      "etd": {},
      "patent": {},
      "originalRepository": {
        "assetId": "99998648800561"
      },
      "temporary": {},
      "depositStatusWithDesc": {
        "value": "approved",
        "desc": "Approved"
      },
      "displayedDateByPriorityEsploroCP": "01/11/2012",
      "translatedLanguages": [
        "English"
      ],
      "identifier.doi": "10.2310/7900.1013",
      "identifier.uri": "https://tr-integration-researchmanagement.esploro.exlibrisgroup.com/esploro/outputs/journalArticle/07947818-Supraventricular-Tachycardia--Edited-on/99998648800561",
      "date.published": "20121101",
      "asset.views": 6,
      "open_access_indicator": "No",
      "resourcetype.esploro": "publication.journalArticle",
      "keywords": [
        {
          "language": "und",
          "values": [
            "Keywords",
            "Technology"
          ]
        }
      ],
      "relationships": [
        {
          "relationtype": "ispartof",
          "relationtitle": "DeckerMed Medicine: Cardiovascular Medicine",
          "relationTypeWithDesc": {
            "value": "c.esploro.relation.asset.ispartof",
            "desc": "is part of"
          },
          "relationCategoryCodeWithDesc": {
            "value": "INTERNAL",
            "desc": "Internal"
          },
          "nlm.abbrev": "Virology Edited",
          "relation.category": "INTERNAL"
        }
      ],
      "description.abstract": [
        {
          "language": "und",
          "value": "Supraventricular tachycardias (SVTs) comprise a group of arrhythmias for which the atria and/or atrioventricular (AV) node are integral to sustaining the rhythm. These arrhythmias typically have a benign natural history but account for a considerable proportion of patients presenting with symptoms including palpitations, shortness of breath, chest discomfort, dizziness, and, on occasion, syncope. They affect a broad range of patients, from young, otherwise healthy adults and children to elderly patients with multiple comorbidities. Although medical management with AV nodal blocking medications or antiarrhythmic medications is a reasonable first-line approach, catheter ablation is a definitive, most often curable option that has minimal risk and offers the chance of avoiding long-term medications. This chapter covers the epidemiology, diagnosis, and management of SVTs, which include atrioventricular nodal reentrant tachycardia (AVNRT), atrioventricular reentrant tachycardia (AVRT), atrial tachycardia (AT), and others (atrial flutter, inappropriate sinus tachycardia, and junctional tachycardia). Atrial fibrillation, which is more prevalent than all other SVTs combined, are discussed elsewhere. Figures describe the differential diagnosis of tachycardia with narrow and wide QRS complexes, the relationship between the response to intravenous adenosine and the cause of tachycardia, the mechanism of tachycardia induction in patients with dual AV node conduction pathways, and the management of atrial flutter. Electrocardiograms illustrate features of various forms of SVT.\r\nThis review contains 11 highly rendered figures (included 6 twelve-lead ECGs), 1 table, and 69 references."
        }
      ],
      "local.fields": {
        "local.note1": "I am editable but need to be approved",
        "local.note4": "I am editable and no approval needed",
        "local.note8": "I am editable and no approval needed and double that of 4",
        "local.note11": "OOOOOO YYEEAAAAHHH - KoolAid",
        "local.note13": "Drink the coolaid (I am not supposed to be editable)"
      },
      "asset.affiliation": [
        "Faculty of Classics"
      ],
      "portal_visibility": "true",
      "profile_visibility": "true",
      "resourceTypeEsploroWithDesc": {
        "value": "publication.journalArticle",
        "desc": "Journal article"
      }
    },
    {
      "mobileCompatibility": "unknown",
      "sourceCodeAvailability": "unknown",
      "creators": [
        {
          "order": "6",
          "isDisplayInPublicProfile": true,
          "almaUserId": "9121801780000561",
          "creatorname": "Purged User2",
          "familyname": "User2",
          "givenname": "Purged",
          "user.primaryId": "notpurgeduser"
        },
        {
          "order": "1",
          "isDisplayInPublicProfile": false,
          "affiliationWithDesc": [
            {
              "value": "41___CHIANG_MAI_UNIVERSITY_(CHIANG_MAI)",
              "desc": "Chiang Mai University (Thailand, Chiang Mai) - CMU",
              "order": "1"
            }
          ],
          "almaUserId": "9121495730000561",
          "creatorname": "Aniwat Phaphuangwittayakul",
          "familyname": "Phaphuangwittayakul",
          "givenname": "Aniwat",
          "identifier.orcid": "0000-0002-2289-3116"
        },
        {
          "order": "2",
          "isDisplayInPublicProfile": false,
          "affiliationWithDesc": [
            {
              "value": "41___CHIANG_MAI_UNIVERSITY_(CHIANG_MAI)",
              "desc": "Chiang Mai University (Thailand, Chiang Mai) - CMU",
              "order": "1"
            }
          ],
          "almaUserId": "9121495850000561",
          "creatorname": "Napat Harnpornchai",
          "familyname": "Harnpornchai",
          "givenname": "Napat"
        },
        {
          "order": "3",
          "isDisplayInPublicProfile": false,
          "affiliationWithDesc": [
            {
              "value": "41___EAST_CHINA_UNIVERSITY_OF_SCIENCE_AND_TECHNOLOGY_(SHANGHAI)",
              "desc": "East China University of Science and Technology (China, Shanghai) - ECUST",
              "order": "1"
            }
          ],
          "almaUserId": "9121495960000561",
          "creatorname": "Fangli Ying",
          "familyname": "Ying",
          "givenname": "Fangli",
          "identifier.orcid": "0000-0001-8390-3229"
        },
        {
          "order": "4",
          "additionalIdentifiers": {
            "GoogleScholarID": "0",
            "UNIV_ID": "14119901"
          },
          "isDisplayInPublicProfile": true,
          "affiliationWithDesc": [
            {
              "value": "TR_INTEGRATION_INST___Faculty_of_Engineering",
              "desc": "Faculty of Engineering",
              "order": "1"
            }
          ],
          "almaUserId": "7301475980000561",
          "creatorname": "Amir Faaiz Shomzy",
          "familyname": "Shomzy",
          "givenname": "Amir",
          "middlename": "Faaiz",
          "user.primaryId": "amirshomzy"
        },
        {
          "order": "5",
          "isDisplayInPublicProfile": false,
          "affiliationWithDesc": [
            {
              "value": "41___CHIANG_MAI_UNIVERSITY_(CHIANG_MAI)",
              "desc": "Chiang Mai University (Thailand, Chiang Mai) - CMU",
              "order": "1"
            }
          ],
          "almaUserId": "9121496080000561",
          "creatorname": "Jinming Zhang",
          "familyname": "Zhang",
          "givenname": "Jinming"
        }
      ],
      "event": {},
      "title": "07947818 RailTrack-DaViT: A Vision Transformer-Based Approach for Automated Railway Track Defect Detection",
      "publisher": "Mdpi",
      "openaccess": "yes",
      "openAccessStatus": "gold",
      "peerreview": "yes",
      "license": "CCBY_V4.0",
      "licenseWithDesc": {
        "value": "CCBY_V4.0",
        "desc": "CC BY V4.0"
      },
      "language": [
        "eng"
      ],
      "pages": "27",
      "etd": {},
      "patent": {
        "patent.number": "",
        "patent.abbrevnum": "",
        "patent.kindcode": "",
        "patent.applicationnum": "",
        "patent.applicationcode": ""
      },
      "originalRepository": {
        "assetId": "991274654700561"
      },
      "temporary": {},
      "depositStatusWithDesc": {
        "value": "approved",
        "desc": "Approved"
      },
      "displayedDateByPriorityEsploroCP": "07/08/2024",
      "translatedLanguages": [
        "English"
      ],
      "identifier.doi": "10.3390/jimaging10080192",
      "identifier.pmid": "39194981",
      "identifier.uri": "https://tr-integration-researchmanagement.esploro.exlibrisgroup.com/esploro/outputs/journalArticle/07947818-RailTrack-DaViT-A-Vision-Transformer-Based-Approach/991274654700561",
      "identifier.wos": "WOS:001304741000001",
      "links": [
        {
          "linkTypeWithDesc": {
            "value": "published",
            "desc": "Published (Version of record)"
          },
          "linkLicenseCodeWithDesc": null,
          "linkOwnershipWithDesc": {
            "value": "owner.external",
            "desc": "External"
          },
          "link.url": "https://doi.org/10.3390/jimaging10080192",
          "link.type": "published",
          "link.description": null,
          "link.title": null,
          "link.rights": "open",
          "link.supplemental": false,
          "link.license": null,
          "link.ownership": "owner.external",
          "link.order": 1,
          "link.display_in_viewer": false,
          "link.rightsreason": null,
          "link.embargoend": null
        }
      ],
      "publication.place": [
        ""
      ],
      "date.published": "20240807",
      "date.accepted": "20200125",
      "asset.views": 2,
      "open_access_indicator": "Yes",
      "resourcetype.esploro": "publication.journalArticle",
      "subject.esploro": [
        "Technology"
      ],
      "discipline.summon": [
        "Engineering"
      ],
      "keywords": [
        {
          "language": "und",
          "values": [
            "Imaging Science & Photographic Technology",
            "Science & Technology"
          ]
        }
      ],
      "relationships": [
        {
          "relationtype": "ispartof",
          "relationtitle": "Journal of imaging",
          "issue": "8",
          "volume": "10",
          "relationTypeWithDesc": {
            "value": "c.esploro.relation.asset.ispartof",
            "desc": "is part of"
          },
          "relationCategoryCodeWithDesc": {
            "value": "INTERNAL",
            "desc": "Internal"
          },
          "spage": "192",
          "article.number": "192",
          "identifier.eissn": "2313-433X",
          "identifier.issn": "2313-433X",
          "nlm.abbrev": "Electro Com",
          "relation.category": "INTERNAL"
        }
      ],
      "description.abstract": [
        {
          "language": "und",
          "value": "Railway track defects pose significant safety risks and can lead to accidents, economic losses, and loss of life. Traditional manual inspection methods are either time-consuming, costly, or prone to human error. This paper proposes RailTrack-DaViT, a novel vision transformer-based approach for railway track defect classification. By leveraging the Dual Attention Vision Transformer (DaViT) architecture, RailTrack-DaViT effectively captures both global and local information, enabling accurate defect detection. The model is trained and evaluated on multiple datasets including rail, fastener and fishplate, multi-faults, and ThaiRailTrack. A comprehensive analysis of the model's performance is provided including confusion matrices, training visualizations, and classification metrics. RailTrack-DaViT demonstrates superior performance compared to state-of-the-art CNN-based methods, achieving the highest accuracies: 96.9% on the rail dataset, 98.9% on the fastener and fishplate dataset, and 98.8% on the multi-faults dataset. Moreover, RailTrack-DaViT outperforms baselines on the ThaiRailTrack dataset with 99.2% accuracy, quickly adapts to unseen images, and shows better model stability during fine-tuning. This capability can significantly reduce time consumption when applying the model to novel datasets in practical applications."
        }
      ],
      "local.fields": {
        "local.note1": "",
        "local.note2": "",
        "local.note3": "",
        "local.note4": "",
        "local.note5": "",
        "local.note6": "",
        "local.note7": "",
        "local.note8": "",
        "local.note9": "",
        "local.note10": "",
        "local.note11": "",
        "local.note12": "",
        "local.note13": "",
        "local.note14": "",
        "local.note15": ""
      },
      "grants.note": "China-Laos-Thailand Education Digitization International Joint Research and Development Center of Yunnan Province",
      "asset.affiliation": [
        "Faculty of Engineering"
      ],
      "portal_visibility": "true",
      "profile_visibility": "true",
      "resourceTypeEsploroWithDesc": {
        "value": "publication.journalArticle",
        "desc": "Journal article"
      }
    }
  ]
}
```