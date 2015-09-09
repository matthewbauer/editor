var CodeMirror = require('codemirror')
var softNav = require('./soft-nav.js')

require('./editor.css!')
require('codemirror/addon/hint/show-hint.css!')
require('codemirror/addon/lint/lint.css!')
require('codemirror/addon/fold/foldgutter.css!')
require('codemirror/addon/display/fullscreen.css!')
require('codemirror/theme/monokai.css!')

require('codemirror/mode/javascript/javascript')
require('codemirror/mode/apl/apl')
require('codemirror/mode/asciiarmor/asciiarmor')
require('codemirror/mode/clike/clike')
require('codemirror/mode/cmake/cmake')
require('codemirror/mode/clojure/clojure')
require('codemirror/mode/coffeescript/coffeescript')
require('codemirror/mode/css/css')
require('codemirror/mode/d/d')
require('codemirror/mode/commonlisp/commonlisp')
require('codemirror/mode/dockerfile/dockerfile')
require('codemirror/mode/dart/dart')
require('codemirror/mode/diff/diff')
require('codemirror/mode/go/go')
require('codemirror/mode/haskell/haskell')
require('codemirror/mode/http/http')
require('codemirror/mode/idl/idl')
require('codemirror/mode/jade/jade')
require('codemirror/mode/markdown/markdown')
require('codemirror/mode/php/php')
require('codemirror/mode/pegjs/pegjs')
require('codemirror/mode/pascal/pascal')
require('codemirror/mode/properties/properties')
require('codemirror/mode/python/python')
require('codemirror/mode/nginx/nginx')
require('codemirror/mode/r/r')
require('codemirror/mode/ruby/ruby')
require('codemirror/mode/rust/rust')
require('codemirror/mode/sass/sass')
require('codemirror/mode/shell/shell')
require('codemirror/mode/scheme/scheme')
require('codemirror/mode/sql/sql')
require('codemirror/mode/swift/swift')
require('codemirror/mode/stylus/stylus')
require('codemirror/mode/vb/vb')
require('codemirror/mode/vbscript/vbscript')
require('codemirror/mode/yaml/yaml')
require('codemirror/mode/meta')

require('codemirror/keymap/sublime')

require('codemirror/addon/display/fullscreen')
require('codemirror/addon/wrap/hardwrap')
require('codemirror/addon/edit/closebrackets')
require('codemirror/addon/edit/matchbrackets')
require('codemirror/addon/edit/trailingspace')
require('codemirror/addon/selection/active-line')
require('codemirror/addon/fold/foldgutter')
require('codemirror/addon/fold/indent-fold')
require('codemirror/addon/fold/foldcode')
require('codemirror/addon/hint/javascript-hint')
require('codemirror/addon/hint/show-hint')
require('codemirror/addon/lint/lint')
require('codemirror/addon/lint/javascript-lint')

var sharejs = require('share/lib/client/index')
var setImmediate = require('setimmediate')
var mime = require('mime')

var filename
if (location.search === '')
  filename = 'index.html'
else
  filename = location.search.substr(1)

var editor = CodeMirror(document.body, {
  autofocus: true,
  autoCloseBrackets: true,
  autoCloseTags: true,
  coverGutterNextToScrollbar: true,
  cursorScrollMargin: 3,
  electricChars: true,
  extraKeys: {
    Left: function() {
      softNav.call(editor, -1, 'moveH')
    },
    Right: function() {
      softNav.call(editor, 1, 'moveH')
    },
    Backspace: function() {
      softNav.call(editor, -1, 'deleteH')
    },
    Delete: function() {
      softNav.call(editor, 1, 'deleteH')
    }
  },
  foldGutter: true,
  fullScreen: true,
  indentWithTabs: true,
  keyMap: 'sublime',
  lineNumbers: true,
  matchBrackets: true,
  mode: mime.lookup(filename),
  showTrailingSpace: true,
  smartIndent: true,
  theme: 'monokai',
  indentUnit: 2,
  tabSize: 2,
  indentWithTabs: false
})

var COLLECTION = 'files'

var proto = 'ws'
var socket = new WebSocket(proto + '://' + location.hostname + ':' + location.port)
var share = new sharejs.Connection(socket)

var doc = share.get(COLLECTION, filename)
doc.subscribe()

function edit(context) {
  editor.setValue(context.get())

  var suppress = false

  function lock(fn) {
    suppress = true
    fn()
    suppress = false
  }

  context.onInsert = function(pos, text) {
    lock(function() {
      editor.replaceRange(text, editor.posFromIndex(pos))
    })
  }

  context.onRemove = function(pos, length) {
    lock(function() {
      var from = editor.posFromIndex(pos)
      var to = editor.posFromIndex(pos + length)
      editor.replaceRange('', from, to)
    })
  }

  function check() {
    setImmediate(function () {
      var text = context.get()
      if (editor.getValue() != text)
        editor.setValue(text)
    })
  }

  function applyToShareJS(cm, change) {
    var startPos = 0
    var i = 0

    while (i < change.from.line) {
      startPos += editor.lineInfo(i).text.length + 1
      i++
    }

    startPos += change.from.ch

    if (change.to.line != change.from.line || change.to.ch != change.from.ch) {
      var delLen = 0
      for (var rm = 0; rm < change.removed.length; rm++)
        delLen += change.removed[rm].length
      delLen += change.removed.length - 1
      context.remove(startPos, delLen)
    }
    if (change.text)
      context.insert(startPos, change.text.join('\n'))
    if (change.next)
      applyToShareJS(editor, change.next)
  }

  function onLocalChange(editor, change) {
    if (suppress)
      return
    applyToShareJS(editor, change)
  }

  editor.on('change', onLocalChange)
  editor.detachShareJsDoc = function () {
    context.onRemove = null
    context.onInsert = null
    editor.off('change', onLocalChange)
  }
}

doc.whenReady(function() {
  if (!doc.type)
    return doc.create('text')
  if (doc.type && doc.type.name === 'text')
    return edit(doc.createContext())
})
