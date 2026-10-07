import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const baseline=JSON.parse(readFileSync(new URL('./story-preservation.json',import.meta.url),'utf8'))
test('the narrative expansion preserves original games, classic modes, 10/10, security, Sanctuary, SQL and Realtime byte for byte',()=>{
 for(const [file,hash]of Object.entries(baseline))assert.equal(createHash('sha256').update(readFileSync(new URL('../'+file,import.meta.url))).digest('hex'),hash,file+' changed outside the narrative scope')
})
