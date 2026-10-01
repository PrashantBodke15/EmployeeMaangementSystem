import test from 'node:test';
import assert from 'node:assert/strict';

import { createToken, verifyToken, isAdmin, normalizeRole } from './auth.js';

test('normalizeRole accepts only user and admin', () => {
  assert.equal(normalizeRole('admin'), 'admin');
  assert.equal(normalizeRole('USER'), 'user');
  assert.equal(normalizeRole('manager'), 'user');
});

test('token includes role and can be verified', () => {
  const token = createToken({ id: 'abc', email: 'admin@example.com', role: 'admin' }, 'test-secret');
  const payload = verifyToken(token, 'test-secret');

  assert.equal(payload.id, 'abc');
  assert.equal(payload.role, 'admin');
  assert.equal(isAdmin(payload.role), true);
});
