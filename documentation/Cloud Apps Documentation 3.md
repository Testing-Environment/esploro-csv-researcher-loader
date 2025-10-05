<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# continue and resume compiling markdown from the list of URL used

Below is the **markdown content** from the final batch of successfully accessed Cloud Apps documentation and tutorial pages. This continues and completes the comprehensive compilation from your original URL list.

***

# Cloud Apps Manifest

The Cloud App manifest (`manifest.json`) describes the app’s capabilities and controls its behavior/display in Alma, including permissions, icons, supported entities, and links.


| Property | Description |
| :-- | :-- |
| title | App’s title (string or translated label). |
| subtitle | App’s subtitle (string or translated label). |
| description | App’s description (string or translated label). Include required user roles. |
| author | App author. |
| license | Link to the license. |
| relevantForInst | Limit app visibility to specified institutions (array of institution codes). |
| contentSecurity | Declares external communication requirements (see [Reaching outside your app](https://developers.exlibrisgroup.com/cloudapps/tutorials/outside/)). Supports `connectSrc`, `frameSrc`, and `sandbox`. |
| pages | Routes or external links used in app. Supports `settings`, `config`, and `help`. |
| icon | App icon (`type`: font or url, `value`: font class or URL). |
| entities | Alma entity types supported (from [EntityType list](https://github.com/ExLibrisGroup/cloudapp-sdk/blob/master/angular-lib/src/lib/public-interfaces.ts)). |
| fullscreen | Fullscreen mode support (`allow`, `open`). |
| isWidget | Indicates app runs as dashboard widget (requires SDK >= 1.4.5). |
| widgetHeightPx | Widget height in pixels (300–1000, default: 300, SDK >= 1.4.5). |

**Translated label syntax example:**

```json
{
  "title": [
    { "lang": "en", "text": "This is my title" },
    { "lang": "es", "text": "Este es mi titulo" }
  ]
}
```

**Sample manifest:** [View on Github](https://github.com/ExLibrisGroup/cloudapp-tutorials/blob/tutorials/manifest.json)

***

# Store Service

The `CloudAppStoreService` provides isolated browser-local storage (IndexedDB) for your app.

## Methods

- `get(key: string)`: Retrieve stored data for a key.
- `set(key: string, value: any)`: Store value with specified key.
- `remove(key: string)`: Remove value by key.

**Example usage:**

```typescript
// Store value
this.storeService.set('content', 'this is my content').subscribe(() => console.log('saved'));

// Get value
this.storeService.get('content').subscribe(content => this.content = content);

// Remove value
this.storeService.remove('content').subscribe(() => console.log('Removed'));
```

*Set multiple values sequentially to avoid unpredictable behavior.*

***

# Alert Service

The `AlertService` shows user alerts in your app’s UI (uses the `cloudapp-alert` component).

## Methods

- `success(message, options?)`: Show success alert.
- `info(message, options?)`: Show info message.
- `warning(message, options?)`: Show warning.
- `error(message, options?)`: Show error alert.
- `clear()`: Remove all alerts.

**Alert object options:**

- `autoClose: boolean`
- `delay: number` (ms, default 3000)
- `keepAfterRouteChange: boolean`

**Example:**

```typescript
this.alert.success('This is a success message');
this.alert.success('Persistent success', { autoClose: false });
```


***

# Other Methods

- **FormGroupUtil**:
    - `toFormGroup(obj: Object): FormGroup`
Converts a JS object to Angular Reactive FormGroup.

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

# Testing Cloud Apps

**Unit testing:**
Cloud Apps use Angular’s [testing framework](https://angular.io/guide/testing) (Jasmine/Karma).
Run tests:

```
eca test
```

Test config is included in new apps. Existing apps may need to update `devDependencies`.

**Example test setup:**

```typescript
import { TestBed, ComponentFixture, waitForAsync } from '@angular/core/testing';
import { TestingComponent } from './testing.component';

describe('TestingComponent', () => {
  let component: TestingComponent;
  let fixture: ComponentFixture<TestingComponent>;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TestingComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```


***

# Explore the Sample App

Starter Cloud Apps (using Angular) demonstrate:

- **Directory:**
    - `app/` (components, services)
    - `assets/` (images)
    - `i18n/` (translations)
- **Main features**:
    - Entities Observable: interact with the current Alma page/entities.
    - API calls: call REST APIs via RestService.
    - Page refresh: call `refreshPage` (Events Service).
    - Alert messages via AlertService.

***

# Adding Additional Routes

Create components/routes with CLI:

```
eca generate component newroute
```

Register route in `app-routing.module.ts`:

```typescript
{ path: 'newroute', component: NewrouteComponent }
```

Link in HTML:

```
[routerLink]="['newroute']"
```


***

# Reaching Outside Your App

Apps requiring outbound connections must declare needs in manifest.json (`contentSecurity` property).

**Manifest Example:**

```json
"contentSecurity": {
  "connectSrc": ["https://external.api/"],
  "sandbox": { "popups": true }
}
```

**External service call, pop-up, and authentication details** are included. Use a proxy or proper CORS support for external APIs.

***

# Selecting Multiple Entities

For lists in Alma, use checklist component to allow multi-select across pages.

- Install component:
`$ npm install eca-components --save`
- Add to module:
`import { SelectEntitiesModule } from 'eca-components';`
- Bind selected array and use `<eca-select-entities>` in HTML.

***

# Making Your App Ready for Translations

Use `ngx-translate` for multi-language support.

- String files per language: `cloudapp/src/i18n/en.json`, etc.
- Mark strings in code and run extract:

```
eca extract-labels
```

- Use translation pipe/directive in HTML:

```
{{ 'Translate.Button' | translate }}
```

- ICU/plural support via [ngx-translate-parser-plural-select](https://www.npmjs.com/package/ngx-translate-parser-plural-select).

***

# Using the Configuration Service

The Configuration Service saves institution-wide config:

- Add config route to manifest.json with:

```json
"pages": { "config": "/#/config" }
```

- Use Angular guards to control access and display static error if unauthorized.

***

# Model Binding with REST Objects

Bind REST API objects directly to Angular forms. Use `toFormGroup` to convert models for editing, then call API PUT with updated values.

***

# Using the Store Service

Store Service saves app data locally in the browser, allowing multi-session persistence and state restoration.

- Pattern:
    - Retrieve with `get`
    - Subscribe to changes (with debounce) and `set`
    - Restore on page load

***

This concludes the **full markdown compilation** for all Ex Libris Cloud Apps developer documentation and tutorials accessible from your provided URLs. Let me know if you need any specific pages rewritten, consolidated, or want more detailed formatting for any section.

