require('./index.css!')

var tree = document.createElement('iframe')
tree.style.width = '10%'
tree.setAttribute('src', './tree' + location.hash)
tree.classList.add('tree')
document.body.appendChild(tree)

var editor = document.createElement('iframe')
editor.style.width = '90%'
editor.setAttribute('src', './editor' + location.hash)
editor.classList.add('editor')
document.body.appendChild(editor)

window.addEventListener('message', function(event) {
  var data = JSON.parse(event.data)
  if (data.type === 'edit') {
    editor.contentWindow.postMessage(event.data, '*')
    location.hash = '#' + data.filename
  }
})
