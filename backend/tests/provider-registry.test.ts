import assert from 'node:assert/strict';
import test from 'node:test';
import { providerById, providerRegistry } from '../ingress/provider-registry.js';

test('Settings provider choices come from one registry and make implementation availability explicit', () => {
  assert.deepEqual(providerRegistry.map(provider => provider.id), ['ICLOUD', 'GOOGLE', 'MICROSOFT_365', 'OTHER']);
  assert.equal(providerById('GOOGLE')?.implementationStatus, 'AVAILABLE');
  assert.equal(providerRegistry.filter(provider => provider.id !== 'GOOGLE').every(provider => provider.implementationStatus === 'NOT_IMPLEMENTED'), true);
});

test('provider selection is explicit and Contacts remains a selectable future capability', () => {
  const iCloud = providerById('ICLOUD');
  assert.ok(iCloud); assert.equal(iCloud.capabilities.includes('MAIL'), true); assert.equal(iCloud.capabilities.includes('CALENDAR'), true); assert.equal(iCloud.capabilities.includes('CONTACTS'), true);
  assert.equal(providerById('NOT_A_PROVIDER'), undefined);
});
