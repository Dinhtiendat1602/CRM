import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

test('Harness Core: feature_list.json format and integrity', () => {
  const filePath = path.join(ROOT_DIR, 'feature_list.json');
  assert.ok(fs.existsSync(filePath), 'feature_list.json must exist');

  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  assert.ok(Array.isArray(content.features), 'features must be an array');
  assert.equal(content.features.length, 20, 'Zen CRM must have exactly 20 features mapped to SRS');

  const validStatuses = new Set(['not-started', 'in-progress', 'done']);
  const featureIds = new Set(content.features.map(f => f.id));

  for (const feat of content.features) {
    assert.ok(feat.id, `Feature must have an id: ${JSON.stringify(feat)}`);
    assert.ok(feat.name, `Feature ${feat.id} must have a name`);
    assert.ok(feat.description, `Feature ${feat.id} must have a description`);
    assert.ok(validStatuses.has(feat.status), `Feature ${feat.id} has invalid status: ${feat.status}`);
    assert.ok(Array.isArray(feat.dependencies), `Feature ${feat.id} dependencies must be an array`);

    // Verify all dependencies exist in feature list
    for (const dep of feat.dependencies) {
      assert.ok(featureIds.has(dep), `Feature ${feat.id} depends on non-existent feature: ${dep}`);
    }
  }
});

test('Harness Core: Required Project Documents exist', () => {
  const requiredFiles = [
    'AGENTS.md',
    'init.sh',
    'progress.md',
    'session-handoff.md',
    'docs/00-srs-analysis-specification.md',
    'docs/01-roles-and-requirements.md',
    'docs/02-database-design.md',
    'docs/03-backend-architecture.md',
    'docs/04-frontend-architecture.md',
    'docs/05-roadmap-and-defense.md'
  ];

  for (const relPath of requiredFiles) {
    const fullPath = path.join(ROOT_DIR, relPath);
    assert.ok(fs.existsSync(fullPath), `Required document must exist: ${relPath}`);
  }
});

test('Database Design: 10 tables and core models defined in docs/02-database-design.md', () => {
  const dbDocPath = path.join(ROOT_DIR, 'docs/02-database-design.md');
  const content = fs.readFileSync(dbDocPath, 'utf8');

  const expectedTables = [
    'roles',
    'users',
    'campaigns',
    'product_categories',
    'products',
    'leads',
    'opportunities',
    'follow_ups',
    'orders',
    'sale_forecasts'
  ];

  for (const table of expectedTables) {
    assert.ok(
      content.toLowerCase().includes(`create table ${table}`) ||
      content.toLowerCase().includes(`create table if not exists ${table}`),
      `docs/02-database-design.md must define CREATE TABLE for: ${table}`
    );
  }

  // Verify foreign keys linking roles and product_categories
  assert.ok(content.includes('role_id'), 'users table must have role_id referencing roles');
  assert.ok(content.includes('category_id'), 'products table must have category_id referencing product_categories');
});
