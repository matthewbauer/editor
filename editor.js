require('./editor.css!')

var codemirror = require('codemirror')
require('codemirror/mode/javascript/javascript')
require('codemirror/mode/html/html')
require('codemirror/addon/wrap/hardwrap')
require('codemirror/addon/edit/closebrackets')
require('codemirror/addon/edit/matchbrackets')
require('codemirror/addon/edit/trailingspace')
require('codemirror/addon/fold/foldgutter')
require('codemirror/addon/fold/foldgutter.css!')
require('codemirror/addon/fold/indent-fold')
require('codemirror/addon/hint/javascript-hint')
require('codemirror/addon/hint/show-hint')
require('codemirror/addon/hint/show-hint.css!')
require('codemirror/addon/hint/javascript-hint')
require('codemirror/addon/lint/lint')
require('codemirror/addon/lint/lint.css!')
require('codemirror/addon/lint/javascript-lint')

var sharejs = require('share/lib/client/index')
var setImmediate = require('setimmediate')

if (location.search === '')
  location.search = '?index.html'

var editor = codemirror(document.body, {
  autofocus: true,
  lineNumbers: true,
  matchBrackets: true,
  autoCloseBrackets: true,
  showTrailingSpace: true,
  foldGutter: true
})

var COLLECTION = 'files'

var proto = 'ws'
var socket = new WebSocket(proto + '://' + location.hostname + ':' + location.port)
var share = new sharejs.Connection(socket)

var doc = share.get(COLLECTION, location.search.substr(1))
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
