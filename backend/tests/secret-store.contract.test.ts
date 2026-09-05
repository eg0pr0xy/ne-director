import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { EnvironmentSecretStore, SecretStoreError, isOpaqueSecretReference, localDevelopmentSecretStore } from '../secrets/store.js';

test('local secret authority persists opaque independent references and deletes only the revoked reference', async () => {
  const store = localDevelopmentSecretStore();
  if (!store.writable) {
    assert.equal(store.classification, 'LOCAL_DEVELOPMENT_ONLY');
    return;
  }
  const firstSecret = randomUUID(); const secondSecret = randomUUID();
  const first = await store.put(firstSecret, { ownerConnectionId: 'connection-a', provider: 'GOOGLE', purpose: 'OAUTH_REFRESH_TOKEN', classification: 'LOCAL_DEVELOPMENT_ONLY' });
  const second = await store.put(secondSecret, { ownerConnectionId: 'connection-b', provider: 'GOOGLE', purpose: 'OAUTH_REFRESH_TOKEN', classification: 'LOCAL_DEVELOPMENT_ONLY' });
  try {
    assert.equal(isOpaqueSecretReference(first), true); assert.equal(first.includes(firstSecret), false);
    assert.equal(await store.exists(first), true); assert.equal(await localDevelopmentSecretStore().get(first), firstSecret);
    assert.equal(await localDevelopmentSecretStore().get(second), secondSecret);
    await store.delete(first);
    assert.equal(await store.exists(first), false); assert.equal(await localDevelopmentSecretStore().get(second), secondSecret);
    await assert.rejects(() => store.get(first), (error: unknown) => error instanceof SecretStoreError && error.code === 'SECRET_NOT_FOUND');
  } finally { await store.delete(first).catch(() => undefined); await store.delete(second).catch(() => undefined); }
});

test('environment fallback resolves only an explicit opaque environment reference and cannot write', async () => {
  const name = 'DIRECTOR_SECRET_STORE_CONTROLLED_TEST'; const value = randomUUID(); process.env[name] = value;
  const store = new EnvironmentSecretStore();
  try {
    assert.equal(await store.get(`env://${name}`), value); assert.equal(await store.exists(`env://${name}`), true);
    await assert.rejects(() => store.put(value, { ownerConnectionId: 'connection-a', purpose: 'OAUTH_REFRESH_TOKEN', classification: 'LOCAL_DEVELOPMENT_ONLY' }), (error: unknown) => error instanceof SecretStoreError && error.code === 'SECRET_STORE_READ_ONLY');
  } finally { delete process.env[name]; }
});
