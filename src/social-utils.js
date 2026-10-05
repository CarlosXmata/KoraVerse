export function mergeMessages(current, incoming) {
  const rows = new Map()
  for (const row of [...current,...incoming]) rows.set(row.client_id || String(row.id), row)
  return [...rows.values()].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)).slice(-100)
}
export function latestPresence(rows, player, now=Date.now()) {
  return rows.filter(row=>row.player_key===player && now-new Date(row.last_seen||row.at||0).getTime()<65000)
    .sort((a,b)=>(a.status==='online'?0:1)-(b.status==='online'?0:1)||new Date(b.last_seen||b.at)-new Date(a.last_seen||a.at))[0]
}
