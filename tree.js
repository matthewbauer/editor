function click(event) {
  if (window.parent !== window) {
    event.preventDefault()
    window.parent.postMessage(JSON.stringify({
      type: 'open',
      path: event.target.getAttribute('href')
    }), '*')
  }
}

function remove(file) {
  var parts = file.split('/').slice(1)
  var el = parts.reduce(function(prev, part){
    return prev.getElementsByClassName(part)[0]
  }, document.body)
  if (el)
    el.remove()
}

function add(file) {
  var parts = file.split('/').slice(1)
  parts.reduce(function(prev, part){
    var el = prev.getElementsByClassName(part)[0]
    if (!el) {
      var link = document.createElement('a')
      link.textContent = part
      link.setAttribute('href', file)
      link.addEventListener('click', click)

      el = document.createElement('div')
      el.appendChild(link)
      el.classList.add(part)

      prev.appendChild(el)
    }
    return el
  }, document.body)
}

var proto = 'ws'
var socket = new WebSocket(proto + '://' + location.hostname + ':' + location.port)

socket.addEventListener('open', function() {
  socket.send(JSON.stringify({
    type: 'watch'
  }))
})

socket.addEventListener('message', function(event) {
  console.log(event.data)
  var data = JSON.parse(event.data)
  if (data.type === 'files')
    for (var file of data.files)
      add(file)
  if (data.type === 'add' || data.type === 'addDir')
    add(data.path)
  if (data.type === 'unlink' || data.type === 'unlinkDir')
    remove(data.path)
})
