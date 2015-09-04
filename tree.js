var sharejs = require('share/lib/client/index')
var denodeify = require('denodeify')

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

var COLLECTION = 'files'

var proto = 'ws'
var socket = new WebSocket(proto + '://' + location.hostname + ':' + location.port)
var share = new sharejs.Connection(socket)

var query = share.createSubscribeQuery(COLLECTION, {}, {})
query.on('insert', function(docs, idx) {
  console.log('insert')
})
query.on('remove', function(docs, idx) {
  console.log('remove')
})
query.on('move', function(docs, from, to) {
  console.log('move')
})
query.on('change', function() {
  console.log('change')
})
