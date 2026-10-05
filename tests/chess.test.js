import test from 'node:test'
import assert from 'node:assert/strict'
import {Chess} from '../src/chess-engine.js'
test('opening has 20 legal moves and Fool’s Mate ends the game',()=>{
 const chess=new Chess();assert.equal(chess.moves().length,20)
 for(const [from,to] of [['f2','f3'],['e7','e5'],['g2','g4'],['d8','h4']])assert.ok(chess.move({from,to}))
 assert.equal(chess.isCheckmate(),true);assert.equal(chess.isGameOver(),true)
})
test('castling moves the rook and king',()=>{
 const chess=new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')
 assert.ok(chess.move({from:'e1',to:'g1'}));assert.equal(chess.get('f1').type,'r');assert.equal(chess.get('g1').type,'k')
})
test('en passant removes the passed pawn and promotion creates a queen',()=>{
 const chess=new Chess('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1')
 assert.ok(chess.move({from:'e5',to:'d6'}));assert.equal(chess.get('d5'),null)
 const promo=new Chess('4k3/P7/8/8/8/8/8/4K3 w - - 0 1')
 assert.ok(promo.move({from:'a7',to:'a8',promotion:'q'}));assert.equal(promo.get('a8').type,'q')
})
