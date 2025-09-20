export interface Author {
    researcher?: {
        primary_id: string;
    };
    author_order?: string;
    first_name?: string;
    last_name?: string;
}

export interface Identifier {
    identifier_type: {
        value: string;
        desc?: string;
    };
    value: string;
}

export interface Abstract {
    text: string;
    language?: {
        value: string;
        desc?: string;
    };
}

export interface Keyword {
    text: string;
    language?: {
        value: string;
        desc?: string;
    };
}

export interface OrganizationAffiliation {
    organization_code: string;
    start_date?: string;
    end_date?: string;
    position?: {
        value: string;
        desc?: string;
    };
    title?: string;
}

export interface Asset {
    id?: string;
    title: string;
    asset_type: {
        value: string;
        desc?: string;
    };
    organization: {
        value: string;
    };
    authors?: {
        author: Author[];
    };
    publication_date?: string;
    identifiers?: {
        identifier: Identifier[];
    };
    abstracts?: {
        abstract: Abstract[];
    };
    keywords?: {
        keyword: Keyword[];
    };
    language?: {
        value: string;
        desc?: string;
    };
    publisher?: string;
    journal?: {
        title?: string;
        volume?: string;
        issue?: string;
        pages?: string;
    };
    conference?: {
        name?: string;
        location?: string;
        date?: string;
    };
    subjects?: {
        subject: {
            value: string;
            desc?: string;
        }[];
    };
    notes?: {
        note: {
            text: string;
            type?: {
                value: string;
                desc?: string;
            };
        }[];
    };
    urls?: {
        url: {
            link: string;
            type?: {
                value: string;
                desc?: string;
            };
            description?: string;
        }[];
    };
    files?: {
        file: {
            filename: string;
            url: string;
            type?: string;
            description?: string;
        }[];
    };
    rights?: {
        access_policy?: {
            value: string;
            desc?: string;
        };
        license?: {
            value: string;
            desc?: string;
        };
        embargo_date?: string;
    };
    related_items?: {
        related_item: {
            id: string;
            type: {
                value: string;
                desc?: string;
            };
            title?: string;
        }[];
    };
    funding?: {
        grant: {
            agency?: string;
            grant_number?: string;
            title?: string;
        }[];
    };
    peer_reviewed?: boolean;
    open_access?: boolean;
    created_date?: string;
    modified_date?: string;
    created_by?: string;
    modified_by?: string;
}