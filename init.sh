#!/bin/bash
set -e

echo "=== Zen CRM Harness Initialization & Verification ==="
echo "Working directory: $(pwd)"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# 1. Environment Prerequisite Checks
echo ""
echo "=== Step 1: Checking System Prerequisites ==="
NODE_VERSION=$(node -v 2>/dev/null || echo "not installed")
NPM_VERSION=$(npm -v 2>/dev/null || echo "not installed")

echo "Node.js version: $NODE_VERSION"
echo "npm version:     $NPM_VERSION"

if [ "$NODE_VERSION" = "not installed" ]; then
  echo "ERROR: Node.js is required but not installed." >&2
  exit 1
fi

# Check PostgreSQL client tool availability
if command -v pg_isready >/dev/null 2>&1; then
  echo "PostgreSQL client: detected (pg_isready available)"
  if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "PostgreSQL service: running on localhost:5432"
  else
    echo "WARNING: PostgreSQL is not accepting connections on localhost:5432. Start Postgres before running DB tests."
  fi
else
  echo "PostgreSQL client: pg_isready not in PATH (skipping live ping)"
fi

# 2. Backend Verification
echo ""
echo "=== Step 2: Backend Verification ==="
if [ -f "backend/package.json" ]; then
  echo "Checking backend dependencies..."
  (cd backend && npm install)

  echo "Checking backend scripts..."
  if node -e "const s = require('./backend/package.json').scripts || {}; process.exit(s.lint ? 0 : 1)" 2>/dev/null; then
    echo "Running backend lint..."
    (cd backend && npm run lint)
  fi

  if node -e "const s = require('./backend/package.json').scripts || {}; process.exit(s.test ? 0 : 1)" 2>/dev/null; then
    echo "Running backend test suite..."
    (cd backend && npm test)
  fi
else
  echo "Backend not yet initialized (waiting for feat-001)."
fi

# 3. Frontend Verification
echo ""
echo "=== Step 3: Frontend Verification ==="
if [ -f "frontend/package.json" ]; then
  echo "Checking frontend dependencies..."
  (cd frontend && npm install)

  echo "Checking frontend scripts..."
  if node -e "const s = require('./frontend/package.json').scripts || {}; process.exit(s.lint ? 0 : 1)" 2>/dev/null; then
    echo "Running frontend lint..."
    (cd frontend && npm run lint)
  fi

  if node -e "const s = require('./frontend/package.json').scripts || {}; process.exit(s.build ? 0 : 1)" 2>/dev/null; then
    echo "Running frontend build..."
    (cd frontend && npm run build)
  fi
else
  echo "Frontend not yet initialized (waiting for feat-001)."
fi

# 4. Harness State & Artifact Integrity
echo ""
echo "=== Step 4: Harness State Validation ==="
if [ -f "feature_list.json" ]; then
  node -e "
    const data = JSON.parse(require('fs').readFileSync('feature_list.json', 'utf8'));
    if (!Array.isArray(data.features)) throw new Error('feature_list.json missing features array');
    const notStarted = data.features.filter(f => f.status === 'not-started').length;
    const inProgress = data.features.filter(f => f.status === 'in-progress').length;
    const done = data.features.filter(f => f.status === 'done').length;
    console.log('Feature State Summary: ' + done + ' done, ' + inProgress + ' in-progress, ' + notStarted + ' not-started (Total: ' + data.features.length + ')');
  "
else
  echo "ERROR: feature_list.json not found!" >&2
  exit 1
fi

# 5. Automated Tests Execution
echo ""
echo "=== Step 5: Automated Tests Execution ==="
if [ -d "tests" ]; then
  echo "Running core automated tests (node:test)..."
  node --test tests/*.test.js
fi

echo ""
echo "=== Verification Complete: Environment is clean and restartable ==="
echo ""
echo "Next steps for AI agent / developer:"
echo "1. Read feature_list.json to inspect current feature state"
echo "2. Pick exactly ONE active feature (respecting dependencies)"
echo "3. Implement only that feature within scope"
echo "4. Re-run ./init.sh and record verification evidence in progress.md before closing feature"
