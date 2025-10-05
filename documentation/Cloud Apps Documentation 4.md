<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# continue and resume compiling markdown from the list of URL under Cloud Apps API: Services Overview

Here is the **markdown compilation** for the Cloud Apps API: Services Overview, covering each service and method as documented.

***

# Events Service

The `CloudAppEventsService` provides hooks for your app to interact with Alma. Key methods include:

- **onPageLoad:** Emits when a new Alma page loads; subscribe and unsubscribe with Angular.
- **getPageMetaData:** Returns metadata about the open page.
- **refreshPage:** Refreshes the current Alma page.
- **getInitData:** Retrieves initial data provided when a Cloud App launches (e.g. user info, session data).
- **getAuthToken:** Returns a JWT token to authenticate with external systems.
- **home:** Redirects the user to Alma’s homepage.
- **back:** Navigates back one page in Alma.
- **entities\$:** Observable of entities visible on the current Alma page.

**Example:**

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

Page info provides available entities, user data, and more.

***

# REST Service

The `CloudAppRestService` enables calling Alma REST APIs as the logged-in user.

- **call(request):** Accepts a string or `Request` object and returns an Observable; supports GET, POST, PUT, DELETE with full configuration.
- **Governance:** API calls are limited (10 at once) but do not count against institutional governance thresholds.

**Example:**

```typescript
restService.call('/users').subscribe(users => console.log('users', users));
```

For POST:

```typescript
let request = {
  url: '/users',
  method: HttpMethod.POST,
  requestBody: user
};
restService.call(request).subscribe(user => console.log('User created', user));
```


***

# Settings Service

The `CloudAppSettingsService` provides storage for user-specific settings in Alma.

- **get():** Retrieve current user/app settings.
- **set(value):** Save settings.
- **remove():** Remove user/app settings.
- **getAsFormGroup():** Retrieve as Angular FormGroup for reactive forms.

**Example:**

```typescript
settingsService.get().subscribe(settings => this.settings = settings);
settingsService.set(this.form.value).subscribe(response => console.log('Saved'));
```


***

# Store Service

The `CloudAppStoreService` stores and retrieves data in browser local storage (IndexedDB).

- **get(key):** Retrieve value by key.
- **set(key, value):** Save value by key.
- **remove(key):** Remove value by key.

**Example:**

```typescript
storeService.set('content', 'sample data').subscribe(() => console.log('saved'));
storeService.get('content').subscribe(value => this.content = value);
```


***

# Configuration Service

The `CloudAppConfigService` stores institution-wide configuration data accessible to all users.

- **get():** Retrieve config.
- **set(value):** Save config (admin only).
- **remove():** Remove config.
- **getAsFormGroup():** Retrieve as Angular FormGroup.

**Example:**

```typescript
configService.get().subscribe(config => this.config = config);
configService.set(this.form.value).subscribe(response => console.log('Saved'));
```


***

# Alert Service

`AlertService` provides UI alerts: success, info, warning, error.

- **success(message, options?)**
- **info(message, options?)**
- **warning(message, options?)**
- **error(message, options?)**
- **clear()**: Remove all alerts

**Example:**

```typescript
alert.success('Success!');
alert.error('Something went wrong', { autoClose: false });
```

Options include autoClose, keepAfterRouteChange, delay.

***

# Other Methods

`FormGroupUtil` for creating Angular Reactive Forms from JS objects.

- **toFormGroup(obj):** Returns Angular `FormGroup` from an object.

**Example:**

```typescript
import { FormGroupUtil } from '@exlibris/exl-cloudapp-angular-lib';
import { merge } from 'lodash';

class Configuration {
  restProxyUrl = "";
  existingLicense = false;
}

const configurationFormGroup = (config: Configuration) =>
  FormGroupUtil.toFormGroup(merge(new Configuration(), config));
```


***

This completes the **Cloud Apps API Services Overview** in markdown format, listing features, method signatures, example code, and summary usage for Ex Libris developers. Let me know if you need further breakdown or a combination of API features.

