# Migration Guide: From Legacy CSV Loader to Enhanced Asset File Processor

## Overview

This guide helps existing users of the Esploro CSV Asset Loader transition to the new enhanced version with CSV bulk file processing capabilities.

## What's New?

### ✨ New Features

1. **Dual Processing Modes**
   - **Manual Entry Tab**: Your familiar workflow (unchanged)
   - **CSV Upload Tab**: New bulk processing feature

2. **Intelligent Column Mapping**
   - Auto-detection of field types
   - Confidence scoring for suggestions
   - Manual override capability

3. **Enhanced Workflow Integration**
   - Downloadable MMS ID files
   - Step-by-step Esploro job instructions
   - Direct links to relevant Esploro pages

4. **Better User Experience**
   - Drag-and-drop file upload
   - Real-time validation
   - Progress tracking
   - Detailed results display

### 🔄 What Stayed the Same

- **Manual Entry Workflow**: 100% compatible
- **File Type Configuration**: Same source
- **API Integration**: Same endpoints
- **Settings Page**: Unchanged
- **User Permissions**: Same requirements

## Migration Steps

### Step 1: Update Your Deployment

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Build and deploy
npm run build
```

### Step 2: Update Documentation References

Replace old documentation links with:
- **Implementation Guide**: `documentation/CSV_ENHANCEMENT_IMPLEMENTATION.md`
- **Quick Start**: `documentation/CSV_ENHANCEMENT_README.md`
- **Summary**: `documentation/IMPLEMENTATION_SUMMARY.md`

### Step 3: Train Users

#### For Existing Manual Entry Users
**No changes needed!** Your workflow remains exactly the same:
1. Select "Manual Entry" tab (now explicit)
2. Continue as before

#### For New CSV Bulk Processing Users
1. Review Quick Start Guide
2. Download sample template
3. Practice with test CSV (10-20 rows)
4. Scale to production volumes

### Step 4: Update Internal Procedures

#### Old Workflow
```
1. Manually enter each asset file
2. Submit one at a time
3. Repeat for each asset
```

#### New CSV Workflow Option
```
1. Prepare CSV with all assets
2. Upload CSV file
3. Map columns (auto-detected)
4. Process all at once
5. Download MMS IDs
6. Run Esploro import job
```

## Feature Comparison

| Feature | Old Version | New Version |
|---------|------------|-------------|
| Manual Entry | ✅ Supported | ✅ Supported (unchanged) |
| CSV Bulk Upload | ❌ Not available | ✅ New feature |
| Column Mapping | ❌ N/A | ✅ Intelligent auto-detection |
| Progress Tracking | ⚠️ Basic | ✅ Enhanced with details |
| Results Export | ❌ None | ✅ MMS ID CSV download |
| Workflow Instructions | ⚠️ External docs | ✅ Built-in step-by-step |
| Error Handling | ⚠️ Basic | ✅ Detailed with recovery |
| Tab Navigation | ❌ Single view | ✅ Dual tabs |

## CSV File Format Changes

### Before (Not Supported)
The original app didn't support CSV upload for file processing.

### After (New Feature)
Now supports CSV with these columns:

**Required:**
- MMS ID

**Optional:**
- Remote URL
- File Title  
- File Description
- File Type

**Example:**
```csv
MMS ID,Remote URL,File Title,Description,Type
123,https://example.com/file.pdf,Paper,Main doc,PDF
```

## Breaking Changes

### ⚠️ None!

This is a **backward-compatible** enhancement. All existing functionality remains intact:
- ✅ Manual entry workflow unchanged
- ✅ API calls identical
- ✅ Settings page unchanged
- ✅ Manifest compatible
- ✅ Permissions same

### What You Might Notice

1. **New Main Page Layout**: Now has tabs instead of single view
2. **Updated Title**: "Enhanced Asset File Processor"
3. **New Tab Options**: Manual Entry + CSV Upload
4. **Translation Updates**: New text strings for CSV features

## Common Migration Questions

### Q: Do I need to retrain all users?
**A**: No. Existing manual entry users can continue exactly as before. Only introduce CSV upload to users who need bulk processing.

### Q: Will my existing bookmarks work?
**A**: Yes. The main page route remains the same (`/#/main`).

### Q: Do I need to reconfigure anything?
**A**: No. All configuration (file types, API endpoints) remains the same.

### Q: Can I disable the CSV upload feature?
**A**: While there's no built-in toggle, users can simply ignore the CSV Upload tab and use Manual Entry exclusively.

