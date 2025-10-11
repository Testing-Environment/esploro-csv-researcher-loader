# Debug Logging Guide

## Overview

The application now includes a comprehensive, toggle-able logging system for debugging. The `LoggerService` provides categorized console logging with data sanitization and timestamp formatting.

## Configuration

### Location
`cloudapp/src/app/services/logger.service.ts` - Lines 3-15 (LoggerConfig constant)

### Master Toggle
```typescript
enableDebugLogging: false  // Set to true to enable all logging
```

**Default**: `false` (disabled for production safety)

### Category Toggles
When `enableDebugLogging` is `true`, you can control which categories are logged:

```typescript
{
  lifecycle: true,        // Component initialization/destruction
  navigation: true,       // Stage transitions and workflow navigation
  dataFlow: true,         // Form data processing and payload building
  apiCalls: true,         // HTTP request/response logging
  userActions: true,      // Toggle clicks and user interactions
  validation: true,       // Form validation results
  jobProcessing: true     // Set creation, job submission, polling
}
```

## How to Enable Logging

### Step 1: Enable Master Toggle
Edit `logger.service.ts` line 4:
```typescript
enableDebugLogging: true,  // Changed from false
```

### Step 2: (Optional) Disable Specific Categories
If you only want certain logs, set unwanted categories to `false`:
```typescript
categories: {
  lifecycle: false,      // Disable lifecycle logs
  navigation: true,      // Keep navigation logs
  dataFlow: true,        // Keep data flow logs
  apiCalls: true,        // Keep API logs
  userActions: false,    // Disable user action logs
  validation: true,      // Keep validation logs
  jobProcessing: true    // Keep job logs
}
```

## What Gets Logged

### 1. Lifecycle Events
**Component**: MainComponent
**When**: Component initialization and destruction
```
🔄 LIFECYCLE [14:23:45] MainComponent initialized
{
  stage: 'stage1',
  toggles: { fileTypes: true, fileName: true, description: false, supplemental: true }
}
```

### 2. Navigation Events
**Component**: MainComponent
**When**: Stage transitions (Stage 1 → Stage 2 → Stage 3)
```
🧭 NAVIGATION [14:24:10] Stage transition initiated
{
  from: 'stage1',
  to: 'stage2'
}
```

### 3. Data Flow
**Component**: MainComponent
**When**: Building file payloads from form data
```
📊 DATA FLOW [14:25:30] File payload built
{
  mmsId: '9956123456789012345',
  includedFields: ['mmsId', 'url', 'type'],
  toggles: { fileName: true, fileType: true, description: false, supplemental: false }
}
```

### 4. API Calls
**Component**: AssetService
**When**: HTTP requests to Ex Libris APIs
```
🌐 API CALL [14:26:00] POST /conf/sets
REQUEST:
{
  name: 'CloudApp-FilesLoaderSet-20240115142600',
  description: 'Automated set created by Cloud App Files Loader'
}
...
🌐 API CALL [14:26:02] POST /conf/sets
RESPONSE:
{
  setId: '12345678901234567890'
}
```

### 5. User Actions
**Component**: MainComponent
**When**: User clicks toggle chips
```
👤 USER ACTION [14:27:15] File Types toggle changed
{
  field: 'fileTypes',
  newValue: false,
  stage: 'stage1'
}
```

### 6. Validation
**Component**: MainComponent
**When**: Form validation occurs
```
✅ VALIDATION [14:28:00] Stage 1 validation passed
true

✅ VALIDATION [14:28:05] File type validation skipped
true
{
  reason: 'toggle OFF'
}
```

### 7. Job Processing
**Component**: MainComponent
**When**: Set creation, job submission, and polling
```
⚙️ JOB PROCESSING [14:29:00] Starting job automation
{
  assetCount: 5
}

⚙️ JOB PROCESSING [14:29:02] Set created
{
  setId: '12345678901234567890'
}

⚙️ JOB PROCESSING [14:29:03] Job submitted
{
  jobId: 'M50762',
  instanceId: 'abc123-def456-ghi789'
}
```

## Data Sanitization

**Security Feature**: The logger automatically redacts sensitive fields before logging:
- `password`
- `token`
- `apikey` / `api_key`
- `secret`
- `auth` / `authorization`

