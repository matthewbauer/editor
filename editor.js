// editor.js - the JavaScript editor

require('./editor.css!')

var CodeMirror = require('./codemirror-all')
var editor = CodeMirror(document.body, {
  autofocus: true,
  autoCloseBrackets: true,
  autoCloseTags: true,
  continueComments: true,
  coverGutterNextToScrollbar: true,
  cursorScrollMargin: 3,
  electricChars: true,
  extraKeys: {
    Left: 'goSoftLeft',
    Right: 'goSoftRight',
    Backspace: 'delSoftBefore',
    Delete: 'delSoftAfter',
    Enter: 'newlineAndIndentContinueMarkdownList',
    'Ctrl-Space': 'autocomplete'
  },
  foldGutter: true,
  fullScreen: true,
  gutters: [
    'CodeMirror-foldgutter'
  ],
  highlightSelectionMatches: {
    showToken: true
  },
  keyMap: 'sublime',
  lineNumbers: true,
  lineWrapping: true,
  matchBrackets: true,
  placeholder: true,
  selectionPointer: true,
  showMatchesOnScrollbar: true,
  showTrailingSpace: true,
  smartIndent: true,
  styleActiveLine: true,
  styleSelectedText: true,
  theme: 'monokai'
})

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
    editor.setOption('share', doc.createContext())
    editor.setOption('detectIndent', true)
    editor.setOption('mode', CodeMirror.findModeByFileName(filename).mode)
  })
}

if (location.search !== '')
  editDoc('files', location.search.substr(1))
else if (location.hash !== '')
  editDoc('files', location.hash.substr(1))

window.addEventListener('message', function(event) {
  if (!event.data)
    return
  var data = JSON.parse(event.data)
  if (data.type === 'edit')
    editDoc(data.collection, data.filename)
})
