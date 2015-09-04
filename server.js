var fs = require('fs')
var http = require('http')
var chokidar = require('chokidar')
var denodeify = require('denodeify')
var WebSocketServer = require('ws').Server
var gitignore = require('gitignore-parser')
var ecstatic = require('ecstatic')
var livedb = require('livedb')
var share = require('share')
var Duplex = require('stream').Duplex

var sockets = []

var ignore
chokidar.watch(process.cwd(), {
  cwd: process.cwd(),
  useFsEvents: false
}).on('all', function(event, path) {
})

var server = http.createServer()

var ec = ecstatic({root: __dirname})
server.on('request', function(request, response) {
  ec(request, response)
})

function getStream(socket) {
  var stream = new Duplex({objectMode: true})
  stream._write = function(chunk, encoding, callback) {
    socket.send(JSON.stringify(chunk))
    callback()
  }
  stream._read = function() {}
  stream.headers = socket.upgradeReq.headers
  stream.remoteAddress = socket.upgradeReq.connection.remoteAddress
  socket.on('message', function(data) {
    stream.push(JSON.parse(data))
  })
  stream.on('error', function(message) {
    socket.close(message)
  })
  socket.on('close', function(reason) {
    stream.push(null)
    stream.emit('close')
    socket.close(reason)
  })
  stream.on('end', function() {
    socket.close()
  })
  return stream
}

var backend = livedb.client(livedb.memory())
var shareClient = share.server.createClient({backend: backend})
var wss = new WebSocketServer({server: server})
wss.on('connection', function(socket) {
  shareClient.listen(getStream(socket))
})

server.listen(process.env.PORT || 8080)
