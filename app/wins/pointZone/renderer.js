const { ipcRenderer } = require('electron');

let previous = null;

ipcRenderer.on('show-info-box', (event, {x, y, r, g, b, scale}) => {
  if(previous) {
    previous.remove();
  }

  const node = document.createElement('div');
  previous = node;

  node.style =
  `
  position: absolute;
  border-radius: 25px;
  left: ${Math.floor(x  / scale) + 10}px;
  top: ${Math.floor(y  / scale) - 40}px;
  width: ${25}px;
  height: ${25}px;
  border: 2px solid black;
  background-color: rgb(${r}, ${g}, ${b});
  `
  document.body.append(node);
})

document.addEventListener('mousedown', (event) => {
  if(event.button !== 0) {
    return ipcRenderer.send('mouse-coords');
  }
  let x = event.clientX;
  let y = event.clientY;
  ipcRenderer.send('mouse-coords', {x, y});
})
