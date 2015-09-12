var chokidar = require('chokidar')
var fs = require('fs')
var denodeify = require('denodeify')
var gitignore = require('gitignore-parser')
var livedb = require('livedb')

module.exports = function(directory, collection) {
  var ignore
  chokidar.watch(directory, {
    cwd: directory
  }).on('all', function(event, path) {
    if (ignore && ignore.denies(path) || path[0] === '.' && path !== '.gitignore' || path === '')
      return
    if (event === 'add')
      return denodeify(fs.readFile)(path, 'utf-8')
      .then(function(data) {
        if (path === '.gitignore')
          ignore = gitignore.compile(data)
        return denodeify(collection.submit)(path, {
          create: {
            type: 'text',
            data: data
          }
        })
      }).then(function() {
        collection.fetchAndSubscribe(path, function(err, data, stream) {
          stream.on('data', function(opData) {
            livedb.ot.apply(data, opData)
            if (data.data)
              return denodeify(fs.writeFile)(path, data.data)
          })
        })
      })
    if (event === 'change')
      return denodeify(collection.fetch)(path)
      .then(function(snapshot) {
        return denodeify(fs.readFile)(path, 'utf-8').then(function(data) {
          if (snapshot.data !== data) {
            var op = []
            if (snapshot.data.length > 0)
              op.push({d: snapshot.data.length})
            op.push(data)
            return denodeify(collection.submit)(path, {
              op: op
            })
          }
        })
      })
    if (event === 'unlink')
      return denodeify(collection.submit)(path, {
        del: true
      })
  })
}
