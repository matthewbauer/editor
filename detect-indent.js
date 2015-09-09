// detect the indent level based on sindresorhus' detect-indent

var CodeMirror = require('codemirror')
var detectIndent = require('detect-indent')

function setIndent(editor) {
  var indent = detectIndent(editor.getValue())
  editor.setOption('indentUnit', indent.amount)
  editor.setOption('tabSize', indent.amount)
  editor.setOption('indentWithTabs', indent.type === 'tab')
}

CodeMirror.defineInitHook(setIndent)

module.exports = setIndent