### Q: What happens to old data?
**A**: Nothing. This enhancement doesn't affect existing data or previous submissions.

## Rollback Plan

If issues arise, you can rollback:

### Option 1: Git Revert
```bash
git revert <commit-hash>
npm install
npm run build
```

### Option 2: Previous Build
```bash
git checkout <previous-tag>
npm install
npm run build
```

### Option 3: Feature Flag (Future)
Consider implementing a feature flag to toggle CSV upload:
```typescript
// In component
showCSVTab = environment.enableCSVUpload;
```

## Testing Your Migration

### Smoke Test Checklist

- [ ] Manual entry tab visible
- [ ] CSV upload tab visible
- [ ] Can add single file via manual entry
- [ ] Can upload CSV file
- [ ] Column mapping auto-detection works
- [ ] Can process CSV batch
- [ ] Can download MMS ID file
- [ ] Results display correctly
- [ ] Translations load properly
- [ ] No console errors

### Test Scenarios

#### Scenario 1: Manual Entry (Regression Test)
1. Select "Manual Entry" tab
2. Enter asset ID: `[test-mms-id]`
3. Add file details
4. Submit
5. **Expected**: Works exactly as before

#### Scenario 2: CSV Upload (New Feature)
1. Select "CSV Upload" tab
2. Upload sample CSV (5 rows)
3. Review column mappings
4. Process data
5. Download MMS IDs
6. **Expected**: Successful processing

#### Scenario 3: Error Handling
1. Upload invalid CSV (wrong format)
2. **Expected**: Clear error message

## Support During Migration

### Resources

- **Quick Start Guide**: For new CSV users
- **Implementation Guide**: For technical details
- **Sample CSV**: Template file in `/documentation/example-csv/`
- **Translation Keys**: See `i18n/en.json`

### Getting Help

1. **Check Documentation**: Most questions answered in guides
2. **Review Examples**: Use provided sample CSV
3. **Test in Staging**: Try features before production
4. **Contact Support**: Use normal Ex Libris channels

## Post-Migration Checklist

- [ ] All users notified of new features
- [ ] Training materials updated
- [ ] Sample CSV template shared
- [ ] Workflow procedures documented
- [ ] Feedback mechanism established
- [ ] Monitor initial usage
- [ ] Collect user feedback
- [ ] Plan iterative improvements

## Timeline Recommendation

### Week 1: Preparation
- Deploy to staging environment
- Test all features
- Update documentation
- Prepare training materials

### Week 2: Soft Launch
- Deploy to production
- Announce to power users
- Gather initial feedback
- Monitor for issues

### Week 3: Full Rollout
- Announce to all users
- Conduct training sessions
- Update help desk procedures
- Collect usage metrics

### Week 4: Review
- Analyze feedback
- Address any issues
- Plan enhancements
- Document lessons learned

## Success Metrics

Track these to measure migration success:

### Usage Metrics
- Number of manual entries vs. CSV uploads
- Average CSV file size (rows)
- Success rate of CSV processing
- Time saved per operation

### User Satisfaction
- Number of support tickets
- User feedback scores
- Feature adoption rate
- Training completion rate

### Technical Metrics
- Error rate
- Processing time
- API call volume
- System performance

## Troubleshooting Common Migration Issues

### Issue: Users Can't Find CSV Upload
**Solution**: Point to "CSV Upload" tab at top of page

### Issue: CSV Upload Not Working
**Check**:
- File extension is `.csv`
- File size under 10MB
- CSV has header row
- Data rows exist

### Issue: Column Mapping Confusion
**Solution**: 
- Show sample CSV template
- Explain auto-detection
- Demonstrate manual override

### Issue: Old Bookmarks Not Working
**Fix**: Update bookmarks to `/#/main` if needed

### Issue: Missing Translations
**Solution**: Ensure `i18n/en.json` deployed correctly

## Future Migration Considerations

When planning future updates:
1. **Test Compatibility**: Always test against existing workflows
2. **Communication Plan**: Notify users well in advance
3. **Training Materials**: Update before deployment
4. **Rollback Plan**: Have tested rollback procedure
5. **Monitoring**: Watch metrics closely post-deployment

## Conclusion

This migration is designed to be **seamless and non-disruptive**. The enhancement adds powerful new capabilities while preserving all existing functionality. Users can adopt new features at their own pace, and administrators can be confident in a smooth transition.

---

**Migration Support**: Available through normal Ex Libris support channels  
**Documentation Version**: 1.0  
**Last Updated**: October 2025
