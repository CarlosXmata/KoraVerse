const START='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const files='abcdefgh'
const inside=(r,c)=>r>=0&&r<8&&c>=0&&c<8
const sq=(r,c)=>files[c]+(8-r)
const rc=s=>({r:8-Number(s[1]),c:files.indexOf(s[0])})
const cloneBoard=b=>b.map(row=>row.map(p=>p?{...p}:null))
const pieceLetter={p:'',n:'N',b:'B',r:'R',q:'Q',k:'K'}
export class Chess{
  constructor(fen=START){this._history=[];this.load(fen)}
  load(fen){const [placement,turn='w',castling='-',ep='-',half='0',full='1']=fen.split(/\s+/);this.b=Array.from({length:8},()=>Array(8).fill(null));placement.split('/').forEach((row,r)=>{let c=0;for(const ch of row){if(/\d/.test(ch))c+=Number(ch);else{this.b[r][c++]={type:ch.toLowerCase(),color:ch===ch.toUpperCase()?'w':'b'}}}});this.t=turn;this.castling=castling==='-'?'':castling;this.ep=ep==='-'?null:ep;this.half=Number(half)||0;this.full=Number(full)||1;return true}
  fen(){const rows=this.b.map(row=>{let out='',empty=0;for(const p of row){if(!p){empty++;continue}if(empty){out+=empty;empty=0}let ch=p.type;if(p.color==='w')ch=ch.toUpperCase();out+=ch}if(empty)out+=empty;return out}).join('/');return `${rows} ${this.t} ${this.castling||'-'} ${this.ep||'-'} ${this.half} ${this.full}`}
  board(){return cloneBoard(this.b)}
  turn(){return this.t}
  get(square){const {r,c}=rc(square);return inside(r,c)&&this.b[r][c]?{...this.b[r][c]}:null}
  history(){return [...this._history]}
  moves(opts={}){let m=this._legalMoves(this.t);if(opts.square)m=m.filter(x=>x.from===opts.square);return opts.verbose?m.map(x=>({...x})):m.map(x=>x.san)}
  move(input){const from=input.from,to=input.to,promotion=input.promotion||'q';const legal=this._legalMoves(this.t);let mv=legal.find(m=>m.from===from&&m.to===to&&(m.promotion?m.promotion===promotion:true));if(!mv)return null;mv={...mv};if(mv.promotion)mv.promotion=promotion;const sanBase=this._sanBase(mv);this._apply(mv,true);const check=this.isCheck(),mate=this.isCheckmate();mv.san=sanBase+(mate?'#':check?'+':'');this._history.push(mv.san);return {...mv}}
  isCheck(){return this._inCheck(this.t)}
  isCheckmate(){return this._inCheck(this.t)&&this._legalMoves(this.t).length===0}
  isStalemate(){return !this._inCheck(this.t)&&this._legalMoves(this.t).length===0}
  isDraw(){return this.isStalemate()||this.half>=100||this._insufficient()}
  isGameOver(){return this.isCheckmate()||this.isDraw()}
  _snapshot(){return {b:cloneBoard(this.b),t:this.t,castling:this.castling,ep:this.ep,half:this.half,full:this.full}}
  _restore(s){this.b=s.b;this.t=s.t;this.castling=s.castling;this.ep=s.ep;this.half=s.half;this.full=s.full}
  _king(color){for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(this.b[r][c]?.type==='k'&&this.b[r][c].color===color)return {r,c};return null}
  _inCheck(color){const k=this._king(color);return k?this._attacked(k.r,k.c,color==='w'?'b':'w'):false}
  _attacked(r,c,by){
    const pd=by==='w'?-1:1;for(const dc of [-1,1]){const rr=r-pd,cc=c-dc;if(inside(rr,cc)&&this.b[rr][cc]?.color===by&&this.b[rr][cc].type==='p')return true}
    for(const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]){const rr=r+dr,cc=c+dc;if(inside(rr,cc)&&this.b[rr][cc]?.color===by&&this.b[rr][cc].type==='n')return true}
    for(const [dr,dc,types] of [[-1,-1,'bq'],[-1,1,'bq'],[1,-1,'bq'],[1,1,'bq'],[-1,0,'rq'],[1,0,'rq'],[0,-1,'rq'],[0,1,'rq']]){let rr=r+dr,cc=c+dc;while(inside(rr,cc)){const p=this.b[rr][cc];if(p){if(p.color===by&&types.includes(p.type))return true;break}rr+=dr;cc+=dc}}
    for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if(dr||dc){const rr=r+dr,cc=c+dc;if(inside(rr,cc)&&this.b[rr][cc]?.color===by&&this.b[rr][cc].type==='k')return true}
    return false
  }
  _pseudo(color){const out=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=this.b[r][c];if(!p||p.color!==color)continue;const from=sq(r,c);const push=(rr,cc,extra={})=>{if(!inside(rr,cc))return;const target=this.b[rr][cc];if(target?.color===color)return;out.push({from,to:sq(rr,cc),piece:p.type,color,captured:target?.type,...extra})}
    if(p.type==='p'){const d=color==='w'?-1:1,start=color==='w'?6:1,prom=color==='w'?0:7;if(inside(r+d,c)&&!this.b[r+d][c]){push(r+d,c,{promotion:r+d===prom?'q':undefined});if(r===start&&!this.b[r+2*d][c])push(r+2*d,c,{flags:'b'})}for(const dc of [-1,1]){const rr=r+d,cc=c+dc;if(!inside(rr,cc))continue;const target=this.b[rr][cc];if(target&&target.color!==color)push(rr,cc,{promotion:rr===prom?'q':undefined,flags:'c'});else if(this.ep===sq(rr,cc))out.push({from,to:sq(rr,cc),piece:'p',color,captured:'p',flags:'e'})}}
    else if(p.type==='n'){for(const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])push(r+dr,c+dc)}
    else if('brq'.includes(p.type)){const dirs=p.type==='b'?[[1,1],[1,-1],[-1,1],[-1,-1]]:p.type==='r'?[[1,0],[-1,0],[0,1],[0,-1]]:[[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];for(const [dr,dc] of dirs){let rr=r+dr,cc=c+dc;while(inside(rr,cc)){const target=this.b[rr][cc];if(!target)out.push({from,to:sq(rr,cc),piece:p.type,color});else{if(target.color!==color)out.push({from,to:sq(rr,cc),piece:p.type,color,captured:target.type,flags:'c'});break}rr+=dr;cc+=dc}}}
    else if(p.type==='k'){for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if(dr||dc)push(r+dr,c+dc);const enemy=color==='w'?'b':'w';if(!this._inCheck(color)){if(color==='w'&&r===7&&c===4){if(this.castling.includes('K')&&!this.b[7][5]&&!this.b[7][6]&&!this._attacked(7,5,enemy)&&!this._attacked(7,6,enemy))out.push({from:'e1',to:'g1',piece:'k',color,flags:'k'});if(this.castling.includes('Q')&&!this.b[7][1]&&!this.b[7][2]&&!this.b[7][3]&&!this._attacked(7,3,enemy)&&!this._attacked(7,2,enemy))out.push({from:'e1',to:'c1',piece:'k',color,flags:'q'})}if(color==='b'&&r===0&&c===4){if(this.castling.includes('k')&&!this.b[0][5]&&!this.b[0][6]&&!this._attacked(0,5,enemy)&&!this._attacked(0,6,enemy))out.push({from:'e8',to:'g8',piece:'k',color,flags:'k'});if(this.castling.includes('q')&&!this.b[0][1]&&!this.b[0][2]&&!this.b[0][3]&&!this._attacked(0,3,enemy)&&!this._attacked(0,2,enemy))out.push({from:'e8',to:'c8',piece:'k',color,flags:'q'})}}}
  }return out}
  _legalMoves(color){const out=[];for(const m of this._pseudo(color)){const snap=this._snapshot();this._apply(m,false);const bad=this._inCheck(color);this._restore(snap);if(!bad){m.san=this._sanBase(m);out.push(m)}}return out}
  _sanBase(m){if(m.flags==='k')return 'O-O';if(m.flags==='q')return 'O-O-O';const capture=Boolean(m.captured)||m.flags==='e';const prefix=pieceLetter[m.piece]||(capture?m.from[0]:'');return `${prefix}${capture?'x':''}${m.to}${m.promotion?`=${m.promotion.toUpperCase()}`:''}`}
  _apply(m,advance){const a=rc(m.from),z=rc(m.to),piece=this.b[a.r][a.c];if(!piece)return;const capture=this.b[z.r][z.c];this.b[a.r][a.c]=null;if(m.flags==='e'){const cr=piece.color==='w'?z.r+1:z.r-1;this.b[cr][z.c]=null}if(m.flags==='k'){this.b[z.r][z.c]=piece;const rook=this.b[z.r][7];this.b[z.r][7]=null;this.b[z.r][5]=rook}else if(m.flags==='q'){this.b[z.r][z.c]=piece;const rook=this.b[z.r][0];this.b[z.r][0]=null;this.b[z.r][3]=rook}else{this.b[z.r][z.c]={...piece,type:m.promotion||piece.type}}
    const remove=x=>{this.castling=this.castling.replace(x,'')};if(piece.type==='k'){if(piece.color==='w'){remove('K');remove('Q')}else{remove('k');remove('q')}}if(m.from==='a1'||m.to==='a1')remove('Q');if(m.from==='h1'||m.to==='h1')remove('K');if(m.from==='a8'||m.to==='a8')remove('q');if(m.from==='h8'||m.to==='h8')remove('k');this.ep=null;if(piece.type==='p'&&Math.abs(a.r-z.r)===2)this.ep=sq((a.r+z.r)/2,a.c);this.half=(piece.type==='p'||capture||m.flags==='e')?0:this.half+1;if(advance){if(piece.color==='b')this.full++;this.t=piece.color==='w'?'b':'w'}else this.t=piece.color==='w'?'b':'w'}
  _insufficient(){const pieces=[];for(const row of this.b)for(const p of row)if(p&&p.type!=='k')pieces.push(p.type);if(!pieces.length)return true;if(pieces.length===1&&['b','n'].includes(pieces[0]))return true;return false}
}
