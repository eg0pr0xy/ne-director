import assert from 'node:assert/strict';
import test from 'node:test';
import { OpenAiCompatibleRuntime, structuredOutputSchema } from '../interpretation/runtime.js';

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
