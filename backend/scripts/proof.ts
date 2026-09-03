import assert from "node:assert/strict";
import { pool } from "../persistence/db.js";
import { recordDecision, seedLocationB } from "../core.js";
// This script is only run against the dedicated disposable proof database.
await pool.query("truncate director_timeline, director_open_loops, director_decisions, director_obligations, director_events cascade");
const decision=await seedLocationB(pool);
const first=await pool.query("select count(*)::int n from director_events"); const replay=await seedLocationB(pool); const counts=await pool.query("select (select count(*)::int from director_events) events,(select count(*)::int from director_obligations) obligations,(select count(*)::int from director_decisions) decisions,(select count(*)::int from director_timeline) timeline");
assert.equal(decision,replay); assert.deepEqual(counts.rows[0],{events:1,obligations:1,decisions:1,timeline:2});
const responses=await Promise.allSettled([recordDecision(pool,decision,"LOCATION_A"),recordDecision(pool,decision,"LOCATION_B")]); const success=responses.filter(x=>x.status==='fulfilled'); assert.equal(success.length,1); const final=await pool.query("select d.status,d.selected_option,o.status obligation_status,(select count(*)::int from director_timeline t where t.event_type='DIRECTOR_DECISION_RECORDED') timeline_count from director_decisions d join director_obligations o on o.id=d.obligation_id"); assert.equal(final.rows[0].status,'DECIDED');assert.equal(final.rows[0].obligation_status,'RESOLVED');assert.equal(final.rows[0].timeline_count,1);console.log(JSON.stringify({idempotency:counts.rows[0],responses:responses.map(x=>x.status==='fulfilled'?{ok:true,value:x.value}:{ok:false,code:(x.reason as any).code}),final:final.rows[0]}));await pool.end();
