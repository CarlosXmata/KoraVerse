export class SignalAudio{
 constructor(){this.ctx=null;this.nodes=new Set()}
 async activate(){try{this.ctx ||=new(window.AudioContext||window.webkitAudioContext)();await this.ctx.resume()}catch{}}
 play(kind='text',open=false){const ctx=this.ctx;if(!ctx||ctx.state!=='running')return false;const notes={text:[740],photo:[880,1174],quote:[523],game_invite:[392,587],coffee_invite:[330,440],coffee_reply:[330,440]}[kind]||[660];const volume=open?.009:.018;notes.forEach((f,i)=>{const oscillator=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime+i*.1;oscillator.type='sine';oscillator.frequency.value=f;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(volume,t+.02);gain.gain.exponentialRampToValueAtTime(.00001,t+.22);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start(t);oscillator.stop(t+.24);this.nodes.add(oscillator);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();this.nodes.delete(oscillator)}});return true}
 hush(){for(const oscillator of this.nodes){try{oscillator.stop()}catch{}}this.nodes.clear()}
}
