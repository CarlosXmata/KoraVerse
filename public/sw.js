self.addEventListener('install',()=>self.skipWaiting())
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()))
function showSignal(data={}){const action=['coffee_invite','game_invite','system_event'].includes(data.kind);return self.registration.showNotification(action?'KORA-Señal':'Vaca-Señal',{body:'Hay una señal esperándote en KORAVERSE.',icon:'/icon.svg',badge:'/icon.svg',tag:'koraverse-signal',renotify:true,data:{url:'/',kind:data.kind||'text'}})}
self.addEventListener('message',event=>{if(event.data?.type==='KORA_SIGNAL')event.waitUntil(showSignal(event.data))})
self.addEventListener('push',event=>{let data={};try{data=event.data.json()}catch{}event.waitUntil(showSignal(data))})
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{for(const client of clients){if('focus' in client)return client.focus()}return self.clients.openWindow('/')}))})
