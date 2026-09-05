import assert from 'node:assert/strict';
import test from 'node:test';
import { agentCharters, agentIds, capabilityDefinitions, minimumPermission, permissionRank } from '../agents/contracts.js';

test('Agent Team V1 freezes exactly seven versioned canonical IDs', () => {
  assert.deepEqual(agentCharters.map(charter => charter.agentId), [...agentIds]);
  assert.equal(new Set(agentCharters.map(charter => charter.agentId)).size, 7);
  assert.ok(agentCharters.every(charter => charter.charterVersion === '1.0.0' && charter.provenance.versionControlled));
  assert.equal(agentCharters.find(charter => charter.agentId === 'CHIEF_OF_STAFF')?.cannotDisable, true);
  assert.ok(agentCharters.every(charter => charter.defaultOperatorPolicy.delegationMode === 'MANUAL_ONLY'));
});

test('capability declarations remain separate from implementation availability and no mutations are available', () => {
  assert.equal(capabilityDefinitions.find(capability => capability.capabilityId === 'MAIL_READ')?.availabilityEvaluator, 'GOOGLE_MAIL');
  assert.equal(capabilityDefinitions.find(capability => capability.capabilityId === 'CALENDAR_READ')?.availabilityEvaluator, 'GOOGLE_CALENDAR');
  assert.equal(capabilityDefinitions.find(capability => capability.capabilityId === 'COMMUNICATION_INTERPRET')?.availabilityEvaluator, 'QUALITY_GATE');
  for (const capability of capabilityDefinitions.filter(item => item.mutating)) assert.equal(capability.availabilityEvaluator, 'NOT_IMPLEMENTED');
  for (const id of ['ORDO_READ', 'PRESENCE_READ', 'NARRATE_READ', 'NARRATE_CONTEXT_READ']) assert.equal(capabilityDefinitions.find(capability => capability.capabilityId === id)?.availabilityEvaluator, 'NOT_IMPLEMENTED');
});

test('agent policy can restrict but never escalate global autonomy', () => {
  assert.equal(minimumPermission('SUGGEST_ONLY', 'ALLOWED'), 'SUGGEST_ONLY');
  assert.equal(minimumPermission('ALLOWED', 'APPROVAL_REQUIRED'), 'APPROVAL_REQUIRED');
  assert.ok(permissionRank('SUGGEST_ONLY') < permissionRank('APPROVAL_REQUIRED'));
  assert.ok(permissionRank('APPROVAL_REQUIRED') < permissionRank('ALLOWED'));
});
