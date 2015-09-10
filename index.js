require('./index.css!')

var tree = document.createElement('iframe')
tree.style.width = '20%'
tree.setAttribute('src', './tree')
tree.classList.add('tree')
document.body.appendChild(tree)

var editor = document.createElement('iframe')
editor.style.width = '75%'
editor.setAttribute('src', './editor')
editor.classList.add('editor')
document.body.appendChild(editor)

window.addEventListener('message', function(event) {
  var data = JSON.parse(event.data)
  if (data.type === 'edit')
    editor.contentWindow.postMessage(event.data, '*')
})
