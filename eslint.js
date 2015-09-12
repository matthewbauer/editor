var CodeMirror = require('codemirror')
var eslint = require('eslint')

function getPos(error, from) {
  var line = error.line - 1
  var ch = from ? error.column - 1 : error.column
  if (error.node && error.node.loc) {
    line = from ? error.node.loc.start.line - 1 : error.node.loc.end.line - 1
    ch = from ? error.node.loc.start.column : error.node.loc.end.column
  }
  return CodeMirror.Pos(line, ch)
}

CodeMirror.registerHelper('lint', 'javascript', function(text) {
  return eslint.verify(text).map(function(error) {
    return {
      message: error.message,
      severity: error.severity === 1 ? 'warning' : 'error',
      from: getPos(error, true),
      to: getPos(error, false)
    }
  })
})
