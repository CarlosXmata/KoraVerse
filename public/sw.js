self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
self.addEventListener('message', event => {
  if (event.data?.type === 'KORA_SIGNAL') {
    const { title = 'KORA SIGNAL', body = 'Tu cómplice quiere jugar contigo.' } = event.data
    event.waitUntil(self.registration.showNotification(title, { body, icon:'/icon.svg', badge:'/icon.svg', tag:'koraverse-signal', renotify:true, data:{url:'/'} }))
  }
})
self.addEventListener('push', event => {
  let data={title:'KORA SIGNAL ✨',body:'Tu cómplice quiere jugar contigo.',url:'/'}
  try{data={...data,...event.data.json()}}catch{}
  event.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:'/icon.svg',badge:'/icon.svg',tag:'koraverse-signal',renotify:true,data:{url:data.url||'/'}}))
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(clients => {
    for(const client of clients){if('focus' in client)return client.focus()}
    return self.clients.openWindow(event.notification.data?.url||'/')
  }))
})
