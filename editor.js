// bootstrap CodeMirror and ShareJS

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
  keyMap: 'sublime',
  lineNumbers: true,
  matchBrackets: true,
  showTrailingSpace: true,
  smartIndent: true,
  theme: 'monokai'
})

var sharejs = require('share/lib/client/index')
var socket = new WebSocket('ws://' + location.hostname + ':' + location.port)
var share = new sharejs.Connection(socket)

var docs = {files: {}}

function loadDoc(collection, filename) {
  if (docs[collection][filename])
    return Promise.resolve(docs[collection][filename])
  var doc = share.get(collection, filename)
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
    docs[collection][filename] = doc
    editor.setOption('share', doc.createContext())
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
