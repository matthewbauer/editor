var codemirror = require('codemirror')
var sharejs = require('share/lib/client/index')
var setImmediate = require('setimmediate')

var editor = codemirror(document.body, {
  autofocus: true
})

var proto = 'ws'
var socket = new WebSocket(proto + '://' + location.hostname + ':' + location.port)
var share = new sharejs.Connection(socket)

var doc = share.get('asdf', 'asdf')
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

    if (change.to.line == change.from.line && change.to.ch == change.from.ch) {
    } else {
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

window.addEventListener('beforeunload', function() {
  doc.close()
})
