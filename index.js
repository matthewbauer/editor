require('./index.css!')

var tree = document.createElement('iframe')
tree.style.width = '20%'
tree.setAttribute('src', './tree')
document.body.appendChild(tree)

var editor = document.createElement('iframe')
editor.style.width = '75%'
editor.setAttribute('src', './help')
document.body.appendChild(editor)

window.addEventListener('message', function(event) {
  var data = JSON.parse(event.data)
  if (data.type === 'open')
    editor.setAttribute('src', data.href)
})
