<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# please generate a markdown of all the pages

Below is the compiled **markdown** content from all successfully accessed pages from your provided list. Note that several pages could not be loaded, and only the available content is included here.

***

# Cloud Apps API - Ex Libris Developer Network

## Navigation

- [New Here?](https://developers.exlibrisgroup.com/about)
- [Library Open Workflows](https://developers.exlibrisgroup.com/libraryopenworkflows/)
- [Cloud Apps](https://developers.exlibrisgroup.com/cloudapps/)
- [API Console](https://developers.exlibrisgroup.com/console)
- [Go to exlibrisgroup.com](https://www.exlibrisgroup.com/)
- [Account](https://developers.exlibrisgroup.com/account/)

***

## Cloud Apps API Documentation

- [Getting Started](https://developers.exlibrisgroup.com/cloudapps/started/)
- [Cloud Apps Documentation](https://developers.exlibrisgroup.com/cloudapps/docs/)
    - [Command Line Interface (CLI)](https://developers.exlibrisgroup.com/cloudapps/docs/cli/)
    - [Publishing Cloud Apps](https://developers.exlibrisgroup.com/cloudapps/docs/publish/)
    - [Cloud Apps Manifest](https://developers.exlibrisgroup.com/cloudapps/docs/manifest/)
    - [Cloud Apps API](https://developers.exlibrisgroup.com/cloudapps/docs/api/)
        - [Events Service](https://developers.exlibrisgroup.com/cloudapps/docs/api/events-service/)
        - [REST Service](https://developers.exlibrisgroup.com/cloudapps/docs/api/rest-service/)
        - [Settings Service](https://developers.exlibrisgroup.com/cloudapps/docs/api/settings-service/)
        - [Store Service](https://developers.exlibrisgroup.com/cloudapps/docs/api/store-service/)
        - [Configuration Service](https://developers.exlibrisgroup.com/cloudapps/docs/api/configuration-service/)
        - [Alert Service](https://developers.exlibrisgroup.com/cloudapps/docs/api/alert-service/)
        - [Other Methods](https://developers.exlibrisgroup.com/cloudapps/docs/api/other/)
    - [Cloud Apps Style Guide](https://developers.exlibrisgroup.com/cloudapps/docs/style/)
    - [Updating the Cloud App SDK](https://developers.exlibrisgroup.com/cloudapps/docs/updating/)
    - [Testing Cloud Apps](https://developers.exlibrisgroup.com/cloudapps/docs/testing/)
- [Tutorials](https://developers.exlibrisgroup.com/cloudapps/tutorials/)
    - [Explore the Sample App](https://developers.exlibrisgroup.com/cloudapps/tutorials/scaffolding/)
    - [Adding Additional Routes](https://developers.exlibrisgroup.com/cloudapps/tutorials/routes/)
    - [Using Material Components \& Theming](https://developers.exlibrisgroup.com/cloudapps/tutorials/theming/)
    - [Using the Settings Service](https://developers.exlibrisgroup.com/cloudapps/tutorials/settings/)
    - [Customizing Your Cloud App in the App List](https://developers.exlibrisgroup.com/cloudapps/tutorials/app-list/)
    - [Making Parallel API Requests](https://developers.exlibrisgroup.com/cloudapps/tutorials/parallel-requests/)
    - [Reaching Outside Your App](https://developers.exlibrisgroup.com/cloudapps/tutorials/outside/)
    - [Working with Bibliographic Records in XML](https://developers.exlibrisgroup.com/cloudapps/tutorials/xml/)
    - [Using the Store Service](https://developers.exlibrisgroup.com/cloudapps/tutorials/store/)
    - [Model Binding with REST Objects](https://developers.exlibrisgroup.com/cloudapps/tutorials/binding/)
    - [Using the Configuration Service](https://developers.exlibrisgroup.com/cloudapps/tutorials/configuration/)
    - [Making Your App Ready for Translations](https://developers.exlibrisgroup.com/cloudapps/tutorials/translate/)
    - [Selecting Multiple Entities](https://developers.exlibrisgroup.com/cloudapps/tutorials/multiple-entities/)
    - [Following the Style Guide](https://developers.exlibrisgroup.com/cloudapps/tutorials/style/)
    - [Cloud Apps as Alma Dashboard Widgets](https://developers.exlibrisgroup.com/cloudapps/tutorials/cloud-apps-as-widgets/)

***

## Cloud Apps API: Services Overview

The Cloud App API consists of several core services:

- [Events Service](https://developers.exlibrisgroup.com/cloudapps/docs/api/events-service/)
- [REST Service](https://developers.exlibrisgroup.com/cloudapps/docs/api/rest-service/)
- [Settings Service](https://developers.exlibrisgroup.com/cloudapps/docs/api/settings-service/)
- [Store Service](https://developers.exlibrisgroup.com/cloudapps/docs/api/store-service/)
- [Configuration Service](https://developers.exlibrisgroup.com/cloudapps/docs/api/configuration-service/)
- [Alert Service](https://developers.exlibrisgroup.com/cloudapps/docs/api/alert-service/)
- [Other Methods](https://developers.exlibrisgroup.com/cloudapps/docs/api/other/)

***

# Getting Started

Cloud Apps are applications which run inside of the Ex Libris platform. Common use cases for Cloud Apps might include integrating with external systems or data sources, workflow shortcuts or productivity enhancements, and adding brand new functionality not currently supported by the product. Cloud Apps may also be run as widgets on Alma’s dashboard.

This guide is for **developers** who are interested in building Cloud Apps. **End-users** and **administrators** who would like to use Cloud Apps in their institution should refer to the online help and the list of available Cloud Apps.

Cloud Apps are written in Angular (currently version 18) using HTML and TypeScript. They can take advantage of the Cloud Apps API which provides interaction with Alma including access to all of the REST APIs. The Cloud Apps CLI provides a local environment in which you can develop your app. Once your app is developed, you can deploy it so that it can be discovered and used by others.

### Pre-requisites

- Node JS 18.19.1 or higher (specifically: ^18.19.1 || ^20.11.1 || ^22.0.0) is required to install the CLI.
- Visual Studio Code is recommended, although any text editor will do
- Git or Github Desktop
- Ensure Cloud Apps are enabled for your institution in the relevant environment (sandbox or production)


### Install the CLI

```bash
npm install -g @exlibris/exl-cloudapp-cli
```


### Create a new application

Create a new directory, initialize, and start the Cloud App:

```bash
mkdir my-first-cloudapp
cd my-first-cloudapp
eca init
eca start
```

And follow the prompts according to your institution's Alma environment.

### Starting with an Existing Application

Clone the repository and enter the directory:

```bash
git clone https://github.com/{REPOSITORY_NAME}
cd alma-csv-user-load
eca init
```

Add the configuration for your environment as prompted and start the app with `eca start`.

### Contributing to an Existing Application

1. Clone the repository locally
2. Make your changes to the app
3. Fork the repository and commit your changes
4. Create a pull request for the owner of the original repository

### Frequently Asked Questions

- Support is available via the Cloud Apps forum.
- Apps can be institution-restricted by configuration.
- All Cloud Apps submitted for publishing undergo manual review.
- Intellectual property remains with developers, governed by the Developer Network Terms of Use.
- Ex Libris maintains backward compatibility for the Cloud App framework.
- Technology updates for the SDK are scheduled twice a year.
- Apps can be developed for Alma, Primo VE, Esploro, Leganto, and other Ex Libris cloud solutions.

***

# Command Line Interface (CLI)

The Cloud App CLI is the tool used to create, develop, and build Cloud Apps.

Once installed, type:

```bash
eca
```

in your terminal to see available commands.
Each command can be run as:

```bash
eca <command name>
```

Available commands:

- **init**: Initialize a new or existing app
- **start**: Launch local dev server. Flags: `--no-install`, `--no-open-browser`, `--browser`
- **build**: Build Cloud App for deployment
- **generate**: Generate code (wraps `ng generate`)
- **extract-labels**: Extract translation strings using ngx-translate-extract
- **version**: Show CLI version
- **test**: Start test runner

***

# Events Service

The `CloudAppEventsService` provides hooks for your app to interact with Alma.

## Methods

- **onPageLoad**: Subscribe to page load events
- **getPageMetaData**: Retrieve metadata about the open page
- **refreshPage**: Refresh the current page in Alma
- **getInitData**: Get initializing info from Alma
- **getAuthToken**: Retrieve an auth token for external systems (JWT, 4-hour validity)
- **home**: Navigate to Alma home
- **back**: Navigate back to Alma home page
- **entities\$**: Observable of entities on the current Alma page


## Examples

Import and implement in your Angular component.

```typescript
import { CloudAppEventsService } from '@exlibris/exl-cloudapp-angular-lib';

export class MainComponent implements OnInit {
  constructor(private eventsService: CloudAppEventsService) {}
  ngOnInit() {
    this.eventsService.onPageLoad(pageInfo => {
      console.log("Retrieved onPageLoad event", pageInfo.entities);
    });
  }
}
```


***

# Customizing Your Cloud App in the App List

You can customize how your Cloud App appears via the `manifest.json` file:

- **Title, subtitle, and description**: Support internationalization.
- **Icon**: Choose a font-based icon from FontAwesome or an image.
    - Font:

```json
"icon": { "type": "font", "value": "fa fa-graduation-cap" }
```

    - Image:

```json
"icon": { "type": "url", "value": "/assets/touchnet-logo.png" }
```

- **License**: Link your app’s license terms.

(Changes to the manifest are applied only when the app is restarted.)

***

# Working with Bibliographic Records in XML

Bibliographic records (e.g., MARCXML, DC XML) can be manipulated using the CloudApp API.

- Listen for navigation to BIB records via `onPageLoad`.
- Retrieve, modify, and update records using the API and XML utilities.
- Use `refreshPage` after updating a record.

**Tip:** Specify `Accept` and `Content-Type` headers as `application/xml` in your requests.

***

*Note: Some requested pages could not be retrieved or contained no notable content; only successfully retrieved and parseable content is listed above.*
<span style="display:none">[^1]</span>

<div align="center">⁂</div>

[^1]: https://developers.exlibrisgroup.com/cloudapps/docs/api/

