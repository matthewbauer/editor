// editor.js - the JavaScript editor

require('./editor.css!')

var CodeMirror = require('./codemirror-all')
var editor = CodeMirror(document.body, {
  autofocus: true,
  autoCloseBrackets: true,
  autoCloseTags: true,
  coverGutterNextToScrollbar: true,
  cursorScrollMargin: 3,
  electricChars: true,
  extraKeys: {
    Left: 'goSoftLeft',
    Right: 'goSoftRight',
    Backspace: 'delSoftBefore',
    Delete: 'delSoftAfter'
  },
  foldGutter: true,
  fullScreen: true,
  gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
  keyMap: 'sublime',
  lineNumbers: true,
  lineWrapping: true,
  matchBrackets: true,
  showTrailingSpace: true,
  smartIndent: true,
  theme: 'monokai'
})
editor.getWrapperElement().style.display = 'none'

var sharejs = require('share/lib/client/index')
var socket = new WebSocket('ws://' + location.hostname + ':' + location.port)
var share = new sharejs.Connection(socket)
var doc

function loadDoc(collection, filename) {
  if (doc)
    doc.unsubscribe()
  doc = share.get(collection, filename)
  doc.subscribe()
  return new Promise(function(resolve, reject) {
    doc.whenReady(function() {
      if (!doc.type)
        throw 'no type'
      else
        resolve(doc)
    })
  })
}

function editDoc(collection, filename) {
  return loadDoc(collection, filename).then(function(doc) {
    editor.getWrapperElement().style.display = 'inherit'
    editor.setOption('share', doc.createContext())
    editor.setOption('detectIndent', true)
    editor.setOption('fileName', filename)
  })
}

if (location.search !== '')
  editDoc('files', location.search.substr(1))

window.addEventListener('message', function(event) {
  if (!event.data)
    return
  var data = JSON.parse(event.data)
  if (data.type === 'edit')
    editDoc(data.collection, data.filename)
})
