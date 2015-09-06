#!/usr/bin/env node

var fs = require('fs')
var http = require('http')
var chokidar = require('chokidar')
var denodeify = require('denodeify')
var gitignore = require('gitignore-parser')
var ecstatic = require('ecstatic')
var livedb = require('livedb')
var share = require('share')
var Duplex = require('stream').Duplex
var opn = require('opn')
var websocket = require('websocket-stream')

var sockets = []

var server = http.createServer()

var ec = ecstatic({root: __dirname})
server.on('request', function(request, response) {
  ec(request, response)
})

var backend = livedb.client(livedb.memory())
var shareClient = share.server.createClient({backend: backend})

var wss = websocket.createServer({server: server}, function(stream) {
  shareClient.listen(stream)
})

var ignore
chokidar.watch(process.cwd(), {
  cwd: process.cwd()
}).on('all', function(event, path) {
  if (ignore && ignore.denies(path) || path.indexOf('.git/') === 0)
    return
  if (event === 'add')
    return Promise.resolve().then(function() {
      return denodeify(fs.readFile)(path, 'utf-8')
    }).then(function(data) {
      if (path === '.gitignore')
        ignore = gitignore.compile(data)
      return denodeify(backend.collection('files').submit)(path, {
        create: {
          type: 'text',
          data: data
        }
      })
    }).then(function() {
      backend.fetchAndSubscribe('files', path, function(err, data, stream) {
        stream.on('data', function(opData) {
          livedb.ot.apply(data, opData)
          if (data.data)
            return denodeify(fs.writeFile)(path, data.data)
        })
      })
    })
  if (event === 'change')
    return Promise.resolve().then(function() {
      return denodeify(backend.collection('files').fetch)(path)
    }).then(function(snapshot) {
      return denodeify(fs.readFile)(path, 'utf-8').then(function(data) {
        if (snapshot.data !== data)
          return denodeify(backend.collection('files').submit)(path, {
            op: [{d: snapshot.data.length}, data]
          })
      })
    })
  if (event === 'unlink')
    return Promise.resolve().then(function() {
      return denodeify(backend.collection('files').submit)(path, {
        del: true
      })
    })
})

var port = process.env.PORT || 8080
server.listen(port)

opn('http://localhost:' + port + '/editor')
