var express = require('express')
var chokidar = require('chokidar')
var app = express()

chokidar.watch(process.cwd()).on('all', function(event, path) {
  console.log(event, path)
})

app.use(function(request, response) {
  console.log(request)
})

var server = app.listen(8081)
