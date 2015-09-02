var fs = require('fs')
var http = require('http')
var chokidar = require('chokidar')
var denodeify = require('denodeify')
var WebSocketServer = require('ws').Server
var gitignore = require('gitignore-parser')
var ecstatic = require('ecstatic')

var server = http.createServer()
var wss = new WebSocketServer({server: server})

var sockets = []
var files = {}
var watchers = {}
wss.on('connection', function(socket) {
  socket.on('message', function(message) {
    var data = JSON.parse(message)
    if (data.type === 'watch') {
      if (data.path) {
        if (files[data.path])
          socket.send(JSON.stringify({
            type: 'content',
            value: files[data.path]
          }))
        if (!watchers[data.path])
          watchers[data.path] = []
        watchers[data.path].push(socket)
      }
      else {
        sockets.push(socket)
      }
    }
    else if (data.type === 'changes') {

    }
  })
  socket.send(JSON.stringify({
    type: 'files',
    files: Object.keys(files)
  }))
})

var ignore
chokidar.watch(process.cwd(), {
  cwd: process.cwd(),
  useFsEvents: false
}).on('all', function(event, path) {
  if (ignore && ignore.denies(path) || path.startsWith('.git/'))
    return
  if (event === 'add' || event === 'change') {
    denodeify(fs.readFile)(path, 'utf-8').then(function(data) {
      if (path === '.gitignore') {
        ignore = gitignore.compile(data)
        for (var filename in files)
          if (ignore.denies(filename.substr(1)))
            delete files[filename]
      }
      if (ignore && ignore.denies(path))
        return
      if (watchers['/' + path])
        watchers['/' + path].forEach(function(socket) {
          if (socket.readyState !== socket.OPEN)
            return
          socket.send(JSON.stringify({
            type: 'content',
            value: data
          }))
        })
      files['/' + path] = data
    })
  }
  if (event === 'unlink')
    delete files['/' + path]
  sockets.forEach(function(socket) {
    if (socket.readyState !== socket.OPEN)
      return
    socket.send(JSON.stringify({
      type: event,
      path: '/' + path
    }))
  })
})

var ec = ecstatic({root: __dirname})
server.on('request', function(request, response) {
  if (files[request.url]) {
    response.writeHead(200)
    response.write(files[request.url])
    response.end()
  }
  else {
    ec(request, response)
  }
})

server.listen(process.env.PORT || 8080)
