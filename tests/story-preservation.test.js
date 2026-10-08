import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const baseline=JSON.parse(readFileSync(new URL('./story-preservation.json',import.meta.url),'utf8'))
test('Signals 2.0 preserves Alignment Story, Atlas, Yearbook, original games, encryption format and previous SQL byte for byte',()=>{
 for(const [file,hash]of Object.entries(baseline))assert.equal(createHash('sha256').update(readFileSync(new URL('../'+file,import.meta.url))).digest('hex'),hash,file+' changed outside the Social expansion scope')
})
