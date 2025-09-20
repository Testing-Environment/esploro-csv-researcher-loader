Developer Guide: Building an Ex Libris Cloud App with Esploro Researchers API IntegrationThis guide provides a comprehensive overview for developers on how to build an Ex Libris Cloud App that effectively integrates with the Esploro Researchers REST API. It covers everything from initial setup and core architectural concepts to detailed implementation of API interactions and UI best practices, all based on the official Ex Libris Cloud App documentation.1. Cloud App Development FundamentalsGetting started with Cloud App development involves understanding the foundational tools and concepts that streamline the creation and deployment process.Getting Started and CLI ToolingThe journey begins with setting up your development environment using the Ex Libris Cloud App CLI. This tool is essential for scaffolding, developing, and deploying your application.Installation: Install the CLI globally via npm:npm install -g @exlibris/exl-cloudapp-cli
Scaffolding a New App: Create a new project structure with a single command:exl-cloudapp new my-esploro-app
This command generates a boilerplate Angular application with all the necessary files and configurations.Local Development: Serve your app locally to see changes in real-time:cd my-esploro-app
exl-cloudapp serve
This command starts a local development server and proxies API requests to the Ex Libris platform, handling authentication automatically.(Reference: Getting Started, Command Line Interface (CLI))The Cloud App ManifestThe manifest.json file, located in your project's root directory, is the heart of your Cloud App's configuration. It defines critical metadata that the Ex Libris platform uses to display and manage your app.Key properties include:name, description: Identifies your app in the App List.app_id: A unique identifier for your application.api_key_required: Set to true to enable authenticated REST calls.pages: Defines the routes and components for different sections of your app.(Reference: Cloud Apps Manifest)The Publishing ProcessOnce development and testing are complete, you can deploy your app to the Ex Libris platform.Build: Create a production-ready build of your app.exl-cloudapp build
Deploy: Upload the contents of the dist folder to your web server.Publish: In the Developer Network, create a new app and provide the URL to your deployed manifest.json. The platform will then validate and make your app available to institutions.(Reference: Publishing Cloud Apps)2. Cloud App Architecture and LifecycleCloud Apps are single-page applications (typically Angular) that run within an iframe in Ex Libris products. They leverage a suite of services provided by the Cloud App API to interact with the platform.The Cloud Apps APIThe @exlibris/exl-cloudapp-angular-lib library is the bridge between your app and the host environment. It provides services for making API calls, handling events, managing settings, and more.Core ServicesRestService: The primary tool for making authenticated calls to Ex Libris REST APIs. It automatically injects the necessary API key for the institution.EventsService: Allows your app to react to events occurring within the Ex Libris platform, such as a change in the entity being viewed by the user.AlertService: Provides a simple way to display themed notifications (success, error, info) to the user.Best PracticesStyle: Adhere to the Cloud Apps Style Guide to ensure your app has a consistent look and feel with the host product. Use the provided CSS variables and Material components.Testing: Thoroughly test your app's functionality, especially API interactions and error handling. The CLI facilitates testing by allowing you to serve the app against a live environment.(Reference: Cloud Apps API, Testing Cloud Apps)3. Implementing Esploro Researchers API IntegrationsThe RestService simplifies interactions with the Esploro Researchers API endpoints. Authentication is handled automatically by the Cloud App context.Example: Managing Researcher ProfilesHere are functional examples of how to implement CRUD (Create, Read, Update, Delete) operations for Esploro researchers.GET: Searching for and Retrieving ResearchersThis example shows how to fetch a list of researchers based on a search query.// researcher.service.ts
import { Injectable } from '@angular/core';
import { CloudAppRestService, Request } from '@exlibris/exl-cloudapp-angular-lib';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResearcherService {
  constructor(private restService: CloudAppRestService) { }

  findResearchers(query: string): Observable<any> {
    const request: Request = {
      url: `/almaws/v1/esploro/researchers`,
      queryParams: { q: `name~${query}` }
    };
    return this.restService.call(request);
  }
}
POST: Creating a New ResearcherThis snippet demonstrates how to create a new researcher profile by sending a JSON payload.// researcher.service.ts
createResearcher(researcherData: any): Observable<any> {
  const request: Request = {
    url: '/almaws/v1/esploro/researchers',
    method: 'POST',
    requestBody: researcherData
  };
  return this.restService.call(request);
}
PUT: Updating a Researcher's ProfileTo update a researcher, you need their primary ID and the updated data payload.// researcher.service.ts
updateResearcher(researcherId: string, researcherData: any): Observable<any> {
  const request: Request = {
    url: `/almaws/v1/esploro/researchers/${researcherId}`,
    method: 'PUT',
    requestBody: researcherData
  };
  return this.restService.call(request);
}
DELETE: Removing a ResearcherDeleting a researcher is a straightforward call using their ID.// researcher.service.ts
deleteResearcher(researcherId: string): Observable<any> {
  const request: Request = {
    url: `/almaws/v1/esploro/researchers/${researcherId}`,
    method: 'DELETE'
  };
  return this.restService.call(request);
}
(Reference: REST Service)4. Configuration, Settings, and Storage StrategiesCloud Apps offer several services for managing data and configuration, each serving a different purpose.Configuration Service: Used for storing institution-wide settings that are configured by an administrator. This is ideal for settings that don't change often, such as default search parameters or integration endpoints.Settings Service: Perfect for user-specific preferences, such as a default language or UI theme. These settings are tied to the logged-in user.Store Service: Provides a simple key-value store for session-based data. Use it for temporary storage of data that doesn't need to persist between sessions, like cached API responses.Example: Using the Settings ServiceThis example saves a user's preferred search filter.// main.component.ts
import { CloudAppSettingsService } from '@exlibris/exl-cloudapp-angular-lib';

