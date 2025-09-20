enum EsploroFieldGroupEnum {
	General = "FieldGroups.General",
	Authors = "FieldGroups.Authors",
	Identifiers = "FieldGroups.Identifiers",
	Publication = "FieldGroups.Publication",
	Content = "FieldGroups.Content",
	Rights = "FieldGroups.Rights",
	URLs = "FieldGroups.URLs",
	Funding = "FieldGroups.Funding",
}

interface EsploroField {
	name: string;
	key: string;
	label: string;
}

interface EsploroFieldGroup {
  name: EsploroFieldGroupEnum;
  fields: EsploroField[];
}

export class EsploroFields {
	private static _instance: EsploroFields;
	private _fieldgroups: EsploroFieldGroup[] = [
		{
      name: EsploroFieldGroupEnum.General, fields: [
				{ name: 'assetId', key: 'id', label: 'FieldNames.AssetId' },
				{ name: 'title', key: 'title', label: 'FieldNames.Title' },
				{ name: 'assetType', key: 'asset_type.value', label: 'FieldNames.AssetType' },
				{ name: 'organization', key: 'organization.value', label: 'FieldNames.Organization' },
				{ name: 'publicationDate', key: 'publication_date', label: 'FieldNames.PublicationDate' },
				{ name: 'language', key: 'language.value', label: 'FieldNames.Language' },
				{ name: 'publisher', key: 'publisher', label: 'FieldNames.Publisher' },
				{ name: 'peerReviewed', key: 'peer_reviewed', label: 'FieldNames.PeerReviewed' },
				{ name: 'openAccess', key: 'open_access', label: 'FieldNames.OpenAccess' },
				{ name: 'keywords', key: 'keywords.keyword[].text', label: 'FieldNames.Keywords' },
			]
		},
		{
			name: EsploroFieldGroupEnum.Authors, fields: [
				{ name: 'author.researcherId', key: 'authors.author[].researcher.primary_id', label: 'FieldNames.ResearcherId' },
        { name: 'author.order', key: 'authors.author[].author_order', label: 'FieldNames.AuthorOrder' },
				{ name: 'author.firstName', key: 'authors.author[].first_name', label: 'FieldNames.FirstName' },
        { name: 'author.lastName', key: 'authors.author[].last_name', label: 'FieldNames.LastName' },
			]
		},
		{
      name: EsploroFieldGroupEnum.Identifiers, fields: [
        { name: 'identifier.type', key: 'identifiers.identifier[].identifier_type.value', label: 'FieldNames.IdentifierType' },
        { name: 'identifier.value', key: 'identifiers.identifier[].value', label: 'FieldNames.IdentifierValue' },
      ]
    },
		{
      name: EsploroFieldGroupEnum.Publication, fields: [
        { name: 'journal.title', key: 'journal.title', label: 'FieldNames.JournalTitle' },
        { name: 'journal.volume', key: 'journal.volume', label: 'FieldNames.Volume' },
        { name: 'journal.issue', key: 'journal.issue', label: 'FieldNames.Issue' },
        { name: 'journal.pages', key: 'journal.pages', label: 'FieldNames.Pages' },
        { name: 'conference.name', key: 'conference.name', label: 'FieldNames.ConferenceName' },
        { name: 'conference.location', key: 'conference.location', label: 'FieldNames.ConferenceLocation' },
        { name: 'conference.date', key: 'conference.date', label: 'FieldNames.ConferenceDate' },
      ]
    },
		{
      name: EsploroFieldGroupEnum.Content, fields: [
        { name: 'abstract.text', key: 'abstracts.abstract[].text', label: 'FieldNames.AbstractText' },
        { name: 'abstract.language', key: 'abstracts.abstract[].language.value', label: 'FieldNames.AbstractLanguage' },
        { name: 'subject.value', key: 'subjects.subject[].value', label: 'FieldNames.SubjectValue' },
        { name: 'note.text', key: 'notes.note[].text', label: 'FieldNames.NoteText' },
        { name: 'note.type', key: 'notes.note[].type.value', label: 'FieldNames.NoteType' },
      ]
    },
		{
      name: EsploroFieldGroupEnum.Rights, fields: [
        { name: 'rights.accessPolicy', key: 'rights.access_policy.value', label: 'FieldNames.AccessPolicy' },
        { name: 'rights.license', key: 'rights.license.value', label: 'FieldNames.License' },
        { name: 'rights.embargoDate', key: 'rights.embargo_date', label: 'FieldNames.EmbargoDate' },
      ]
    },
		{
      name: EsploroFieldGroupEnum.URLs, fields: [
        { name: 'url.link', key: 'urls.url[].link', label: 'FieldNames.URLLink' },
        { name: 'url.type', key: 'urls.url[].type.value', label: 'FieldNames.URLType' },
        { name: 'url.description', key: 'urls.url[].description', label: 'FieldNames.URLDescription' },
      ]
    },
    {
      name: EsploroFieldGroupEnum.Funding, fields: [
        { name: 'funding.agency', key: 'funding.grant[].agency', label: 'FieldNames.FundingAgency' },
        { name: 'funding.grantNumber', key: 'funding.grant[].grant_number', label: 'FieldNames.GrantNumber' },
        { name: 'funding.title', key: 'funding.grant[].title', label: 'FieldNames.FundingTitle' },
      ]
    },
	];

	private constructor(
	) {	}

	public static getInstance(): EsploroFields {
		if (!EsploroFields._instance) {
			EsploroFields._instance = new EsploroFields();
		}
		return EsploroFields._instance;
	}

	public getEsploroFieldGroups(): EsploroFieldGroup[] {
		return this._fieldgroups;
	}

	public getFieldGroupNameByFieldName(fieldName: string): string {
		if(fieldName) {
      for (const group of this._fieldgroups) {
        for (const field of group.fields) {
          if (field.name === fieldName) {
            return group.name;
          }
        }
      }
    }
		return fieldName;
	}

	public getFieldGroupNameByFieldKey(fieldKey: string): string {
		if(fieldKey) {
			for (const group of this._fieldgroups) {
				for (const field of group.fields) {
					if (field.key === fieldKey) {
						return group.name;
					}
				}
			}
		}
		return fieldKey;
	}

	public getLabelKeyByFieldKey(fieldKey: string): string {
		if(fieldKey) {
			for (const group of this._fieldgroups) {
				for (const field of group.fields) {
					if (field.key === fieldKey) {
						return field.label;
					}
				}
			}
		}
		return fieldKey;
	}
}