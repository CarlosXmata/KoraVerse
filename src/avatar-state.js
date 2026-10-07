export const AVATAR_STATES=['normal','birthday','reading','coffee','chess','signal','celebrating','sleeping']
export function avatarStateFor({screen='home',mode='classic',status='normal',reaction=null}={}){
 if(status!=='normal')return 'sleeping'
 if(reaction&&AVATAR_STATES.includes(reaction))return reaction
 if(/library|english|reading/.test(screen))return 'reading'
 if(screen==='coffee')return 'coffee'
 if(/chess/.test(screen))return 'chess'
 if(screen==='signals')return 'signal'
 if(['birthday-alignment','birthday-afterglow'].includes(mode))return 'birthday'
 return 'normal'
}
export function activityAdornment(state){const shapes={reading:'<path d="M4 8Q18 4 24 10Q30 4 44 8V36Q30 31 24 37Q18 31 4 36Z" fill="#d5c5a1"/><path d="M24 10V37M9 15H19M29 15H39M9 21H19M29 21H39" stroke="#7e725b"/>',coffee:'<path d="M10 15H34V31Q34 40 22 40Q10 40 10 31Z" fill="#e0d1b3"/><path d="M34 19Q47 16 43 29Q41 34 34 31M17 10Q11 6 17 2M26 10Q20 6 26 2" fill="none" stroke="#d4b47e" stroke-width="2"/>',chess:'<path d="M16 40H35L31 34V24L37 22L31 10L19 6L17 12L22 17L15 27L21 31L20 34Z" fill="#d8c49a" stroke="#9b865e"/><circle cx="28" cy="14" r="1.5" fill="#252235"/>'};return shapes[state]?`<span class="avatar-state-prop" data-prop="${state}" aria-hidden="true"><svg viewBox="0 0 48 48">${shapes[state]}</svg></span>`:''}
