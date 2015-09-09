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
  parts.reduce(function(prev, part, index){
    var el = prev.getElementsByClassName(part)[0]
    if (!el) {
      el = document.createElement('div')
      el.classList.add('entry')

      var link = document.createElement('a')
      link.textContent = part

      if (index === parts.length - 1) {
        el.classList.add('extension-' + part.substr(part.lastIndexOf('.') + 1))
        el.classList.add('file')
        el.classList.add('file-' + part)
        link.setAttribute('href', 'editor?' + doc.name)
        link.setAttribute('target', '_blank')
        link.addEventListener('click', function(event) {
          if (window.parent !== window) {
            event.preventDefault()
            el.classList.add('select')
            window.parent.postMessage(JSON.stringify({
              type: 'open',
              href: event.target.getAttribute('href')
            }), '*')
          }
        })
      }
      else {
        el.classList.add('directory')
        el.classList.add('directory-' + part)
        link.setAttribute('href', '#')
        link.addEventListener('click', function(event) {
        })
      }

      el.appendChild(link)
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
