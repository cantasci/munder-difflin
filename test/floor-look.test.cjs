'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const loadTs = require('./load-ts.cjs');

const { floorLookFor, SPAWN_ACCENTS } = loadTs('src/renderer/src/hooks/floorLook.ts');

const CAST = [
  { name: 'jim', displayName: 'Jim' },
  { name: 'pam', displayName: 'Pam' },
  { name: 'dwight', displayName: 'Dwight' }
];

test('a spawn request that names its character and accent gets exactly that look (a /deliver seat)', () => {
  assert.deepEqual(floorLookFor({ id: 'worker-seat-x-ba-1-h1', name: 'ba', character: 'pam', accent: 'mint' }, CAST, 'jim'),
    { character: 'pam', accent: 'mint' });
});

test('accent names from other palettes map onto the floor palette', () => {
  assert.equal(floorLookFor({ id: 'w', character: 'dwight', accent: 'amber' }, CAST, 'jim').accent, 'lemon');
  assert.equal(floorLookFor({ id: 'w', accent: 'rose' }, CAST, 'jim').accent, 'coral');
  assert.equal(floorLookFor({ id: 'w', accent: 'violet' }, CAST, 'jim').accent, 'lilac');
  assert.equal(floorLookFor({ id: 'w', accent: 'slate' }, CAST, 'jim').accent, 'peach');
});

test('without a requested look: character from the name, accent from the id (the old behaviour)', () => {
  const look = floorLookFor({ id: 'abc', name: 'Pam' }, CAST, 'jim');
  assert.equal(look.character, 'pam');
  assert.ok(SPAWN_ACCENTS.includes(look.accent));
  assert.deepEqual(floorLookFor({ id: 'abc', name: 'Pam' }, CAST, 'jim'), look);
});

test('an unknown character or accent falls back instead of breaking the floor', () => {
  const look = floorLookFor({ id: 'abc', name: 'ba', character: 'nobody', accent: 'neon' }, CAST, 'jim');
  assert.equal(look.character, 'jim');
  assert.ok(SPAWN_ACCENTS.includes(look.accent));
});
