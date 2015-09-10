// bootstrap CodeMirror and ShareJS

require('./editor.css!')

var CodeMirror = require('codemirror-all')

// ShareJS stuff
var filename
if (location.search === '')
  filename = 'index.html'
else
  filename = location.search.substr(1)

var COLLECTION = 'files'
var proto = 'ws'
var sharejs = require('share/lib/client/index')
var socket = new WebSocket(proto + '://' + location.hostname + ':' + location.port)
var share = new sharejs.Connection(socket)

var doc = share.get(COLLECTION, filename)
doc.subscribe()
doc.whenReady(function() {
  if (!doc.type)
    return doc.create('text')
  if (doc.type && doc.type.name === 'text') {
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
      fileName: filename,
      foldGutter: true,
      fullScreen: true,
      indentWithTabs: true,
      keyMap: 'sublime',
      lineNumbers: true,
      matchBrackets: true,
      share: doc.createContext(),
      showTrailingSpace: true,
      smartIndent: true,
      theme: 'monokai'
    })
  }
})
