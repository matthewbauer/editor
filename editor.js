// editor.js - the JavaScript editor

require('./editor.css!')
var detectIndent = require('detect-indent')
var CodeMirror = require('./codemirror-all')
var sharejs = require('share/lib/client/index')

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
    'Ctrl-Space': 'autocomplete',
    'Ctrl-\\': function() {
      if (window.parent !== window)
        window.parent.postMessage('toggleTree', '*')
    }
  },
  foldGutter: true,
  fullScreen: true,
  gutters: [
    'CodeMirror-linenumbers',
    'CodeMirror-foldgutter',
    'CodeMirror-lint-markers'
  ],
  highlightSelectionMatches: {
    showToken: true
  },
  keyMap: 'sublime',
  lineNumbers: true,
  lineWrapping: false,
  lint: true,
  lintOnChange: true,
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

var socket = new WebSocket('ws://' + location.hostname + ':' + location.port)
var share = new sharejs.Connection(socket)

var doc
function editDoc(collection, filename) {
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
  }).then(function(doc) {
    editor.setOption('share', doc.createContext())
    var indent = detectIndent(editor.getValue())
    editor.setOption('indentUnit', indent.amount)
    editor.setOption('indentWithTabs', indent.type === 'tab')
    var mode = CodeMirror.findModeByFileName(filename)
    if (mode)
      editor.setOption('mode', mode.mode)
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
