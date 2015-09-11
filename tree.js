// better styling needed!
require('./tree.css!')

var sharejs = require('share/lib/client/index')
var denodeify = require('denodeify')

function remove(doc) {
  var parts = doc.name.split('/')
  var el = parts.reduce(function(prev, part){
    return prev.getElementsByClassName(part)[0]
  }, document.body)
  if (el)
    el.remove()
}

function add(doc) {
  var parts = doc.name.split('/')
  parts.reduce(function(prev, part, index) {
    var el = prev.getElementsByClassName(part)[0]
    if (!el) {
      if (index === parts.length - 1) {
        el = document.createElement('a')
        el.classList.add('entry')
        el.textContent = part
        el.classList.add('extension-' + part.substr(part.lastIndexOf('.') + 1))
        el.classList.add('file')
        el.classList.add('file-' + part)
        if (part === location.hash.substr(1))
          el.classList.add('selected')
        el.addEventListener('click', function(event) {
          Array.prototype.forEach.call(document.getElementsByClassName('selected'), function(el) {
            el.classList.remove('selected')
          })
          el.classList.add('selected')
          if (window.parent !== window) {
            event.preventDefault()
            window.parent.postMessage(JSON.stringify({
              type: 'edit',
              filename: doc.name,
              collection: 'files'
            }), '*')
          }
        })
        el.setAttribute('href', 'editor?' + doc.name)
        el.setAttribute('target', '_blank')
      }
      else {
        el = document.createElement('div')
        el.classList.add('directory')
        el.classList.add('directory-' + part)
      }

      var found = false
      for (var child of Array.prototype.slice.call(prev.children)) {
        if (child.firstChild.textContent < part) {
          found = true
          prev.insertBefore(el, child)
        }
      }
      if (!found)
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
    documents.forEach(add)
  })
  query.on('insert', function(documents) {
    documents.forEach(add)
  })
  query.on('remove', function(documents) {
    documents.forEach(remove)
  })
  query.on('move', function(data) {
  })
  query.on('change', function(data) {
  })
})
