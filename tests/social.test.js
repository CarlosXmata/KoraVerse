import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeMessages,latestPresence } from '../src/social-utils.js'
test('DB INSERT and broadcast produce exactly one message, ordered by creation',()=>{
  const a={id:1,client_id:'a',body:'Hola',created_at:'2026-10-05T12:00:00Z'}
  const b={id:2,client_id:'b',body:'Hola Kora',created_at:'2026-10-05T12:01:00Z'}
  assert.deepEqual(mergeMessages([b,a],[a,b]),[a,b])
})
test('persisted row replaces its same client id',()=>{
  const base={client_id:'a',body:'Hola',created_at:'2026-10-05T12:00:00Z'}
  assert.deepEqual(mergeMessages([base],[{...base,id:3}]),[{...base,id:3}])
})
test('multi-tab presence selects active session and expires disconnected devices',()=>{
  const now=Date.parse('2026-10-05T12:00:00Z')
  const stale={player_key:'kora',status:'online',last_seen:new Date(now-70000).toISOString()}
  const idle={player_key:'kora',status:'idle',last_seen:new Date(now-1000).toISOString()}
  const online={player_key:'kora',status:'online',last_seen:new Date(now-2000).toISOString()}
  assert.equal(latestPresence([stale,idle,online],'kora',now),online)
  assert.equal(latestPresence([stale],'kora',now),undefined)
})
