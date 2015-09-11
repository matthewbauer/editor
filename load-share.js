// add hooks from ShareJS context

var CodeMirror = require('codemirror')
var setImmediate = require('setimmediate')

function hookShare(cm, share) {
  if (!share)
    return

  if (cm.detachShareJsDoc)
    cm.detachShareJsDoc()

  cm.setValue(share.get())

  var suppress = false

  function lock(fn) {
    suppress = true
    fn()
    suppress = false
  }

  share.onInsert = function(pos, text) {
    lock(function() {
      cm.replaceRange(text, cm.posFromIndex(pos))
    })
  }

  share.onRemove = function(pos, length) {
    lock(function() {
      cm.replaceRange('', cm.posFromIndex(pos), cm.posFromIndex(pos + length))
    })
  }

  function check() {
    setImmediate(function () {
      var text = share.get()
      if (cm.getValue() != text)
        cm.setValue(text)
    })
  }

  function applyToShareJS(cm, change) {
    var startPos = 0
    var i = 0

    while (i < change.from.line) {
      startPos += cm.lineInfo(i).text.length + 1
      i++
    }

    startPos += change.from.ch

    if (change.to.line != change.from.line || change.to.ch != change.from.ch) {
      var delLen = 0
      for (var rm = 0; rm < change.removed.length; rm++)
        delLen += change.removed[rm].length
      delLen += change.removed.length - 1
      share.remove(startPos, delLen)
    }
    if (change.text)
      share.insert(startPos, change.text.join('\n'))
    if (change.next)
      applyToShareJS(cm, change.next)
  }

  function onLocalChange(cm, change) {
    if (suppress)
      return
    applyToShareJS(cm, change)
  }

  cm.on('change', onLocalChange)
  cm.detachShareJsDoc = function () {
    share.onRemove = null
    share.onInsert = null
    cm.off('change', onLocalChange)
  }
}

CodeMirror.defineOption('share', undefined, hookShare)

module.exports = hookShare
