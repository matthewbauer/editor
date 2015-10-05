#!/usr/bin/env node

var http = require('http')
var ecstatic = require('ecstatic')
var livedb = require('livedb')
var share = require('share')
var websocket = require('websocket-stream')
var fsWatcher = require('./fs-watcher')
var opn = require('opn')

var server = http.createServer()

var directory
if (process.argv.length > 2)
  directory = process.argv[2]
else
  directory = process.cwd()

var opts = {
}
var ec1 = ecstatic(__dirname, opts)
var ec2 = ecstatic(directory, opts)
server.on('request', function(request, response) {
  if (request.url === '/index.html')
    ec2(request, response, function() {
      ec1(request, response)
    })
  else
    ec1(request, response, function() {
      ec2(request, response)
    })
})

var backend = livedb.client(livedb.memory())
var shareClient = share.server.createClient({backend: backend})
var wss = websocket.createServer({server: server}, function(stream) {
  shareClient.listen(stream)
})

fsWatcher(directory, backend.collection('files'))

var port = process.env.PORT || 8080
server.listen(port)
opn('http://localhost:' + port)
