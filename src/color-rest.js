export class ColorRest{
 constructor({player,qa,apply,request=(...args)=>fetch(...args)}){Object.assign(this,{player,qa,apply,request});this.chain=Promise.resolve();this.generation=0}
 clear(){this.generation++;this.apply(false)}
 sync(awake=false){const who=this.player(),generation=this.generation;if(this.qa()||!['carlos','kora'].includes(who))return Promise.resolve();const task=async()=>{if(this.qa()||this.player()!==who||generation!==this.generation)return;try{const response=await this.request('/api/sky',{method:'POST',signal:AbortSignal.timeout(5000),headers:{'Content-Type':'application/json'},body:JSON.stringify({player:who,action:awake?'color-awake':'color-touch'})});if(!response.ok)return;const value=await response.json();if(!this.qa()&&this.player()===who&&generation===this.generation)this.apply(value.color?.gray===true)}catch{}};this.chain=this.chain.then(task,task);return this.chain}
}
