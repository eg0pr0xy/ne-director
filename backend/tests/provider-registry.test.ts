import assert from 'node:assert/strict';
import test from 'node:test';
import { providerById, providerRegistry } from '../ingress/provider-registry.js';

test('Settings provider choices come from one registry and make adapter availability explicit', () => {
  assert.deepEqual(providerRegistry.map(provider => provider.id), ['ICLOUD', 'GOOGLE', 'MICROSOFT_365', 'OTHER']);
  assert.equal(providerRegistry.every(provider => provider.adapterStatus === 'NOT_IMPLEMENTED' && provider.authorizationStatus === 'NOT_IMPLEMENTED'), true);
});

test('provider selection is explicit and Contacts remains a selectable future capability', () => {
  const iCloud = providerById('ICLOUD');
  assert.ok(iCloud); assert.equal(iCloud.capabilities.includes('MAIL'), true); assert.equal(iCloud.capabilities.includes('CALENDAR'), true); assert.equal(iCloud.capabilities.includes('CONTACTS'), true);
  assert.equal(providerById('NOT_A_PROVIDER'), undefined);
});
