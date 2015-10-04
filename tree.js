// better styling needed!
require('material-design-lite/material.min')
require('material-design-lite/material.min.css!')

require('octicons/octicons/octicons.css!')
require('./icons.less!')
require('./tree.css!')

var sharejs = require('share/lib/client/index')
var denodeify = require('denodeify')

document.body.classList.add('tree-view')

var COLLECTION = 'files'

var use_editor = window.parent === window

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
    part = encodeURIComponent(part)
    var el = prev.getElementsByClassName(part)[0]
    if (!el) {
      if (index === parts.length - 1) {
        el = document.createElement('a')
        el.textContent = part
        el.setAttribute('data-name', part)
        el.classList.add('mdl-button', 'mdl-button--colored', 'mdl-js-button', 'mdl-js-ripple-effect', 'entry', 'file', 'list-item', 'icon-file-text', 'icon-file-media')
        if (part === location.hash.substr(1))
          el.classList.add('selected')
        el.addEventListener('click', function(event) {
          if (event.ctrlKey || event.metaKey)
            return
          Array.prototype.forEach.call(document.getElementsByClassName('selected'), function(el) {
            el.classList.remove('selected')
          })
          el.classList.add('selected')
          if (window.parent !== window) {
            event.preventDefault()
            window.parent.postMessage(JSON.stringify({
              type: 'edit',
              filename: doc.name,
              collection: COLLECTION
            }), '*')
          }
        })
        if (use_editor)
          el.setAttribute('href', 'editor.html?' + doc.name)
        else
          el.setAttribute('href', doc.name)
      }
      else {
        el = document.createElement('div')
        el.classList.add('directory', 'directory-' + part)
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

var socket = new WebSocket('ws://' + location.hostname + ':' + location.port)
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
})
