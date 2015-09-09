// Navigate 'soft' with two space indention
// This is based on Bracket's softNav functions

var CodeMirror = require('codemirror')
var _ = require('underscore')

function getColOffset(pos) {
    var line = this.getRange({line: pos.line, ch: 0}, pos)
    var tabSize = null
    var column  = 0

    for (var i = 0; i < line.length; i++) {
      if (line[i] === '\t') {
        if (tabSize === null)
          tabSize = this.getOption('indentUnit')
        if (tabSize > 0)
          column += (tabSize - (column % tabSize))
        } else
          column++
    }
    return column
}

function getCursorPos(expandTabs, which) {
  if (which === 'start')
    which = 'from'
  else if (which === 'end')
    which = 'to'
  var cursor = _copyPos(this.getCursor(which))
  if (expandTabs)
    cursor.ch = getColOffset.call(this, cursor)
  return cursor
}

function getSelection() {
  return _normalizeRange(getCursorPos.call(this, false, 'anchor'), getCursorPos.call(this, false, 'head'))
}

function _copyPos(pos) {
  return new CodeMirror.Pos(pos.line, pos.ch)
}

function _normalizeRange(anchorPos, headPos) {
  if (headPos.line < anchorPos.line || (headPos.line === anchorPos.line && headPos.ch < anchorPos.ch))
    return {start: _copyPos(headPos), end: _copyPos(anchorPos), reversed: true}
  else
    return {start: _copyPos(anchorPos), end: _copyPos(headPos), reversed: false}
}

function getSelections() {
  var primarySel = getSelection.call(this)
  return _.map(this.listSelections(), function (sel) {
    var result = _normalizeRange(sel.anchor, sel.head)
    if (result.start.line === primarySel.start.line && result.start.ch === primarySel.start.ch && result.end.line === primarySel.end.line && result.end.ch === primarySel.end.ch)
      result.primary = true
    else
      result.primary = false
    return result
  })
}

function softNav(direction, functionName) {
  var overallJump = null
  if (!this.getOption('indentWithTabs')) {
    var indentUnit = this.getOption('indentUnit')
    getSelections.call(this).forEach(function(sel) {
      var line = this.getLine(sel.start.line)
      var jump = (indentUnit === 0) ? 1 : sel.start.ch % indentUnit
      if (line.substr(0, sel.start.ch).search(/\S/) !== -1)
          jump = null
      else if (direction === 1) {
          if (indentUnit)
            jump = indentUnit - jump
          if (sel.start.ch + jump > line.length || line.substr(sel.start.ch, jump).search(/\S/) !== -1)
            jump = null
      } else {
        if (jump === 0)
          jump = indentUnit
        if (sel.start.ch - jump < 0)
          jump = null
        else
          jump = -jump
      }
      if (jump !== null && (overallJump === null || overallJump === jump))
        overallJump = jump
      else {
        overallJump = null
        return false
      }
    }.bind(this))
  }
  if (overallJump === null)
    overallJump = direction
  this[functionName](overallJump, 'char')
}

CodeMirror.commands.goSoftLeft = function(cm) {
  softNav.call(cm, -1, 'moveH')
}
CodeMirror.commands.goSoftRight = function(cm) {
  softNav.call(cm, 1, 'moveH')
}
CodeMirror.commands.delSoftBefore = function(cm) {
  softNav.call(cm, -1, 'deleteH')
}
CodeMirror.commands.delSoftAfter = function(cm) {
  softNav.call(cm, 1, 'deleteH')
}

module.exports = softNav
