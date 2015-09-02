var editor = require('codemirror')(document.body)

var proto = 'ws'
var socket = new WebSocket(proto + '://' + location.hostname + ':' + location.port)

socket.addEventListener('open', function() {
  socket.send(JSON.stringify({
    type: 'watch',
    path: location.search.substr(1)
  }))

  editor.on('changes', function(instance, changes) {
    socket.send(JSON.stringify({
      type: 'changes',
      changes: changes
    }))
  })
})

socket.addEventListener('message', function(event) {
  var data = JSON.parse(event.data)
  if (data.type === 'changes')
    editor.setValue(data.value)
})
