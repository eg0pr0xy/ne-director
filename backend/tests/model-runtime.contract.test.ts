import assert from 'node:assert/strict';
import test from 'node:test';
import { OpenAiCompatibleRuntime, structuredOutputSchema, validateModelOutput } from '../interpretation/runtime.js';

test('model runtime is explicitly not configured without operator settings', async () => {
  const prior = [process.env.DIRECTOR_MODEL_RUNTIME, process.env.DIRECTOR_MODEL_BASE_URL, process.env.DIRECTOR_MODEL_NAME]; delete process.env.DIRECTOR_MODEL_RUNTIME; delete process.env.DIRECTOR_MODEL_BASE_URL; delete process.env.DIRECTOR_MODEL_NAME;
  try { assert.equal((await new OpenAiCompatibleRuntime().health()).state, 'NOT_CONFIGURED'); }
  finally { const [runtime,base,name]=prior; if(runtime===undefined)delete process.env.DIRECTOR_MODEL_RUNTIME;else process.env.DIRECTOR_MODEL_RUNTIME=runtime;if(base===undefined)delete process.env.DIRECTOR_MODEL_BASE_URL;else process.env.DIRECTOR_MODEL_BASE_URL=base;if(name===undefined)delete process.env.DIRECTOR_MODEL_NAME;else process.env.DIRECTOR_MODEL_NAME=name; }
});

test('structured model output rejects unknown fields and canonical IDs', () => {
  const valid={candidates:[{kind:'ABSTAIN',summary:'Insufficient evidence',confidence:1,evidence:[]}],interpreterId:'local',interpreterVersion:'1',contractVersion:'NE_DIRECTOR_INTERPRETATION_V1',generatedAt:'2026-09-03T09:42:00.000Z'};
  assert.equal(structuredOutputSchema.parse(valid).candidates[0].kind,'ABSTAIN');
  assert.throws(()=>structuredOutputSchema.parse({...valid,toolCall:'send_email'}));
  assert.throws(()=>structuredOutputSchema.parse({...valid,candidates:[{...valid.candidates[0],decisionId:'forbidden'}]}));
});

test('model evidence hashes are derived locally and invalid spans fail closed', () => {
  const input={sourceRecordId:'00000000-0000-4000-8000-000000000001',sourceType:'COMMUNICATION' as const,sourceContentHash:'a'.repeat(64),subject:'Confirm Location B',normalizedText:'Confirm Location B by 14:00',sender:{value:'controlled@example.test'},recipients:[],receivedAt:'2026-09-03T09:42:00.000Z',sourceTimezone:'Europe/Berlin',minimalContext:{synthetic_controlled:true}};
  const raw={candidates:[{kind:'DECISION_REQUEST',summary:'Confirm Location B',confidence:.8,evidence:[{sourceField:'normalized_text',characterStart:0,characterEnd:18}]}],interpreterId:'local',interpreterVersion:'1',contractVersion:'NE_DIRECTOR_INTERPRETATION_V1',generatedAt:'2026-09-03T09:42:00.000Z'};
  const output=validateModelOutput(input,raw);
  assert.match(output.candidates[0].evidence[0].evidenceHash,/^[a-f0-9]{64}$/);
  assert.throws(()=>validateModelOutput(input,{...raw,candidates:[{...raw.candidates[0],evidence:[{sourceField:'normalized_text',characterStart:0,characterEnd:999}]}]}));
  assert.throws(()=>validateModelOutput(input,{...raw,candidates:[{...raw.candidates[0],summary:'00000000-0000-4000-8000-000000000001'}]}));
});
