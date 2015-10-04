require('./index.css!')

var tree = document.createElement('iframe')
tree.style['min-width'] = '200px'
tree.setAttribute('src', './tree.html' + location.hash)
tree.classList.add('tree')
document.body.appendChild(tree)

var editor = document.createElement('iframe')
editor.style.flex = 1
editor.setAttribute('src', './editor.html' + location.hash)
editor.classList.add('editor')
document.body.appendChild(editor)

window.addEventListener('message', function(event) {
  if (event.data === 'toggleTree') {
    tree.classList.toggle('hidden')
    return
  }
  var data = JSON.parse(event.data)
  if (data.type === 'edit') {
    editor.contentWindow.postMessage(event.data, '*')
    location.hash = '#' + data.filename
  }
})