Example:
```typescript
const data = {
  username: 'admin',
  password: 'secret123',
  token: 'Bearer xyz...'
};

// Logged as:
{
  username: 'admin',
  password: '[REDACTED]',
  token: '[REDACTED]'
}
```

## Timestamp Format

All logs include a timestamp in `HH:MM:SS` format for easy chronological tracking:
```
🔄 LIFECYCLE [14:23:45] MainComponent initialized
🧭 NAVIGATION [14:24:10] Stage transition initiated
📊 DATA FLOW [14:25:30] File payload built
```

## Console Grouping

API calls use `console.group()` for better organization:
```
🌐 API CALL [14:26:00] POST /conf/sets
  REQUEST: {...}
  RESPONSE: {...}
```

## Error Logging

Errors are always logged (even when `enableDebugLogging` is `false`):
```
❌ ERROR [14:30:00] Job automation failed
Error: Network timeout
  at AssetService.runJob (asset.service.ts:320)
  ...
```

## Performance Considerations

### Impact When Disabled
- **Zero overhead**: No logging code executes when `enableDebugLogging` is `false`
- Safe for production builds

### Impact When Enabled
- **Minimal overhead**: Only JSON cloning and console operations
- Data sanitization adds negligible processing time
- Console I/O is the primary performance factor

### Best Practices
1. **Enable only during debugging**: Set `enableDebugLogging: false` in production
2. **Disable unnecessary categories**: If debugging a specific issue, disable unrelated categories
3. **Use browser console filters**: Filter by emoji or category name (e.g., "API CALL")

## Troubleshooting Scenarios

### Scenario 1: Files Not Being Added to Assets
**Enable**: `apiCalls`, `validation`, `dataFlow`
**Look for**: 
- Validation errors blocking submission
- Payload structure issues
- API error responses

### Scenario 2: Job Automation Failing
**Enable**: `jobProcessing`, `apiCalls`
**Look for**:
- Set creation failures
- Member addition errors
- Job submission problems

### Scenario 3: Stage Navigation Issues
**Enable**: `navigation`, `validation`
**Look for**:
- Validation blocking transitions
- Incorrect stage assignments

### Scenario 4: Toggle Behavior
**Enable**: `userActions`, `dataFlow`, `validation`
**Look for**:
- Toggle state changes
- Conditional payload building
- Validation skipping logic

## Example Debugging Session

```typescript
// 1. Enable logging in logger.service.ts
const LoggerConfig = {
  enableDebugLogging: true,  // ← Changed from false
  categories: {
    lifecycle: false,      // Don't need these
    navigation: true,      // Want to see stage transitions
    dataFlow: true,        // Want to see payload building
    apiCalls: true,        // Want to see API calls
    userActions: false,    // Don't need these
    validation: true,      // Want to see validation
    jobProcessing: true    // Want to see job flow
  }
};

// 2. Run the application
// 3. Check browser console (F12)
// 4. Look for patterns:

// ✅ Successful flow:
// 🧭 NAVIGATION → ✅ VALIDATION → 📊 DATA FLOW → 🌐 API CALL → ⚙️ JOB PROCESSING

// ❌ Failed flow:
// 🧭 NAVIGATION → ❌ ERROR (look at error details)

// 5. Disable logging when done
const LoggerConfig = {
  enableDebugLogging: false,  // ← Reset to false
  ...
};
```

## Integration Status

### ✅ Fully Integrated Components
- **MainComponent**: All lifecycle, navigation, data flow, user actions, validation, and job processing events
- **AssetService**: All API calls (addFilesToAsset, createSet, updateSetMembers, runJob, getJobInstance)

### 📝 Not Yet Integrated
- **CsvProcessorComponent**: CSV parsing and batch processing logs could be added if needed

## File Locations

| File | Purpose |
|------|---------|
| `cloudapp/src/app/services/logger.service.ts` | Logger service implementation and configuration |
| `cloudapp/src/app/main/main.component.ts` | Manual entry workflow logging |
| `cloudapp/src/app/services/asset.service.ts` | API call logging |

## Additional Notes

- The logger uses TypeScript's strict type checking for category names
- Console output is color-coded by emoji for visual scanning
- All logged data is deep-cloned to prevent mutation issues
- Error handling gracefully falls back if JSON cloning fails

---

**Last Updated**: January 2025
**Feature Version**: 1.0
**Status**: ✅ Complete and Tested
