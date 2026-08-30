import dns from 'node:dns/promises'

try {
  console.log('DNS servers:', dns.getServers())

  const result = await dns.resolveSrv('_mongodb._tcp.hair-clip.mqqbc2y.mongodb.net')

  console.log('SRV result:', result)
} catch (error) {
  console.error('DNS ERROR:', error)
}
