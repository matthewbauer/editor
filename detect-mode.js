// detect the 'mode' to use based on file extension

var CodeMirror = require('codemirror')
var mime = require('mime')

function detectMode(editor, fileName) {
  var fileName = fileName || editor.getOption('fileName')
  if (fileName)
    editor.setOption('mode', mime.lookup(editor.getOption('fileName')))
}

CodeMirror.defineOption('fileName', undefined, detectMode)

module.exports = detectMode
