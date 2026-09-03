import assert from "node:assert/strict";
import { pool } from "../persistence/db.js";
import { recordDecisionWithInjectedFailure, seedLocationB } from "../core.js";
const id=await seedLocationB(pool);await assert.rejects(()=>recordDecisionWithInjectedFailure(pool,id),/TEST_FAULT_AFTER_DECISION_UPDATE/);
const state=await pool.query("select d.status,d.decided_at,o.status obligation_status,o.resolved_at,(select count(*)::int from director_timeline where event_type='DIRECTOR_DECISION_RECORDED') timeline_count from director_decisions d join director_obligations o on o.id=d.obligation_id where d.id=$1",[id]);assert.deepEqual(state.rows[0],{status:'OPEN',decided_at:null,obligation_status:'OPEN',resolved_at:null,timeline_count:0});console.log(JSON.stringify(state.rows[0]));await pool.end();
