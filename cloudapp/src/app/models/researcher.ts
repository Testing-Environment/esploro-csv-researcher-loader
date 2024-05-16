interface OrganizationAffiliation {
    organization_code: string;
    start_date?: string;
    end_date?: string;
    position?: {
        value: string;
        desc?: string;
    };
    title?: string;
    positionOrder?: number;
}

export interface Researcher {
    is_researcher?: boolean;
    primary_id: string;
    researcher?: {
        auto_capture?: boolean;
        default_publication_language?: {
            value: string;
            desc?: string;
        };
        display_title?: string;
        portal_profile?: {
            value: string;
            desc?: string;
        };
        researcher_first_name?: string;
        researcher_middle_name?: string;
        researcher_last_name: string;
        researcher_suffix?: string;
        researcher_title?: {
            value: string;
            desc?: string;
        };
        research_center?: boolean;
        position?: {
            value: string;
            desc?: string;
        };
        researcher_alternate_email?: {
            email_address: string;
        }[];
        researcher_association?: {
            value: string;
        }[];
        researcher_description?: {
            description: string;
        }[];
        researcher_education?: {
            organization_code: string;
            degree?: string;
            field_of_study?: string;
            from_year?: string;
            to_year?: string;
            additional_details?: string;
        }[];
        researcher_engagement_type?: {
            researcher_engagement: {
                value: string;
                desc?: string;
            }
            engagement_end_date?: string;
        }[];
        researcher_honor?: {
            organization_code: string;
            title?: string;
            time_period?: string;
        }[];
        researcher_keyword?: {
            value: string;
        }[];
        researcher_language?: {
            value: string;
        }[];
        researcher_name_variant?: {
            first_name?: string;
            middle_name?: string;
            last_name: string;
            name_suffix?: string;
        }[];
        researcher_research_topic?: {
            value: string;
        }[];
        researcher_webpage?: {
            url: string;
            type: string;
            title?: string;
        }[];
        researcher_organization_affiliation?: OrganizationAffiliation[];
        researcher_previous_organization_affiliation?: OrganizationAffiliation[];
        researcher_external_organization_affiliation?: OrganizationAffiliation[];
        researcher_previous_external_organization_affiliation?: OrganizationAffiliation[];
        user_identifier?: {
            value: string;
            id_type: {
                value: string;
                desc?: string;
            }
        }[];
    };
}