export class MainComponent {
  constructor(private settingsService: CloudAppSettingsService) {}

  saveUserPreference(filter: string) {
    this.settingsService.set({ preferredFilter: filter }).subscribe(() => {
      console.log('Settings saved!');
    });
  }

  loadUserPreference() {
    this.settingsService.get().subscribe(settings => {
      const preferredFilter = settings.preferredFilter || 'default_value';
      // Use the filter
    });
  }
}
Making Parallel API RequestsFor efficiency, you can execute multiple API calls concurrently using forkJoin from RxJS. This is useful when you need to fetch a researcher's profile and their assets simultaneously.// researcher.component.ts
import { forkJoin } from 'rxjs';

//...
const researcherDetails$ = this.restService.call(`/almaws/v1/esploro/researchers/${id}`);
const researcherAssets$ = this.restService.call(`/almaws/v1/esploro/researchers/${id}/assets`);

forkJoin([researcherDetails$, researcherAssets$]).subscribe(([details, assets]) => {
  this.researcher = details;
  this.assets = assets.research_asset;
});
(Reference: Settings Service, Store Service, Configuration Service, Parallel API Requests Tutorial)5. Mapping API Calls to an Interactive UIA successful Cloud App provides an intuitive user interface that maps directly to the underlying API functionality.UI Feature ExamplesSearch Researchers: Implement an input field that triggers the findResearchers service call on user input. Display the results in a list or table.Edit Profile: Create a form that is pre-filled with data from a GET request. On submission, use the form data to make a PUT request to update the researcher's profile.Manage ORCID Token: A button labeled "Update ORCID Token" can trigger a specific service method that performs the necessary API call to the Esploro endpoints for managing ORCID details.Use Angular's data binding to connect your component logic with the HTML template.<!-- main.component.html -->
<input type="text" [(ngModel)]="searchQuery" (keyup.enter)="search()">
<button (click)="search()">Search</button>

<div *ngIf="results">
  <ul>
    <li *ngFor="let researcher of results.researcher">
      {{ researcher.first_name }} {{ researcher.last_name }}
    </li>
  </ul>
</div>
Follow the platform theming conventions by using Material components and the eca- prefixed CSS classes to ensure your app looks native to the Ex Libris environment.6. Advanced Features and Best PracticesRobust Error HandlingAlways handle potential API errors gracefully. Use the catchError operator from RxJS and the AlertService to inform the user.// researcher.service.ts
this.restService.call(request).pipe(
  catchError(error => {
    this.alertService.error(`An error occurred: ${error.message}`);
    return throwError(error);
  })
);
LocalizationPrepare your app for internationalization by using the TranslateModule provided by the library. Store your string labels in language-specific JSON files.(Reference: Making Your App Ready for Translations)Dashboard Widgets and App ListYou can configure your Cloud App to appear as a widget on the Alma dashboard or customize its appearance in the App List for better visibility and access.(Reference: Cloud Apps as Alma Dashboard Widgets, Customizing Your Cloud App in the App List)