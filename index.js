var tree = document.createElement('iframe')
tree.setAttribute('src', './tree')
document.body.appendChild(tree)

window.addEventListener('message', function(event) {
  var data = JSON.parse(event.data)
  if (data.type === 'open') {
    var editor = document.createElement('iframe')
    editor.setAttribute('src', './editor?' + data.path)
    document.body.appendChild(editor)
  }
})
