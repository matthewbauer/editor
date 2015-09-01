var fs = require('fs')
var http = require('http')
var ecstatic = require('ecstatic')
var chokidar = require('chokidar')
var denodeify = require('denodeify')
var WebSocketServer = require('ws').Server
var gitignore = require('gitignore-parser')

var server = http.createServer()
var wss = new WebSocketServer({server: server})

function message() {
}
var sockets = []
wss.on('connection', function(socket) {
  socket.on('message', message)
  sockets.push(socket)
})

var builtins = {}
function read(path, url, headers) {
  return denodeify(fs.readFile)(path).then(function(data, headers) {
    builtins[url] = {
      data: data,
      headers: headers
    }
  })
}
read('index.html', '/', {
  'Content-Type': 'text/html'
})
function readFile(path, headers) {
  return read(path, '/' + path, headers)
}
function readJS(path) {
  return readFile(path, {
    'Content-Type': 'application/javascript'
  })
}
readJS('index.js')
readJS('config.js')

var files = {}
var ignore
chokidar.watch(process.cwd(), {
  cwd: process.cwd(),
  useFsEvents: false
}).on('all', function(event, path) {
  if (ignore && ignore.denies(path))
    return
  if (event === 'add' || event === 'change')
    denodeify(fs.readFile)(path).then(function(data) {
      files['/' + path] = data
      if (path === '.gitignore') {
        ignore = parser.compile(data)
        for (var filename in files)
          if (ignore.denies(path))
            delete files[filename]
      }
    })
  if (event === 'unlink')
    delete files['/' + path]
  sockets.forEach(function(socket) {
    if (socket.readyState !== socket.OPEN)
      return
    socket.send(arguments)
  })
})

server.on('request', function(request, response) {
  if (files[request.url]) {
    response.writeHead(200)
    response.write(files[request.url])
    response.end()
  } else if (builtins[request.url]) {
    response.writeHead(200, builtins[request.url].headers)
    response.write(builtins[request.url].data)
    response.end()
  } else {
    response.writeHead(404)
    response.end()
  }
})

server.listen(process.env.PORT || 8080)
