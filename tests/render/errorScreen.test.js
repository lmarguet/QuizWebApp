import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderErrorScreen } from '../../src/render/errorScreen.js';

test('renderErrorScreen shows each error', () => {
  const html = renderErrorScreen(['teams must have 3 entries', 'options too short']);
  assert.ok(html.includes('teams must have 3 entries'));
  assert.ok(html.includes('options too short'));
});

test('renderErrorScreen escapes error text', () => {
  const html = renderErrorScreen(['<script>x</script>']);
  assert.ok(!html.includes('<script>x</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('renderErrorScreen handles empty list gracefully', () => {
  const html = renderErrorScreen([]);
  assert.ok(html.length > 0);
});
