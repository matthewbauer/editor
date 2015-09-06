require('./tree.css!')

var sharejs = require('share/lib/client/index')
var denodeify = require('denodeify')

function remove(file) {
  var parts = file.split('/')
  var el = parts.reduce(function(prev, part){
    return prev.getElementsByClassName(part)[0]
  }, document.body)
  if (el)
    el.remove()
}

function add(file) {
  var parts = file.split('/')
  parts.reduce(function(prev, part){
    var el = prev.getElementsByClassName(part)[0]
    if (!el) {
      var link = document.createElement('a')
      link.textContent = part
      link.setAttribute('href', 'editor?' + file)
      link.setAttribute('target', '_blank')
      link.addEventListener('click', function(event) {
        if (window.parent !== window) {
          event.preventDefault()
          window.parent.postMessage(JSON.stringify({
            type: 'open',
            href: event.target.getAttribute('href')
          }), '*')
        }
      })

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

share.on('connected', function() {
  var query = share.createSubscribeQuery(COLLECTION, {}, {docMode:'sub'}, function(err, documents) {
    documents.forEach(function(doc) {
      add(doc.name)
    })
  })
  query.on('insert', function(documents) {
    documents.forEach(function(doc) {
      add(doc.name)
    })
  })
  query.on('remove', function(documents) {
    documents.forEach(function(doc) {
      remove(doc.name)
    })
  })
  query.on('move', function(data) {
  })
  query.on('change', function(data) {
  })
})
