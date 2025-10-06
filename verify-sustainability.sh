#!/bin/bash

# Verification script for sustainability improvements
# This script verifies that all deprecated patterns have been addressed

echo "================================================"
echo "Sustainability Verification Script"
echo "================================================"
echo ""

FAILED=0
PASSED=0

# Test 1: Check for toPromise() usage
echo "Test 1: Checking for deprecated toPromise() usage..."
if grep -r "\.toPromise()" cloudapp/src --include="*.ts" --quiet 2>/dev/null; then
  echo "  ❌ FAILED: Found toPromise() usage"
  grep -r "\.toPromise()" cloudapp/src --include="*.ts"
  FAILED=$((FAILED + 1))
else
  echo "  ✅ PASSED: No toPromise() found"
  PASSED=$((PASSED + 1))
fi
echo ""

# Test 2: Check for correct helper imports
echo "Test 2: Checking for correct RxJS helper imports..."
INCORRECT_IMPORTS=$(grep -r "from 'rxjs'" cloudapp/src --include="*.ts" | grep -E "firstValueFrom|lastValueFrom" | grep -v "rxjs-helpers" || true)
if [ -n "$INCORRECT_IMPORTS" ]; then
  echo "  ❌ FAILED: Found incorrect imports"
  echo "$INCORRECT_IMPORTS"
  FAILED=$((FAILED + 1))
else
  echo "  ✅ PASSED: All helper imports are correct"
  PASSED=$((PASSED + 1))
fi
echo ""

# Test 3: Check for PapaParse usage
echo "Test 3: Checking for PapaParse integration..."
if grep -r "import.*Papa.*papaparse" cloudapp/src --include="*.ts" --quiet; then
  echo "  ✅ PASSED: PapaParse is imported"
  PASSED=$((PASSED + 1))
else
  echo "  ❌ FAILED: PapaParse not found"
  FAILED=$((FAILED + 1))
fi
echo ""

# Test 4: Check for shared utilities
echo "Test 4: Checking for shared rxjs-helpers utility..."
if [ -f "cloudapp/src/app/utilities/rxjs-helpers.ts" ]; then
  echo "  ✅ PASSED: Shared utility exists"
  PASSED=$((PASSED + 1))
else
  echo "  ❌ FAILED: Shared utility not found"
  FAILED=$((FAILED + 1))
fi
echo ""

# Test 5: Check for documentation
echo "Test 5: Checking for documentation..."
DOC_COUNT=0
[ -f "documentation/RXJS_MIGRATION.md" ] && DOC_COUNT=$((DOC_COUNT + 1))
[ -f "documentation/CSV_PARSING.md" ] && DOC_COUNT=$((DOC_COUNT + 1))
[ -f "SUSTAINABILITY_SUMMARY.md" ] && DOC_COUNT=$((DOC_COUNT + 1))

if [ $DOC_COUNT -eq 3 ]; then
  echo "  ✅ PASSED: All documentation files present"
  PASSED=$((PASSED + 1))
else
  echo "  ❌ FAILED: Missing documentation files ($DOC_COUNT/3)"
  FAILED=$((FAILED + 1))
fi
echo ""

# Test 6: Check TypeScript compilation
echo "Test 6: Checking TypeScript compilation..."
if cd cloudapp/src && npx tsc --noEmit --skipLibCheck 2>&1 | grep -q "error TS"; then
  echo "  ❌ FAILED: TypeScript compilation errors"
  FAILED=$((FAILED + 1))
else
  echo "  ✅ PASSED: TypeScript compiles without errors"
  PASSED=$((PASSED + 1))
fi
cd ../..
echo ""

# Test 7: Check for duplicate helper implementations
echo "Test 7: Checking for duplicate helper implementations..."
FUNCTION_COUNT=$(grep -r "^function firstValueFrom\|^function lastValueFrom" cloudapp/src --include="*.ts" | wc -l)
if [ $FUNCTION_COUNT -gt 2 ]; then
  echo "  ❌ FAILED: Found duplicate helper implementations"
  grep -r "^function firstValueFrom\|^function lastValueFrom" cloudapp/src --include="*.ts"
  FAILED=$((FAILED + 1))
else
  echo "  ✅ PASSED: No duplicate implementations"
  PASSED=$((PASSED + 1))
fi
echo ""

# Summary
echo "================================================"
echo "Verification Summary"
echo "================================================"
echo "Total Tests: $((PASSED + FAILED))"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "================================================"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "✅ All verification tests passed!"
  echo "The main workflow is sustained and ready for production."
  exit 0
else
  echo "❌ Some verification tests failed."
  echo "Please review the failures above."
  exit 1
fi
