#!/bin/bash
set -e

echo "=== Zen CRM Test Runner ==="
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

# 1. Run Root Automated Tests
if [ -d "tests" ]; then
  echo "--- Running Core System & Architecture Tests (node:test) ---"
  node --test tests/*.test.js
  echo "--- Core tests passed successfully! ---"
  echo ""
fi

# 2. Run Backend Tests (if initialized)
if [ -f "backend/package.json" ]; then
  if node -e "const s = require('./backend/package.json').scripts || {}; process.exit(s.test ? 0 : 1)" 2>/dev/null; then
    echo "--- Running Backend Tests (npm test) ---"
    (cd backend && npm test)
    echo "--- Backend tests passed successfully! ---"
    echo ""
  fi
fi

# 3. Run Frontend Tests (if initialized)
if [ -f "frontend/package.json" ]; then
  if node -e "const s = require('./frontend/package.json').scripts || {}; process.exit(s.test ? 0 : 1)" 2>/dev/null; then
    echo "--- Running Frontend Tests (npm test) ---"
    (cd frontend && npm test)
    echo "--- Frontend tests passed successfully! ---"
    echo ""
  fi
fi

echo "=== All Tests Completed Successfully! ==="
