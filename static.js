var http = require('http')
var ecstatic = require('ecstatic')

http.createServer(ecstatic({root: process.cwd()})).listen(8080)
